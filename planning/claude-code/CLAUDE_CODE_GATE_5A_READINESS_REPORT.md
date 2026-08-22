# Claude Code Gate 5A Read-Only Readiness Report

Worker: DeepSeek V4 Flash Max (Effort: Max)
Date: 2026-08-14
Lifecycle status: **Integrated, not live validated**

## 1. Status

BLOCKED. The only readiness blocker is `NO_SAVED_ROUTES`: the route store
target is absent, so no route exists to assess or select for a future live
test. Per handoff section 8.3, an absent route store yields `NO_SAVED_ROUTES`
and Gate 5A result `BLOCKED`; the store was not created. All other readiness
items were measured read-only and are recorded below. Nothing was written,
changed, stopped, launched, or contacted.

## 2. Scope and authorization

Gate 5A read-only readiness only. Gate 5B (snapshot, process shutdown, real
apply, disposable Claude session, restore) and Gate 5C (documentation/status/
release synchronization) are NOT authorized and were not planned or
performed. No real-state write, copy, rename, delete, ACL change, timestamp
change, lock acquisition, process stop/signal/launch, HTTP call, gateway
contact, or `-AllowRealTarget` occurred. Both real-target locks remain
closed.

## 3. Repository baseline

- Branch: `main`.
- Modified files: 48 (30 Markdown/template, 18 other).
- Untracked files: 37.
- `git diff --check`: exit 0.
- `git status --short -- app/state`: not visible (empty output).
- No unrelated filenames reproduced here.

## 4. Target manifest

Label-keyed rows only; no paths, values, or excerpts.

| Label | Exists | Type | Bytes | SHA-256 |
|---|---|---|---|---|
| `USER_SETTINGS` | Yes | Regular file, no reparse | 1405 | `5e1925c72d5a3b783a9413cf32ac5412fe28115fbe4e1a0a45928369aac7c501` |
| `OPAQUE_STATE` | Yes | Regular file, no reparse | 51994 | `9dd81d4307c1deecc5beed5d83b2b8b68821659ba81c9084f0b1df827411b0c1` |
| `PROFILE_LOCAL` | Yes | Regular file, no reparse | 27 | `0fe84d03b8ed583db473f6815d63b80fc7dba01fe4fb064344bb2b731d3dee62` |
| `WORKSPACE_PROJECT` | No | ABSENT | - | - |
| `WORKSPACE_LOCAL` | No | ABSENT | - | - |
| `WORKSPACE_MCP` | No | ABSENT | - | - |
| `ROUTE_STORE` | No | ABSENT | - | - |
| `BACKUP_MANIFEST` | No | ABSENT | - | - |
| `ACTIVITY_LOG` | No | ABSENT | - | - |

`OPAQUE_STATE` was accessed only for existence, type, byte size, and
whole-file SHA-256; its contents were never opened, parsed, copied,
enumerated, or scanned. All present targets are regular files with no reparse
component.

Claude version probe: `claude --version` -> exit 0, `2.1.153 (Claude Code)`,
non-interactive, no session or authentication started.

## 5. Settings structural readiness

`USER_SETTINGS` (in-memory only, bytes read once, strict UTF-8 decode, no
helper file, no implementation imported against the real path):

- Parseable: True.
- Root is object: True.
- Top-level key count: 9.
- Duplicate-key status: PASS (decoded-equivalent top-level keys compared
  in memory; total equals unique count).

No key name, value, type, excerpt, or nested count was emitted.

## 6. Route readiness

- Total routes: 0.
- Structurally valid routes: 0.
- Routes with a present secret reference: 0.
- Loopback / non-loopback routes: 0 / 0.
- Ready candidates: 0.
- Applied route: none.
- Applied fingerprint match: not applicable.

Result: `NO_SAVED_ROUTES` -> Gate 5A BLOCKED. The store was not created and
no route was selected. If a route store is later populated, the user must
privately select the single route for Gate 5B; the worker will not choose.

## 7. App-state invariants

- `BACKUP_MANIFEST`: ABSENT (allowed before first apply; nothing to
  validate).
- `ACTIVITY_LOG`: ABSENT (allowed before first apply; nothing to validate).

No backup file was opened or hashed.

## 8. Process readiness

Fixed executable labels and counts only; no PIDs, owners, paths, windows,
command lines, or arguments:

| Process label | Count |
|---|---|
| `claude` | 8 |
| `Code` | 21 |
| `Cursor` | 0 |
| `Windsurf` | 0 |
| `idea64` | 0 |
| `pycharm64` | 0 |

Positive counts for `claude` and `Code` mean a future Gate 5B handoff MUST
include a user-visible process-stop checkpoint before any real write. Nothing
was stopped, suspended, signalled, launched, or attached.

## 9. Snapshot feasibility

- Required bytes (only `USER_SETTINGS` is present; route store, manifest,
  and activity log are absent): 1405.
- System temporary root: exists, directory type, no reparse component.
- Available free bytes on the temporary root volume: 135447674880.
- Threshold (10x required + 1 MiB): 1062626.
- `SNAPSHOT_FEASIBLE`: True.

No snapshot, directory, or file was created; `OPAQUE_STATE`, `PROFILE_LOCAL`,
project/local settings, and MCP remain hash-only never-copy boundaries.

## 10. Tests run

Exact commands, exits, and counts (repository/temporary-fixture scope only;
no real Claude target access):

- Gate 2: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1` -> exit 0, 51/51.
- Gate 3: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe C:\Users\loveb\.config\opencode\docs\app\env\Scripts\python.exe` -> exit 0, `OVERALL PASS`, 25 criteria tests. Note: the harness contract rejects a relative `-PythonExe` ("PythonExe must be absolute"); the absolute form is the Gate 3/4 accepted evidence form.
- OpenCode: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1` -> exit 0, 34/34.
- Kilo: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1` -> exit 0, 32/32.
- Focused Python (app dir): `& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest tests.test_claude_adapter tests.test_capabilities` -> exit 0, Ran 87 tests, OK.
- Focused frontend (app dir): `node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs` -> exit 0, 21/21.
- Full Python (app dir): `& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"` -> Ran 171 tests, failures=2, only the two established unrelated `test_preferences` baseline failures.
- Full frontend (app dir): `node --test ".\tests\*.test.mjs"` -> 100 tests, 99 pass, 1 fail, only the established unrelated onboarding-copy baseline failure.

All counts match the accepted Gate 2-4 evidence exactly; no new failure and
no lower passing count.

## 11. Pre/post integrity

Equality by fixed label (pre-read values vs post-read recomputation):

- `USER_SETTINGS`: bytes 1405, SHA-256 identical, EQUAL.
- `OPAQUE_STATE`: bytes 51994, SHA-256 identical, EQUAL.
- `PROFILE_LOCAL`: bytes 27, SHA-256 identical, EQUAL.
- `WORKSPACE_PROJECT`, `WORKSPACE_LOCAL`, `WORKSPACE_MCP`, `ROUTE_STORE`,
  `BACKUP_MANIFEST`, `ACTIVITY_LOG`: absent before and after, EQUAL.
- No new file exists beside any exact real-state target.
- No snapshot directory was created (temporary root snapshot-like entries: 0).
- No Claude/IDE process count was changed by the worker.
- `ALLOW_REAL_CLAUDE_TARGET = False` unchanged in `app/app/claude_adapter.py`.
- No command line contained `-AllowRealTarget`.
- Repository changes are exactly the pre-existing dirty state plus this one
  Gate 5A report; `git diff --check` exit 0; `app/state` not visible in Git
  status.

## 12. Privacy attestation

No secret value, private value, route detail, process detail, environment-
variable name, settings value, JSON excerpt, user name, or absolute real-state
path entered any command output or this report. `OPAQUE_STATE` was never
opened or parsed. Directory enumeration was not performed; only the exact
paths in the handoff's section 5 were resolved. No output was redirected and
no temporary script was created. No prohibited output occurred, so no stop
condition of that kind was triggered.

## 13. Failures, risks, and blockers

- Blocker (redacted): `NO_SAVED_ROUTES` - the route store target is absent;
  zero ready candidates exist. Gate 5A is BLOCKED per handoff section 8.3.
  The store was not created and nothing was repaired; readiness is recorded
  for Sol.
- Risk: positive process counts (`claude` 8, `Code` 21) require a
  user-visible process-stop checkpoint in any future Gate 5B handoff.
- Risk: handoff section 9's Gate 3 command form (relative `-PythonExe`) is
  rejected by the harness contract, which requires an absolute path; the
  absolute form was used and matches the accepted Gate 3/4 evidence.
- No other failures observed.

## 14. Gate 5B recommendation

BLOCKED - `NO_SAVED_ROUTES`. Not ready for user route selection until a route
store exists (populated only by a separately authorized flow; Gate 5A never
creates it). This recommendation grants no authorization: Gate 5B and Gate 5C
remain unauthorized, no real write may occur, and no lock may be changed
until a new explicit, human-approved Gate 5B handoff exists.
