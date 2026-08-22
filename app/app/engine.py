"""Runs the bundled BDF engine (scaffold-agent.ps1) and the generated builders."""

import shutil
import subprocess
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from . import agentstore
from .config import ENGINE_SCHEMAS, SCAFFOLD_SCRIPT
from .storage import get_state, set_state

router = APIRouter(prefix="/api")

PS1 = "powershell.exe"
PS1_ARGS = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File"]


def _seed_schemas(directory):
    """Give a freshly scaffolded agent the bundled JSON schemas so its
    generated builder can run schema validation out of the box."""
    if not ENGINE_SCHEMAS.is_dir():
        return
    target = Path(directory) / "schemas"
    if target.is_dir():
        return
    try:
        shutil.copytree(ENGINE_SCHEMAS, target)
    except OSError:
        pass


class ScaffoldBody(BaseModel):
    agent: str
    dir: str


class BuildBody(BaseModel):
    profile: str | None = None


def _run_ps1(args, timeout):
    command = [PS1, *PS1_ARGS, *args]
    try:
        proc = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            cwd=SCAFFOLD_SCRIPT.parent,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(500, "The command took too long and was stopped. Try again.")
    output = ((proc.stdout or "") + (proc.stderr or "")).strip()
    return proc.returncode, output


@router.post("/scaffold")
def scaffold(body: ScaffoldBody):
    directory = Path(body.dir)
    if not directory.is_dir():
        raise HTTPException(400, "That folder doesn't exist on this computer.")
    agentstore._require_valid_agent_name(body.agent)
    if not SCAFFOLD_SCRIPT.is_file():
        raise HTTPException(
            500,
            "The engine script (scaffold-agent.ps1) was not found. Put this app next to it or set the BDF_SCRIPTS_DIR environment variable.",
        )
    code, output = _run_ps1(
        [
            str(SCAFFOLD_SCRIPT),
            "-Agent",
            body.agent,
            "-ConfigRoot",
            str(directory),
            "-NonInteractive",
            "-Bootstrap",
            "-AutoBuild",
        ],
        300,
    )
    agentstore.upsert_agent(body.agent, str(directory))
    if code == 0:
        _seed_schemas(directory)
    scripts_dir = directory / "scripts"
    generated = [
        name
        for name in (f"build-{body.agent}.ps1", f"test-{body.agent}.ps1", f"scaffold-{body.agent}.ps1")
        if (scripts_dir / name).is_file()
    ]
    profiles_dir = directory / "profiles"
    profiles = [p.name for p in profiles_dir.glob("*") if p.is_dir()] if profiles_dir.is_dir() else []
    return {
        "ok": code == 0,
        "generated": generated,
        "profiles": profiles,
        "message": output or ("Done." if code == 0 else "Something went wrong. See the output above."),
    }


@router.post("/build")
def build(body: BuildBody):
    agent, directory = agentstore.current_agent()
    if not agent or not directory:
        raise HTTPException(400, "No agent is set up yet. Run the setup wizard first.")
    profile = body.profile or agentstore.active_profile(directory)
    if any(part in profile for part in ("/", "\\", "..")):
        raise HTTPException(400, "Invalid profile name.")
    script = agentstore.find_builder_script(Path(directory), agent)
    if not script:
        raise HTTPException(
            400,
            f"No builder script for '{agent}' was found. Run 'Generate my builder' first.",
        )
    code, output = _run_ps1(
        [str(script), "-Profile", profile, "-NonInteractive", "-ConfigRoot", str(directory)],
        300,
    )
    return {"ok": code == 0, "output": output}


class VerifyBody(BaseModel):
    pass


@router.post("/setup/verify")
def verify_setup(body: VerifyBody):
    """Post-scaffold health check: every provider, plus the generated main JSON.

    Runs after the auto-build so the user knows the workspace is actually
    usable before they start. Never writes anything - read-only checks.
    """
    from . import testing

    agent, directory = agentstore.current_agent()
    if not agent or not directory:
        raise HTTPException(400, "No agent is set up yet. Run the setup wizard first.")

    # The build merges ACTIVE providers only, so verification must judge the
    # same set - an intentionally inactive provider file never blocks setup.
    active_ids = set(agentstore.get_active_providers(directory, existing_only=True))
    providers = [p for p in agentstore.list_providers(directory) if p["id"] in active_ids]
    results = []
    for provider in providers:
        try:
            result = testing.test(
                testing.TestBody(id=provider["id"], baseUrl="", apiKey="")
            )
            results.append({
                "id": provider["id"],
                "ok": result["ok"],
                "message": result["message"],
                "latencyMs": result.get("latencyMs"),
            })
        except HTTPException as exc:
            results.append({"id": provider["id"], "ok": False, "message": str(exc.detail), "latencyMs": None})

    # generated main JSON: does it exist and carry the providers?
    main_files = list(directory.glob("*.json"))
    main_files = [f for f in main_files if f.name not in ("package.json", "package-lock.json")]
    main_json_ok = False
    main_json_path = ""
    if main_files:
        import json as _json
        try:
            data = _json.loads(main_files[0].read_text(encoding="utf-8-sig"))
            found = set((data.get("provider") or {}).keys())
            expected = {p["id"] for p in providers}
            main_json_ok = bool(expected) and expected.issubset(found)
            main_json_path = main_files[0].name
        except (ValueError, OSError):
            main_json_ok = False

    # MCP + plugins live in the profile files (the source of truth).
    # The builder merges them into the generated main config from there.
    import json as _json
    mcp_ok = False
    plugins_ok = False
    profile = agentstore.active_profile(directory)
    mcp_path = directory / "profiles" / profile / "mcp.json"
    plugins_path = directory / "profiles" / profile / "plugins.json"
    try:
        data = _json.loads(mcp_path.read_text(encoding="utf-8-sig"))
        mcp_ok = isinstance(data.get("mcp"), dict) and bool(data.get("mcp"))
    except (ValueError, OSError):
        mcp_ok = False
    try:
        data = _json.loads(plugins_path.read_text(encoding="utf-8-sig"))
        plugins_ok = bool(data.get("plugin") or (data.get("plugins")))
    except (ValueError, OSError):
        plugins_ok = False

    all_ok = bool(results) and all(r["ok"] for r in results) and main_json_ok and mcp_ok and plugins_ok
    return {
        "ok": all_ok,
        "agent": agent,
        "providers": results,
        "mainJson": {"ok": main_json_ok, "path": main_json_path},
        "mcp": {"ok": mcp_ok},
        "plugins": {"ok": plugins_ok},
    }


@router.post("/setup/revert")
def revert_setup(body: VerifyBody):
    """Restore the agent config from the newest backup taken before the build.

    Called automatically when verification fails - the user never has to dig
    through backup/ and copy files manually.
    """
    import shutil

    agent, directory = agentstore.current_agent()
    if not agent or not directory:
        raise HTTPException(400, "No agent is set up yet.")

    backup_dir = directory / "backup"
    if not backup_dir.is_dir():
        return {"ok": False, "message": "No backup found - nothing to restore."}

    # Newest timestamped backup of the agent's main config. Backups are named
    # after the main-config stem (opencode_*.json / kilo_*.json), not the
    # registered agent name, so match on any stem that has a live main file.
    main_candidates = sorted(
        (
            f
            for f in backup_dir.glob("*_*.json")
            if f.stem.count("_") >= 1 and (directory / f"{f.stem.split('_')[0]}.json").is_file()
        ),
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )
    if not main_candidates:
        return {"ok": False, "message": "No main-config backup found."}

    source = main_candidates[0]
    # kilo_2026-08-12_11-29-30.json -> kilo.json
    target = directory / f"{source.stem.split('_')[0]}.json"
    try:
        shutil.copy2(source, target)
        return {"ok": True, "message": f"Restored {target.name} from backup ({source.name})."}
    except OSError as exc:
        return {"ok": False, "message": f"Revert failed: {exc}"}
