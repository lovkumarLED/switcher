# Claude Code Adapter Testing Guide

Lifecycle status: **Live validated**

Evidence date: 2026-08-17

## Test groups and gate authorization

| Group | Authorized at | What it proves |
|---|---|---|
| Fixture tests | Gate 2 | Isolated patch/transaction behavior on fixtures (51 original tests + 14 env-only surgical tests = 65) |
| Schema tests | Gate 2 | Routing-schema parse and compliance of fixture inputs, including the `environment` model source, integer compact window, and the discovery/nonessential conflict constraint |
| Unit tests (adapter API) | Gate 4A | Adapter endpoints, saved routes, apply/restore, manifest, activity, locks, revisions, Host/Origin (86 adapter + 8 capability tests) |
| Unit tests (frontend contract) | Gate 4A | Capability-driven UI, routes workspace, adaptive pages, compatibility assistant (35 tests) |
| Regression tests | Every gate | Gate 2 65/65, Gate 3 overall pass, OpenCode 34/34, Kilo 32/32, focused and full Python and frontend suites (exact commands below) |
| Integration tests | Gate 4A | In-process app API integration on temporary GUID roots with the profile root injected; never against the real profile |
| Live validation | Gate 5 (corrected env-only contract) | Real-target behavior; PASSED 2026-08-17 (`planning/claude-code/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_PASS_REPORT.md`) |

## Isolation and privacy constraints

- All execution stays inside repository fixtures or fresh GUID temporary
  roots with `get_profile_root()` overridden.
- The real user profile, the Claude state file, comment-suffix files, plugin,
  marketplace, MCP, credential, OAuth, session, prompt, and transcript content
  are never accessed.
- Both real-target locks stay closed; `-AllowRealTarget` is never passed.

## Required negative and recovery cases

- Duplicate keys (decoded equivalents included), malformed JSON, missing
  secret references, invalid URLs, invalid models, out-of-range auto-compact
  windows, both/neither auth.
- Apply and Restore synthetic failure stages, rollback ordering, prune staging
  and finalization failures, consumed-backup staging and finalization
  failures, and recovery-cleanup failures.
- Host/Origin rejection before body processing on every protected endpoint.
- Locked-endpoint behavior for every mutation and protected metadata endpoint.

## Expected evidence and redaction rules

- Exact commands, exit codes, and pass counts per suite.
- Fake secret markers only; zero occurrences in responses, output, or reports.
- No absolute paths, usernames, resolved secrets, or target contents in
  evidence.

## Documentation consistency tests

- All five adapter documents carry the exact lifecycle phrase and the same
  evidence date.
- Generic BDF documents and templates contain no target-specific paths,
  setting names, environment variables, versions, or support claims.
- Root documents summarize and link; adapter documents specify.

## Separation of passing tests from a support claim

A green suite is evidence of behavior at its gate. It is never a broader
support claim. The adapter moved to **Live validated** only after the corrected
Gate 5B live validation passed (2026-08-17) and Gate 5C was approved; the
live-validated scope is the env-only routing surface exercised by the gate,
and the real-target lock stays closed until the owner opens it.

## Exact current commands, exits, and counts

All commands run from the repository root unless noted; the app suites run
from the `app` directory with the isolated app venv Python.

- Gate 2 (Claude fixture harness): `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1` -> exit 0, 65/65 (51 prior + 14 env-only surgical tests).
- Gate 3 (provider/model harness): `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe <isolated python>` -> exit 0, OVERALL PASS (25 criteria tests).
- OpenCode regression: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1` -> exit 0, 34/34.
- Kilo regression: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1` -> exit 0, 32/32.
- Focused app Python: `& .\env\Scripts\python.exe -m unittest tests.test_claude_adapter tests.test_capabilities` (app directory) -> OK, 94 tests (86 adapter + 8 capability).
- Focused frontend: `node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs` (app directory) -> 35/35.
- Full app Python: `& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"` (app directory) -> 171 tests, 0 failures beyond the two accepted unrelated preference baseline failures, zero deprecation warnings.
- Full frontend: `node --test ".\tests\*.test.mjs"` (app directory) -> 100 tests, 99 pass, 1 fail: only the accepted unrelated onboarding-copy baseline failure.
- PowerShell parser checks (five files, all parse cleanly with no errors): `app/engine/claude-code/claude-routing-core.psm1`, `app/engine/claude-code/build-claude-code.ps1`, `app/engine/claude-code/build-claude-code-production.ps1`, `app/engine/claude-code/inspect-provider-model.ps1`, `app/engine/claude-code/test-claude-code.ps1`.
- `git diff --check` -> exit 0.

## Env-only surgical scope tests (Gate 2, 14 named cases)

The fixture harness proves the surgical patcher never regenerates the
document: env-only model precedence; root byte preservation (unusual spacing,
property order, numeric spelling, escaped strings, nested formatting);
unmanaged env byte preservation; surgical replacement of existing managed
values; surgical insertion of missing managed keys and of a missing top-level
`env`; disabled-option and opposite-auth removal; UTF-8 BOM preservation;
LF/CRLF, indentation, and trailing-newline forms; conflict rejection before
backup; top-level-model and unmanaged-byte corruption detection; and a static
scan rejecting any full-settings-object `ConvertTo-Json` pipeline.

## Compatibility assistant tests (frontend)

`recommendClaudeCompatibility` is a pure function with exact-shape output.
Tests cover every recommendation rule (discovery only for a verified models
endpoint without suppressed traffic; betas only for unsupported beta fields;
context clamping and capping; unverified-context starting value; suppressed
traffic mirroring; blocked-discovery warning), non-mutation before
`Apply recommendations`, the required confirmation copy and guard, the
conflict UI, exactly four curated controls with no raw env editor, escaped
rendering, and mobile-scoped CSS classes.

## Accepted unrelated baseline failures (distinct from Gate 4)

The three failures below were independently reproduced before Gate 4 and are
not Gate 4 defects; they were recorded, never edited, and remain separate from
the Gate 4 result:

- `test_preferences.PreferencesTests.test_corrupt_or_unsafe_saved_values_recover_to_safe_defaults`
- `test_preferences.PreferencesTests.test_defaults_are_returned_and_redaction_cannot_be_disabled`
- `frontend_review.test.mjs` onboarding model-copy expectation

---

**Document Version:** 1.1

**Status:** Live validated
