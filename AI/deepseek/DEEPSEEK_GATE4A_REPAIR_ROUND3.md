# DeepSeek Gate 4A Repair Round 3

<task>
Fix the final Gate 4A transaction-state defects found by Sol after round 2.
Keep this change narrowly scoped to rollback control flow, cleanup result
handling, tests, dependency reproducibility, and the Gate 4A report. Do not
start Gate 4B or Gate 5.
</task>

<grounding_rules>
1. Read the revision-5 handoff, both previous repair prompts, and the current
   implementation/report.
2. Add RED tests for every finding before implementation changes.
3. Do not weaken or delete existing tests.
4. A green broad suite does not override a targeted transaction reproduction.
</grounding_rules>

<action_safety>
1. Never access real Claude state or credentials.
2. Keep both real-target locks closed; never pass `-AllowRealTarget`.
3. Do not edit OpenCode/Kilo builders or harnesses.
4. Do not commit, stage, reset, clean, or revert unrelated changes.
5. Do not use subagents or Graphify.
</action_safety>

<blocking_findings>
1. Invalid Apply output executes rollback twice.

   Location: `app/app/claude_adapter.py:861-888`.

   The validation-error branch calls `_rollback_apply()` at lines 864-866 and
   then raises. The outer `except` sees `applied == True` and calls
   `_rollback_apply()` again. Sol instrumented the function and reproduced:

   `INVALID_OUTPUT_ROLLBACK_CALLS=2`

   Rollback must execute exactly once. Do not retry the same backup/recovery
   operation after successful recovery. Route all post-exit-0 failures through
   one outer rollback path, preserving the specific internal failure only for
   safe generic response selection.

2. Successful Apply ignores recovery-artifact cleanup failure and returns
   success with an unreferenced backup.

   Location: `app/app/claude_adapter.py:879-882`.

   `_remove_owned_file(recovery_path, recovery_sha)` returns a boolean, but the
   result is ignored. Sol patched it to return false and reproduced:

   `APPLY_SUCCEEDED_WITH_FAILED_RECOVERY_CLEANUP=True`

   A false cleanup result must never produce `{ ok: true }`. Since the settings,
   route store, manifest, and activity are already committed, do not roll them
   back after cleanup starts. Return the documented generic committed-but-
   cleanup-failed hard error and preserve the verified cleanup artifact as
   evidence.

3. Restore has the same ignored recovery cleanup result.

   Location: `app/app/claude_adapter.py:1046-1051`.

   Check the boolean result from recovery cleanup and surface the same
   committed-but-cleanup-failed hard state. Add separate Apply and Restore tests
   where `_remove_owned_file` returns false rather than raises.

4. Pre-commit failure cleanup also ignores failures.

   Locations: `app/app/claude_adapter.py:793-794, 852-860`.

   `_cleanup_failed_apply_files()` discards `_remove_owned_file` results, and
   the code-1 branch ignores recovery cleanup failure. Verify target revision
   after production exit 1. If any owned pre-call artifact cannot be safely
   removed, return a generic hard failure and preserve evidence rather than a
   normal 400 response.

5. Cleanup evidence and no-orphan wording are inconsistent.

   The report says cleanup-injected committed paths leave an unreferenced
   `.bdf-*-<guid>.tmp` file and also says there are no unresolved risks. The
   revision-5 criteria require no ordinary orphaned adapter files, while hard
   rollback/cleanup failures require preserving evidence.

   Make the distinction explicit and testable:

   - Success paths leave no transaction temp or unreferenced recovery file.
   - Recoverable failure paths clean all verified transaction artifacts.
   - Injected deletion failure returns a generic hard failure, never success,
     and preserves only the exact verified evidence file that could not be
     deleted.
   - The report must call this a residual hard-failure evidence condition, not
     “no unresolved risks.”

6. The declared HTTP test dependency still emits a deprecation warning.

   Fresh focused/full Python runs emit:

   `StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated; install httpx2 instead.`

   Use the dependency expected by the installed FastAPI/Starlette TestClient and
   declare it in `app/requirements.txt`, or replace TestClient usage with a
   supported declared in-process mechanism. Do not rely on a warning-producing
   deprecated compatibility package.
</blocking_findings>

<required_red_tests>
1. Instrument invalid-output Apply and assert `_rollback_apply` is called
   exactly once while target/store/manifest/activity are restored.
2. Apply recovery cleanup returning false yields HTTP 500/hard failure, never
   `{ ok: true }`; committed state remains internally consistent and only the
   verified evidence file remains.
3. Restore recovery cleanup returning false has the same result.
4. Production exit 1 plus transaction-store or recovery cleanup failure yields
   hard failure and verifies target/state consistency.
5. Normal Apply/Restore success leaves no pre-call recovery artifacts.
6. Focused Python tests run without the TestClient dependency deprecation
   warning.
</required_red_tests>

<verification>
1. Re-run targeted tests and require:
   - `INVALID_OUTPUT_ROLLBACK_CALLS=1`
   - `APPLY_SUCCEEDED_WITH_FAILED_RECOVERY_CLEANUP=False`
2. Focused Python and frontend contract suites all pass.
3. Gate 2 is 51/51; Gate 3 is overall pass; OpenCode is 34/34; Kilo is 32/32.
4. Full Python has only the two established preference failures; full frontend
   has only the established onboarding-copy failure.
5. PowerShell parsers and `git diff --check` pass.
</verification>

<output_contract>
Return files changed, one-to-one fixes, RED/GREEN evidence, exact final counts,
and an honest residual-risk statement. Confirm no real state access, Gate 5
locked, Gate 4B not started, baseline failures untouched, and no commit. Do not
claim Gate 4A PASS until both targeted reproductions invert.
</output_contract>
