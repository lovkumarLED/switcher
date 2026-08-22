# DeepSeek Gate 4A Repair From Sol Review Findings

<task>
Repair the current Gate 4A implementation in this repository. Work directly in
the existing worktree. Do not use subagents, Graphify, or any real Claude Code
state. Start by reading the authoritative contract and the current
implementation, then add failing tests before changing implementation code.

Authoritative contract:

- `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`, revision 5
- `planning/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md`

Current implementation report, which must be corrected rather than trusted as
proof:

- `planning/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md`

This is a Gate 4A repair only. Do not start Gate 4B and do not authorize or run
Gate 5 live validation.
</task>

<grounding_rules>
1. Treat the repository files and the revision-5 handoff as the only sources of
   truth. Do not guess about behavior that can be inspected or tested.
2. A passing existing test is not proof when the test encodes the same defect
   as the implementation or omits a required failure boundary.
3. Do not weaken, delete, skip, or relabel an existing test to make it pass.
4. Do not reinterpret a contract failure as a documentation-only issue.
5. Preserve unrelated user changes in the dirty worktree.
6. Keep all test execution inside repository fixtures or fresh GUID temporary
   roots. Never inspect or mutate a real Claude profile.
</grounding_rules>

<action_safety>
1. Do not read, list, hash, parse, copy, or write the real user Claude directory,
   real Claude settings, `.claude.json`, `.jsonc`, MCP/OAuth/session state,
   prompts, transcripts, credentials, or global OpenCode configuration.
2. Keep `ALLOW_REAL_CLAUDE_TARGET = False`. Do not pass `-AllowRealTarget`.
3. Use only fake secret environment variables from tests.
4. Do not start a server against the real profile. HTTP tests must use FastAPI's
   in-process client with `get_profile_root()` overridden to a GUID temporary
   profile root.
5. Do not edit OpenCode/Kilo builders or their test harnesses.
6. Do not commit, stage, reset, clean, or revert files.
</action_safety>

<confirmed_findings>
Fix every finding below. These are observed implementation defects, not optional
suggestions.

1. Frontend fingerprint mismatch

   - Backend `app/app/claude_adapter.py:_fingerprint()` returns a lowercase
     64-hex SHA-256 over canonical managed-route JSON.
   - `app/assets/js/pages/claude-routes.js:fingerprintOf()` instead returns a
     `JSON.stringify([...])` array.
   - `app/assets/js/pages/overview.js:renderClaudeOverview()` repeats the same
     incompatible JSON-array comparison.
   - Existing frontend tests manufacture the same incorrect array string, so
     they pass while the real backend response can never render `Applied`.

   Repair this with one canonical backend fingerprint source. Prefer adding a
   derived, non-persisted `configSha256` field to each route returned by Claude
   route APIs, computed by `_fingerprint()`. The frontend must compare that
   64-hex value with `appliedRouteConfigSha256`. Do not implement a second
   fingerprint algorithm in JavaScript. Do not persist the derived response
   field in `claude-routes.json`.

2. Capability loading still exposes an incorrect first render

   - `app/assets/js/main.js:showWorkspace()` unhides `appShell` before awaiting
     capabilities.
   - It ignores a `false` result from `safeRefreshAgentContext()` and initializes
     the router anyway, allowing a generic provider page to render when the
     capability request failed.

   Keep the app shell hidden until capabilities are loaded and navigation has
   been adapted. On first-load capability failure, render a bounded unavailable
   state and do not initialize a generic workspace/router. Prove there is no
   Build-button or Integrations flash before Claude capabilities are known.

3. Claude Providers route calls OpenCode/Kilo APIs before branching

   - `app/assets/js/pages/providers.js:renderProviders()` calls
     `loadProviders()` and `/api/status` before `renderProviderWorkspace()` checks
     `isClaude()`.
   - The nested `renderClaudeRoutes()` promise is not awaited.

   Branch on the central capability at the start of `renderProviders()` and
   await/return `renderClaudeRoutes()` before any provider, formats, or generic
   status API call. Remove Claude identity guessing from page-local display-name
   maps where it is no longer reachable or needed. Keep OpenCode/Kilo behavior
   unchanged.

4. Production CLI does not enforce its exact parameter contract

   `app/engine/claude-code/build-claude-code-production.ps1` currently accepts
   forbidden combinations and does not require all Restore parameters. Enforce
   section 7.1 using the script's bound-parameter set:

   - Apply requires `RoutingProfilePath` and forbids `BackupPath`,
     `ExpectedBackupSha256`, and `TargetBindingSha256`.
   - Restore forbids `RoutingProfilePath` and requires non-empty `BackupPath`,
     `ExpectedBackupSha256`, and `TargetBindingSha256`.
   - Unknown parameters remain rejected by PowerShell parameter binding.
   - Validate trusted routing/schema inputs as existing non-reparse leaves with
     forbidden state-leaf/comment-suffix guards before content reads.
   - Preserve the real-profile lock before any real target probe.

5. Target binding is incomplete and unused

   - Python currently binds the profile root, not the canonical settings target.
   - Python does not pass `-TargetBindingSha256` to Restore.
   - PowerShell accepts `TargetBindingSha256` but never validates it.

   Implement the exact section 11.5 target-path algorithm in both layers. The
   manifest stores the SHA-256 of the normalized canonical settings target
   identity. Restore passes the value to production, and production recomputes
   and compares it before target mutation. Add different-target and
   case-equivalent Windows-path tests.

6. Apply output emits invalid pre-write metadata

   - `claude-routing-core.psm1` computes `$preHash` after replacement.
   - It emits `preWriteTargetSha256` as an empty string.

   Capture the target SHA-256 before mutation and emit exact non-empty 64-hex
   pre-write and post-write hashes. The Python adapter must validate the exact
   output object, backup filename contract, all hash fields, `coreVersion`, and
   `schemaIdentity` before accepting it. It must verify pre-write hash equals the
   request's target revision and post-write hash equals the actual new target.
   Apply and Restore must both reject a wrong returned schema identity without
   committing metadata.

7. Apply rollback is bypassed or accepted without target verification

   - In `claude_route_apply()`, `except HTTPException: raise` bypasses rollback
     after the production target transaction. `_read_manifest()` and
     `_prune_oldest()` can take this path after target mutation.
   - The rollback subprocess result is ignored.
   - The final rollback check verifies only store/manifest/activity bytes, not
     the target revision or directory inventory.
   - A failed apply can leave transaction-created route-store backup files.

   Once production Apply has succeeded, every later failure must enter the exact
   section 11.7 rollback sequence regardless of exception class. Validate the
   production Restore rollback result, restore and verify every artifact, verify
   the original target revision and directory inventory, and remove only the
   failed transaction's validated route-store backup/temp files after successful
   rollback. On rollback failure, preserve evidence and return a generic hard
   failure without claiming recovery.

8. Manifest pruning is irreversible inside an unfinished commit

   `_prune_oldest()` deletes old backup files before the new manifest/activity
   commit is known to succeed. A later failure restores manifest bytes that can
   reference backups already deleted.

   Make pruning rollback-safe and consistent with sections 11.4 and 11.7. All
   eligibility checks happen before mutation. No failure path may leave a
   restored manifest referencing deleted backups or orphan a backup. Add failure
   injection after prune preparation and at subsequent commit boundaries.

9. Restore validates route-store state after target mutation and has no complete
   metadata rollback

   - Target Restore runs before validating the previous route-store backup's
     JSON, duplicate keys, and versioned shape.
   - Missing/invalid route-store backup errors can occur after target mutation.
   - `except HTTPException: raise` bypasses rollback.
   - Generic rollback restores manifest/activity only, not route store or target.
   - The consumed route-store backup can be deleted before the full commit is
     proven.

   Perform every section 11.6 eligibility check before target mutation,
   including target backup JSON/duplicate-key validation and route-store backup
   filename, containment, reparse, hash, JSON, duplicate-key, invariant, and
   versioned-shape validation. Then make target, route store, manifest, activity,
   and consumed-backup handling one rollback-backed operation. A failure at any
   post-target boundary must recover and verify all artifacts or return a hard
   failure while preserving evidence.

10. Restore output and synthetic boundaries are incomplete

   - The adapter does not validate Restore `coreVersion` or returned
     `schemaIdentity`.
   - `AfterRecoveryReplace` is accepted by PowerShell but never injected.
   - Required production Restore boundary tests are absent.

   Validate the exact Restore output contract. Implement all five synthetic
   Restore stages from section 11.6 and prove each leaves a verified parseable
   target, never retries the same backup, and returns the required exit class.

11. Activity retention writes blank lines and retains about half the intended
   events

   `_append_activity()` adds a string that already contains a newline and then
   joins it with another newline. Keep exactly one JSON object per line and the
   newest 200 valid events. Add an exact 200-of-250 retention assertion, not only
   `<= 200`.

12. Existing tests do not cover revision-5 acceptance criteria

   Add focused failing tests for the defects above and the omitted criteria,
   especially handoff sections 14.2 items 22, 26-35, 40, and 43. Replace
   tautological or self-confirming assertions. Specific current weaknesses:

   - Frontend test data uses the same wrong JSON-array fingerprint as production
     frontend code.
   - `test_apply_rollback_restores_all_artifacts` compares a target hash to a
     freshly computed hash of the same target and does not verify full inventory.
   - No test injects every apply/restore commit and rollback boundary.
   - No test proves malformed or duplicate-key target and route-store backups are
     rejected before mutation.
   - No in-process HTTP test proves Host/Origin checks run on every protected
     endpoint before malformed body processing.
   - Locked-endpoint tests do not exercise every mutation and protected metadata
     endpoint.
   - No production CLI matrix proves required/forbidden parameter combinations.
   - Manifest cap tests assert only upper bounds rather than exact ownership and
     no-orphan invariants.
</confirmed_findings>

<implementation_constraints>
1. Keep the smallest correct architecture, but do not collapse required
   transaction stages merely to reduce code.
2. Keep one shared PowerShell routing core. Do not duplicate Apply/Restore logic
   in wrappers.
3. Preserve Gate 2's fixture CLI and all 51 behaviors.
4. Preserve Gate 3, OpenCode, and Kilo behavior.
5. Keep canonical agent/capability decisions centralized. Pages may consume
   `isClaude()` but may not inspect agent names, directories, or display labels
   to infer capabilities.
6. Keep secret values out of stores, manifests, activity, responses, exceptions,
   subprocess output, and reports.
7. All revisions and fingerprints are full lowercase SHA-256.
8. No clear-applied-route endpoint or action may be added.
9. Restore must not require the restored settings to match the current route.
10. Do not add backward compatibility for unshipped Gate 4 runtime state. Gate 4
    has not been live-authorized.
</implementation_constraints>

<test_order>
1. Add narrowly focused tests that fail for each confirmed defect. Record the
   RED command and concise reason in the report without embedding sensitive or
   absolute-path data.
2. Repair implementation until focused tests pass.
3. Run all required verification from the repository app directory:

   - `python -m unittest tests.test_claude_adapter tests.test_capabilities`
   - `node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs`
   - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\engine\claude-code\test-claude-code.ps1`
   - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\engine\claude-code\test-provider-model.ps1 -PythonExe <absolute approved Python>`
   - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\engine\test-opencode-v2.7.ps1`
   - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\engine\kilo\test-kilo-v1.ps1`
   - `python -m unittest discover -s tests -p "test_*.py"`
   - `node --test ".\tests\*.test.mjs"`
   - PowerShell parser checks for all Claude engine scripts/modules
   - `git diff --check`

4. The two existing `test_preferences` browser-default expectation failures and
   the existing onboarding model-copy frontend failure were independently
   reproduced by Sol before this repair. Do not edit those unrelated tests or
   features. Report them as unchanged baseline only if they remain exactly the
   same three failures. Any new failure blocks completion.
</test_order>

<completeness_contract>
The repair is complete only when all of the following are true:

1. A real backend route response can render `Applied`, and editing any managed
   field renders `Changes not applied` until reapply.
2. No Claude page calls provider/plugin/MCP/build APIs or briefly exposes their
   controls before capabilities are available.
3. The production CLI rejects every forbidden/missing parameter combination
   before target mutation.
4. Apply and Restore validate target binding, exact output metadata, schema
   identity, and version observability.
5. Every post-target failure boundary either restores and verifies all owned
   artifacts or reports a generic hard failure while preserving evidence.
6. Restore validates all target and route-store backup eligibility before target
   mutation.
7. Manifest cap/prune/pop has no orphaned files and no manifest references to
   deleted files under success or injected failure.
8. Activity retains exactly the newest 200 valid single-line events.
9. Gate 2 is 51/51, Gate 3 is overall pass, OpenCode is 34/34, Kilo is 32/32,
   focused Gate 4A tests are all green, and full suites have no failures beyond
   the three independently established unrelated baseline failures.
10. `planning/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md` is updated honestly
    with corrected implementation details, RED/GREEN evidence, exact final
    counts, and remaining baseline failures. Remove any earlier claim disproven
    by this review.
</completeness_contract>

<output_contract>
Work autonomously through implementation and verification. At completion,
return a concise report containing:

1. Files changed.
2. Defects fixed, mapped one-to-one to the 12 confirmed findings.
3. New tests and the failure each test reproduced before the fix.
4. Exact final commands, exit codes, and counts.
5. Any blocker or unresolved contract criterion.
6. Explicit statements that no real Claude state was accessed, Gate 5 remains
   locked, no unrelated baseline failure was edited, and no commit was made.

Do not claim Gate 4A PASS if any confirmed finding, required boundary test, or
verification command remains unresolved.
</output_contract>
