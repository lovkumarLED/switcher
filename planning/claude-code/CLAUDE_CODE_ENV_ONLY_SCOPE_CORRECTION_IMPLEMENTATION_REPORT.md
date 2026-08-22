# Claude Code Env-Only Scope Correction Implementation Report

Worker: DeepSeek V4 Flash Max (Effort: Max)
Date: 2026-08-14
Lifecycle status: **Integrated, not live validated**

## 1. Status

PASS. The approved settings-only scope correction is implemented and verified:
the shared routing core surgically patches only the top-level `env` object of
`.claude/settings.json` with exact character-span edits, top-level `model` and
every unrelated byte are preserved, the four curated compatibility options
keep their official semantics, the discovery/nonessential conflict is rejected
in schema/core/API/UI before any mutation, the app gains an advisory
explicit-confirmation compatibility assistant, and all required RED/GREEN
evidence, harnesses, regressions, and static scans pass with the fresh counts
below.

## 2. Authorization and exclusions

Gate 4B-scope implementation authorization only. No real Claude state, real
Git-ignored `app/state`, FCC binary, `.local\bin`, gateway, DNS, HTTP, server,
or Claude command was accessed; both real-target locks remain closed and no
`-AllowRealTarget` was added. No commit, stage, reset, clean, checkout,
restore, revert, push, amend, or worktree occurred. No subagents, Graphify,
screenshots, transcripts, or secrets. Gate 5B and Gate 5C remain unauthorized.

## 3. Approved design hash

`4B4F2BD46153C8F229479A4B785C14728586DA49EF36BDE94E71412C326E66AF` - verified
exact before any edit.

## 4. Files created/modified

Modified (in scope):

- `app/engine/claude-code/claude-routing-core.psm1` (version 0.2.0; surgical
  env-only patcher).
- `app/engine/schemas/claude-code-routing.schema.json` (model.source enum
  `environment`; `autoCompactWindow` integer; Draft-07 allOf/not conflict
  constraint).
- `app/engine/claude-code/fixtures/routing-api-key.json` and
  `routing-auth-token.json` (model.source -> `environment`).
- `app/engine/claude-code/test-claude-code.ps1` (14 new env-only RED tests;
  updated model assertions; updated invalid-source case).
- `app/engine/claude-code/test-provider-model.ps1` (route-profile source
  semantics corrected to `environment`; precedence expectations updated to the
  env-only contract).
- `app/app/claude_adapter.py` (conflict rejection; `_routing_profile` source
  `environment`).
- `app/tests/test_claude_adapter.py` (8 new focused tests; core version and
  apply assertions updated).
- `app/assets/js/pages/claude-routes.js` (compatibility assistant,
  `recommendClaudeCompatibility`, confirmation guard, conflict UI).
- `app/assets/css/provider-workspace.css` (scoped assistant CSS + mobile).
- `app/tests/claude_routes_contract.test.mjs` (14 new assistant tests).
- Five adapter documents (version 0.2.0, env-only scope, surgical behavior,
  corrected live-test semantics, Gate 5B.4 historical note).

Created: `planning/claude-code/CLAUDE_CODE_ENV_ONLY_SCOPE_CORRECTION_IMPLEMENTATION_REPORT.md`
(this report).

No other path was modified. Gate 5B.4 and all prior handoffs/reports remain
immutable historical evidence.

## 5. RED evidence (named failures before GREEN)

Task 1 (core/schema) - named failing tests added first; the first harness run
failed the new cases plus the pre-existing full-document serializer behavior:

- `G2-7 env-only model precedence` (failed: top-level model was being written)
- `G2-7 root bytes preserved` (failed: document re-serialized)
- `G2-7 unmanaged env bytes preserved` (failed: re-serialization changed bytes)
- `G2-7 existing managed replacements surgical` (failed)
- `G2-7 missing managed insertions surgical` (failed)
- `G2-7 missing env insertion surgical` (failed)
- `G2-7 disabled-option removal surgical` (failed)
- `G2-7 opposite auth removal surgical` (failed)
- `G2-7 UTF-8 BOM preserved` (failed)
- `G2-7 LF CRLF indentation and trailing-newline forms preserved` (failed)
- `G2-7 conflict rejected before backup` (failed: conflict was not rejected)
- `G2-7 top-level model corruption detected` (failed: model corruption was
  not detected by the unsupported snapshot)
- `G2-7 unmanaged-byte corruption detected` (failed)
- `G2-7 no full-document serializer` (failed: `ConvertTo-Json -Depth 100`
  pipeline present)

Task 3 (adapter): new focused tests were RED against the old implementation
(no conflict rejection, `model.source` was `settings`, apply wrote top-level
`model`); the first focused Python run showed the failures before GREEN.

Task 4 (frontend): `recommendClaudeCompatibility` did not exist; assistant
tests were RED until the pure function, fieldset, confirmation guard, and
conflict UI were implemented.

All tests were then run to GREEN without weakening any assertion.

## 6. Surgical patch implementation and required interface evidence

Implemented inside `claude-routing-core.psm1` (no new module):

- `Read-SettingsDocument` - reads bytes once; strict UTF-8 with BOM
  detection; parses; reports `RawText`, `ParsedObject`, `HasUtf8Bom`,
  `LineEnding` (LF/CRLF/NONE), `HasTrailingNewline`, `OriginalBytes`.
- `Get-SettingsJsonLayout` - recursive lexical scanner recording character
  spans for root members, the top-level `env` object, its direct members,
  string/value tokens, commas, and braces; strings/escapes/nested
  containers skipped correctly; duplicate-key rejection retained.
- `ConvertTo-JsonStringLiteral` - serializes exactly one JSON string token
  with a round-trip check.
- `New-SettingsEnvEdits` - computes validated edit objects
  (`Start`, `Length`, `Replacement`, `ManagedName`); replacements touch only
  value-token spans; removals choose deterministic minimal member/comma
  spans (member + following separator, or preceding separator + member, or
  sole-member body); insertions precede the `env` closing brace with
  matching indentation/comma style; a missing top-level `env` is inserted
  using root member/comma rules; adjacent removals coalesce.
- `Apply-SettingsTextEdits` - bounds, unique-name, and non-overlap checks;
  applies in descending `Start` order.
- `Assert-SettingsTextPreserved` - reconstructs the expected text from the
  original plus edits and requires exact ordinal equality with output; every
  unchanged segment between edits must match exactly.
- `Write-NewBytes` / `New-SettingsOutputBytes` - byte output preserving the
  original BOM choice.
- `ConvertFrom-SettingsText` - reparse helper for the surgical output.

The full-document line `$settingsDoc.Object | ConvertTo-Json -Depth 100` was
removed; the apply pipeline now produces output bytes only through the
surgical edit pipeline. `Validate-Inputs` no longer adds an empty `env`
object; validation inspects an existing `env` or accepts absence, and the
surgical patcher is the only creator. `CLAUDE_ROUTING_CORE_VERSION` is
`0.2.0`. Backup, atomic replace, output JSON, restore, failure injection, and
redaction contracts are unchanged.

## 7. Byte-preservation matrix

All verified on fixture files under GUID temporary roots:

- Top-level `model` byte/value unchanged: PASS.
- Unusual root spacing, property order, numeric token spelling (`1e2`,
  `0.50`), escaped string spelling (`"\u0061\u0062"`), and nested formatting:
  byte-exact PASS.
- Unmanaged direct `env` property with unusual whitespace/escaping:
  byte-exact PASS.
- Existing managed string values: only their value-token ranges changed.
- Missing managed keys: inserted without reordering existing members.
- Missing top-level `env`: inserted while every existing root-property byte
  stayed unchanged.
- Disabled option removal: only the disabled member plus the minimum
  delimiter/adjacent whitespace removed.
- Opposite auth removal: every unrelated env member preserved.
- UTF-8 BOM: preserved (EF BB BF prefix verified after apply).
- LF, CRLF, indentation, and trailing-newline forms: each preserved exactly
  (subcase matrix PASS).
- Compact JSON input: stays compact; pretty input: indentation matched.

## 8. Managed-field and conflict matrix

- Base URL, selected auth, `ANTHROPIC_MODEL`: written into `env` as JSON
  string literals.
- Compact window: decimal string 100000-1000000.
- Enabled Boolean options: string `1`; disabled: key absent; `0`/`false`
  never written for nonessential traffic.
- Exactly one auth property present after apply; opposite auth removed.
- Conflict `gatewayDiscovery == true` + `disableNonessentialTraffic == true`:
  rejected by schema (allOf/not), PowerShell core (`Validate-Inputs`), Python
  adapter (`_validate_route`, HTTP 400 with the exact copy), and the app UI
  (mutual disable/uncheck) - all before any backup, store, activity, or target
  mutation.

## 9. Existing route-store compatibility

Route-store version stays 1; route fields, IDs, timestamps, revision rules,
activity shape, manifest shape, fingerprint inputs, and null applied state are
unchanged. `test_version1_route_store_loads_without_migration` proves an
existing version-1 store loads without migration. Fingerprint remains
sensitive to all four curated options (test matrix PASS).

## 10. Recommendation assistant behavior and pure-function matrix

`recommendClaudeCompatibility({ hasModelsEndpoint, supportsBetaFields,
contextWindow, suppressNonessentialTraffic })` returns the exact
`{ values, notes }` shape. Verified rules:

- discovery true only for `hasModelsEndpoint == "yes"` with suppressed
  traffic false;
- betas disabled only for `supportsBetaFields == "no"`; unknown warns
  `BETA_COMPATIBILITY_NOT_VERIFIED`;
- suppressed traffic mirrors the Boolean input;
- known context 100000-1000000 -> compact window exactly; below 100000 ->
  100000 + warning `CONTEXT_BELOW_SUPPORTED_MINIMUM`; above 1000000 ->
  1000000 + info `CONTEXT_CAPPED_AT_SUPPORTED_MAXIMUM`; empty/unknown ->
  190000 + info `CONTEXT_NOT_VERIFIED`;
- models yes + suppressed traffic -> discovery false + warning
  `DISCOVERY_BLOCKED_BY_NONESSENTIAL_TRAFFIC`;
- recommendations never mutate form controls until `Apply recommendations`;
- saving is blocked until the required confirmation checkbox
  (`I reviewed these compatibility settings and their tradeoffs.`) is
  checked; editing an existing route requires fresh confirmation and is never
  pre-checked;
- nonessential-traffic checked disables/unchecks discovery and vice versa;
  backend validation remains authoritative;
- no gateway is contacted to generate recommendations; assistant copy covers
  discovery scope, beta tradeoff (MCP tool search), compact range and
  recommendation-vs-verification, traffic semantics (unset, not `0`), and
  no-probe guarantees.

## 11. Tests run (exact commands, exits, counts)

Repository root unless noted:

- Gate 2: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1` -> exit 0, `Summary: 65 passed, 0 failed`.
- Gate 3: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe <absolute app python>` -> exit 0, `SAFETY PASS - 0 failed`, `OVERALL PASS - Gate 3 provider/model evidence` (25 criteria tests).
- OpenCode: `.app\engine\test-opencode-v2.7.ps1` -> exit 0, `Tests: 34/34 Passed`.
- Kilo: `.app\engine\kilo\test-kilo-v1.ps1` -> exit 0, `Tests: 32/32 Passed`.
- Focused Python (app dir): `& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest tests.test_claude_adapter tests.test_capabilities` -> exit 0, `Ran 94 tests` OK (86 adapter + 8 capability).
- Focused frontend (app dir): `node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs` -> `tests 35, pass 35, fail 0`.
- Full Python (app dir): `& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"` -> `Ran 178 tests`, `FAILED (failures=2)` - only the two established unrelated `test_preferences` baseline failures, zero deprecation warnings.
- Full frontend (app dir): `node --test ".\tests\*.test.mjs"` -> `tests 114, pass 113, fail 1` - only the established unrelated onboarding-copy baseline failure.
- PowerShell parser checks: all six modified `.ps1`/`.psm1` files -> six `PARSE_OK`.
- JSON parsing: schema and all fixtures parse (settings-malformed.json is an intentional negative fixture).
- `git diff --check` -> exit 0; `git status --short -- app/state` empty.
- ASCII: all scoped source/docs files 0 non-ASCII bytes.
- Production-code scan: zero `.claude.json`/plugins/MCP/project-local/FCC/`.local\bin` APIs or paths in executable code.
- Source scan: lock line unchanged `ALLOW_REAL_CLAUDE_TARGET = False`; no `-AllowRealTarget` in core; core static scan confirms no settings-object `ConvertTo-Json` pipeline.

## 12. OpenCode/Kilo regression evidence

OpenCode 34/34 and Kilo 32/32, both exit 0, unchanged. No OpenCode/Kilo
behavior, registry, or test was touched.

## 13. Zero-access/FCC/real-state/lock attestation

No real Claude file or directory was read, hashed, enumerated, snapshotted,
compared, copied, restored, edited, or deleted. No `app/state` file was read
or modified (all adapter tests inject GUID temporary roots). No FCC
executable or `.local\bin` entry was accessed. No `Get-Command claude`,
`claude`, gateway, DNS, HTTP, server, or UI server was run. No secret value
was entered or emitted. Both real-target locks remain closed; the on-disk
line is exactly `ALLOW_REAL_CLAUDE_TARGET = False` and no `-AllowRealTarget`
exists in any modified executable code.

## 14. Git and scope integrity

The exact scoped diff contains only section-4 paths plus this report (all
other dirty/untracked files are the pre-existing unrelated state, preserved
untouched). No commit, stage, reset, clean, checkout, restore, revert, push,
amend, or worktree occurred. Gate 5B.4 and all prior handoffs/reports are
unchanged historical evidence.

## 15. Failures, risks, and accepted unrelated baselines

- No new failures. Accepted unrelated baselines (recorded, unedited): two
  `test_preferences` browser-default expectation failures and one
  `frontend_review` onboarding model-copy failure.
- Risk: live routing/precedence/reload behavior remains unvalidated until a
  corrected, separately approved Gate 5B live gate (design section 9).
- Risk: the deferred normal-user credential UX
  (`planning/claude-code/CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md`) is unchanged; the
  env-reference developer workaround remains.
- Risk: `Get-SettingsJsonLayout` insertion indentation is inferred from the
  existing document style; unusual mixed-indentation documents fall back to a
  deterministic one-level inference and remain valid JSON.

## 16. Corrected Gate 5B recommendation

READY FOR SOL PLANNING. The corrected env-only scope is implemented,
documented, and fixture/integration-verified, and the corrected live-test
semantics (design section 9) are specified. This is explicitly not Gate 5B or
Gate 5C authorization; any live validation requires a new, separately
approved Gate 5B handoff, and Gate 5C remains unauthorized.
