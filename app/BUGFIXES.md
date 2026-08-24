# Bug Fix Log

Every bug or issue fixed in this app gets an entry here — written in the SAME
change that fixes it. If you fixed a bug, you log it here. No exceptions.

## Entry template

Copy this block into Entries when a fix lands:

```markdown
### YYYY-MM-DD — Short summary of the bug

- **Symptom:** What the user saw.
- **Root cause:** Why it happened (the actual reason, not the symptom).
- **Fix:** What was changed and where (file:line or module).
- **Verified:** How the fix was proven to work.
```

## Entries

### 2026-08-24 - Claude Code Apply left every route card pending

- **Symptom:** After editing a Claude Code route and clicking "Apply route", the card stayed on "Changes not applied" instead of changing to the applied state. The same failure affected every Claude Code route card; KiloCode and OpenCode use different apply engines.
- **Root cause:** The shared production routing core called PowerShell's Get-FileHash during Apply and Restore. The app launches that script with -NoProfile, where the cmdlet was unavailable, so Apply exited before the adapter could commit the route as applied.
- **Fix:** app/engine/claude-code/claude-routing-core.psm1 now computes SHA-256 values through .NET's System.Security.Cryptography.SHA256 directly, removing the module-dependent Get-FileHash calls from the shared Apply/Restore path.
- **Verified:** The real production Apply regression now passes; the complete Claude Apply/Restore class passes 11/11, including sequential application of multiple routes, and the generated target, manifest, and applied-route state are validated.

### 2026-08-24 - Editing a Claude route API key did not require reapplying the route

- **Symptom:** Editing an existing route's API key saved the new value, but the card still showed "Route applied" instead of "Apply route". Claude Code therefore kept the previously generated environment until another route setting changed.
- **Root cause:** `configSha256` fingerprinted the credential reference name but not a revision of the encrypted credential value, so replacing a key produced the same applied fingerprint. Existing applied routes also had fingerprints in the previous format.
- **Fix:** `app/app/claude_credentials.py` now exposes a non-secret SHA-256 revision of the encrypted credential ciphertext. `app/app/claude_adapter.py` includes that revision in route fingerprints and migrates legacy applied fingerprints before route reads or edits; the secret value never enters the fingerprint or API response.
- **Verified:** Temporary-profile regression coverage confirms `first` → `second` API-key edits change the route fingerprint and legacy applied state migrates cleanly; focused backend tests pass 15/15, frontend contracts pass 197/197, and the live route API reports the current applied route consistently after server restart.

### 2026-08-23 - install.bat put the Switcher shortcut on an invisible desktop (OneDrive redirection)

- **Symptom:** After running `install.bat`, no "Switcher" icon appeared on the desktop even though the script said "Shortcut created". (Also: a copy of `start.bat` placed on the desktop did nothing when double-clicked.)
- **Root cause:** `install.bat` hardcoded `SHORTCUT_DIR=%USERPROFILE%\Desktop`. When Windows redirects the desktop (default for Microsoft-account users, e.g. to `C:\Users\<you>\OneDrive\Desktop`), that folder still exists but is never shown — the shortcut was created somewhere invisible. The copied-`start.bat` symptom is the same relative-path trap: both scripts use `%~dp0`-relative paths (`env\`, `server.py`, `requirements.txt`), so a copy outside the `app` folder can never find them.
- **Fix:** `app/install.bat` now resolves the real desktop with `[Environment]::GetFolderPath('Desktop')` (PowerShell), falls back to `%USERPROFILE%\Desktop` if empty, and still honors the optional `%~1` override directory.
- **Verified:** On this OneDrive-redirected machine: bare `install.bat` now creates `Switcher.lnk` on the real desktop (`OneDrive\Desktop`) and nothing in the legacy folder; an override-dir run creates a shortcut whose target/working-directory point at `app\start.bat` (verified via COM); env + requirements-hash steps skip correctly on re-runs.

### 2026-08-23 - OpenCode onboarding dead-ended at the review step for workspaces already running LiteLLM or CLI Proxy

- **Symptom:** Clicking "Use this workspace" during onboarding kept the wizard stuck on "Review your workspace" and showed the raw error `Cannot read properties of undefined (reading 'baseUrl')` instead of the provider step. It only happened on machines whose agent config already had a provider named like a preset (`litellm`, `cli-proxy*`).
- **Root cause:** `onboarding.js` filtered preset choices against existing provider IDs, then fell back with `selectedProvider = presets[0].id`. `presets[0]` is a `[key, value]` entry from `Object.entries(...)`, so `.id` is always `undefined`; `providerPresets[undefined]` then crashed `providerScreenMarkup()` at `preset.baseUrl`.
- **Fix:** `assets/js/pages/onboarding.js` fallback now reads the entry key: `presets[0][0]`.
- **Verified:** Live click-through of the full OpenCode onboarding (review -> provider step -> skip -> dashboard) with no alert; provider choices correctly reduce to `custom` when both presets are filtered; new source-contract regression test in `tests/frontend_review.test.mjs` ("onboarding preset fallback reads the entry key, not the entries array"); frontend suite 25/25 in that file.

### 2026-08-22 - Backup-ring guard failures were masked as an opaque "could not be applied" 500

- **Symptom:** Live route apply failed with a generic 500 ("The route could not be applied.") even though the real problem was the backup ring being full with a stale manifest record whose backup file no longer existed on disk — the operator could not know the actual cause or the fix.
- **Root cause:** `_prepare_prune` raises a deliberate HTTPException(409) when the oldest backup fails safety validation, but the apply handler's broad `except Exception` caught it, rolled back, and re-raised as an opaque 500. (The trigger itself: two Aug-17 manifest entries referenced backups deleted out-of-band during the earlier backup-folder migration.)
- **Fix:** `claude_adapter.py` adds a dedicated `except HTTPException` branch that still rolls back but re-raises the true status/message; the stale manifest records were repaired (10 → 8, backed up first) and a regression test simulates the exact missing-file drift.
- **Verified:** `test_prune_missing_oldest_backup_file_reports_prune_failure_and_rolls_back` + updated `test_prune_second_backup_validation_failure_restores_first` (now asserts 409 + untouched target); then a real authorized Gate cycle on this machine: apply → surgical env patch verified → /status honest → restore → settings.json byte-equal to pre-gate snapshot (`6d279fa8…`); full Python 270/270.

### 2026-08-22 - Custom-named kilo agents got the wrong builder (LSP and artifact silently wrong)

- **Symptom:** A KiloCode workspace registered under a custom name (e.g. "kilo-test") built a config where the LSP section collapsed to `"lsp": true` regardless of the stored value, and each build wrote/updated `opencode.json` instead of `kilo.json`.
- **Root cause:** `scaffold-agent.ps1` chose the builder source by comparing the registered agent name to the literal string `kilo`. Any other name fell through to the OpenCode V2.7 template, whose build writes `opencode.json` by default and merges LSP differently.
- **Fix:** `app/engine/scaffold-agent.ps1` now infers kilo-type from the presence of `kilo.json` in the config root (`$IsKiloType`), so custom names get the K1 adapter. Deployed copy at `~/.config/opencode/scripts/scaffold-agent.ps1` re-synced.
- **Verified:** New integration tests `tests/test_scaffold_builder.py` (custom kilo name → K1 with `kilo.json`, custom opencode name → V2.7); live app cycle on a temp kilo fixture: on(object)→object, off→`"lsp": false`, re-on(true)→`true`; full Python 269/269; opencode 40/40 + kilo 37/37 harnesses.

### 2026-08-22 - Onboarding approval could 500-crash and revert could never restore for custom agent names

- **Symptom:** Two related first-run failures: (1) a hand-edited `state.json` entry using a wrong key made `/api/status` (and much of the app) return 500; (2) after a failed verify, auto-revert always answered "No main-config backup found" for custom-named agents, leaving the built config applied while the UI claimed the config was "left in place".
- **Root cause:** (1) `agentstore.get_agents()` returned state entries unchecked and `current_agent()` indexed `entry["dir"]` directly. (2) `revert_setup()` globbed backups as `{registered-name}_*.json`, but backups are named after the main-config stem (`opencode_*` / `kilo_*`).
- **Fix:** (1) `get_agents()` now filters to well-formed entries (dict with non-empty `name`+`dir`). (2) `revert_setup()` matches any timestamped backup whose derived stem has a live main file.
- **Verified:** Regression tests in `tests/test_agentstore.py::test_malformed_agent_entries_do_not_crash_status` and `tests/test_setup_revert.py` (4 cases incl. red/green reproduction); end-to-end onboarding approval now completes on temp fixtures.

### 2026-08-22 - Setup verification failed forever when an inactive provider existed

- **Symptom:** Workspaces with an intentionally deactivated provider could never pass post-setup verification ("Some checks failed") even though everything buildable was healthy.
- **Root cause:** `/api/setup/verify` compared every file in `providers/` against the generated main JSON, but builders merge only ACTIVE providers — an intentionally dormant provider always looked like a missing one.
- **Fix:** `app/engine.py::verify_setup` now tests and verifies only providers in the active set (mirroring the build contract).
- **Verified:** `tests/test_setup_verify.py` (inactive provider does not block verification; missing-agent 400); live verify ok:true on both temp fixtures.

### 2026-08-22 - Provider usage legend overlapped percentages on narrow overview columns

- **Symptom:** In the redesigned compact overview, the donut legend painted "100%" on top of the provider name (e.g. "orca[100%]uter").
- **Root cause:** `.usage-row__name` was an inline-flex inside a `minmax(0,1fr)` track and could shrink below its text width without truncating, letting the next cell overlap it.
- **Fix:** `.usage-row` count column is content-sized (`auto`) and `.usage-row__name` is a block with ellipsis truncation.
- **Verified:** DOM measurement shows no box overlap and active ellipsis at 1512px viewport; overview visual contracts 40/40.

### 2026-08-22 - Escape key leaked a crash handler from the manual-folder dialog

- **Symptom:** After closing the "Choose a folder manually" dialog with Cancel or Use-this-folder, any later Escape press anywhere threw `TypeError: Cannot set properties of null` in the console.
- **Root cause:** The dialog's document-level Escape listener removed itself only on the Escape path, so it survived non-Escape closes and later ran against a stale startup view.
- **Fix:** `onboarding.js` keeps a single tracked handler; both open and close paths add/remove it symmetrically and guard the null node.
- **Verified:** Live: cancel → reopen → confirm → About dialog → real Escape closes cleanly with zero console errors; frontend contracts green.

### 2026-08-22 - API and proxy accepted cross-site and spoofed-Host requests (security hardening)

- **Symptom:** Only the Claude routes enforced loopback Host/Origin; every other `/api/*` route (providers, lsp, preferences, agents, engine) and the `/v1/*` proxy accepted spoofed `Host:` and foreign `Origin:` headers, enabling DNS-rebinding/cross-site writes. Windows reserved device names (`con`, `aux`, …) were accepted as provider ids, and proxy paths forwarded `..` dot-segments upstream.
- **Root cause:** `_check_origin` existed only as a per-route dependency in the Claude router; no id denylist or dot-segment rejection elsewhere.
- **Fix:** Global `enforce_loopback_origin` middleware in `server.py` guards all `/api` + `/v1` traffic (same allowlist semantics as the Claude dependency); `agentstore` rejects reserved device names; `proxy.py` rejects any path containing a `..` segment before forwarding. Static assets remain openly readable by design.
- **Verified:** `tests/test_origin_gate.py` (spoofed Host → 403, foreign Origin → 403, loopback → 200, reserved ids → 400 with no files written); live probes replayed against the running server: evil host 403, traversal/static probes unchanged.

### 2026-08-22 - Stale test contracts lagged shipped features (preferences browser key, onboarding copy)

- **Symptom:** Two long-"accepted" baseline failures: preference tests expected the old three-key default shape after the browser-preference feature landed, and the onboarding copy contract still asserted the retired claude-3.5-sonnet first-provider screen.
- **Root cause:** Tests were not updated in the same change as the two features (violation of the same-change rule, now corrected).
- **Fix:** `test_preferences.py` expects the four-key defaults incl. `browser` and adds invalid-browser rejection coverage; `frontend_review.test.mjs` asserts the current approved first-provider screen (LiteLLM / CLI Proxy / Custom choices).
- **Verified:** Focused suites green; full Python 269/269 with zero skipped/xfail; full frontend 192/192 — no accepted baselines remain.

### 2026-08-22 - LSP toggle refreshed the entire Integrations page


- **Symptom:** Switching “Include LSP when building” on or off rebuilt the entire Integrations page, causing visible flicker and losing the page’s current UI position.
- **Root cause:** The LSP change handler saved the setting and then called the page-level `renderIntegrations()` refresh instead of updating the LSP card in place.
- **Fix:** `app/assets/js/pages/integrations.js` now replaces only the LSP card using `lspCard()`, rebinds its two controls, and keeps the rest of the Integrations workspace intact. LSP JSON saves use the same card-local update path.
- **Verified:** Live KiloCode test toggled LSP off and on; MCP/provider sections remained present, no skeleton refresh appeared, and the final state was restored to enabled. Focused UI contracts passed 45/45.

### 2026-08-20 - Provider relays showed a fake card and hid real providers

- **Symptom:** The relay deck showed a blank/add-provider card, so users could see only two meaningful providers even when more were configured; the deepest layer did not move with the deck.
- **Root cause:** The deck appended a synthetic slot and kept the back layer empty instead of treating every configured provider/Claude route as a carousel item.
- **Fix:** Relay item lists now contain only real providers/routes. For three or more entries, the back layer is the previous real entry, and both relay views keep wheel, drag, arrow, and button navigation over the complete list. Empty-state CTAs appear only when no entries exist.
- **Verified:** Focused relay/Claude contracts 62/62; all 24 JavaScript files pass syntax checks; four-provider reachability check passes; backend files were not changed.

### 2026-08-17 - settings.json backups were written next to settings.json instead of a backup folder

- **Symptom:** Applying any Claude route wrote `settings.backup.*.json` directly inside `~/.claude/` (cluttered next to `settings.json`), and the owner could not find them in a backup folder.
- **Root cause:** The backup destination was the settings target's parent directory (`~/.claude`) in both the builder core (`claude-routing-core.psm1`) and the adapter's recovery/restore paths.
- **Fix:** Backups now go to a `backup` subfolder: `~/.claude/backup/settings.backup.*.json`. Builder core `Invoke-ClaudeRoutingApply` creates the folder + writes there; the adapter's apply recovery copy, apply-output validation, restore endpoint, manifest prune, and rollback all resolve `settings.backup.*` under `backup/`. The 18 existing backups in `~/.claude/` were moved into `~/.claude/backup/`.
- **Verified:** Gate 2 73/73 (backup-count assertions now check the subfolder), full Python 252 (2 accepted baselines only), focused Python 168/168; live apply created a new backup in `~/.claude/backup/` and restore works.

### 2026-08-17 - Applying a route failed "referenced secret missing" after a previous failed apply (stranded credential)

- **Symptom:** Applying the freecc route failed twice with 400 "The route could not be applied to the Claude settings target." The FREE_CLAUDE env var disappeared from the registry after the first failure, so every retry failed.
- **Root cause:** The credential migration was non-atomic. `_resolve_route_credential` migrated a legacy app-created env var into the DPAPI store AND deleted the env var during resolution — before the apply commit. When the apply then failed for another reason, the route stayed legacy-backed but the env var was gone, and legacy resolution never consulted the store, so the key could not be resolved on retry ("referenced secret missing"). The builder itself is fine (repro: succeeds when the secret is in the process env).
- **Fix:** (1) `_resolve_route_credential` now also consults the DPAPI store as a fallback for legacy routes, so a stranded key resolves from the store; (2) the env-var deletion is deferred until AFTER a successful apply commit (the apply handler deletes it), so a failed apply never strands the credential and retries always work.
- **Verified:** Repro now applies cleanly; live freecc apply returned 200; FREE_CLAUDE migrated into the store, env var deleted after commit; new tests `test_apply_resolves_legacy_from_store_when_env_var_already_gone` + updated migration test; focused Python 168/168.

### 2026-08-17 - Route save rejected when the main Model ID was blank despite role models

- **Symptom:** Editing a route, clearing the main Model ID and leaving only Sonnet/Haiku role models filled, the save failed with "you have to fill this" even though role models were provided.
- **Root cause:** The main Model ID was hard-required both in the form (`required`) and in `_validate_route` ("The model ID is required."), with no allowance for role-only routes.
- **Fix:** The main model is now optional whenever at least one role model is assigned. `_effective_model()` (claude_adapter.py) derives the active `ANTHROPIC_MODEL` from the roles when blank (Sonnet first, then Haiku, Opus, Fable); the fingerprint and routing profile use the derived value; the route view exposes `effectiveModel`; the form field is no longer `required` and shows "derived from your Sonnet role (or first role) when blank"; cards/details mark a role-derived model with a "from roles" chip.
- **Verified:** 4 new `ModelRolesTests` (blank-main-with-roles accepted, blank-main-no-roles rejected with the new message, sonnet derivation, precedence); focused Python 149/149; focused frontend 56/56; live: orcarouter edited to blank main + roles, `effectiveModel` derived from Sonnet, save 200.

### 2026-08-17 - Applying a route failed "referenced secret missing" after a server restart

- **Symptom:** Applying the orcarouter route from the app returned 400 "The route could not be applied to the Claude settings target." while the tokenrouter/omniroute applies worked. The production builder log showed `VALIDATION FAILED; referenced secret missing`.
- **Root cause:** App-managed credentials (e.g. `ORCA_API_KEY`) are persisted in the user-scope registry and applied to the *running* server process at creation time. When the server restarts from a parent shell that never loaded that variable (fresh login shell / another tool's shell), the new server process does not inherit it, and the production builder child cannot resolve the route's credential. The session-45 "no restart gotcha" only held when the variable was created after the current server started.
- **Fix:** `claude_envvars.ensure_process_env(ref)` (claude_envvars.py) resolves a missing credential from the user-scope registry into `os.environ`; `claude_route_apply` calls it right before invoking the production builder (claude_adapter.py).
- **Verified:** Repro `VALIDATION FAILED; referenced secret missing` → after fix the orcarouter apply returns 200 and settings.json carries the orca env + allowlist; `EnsureProcessEnvTests` (3) + `EnvVarLifecycleTests.test_apply_ensures_credential_in_process_env` green; Gate 2 73/73, focused Python 145/145, focused frontend 56/56.

### 2026-08-17 - Surgical patcher left a dangling comma when removing a trailing run of managed env keys

- **Symptom:** Applying a route with no role assignments to settings that still carried the four `ANTHROPIC_DEFAULT_*_MODEL` keys produced "surgical output malformed JSON" (the env object ended `"value",}`).
- **Root cause:** The removal-span coalescer merged a trailing run of member removals starting *after* the previous member's comma, leaving that comma dangling when nothing followed the run. The latent bug was never exercised because prior tests removed at most one key or a mid-run key.
- **Fix:** `Repair-DanglingRemovalCommas` (claude-routing-core.psm1) extends a removal span back over the preceding comma when the span ends at the object's closing brace; applied to both the env and the top-level (availableModels/enforceAvailableModels) removals.
- **Verified:** New G2-8 harness tests "stale tier models removed" + "allowlist removed when off" pass; Gate 2 73/73.

### 2026-08-17 - LSP card status line ignored the toggle state

- **Symptom:** With the LSP toggle OFF, the Integrations page still read "Built-in servers enabled — kilo.json will carry "lsp": true." even though the builder writes `"lsp": false` when the toggle is off. The status line contradicted the actual build output.
- **Root cause:** `lspRows` described only the stored `lsp` value (`true`/object/false) and never consulted `enabled` — so a disabled toggle with a `true` value displayed "Built-in servers enabled".
- **Fix:** `lspRows` (integration-workspace.js) now checks `enabled` first: toggle OFF → "LSP is off — <config> will carry "lsp": false."; toggle ON → value-aware copy (built-ins / server chips / disabled). The status line now always matches what the builder will emit.
- **Verified:** `integrations_visual_contract.test.mjs` renders enabled and disabled states and asserts the copy names the right config file with the right `lsp` value (true when on, false when off); focused suite 5/5; diff check clean.

### 2026-08-17 - LSP toggle OFF removed the lsp key from the generated config

- **Symptom:** With LSP toggled OFF in the app, running the builder produced a main config with **no** `lsp` key at all — the key silently vanished instead of being explicitly `false`. On OpenCode that reads as "no configuration", which is indistinguishable from a broken build to someone scanning the JSON.
- **Root cause:** The builders' `Merge-Lsp` returned `$null` when `lsp.json` had `enabled: false`, and `Merge-Final` only wrote `$Final.lsp` when the merged value was truthy — so a disabled LSP was dropped from the output entirely.
- **Fix:** `Merge-Lsp` (build-opencode-v2.7.ps1 + kilo build-kilo-v1.ps1) now returns `$false` when `enabled` is false (and the literal `lsp` value when enabled); `Merge-Final` writes the key whenever the merged value is non-null (`if ($null -ne $Lsp) { $Final.lsp = $Lsp }`). Disabled now emits `"lsp": false`; enabled emits `true`/the object — the key is always present and flips cleanly.
- **Verified:** Both harnesses green (opencode 40/40, kilo 37/37 — "LSP disabled emits false" + "LSP false value emits false" tests); live through the app: toggle ON → build → `"lsp": true`; toggle OFF → build → `"lsp": false`.

### 2026-08-17 - LSP card always said "opencode.json will carry lsp: true"

- **Symptom:** On the KiloCode agent the Integrations page's LSP block read "opencode.json will carry "lsp": true." — it named the wrong config file for the active agent.
- **Root cause:** The copy in `lspRows` was a hardcoded string ("opencode.json") that never looked at which agent was active.
- **Fix:** The active agent's config filename is now passed through the markup: `integrationWorkspaceMarkup({ ..., configName })` → `lspCard(lsp, configName)` → `lspRows(lsp, configName)`. `integrations.js` derives `configName` from the agent id (`opencode.json` / `kilo.json` / `settings.json` for Claude / `config.json` fallback). The LSP block now names the right file per agent.
- **Verified:** `integrations_visual_contract.test.mjs` renders the markup for both OpenCode and KiloCode and asserts the copy names the correct config file; focused + full frontend suites green; live render verified in Node.

### 2026-08-16 - Claude route form checkboxes rendered huge

- **Symptom:** Every checkbox in the Add-route dialog (gateway discovery, disable betas, suppress nonessential traffic, confirmation box) rendered as a giant full-width box with an enormous checkmark.
- **Root cause:** `app/assets/css/components.css` styles `.field input` with `width: 100%; min-height: 44px` — the same rule matched `input[type="checkbox"]` inside any `.field`, stretching checkboxes into 44px-high full-width blocks.
- **Fix:** Excluded checkboxes from the text-input rule: `.field input:not([type="checkbox"]), .field select, .field textarea` (components.css). Checkboxes now render at native size.
- **Verified:** Focused frontend contract suite green (44/44); diff check clean; visual check in the live app after refresh.

### 2026-08-15 - Edit provider button added to provider cards

- **Symptom:** Rotating an API key (e.g. OrcaRouter) meant deleting and re-adding the provider, or hand-editing JSON — the edit wizard existed but was buried inside card → Details → Edit provider and was never discoverable.
- **Root cause:** The edit entry point was one level too deep; nothing on the card itself hinted at editing.
- **Fix:** Every provider card now has an "Edit provider" button (provider-workspace.js) that opens the existing pre-filled wizard; the Details dialog is read-only now. Backend PUT was already in place.
- **Verified:** Contract tests 11/11; live E2E in a temp environment — base URL/SDK/reasoning format edits persisted, API key preserved when left blank, key replaced when entered, zero console errors.

### 2026-08-13 - Onboarding rail exposed an irrelevant docs link

- **Symptom:** The onboarding rail ended with a “Need help? / Open docs” link that pulled users away from setup instead of communicating the app’s local privacy model.
- **Root cause:** The rail still used the original help-link placeholder after the onboarding flow had become self-guided.
- **Fix:** Replaced it with a compact shield reassurance card: “Private by default,” “Keys stay on this computer,” and “Prompts are never logged.” The card is informational and does not open another page.
- **Verified:** `app/tests/frontend_review.test.mjs` asserts the privacy card copy and rejects the old docs link; the focused test and onboarding JavaScript syntax check pass.

### 2026-08-13 — Overview relay action label did not describe its behavior

- **Symptom:** The Overview relay card called its active-provider action “Remove provider” and its inactive-provider action “Add provider,” even though the actions only changed whether the provider was included in the active build.
- **Root cause:** The Overview template reused destructive-sounding add/remove labels for the existing activate/deactivate handlers.
- **Fix:** Renamed the actions in `app/assets/js/pages/overview.js` to “Deactivate provider” and “Activate provider.” The existing behavior is unchanged; destructive provider deletion remains available only on the Providers page.
- **Verified:** `app/tests/overview_visual_contract.test.mjs` asserts both semantic labels and rejects the old labels; the focused Node test passes.

### 2026-08-13 — Models added via the provider wizard got no thinking levels, and editing a provider wiped saved levels

- **Symptom:** Picking a reasoning format (OpenAI, OpenCode, Gemini, Claude…) while adding a provider wrote the models with an empty `variants` dict — no thinking levels at all. Worse, opening an existing provider in the add/edit wizard and saving erased the thinking levels the user had set in the Model Settings editor.
- **Root cause:** `write_models` (agentstore.py) only builds variants from the `thinking` list each model item carries, and both provider forms always send `thinking: []` — the wizard never asks for or reads levels. With an empty list the variant loop never ran, and on edit the empty list overwrote the previously saved variants.
- **Fix:** `write_models` now treats an empty `thinking` list (with no per-model format override) as "all levels of the provider's reasoning format" — picking a format yields its full level set automatically; the "No reasoning" format still writes `{}`. The wizard dialog (providers.js `values()`) now sends each model's existing thinking and name back on edit instead of empties, so saved levels survive. The embedded add-only panel needs no change — the backend rule covers it.
- **Verified:** New tests in tests/test_agentstore.py assert empty thinking fills all OpenAI and OpenCode levels, stays empty for the "none" format, and that re-saving previously saved custom levels preserves them; full test suite passes.

### 2026-08-12 — Terminal banner blast painted over the banner and scrambled the console

- **Symptom:** On server start the BDF SWITCHER banner burst ran, but particles
  landed ON TOP of the banner text (erasing the 5th BDF line and the whole
  SWITCHER block), the cursor was left mid-screen, and the tagline / addresses /
  uvicorn INFO logs printed interleaved with leftover particles — "a horror" per
  the owner.
- **Root cause:** `banner.py` `_blast_animation` used the art's center as the
  burst origin with a radius large enough to reach the art rectangle itself, and
  never restored the cursor after the absolute-position ANSI writes. The clear
  pass then erased art cells it had overlapped.
- **Fix:** Particles are now clamped to the empty margin AROUND the art
  rectangle (row < art_top or row > art_bottom or col > art_right) so the banner
  is never touched; the cursor is saved (`ESC 7`) before the burst and restored
  (`ESC 8`) after, so log output keeps flowing from where it was. Verified in a
  simulated TTY run: 0 of the ANSI writes land inside the art rect, art + tagline
  intact.
- **Verified:** Fake-TTY harness asserts BDF + SWITCHER block lines intact,
  cursor save/restore present, zero writes inside the art rectangle; fresh
  server start shows a clean banner followed by clean INFO logs.

### 2026-08-12 — Concurrent config writes flaked with PermissionError 13 'Access is denied'

- **Symptom:** The regression test for concurrent `_write_json` calls
  (`test_concurrent_write_json_no_tmp_collision`) intermittently failed with
  `PermissionError(13, 'Access is denied')`; rapid double-activate of two
  providers could 500 on the second request. A follow-up retry attempt itself
  crashed every run with `NameError: name 'time' is not defined`.
- **Root cause:** Two layers: (1) `_write_json` originally used a FIXED
  `.tmp` filename, so two concurrent writers collided on the same temp file
  (fixed with `tempfile.mkstemp`); (2) even with unique temp files, the final
  `os.replace(tmp, target)` on Windows races — the destination is transiently
  locked while the other thread renames onto it (or the AV scans it), surfacing
  as PermissionError 13. The retry helper I added referenced `time.sleep`
  without importing `time`.
- **Fix:** `_replace_retry(tmp_name, path)` retries `os.replace` up to 6 times
  with 20-120ms backoff before giving up; added `import time` to
  `app/app/agentstore.py`.
- **Verified:** Suite run 10 times in a row — 10/10 green (was failing ~3/10
  before the rename retry, 10/10 failing with the NameError).

### 2026-08-12 — Builder stripped model reasoning variants from the generated config

- **Symptom:** Built `opencode.json` / `kilo.json` carried fewer model variants than
  `profiles\coding\<provider>-models.json`. E.g. cli-proxy gpt models kept only
  `high` while the models file had `high/low/medium/xhigh`; the build log warned
  "variant 'low' dropped - not valid for reasoning format 'opencode'" even though
  the user never selected that format. Because backups were taken after the strip,
  no backup preserved the original variants.
- **Root cause:** `Apply-ReasoningFormatFilter` in `engine\build-opencode-v2.7.ps1`
  and `engine\kilo\build-kilo-v1.ps1` dropped every variant level outside the
  PROVIDER's declared format (`$Allowed = $ReasoningFormats[$Fmt].Levels`), and
  `Resolve-ReasoningFormat` defaults an undeclared format to `opencode`. The
  intended behavior (levels valid in ANY known format survive; only unknown levels
  drop) existed only in the local kilo agent copy and was never in the engine —
  a regression that shipped to fresh scaffolds.
- **Fix:** Both engine builders now compute `$AllLevels` (union of every known
  format's levels) and keep a variant if it is valid in ANY format, preserving
  per-model data (e.g. gemini `thinkingConfig` budgets inside an opencode
  provider). `test-opencode-v2.7.ps1` Test 22 updated to assert `max` (valid in
  opencode) survives and only a truly unknown level (`madeup`) is dropped.
- **Verified:** Rebuilt the real opencode config — 0 dropped-variant warnings,
  `gpt-5.5` keeps high/low/medium/xhigh, backup created; fresh-scaffold auto-build
  repro (temp kilo dir) keeps all variants + creates the `kilo_*.json` backup;
  harnesses green: opencode 33/33, kilo 31/31, app unit tests 80/80.


### 2026-08-10 — Overview page showed invented demo data instead of real config/activity

- **Symptom:** The dashboard's Overview displayed hardcoded OpenAI/OpenRouter/Gemini providers ("1,284 API calls", "98.9% success", a fake May-2025 recent-calls list) regardless of the actual config — violating the design rule that the UI never invents production data.
- **Root cause:** `app/assets/js/pages/overview.js` was written around `DEMO_PROVIDERS`, `DEMO_KPIS`, `DEMO_USAGE`, `DEMO_CALLS` and a hardcoded chart; it never called the activity API.
- **Fix:** Rewrote `renderOverview` to consume real data: providers from `/api/providers` (relay deck ordered by active provider, real model/endpoint/SDK/key state), KPIs from `/api/activity/summary` (requests, success rate, median latency, failures), requests-over-time chart and provider-usage donut grouped from `/api/activity`, and the recent-calls table from real events. Honest empty states ("No proxy traffic yet", "No providers configured yet") replace invented numbers when there is no data. Added donut palette classes for arbitrary provider ids.
- **Verified:** Browser walkthrough on the real kilo config — relay front = active provider (real model + endpoint), KPIs 3 calls / 100% / 20ms / 0 failures, real recent rows; no console errors.

### 2026-08-10 — Sidebar theme and help buttons did nothing

- **Symptom:** The sidebar's "Toggle color theme" and "Help and support" buttons were inert.
- **Root cause:** No event handlers were ever bound to `.sidebar-tool` buttons.
- **Fix:** `main.js` bindShell wires them: theme toggles `data-theme="dark"` on `<html>` (new dark palette in `tokens.css` for workspace tokens), persists the choice in localStorage; help opens `/docs` in a new tab.
- **Verified:** Clicking the theme button flips the workspace to dark (`rgb(14,20,27)` background) and back; help opens the docs tab.

### 2026-08-10 — Welcome page had a scrollbar (fixed-width mobile layout overflow)

- **Symptom:** The Welcome page showed vertical (and at narrow widths horizontal) scrollbars; the startup grid overflowed the window.
- **Root cause:** The mobile layout (`responsive.css` ≤899px) switched `.startup-grid` to static/full-width but never overrode the base `width: 1586px; height: 992px`, so the frame rendered 1586×992 in any narrow window; at ≥900px the scale-to-fit formula otherwise keeps the frame exactly viewport-sized.
- **Fix:** Added `width: 100%; height: auto` to the mobile `.startup-grid` rule (prevents horizontal overflow); the frame then follows the fluid grid. The design's mobile stacked layout itself remains (restored after an earlier experiment), so narrow windows keep the intended responsive behavior.
- **Verified:** No horizontal overflow at any tested size; vertical scroll only where the mobile stacked layout is intentionally taller than the window.

### 2026-08-10 — Browser served stale cached JS/CSS; refreshes showed old versions

- **Symptom:** After code changes, a plain refresh kept showing the previous version of the page (e.g. the old auto-jump-to-dashboard boot), making fixes look broken.
- **Root cause:** The FastAPI server sent no `Cache-Control` headers for the GUI HTML or `/assets`, so browsers heuristically cached them indefinitely.
- **Fix:** `server.py` mounts `/lib` and `/assets` through a `NoCacheStaticFiles` subclass that appends `Cache-Control: no-cache`; `serve.py` sets the same header on the `/` HTML response. Static files now revalidate on every refresh.
- **Verified:** Response headers show `Cache-Control: no-cache` for `/`, JS, and CSS; plain F5 picks up edits.

### 2026-08-10 — settings.json UTF-8 BOM broke active-provider detection

- **Symptom:** `/api/providers` reported every provider `active: false` and `activeProvider: null` even though the config listed them.
- **Root cause:** A PowerShell `Set-Content -Encoding UTF8` restore wrote a UTF-8 BOM (`EF BB BF`) into `profiles/coding/settings.json`; `json.loads` rejects the BOM, so `get_active_providers` read an empty dict.
- **Fix:** Rewrote the file with a BOM-less UTF-8 writer (`.NET UTF8Encoding($false)`); the API immediately reported the real active providers.
- **Verified:** `/api/providers` shows `active: true` for both providers and the correct `activeProvider`; bytes start with `7B` (`{`).

### 2026-08-10 — App crashed at boot: "Invalid left-hand side in assignment"

- **Symptom:** The wizard preview didn't render and the console showed a SyntaxError; only the static Welcome markup appeared.
- **Root cause:** `main.js` used optional chaining on an assignment target (`document.querySelector(...)?.textContent = value`), which is invalid JS and failed module parsing.
- **Fix:** Guarded the element lookup with a variable + `if` before assigning.
- **Verified:** `node --check` passes; full wizard → dashboard flow renders with no console errors.

### 2026-08-10 — Provider relay showed mismatched brand marks and had no browsing animation

- **Symptom:** The relay (and recent calls) displayed the OpenAI/OpenRouter/Gemini brand marks for arbitrary providers (e.g. OmniRoute, tokenrouter), and the deck couldn't be browsed.
- **Root cause:** `brandMark()` mapped every unknown provider name to one of three hardcoded brand SVGs; the relay was static.
- **Fix:** Known providers (OmniRoute, LiteLLM, CLI Proxy, TokenRouter, OpenRouter) now use downloaded official logos (`assets/brands/`); anything else (custom providers) gets a deterministic generated logo — a gradient tile with the provider's initials from an 8-color palette. The relay is scrollable (mouse wheel and arrow keys): the deck cycles through providers with a depth animation (front card scales forward/fades out, the next card scales up from behind; backward reverses it), with a reduced-motion fast path.
- **Verified:** Relay cycles OmniRoute ↔ tokenrouter both directions; wizard provider cards show litellm.png / cli-proxy.svg; custom keeps its ＋ mark; no console errors.

- **Symptom:** Selecting an agent always produced the same fake scan counts (3/6/2/1), agent cards showed invented paths (`C:\Users\you\...`), and the wizard offered providers regardless of what was actually configured. Clicking "Set up your workspace" on the Welcome page did nothing.
- **Root cause:** The wizard's preview mode hardcoded sample agents, scan results, and presets and gated every real API call behind `previewOnly`; the Welcome page was only reachable through `?preview=welcome`, where the button is intentionally inert.
- **Fix:** `app/assets/js/pages/onboarding.js` now always drives the real API — live `/api/discover` (OpenCode/Kilo only), real `/api/scan` on agent selection (with a summary line on the agent step), real `/api/scaffold` when the agent isn't split, real `/api/test` and `/api/providers`. Fake data removed; `main.js` shows the Welcome page on every boot.
- **Verified:** Browser walkthrough — OpenCode scan = 3 providers/9 MCP/1 plugin, Kilo = 2 providers/7 MCP/0 plugins (matches the real folders); both agents detected with real paths; provider test/save hit the live API.

### 2026-08-10 — Review screen always showed 0 (or fake) providers

- **Symptom:** "Review your workspace" never reflected the providers in the config — the Providers card showed a hardcoded 1 or 0 for every agent.
- **Root cause:** `POST /api/scan` never returned provider data; it read MCP/plugins/profiles from the main JSON and profiles folder but ignored `providers/`. The wizard had no way to count or name real providers.
- **Fix:** `app/app/discovery.py` scan now returns `providers` (stems of `providers/*.json`), `activeProviders` (from `profiles/coding/settings.json`), and `split` (whether the agent has the framework structure). Review and provider steps consume them.
- **Verified:** Review shows Providers 3 for OpenCode and 2 for Kilo, matching the on-disk `providers/` folders; chips show active/not-active from the agent's own settings.

### 2026-08-10 — Wizard offered providers the user already has (e.g. CLI Proxy with cli-proxy-api present)

- **Symptom:** OpenCode already had `cli-proxy-api` active, but the wizard still showed a CLI Proxy card asking for URL + key again.
- **Root cause:** The provider cards were rendered from a static preset list with no awareness of the scanned config.
- **Fix:** `providerScreenMarkup()` filters preset cards against the scanned `providers` (name-containment match, case-insensitive); existing providers render as status chips (name + active/not-active) instead. Custom is always available.
- **Verified:** OpenCode shows only LiteLLM + Custom cards (CLI Proxy hidden); Kilo (omniroute + tokenrouter only) still shows LiteLLM + CLI Proxy + Custom.

### 2026-08-10 — Custom provider couldn't set provider ID, display name, or structured models

- **Symptom:** The Custom form only had Base URL + SDK + key + a free-text models input; the owner's expected fields (Provider ID `myprovider`, Display name `My AI Provider`, models as ID + Name rows) were missing, and the created provider file was named from a slug of the display name.
- **Root cause:** The form was minimal and `POST /api/providers` derived the provider id via `slugify(name)` with no way to pass an explicit id.
- **Fix:** Custom now shows Provider ID (validated `^[a-z0-9_-]+$`), Display name, Base URL, SDK, reasoning format, API key, and a models section with add/remove rows of (model ID, display name). `app/app/providers.py` accepts an optional `id` on create (validated, else 400).
- **Verified:** Invalid id ("My Provider!") rejected with a clear toast; valid `myprovider` saved as `providers/myprovider.json` with the typed id; model rows saved as `{model, name}` pairs (test provider deleted and settings restored afterwards).

### 2026-08-10 — Wizard layout: scrollbars on every step, toast/field overlapping the footer

- **Symptom:** Every onboarding step showed a vertical scrollbar; the manual-folder field crossed the footer separator line; the "Connection successful." message overlapped the Back button.
- **Root cause:** The 790px design window was too narrow for wide screens and the content was taller than the fixed 503px window; the status message was positioned at the content's bottom-left, inside the footer zone; scroll-container padding created a phantom scrollbar.
- **Fix:** Window design widened to 1130px (scale formula in `main.js` updated); all steps compacted (card heights 54→50/44px, form rows to 38px, tightened headings) so nothing scrolls; the message became a toast (slides in from the right, auto-dismisses after 3.5s, anchored to the stage) and the manual folder moved into a proper dialog.
- **Verified:** All four steps measure `scrollHeight - clientHeight = 0` for every provider state; toast appears top-right and auto-hides; manual dialog validates the folder against the backend.

### 2026-08-10 — App auto-jumped to the dashboard instead of showing the Welcome page

- **Symptom:** Launching the app with an already-set-up agent skipped the Welcome screen and went straight to the dashboard.
- **Root cause:** `main.js` boot() called `showWorkspace()` whenever `status.ready` was true.
- **Fix:** Boot always shows the Welcome page; status is fetched only for context. Navigation to the dashboard happens exclusively through the wizard ("Open dashboard").
- **Verified:** Fresh load lands on `http://127.0.0.1:9090/` showing "Welcome to Switcher" with the app shell hidden; no auto-navigation to `?view=overview`.

### 2026-08-10 — Agent selection allowed multiple choices and Continue with none

- **Symptom:** A detected agent and the manual folder could look selected at once; Continue was enabled with no selection.
- **Root cause:** Cards toggled independently and `chosenAgent` defaulted to the first mock agent.
- **Fix:** Selection is one-or-none (clicking a card clears the manual state and vice versa); no default selection; Continue is disabled until a card or a validated manual folder is chosen.
- **Verified:** Clicking OpenCode leaves only it pressed (Continue enabled); opening the manual dialog clears card presses; cancel restores the previous selection; Continue stays disabled until a choice exists.

- **Symptom:** Using a GPT-5.x model (e.g. gpt-5.6-luna via CLI Proxy) with the
  `max` variant failed: `level "max" not supported, valid levels: low, medium,
  high, xhigh`.
- **Root cause:** The app hardcoded one level set (`default/minimal/high/max`)
  and one variant shape (`{"reasoningEffort": "<level>"}`) for every provider.
  GPT-5.x only accepts `none/low/medium/high/xhigh` (ChatGPT app: Light /
  Medium / High / Extra High); `max` exists only on gpt-5.6 via the Responses
  API. Claude and Gemini don't speak `reasoningEffort` at all — Claude uses a
  thinking token budget, Gemini a thinking budget.
- **Fix:** Per-provider reasoning formats. `agentstore.py` now owns a
  `REASONING_FORMATS` registry (opencode / openai / claude / gemini / none)
  with each format's valid levels and variant JSON templates. Provider files
  carry an optional `reasoningFormat`; `write_models` writes variants from the
  format's templates (openai → `reasoningEffort`, claude →
  `thinking.budgetTokens` 8000/16000/32000, gemini →
  `thinkingConfig.thinkingBudget` 4096/8192/16384/32768) and drops levels
  invalid for the format; `read_models` filters shown levels to the format.
  `providers.py` exposes `GET /api/formats`, accepts `reasoningFormat` on
  create/update (unknown id → 400), and threads it through model reads/writes.
  `gui.html` gained a "Reasoning format" dropdown in the provider modal and the
  Models card; presets pre-pick it (CLI Proxy/OpenAI → openai, Google →
  gemini). Framework: `models.schema.json` documents the accepted variant
  settings keys (still permissive); `test-opencode-v2.7.ps1` gained a test
  proving OpenAI/Claude/Gemini variant shapes pass schema validation and merge.
- **Verified:** 56/56 app unit tests (8 new: format templates, level dropping,
  filtering, round-trip); 32/32 builder harness tests; browser UI test in a
  temp agent — CLI Proxy preset auto-picked `openai`, saving gpt-5.6-luna with
  low/medium/high/xhigh wrote exactly the reference config; switching the
  Models card format to `claude` rewrote variants to `thinking.budgetTokens`.

### 2026-08-09 — Models dropdown doesn't show newly added providers

- **Symptom:** A provider added through "Add a provider" never appeared in the
  Models section's Provider dropdown (which shows per-provider model counts and
  lets you manage them) until the browser was fully reloaded. Same for deleted
  providers — they stayed in the dropdown.
- **Root cause:** The Models dropdown is populated by `Models.load()`, which
  was only called at page boot and when switching agents. `Providers.save()`
  and `Providers.del()` re-rendered the provider grid after a write, but never
  refreshed the Models dropdown, so it kept showing the provider list from page
  load.
- **Fix:** `app/gui.html` — added `Models.load()` right after `await load()` in
  `Providers.save()` (covers add + edit) and in `Providers.del()` (covers
  delete), so the dropdown re-fetches the provider list after every
  add/edit/delete. All other mutation paths (switch agent, add/remove agent,
  boot) already refreshed the dropdown.
- **Verified:** Browser test against the running app — added a temporary
  provider via the modal and it appeared in the Models dropdown instantly with
  no reload; deleted it and it vanished instantly. The live API
  (`/api/providers`) was used to confirm on-disk state matched the UI.

### 2026-08-09 — Bootstrapped builder harnesses fail 2 tests (hardcoded spec paths)

- **Symptom:** `scaffold-agent.ps1 -Bootstrap` produced a working builder but
  its test harness failed 2 tests ("Builder spec covers V2.5/V2.7"):
  `BUILDER_SPEC.md not found at C:\Users\loveb\C:\Users\loveb\...` (doubled
  path prefix).
- **Root cause:** Test 12 and Test 28 in `test-opencode-v2.7.ps1` and
  `test-kilo-v1.ps1` hardcoded `C:\Users\loveb\.config\...\docs\BUILDER_SPEC*.md`.
  The scaffold's string replacement of `.config\kilo` → `$ConfigRoot` mangled
  that absolute path into a doubled prefix, and a fresh project has no docs
  folder at all — the token-coverage tests could never pass for scaffolded
  agents (framework tests passed only on the author's machine).
- **Fix:** Both harnesses now resolve the spec path relative to
  `$PSScriptRoot` (`..\docs\BUILDER_SPEC*.md`) and SKIP the token coverage
  check with a notice when the project doc is absent (it is project-owned and
  optional). Real harnesses still assert when the doc exists.
- **Verified:** Re-bootstrapped a sandbox agent — harness now passes; real
  kilo (31/31) and opencode (33/33) harnesses still green.

### 2026-08-09 — Dead `config.PRESETS` duplicate removed

- **Symptom:** `app/app/config.py` carried a `PRESETS` dict that nothing
  imported — the live preset list (URL + SDK + reasoning format) lives in
  `gui.html` and had already drifted from it (missing reasoning formats).
- **Root cause:** Leftover from an earlier design; a "keep in sync" comment
  with no enforcement.
- **Fix:** Removed `PRESETS` from `config.py` (gui.html is the single source
  of truth).
- **Verified:** 56/56 app unit tests green; no imports reference it.

### 2026-08-09 — App depended on scripts outside the repo (not self-contained)

- **Symptom:** A fresh download of the repo could not generate builders. The
  wizard's "Generate my builder" failed with "The engine script
  (scaffold-agent.ps1) was not found" unless the machine happened to have a
  copy in `~/.config/opencode/scripts/`.
- **Root cause:** `config.py` defaulted `SCRIPT_DIR` to the user's own config
  folder (`CONFIG_ROOT/scripts`), outside the repo. The scaffold's builder
  templates also resolved to a machine-specific path
  (`..\kilo\scripts\build-kilo-v1.ps1`). The app worked on the author's PC and
  nowhere else — a public-repo blocker.
- **Fix:** The app is now self-contained. `app/engine/` bundles the full BDF
  engine: `scaffold-agent.ps1` (generator), `build-opencode-v2.7.ps1` +
  `test-opencode-v2.7.ps1`, `kilo/build-kilo-v1.ps1` + `test-kilo-v1.ps1`
  (K1 adapter), and `schemas/` (7 schemas). `config.py` defaults to the
  bundled engine (`BDF_SCRIPTS_DIR` remains an escape hatch). The bundled
  scaffold resolves the builder source per agent (opencode → V2.7 builder,
  kilo → K1 adapter) instead of a hardcoded path, and `engine.py` seeds the
  agent's `schemas/` folder from the bundle on scaffold.
- **Verified:** Fresh temp agents end-to-end — opencode agent: wizard
  generated profiles (3) + providers/ + schemas/ (8 files) +
  build/test/scaffold-opencode.ps1, build → `opencode.json` (BUILD COMPLETE,
  schema validation on). kilo agent: build/test/scaffold-kilo.ps1 (K1
  adapter with reasoning formats), build → `kilo.json` + provenance; generated
  kilo tester harness passes. Real configs untouched (state restored).

### 2026-08-09 — PowerShell: new properties on parsed JSON throw in PS 5.1

- **Symptom:** `$obj.newProp = value` on a PSCustomObject from
  `ConvertFrom-Json` threw `The property 'newProp' cannot be found on this
  object` (also plain `[pscustomobject]` literals).
- **Root cause:** This environment's PowerShell 5.1 refuses member-assignment
  for NEW properties; only existing properties are settable that way.
- **Fix:** Use `Add-Member -NotePropertyName ... -NotePropertyValue ... -Force`
  when persisting `reasoningFormat` into provider files
  (`Set-ProviderReasoningFormat` in both builders + the merged provider
  entry).
- **Verified:** Interactive builder prompt test — provider file gains
  `reasoningFormat` with backup; harnesses green.

### 2026-08-12 - Provider endpoint (base URL) missing on the Overview relay card

- **Symptom:** In the Overview page's "Your provider relay" block, the OmniRoute card showed no endpoint (and on opencode the TokenRouter card showed a double-slash URL like `https://api.tokenrouter.com//v1`). Kilo was affected; opencode was not - which made the bug look agent-specific.
- **Root cause (two parts):**
  1. The real providers/omniroute.json had been emptied during earlier session testing (empty `baseURL` and `apiKey`), so the API returned a blank endpoint.
  2. Editing the provider file with PowerShell `Set-Content -Encoding UTF8` wrote a UTF-8 BOM (`EF BB BF`) at the start of the file. The app's JSON readers used `encoding="utf-8"`, which rejects a BOM - so the whole file failed to parse and `baseUrl` came back empty. Any provider file touched by a BOM-writing editor would silently lose its endpoint.
- **Fix:**
  1. Restored providers/omniroute.json from the backup (real endpoint http://localhost:20128/v1 + key), and fixed opencode's TokenRouter double slash to https://api.tokenrouter.com/v1.
  2. Hardened every JSON read in the app to be BOM-tolerant: pp/app/agentstore.py `_read_json`, pp/app/discovery.py (main-config scan), and pp/app/storage.py `_read` now use `encoding="utf-8-sig"`, which transparently strips a BOM. Writes remain BOM-less UTF-8.
- **Verified:** All 5 provider files across both agents parse with correct `baseURL` (BOM-free); the Overview relay card on kilo shows both endpoints (https://api.tokenrouter.com/v1 and http://localhost:20128/v1); opencode's TokenRouter shows the single-slash URL; 79 unit tests pass (1 pre-existing unrelated gui.html cache-param failure).

### 2026-08-12 - Returning users got "Checking everything works" + auto-revert errors on every open

- **Symptom:** Opening the Kilo app (already set up) showed "Checking everything works…" and a "Setup was rolled back automatically… fix them" error after pressing "Use this workspace". The app seemed broken for any returning user; OpenCode appeared to work.
- **Root cause:** useWorkspace ran the post-setup verification (/api/setup/verify) and auto-revert **unconditionally** on every connect - including when the agent already had a builder. Returning users have real providers with real keys; the verify's connection tests (and the import-time empty baseURL/key cases) made it fail and the auto-revert wrongly fired, rolling back kilo.json and blocking entry.
- **Fix:** useWorkspace now only runs verify + auto-revert + the setup guide when reshSetup is true (i.e. !scanResult?.hasBuilder - the scaffold actually ran). Already-set-up agents connect directly to the provider step with no checks, no revert, no guide.
- **Verified:** Browser walkthrough as a returning user on real kilo: goes straight to "Add your first provider" - no "Checking everything", no errors. The first-time setup path (verify + revert + guide) is unchanged and still triggers only when a builder is actually generated.

### 2026-08-12 - "LiteLLM is active" shown on the ready screen when nothing was configured

- **Symptom:** After onboarding, the ready screen claimed "LiteLLM is active" even though the user never added a provider (or used a workspace with existing providers).
- **Root cause:** The ready screen rendered providerPresets[selectedProvider].name with selectedProvider defaulting to "litellm" (the first preset), and skippedProvider was false when the ready screen was reached via the verify-success path - so the line "LiteLLM active" appeared by default.
- **Fix:** The ready screen now only claims a provider is active when one was actually added in this onboarding session (selectedKind === "provider-added", set in saveFirstProvider). Otherwise it shows "Your providers stay as configured - manage them from the dashboard".
- **Verified:** Skipping the provider step shows the neutral line, no fake "LiteLLM active"; adding a provider shows the real name.
