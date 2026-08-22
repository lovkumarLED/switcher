# DeepSeek Gate 4A Repair Round 2

<task>
Repair the remaining Gate 4A blockers found by Sol's independent review of the
first repair. Work directly in the current worktree. Add RED tests that
reproduce every item below before editing implementation. Do not start Gate 4B
or Gate 5.
</task>

<grounding_rules>
1. Read `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md` revision 5,
   `AI/DEEPSEEK_GATE4A_REPAIR_REVIEW_FINDINGS.md`, and the current implementation.
2. Do not trust the current PASS statement in
   `planning/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md`; the reproductions
   below disprove it.
3. Do not remove, weaken, skip, or rename existing tests. Restore any test lost
   during the first repair.
4. Keep all execution in repository fixtures or GUID temporary roots. Never
   inspect real Claude state.
</grounding_rules>

<action_safety>
1. Keep `ALLOW_REAL_CLAUDE_TARGET = False`; never pass `-AllowRealTarget`.
2. Do not read or write real Claude/OpenCode configuration, credentials,
   prompts, sessions, MCP, plugins, marketplaces, or transcripts.
3. Do not edit OpenCode/Kilo builders or harnesses.
4. Do not commit, stage, reset, clean, or revert unrelated worktree changes.
5. Do not use subagents or Graphify.
</action_safety>

<blocking_findings>
1. Invalid Apply output leaves the already-mutated target in place.

   Location: `app/app/claude_adapter.py:763-798`.

   `applied` becomes true only after `_validate_apply_output()`. A production
   Apply can return exit 0 after mutating the target, then return a wrong schema
   identity, wrong hash, extra/missing field, or otherwise invalid object. The
   validation error takes the `applied == False` path, removes bookkeeping, and
   never restores the target.

   Sol reproduced this with a fake production Apply that created a valid target
   backup, mutated the target, and returned a wrong schema identity:

   `APPLY_INVALID_OUTPUT_TARGET_UNCHANGED=False`

   Existing `ApplyOutputValidationTests` do not reproduce this because their
   fake subprocess never mutates the target. Replace/add tests that perform the
   mutation and create the owned backup before returning invalid metadata.

   Treat target mutation as possible immediately after production returns exit
   0. For any subsequent validation/commit failure, restore through production
   Restore when valid backup metadata is available and verify every artifact.
   If output is too malformed to identify a validated backup, use a pre-call
   recovery strategy that can still restore safely; do not scrape backup
   directory ordering. Exit code 2 from production is a hard recovery failure,
   not a normal 400 validation failure.

2. Prune preparation can strand the first backup after validating the second.

   Location: `app/app/claude_adapter.py:408-436`.

   `_prepare_prune()` moves each file while iterating. If the target backup is
   moved and the route-store backup is missing/tampered/reparse, the function
   raises before returning `staged`; the caller still has `prune_staged = []`,
   so rollback cannot unstage the first file.

   Sol reproduced this directly:

   `PRUNE_PARTIAL_FAILURE_RESTORED_FIRST=False`

   Validate every candidate and all target-binding/containment/name/hash/reparse
   conditions before moving any file. If any move fails after staging starts,
   unstage all successful moves inside `_prepare_prune()` before raising and
   verify restoration.

3. Prune staging/finalization is not collision-safe or rollback-safe.

   Locations: `app/app/claude_adapter.py:430-451, 786-797`.

   - Staging names are deterministic; `os.replace` can overwrite an unrelated
     pre-existing `.bdf-prune-*.tmp` file.
   - `_finalize_prune()` can delete the first staged backup and then fail on the
     second. The outer rollback restores the old manifest, which can now
     reference the permanently deleted first backup.

   Use transaction-unique create-new staging names and reject pre-existing
   destinations. Design finalization so a partial cleanup failure cannot restore
   a manifest that references deleted backups. Add first-move, second-move,
   first-finalize, and second-finalize failure tests with exact manifest/file
   inventory assertions.

4. Restore deletes the consumed route-store backup before all remaining commit
   work is safe.

   Location: `app/app/claude_adapter.py:933-947`.

   `_remove_owned_file(store_backup)` is irreversible. If the subsequent
   `recovery_path.unlink()` fails, `_rollback_restore()` restores the old
   manifest and route store, but the manifest references a consumed backup that
   was already deleted. The rollback also leaves the adapter-created recovery
   backup behind after successful recovery.

   Stage consumed-backup removal reversibly. Ensure any post-target failure
   restores target/store/manifest/activity and every referenced backup, removes
   only verified transaction temporaries after successful rollback, and checks
   exact directory inventory. Add failure injection for consumed-backup staging,
   finalization, and recovery-artifact cleanup.

5. The production parameter contract checks values, not bound parameters.

   Location: `app/engine/claude-code/build-claude-code-production.ps1:32-40`.

   The handoff and first repair prompt require the script bound-parameter set.
   Explicitly supplied empty forbidden parameters are currently treated as
   absent. Sol invoked Apply with `-BackupPath ""` and reproduced:

   `CLI_EXPLICIT_EMPTY_FORBIDDEN_ACCEPTED=True`

   Capture the script-level `$PSBoundParameters` before entering helper
   functions and enforce presence/absence from that set. Add Apply tests for all
   three explicitly bound empty forbidden parameters and a Restore test for an
   explicitly bound empty `RoutingProfilePath`. All must reject before target
   mutation.

6. Apply/Restore output validation is not exact enough.

   Locations: `app/app/claude_adapter.py:667-686, 921-932`.

   - Extra output keys are accepted despite the exact output contract.
   - Apply does not verify the named backup exists, is contained/non-reparse,
     and its actual SHA-256 equals `backupSha256` before recording it.
   - Restore does not require `restoredTargetSha256 == entry.backupSha256`.
   - Rollback Restore accepts only `ok == true` without validating exact keys,
     schema identity, core version, or restored target hash.

   Centralize strict Apply and Restore output validators with exact key sets and
   all cross-checks. Add hostile-output tests that mutate the target first, then
   prove safe recovery or hard-failure evidence behavior.

7. An existing frontend contract test was deleted.

   Before repair, the focused frontend suites had 21 tests. They now have 20.
   `app/tests/claude_routes_contract.test.mjs` lost the test proving the Claude
   routes workspace title, one-route explanation, Add action, and route card.

   Restore that test while retaining the corrected `configSha256` test. Focused
   frontend count must be at least 21, not 20.

8. The new HTTP test dependency is not reproducible from the repository.

   The report says `httpx` was installed manually into the app environment while
   `app/requirements.txt` remained unchanged. A fresh environment cannot be
   assumed to contain undeclared test dependencies. The current run also emits
   a Starlette deprecation warning requesting `httpx2`.

   Use the dependency supported by the installed FastAPI/Starlette version and
   declare it in the appropriate repository dependency file, or implement the
   in-process HTTP proof without an undeclared package. Verify from the declared
   dependency contract; do not rely on a manually modified venv.
</blocking_findings>

<required_red_tests>
1. Invalid Apply output after actual target mutation restores the original
   target/store/manifest/activity and preserves only contract-required evidence.
2. Production exit 2 is surfaced as a generic hard failure without pretending
   the target is unchanged.
3. Prune validation failure on the second owned backup restores the first.
4. Pre-existing prune staging destination is never overwritten.
5. Failure at each prune move/finalize boundary cannot create an orphan or a
   manifest reference to a deleted file.
6. Restore failure after consumed route-store backup handling restores every
   referenced file and removes verified transaction artifacts.
7. Explicit empty forbidden CLI parameters are rejected by bound-parameter
   presence before mutation.
8. Extra/mismatched Apply and Restore output metadata is rejected with safe
   target recovery.
9. The restored frontend workspace-markup test brings the focused count back to
   at least 21.
</required_red_tests>

<verification>
Run and report fresh evidence:

1. `python -m unittest tests.test_claude_adapter tests.test_capabilities`
2. `node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs`
3. Gate 2 `51/51` and Gate 3 overall pass.
4. OpenCode `34/34` and Kilo `32/32`.
5. Full Python and frontend suites. Only the independently established two
   preference failures and one onboarding-copy failure may remain.
6. PowerShell parser checks and `git diff --check`.
7. Re-run the three Sol reproductions above and require all to invert:
   `APPLY_INVALID_OUTPUT_TARGET_UNCHANGED=True`,
   `PRUNE_PARTIAL_FAILURE_RESTORED_FIRST=True`, and
   `CLI_EXPLICIT_EMPTY_FORBIDDEN_ACCEPTED=False`.
</verification>

<completeness_contract>
1. No post-production Apply validation failure can leave the target mutated.
2. No prune or restore partial failure can orphan a backup, overwrite an
   unrelated staging file, or restore a manifest that references a deleted file.
3. Exact CLI bound-parameter and exact output-object contracts are enforced.
4. All existing tests are preserved and new tests prove every failure boundary.
5. Dependency installation is reproducible from tracked files.
6. Update `planning/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md` to remove the
   disproven PASS claim until all evidence is green, then record the round-2
   RED/GREEN results honestly.
</completeness_contract>

<output_contract>
Return a concise report with files changed, one-to-one fixes for findings 1-8,
RED tests and observed failures, exact final commands/counts, unresolved risks,
and explicit confirmation that no real state was accessed, Gate 5 remained
locked, unrelated baseline failures were untouched, and no commit was made.
Do not claim PASS while any reproduction or boundary test fails.
</output_contract>
