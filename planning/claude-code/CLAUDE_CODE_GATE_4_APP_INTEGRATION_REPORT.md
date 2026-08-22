# Claude Code Gate 4 App Integration Report

Date: 2026-08-14 (initial) / 2026-08-14 (Sol review repair) / 2026-08-14 (revision-7 repair) / 2026-08-14 (revision-7 completion repair)
Worker: DeepSeek V4 Flash Max (Effort: Max)
Lifecycle status: **Integrated, not live validated**

## 1. Status

PASS. The report was set FAIL/BLOCKED during the revision-7 completion repair
and is PASS only now that every corrected check below passes with fresh
evidence: the handoff metadata is internally consistent (title and
`**Revision:**` both 7), the report RED subsection contains four complete
standalone fenced PowerShell commands with recorded pre-fix observations, the
adapter TESTING parser set names the authorized five files including
`inspect-provider-model.ps1`, and all revision-7 checks and the fresh
regression battery match the expected results. The accepted Gate 4A
implementation is unchanged. Gate 5 remains unauthorized and unperformed.

## 2. Changed files

Gate 4A implementation and tests (accepted after three repair rounds): the
full file lists and Gate 4A created-file hashes are in
`planning/claude-code/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md` and its repair-round
updates.

Gate 4B (this gate): six files created, 29 modified, exactly per handoff
sections 3.6-3.10. The revision-7 handoff correction is a planning repair
outside the Gate 4B implementation count and is reported separately.

Created:

- `adapters/claude-code/README.md`
- `adapters/claude-code/ADAPTER.md`
- `adapters/claude-code/BUILDER_SPEC.md`
- `adapters/claude-code/TESTING.md`
- `adapters/claude-code/COMPATIBILITY.md`
- `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md` (this report)

SHA-256 of the five created adapter documents (whole-file ASCII):

- `adapters/claude-code/README.md` = `0fb46ba8b595219154ebf2c2fa9a07f3c78dd1b6ebc3f36b9881edc1a008abac`
- `adapters/claude-code/ADAPTER.md` = `8d1d25ca6e051c3893afbfe9f41d3f6b996367c6b0b75e4a9e6889a2492e4a9d`
- `adapters/claude-code/BUILDER_SPEC.md` = `1c7e2db6f84f46a63de3c344f741242bc51f019e7684389e0e6ea9a560d0b6ba`
- `adapters/claude-code/TESTING.md` = `f5b59f352e4e075f3bb609ac846cb3ab81db6f6f30a9b8a90070a3deca86fdd4`
- `adapters/claude-code/COMPATIBILITY.md` = `86219fe46b094d45c853672729f5bf73b1ac05965923a8991001db2dabc0d77c`

This report cannot contain its own final SHA-256: adding that value would
change the file and therefore its hash. The worker response carries the
SHA-256 of all six created files, including this final report.

Modified (29): `bdf/FRAMEWORK.md`, `bdf/PROJECT_ADAPTER.md`,
`bdf/AI_WORKFLOW.md`, `bdf/TESTING.md`, `bdf/BUILDER_EVOLUTION.md`,
`bdf/README.md`, `bdf/VERSION.md`, `planning/DECISIONS.md`, `README.md`,
`PROJECT_STATE.md`, `ROADMAP.md`, `ADAPTER.md`, `ARCHITECTURE.md`,
`BUILDER_SPEC.md`, `FOLDER_STRUCTURE.md`, `JSON_SCHEMAS.md`, `TESTING.md`,
`CONTRIBUTING_FOR_AI.md`, `app/README.md`, `app/engine/schemas/README.md`,
`bdf/templates/ADAPTER.template.md`, `bdf/templates/ARCHITECTURE.template.md`,
`bdf/templates/BUILDER_SPEC.template.md`,
`bdf/templates/CONTRIBUTING_FOR_AI.template.md`,
`bdf/templates/FOLDER_STRUCTURE.template.md`,
`bdf/templates/JSON_SCHEMAS.template.md`, `bdf/templates/README.template.md`,
`bdf/templates/TESTING.template.md`, `bdf/templates/README.md`.

Separate revision-7 planning repair (outside the 35-file Gate 4B count):
`planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md` (title marked
Revision 7; metadata line corrected to `**Revision:** 7`; section 17.4a
corrected to the Gate 4B documentation-only added-line ASCII rule with the
`GATE4B_DOC_ADDED_DIFF_ASCII_OK` marker; section 22 RED/GREEN evidence
clarified to require exact commands with the Gate 4A precursor report
authoritative for Gate 4A tasks; section 18 item 7 historical-decision
wording corrected to tracked-content identity and the LF-normalized block
hash).

## 3. RED/GREEN evidence (exact commands)

Each RED entry below is a complete standalone PowerShell command that a
reviewer can copy and execute independently, followed by the observed pre-fix
exit/result and failure marker. Each GREEN entry is the complete command and
its post-repair result.

RED conditions reproduced on the revision-6 state, in repair order:

1. RED (added-line ASCII): complete standalone reproduction of the exact
   revision-6 section 17.4a scan set and behavior (same allowlists, same
   per-file diff scan over `+` content lines, non-ASCII bytes counted as
   failures):

```powershell
$sourceAllowlist = @(
  'app/app/claude_adapter.py','app/app/capabilities.py','app/app/config.py',
  'app/server.py','app/engine/claude-code/claude-routing-core.psm1',
  'app/engine/claude-code/build-claude-code.ps1',
  'app/engine/claude-code/build-claude-code-production.ps1',
  'app/engine/claude-code/test-claude-code.ps1',
  'app/assets/js/core/api.js','app/assets/js/core/capabilities.js',
  'app/assets/js/core/store.js','app/assets/js/core/router.js',
  'app/assets/js/core/sidebar.js','app/assets/js/main.js',
  'app/assets/js/pages/onboarding.js','app/assets/js/pages/claude-routes.js',
  'app/assets/js/pages/provider-workspace.js','app/assets/js/pages/overview.js',
  'app/assets/js/pages/activity.js','app/assets/js/pages/settings.js',
  'app/assets/css/provider-workspace.css','app/.gitignore',
  'app/tests/test_capabilities.py','app/tests/test_claude_adapter.py',
  'app/tests/claude_routes_contract.test.mjs',
  'app/tests/capability_ui_contract.test.mjs'
)
$docAllowlist = @(
  'adapters/claude-code/README.md','adapters/claude-code/ADAPTER.md',
  'adapters/claude-code/BUILDER_SPEC.md','adapters/claude-code/TESTING.md',
  'adapters/claude-code/COMPATIBILITY.md','bdf/FRAMEWORK.md',
  'bdf/PROJECT_ADAPTER.md','bdf/AI_WORKFLOW.md','bdf/TESTING.md',
  'bdf/BUILDER_EVOLUTION.md','bdf/README.md','bdf/VERSION.md',
  'README.md','PROJECT_STATE.md','ROADMAP.md','ADAPTER.md',
  'ARCHITECTURE.md','BUILDER_SPEC.md','FOLDER_STRUCTURE.md',
  'JSON_SCHEMAS.md','TESTING.md','CONTRIBUTING_FOR_AI.md',
  'app/README.md','app/engine/schemas/README.md','planning/DECISIONS.md',
  'bdf/templates/ADAPTER.template.md','bdf/templates/ARCHITECTURE.template.md',
  'bdf/templates/BUILDER_SPEC.template.md',
  'bdf/templates/CONTRIBUTING_FOR_AI.template.md',
  'bdf/templates/FOLDER_STRUCTURE.template.md',
  'bdf/templates/JSON_SCHEMAS.template.md',
  'bdf/templates/README.template.md','bdf/templates/TESTING.template.md',
  'bdf/templates/README.md'
)
$asciiDiffFiles = $sourceAllowlist + $docAllowlist
$failed = @()
foreach ($path in $asciiDiffFiles) {
  $basePath = $path -replace '/', '\'
  if (-not (Test-Path -LiteralPath $basePath -PathType Leaf)) { continue }
  $added = git -C (Resolve-Path '.').Path diff -- $basePath 2>$null |
    Where-Object { $_ -match '^\+' -and $_ -notmatch '^\+\+\+' } |
    ForEach-Object { $_.Substring(1) }
  foreach ($line in $added) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($line)
    if ($bytes | Where-Object { $_ -gt 127 }) { $failed += $path }
  }
}
if ($failed.Count) {
  throw ("GATE4_ADDED_DIFF_ASCII_FAILED count=" + $failed.Count +
         " on: " + (($failed | Sort-Object -Unique) -join '; '))
}
'GATE4_ADDED_DIFF_ASCII_OK'
```

   Observed pre-fix result: `GATE4_ADDED_DIFF_ASCII_FAILED count=3 on:
   app/assets/js/pages/onboarding.js; app/assets/js/pages/overview.js;
   app/assets/js/pages/settings.js` (pre-Gate dirty U+2019 line; accepted Gate
   4A U+00B7 line; accepted Gate 4A U+2014 line). The revision-6 report
   instead ran a documentation-only check and waived these lines, so its
   claim that the exact section-17.4a check passes was false. Gate 4A source
   safety is governed by the accepted Gate 4A scans and evidence; the
   revision-7 rule (handoff section 17.4a) never scans the Gate 4A source
   diff for Gate 4B ASCII.

2. RED (compatibility table): complete standalone feature-table column-count
   command that observed the five-column separator failure:

```powershell
$rows = Get-Content 'adapters/claude-code/COMPATIBILITY.md'
$bad = @()
$inTable = $false
foreach ($line in $rows) {
  if ($line -match '^## Feature-by-feature results') { $inTable = $true; continue }
  if ($inTable -and $line -match '^## ') { $inTable = $false }
  if ($inTable -and $line -match '^\|') {
    $cols = ($line -split '\|').Count - 2
    if ($cols -ne 4) { $bad += ("cols=$cols : " + $line) }
  }
}
if ($bad.Count) { throw ("TABLE_COLUMN_FAILED`n" + ($bad -join "`n")) }
'TABLE_COLUMNS_OK'
```

   Observed pre-fix result: `TABLE_COLUMN_FAILED` on the separator line
   `|:---|---|---|---|---|` with `cols=5` (header row had four columns but its
   separator had five).

3. RED (TESTING paths): complete standalone command, executed from the `app`
   working directory as TESTING.md states:

```powershell
Write-Output ("OLD_PATH_EXISTS=" + (Test-Path '.\app\env\Scripts\python.exe'))
Write-Output ("CORRECTED_PATH_EXISTS=" + (Test-Path '.\env\Scripts\python.exe'))
```

   Observed pre-fix result: `OLD_PATH_EXISTS=False`, `CORRECTED_PATH_EXISTS=True` -
   TESTING.md stated commands run from `app` but used
   `& .\app\env\Scripts\python.exe`, a nonexistent path from `app`; the
   corrected path from `app` is `& .\env\Scripts\python.exe`.

4. RED (report contract): complete standalone report-contract command that
   detected zero complete executable RED commands in the revision-6 report:

```powershell
$report = Get-Content 'planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md' -Raw
$redSection = [regex]::Match($report, '(?s)RED conditions reproduced.*?(?=\nGREEN after this repair)').Value
$fence = '`' * 3
$fencedBlocks = ([regex]::Matches($redSection, '(?s)' + $fence + 'powershell[\s\S]*?' + $fence)).Count
Write-Output ("RED_SUBSECTION_FENCED_BLOCKS=" + $fencedBlocks)
if ($fencedBlocks -lt 4) { throw 'RED_CONTRACT_FAILED: fewer than four complete fenced executable RED commands' }
'RED_CONTRACT_OK'
```

   Observed pre-fix result: `RED_SUBSECTION_FENCED_BLOCKS=0`,
   `RED_CONTRACT_FAILED` - the revision-6 report contained prose and command
   fragments only, with zero complete fenced executable RED commands,
   violating handoff section 22 item 3 (a prose description or section
   reference is not an exact command).

GREEN after this repair (exact commands and markers):

- Gate 4B document added-line ASCII (revision-7 rule, 29 pre-existing
  modified documents only):

```powershell
$gate4bModifiedDocs = $docAllowlist | Where-Object {
  $_ -notlike 'adapters/claude-code/*' -and $_ -notlike 'planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md'
}
foreach ($path in $gate4bModifiedDocs) {
  $basePath = $path -replace '/', '\'
  if (-not (Test-Path -LiteralPath $basePath -PathType Leaf)) { continue }
  $added = git -C (Resolve-Path '.').Path diff -- $basePath 2>$null |
    Where-Object { $_ -match '^\+' -and $_ -notmatch '^\+\+\+' } |
    ForEach-Object { $_.Substring(1) }
  foreach ($line in $added) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($line)
    if ($bytes | Where-Object { $_ -gt 127 }) { throw "Non-ASCII added line in: $path" }
  }
}
'GATE4B_DOC_ADDED_DIFF_ASCII_OK'
```

   -> exit 0, `GATE4B_DOC_ADDED_DIFF_ASCII_OK`. The three JS source lines are
   not scanned here; they carry accepted Gate-4A or pre-Gate dirty non-ASCII
   that Gate 4B is forbidden to edit, per the revision-7 baseline rule.

- Whole-file ASCII of the six Gate 4B-created files (all six, including this
  report, verified byte-by-byte with `[IO.File]::ReadAllBytes`):
  `WHOLE_FILE_ASCII_OK`, every file reports `non-ASCII bytes = 0`.
- Compatibility table columns: after `|---|---|---|---|---|` -> `|---|---|---|---|`,
  the column-count check reports every feature-table row at exactly four
  columns: `TABLE_COLUMNS_OK`.
- TESTING paths: from the `app` directory,
  `Test-Path .\env\Scripts\python.exe` -> `True`; focused/full Python commands
  now read `& .\env\Scripts\python.exe` and were executed from `app` with the
  recorded exits and counts in section 4.
- Report-contract check: the RED-4 command above now reports
  `RED_SUBSECTION_FENCED_BLOCKS=4` and `RED_CONTRACT_OK` (four complete
  fenced executable RED commands, one per RED finding); this section contains
  all required fields, adapter hashes (section 2), and exact GREEN commands
  and markers.

## 4. Tests run (exact commands, exits, counts)

Fresh run in this repair, repository root unless noted:

- Gate 2: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1` -> exit 0, `Summary: 51 passed, 0 failed`.
- Gate 3: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe C:\Users\loveb\.config\opencode\docs\app\env\Scripts\python.exe` -> exit 0, `OVERALL PASS - Gate 3 provider/model evidence` (25 criteria tests).
- OpenCode: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1` -> exit 0, `Tests: 34/34 Passed`.
- Kilo: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1` -> exit 0, `Tests: 32/32 Passed`.
- Focused Gate 4A Python (app dir): `& .\env\Scripts\python.exe -m unittest tests.test_claude_adapter tests.test_capabilities` -> OK, `Ran 87 tests` (79 adapter + 8 capability).
- Focused frontend (app dir): `node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs` -> `tests 21, pass 21, fail 0`.
- Full Python (app dir): `& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"` -> `Ran 171 tests`, `FAILED (failures=2)` - only the two established unrelated preference baseline failures, zero deprecation warnings.
- Full frontend (app dir): `node --test ".\tests\*.test.mjs"` -> `tests 100, pass 99, fail 1` - only the established unrelated onboarding-copy baseline failure.
- PowerShell parser checks (five files, `[System.Management.Automation.Language.Parser]::ParseFile` on
  `app/engine/claude-code/claude-routing-core.psm1`,
  `app/engine/claude-code/build-claude-code.ps1`,
  `app/engine/claude-code/build-claude-code-production.ps1`,
  `app/engine/claude-code/inspect-provider-model.ps1`,
  `app/engine/claude-code/test-claude-code.ps1`) -> five `PARSE_OK`.
- `git diff --check` -> exit 0.

Accepted unrelated baseline (recorded, unedited, distinct from Gate 4): two
`test_preferences` browser-default expectation failures and one
`frontend_review` onboarding model-copy failure.

## 5. Harness adaptation record

Before-list of the 43 preserved Gate 2 test names (every original intent
remains represented in the adapted harness):

`G2-1 preservation fixture shape; G2 safety non-temp root; G2 safety escaped path before probe; G2 safety forbidden suffix; G2 safety forbidden state filename; G2 safety missing target; G2 safety reparse ancestor rejected before descendant probe; G2-2 API key semantic patch and lower bound; G2-3 auth token semantic patch and upper bound; G2-4 middle compact and all policy flags absent; G2 schema is authoritative; G2 supported contract verifier rejects corrupt policy output; G2 replacement bookkeeping is conservative; G2 replacement boundary cleanup failure restores target; G2 validation malformed routing; G2-5 malformed settings; G2-5 duplicate keys; G2-5 escaped equivalent duplicate keys; G2 validation unsupported target; G2 validation unknown routing property; G2-5 unsupported scope; G2-3 both auth; G2-3 neither auth; G2 validation bad secret ref; G2 validation missing secret; G2-5 invalid URL relative; G2 validation invalid URL scheme; G2 validation URL userinfo; G2 validation URL query; G2-5 invalid model whitespace; G2 validation model wrong type; G2 validation model source; G2-4 compact below; G2-4 compact above; G2-4 compact decimal; G2-4 compact string; G2-5 recovery routing-api-key.json AfterBackup; G2-5 recovery routing-api-key.json AfterTempWrite; G2-5 recovery routing-api-key.json AfterReplace; G2-5 recovery routing-auth-token.json AfterBackup; G2-5 recovery routing-auth-token.json AfterTempWrite; G2-5 recovery routing-auth-token.json AfterReplace; G2 static source safety`

The 8 named new tests (handoff section 4.4, no worker discretion):

`G2-6 wrapper imports shared core; G2-6 wrapper CLI contract preserved; G2-6 wrapper temp boundary preserved; G2-6 core module static safety; G2-6 wrapper mutant references core safely; G2-6 core verify-contract seam rejects corrupt output; G2-6 core replacement bookkeeping is conservative; G2-6 core boundary cleanup failure restores target`

Fixed final result: 51/51, exit 0, no conditional count language.

## 6. Capability evidence

Centralized in `app/app/capabilities.py` and `app/assets/js/core/capabilities.js`:

- OpenCode and Kilo capabilities: `providerMode` multi-provider,
  `requestAnalytics` true, `routingActivity` false, `builderAvailable` true.
- Claude capabilities: `providerMode` scalar-route, `savedRoutes` true,
  `providerCreation` false, `providerActivation` false, `pluginsManaged`
  false, `mcpManaged` false, `integrationsVisible` false,
  `reasoningFormats` false, `sdkSelection` false, `profilesMode`
  routing-profiles, `requestAnalytics` false, `routingActivity` true,
  `builderAvailable` false.
- Canonical identity mapping: `opencode -> opencode`, `kilo -> kilo`,
  `kilocode -> kilo`, `claudecode -> claude-code`, `claude-code ->
  claude-code`. Persisted legacy `claudecode` entries are supported through
  the alias without rewriting or losing the entry.
- Adaptive-page tests: `capability_ui_contract.test.mjs` items 59-70
  (matrix resolution, label swap, hidden Integrations, discovery-gated
  Claude card, stale-direct-URL redirect, Overview/Activity/Settings
  adaptation, OpenCode/Kilo regression, hidden/blocked Build).
- First-render race tests (item 69) and agent-switching tests (items 60-61).

## 7. Correction evidence

- No clear-applied-route endpoint, action, or event type exists; a request to
  `/api/claude/routes/clear` returns 404 (test item 18).
- Applied-config fingerprint: `appliedRouteConfigSha256` derived per route
  response as `configSha256`, set atomically with `appliedRouteId`; stability
  tests prove identical managed config yields the same fingerprint, any
  managed-field change yields a different fingerprint, and `name`/`id`/
  `createdAt`/`updatedAt` never affect it (test items 23-24).
- Route-store-plus-activity rollback transaction: create/edit/delete commit
  two files under the adapter lock with rollback-backed verification;
  failure-injection tests cover activity write and activity rollback (test
  items 26, 34).

## 8. Security, status, source, and doc scan markers

- Source scan (handoff section 17.3, exact source allowlist): `GATE4_SOURCE_SCAN_OK`.
- Whole-file ASCII, six Gate 4B-created files (including this report): all zero non-ASCII bytes (`WHOLE_FILE_ASCII_OK`).
- Gate 4B document added-line ASCII (handoff section 17.4a revision-7 rule,
  scanning only the 29 pre-existing files modified by Gate 4B):
  `GATE4B_DOC_ADDED_DIFF_ASCII_OK`. The three JS source files
  (`onboarding.js`, `overview.js`, `settings.js`) contain accepted Gate-4A or
  pre-existing non-ASCII in lines Gate 4B is forbidden to modify; the
  revision-7 rule never scans the Gate 4A source diff for Gate 4B ASCII, and
  those lines were not normalized.
- Documentation scan (line-based lifecycle validation, handoff section 17.5):
  the exact phrase `Integrated, not live validated` is allowed; affirmative
  `Supported`/`Production ready`/`Live validated` status lines are rejected;
  negative and historical statements pass.
- Adapter five-file check (handoff section 17.6): all five documents exist
  with the exact lifecycle phrase, evidence date 2026-08-14, and document
  version 1.0; the adapter README lists all five document versions.
- No literal real user paths or secret patterns in Gate 4B files. No Gate 4B
  addition introduces positive `.jsonc` handling; protected-state names
  (plugins, marketplaces, MCP, skills, sessions, credentials, prompts,
  transcripts) appear only in allowed negative safety statements, and the
  Gate 4A source scan (section 17.3) continues to enforce the concatenated
  protected-name rule for source.
- Dual real-target locks: HTTP-layer `ALLOW_REAL_CLAUDE_TARGET = False` and
  the PowerShell-layer real-profile rejection are both documented in
  `adapters/claude-code/ADAPTER.md` and unchanged; Gate 4 never passes
  `-AllowRealTarget`. Host/Origin protection and fixture-only execution are
  proven by the Gate 4A adapter tests.

## 9. Framework and template synchronization

- Framework version 2.2.11 -> 2.3.0 (minor: additive adapter categories).
  Consistent across `bdf/VERSION.md` (current block 2.3.0, `## Version 2.3.0`
  history, Version History row 2.3.0, Compatibility table Framework Version
  2.3.0 with the "Unique agent adapters" compatible-project entry),
  `PROJECT_STATE.md` (Current framework version 2.3.0), and `bdf/README.md`
  (unique-adapter summary linking the generic contracts, including the
  `bdf/VERSION.md` 2.3.0 change history).
- Generic BDF documents (G1-G7) gained neutral adapter categories,
  capability-driven unique-adapter layers, and fixture/integration/live
  evidence gates; target-specific paths were removed from the generic 2.3.0
  summary; historical statements remain historical.
- Templates (M1-M8) mirror the generic paired-project structure with no
  target-specific paths, setting names, environment variables, versions, or
  support claims; `bdf/templates/README.md` inventory and cross-reference
  matrix updated. M1-M9 target-neutrality check passed.
- No app/project release was created; release-owned files are untouched.

## 10. PROJECT_STATE regeneration evidence

- Manual regeneration preserving the exact 15-section template structure.
- All 15 exact headings present once; zero `{{...}}` placeholders
  (`PROJECT_STATE_15_SECTIONS_OK`).
- Repository-bounded backticked-path check passes with the original regex
  (`PROJECT_STATE_PATHS_OK`); the generic notation `adapters/<agent>/` is
  non-path prose, not a backticked literal path.
- Generated release/version regions and existing generated version rows
  preserved (no release occurred).

## 11. Historical-decision and release-registry integrity

- `planning/DECISIONS.md` carries the dated 2026-08-14 narrow-reversal entry
  placed before the document footer; the footer remains the footer.
- `git diff --unified=0 -- planning/DECISIONS.md` proves the only tracked
  change is the appended 2026-08-14 block: 30 insertions at the document
  tail, zero deletions. The 2026-08-08 entry is tracked-content identical to
  HEAD. Reproducible LF-normalized block hash (UTF-8 read, entry heading
  through the Reversal line, lines joined with LF, no trailing newline):
  `2ac7962441da2ba07ef0585d14f79b1715a7078887ae21466fe261f7b02c01dd`.
  Working-tree bytes are not claimed byte-identical to the HEAD blob; the
  tracked-content identity and the LF-normalized hash above are the evidence.
  The previously claimed value
  `A650BD5A12736451912F914097488C226E21779DF14EF5A18443774513FBEC78` could
  not be reproduced from any byte definition of the block or file and is
  withdrawn.
- `release_registry.json` has no tracked diff (byte-identical to HEAD).

## 12. Rollback state, restore disclosure, and recovery

Disclosure (required by the review): the earlier Gate 4B run's own report
stated that after a PowerShell ANSI round-trip corrupted UTF-8 bytes in
modified documents, tracked files were restored from HEAD and byte-safe edits
were re-applied. That is a restore-from-HEAD action, so the earlier report's
claim that no restore was performed was contradictory and is withdrawn. The
handoff no-restore rule (section 21.3) was therefore not followed in that
incident. The exact command used is not recorded in this repository. The
integrity evidence available for the current state: every unchanged (context)
line of all 29 modified Gate 4B files is byte-identical to its HEAD blob
(verified by diff-based comparison), all Gate 4B-added lines are ASCII, the
only tracked `planning/DECISIONS.md` change is the appended 2026-08-14 block,
and `git diff --check` exits 0.

During this repair, no repository rollback was needed. No commit, stage,
reset, clean, checkout, `git restore`, or revert was performed; only surgical
text edits were made.

## 13. Failures

- No failures remain beyond the accepted unrelated baseline (two preference
  tests, one onboarding-copy test) and the three JS source lines carrying
  accepted Gate-4A/pre-existing non-ASCII that Gate 4B is forbidden to edit.

## 14. Risks and limitations

- Residual hard-failure evidence condition from Gate 4A repair rounds (an
  injected deletion failure preserves exactly the verified evidence file).
- Formatting normalization is an acknowledged limitation; only parsed
  semantic preservation is claimed.
- Runtime precedence and live reload remain unvalidated until Gate 5.
- Deferred BDF documents (not edited): `bdf/BLUEPRINT_ENGINE.md`,
  `bdf/PROJECT_GENERATOR.md`, `bdf/NEW_PROJECT_GUIDE.md`, `bdf/MIGRATION.md`,
  `bdf/FRAMEWORK_LIFECYCLE.md`, `bdf/BUILDER_PHASES.md`,
  `bdf/RELEASE_MANAGER.md`, `bdf/LESSONS_LEARNED.md`, plus
  `ROADMAP.template.md` and `PROJECT_STATE.template.md`.

## 15. Status wording and Gate 5 statement

This report uses **Integrated, not live validated** and explicitly states
that Gate 5 (approved live validation against a real Claude installation,
passing `-AllowRealTarget`) is unauthorized and unperformed. No real Claude
state was accessed; both real-target locks remain closed; no release was
created; no commit or staging occurred during this repair.
