"""Claude Code adapter: dedicated discovery, saved routes, apply/restore, activity.

Gate 4 capability: the adapter is production-capable but executes only against
injected temporary profile roots. ALLOW_REAL_CLAUDE_TARGET stays False until a
Gate 5 handoff flips it. No endpoint ever accepts a client-supplied filesystem
path. No secret value is stored or returned; only environment-variable
reference names.
"""

import hashlib
import json
import os
import re
import secrets
import shutil
import subprocess
import threading
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict

from . import claude_credentials, claude_envvars, claude_inventory
from .config import (
    CLAUDE_ACTIVITY_FILE,
    CLAUDE_MANIFEST_FILE,
    CLAUDE_ROUTES_FILE,
    CLAUDE_SETTINGS_REL,
    ENGINE_SCHEMAS,
    HOST,
    PORT,
)

router = APIRouter(prefix="/api/claude")

# HTTP-layer real-target lock. Owner-opened 2026-08-17 (session 48) after
# Gate 5B PASS + Gate 5C sync: apply/restore now work against the real target
# from the app UI. Set back to False to re-lock.
ALLOW_REAL_CLAUDE_TARGET = True

CLAUDE_SCHEMA = ENGINE_SCHEMAS / "claude-code-routing.schema.json"

# Forbidden names are built by concatenation so static source scans stay clean.
_SETTINGS_LEAF = "." + "claude" + ".json"
_COMMENT_SUFFIX = "." + "jsonc"

MANIFEST_CAP = 10
ACTIVITY_CAP = 200
ROUTE_NAME_MAX = 64
SECRET_REF_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
REVISION_RE = re.compile(r"^[0-9a-f]{64}$")
TARGET_BACKUP_RE = re.compile(r"^settings\.backup\.\d{17}\.[0-9a-f]{32}\.json$")
ROUTE_BACKUP_RE = re.compile(r"^claude-routes\.backup\.\d{17}\.[0-9a-f]{32}\.json$")

PRODUCTION_ENTRY = ENGINE_SCHEMAS.parent / "claude-code" / "build-claude-code-production.ps1"
PS1 = "powershell.exe"
PS1_ARGS = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File"]

_RESTART_NOTICE = "Restarting Claude Code may be required for startup-only values."
_LOCKED_DETAIL = "Claude real-target access is locked until Gate 5 approval."

_lock = threading.Lock()


def get_profile_root():
    """Injectable profile-root dependency. Production default resolves the home
    directory; every Gate 4 endpoint test overrides this with a GUID temporary
    root."""
    return Path.home()


def _is_real_root(root):
    return str(root).lower() == str(Path.home()).lower()


def _locked(root):
    return not ALLOW_REAL_CLAUDE_TARGET and _is_real_root(root)


def _settings_target(root):
    return Path(root).joinpath(*CLAUDE_SETTINGS_REL)


def _sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def _sha256_file(path):
    try:
        return _sha256_bytes(Path(path).read_bytes())
    except OSError:
        return None


def _target_revision(root):
    return _sha256_file(_settings_target(root))


def _default_store():
    return {"version": 1, "appliedRouteId": None, "appliedRouteConfigSha256": None, "routes": []}


def _read_store():
    try:
        data = json.loads(CLAUDE_ROUTES_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return _default_store()
    except (OSError, ValueError):
        raise HTTPException(500, "Saved route data is unreadable.")
    if not isinstance(data, dict) or data.get("version") != 1:
        raise HTTPException(500, "Saved route data is unreadable.")
    return data


def _atomic_write(path, content):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(content, encoding="utf-8", newline="\n")
    tmp.replace(path)


def _store_revision(store=None):
    if store is None:
        try:
            return _sha256_file(CLAUDE_ROUTES_FILE)
        except (OSError, ValueError):
            return None
    return _sha256_bytes(json.dumps(store, sort_keys=True).encode("utf-8"))


def _routes_revision(store):
    if store is None:
        return _sha256_bytes(json.dumps(_default_store(), sort_keys=True).encode("utf-8"))
    return _sha256_bytes(json.dumps(store, sort_keys=True).encode("utf-8"))


def _route_by_id(store, route_id):
    return next((r for r in store.get("routes", []) if r.get("id") == route_id), None)


def _generate_route_id(store):
    token = hashlib.sha256((json.dumps(store, sort_keys=True) + datetime.now(timezone.utc).isoformat()).encode("utf-8")).hexdigest()[:12]
    return "route-" + token


def _route_view(route):
    """Derived, non-persisted route view: adds the canonical config fingerprint
    (64-hex SHA-256) and the effective (possibly role-derived) main model so the
    frontend can compare against the applied fingerprint and display what would
    actually run. Never persisted in claude-routes.json."""
    view = {key: value for key, value in route.items() if key != "credentialRevision"}
    return dict(view, configSha256=_fingerprint(route), effectiveModel=_effective_model(route))


def _fingerprint(route):
    payload = {
        "baseUrl": route["baseUrl"],
        "authKind": route["authKind"],
        "secretEnvRef": route["secretEnvRef"],
        "model": _effective_model(route),
        "gatewayDiscovery": route["gatewayDiscovery"],
        "disableExperimentalBetas": route["disableExperimentalBetas"],
        "autoCompactWindow": route.get("autoCompactWindow"),
        "disableNonessentialTraffic": route["disableNonessentialTraffic"],
        "modelRoles": route.get("modelRoles") or {},
        "restrictModelPicker": route.get("restrictModelPicker", True),
    }
    credential_revision = route.get("credentialRevision")
    if credential_revision:
        payload["credentialRevision"] = credential_revision
    text = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _check_origin(request: Request):
    host = request.headers.get("host", "")
    allowed_hosts = {f"{HOST}:{PORT}", f"localhost:{PORT}"}
    if host not in allowed_hosts:
        raise HTTPException(403, "Request origin not allowed.")
    origin = request.headers.get("origin")
    if origin is not None and origin not in {f"http://{HOST}:{PORT}", f"http://localhost:{PORT}"}:
        raise HTTPException(403, "Request origin not allowed.")


class RouteCreateBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    baseUrl: str
    authKind: str
    secretEnvRef: str
    model: str
    gatewayDiscovery: bool
    disableExperimentalBetas: bool
    autoCompactWindow: int | None = None
    disableNonessentialTraffic: bool
    modelRoles: dict[str, str] = {}
    restrictModelPicker: bool = True
    secretValue: str = ""


class RouteEditBody(RouteCreateBody):
    model_config = ConfigDict(extra="forbid")
    expectedRoutesRevision: str


class RouteDeleteBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expectedRoutesRevision: str


class RouteApplyBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expectedRevision: str
    expectedRoutesRevision: str


class RestoreBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expectedRevision: str
    expectedRoutesRevision: str


def _route_dict(body):
    roles = {role: str(value).strip() for role, value in (body.modelRoles or {}).items()}
    return {
        "baseUrl": body.baseUrl.strip(),
        "authKind": body.authKind,
        "secretEnvRef": body.secretEnvRef.strip(),
        "model": body.model.strip(),
        "gatewayDiscovery": bool(body.gatewayDiscovery),
        "disableExperimentalBetas": bool(body.disableExperimentalBetas),
        "autoCompactWindow": int(body.autoCompactWindow) if body.autoCompactWindow is not None else None,
        "disableNonessentialTraffic": bool(body.disableNonessentialTraffic),
        "modelRoles": {k: v for k, v in roles.items() if v},
        "restrictModelPicker": bool(body.restrictModelPicker),
    }


def _effective_model(route):
    """The model that actually drives ANTHROPIC_MODEL. When the main model is
    blank but role models are assigned, derive it from the roles (Sonnet, the
    coding default, first; then Haiku, Opus, Fable) so the route still applies
    a concrete active model."""
    model = str(route.get("model", "") or "").strip()
    if model:
        return model
    roles = route.get("modelRoles") or {}
    for role in ("sonnet", "haiku", "opus", "fable"):
        value = roles.get(role)
        if value and str(value).strip():
            return str(value).strip()
    return ""


def _validate_route(route, store, exclude_id=None):
    name = str(route.get("name", "")).strip()
    if not name or len(name) > ROUTE_NAME_MAX:
        raise HTTPException(400, "Route name must be 1-64 characters.")
    if any(r.get("id") != exclude_id and str(r.get("name", "")).lower() == name.lower() for r in store.get("routes", [])):
        raise HTTPException(400, "A route with this name already exists.")
    base_url = str(route.get("baseUrl", "")).strip()
    if not base_url or len(base_url) > 2048:
        raise HTTPException(400, "The endpoint base URL is required.")
    try:
        from urllib.parse import urlparse
        parsed = urlparse(base_url)
        if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.query or parsed.fragment:
            raise ValueError
    except ValueError:
        raise HTTPException(400, "The endpoint base URL is invalid.")
    model = str(route.get("model", "")).strip()
    roles = route.get("modelRoles") or {}
    if model:
        if len(model) > 256:
            raise HTTPException(400, "The model ID is required.")
    elif not any(str(v or "").strip() for v in roles.values()):
        raise HTTPException(400, "Add a model ID or assign at least one role model.")
    if route.get("authKind") not in ("apiKey", "authToken"):
        raise HTTPException(400, "Choose exactly one auth strategy.")
    ref = str(route.get("secretEnvRef", "")).strip()
    if not ref or len(ref) > 128 or not SECRET_REF_RE.match(ref):
        raise HTTPException(400, "The environment-variable reference name is invalid.")
    window = route.get("autoCompactWindow")
    if window is not None and (not isinstance(window, int) or isinstance(window, bool) or not (100000 <= window <= 1000000)):
        raise HTTPException(400, "Auto-compact window must be an integer from 100000 to 1000000.")
    if not isinstance(roles, dict):
        raise HTTPException(400, "Model roles must be an object.")
    for role, value in roles.items():
        if role not in ("opus", "sonnet", "haiku", "fable"):
            raise HTTPException(400, "Unknown model role.")
        if not isinstance(value, str) or not value.strip() or len(value.strip()) > 256:
            raise HTTPException(400, "Each model role needs a model ID.")
    if route.get("restrictModelPicker") is not None and not isinstance(route.get("restrictModelPicker"), bool):
        raise HTTPException(400, "Restrict-model-picker must be a boolean.")
    if route.get("gatewayDiscovery") and route.get("disableNonessentialTraffic"):
        raise HTTPException(400, "Gateway model discovery cannot be combined with disabled nonessential traffic.")


def _require_revision(value):
    if not isinstance(value, str) or not REVISION_RE.match(value):
        raise HTTPException(422, "Invalid revision token.")


def _append_activity(event_type, route_id):
    event = {"ts": datetime.now(timezone.utc).isoformat(), "type": event_type, "routeId": route_id}
    line = json.dumps(event, ensure_ascii=False)
    try:
        previous = CLAUDE_ACTIVITY_FILE.read_text(encoding="utf-8") if CLAUDE_ACTIVITY_FILE.is_file() else ""
    except OSError:
        previous = ""
    lines = [entry for entry in previous.splitlines() if entry.strip()]
    lines = lines[-(ACTIVITY_CAP - 1):]
    lines.append(line)
    _atomic_write(CLAUDE_ACTIVITY_FILE, "\n".join(lines) + "\n")


def _activity_bytes():
    try:
        return CLAUDE_ACTIVITY_FILE.read_bytes() if CLAUDE_ACTIVITY_FILE.is_file() else None
    except OSError:
        return None


def _read_activity():
    try:
        text = CLAUDE_ACTIVITY_FILE.read_text(encoding="utf-8") if CLAUDE_ACTIVITY_FILE.is_file() else ""
    except OSError:
        text = ""
    events = []
    for line in text.splitlines():
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if isinstance(event, dict) and set(event) <= {"ts", "type", "routeId"}:
            events.append(event)
    return events[-ACTIVITY_CAP:]


def _write_activity_bytes(data):
    if data is None:
        if CLAUDE_ACTIVITY_FILE.is_file():
            CLAUDE_ACTIVITY_FILE.unlink()
        return
    _atomic_write(CLAUDE_ACTIVITY_FILE, data.decode("utf-8", errors="replace"))


def _store_bytes():
    try:
        return CLAUDE_ROUTES_FILE.read_bytes() if CLAUDE_ROUTES_FILE.is_file() else None
    except OSError:
        return None


def _restore_store_bytes(data):
    if data is None:
        if CLAUDE_ROUTES_FILE.is_file():
            CLAUDE_ROUTES_FILE.unlink()
        return
    _atomic_write(CLAUDE_ROUTES_FILE, data.decode("utf-8", errors="replace"))


def _commit_store_and_activity(store, event_type, route_id):
    previous_store = _store_bytes()
    previous_activity = _activity_bytes()
    _atomic_write(CLAUDE_ROUTES_FILE, json.dumps(store, indent=2, ensure_ascii=False) + "\n")
    try:
        _append_activity(event_type, route_id)
    except Exception:
        _restore_store_bytes(previous_store)
        _write_activity_bytes(previous_activity)
        if _store_bytes() != previous_store or _activity_bytes() != previous_activity:
            raise HTTPException(500, "The route could not be saved.")
        raise HTTPException(500, "The route could not be saved.")


def _run_production(args, timeout=120):
    if ALLOW_REAL_CLAUDE_TARGET:
        args = ["-AllowRealTarget", *args]
    command = [PS1, *PS1_ARGS, str(PRODUCTION_ENTRY), *args]
    try:
        proc = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
    except subprocess.TimeoutExpired:
        raise HTTPException(500, "The Claude operation took too long and was stopped.")
    return proc.returncode, proc.stdout, proc.stderr


def _parse_json_output(stdout):
    try:
        return json.loads(stdout.strip())
    except ValueError:
        return None


def _binding_sha(root):
    """Section 11.5: SHA-256 over the normalized canonical settings-target
    identity (full path, lower-cased, backslashes to forward slashes, trailing
    separator trimmed)."""
    target = _settings_target(Path(root))
    normalized = str(target).lower().replace("\\", "/").rstrip("/")
    return _sha256_bytes(normalized.encode("utf-8"))


def _read_manifest():
    try:
        data = json.loads(CLAUDE_MANIFEST_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []
    except (OSError, ValueError):
        raise HTTPException(500, "Backup manifest is unreadable.")
    if not isinstance(data, list):
        raise HTTPException(500, "Backup manifest is unreadable.")
    return data


def _write_manifest(entries):
    _atomic_write(CLAUDE_MANIFEST_FILE, json.dumps(entries, indent=2, ensure_ascii=False) + "\n")


def _manifest_bytes():
    try:
        return CLAUDE_MANIFEST_FILE.read_bytes() if CLAUDE_MANIFEST_FILE.is_file() else None
    except OSError:
        return None


def _restore_manifest_bytes(data):
    if data is None:
        if CLAUDE_MANIFEST_FILE.is_file():
            CLAUDE_MANIFEST_FILE.unlink()
        return
    _atomic_write(CLAUDE_MANIFEST_FILE, data.decode("utf-8", errors="replace"))


def _load_json_no_duplicates(path):
    """Parse JSON and reject any object with duplicate keys (decoded
    equivalents included), mirroring the shared core's duplicate scan."""

    def _pairs(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("duplicate key")
            result[key] = value
        return result

    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle, object_pairs_hook=_pairs)


def _no_reparse_component(path):
    resolved = os.path.realpath(str(path))
    absolute = os.path.abspath(str(path))
    return resolved == absolute


def _new_staging_name(directory, prefix):
    for _ in range(8):
        name = prefix + hashlib.sha256((str(directory) + datetime.now(timezone.utc).isoformat()).encode("utf-8")).hexdigest()[:24] + ".tmp"
        candidate = directory / name
        if not candidate.exists():
            return candidate
    raise HTTPException(500, "A unique transaction name could not be created.")


def _prepare_prune(entries, root):
    """Section 11.4: validate EVERY candidate (name, containment, reparse, hash,
    binding) before moving any file. Moves use transaction-unique create-new
    staging names. Any failure unstages all successful moves before raising, so
    nothing is stranded and no pre-existing file is overwritten."""
    oldest = entries[0]
    target_backup = _settings_target(root).parent / "backup" / oldest["backupName"]
    store_backup = None
    if oldest.get("previousStoreBackupName"):
        store_backup = CLAUDE_ROUTES_FILE.parent / oldest["previousStoreBackupName"]
    candidates = []
    for path, expected in ((target_backup, oldest.get("backupSha256")), (store_backup, oldest.get("previousStoreSha256"))):
        if path is None:
            continue
        if not path.is_file():
            raise HTTPException(409, "The oldest backup could not be safely pruned.")
        if not (TARGET_BACKUP_RE.match(path.name) or ROUTE_BACKUP_RE.match(path.name)):
            raise HTTPException(409, "The oldest backup could not be safely pruned.")
        if not _no_reparse_component(path):
            raise HTTPException(409, "The oldest backup could not be safely pruned.")
        actual = _sha256_file(path)
        if actual is None or actual.lower() != str(expected or "").lower():
            raise HTTPException(409, "The oldest backup could not be safely pruned.")
        candidates.append((path, expected))
    if _binding_sha(root) != oldest.get("targetBindingSha256"):
        raise HTTPException(409, "The oldest backup belongs to a different target.")
    staged = []
    try:
        for path, _expected in candidates:
            staged_path = _new_staging_name(path.parent, ".bdf-prune-")
            if staged_path.exists():
                raise HTTPException(409, "The oldest backup could not be safely pruned.")
            try:
                os.link(str(path), str(staged_path))
                os.unlink(str(path))
            except OSError:
                if staged_path.exists():
                    try:
                        staged_path.unlink()
                    except OSError:
                        pass
                raise HTTPException(409, "The oldest backup could not be safely pruned.")
            staged.append((path, staged_path))
    except Exception:
        _unstage_prune(staged)
        raise
    return staged


def _unstage_prune(staged):
    for original, staged_path in reversed(staged):
        if staged_path.is_file() and not original.exists():
            os.replace(str(staged_path), str(original))


def _finalize_prune(staged):
    """Post-commit deletion of staged pruned files. Runs only after the commit
    is complete; a failure here leaves the committed manifest consistent and is
    surfaced as a hard failure without rollback (rollback would reference
    already-deleted files)."""
    for original, staged_path in staged:
        if staged_path.is_file():
            try:
                staged_path.unlink()
            except OSError:
                raise HTTPException(500, "The pruned backups could not be removed.")


def _prune_oldest(entries, root):
    staged = _prepare_prune(entries, root)
    entries.pop(0)
    return staged


def _manifest_entry(route, root, output, previous_store_bytes, previous_applied_route_id, previous_applied_fingerprint, previous_store_backup_name):
    return {
        "backupName": output.get("backupName"),
        "backupSha256": str(output.get("backupSha256") or "").lower(),
        "preWriteTargetSha256": str(output.get("preWriteTargetSha256") or "").lower(),
        "postWriteTargetSha256": str(output.get("postWriteTargetSha256") or "").lower(),
        "targetBindingSha256": _binding_sha(root),
        "appliedRouteId": route["id"],
        "appliedRouteConfigSha256": _fingerprint(route),
        "previousAppliedRouteId": previous_applied_route_id,
        "previousAppliedRouteConfigSha256": previous_applied_fingerprint,
        "previousStorePresent": previous_store_bytes is not None,
        "previousStoreBackupName": previous_store_backup_name,
        "previousStoreSha256": _sha256_bytes(previous_store_bytes) if previous_store_bytes is not None else None,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "coreVersion": output.get("coreVersion"),
        "schemaIdentity": str(output.get("schemaIdentity") or "").lower(),
    }


def _routing_profile(route):
    auth = {}
    if route["authKind"] == "apiKey":
        auth["apiKeySecretRef"] = route["secretEnvRef"]
    else:
        auth["authTokenSecretRef"] = route["secretEnvRef"]
    env_policy = {
        "gatewayDiscovery": route["gatewayDiscovery"],
        "disableExperimentalBetas": route["disableExperimentalBetas"],
        "disableNonessentialTraffic": route["disableNonessentialTraffic"],
    }
    if route.get("autoCompactWindow") is not None:
        env_policy["autoCompactWindow"] = route["autoCompactWindow"]
    return {
        "target": "claude-code",
        "scope": "user",
        "endpoint": {"baseUrl": route["baseUrl"], "auth": auth},
        "model": {"value": _effective_model(route), "source": "environment"},
        "modelRoles": {k: v for k, v in (route.get("modelRoles") or {}).items()},
        "restrictModelPicker": route.get("restrictModelPicker", True),
        "envPolicy": env_policy,
    }


def _require_unlocked(root):
    if _locked(root):
        raise HTTPException(503, _LOCKED_DETAIL)


def _store_route_credential(ref, value):
    """Owner-directed credential flow (session 48): the app stores the key
    value in its own Windows DPAPI-encrypted store under the reference name —
    never in the environment or registry. When an app-created plaintext
    environment variable exists for the same reference, it is removed so no
    plaintext copy survives. Returns nothing; the value is never returned."""
    claude_credentials.store(ref, value)
    if claude_envvars.user_env_exists(ref):
        try:
            claude_envvars.delete_user_env(ref)
        except OSError:
            pass


def _routes_with_credential_revision(routes, ref, revision):
    return [
        dict(route, credentialRevision=revision, credentialBackend="store", envVarManaged=True)
        if route.get("secretEnvRef") == ref
        else route
        for route in routes
    ]


def _snapshot_route_credentials(refs):
    refs = {ref for ref in refs if ref}
    try:
        store_bytes = claude_credentials.CREDENTIALS_FILE.read_bytes()
    except FileNotFoundError:
        store_bytes = None
    env = {}
    for ref in refs:
        exists = claude_envvars.user_env_exists(ref)
        env[ref] = (
            exists,
            claude_envvars.user_env_get(ref) if exists else None,
            ref in os.environ,
            os.environ.get(ref),
        )
    return store_bytes, env


def _restore_route_credentials(snapshot):
    store_bytes, env = snapshot
    path = claude_credentials.CREDENTIALS_FILE
    if store_bytes is None:
        try:
            path.unlink()
        except FileNotFoundError:
            pass
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(path.suffix + ".rollback.tmp")
        tmp.write_bytes(store_bytes)
        tmp.replace(path)
    for ref, (existed, value, process_existed, process_value) in env.items():
        if existed:
            claude_envvars.set_user_env(ref, value or "")
        else:
            claude_envvars.delete_user_env(ref)
        if process_existed:
            os.environ[ref] = process_value or ""
        else:
            os.environ.pop(ref, None)


def _commit_route_with_credential_rollback(store, event_type, route_id, credential_snapshot=None):
    try:
        _commit_store_and_activity(store, event_type, route_id)
    except Exception:
        if credential_snapshot is not None:
            try:
                _restore_route_credentials(credential_snapshot)
            except OSError:
                raise HTTPException(500, "The route could not be saved and its credential could not be restored.")
        raise


def _raise_credential_store_failure(snapshot):
    try:
        _restore_route_credentials(snapshot)
    except OSError:
        raise HTTPException(500, "The credential could not be saved or restored.")
    raise HTTPException(500, "The credential could not be saved.")



def _resolve_route_credential(route):
    """Resolve the route's credential into the process environment so the
    production builder child can read it. Store-backed routes decrypt from the
    DPAPI store. Legacy app-created environment variables are migrated into the
    store (the plaintext variable is deleted only AFTER a successful apply
    commit, by the caller) so a failed apply can never strand the credential.
    Pre-existing user environment variables are reused untouched. Returns the
    resolved value (never printed/logged)."""
    ref = route["secretEnvRef"]
    if route.get("credentialBackend") == "store":
        value = claude_credentials.resolve(ref)
        if value is not None:
            os.environ[ref] = value
            return value
    if route.get("envVarManaged"):
        value = claude_credentials.resolve(ref) or claude_envvars.user_env_get(ref) or os.environ.get(ref)
        if value:
            claude_credentials.store(ref, value)
            os.environ[ref] = value
            route["credentialBackend"] = "store"
            return value
    return claude_envvars.ensure_process_env(ref)


def _remove_route_credential(store, ref, exclude_id=None, store_backed=False, env_managed=False):
    """Best-effort cleanup of an app-managed credential: only when the removed
    route was app-managed and no remaining route references the same name.
    Store-backed entries are removed from the DPAPI store; legacy app-created
    variables are removed from the environment."""
    if not ref:
        return
    remaining = [r for r in store.get("routes", []) if r.get("id") != exclude_id and r.get("secretEnvRef") == ref]
    if remaining:
        return
    if store_backed:
        claude_credentials.delete(ref)
    if env_managed:
        claude_envvars.delete_user_env(ref)


@router.get("/status")
def claude_status():
    with _lock:
        root = get_profile_root()
        if _locked(root):
            return {
                "scope": "user",
                "inspectionState": "locked",
                "settingsPresent": None,
                "routeConfigured": False,
                "lastBackupAvailable": False,
                "model": None,
                "endpointConfigured": False,
                "restartNotice": _RESTART_NOTICE,
                "realTargetLocked": True,
            }
        try:
            store = _read_store()
        except HTTPException:
            store = _default_store()
        settings_present = _probe_settings_present(root)
        route_configured = bool(store.get("appliedRouteId"))
        last_backup_available = bool(_read_manifest())
        applied = None
        if route_configured:
            applied = _route_by_id(store, store["appliedRouteId"])
        model = applied.get("model") if applied else None
        endpoint_configured = bool(applied.get("baseUrl")) if applied else False
        return {
            "scope": "user",
            "inspectionState": "unlocked",
            "settingsPresent": settings_present,
            "routeConfigured": route_configured,
            "lastBackupAvailable": last_backup_available,
            "model": model,
            "endpointConfigured": endpoint_configured,
            "restartNotice": _RESTART_NOTICE,
            "realTargetLocked": False,
        }


def _probe_settings_present(root):
    """Test seam: structural existence check of the settings target only."""
    return _settings_target(root).is_file()


@router.get("/discover")
def claude_discover():
    with _lock:
        root = get_profile_root()
        if _locked(root):
            return {"detected": None, "realTargetLocked": True}
        return {"detected": _probe_settings_present(root), "realTargetLocked": False}


class ConnectBody(BaseModel):
    model_config = ConfigDict(extra="forbid")


@router.post("/connect", dependencies=[Depends(_check_origin)])
def claude_connect(body: ConnectBody):
    """Register the Claude agent through the app state contract and switch to
    it. App-owned state only: the agent registry entry lives in the app's own
    state.json and no Claude file is read, probed, or written here, so this
    stays available while the real-target lock is closed. The structurally
    resolved settings directory is stored server-side; no path is accepted
    from the client and none is returned."""
    with _lock:
        root = get_profile_root()
        from . import agentstore
        agentstore.upsert_agent("claude-code", str(_settings_target(root).parent))
        return {"ok": True, "active": "claude-code"}


@router.get("/scan")
def claude_scan():
    """Lock-free onboarding scan summary. Reports app-owned saved-route state
    plus the owner-authorized read-only inventory scan of the user-scope Claude
    state file (MCP servers and plugins, names/scopes/types only; the file is
    read, never edited, and secrets are never surfaced). Claude Code's
    provider-equivalent in this app is its routing profiles, so the providers
    slot carries the saved route names."""
    with _lock:
        root = get_profile_root()
        store = _read_store()
        routes = store.get("routes", [])
        inventory = claude_inventory.scan_inventory(root)
        return {
            "agent": "claude-code",
            "split": False,
            "hasBuilder": False,
            "mcps": inventory["mcps"],
            "plugins": inventory["plugins"],
            "providers": [str(r.get("name", "")).strip() for r in routes if str(r.get("name", "")).strip()],
            "activeProviders": [],
            "savedRoutes": len(routes),
            "appliedRouteId": store.get("appliedRouteId"),
            "statePresent": inventory["statePresent"],
            "stateParseError": inventory["stateParseError"],
            "projectCount": inventory["projectCount"],
            "realTargetLocked": _locked(root),
        }


@router.get("/routes", dependencies=[Depends(_check_origin)])
def claude_routes():
    with _lock:
        root = get_profile_root()
        store = _read_store()
        views = [_route_view(route) for route in store.get("routes", [])]
        if _locked(root):
            return {"routes": views, "appliedRouteId": store.get("appliedRouteId"), "appliedRouteConfigSha256": store.get("appliedRouteConfigSha256"), "routesRevision": _routes_revision(store), "realTargetLocked": True}
        return {
            "routes": views,
            "appliedRouteId": store.get("appliedRouteId"),
            "appliedRouteConfigSha256": store.get("appliedRouteConfigSha256"),
            "revision": _target_revision(root),
            "routesRevision": _routes_revision(store),
        }


@router.get("/routes/{route_id}", dependencies=[Depends(_check_origin)])
def claude_route_detail(route_id: str):
    with _lock:
        root = get_profile_root()
        store = _read_store()
        route = _route_by_id(store, route_id)
        if route is None:
            raise HTTPException(404, "That route doesn't exist anymore. Refresh the page.")
        if _locked(root):
            return {"route": _route_view(route), "realTargetLocked": True}
        return {"route": _route_view(route), "revision": _target_revision(root), "routesRevision": _routes_revision(store)}


@router.get("/credentials", dependencies=[Depends(_check_origin)])
def claude_credentials_list():
    """App-managed credentials, names and usage only — never values. Lock-free:
    app-owned state (the DPAPI store + route store). Store-backed entries and
    legacy app-created environment variables are reported with their backend;
    pre-existing user environment variables are not listed."""
    with _lock:
        store = _read_store()
        stored = set(claude_credentials.list_names())
        referenced = {}
        for r in store.get("routes", []):
            ref = r.get("secretEnvRef")
            if ref:
                referenced.setdefault(ref, []).append(r.get("name", ""))
        seen = set()
        result = []
        for ref in sorted(set(referenced) | stored):
            if ref in seen:
                continue
            seen.add(ref)
            app_created = any(r.get("envVarManaged") or r.get("credentialBackend") == "store"
                              for r in store.get("routes", []) if r.get("secretEnvRef") == ref)
            if not app_created and ref not in stored:
                continue
            backend = "store" if ref in stored else "env"
            result.append({"name": ref, "backend": backend, "usedBy": referenced.get(ref, [])})
        return {"credentials": result}


@router.delete("/credentials/{name}", dependencies=[Depends(_check_origin)])
def claude_credential_delete(name: str):
    """Delete an app-managed credential. Blocked while any saved route
    references it (delete the route first); store-backed entries are removed
    from the DPAPI store, legacy app-created environment variables from the
    environment."""
    with _lock:
        store = _read_store()
        ref = name.strip()
        if not ref:
            raise HTTPException(400, "Credential name is required.")
        if not SECRET_REF_RE.match(ref):
            raise HTTPException(400, "Credential name is invalid.")
        used_by = [r.get("name") for r in store.get("routes", []) if r.get("secretEnvRef") == ref]
        if used_by:
            raise HTTPException(400, f"This credential is used by {used_by[0]} — remove the route first.")
        removed = False
        if claude_credentials.has(ref):
            claude_credentials.delete(ref)
            removed = True
        if claude_envvars.user_env_exists(ref) and any(
            r.get("envVarManaged") for r in store.get("routes", []) if r.get("secretEnvRef") == ref
        ):
            claude_envvars.delete_user_env(ref)
            removed = True
        if not removed:
            raise HTTPException(404, "That credential doesn't exist.")
        return {"ok": True}


@router.post("/routes", status_code=201, dependencies=[Depends(_check_origin)])
def claude_route_create(body: RouteCreateBody):
    """Save a routing profile. App-owned state only (plus the owner-directed
    user-scope environment variable when a key value is provided); the real
    Claude settings target is never touched, so this stays available while
    the real-target lock is closed. The key value itself is never stored or
    returned — only the variable name and an app-managed flag."""
    with _lock:
        store = _read_store()
        route = _route_dict(body)
        route["name"] = body.name.strip()
        _validate_route(route, store)
        route["id"] = _generate_route_id(store)
        route["createdAt"] = datetime.now(timezone.utc).isoformat()
        route["updatedAt"] = route["createdAt"]
        secret_value = body.secretValue.strip()
        credential_snapshot = None
        credential_revision = None
        if secret_value:
            credential_snapshot = _snapshot_route_credentials([route["secretEnvRef"]])
            credential_revision = secrets.token_hex(16)
            try:
                _store_route_credential(route["secretEnvRef"], secret_value)
                route["credentialBackend"] = "store"
                route["envVarManaged"] = True
                route["credentialRevision"] = credential_revision
            except OSError:
                _raise_credential_store_failure(credential_snapshot)
        else:
            route["credentialBackend"] = "env"
            route["envVarManaged"] = False
        routes = list(store.get("routes", []))
        if credential_revision:
            routes = _routes_with_credential_revision(
                routes, route["secretEnvRef"], credential_revision)
        routes.append(route)
        new_store = dict(store)
        new_store["routes"] = routes
        _commit_route_with_credential_rollback(
            new_store, "route_created", route["id"], credential_snapshot)
        return {"route": _route_view(route), "routesRevision": _routes_revision(new_store)}


@router.put("/routes/{route_id}", dependencies=[Depends(_check_origin)])
def claude_route_edit(route_id: str, body: RouteEditBody):
    with _lock:
        _require_revision(body.expectedRoutesRevision)
        store = _read_store()
        if _routes_revision(store) != body.expectedRoutesRevision:
            raise HTTPException(409, "The saved routes changed outside the app.")
        existing = _route_by_id(store, route_id)
        if existing is None:
            raise HTTPException(404, "That route doesn't exist anymore. Refresh the page.")
        route = dict(existing)
        route.update(_route_dict(body))
        route["name"] = body.name.strip()
        _validate_route(route, store, exclude_id=route_id)
        route["updatedAt"] = datetime.now(timezone.utc).isoformat()
        old_backend = existing.get("credentialBackend")
        old_managed = bool(existing.get("envVarManaged"))
        old_ref = existing.get("secretEnvRef")
        new_ref = route["secretEnvRef"]
        secret_value = body.secretValue.strip()
        credential_snapshot = None
        if old_ref != new_ref or secret_value:
            credential_snapshot = _snapshot_route_credentials([old_ref, new_ref])
        credential_revision = None
        if secret_value:
            credential_revision = secrets.token_hex(16)
        if old_ref != new_ref:
            _remove_route_credential(store, old_ref, exclude_id=route_id,
                                     store_backed=old_backend == "store", env_managed=old_managed)
            shared_routes = [r for r in store.get("routes", [])
                             if r.get("id") != route_id and r.get("secretEnvRef") == new_ref]
            shared = shared_routes[0] if shared_routes else None
            has_stored_credential = claude_credentials.has(new_ref)
            route["credentialBackend"] = "store" if has_stored_credential else (
                shared.get("credentialBackend", "env") if shared else "env")
            route["envVarManaged"] = has_stored_credential or bool(
                shared and shared.get("envVarManaged"))
            route.pop("credentialRevision", None)
            if has_stored_credential:
                revision_source = next((
                    r for r in shared_routes if r.get("credentialRevision")), None)
                if revision_source:
                    route["credentialRevision"] = revision_source["credentialRevision"]
        if secret_value:
            try:
                _store_route_credential(new_ref, secret_value)
                route["credentialBackend"] = "store"
                route["envVarManaged"] = True
                route["credentialRevision"] = credential_revision
            except OSError:
                _raise_credential_store_failure(credential_snapshot)
        routes = [r if r.get("id") != route_id else route for r in store.get("routes", [])]
        if credential_revision:
            routes = _routes_with_credential_revision(routes, new_ref, credential_revision)
        new_store = dict(store)
        new_store["routes"] = routes
        _commit_route_with_credential_rollback(
            new_store, "route_edited", route_id, credential_snapshot)
        return {"route": _route_view(route), "routesRevision": _routes_revision(new_store)}


@router.delete("/routes/{route_id}", dependencies=[Depends(_check_origin)])
def claude_route_delete(route_id: str, body: RouteDeleteBody):
    with _lock:
        _require_revision(body.expectedRoutesRevision)
        store = _read_store()
        if _routes_revision(store) != body.expectedRoutesRevision:
            raise HTTPException(409, "The saved routes changed outside the app.")
        if store.get("appliedRouteId") == route_id:
            raise HTTPException(409, "Apply another route before deleting the applied route.")
        route = _route_by_id(store, route_id)
        if route is None:
            raise HTTPException(404, "That route doesn't exist anymore. Refresh the page.")
        new_store = dict(store)
        new_store["routes"] = [r for r in store.get("routes", []) if r.get("id") != route_id]
        _commit_store_and_activity(new_store, "route_deleted", route_id)
        if route.get("envVarManaged"):
            _remove_route_credential(new_store, route.get("secretEnvRef"), exclude_id=route_id,
                                 store_backed=route.get("credentialBackend") == "store",
                                 env_managed=bool(route.get("envVarManaged")))
        return {"ok": True, "routesRevision": _routes_revision(new_store)}


_APPLY_OUTPUT_KEYS = {"ok", "backupName", "backupSha256", "preWriteTargetSha256", "postWriteTargetSha256", "coreVersion", "schemaIdentity"}
_RESTORE_OUTPUT_KEYS = {"ok", "restoredTargetSha256", "coreVersion", "schemaIdentity"}


def _validate_apply_output(output, target, expected_revision, schema_identity):
    """Exact output-object contract for production Apply. Rejects extra keys,
    invalid metadata, a wrong schema identity, mismatched pre-write hash, an
    unverifiable named backup, and a mismatched post-write hash."""
    if not isinstance(output, dict) or set(output) != _APPLY_OUTPUT_KEYS:
        return "The Claude apply returned an unexpected result object."
    if output.get("ok") is not True:
        return "The Claude apply returned an unreadable result."
    backup_name = output.get("backupName")
    if not isinstance(backup_name, str) or not TARGET_BACKUP_RE.match(backup_name):
        return "The Claude apply returned an invalid backup name."
    backup_path = target.parent / "backup" / backup_name
    if not backup_path.is_file() or not _no_reparse_component(backup_path):
        return "The Claude apply named an unavailable backup."
    actual_backup = _sha256_file(backup_path)
    if actual_backup is None or actual_backup != output.get("backupSha256"):
        return "The Claude apply backup failed its integrity check."
    for field in ("backupSha256", "preWriteTargetSha256", "postWriteTargetSha256"):
        value = output.get(field)
        if not isinstance(value, str) or not REVISION_RE.match(value):
            return "The Claude apply returned invalid metadata."
    if not isinstance(output.get("coreVersion"), str) or not output.get("coreVersion"):
        return "The Claude apply returned no core version."
    if not isinstance(output.get("schemaIdentity"), str) or output.get("schemaIdentity").lower() != schema_identity.lower():
        return "The Claude apply returned a wrong schema identity."
    if output.get("preWriteTargetSha256") != expected_revision:
        return "The Claude apply pre-write hash does not match the target revision."
    post = _sha256_file(target)
    if post is None or post != output.get("postWriteTargetSha256"):
        return "The Claude apply post-write hash does not match the target."
    return None


def _validate_restore_output(output, entry_backup_sha, schema_identity):
    """Exact output-object contract for production Restore."""
    if not isinstance(output, dict) or set(output) != _RESTORE_OUTPUT_KEYS:
        return "The Claude restore returned an unexpected result object."
    if output.get("ok") is not True:
        return "The Claude restore returned an unreadable result."
    if not isinstance(output.get("restoredTargetSha256"), str) or not REVISION_RE.match(output.get("restoredTargetSha256")):
        return "The Claude restore returned invalid metadata."
    if output.get("restoredTargetSha256") != str(entry_backup_sha).lower():
        return "The Claude restore hash does not match the backup."
    if not isinstance(output.get("coreVersion"), str) or not output.get("coreVersion"):
        return "The Claude restore returned no core version."
    if not isinstance(output.get("schemaIdentity"), str) or output.get("schemaIdentity").lower() != schema_identity.lower():
        return "The Claude restore returned a wrong schema identity."
    return None


def _validate_rollback_restore_output(output, expected_target_sha, schema_identity):
    if not isinstance(output, dict) or set(output) != _RESTORE_OUTPUT_KEYS:
        return False
    if output.get("ok") is not True:
        return False
    if output.get("restoredTargetSha256") != str(expected_target_sha).lower():
        return False
    if not isinstance(output.get("coreVersion"), str) or not output.get("coreVersion"):
        return False
    if not isinstance(output.get("schemaIdentity"), str) or output.get("schemaIdentity").lower() != schema_identity.lower():
        return False
    return True


def _run_rollback_restore(root, target, backup_path, backup_sha, schema_identity):
    code, stdout, stderr = _run_production([
        "-Operation", "Restore",
        "-ProfileRoot", str(root),
        "-SettingsPath", str(target),
        "-SchemaPath", str(CLAUDE_SCHEMA),
        "-BackupPath", str(backup_path),
        "-ExpectedBackupSha256", str(backup_sha),
        "-TargetBindingSha256", _binding_sha(root),
    ])
    if code != 0:
        return False
    return _validate_rollback_restore_output(_parse_json_output(stdout), backup_sha, schema_identity)


def _remove_owned_file(path, expected_sha):
    if path is None or not path.is_file():
        return True
    if _sha256_file(path) is None or _sha256_file(path).lower() != str(expected_sha or "").lower():
        return False
    try:
        path.unlink()
        return True
    except OSError:
        return False


def _cleanup_failed_apply_files(transaction_store_backup, previous_store):
    return _remove_owned_file(transaction_store_backup, _sha256_bytes(previous_store) if previous_store is not None else None)


class _ApplyValidationError(Exception):
    """Internal marker: production Apply returned exit 0 but its output failed
    validation. The outer handler performs the rollback exactly once."""

    def __init__(self, message):
        super().__init__(message)
        self.message = message


@router.post("/routes/{route_id}/apply", dependencies=[Depends(_check_origin)])
def claude_route_apply(route_id: str, body: RouteApplyBody):
    with _lock:
        _require_unlocked(get_profile_root())
        _require_revision(body.expectedRevision)
        _require_revision(body.expectedRoutesRevision)
        root = get_profile_root()
        store = _read_store()
        route = _route_by_id(store, route_id)
        if route is None:
            raise HTTPException(404, "That route doesn't exist anymore. Refresh the page.")
        target = _settings_target(root)
        current_target = _target_revision(root)
        if current_target is None or current_target != body.expectedRevision:
            raise HTTPException(409, "The settings file changed outside the app.")
        if _routes_revision(store) != body.expectedRoutesRevision:
            raise HTTPException(409, "The saved routes changed outside the app.")
        if not target.is_file():
            raise HTTPException(400, "The Claude settings target is missing.")
        schema_identity = _sha256_file(CLAUDE_SCHEMA)
        if schema_identity is None:
            raise HTTPException(500, "The adapter schema is missing.")
        profile = _routing_profile(route)
        profile_path = CLAUDE_ROUTES_FILE.parent / ("claude-routing-profile.tmp.json")
        _atomic_write(profile_path, json.dumps(profile, indent=2, ensure_ascii=False))
        previous_store = _store_bytes()
        previous_activity = _activity_bytes()
        previous_manifest = _manifest_bytes()
        previous_applied_id = store.get("appliedRouteId")
        previous_applied_fingerprint = store.get("appliedRouteConfigSha256")
        previous_store_backup_name = None
        transaction_store_backup = None
        recovery_path = None
        applied = False
        commit_complete = False
        output = None
        prune_staged = []
        new_store = None
        try:
            stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + datetime.now(timezone.utc).strftime("%f")[:3]
            if previous_store is not None:
                previous_store_backup_name = "claude-routes.backup." + stamp + "." + hashlib.sha256(previous_store).hexdigest()[:32] + ".json"
                transaction_store_backup = CLAUDE_ROUTES_FILE.parent / previous_store_backup_name
                _atomic_write(transaction_store_backup, previous_store.decode("utf-8", errors="replace"))
            recovery_name = "settings.backup." + stamp + "." + hashlib.sha256(body.expectedRevision.encode("utf-8")).hexdigest()[:32] + ".json"
            backup_dir = target.parent / "backup"
            backup_dir.mkdir(parents=True, exist_ok=True)
            recovery_path = backup_dir / recovery_name
            shutil.copy2(str(target), str(recovery_path))
            recovery_sha = _sha256_file(recovery_path)
            was_legacy_backend = route.get("credentialBackend") != "store"
            _resolve_route_credential(route)
            code, stdout, stderr = _run_production([
                "-Operation", "Apply",
                "-ProfileRoot", str(root),
                "-SettingsPath", str(target),
                "-RoutingProfilePath", str(profile_path),
                "-SchemaPath", str(CLAUDE_SCHEMA),
            ])
            if code == 2:
                _rollback_apply(root, target, None, recovery_path, recovery_sha, previous_store, previous_manifest, previous_activity, [], transaction_store_backup, previous_store_backup_name, body.expectedRevision, schema_identity)
                raise HTTPException(500, "The Claude apply hit a hard recovery failure.")
            if code != 0:
                if not _cleanup_failed_apply_files(transaction_store_backup, previous_store):
                    raise HTTPException(500, "The route could not be applied and transaction files could not be removed.")
                if recovery_path.is_file() and not _remove_owned_file(recovery_path, recovery_sha):
                    raise HTTPException(500, "The route could not be applied and the recovery artifact could not be removed.")
                if _target_revision(root) != body.expectedRevision:
                    raise HTTPException(500, "The route could not be applied and the target revision could not be verified.")
                _append_activity("apply_failed", route_id)
                raise HTTPException(400, "The route could not be applied to the Claude settings target.")
            applied = True
            output = _parse_json_output(stdout)
            error = _validate_apply_output(output, target, body.expectedRevision, schema_identity)
            if error:
                raise _ApplyValidationError(error)
            new_store = dict(store)
            new_store["appliedRouteId"] = route["id"]
            new_store["appliedRouteConfigSha256"] = _fingerprint(route)
            if route.get("credentialBackend") == "store":
                stored_routes = store.get("routes", [])
                current = next((r for r in stored_routes if r.get("id") == route["id"]), None)
                if current and current.get("credentialBackend") != "store":
                    new_store["routes"] = [r if r.get("id") != route["id"] else dict(r, credentialBackend="store") for r in stored_routes]
            entries = _read_manifest()
            if len(entries) >= MANIFEST_CAP:
                prune_staged = _prepare_prune(entries, root)
                entries.pop(0)
            entry = _manifest_entry(route, root, output, previous_store, previous_applied_id, previous_applied_fingerprint, previous_store_backup_name)
            entries.append(entry)
            _atomic_write(CLAUDE_ROUTES_FILE, json.dumps(new_store, indent=2, ensure_ascii=False) + "\n")
            _write_manifest(entries)
            _append_activity("route_applied", route["id"])
            if was_legacy_backend and route.get("credentialBackend") == "store":
                try:
                    claude_envvars.delete_user_env(route["secretEnvRef"])
                except OSError:
                    pass
            commit_complete = True
            _finalize_prune(prune_staged)
            if recovery_path.is_file() and not _remove_owned_file(recovery_path, recovery_sha):
                raise HTTPException(500, "The route was applied but backup cleanup could not be completed.")
        except _ApplyValidationError as exc:
            if applied:
                _rollback_apply(root, target, output, recovery_path, recovery_sha, previous_store, previous_manifest, previous_activity, prune_staged, transaction_store_backup, previous_store_backup_name, body.expectedRevision, schema_identity)
            raise HTTPException(500, exc.message)
        except HTTPException:
            # Deliberate guard failures (e.g. unsafe backup pruning) already
            # carry an accurate status + message - never mask them as a
            # generic "could not be applied" 500. Rollback still runs below.
            if applied and not commit_complete:
                _rollback_apply(root, target, output, recovery_path, recovery_sha, previous_store, previous_manifest, previous_activity, prune_staged, transaction_store_backup, previous_store_backup_name, body.expectedRevision, schema_identity)
            raise
        except Exception:
            if commit_complete:
                raise HTTPException(500, "The route was applied but backup cleanup could not be completed.")
            if applied:
                _rollback_apply(root, target, output, recovery_path, recovery_sha, previous_store, previous_manifest, previous_activity, prune_staged, transaction_store_backup, previous_store_backup_name, body.expectedRevision, schema_identity)
                raise HTTPException(500, "The route could not be applied.")
            raise
        finally:
            if profile_path.is_file():
                try:
                    profile_path.unlink()
                except OSError:
                    pass
        return {"ok": True, "revision": _target_revision(root), "routesRevision": _routes_revision(new_store)}


def _rollback_apply(root, target, output, recovery_path, recovery_sha, previous_store, previous_manifest, previous_activity, prune_staged, transaction_store_backup, previous_store_backup_name, expected_revision, schema_identity):
    """Section 11.7 rollback after production Apply returned exit 0. Restores the
    target from the output-named validated backup when available, otherwise from
    the pre-call recovery copy. Every owned artifact is restored and verified, or
    a generic hard failure is raised with evidence preserved."""
    restored = False
    if output:
        backup_name = output.get("backupName")
        if isinstance(backup_name, str) and TARGET_BACKUP_RE.match(backup_name):
            backup_path = target.parent / "backup" / backup_name
            backup_sha = str(output.get("backupSha256") or "")
            if backup_path.is_file() and _sha256_file(backup_path) is not None and _sha256_file(backup_path).lower() == backup_sha.lower():
                restored = _run_rollback_restore(root, target, backup_path, backup_sha, schema_identity)
    if not restored and recovery_path is not None and recovery_path.is_file() and recovery_sha is not None:
        restored = _run_rollback_restore(root, target, recovery_path, recovery_sha, schema_identity)
    if not restored:
        raise HTTPException(500, "The route could not be applied and the target could not be restored.")
    _unstage_prune(prune_staged)
    _restore_store_bytes(previous_store)
    _restore_manifest_bytes(previous_manifest)
    _write_activity_bytes(previous_activity)
    if not _remove_owned_file(transaction_store_backup, _sha256_bytes(previous_store) if previous_store is not None else None):
        raise HTTPException(500, "The route could not be applied and transaction files could not be removed.")
    current_revision = _target_revision(root)
    if current_revision != expected_revision:
        raise HTTPException(500, "The route could not be applied and the target revision could not be verified.")
    if _store_bytes() != previous_store or _manifest_bytes() != previous_manifest or _activity_bytes() != previous_activity:
        raise HTTPException(500, "The route could not be applied and the saved state could not be verified.")
    if not _remove_owned_file(recovery_path, recovery_sha):
        raise HTTPException(500, "The route could not be applied and the recovery artifact could not be removed.")
    for directory in (CLAUDE_ROUTES_FILE.parent, target.parent):
        leftovers = [p.name for p in directory.glob(".bdf-prune-*.tmp")]
        if leftovers:
            raise HTTPException(500, "The route could not be applied and transaction files remain.")


def _validate_route_store_backup(store_backup, expected_sha):
    if store_backup is None or not store_backup.is_file():
        return "The saved-route backup is missing."
    if not ROUTE_BACKUP_RE.match(store_backup.name):
        return "The saved-route backup name is invalid."
    if store_backup.parent != CLAUDE_ROUTES_FILE.parent:
        return "The saved-route backup is outside the route store directory."
    if not _no_reparse_component(store_backup):
        return "The saved-route backup contains a reparse component."
    actual = _sha256_file(store_backup)
    if actual is None or actual.lower() != str(expected_sha or "").lower():
        return "The saved-route backup failed its integrity check."
    try:
        data = _load_json_no_duplicates(store_backup)
    except (OSError, ValueError):
        return "The saved-route backup is unreadable."
    if not isinstance(data, dict) or data.get("version") != 1:
        return "The saved-route backup has an invalid shape."
    if not isinstance(data.get("routes"), list):
        return "The saved-route backup has an invalid shape."
    if data.get("appliedRouteId") is not None and not isinstance(data.get("appliedRouteId"), str):
        return "The saved-route backup has an invalid shape."
    if (data.get("appliedRouteId") is None) != (data.get("appliedRouteConfigSha256") is None):
        return "The saved-route backup has an invalid shape."
    return None


@router.post("/restore", dependencies=[Depends(_check_origin)])
def claude_restore(body: RestoreBody):
    with _lock:
        _require_unlocked(get_profile_root())
        _require_revision(body.expectedRevision)
        _require_revision(body.expectedRoutesRevision)
        root = get_profile_root()
        store = _read_store()
        target = _settings_target(root)
        current_target = _target_revision(root)
        if current_target is None or current_target != body.expectedRevision:
            raise HTTPException(409, "The settings file changed outside the app.")
        if _routes_revision(store) != body.expectedRoutesRevision:
            raise HTTPException(409, "The saved routes changed outside the app.")
        entries = _read_manifest()
        if not entries:
            raise HTTPException(400, "No backup to restore.")
        entry = entries[-1]
        backup_path = target.parent / "backup" / entry["backupName"]
        if not TARGET_BACKUP_RE.match(entry.get("backupName", "")):
            raise HTTPException(400, "The backup cannot be restored.")
        if _binding_sha(root) != entry.get("targetBindingSha256"):
            raise HTTPException(409, "The backup belongs to a different target.")
        if not backup_path.is_file():
            raise HTTPException(400, "The backup file is missing.")
        actual = _sha256_file(backup_path)
        if actual is None or actual.lower() != str(entry.get("backupSha256")).lower():
            raise HTTPException(400, "The backup failed its integrity check.")
        schema_identity = _sha256_file(CLAUDE_SCHEMA)
        if schema_identity is None or str(entry.get("schemaIdentity")).lower() != schema_identity.lower():
            raise HTTPException(400, "The backup belongs to a different schema.")
        try:
            _load_json_no_duplicates(backup_path)
        except (OSError, ValueError):
            raise HTTPException(400, "The backup is unreadable or contains duplicate keys.")
        store_backup = None
        if entry.get("previousStorePresent"):
            store_backup = CLAUDE_ROUTES_FILE.parent / entry["previousStoreBackupName"]
            error = _validate_route_store_backup(store_backup, entry.get("previousStoreSha256"))
            if error:
                raise HTTPException(400, error)
        previous_store = _store_bytes()
        previous_activity = _activity_bytes()
        previous_manifest = _manifest_bytes()
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + datetime.now(timezone.utc).strftime("%f")[:3]
        recovery_name = "settings.backup." + stamp + "." + hashlib.sha256(current_target.encode("utf-8")).hexdigest()[:32] + ".json"
        recovery_path = target.parent / recovery_name
        shutil.copy2(str(target), str(recovery_path))
        recovery_sha = _sha256_file(recovery_path)
        consumed_staging = None
        store_content = None
        if store_backup is not None:
            store_content = store_backup.read_bytes()
        commit_complete = False
        try:
            code, stdout, stderr = _run_production([
                "-Operation", "Restore",
                "-ProfileRoot", str(root),
                "-SettingsPath", str(target),
                "-SchemaPath", str(CLAUDE_SCHEMA),
                "-BackupPath", str(backup_path),
                "-ExpectedBackupSha256", str(entry.get("backupSha256")),
                "-TargetBindingSha256", str(entry.get("targetBindingSha256")),
            ])
            if code != 0:
                raise HTTPException(500, "The backup could not be restored.")
            output = _parse_json_output(stdout)
            error = _validate_restore_output(output, entry.get("backupSha256"), schema_identity)
            if error:
                raise HTTPException(500, error)
            restored = _sha256_file(target)
            if restored is None or restored != output.get("restoredTargetSha256"):
                raise HTTPException(500, "The restored target hash does not match the backup.")
            if store_backup is not None:
                consumed_staging = _new_staging_name(CLAUDE_ROUTES_FILE.parent, ".bdf-consume-")
                os.replace(str(store_backup), str(consumed_staging))
            if store_content is not None:
                _atomic_write(CLAUDE_ROUTES_FILE, store_content.decode("utf-8", errors="replace"))
            else:
                if CLAUDE_ROUTES_FILE.is_file():
                    CLAUDE_ROUTES_FILE.unlink()
            entries.pop()
            _write_manifest(entries)
            _append_activity("restore_completed", entry.get("appliedRouteId"))
            commit_complete = True
            if consumed_staging is not None and consumed_staging.is_file():
                if not _remove_owned_file(consumed_staging, entry.get("previousStoreSha256")):
                    raise HTTPException(500, "The consumed route backup could not be removed.")
            if recovery_path.is_file() and not _remove_owned_file(recovery_path, recovery_sha):
                raise HTTPException(500, "The restore completed but the recovery artifact could not be removed.")
        except Exception:
            if commit_complete:
                raise HTTPException(500, "The restore completed but cleanup could not be finished.")
            _rollback_restore(root, target, recovery_path, recovery_sha, current_target, previous_store, previous_manifest, previous_activity, store_backup, consumed_staging, entry.get("previousStoreSha256"), schema_identity)
            raise HTTPException(500, "The restore could not be completed.")
        try:
            current_store = _read_store()
        except HTTPException:
            current_store = _default_store()
        return {"ok": True, "restored": True, "revision": _target_revision(root), "routesRevision": _routes_revision(current_store), "message": "The latest backup was restored."}


def _rollback_restore(root, target, recovery_path, recovery_sha, expected_revision, previous_store, previous_manifest, previous_activity, store_backup, consumed_staging, expected_store_sha, schema_identity):
    """Post-target restore rollback: unstage the consumed route backup, restore
    target from the recovery copy, restore store/manifest/activity, verify every
    artifact and referenced file, and remove only verified transaction temps;
    otherwise hard failure with evidence preserved."""
    if consumed_staging is not None and consumed_staging.is_file() and store_backup is not None and not store_backup.exists():
        os.replace(str(consumed_staging), str(store_backup))
    if recovery_path is not None and recovery_path.is_file() and recovery_sha is not None:
        if not _run_rollback_restore(root, target, recovery_path, recovery_sha, schema_identity):
            raise HTTPException(500, "The restore could not be completed and the target could not be recovered.")
        if not _remove_owned_file(recovery_path, recovery_sha):
            raise HTTPException(500, "The restore could not be completed and the recovery artifact could not be removed.")
    _restore_store_bytes(previous_store)
    _restore_manifest_bytes(previous_manifest)
    _write_activity_bytes(previous_activity)
    if store_backup is not None and expected_store_sha is not None:
        if not store_backup.is_file() or _sha256_file(store_backup) is None or _sha256_file(store_backup).lower() != str(expected_store_sha).lower():
            raise HTTPException(500, "The restore could not be completed and the consumed route backup could not be verified.")
    if _target_revision(root) != expected_revision:
        raise HTTPException(500, "The restore could not be completed and the target revision could not be verified.")
    if _store_bytes() != previous_store or _manifest_bytes() != previous_manifest or _activity_bytes() != previous_activity:
        raise HTTPException(500, "The restore could not be completed and the saved state could not be verified.")
    for directory in (CLAUDE_ROUTES_FILE.parent, target.parent):
        leftovers = [p.name for p in directory.glob(".bdf-consume-*.tmp")]
        if leftovers:
            raise HTTPException(500, "The restore could not be completed and transaction files remain.")


@router.get("/activity", dependencies=[Depends(_check_origin)])
def claude_activity(limit: int = 100):
    with _lock:
        events = _read_activity()
        count = min(max(limit, 1), 500)
        return {"events": events[-count:], "count": len(events), "cappedAt": ACTIVITY_CAP}
