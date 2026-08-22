# APP FULL CHECK REPORT — 2026-08-12

> Ran per `AI/APP_FULL_CHECK.md`. Two full passes: FIRST-STARTUP (wiped kilo,
> seeded jason) + NORMAL (restored config). Snapshot/hash-verified restore
> throughout. 2 bugs found & fixed, 2 minor UX notes.

---

## Phase summary

| Phase | Result | Notes |
|-------|--------|-------|
| 0 Pre-flight | PASS | Server stopped, kilo (3631 files) + state.json/preferences.json snapshotted to `%TEMP%\opencode\appcheck`, SHA256 manifest |
| 1 First-startup test | PASS | Seeds in jason (3 models), kilo wiped to only kilo.json, wizard walked, folders created, restore hash-verified |
| 2 Global chrome | PASS | Theme toggle + persist, About dialog, collapse, nav routes, zero console errors |
| 3 Overview | PASS | Relay deck scroll/arrows/activate/deactivate, KPIs, charts, range, empty states |
| 4 Providers | PASS | Cards (switch/test/details/edit/delete), 5-step dialog, all 9 presets auto-fill, dup/empty errors, embedded panel toggles |
| 5 Models every surface | PASS | Overview card, dialog textarea, settings model editor + reasoning panel + model manager, wizard |
| 6 Graphs | PASS | Real proxy traffic (3×503 logged), overview line chart + provider usage, activity charts + all filters |
| 7 Agent switching | PASS | Kilo ↔ opencode isolation via tabs + API switch; provider sets differ correctly |
| 8 Plugins | PASS | Add (required validation), remove w/ confirm + backup |
| 9 MCP | PASS | Local/Remote/Expert JSON, invalid-JSON error, non-URL error, add/remove + backup |
| 10 Connection errors | PASS | Dead endpoint clean fail, "No active provider" clean error, keys never logged |
| 11 Build pipeline | PASS | Builds green, backup-first, idempotent, provenance stamped |
| 12 Edge cases | PASS | Persistence, keyboard, responsive, zero console errors, secrets grep 0 hits |
| 13 Final restore | PASS | 3631 kilo files + state byte-identical to baseline |

---

## Found & fixed

1. **`main.js:63-70` — build dialog button stuck disabled + console TypeError**
   (`Cannot set properties of null (setting 'disabled')`).
   Root cause: the `finally` block read `event.currentTarget` AFTER the awaited
   `api.build()`; per the DOM spec `currentTarget` is null once dispatch
   completes. The Run-build button never re-enabled after a build.
   Fix: capture `const button = event.currentTarget` synchronously before the
   await (also applied to `settings.js:253`'s build handler — already safe, no
   change needed there). Verified: build completes, button re-enables, console clean.
   - `app/assets/js/main.js`

2. **`agentstore.py:182` — concurrent writes collide on shared `.tmp` filename**
   (`PermissionError: ...settings.json.tmp` → HTTP 500 on the second request).
   Reproduced by clicking "Add provider" (activate) on two cards back-to-back.
   Fix: `_write_json` now uses `tempfile.mkstemp(dir=path.parent, prefix=..., suffix=".tmp")`
   (unique per write) + `os.replace` atomic swap + cleanup on failure.
   - `app/app/agentstore.py` (+ `os`/`tempfile` imports)
   - Regression test added: `test_agentstore.py::test_concurrent_write_json_no_tmp_collision`
     (2 threads, barrier, asserts no errors + no leftover tmp files).

3. **Test drift** — `test_serve.py::test_index_serves_accessible_modular_hybrid_shell`
   asserted `<script src="/assets/js/main.js"></script>` exactly, but the app
   serves it with a `?v=` cache-buster → test failed. Relaxed to a prefix match
   (`<script type="module" src="/assets/js/main.js`).
   - `app/tests/test_serve.py`

## Minor UX notes (not bugs)

- **Edit-provider test button**: in the 5-step dialog, "Test connection" tests by
  provider id when editing with an empty key field (`providers.js:91`), so it hits
  the SAVED provider, not the newly typed URL. Saving still applies the URL.
- **Activity range**: with activity bounded to 1000 records and all recent,
  "Last 24 hours" vs "7 days" can show the same count — correct, but looks
  like the filter did nothing.

## Verification after fixes

- Unit suite: **80/80 PASS** (`python -m unittest discover -s tests`)
- `node --check` on all 21 JS files: **0 fails**
- Browser console during full re-test: **0 errors**
- Concurrent activate/deactivate (2× parallel): **200/200**, file intact, 0 tmp leftovers
- Secrets grep over system artifacts: **0 hits**

## Open questions / next

- `Next:` none — all checklist items green.
- The runbook's "Agents card on Overview" does not exist in the current UI;
  agent management lives in Providers (tabs + Manage agents → Settings) and
  the header chip. The runbook (APP_FULL_CHECK.md §3.1) should be updated to
  match the real UI in the next session.
