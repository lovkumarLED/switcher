# Claude Code Credential UX — App-Managed Environment Variables (Design + Implementation Record)

Status: **Implemented + live-verified (2026-08-16, session 45), superseded for storage (2026-08-17, session 48)**
Lifecycle: **Live validated** (2026-08-17, corrected Gate 5B PASS + Gate 5C
approved; apply/restore work from the UI, real-target lock open)

> **SUPERSEDED IN PART (2026-08-17, session 48):** route key values are now
> stored in the app's Windows DPAPI-encrypted credential store
> (`app/app/claude_credentials.py`, `app/state/claude-credentials.bin`)
> instead of user-scope environment variables. App-created environment
> variables from the session-45 flow are migrated into the store automatically
> on next apply and deleted; pre-existing user variables are left untouched.
> The route form and reference-only route store are unchanged. See
> `planning/designs/2026-08-17-claude-credential-store-design.md`.
Commits: none
Supersedes in part: `planning/CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md` (the
env-reference developer workaround now gets an in-app key input; the full
credential store remains future work).

## 1. Owner directive (session 45)

- The user must NOT have to create a Windows environment variable by hand.
- The route form takes the **environment variable name AND the API key
  value**. The app creates the environment variable itself.
- When the route is removed, the app removes the environment variable too.
- No "restart the server" gotcha: the app applies the variable to the running
  server's process so the builder inherits it immediately.

## 2. Implementation

### `app/app/claude_envvars.py` (new)

- `user_env_exists(name)` — registry check (HKCU\Environment) whether the
  variable predates this write.
- `set_user_env(name, value)` — persists to the user-scope registry
  environment AND applies it to the current process via
  `SetEnvironmentVariableW` (so child processes — the production builder —
  inherit it with no restart).
- `delete_user_env(name)` — removes from the registry and the current
  process; missing variables are ignored.

### `app/app/claude_adapter.py`

- `RouteCreateBody` / `RouteEditBody` gain optional `secretValue` (never
  stored, never returned; `extra="forbid"` kept).
- `claude_route_create` / `claude_route_edit`: when a key value is provided,
  the app ensures the variable exists (persistent + process scope) and marks
  the route `envVarManaged: true` only when the variable did not exist
  before this write (pre-existing variables are reused, not claimed).
- `claude_route_delete`: removes an app-managed variable only when no other
  route references the same name (best-effort after the store commit).
- Route CRUD is now **lock-free**: it touches only the app-owned route store
  and the user-scope environment — never Claude's files. Apply/restore
  remain gated on the real-target lock; the locked `GET /routes` response
  now includes the app-owned `routesRevision` (only the target-file
  `revision` stays gated) so the frontend's edit/delete revision contract
  works while locked.

### Frontend (`claude-routes.js`)

- Route editor gains an **API key value** field (password + show/hide
  toggle) with the note "Switcher saves it as the environment variable above
  - no manual setup, no restart. Leave empty to keep an existing variable."
- The key value is sent as `secretValue` and never echoed back into the edit
  form (the input is always empty).
- Route details show a "managed by Switcher" chip when the app owns the
  variable.

## 3. Verification

- Focused Python 125/125 (8 new env-var lifecycle tests with the env-var
  functions patched — no real registry/process access in fixtures); full
  Python 209 (2 accepted preference baselines only); focused frontend 44/44;
  full frontend 131 (1 accepted onboarding-copy baseline only); Gate 2
  65/65; Gate 3 OVERALL PASS; OpenCode 35/35; Kilo 32/32; diff check 0;
  secrets scan 0.
- Live on 127.0.0.1:9090 (locks closed):
  1. API: created a route with a key → `201`, `envVarManaged: true`,
     variable present in HKCU\Environment, secret absent from every
     response.
  2. Process-scope inheritance proven: `SetEnvironmentVariableW` followed by
     a child process shows the value (the builder is a child of the server).
  3. Full UI loop: Add route (key field) → saved + variable created →
     details shows "managed by Switcher" → Delete → variable removed from
     the registry, route gone, existing omniroute untouched.
  4. Console 0 errors.

## 4. Notes

- Keys live in the user-scope registry environment — user-owned state,
  consistent with how OpenCode/Kilo provider files already store keys. The
  app's No-Secrets rule (system artifacts never contain literal keys) is
  unchanged: the route store holds only the variable NAME, never the value.
- A pre-existing variable referenced by a route is reused and NOT deleted on
  route removal (it predates the app). Only app-created variables are
  cleaned up.
- Apply is still blocked with "locked until Gate 5 approval"; route
  management is fully usable now.
