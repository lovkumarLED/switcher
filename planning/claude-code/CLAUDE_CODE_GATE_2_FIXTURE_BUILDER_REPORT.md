# Claude Code Gate 2 Fixture Builder Report

## Status

PASS. The fixture-only Gate 2 contract passed in isolated temporary directories.

## Gate matrix

| Gate | Status | Evidence |
|---|---|---|
| G2-1 | PASS | `G2-1 preservation fixture shape` |
| G2-2 | PASS | API-key/auth-token patch tests; authoritative schema; complete supported-contract verifier mutation test |
| G2-3 | PASS | API-key/auth-token success, both/neither rejection, and all-marker output redaction tests |
| G2-4 | PASS | Compact type/bounds plus lower/middle/upper and complete policy presence/value/absence verification |
| G2-5 | PASS | Malformed inputs, decoded escaped duplicate, reparse ancestor, replacement boundary, and six auth/recovery matrix tests |

## Changed files

- `app/engine/claude-code/build-claude-code.ps1`
- `app/engine/claude-code/test-claude-code.ps1`
- `app/engine/claude-code/fixtures/settings-preservation.json`
- `app/engine/claude-code/fixtures/routing-api-key.json`
- `app/engine/claude-code/fixtures/routing-auth-token.json`
- `app/engine/claude-code/fixtures/settings-malformed.json`
- `app/engine/claude-code/fixtures/settings-duplicate-key.json`
- `app/engine/schemas/claude-code-routing.schema.json`
- `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md`

## Tests run

- Initial RED Task 1 command: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1` -> exit 1; 0 passed, 2 failed because the builder was absent and the initial fixture assertion exposed a test defect. The test defect was corrected before implementation.
- Initial RED Tasks 2-4 command: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1` -> exit 1; 4 passed, 27 failed. Later focused RED runs showed 28 passed/3 failed and 33 passed/1 failed before minimal fixes.
- Review reproduction command for a temporary-root junction fixture invoked `build-claude-code.ps1` through the junction -> nested builder exit 0 and one backup, reproducing the reparse defect.
- Review reproduction command using a temporary settings object with decoded-equivalent keys -> nested builder exit 0 and one backup, reproducing the escaped duplicate defect.
- Review reproduction command using a temporary schema whose target enum could not match -> nested builder exit 0, reproducing ceremonial schema parsing.
- Review RED command: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1` -> exit 1; 34 passed, 5 failed: reparse ancestor, decoded escaped duplicate, authoritative schema, complete supported-contract verification, and conservative replacement bookkeeping.
- Review GREEN Gate 2 command: `$evidenceLog=Join-Path ([IO.Path]::GetTempPath()) ('bdf-claude-gate2-evidence-'+[guid]::NewGuid().ToString('N')+'.log'); & powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1 2>&1 | Tee-Object -FilePath $evidenceLog` -> exit 0; 43 passed, 0 failed.
- OpenCode regression: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1` -> exit 0; 34/34 passed.
- Kilo regression: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1` -> exit 0; 32/32 passed.
- Builder parser: `powershell.exe -NoProfile -Command '$e=$null;[void][Management.Automation.Language.Parser]::ParseFile((Resolve-Path ".\app\engine\claude-code\build-claude-code.ps1"),[ref]$null,[ref]$e);if($e.Count){$e|ForEach-Object Message;exit 1}'` -> exit 0.
- Harness parser: `powershell.exe -NoProfile -Command '$e=$null;[void][Management.Automation.Language.Parser]::ParseFile((Resolve-Path ".\app\engine\claude-code\test-claude-code.ps1"),[ref]$null,[ref]$e);if($e.Count){$e|ForEach-Object Message;exit 1}'` -> exit 0; `PARSER_CHECKS_OK`.
- Fixture/schema parse, malformed rejection, unconditional lexical duplicate count, and ASCII command -> exit 0; `FIXTURE_JSON_DUPLICATE_ASCII_OK`.
- Source/evidence prohibited-pattern command -> exit 0; `STATIC_SAFETY_OK`; the exact captured evidence log was removed and produced `EVIDENCE_CLEANUP_OK`.

## Transaction evidence

- Backup pattern: target-directory `settings.backup.<UTC timestamp>.<GUID>.json`; tests verified one retained backup and original-byte hash equality.
- Temporary pattern: target-directory `.bdf-transaction-<GUID>.tmp`; tests verified no stale transaction temporary file.
- Replacement uses Windows PowerShell 5.1 `[System.IO.File]::Replace` for an existing target. Restore copies backup bytes to a same-directory restore temporary file and atomically replaces the target.
- Temporary and final documents are reopened, duplicate-scanned, parsed, and semantically verified.
- `AfterBackup`, `AfterTempWrite`, and `AfterReplace` were each run for API-key and bearer-token profiles. All six returned nonzero, retained a valid backup, restored/kept a parseable original-hash target, removed transaction temporary files, and reported `RECOVERY VERIFIED` without any of the three marker classes.
- A focused mutation injected failure after successful atomic replacement but before discard cleanup. Conservative pre-replacement bookkeeping caused verified restoration.

## Safety evidence

- No real Claude path, state file, commented-JSON file, network endpoint, app integration, gateway process, or live Claude process was probed or accessed.
- All builder targets were constrained below GUID fixture roots under the system temporary root. Repository fixtures were copied and never patched in place.
- Builder/harness/schema/fixture sources and captured evidence passed ASCII and prohibited-pattern scans. Captured builder output contained no fake secret value.
- Focused duplicate evidence proved rejection before mutation, backup, or temporary output.
- Reparse-component tests proved a junction ancestor below the temporary root is rejected before target backup or mutation.
- Duplicate scanning decodes JSON string escapes and tracks keys independently per object scope before deserialization.
- The adapter schema is now authoritative for the supported PowerShell 5.1 subset and is followed by explicit semantic validation.

## Failures

- Expected RED failures are listed under Tests run.
- During implementation, `[System.IO.File]::Replace` rejected a null backup-name argument on this Windows PowerShell 5.1 runtime. A same-directory disposable backup-name argument fixed the issue; all transaction and recovery tests then passed.
- One verification command was initially quoted incorrectly and failed in the command parser before reading fixtures. It was rerun correctly and passed.
- All injected post-backup failures completed verified recovery. No recovery failure occurred.
- Independent review defects were reproduced before fixes: junction target accepted, decoded-equivalent duplicate accepted with backup, and contradictory schema accepted. Focused RED evidence then showed five failing review tests; final GREEN showed 43/43.

## Risks/concerns

- PowerShell 5.1 lacks native JSON Schema validation and modern JSON APIs; the builder implements the repository-supported `type`, `required`, `properties`, `additionalProperties`, `items`, and `enum` subset, then applies explicit semantic validation.
- JSON serialization normalizes formatting, property layout, and encoding; only parsed semantic preservation is claimed.
- Atomic replacement was proven for existing fixture files on the tested Windows filesystem. Other filesystems and concurrent external writers remain unproven.
- No gateway, Claude runtime, real configuration, or effective settings precedence was tested.

## Remaining work

- No known Gate 2 gap remains in the authorized fixture contract.
- Gates 3, 4, and 5 remain unauthorized and unperformed.

## Git state

- Worktree: `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures`
- Branch: `claude-gate2-fixtures`
- Final `git status --short --branch`: branch header `## claude-gate2-fixtures`; untracked groups are `app/engine/claude-code/`, `app/engine/schemas/claude-code-routing.schema.json`, and this report. Expanded `git ls-files --others --exclude-standard` listed exactly the nine authorized paths and no unrelated path.
- No commit was created.
