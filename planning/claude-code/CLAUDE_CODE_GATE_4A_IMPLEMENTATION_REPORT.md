# Claude Code Gate 4A Implementation Report (Repaired)

Date: 2026-08-14 (initial) / 2026-08-14 (repair round 1) / 2026-08-14 (repair
round 2) / 2026-08-14 (repair round 3)
Worker: DeepSeek V4 Flash Max (Effort: Max)
Scope: Gate 4A implementation and repair only. Gate 4B documentation/framework/
template work and Gate 5 live validation are NOT performed.

## Status

PASS (after repair rounds 1-3). All 12 round-1 findings, all 8 round-2
findings, and all 6 round-3 findings are fixed with RED/GREEN evidence, all
required verification commands pass, both round-3 targeted reproductions are
inverted, and the only remaining suite failures are the three independently
established unrelated baseline failures (2 app Python preference tests, 1
frontend onboarding copy test), unchanged and unedited.

## Repair round 3: defects fixed, mapped to the 6 findings

1. Double rollback on invalid Apply output: post-exit-0 failures now route
   through exactly one outer rollback path. The validation-error branch raises
   the internal `_ApplyValidationError` marker; the dedicated handler performs
   `_rollback_apply()` exactly once and surfaces the specific message as a
   generic HTTP 500. Reproduced `INVALID_OUTPUT_ROLLBACK_CALLS=2` -> fixed to
   `INVALID_OUTPUT_ROLLBACK_CALLS=1` with target/store/manifest/activity
   restored.
2. Apply recovery-cleanup result: the boolean result of
   `_remove_owned_file(recovery_path, recovery_sha)` is now checked; a false
   result raises the documented committed-but-cleanup-failed hard error (HTTP
   500), never `{ ok: true }`, and preserves the verified recovery artifact as
   evidence. Reproduced `APPLY_SUCCEEDED_WITH_FAILED_RECOVERY_CLEANUP=True` ->
   fixed to `False` (status 500), with the committed store/manifest/activity
   internally consistent.
3. Restore recovery-cleanup result: the same boolean check was added to the
   restore cleanup path; a false result surfaces the committed-but-cleanup-
   failed hard state. Separate Apply and Restore tests cover
   `_remove_owned_file` returning false (not raising).
4. Pre-commit cleanup failures: `_cleanup_failed_apply_files()` now returns
   its result; the production-exit-1 branch verifies the target revision
   equals the request revision, and any failure to remove a verified pre-call
   artifact (transaction route-store backup or recovery copy) returns a
   generic hard failure with evidence preserved instead of a normal 400.
5. Cleanup evidence wording: the report now distinguishes (a) success paths
   leave no transaction temp or unreferenced recovery file, (b) recoverable
   failure paths clean all verified transaction artifacts, and (c) injected
   deletion failure returns a generic hard failure, never success, preserving
   only the exact verified evidence file that could not be deleted. This is
   called a residual hard-failure evidence condition, not "no unresolved
   risks."
6. Test dependency: `app/requirements.txt` now declares `httpx2` (the
   TestClient transport expected by the installed FastAPI/Starlette); the
   deprecated `httpx` compatibility package was removed from the environment
   and the full Python suite runs clean under `-W error::DeprecationWarning`
   with no warnings.

## Round-3 tests and the failure each reproduced before the fix

- `test_invalid_apply_output_rolls_back_exactly_once`
  - RED: `INVALID_OUTPUT_ROLLBACK_CALLS=2` (rollback executed twice).
- `test_apply_recovery_cleanup_false_is_hard_failure_never_success`
  - RED: `APPLY_SUCCEEDED_WITH_FAILED_RECOVERY_CLEANUP=True` (success returned
    despite failed cleanup).
- `test_restore_recovery_cleanup_false_is_hard_failure_never_success`
  - RED: restore returned success despite failed recovery cleanup.
- `test_exit_1_with_cleanup_failure_is_hard_failure`
  - RED: pre-commit cleanup failure could yield a normal 400 with artifacts
    left behind.
- `test_normal_success_leaves_no_recovery_artifacts`
  - RED: no assertion proved success paths leave zero transaction artifacts.
- Focused Python runs under `-W error::DeprecationWarning`:
  - RED: the TestClient import emitted a Starlette deprecation warning about
    `httpx`; fixed by declaring `httpx2`.

## Sol reproduction inversion evidence

- `INVALID_OUTPUT_ROLLBACK_CALLS=1`
- `APPLY_SUCCEEDED_WITH_FAILED_RECOVERY_CLEANUP=False` (status 500)

## Repair round 2: defects fixed, mapped to the 8 findings

1. Invalid Apply output after target mutation: the pre-call recovery copy is
   created before production Apply; `applied` is set immediately after exit 0;
   invalid output enters the rollback which restores the target from the
   output-named validated backup when available, otherwise from the recovery
   copy; exit code 2 is a generic hard failure with recovery attempted; every
   artifact and the exact directory inventory are verified; the recovery copy
   is removed after verified rollback.
2. Prune partial failure: `_prepare_prune` validates every candidate (name,
   containment, reparse, hash, binding) BEFORE moving any file, then unstages
   all successful moves inside the function before raising.
3. Prune collision safety: staging uses transaction-unique create-new names
   (hard-link based, pre-existing destinations rejected, never overwritten);
   `_finalize_prune` runs only after the commit completes, so a partial
   cleanup failure can never trigger a rollback that restores a manifest
   referencing deleted backups (the committed manifest stays consistent).
4. Restore consumed-backup removal: the consumed route-store backup is staged
   reversibly (rename to `.bdf-consume-<guid>.tmp`) before the store write;
   final deletion happens only after the commit; post-target failures unstage
   and roll back target/store/manifest/activity with every referenced file
   verified and verified transaction temps removed.
5. CLI bound parameters: `$PSBoundParameters` presence (not value) is
   enforced; explicitly bound empty forbidden parameters are rejected before
   target mutation; Restore requires bound non-empty backup parameters.
6. Exact output objects: `_validate_apply_output` (exact key set, named backup
   existence/containment/reparse/hash, revision equality) and
   `_validate_restore_output` (exact key set, `restoredTargetSha256 ==
   entry.backupSha256`, schema identity, core version) are centralized;
   rollback Restore output is validated with the same rigor.
7. Restored the deleted frontend workspace-markup test; focused suites are
   back to 21 tests (11 routes + 10 capabilities).
8. Dependency reproducibility: `httpx` is declared in `app/requirements.txt`
   (the TestClient dependency supported by the installed FastAPI/Starlette);
   the manual-venv-only claim is removed.

## New round-2 tests and the failure each reproduced before the fix

- `test_invalid_apply_output_after_target_mutation_restores_everything`
  - RED: a fake Apply that really mutated the target and created an owned
    backup, returning wrong schema identity / wrong hash / extra key / wrong
    pre-write hash, left the target mutated.
- `test_production_exit_2_is_hard_failure_with_recovery`
  - RED: exit 2 was surfaced as a plain 400-class path without recovery.
- `test_prune_second_backup_validation_failure_restores_first`
  - RED: `PRUNE_PARTIAL_FAILURE_RESTORED_FIRST=False` (first backup stranded).
- `test_prune_staging_destination_never_overwrites_preexisting`
  - RED: `os.replace` overwrote a pre-existing staging-name file.
- `test_prune_move_and_finalize_boundary_failures_are_consistent`
  - RED: a second-move failure left the first file staged and orphaned.
- `test_restore_consumed_backup_staging_failure_restores_everything`
  - RED: consumed-backup handling was irreversible before the commit.
- `test_restore_consumed_backup_finalize_failure_commits_consistently`
  - RED: a finalize failure could restore a manifest referencing a deleted
    consumed backup.
- `test_cli_explicit_empty_forbidden_parameters_rejected`
  - RED: `CLI_EXPLICIT_EMPTY_FORBIDDEN_ACCEPTED=True`.

## Sol reproduction inversion evidence

- `APPLY_INVALID_OUTPUT_TARGET_UNCHANGED=True`
- `PRUNE_PARTIAL_FAILURE_RESTORED_FIRST=True`
- `CLI_EXPLICIT_EMPTY_FORBIDDEN_ACCEPTED=False` (and `TARGET_UNCHANGED=True`)

## Exact changed files

Created during initial Gate 4A:

- `app/app/claude_adapter.py`
- `app/app/capabilities.py`
- `app/assets/js/core/capabilities.js`
- `app/assets/js/pages/claude-routes.js`
- `app/engine/claude-code/claude-routing-core.psm1`
- `app/engine/claude-code/build-claude-code-production.ps1`
- `app/tests/test_capabilities.py`
- `app/tests/test_claude_adapter.py`
- `app/tests/claude_routes_contract.test.mjs`
- `app/tests/capability_ui_contract.test.mjs`

Modified during initial Gate 4A: `app/app/config.py`, `app/server.py`,
`app/assets/js/core/api.js`, `store.js`, `router.js`, `sidebar.js`,
`app/assets/js/main.js`, `app/assets/js/pages/onboarding.js`,
`provider-workspace.js`, `overview.js`, `activity.js`, `settings.js`,
`app/assets/css/provider-workspace.css`, `app/.gitignore`,
`app/engine/claude-code/build-claude-code.ps1`,
`app/engine/claude-code/test-claude-code.ps1`.

Modified during repair rounds 1-2: `app/app/claude_adapter.py`, `app/engine/claude-code/build-claude-code-production.ps1`, `app/engine/claude-code/claude-routing-core.psm1`, `app/assets/js/pages/claude-routes.js`, `app/assets/js/pages/overview.js`, `app/assets/js/pages/providers.js`, `app/assets/js/main.js`, `app/tests/test_claude_adapter.py`, `app/tests/claude_routes_contract.test.mjs`, `app/requirements.txt` (httpx declared). Round-1 modified: `app/app/claude_adapter.py`,
`app/engine/claude-code/claude-routing-core.psm1`,
`app/engine/claude-code/build-claude-code-production.ps1`,
`app/assets/js/pages/claude-routes.js`, `app/assets/js/pages/overview.js`,
`app/assets/js/pages/providers.js`, `app/assets/js/main.js`,
`app/tests/test_claude_adapter.py`,
`app/tests/claude_routes_contract.test.mjs`. The app venv gained `httpx`
(test-only dependency for in-process HTTP tests; `requirements.txt` untouched).

Planning files amended: `planning/claude-code/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md`,
`planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md` (six pre-implementation
corrections), plus this report.

## Defects fixed, mapped to the 12 confirmed findings

1. Frontend fingerprint mismatch: backend route APIs now return a derived,
   non-persisted `configSha256` per route (computed by `_fingerprint()`);
   `claude-routes.js` and `overview.js` compare that 64-hex value with
   `appliedRouteConfigSha256`; no JavaScript fingerprint algorithm remains;
   the derived field is never persisted in `claude-routes.json` (tested).
2. Capability loading first render: `showWorkspace()` keeps the app shell
   hidden until the awaited capability fetch returns; on first-load failure it
   renders a bounded unavailable state and does not initialize the router; the
   global Build click is blocked while capabilities are null or
   `builderAvailable` is false.
3. Providers page branch order: `renderProviders()` branches on `isClaude()`
   and awaits `renderClaudeRoutes()` before any provider, formats, or status
   API call; the page-local `claudecode` display-name guess was removed.
4. Production CLI parameter contract: `Assert-ParameterContract` enforces
   Apply (requires `RoutingProfilePath`, forbids backup parameters) and
   Restore (forbids `RoutingProfilePath`, requires non-empty
   `BackupPath`/`ExpectedBackupSha256`/`TargetBindingSha256`); trusted inputs
   are validated as existing non-reparse leaves with state-leaf and comment
   suffix guards before content reads; the real-profile lock runs first.
5. Target binding: `_binding_sha` now hashes the normalized canonical settings
   target (not the profile root); Python passes `-TargetBindingSha256` to
   Restore; the production entry and the shared core both recompute and
   compare the binding before target mutation; different-target and
   case-equivalent tests added.
6. Apply output metadata: the core captures the pre-write hash before
   mutation and emits non-empty lowercase 64-hex pre- and post-write hashes;
   the adapter validates the exact output object (backup name contract, all
   hash fields, `coreVersion`, `schemaIdentity`), verifies the pre-write hash
   equals the request's target revision and the post-write hash equals the
   actual new target, and rejects a wrong schema identity without committing
   metadata.
7. Apply rollback completeness: after production Apply succeeds, every later
   failure (any exception class) enters the rollback sequence; the rollback
   Restore subprocess result is validated; target revision, store, manifest,
   activity bytes, and directory inventory are verified; the failed
   transaction's validated route-store backup is removed after verification;
   rollback failure raises a generic hard failure with evidence preserved;
   the apply-created target backup is kept per section 11.7.
8. Manifest pruning safety: `_prepare_prune` validates and MOVES old backups
   to reversible staging names before commit; `_finalize_prune` deletes only
   after the full commit; any failure unstages and rolls back, so a restored
   manifest never references deleted backups and no file is orphaned; failure
   injection after prune preparation is tested.
9. Restore eligibility and rollback: all section 11.6 checks (target backup
   JSON and duplicate-key validation, route-store backup filename,
   containment, reparse, hash, JSON, duplicate-key, invariant, and versioned
   shape) run before target mutation; a recovery copy is created before the
   production Restore; post-target failures roll back target (via the
   recovery copy through the production entry), store, manifest, and activity
   with full verification; the consumed route-store backup is removed only
   after the commit is proven.
10. Restore output and boundaries: the adapter validates the exact Restore
    output (`ok`, `restoredTargetSha256`, `coreVersion`, `schemaIdentity` and
    rejects a wrong identity without committing); the core now injects
    `AfterRecoveryReplace`; all five synthetic Restore stages are proven to
    leave a parseable target with the required exit classes and no backup
    retry.
11. Activity retention: `_append_activity` keeps exactly the newest 200 valid
    single-line events; an exact 200-of-250 assertion is in place.
12. Focused tests for all defects: see the new test classes and the RED
    evidence below.

## New tests and the failure each reproduced before the fix

- `FingerprintContractTests.test_route_responses_carry_derived_config_sha256`
  - RED: no `configSha256` field existed in route responses.
- `FingerprintContractTests.test_applied_renders_when_id_and_fingerprint_match`
  - RED: the frontend array fingerprint never matched the backend SHA-256, so
    `Applied` could not render.
- `ApplyOutputValidationTests` (wrong schema identity, wrong pre-write hash,
  missing metadata fields, invalid backup name)
  - RED: metadata was accepted without validation or committed despite wrong
    identity.
- `RestoreEligibilityAndRollbackTests.test_malformed_target_backup_rejected_before_mutation`,
  `test_duplicate_key_target_backup_rejected_before_mutation`,
  `test_invalid_route_store_backup_rejected_before_mutation`
  - RED: these conditions were only detected after target mutation (or not at
    all).
- `RestoreEligibilityAndRollbackTests.test_restore_rollback_on_manifest_write_failure`
  - RED: a post-target manifest failure bypassed rollback and re-raised the
    raw exception.
- `RestoreEligibilityAndRollbackTests.test_restore_rejects_wrong_returned_schema_identity`
  - RED: Restore output identity was never validated.
- `RestoreBoundaryStageTests.test_restore_synthetic_boundaries`
  - RED: `AfterRecoveryCopy`/`AfterRecoveryReplace` were never injected;
    `AfterReplace` was silently removed from the restore main flow.
- `RestoreBoundaryStageTests.test_apply_boundaries_restore_target`
  - RED: production Apply boundary stages were not covered by the adapter
    suite.
- `ActivityRetentionTests.test_activity_keeps_exactly_newest_200_single_line_events`
  - RED: blank lines were written and fewer events retained.
- `TargetBindingContractTests.test_binding_is_over_the_settings_target_and_passed_to_restore`
  - RED: binding covered the profile root and was never passed to Restore.
- `ProductionCliContractTests` (forbidden combinations, missing parameters,
  restore matrix, wrong binding)
  - RED: the CLI accepted forbidden combinations and missing Restore
    parameters; binding was never validated.
- `LockedEndpointCoverageTests.test_locked_every_mutation_and_metadata_endpoint`
  - RED: locked coverage was incomplete.
- `HttpHostOriginTests.test_host_origin_checks_run_before_body_processing`
  - RED: no in-process HTTP proof that Host/Origin runs before body
    processing on protected endpoints.
- `ApplyCommitBoundaryTests.test_every_apply_commit_boundary_rolls_back_all_artifacts`
  - RED: the store/manifest/activity commit boundaries did not all roll back
    and verify every artifact (raw `OSError` escaped the route function).
- `ApplyCommitBoundaryTests.test_prune_rollback_keeps_oldest_backups_referenced`
  - RED: pruning deleted backups irreversibly inside an unfinished commit.
- `ApplyCommitBoundaryTests.test_apply_keeps_new_target_backup_after_rollback`
  - RED: rollback kept the apply-created target backup per section 11.7.

## Exact final commands, exit codes, and counts

- `python -m unittest tests.test_claude_adapter tests.test_capabilities`
  -> OK (79 + 8 tests).
- `python -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"`
  -> 171 tests, failures=2 (only the established pre-existing `test_preferences`
  browser-default expectations), zero deprecation warnings.
- `node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs`
  -> 21 passed, 0 failed.
- `node --test ".\tests\*.test.mjs"` -> 99 passed, 1 failed (the established
  pre-existing `frontend_review` onboarding model-copy expectation; unedited).
- `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\engine\claude-code\test-claude-code.ps1`
  -> exit 0, `Summary: 51 passed, 0 failed`.
- Gate 3 -> exit 0, `OVERALL PASS - Gate 3 provider/model evidence`.
- OpenCode -> exit 0, "All tests passed" (34/34); Kilo -> exit 0, "All tests
  passed" (32/32).
- PowerShell parser checks for all four Claude engine scripts/modules: no
  errors. `git diff --check`: exit 0.

## Baseline failures (unchanged, unedited)

- `test_preferences.PreferencesTests.test_corrupt_or_unsafe_saved_values_recover_to_safe_defaults`
- `test_preferences.PreferencesTests.test_defaults_are_returned_and_redaction_cannot_be_disabled`
- `frontend_review.test.mjs` onboarding model-copy expectation

These three were independently reproduced by Sol before this repair and were
present in the pre-repair baseline; they are unrelated to Gate 4A and were not
edited.

## Remaining risks

- Residual hard-failure evidence condition: when an injected deletion fails in
  the committed-but-cleanup-failed paths (prune finalize, restore consume
  finalize, or recovery-artifact cleanup), the operation returns a generic
  HTTP 500 and preserves exactly the verified evidence file that could not be
  deleted (a `.bdf-*-<guid>.tmp` temp or the recovery copy). Success paths
  leave no transaction temp or unreferenced recovery file, and recoverable
  failure paths clean all verified transaction artifacts. This residual
  condition is expected only under injected filesystem failure and is NOT the
  same as "no unresolved risks."
- The 3 baseline failures must be triaged before any release.
- The adapter-level Restore boundary failures surface as generic HTTP 500 with
  the adapter's own recovery-copy rollback; the raw production-entry exit
  classes are proven separately.

## Explicit statements

- No real Claude state, `.claude.json`, `.jsonc`, plugin/marketplace/MCP/
  OAuth/session content, prompts, transcripts, or credentials were read,
  listed, hashed, parsed, copied, or written.
- `ALLOW_REAL_CLAUDE_TARGET` remains False; `-AllowRealTarget` was never
  passed; all tests ran against fresh GUID temporary profile roots with
  `get_profile_root()` overridden.
- Gate 5 remains locked and unauthorized. Gate 4B (adapter documentation
  namespace, BDF framework 2.3.0, templates, root/app docs, DECISIONS
  amendment, PROJECT_STATE regeneration, final Gate 4 report) is NOT
  performed.
- No unrelated baseline failure was edited. No commit, stage, reset, clean, or
  revert was performed.
