# Claude Credential Store — DPAPI-Backed (Design)

Date: 2026-08-17 (session 48)
Status: **Approved by owner 2026-08-17** ("ok then lets go")
Supersedes: the credential-handling section of the historical backlog note
`planning/CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md` (that file keeps its body as
history; only its Status header points here).
Precedent: Claude adapter is **Live validated**; the real-target lock is open;
model-roles multi-model routes shipped earlier this session.

## 1. Problem

Route credentials are today stored as user-scope Windows **environment
variables** (session 45 flow): plaintext in the registry, visible to any
process running as the user, and only reachable through route create/delete —
there is no visible credential manager. The backlog note
(`CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md`) required an explicitly designed
local credential-storage mechanism, a stable reference-only route store,
explicit migration, reference counting, orphan cleanup, and full redaction.

## 2. Backend decision

**Windows DPAPI** (crypt32 `CryptProtectData`/`CryptUnprotectData`, user-scope,
via `ctypes` — no new dependency) storing per-value ciphertext in an
app-owned file `app/state/claude-credentials.bin`:

```
{ "version": 1, "entries": { "<ref>": "<base64(dpapi-ciphertext)>" } }
```

- The file is under `app/state/`, which is git-ignored (never committed).
- Each value is independently encrypted with the current Windows user's key;
  only that user login can decrypt. Works for every Windows user of the app.
- Backup-first + atomic replace (same policy as every other app state file).
- Plaintext exists only transiently in process memory; it is never written to
  the registry, environment, route store, logs, activity, or reports.

## 3. Module: `app/app/claude_credentials.py`

- `store(name, value)` — encrypt `value` (UTF-8 bytes) with DPAPI, update the
  entries map, atomic-write. Raises on DPAPI failure; never returns the value.
- `resolve(name)` — decrypt and return the plaintext, or `None` when absent /
  corrupted / undecryptable (corruption is treated as missing, not an error
  page; the entry can be re-entered).
- `delete(name)` — remove the entry, atomic-write.
- `has(name)` / `list_names()` — existence and enumeration (names only).
- `_read`/`_write` handle missing file (empty map), malformed JSON (treated as
  empty), and enforce the `version` marker.
- All public functions are patchable in tests (no real DPAPI in fixtures).

## 4. Adapter changes (`app/app/claude_adapter.py`)

- `RouteCreateBody`/`RouteEditBody` keep `secretValue`. When provided, the app
  now calls `claude_credentials.store(secretEnvRef, value)` instead of
  `set_user_env`. The route store keeps only the reference name and gains a
  `credentialBackend` marker (`"store"` for app-managed DPAPI entries; legacy
  routes without the marker are treated as env-var-backed).
- Route create/edit that previously created an app-managed **env var** for the
  same ref now deletes that env var (migration away from plaintext).
- **Apply**: before the builder runs, resolve the credential:
  1. If the route is store-backed → `resolve(ref)` from DPAPI → set into
     `os.environ` for the builder child (this replaces the registry-reload path
     for store-backed routes; `ensure_process_env` stays as a fallback).
  2. Legacy env-var-backed route with `envVarManaged=True` (an app-created
     variable not yet migrated) → **migrate**: read the env var, `store()` it
     under the ref, delete the env var, mark the route store-backed, then
     resolve from the store.
  3. Pre-existing user env var (`envVarManaged=False`) → resolve from the user
     registry into the process (advanced option preserved).
- **Delete**: remove the DPAPI entry only when no other route references the
  same ref (reference counting; same rule as today's env-var cleanup).
- **New endpoint** `GET /api/claude/credentials` (lock-free, app-owned state):
  returns `[{ name, backend, usedBy: [route names] }]` — names and usage only,
  never values.
- Redaction: the secret value never appears in any response, activity, report,
  manifest, or subprocess stdout/stderr (existing redaction tests extended).

## 5. Frontend (`claude-routes.js`)

The Claude Routes page gains a **Credentials** card (sidebar, under the
existing "Claude Code" block):

- Lists app-managed credentials: name (mono), a store-vs-env badge, and which
  saved routes use it.
- A delete button per credential that is **disabled with a message** while any
  route references it ("This credential is used by <route> — remove the route
  first"), and enabled for unreferenced orphans (confirm → delete).
- The route form is unchanged (paste key → secretValue).

## 6. Migration summary (owner-approved)

- App-managed env-var credentials (e.g. `ORCA_API_KEY`, `TOKEN_API_KEY`):
  moved into the DPAPI store automatically on next apply, then the env var is
  deleted.
- Pre-existing user env vars (e.g. `OMNIROUTE_API_KEY`, `envVarManaged=False`):
  left untouched — still used as env-var references (advanced option).

## 7. Testing

- `claude_credentials` unit tests (DPAPI functions patched): store/resolve
  round-trip, replace, delete, missing, corrupted file, malformed JSON,
  version guard, atomic write, name enumeration, redaction.
- Adapter tests: create-with-key → stored (not env); apply resolves from store;
  migration of app-managed env-var credentials; delete ref-counting; shared
  credentials survive single-route deletion; `GET /credentials` shape; redaction
  across every path (extend existing redaction matrix).
- Frontend contract tests: Credentials card markup, badge, blocked-delete state,
  orphan delete affordance.
- Live end-to-end through the open lock: create a route with a key → verify the
  key is NOT in the environment/registry and the store file holds ciphertext →
  apply works → delete removes the entry.

## 8. Docs

Adapter README credential section, `CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md`
Status header (superseded → points here), CHANGELOG + release registry,
session log + journey. Historical content preserved.

## 9. Out of scope

- Changing OpenCode/Kilo provider credential storage (those keys live in the
  user's own provider files by design — the No-Secrets rule).
- A password-protected (non-user-scope) store — DPAPI user scope is the
  platform-appropriate choice here.
- Cross-user credential sharing / export.