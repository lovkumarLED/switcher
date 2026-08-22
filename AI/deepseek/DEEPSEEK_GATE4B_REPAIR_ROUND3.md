# DeepSeek Gate 4B Repair Round 3

<authorization_boundary>
Do not execute unless the human user explicitly authorizes this prompt. This is
a completion repair for Revision 7, not a new handoff revision. Authorization
permits edits only to the existing Revision-7 handoff metadata, adapter TESTING
document, and final Gate 4 report. It does not authorize Gate 4A source/tests,
Gate 5, real-target access, release work, or any other scope expansion.
</authorization_boundary>

<status>
Gate 4B remains FAIL/BLOCKED. The round-2 repair fixed the ASCII scope,
compatibility table, Python paths, hashes, and historical-decision wording, but
three documentation inconsistencies remain. Do not claim PASS until all three
are corrected and freshly verified.
</status>

<safety>
1. Never inspect or mutate real Claude/OpenCode state or private data.
2. Do not invoke Claude Code, contact a gateway, start a live server, pass
   `-AllowRealTarget`, or weaken either lock.
3. Do not use subagents or Graphify.
4. Do not commit, stage, reset, clean, checkout, restore, or revert.
5. Do not edit implementation, tests, release-owned files, deferred BDF files,
   templates, or unrelated dirty work.
</safety>

<confirmed_remaining_findings>
1. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md` title says Revision
   7, but line 15 still says `**Revision:** 6`. Revision metadata is internally
   inconsistent.
2. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md` labels section 3
   "exact commands", but its four RED entries contain prose and command
   fragments only. There are zero complete fenced executable RED commands in
   the RED subsection. This still violates Revision-7 section 22 item 3.
3. `adapters/claude-code/TESTING.md` and the report name
   `test-provider-model.ps1` in the five-file parser set, but the authorized
   round-2 requirement named the provider/model inspector
   `inspect-provider-model.ps1`. The independently verified five-file set is:
   - `claude-routing-core.psm1`
   - `build-claude-code.ps1`
   - `build-claude-code-production.ps1`
   - `inspect-provider-model.ps1`
   - `test-claude-code.ps1`
</confirmed_remaining_findings>

<repairs>
1. Handoff metadata:
   - Keep the title at Revision 7.
   - Change the metadata line to `**Revision:** 7`.
   - Update its parenthetical description to include the Revision-7
     documentation-only ASCII, RED-command, and tracked-content corrections.
   - Do not alter Revision-7 behavior or scope.

2. Adapter TESTING parser set:
   - Replace `test-provider-model.ps1` with `inspect-provider-model.ps1` in the
     named five-file parser list.
   - Keep all corrected commands, counts, lifecycle status, evidence date, and
     document version unchanged.

3. Final report:
   - Set FAIL/BLOCKED while editing and PASS only after verification.
   - Replace each of the four RED prose-only entries with a complete fenced
     PowerShell command that a reviewer can copy and execute independently.
   - For each RED, immediately record the observed pre-fix exit/result and
     failure marker. Preserve the complete fenced GREEN commands and markers.
   - RED 1 must contain the full Revision-6 added-diff ASCII command, including
     how `$sourceAllowlist`, `$docAllowlist`, and the per-file diff scan are
     established, or a complete standalone reproduction command with the same
     exact scan set and behavior. A variable name plus prose is not a command.
   - RED 2 must contain the complete standalone feature-table column-count
     command that observed the five-column separator failure.
   - RED 3 must contain the complete standalone command executed from `app`
     that proved the old Python path false and the corrected path true.
   - RED 4 must contain the complete standalone report-contract command that
     detected zero complete executable RED commands in the Revision-6 report.
   - Correct the parser evidence to the five-file set above.
   - Update the embedded TESTING SHA-256 after its parser-list edit. Keep the
     other adapter hashes accurate.
   - Keep honest Revision-7 ASCII markers, tracked-content wording, restore
     disclosure, lifecycle status, Gate 5 prohibition, release status, and
     accepted baseline failures unchanged.
</repairs>

<verification>
Run fresh evidence:

1. Handoff title revision equals metadata revision and both equal 7.
2. Extract the report RED subsection and prove it contains four complete fenced
   PowerShell command blocks, one per RED finding.
3. Run or parse each recorded RED/GREEN command and verify it is standalone;
   historical RED outputs remain labeled as pre-fix observations.
4. Parse the exact five-file set named above and require five `PARSE_OK` results.
5. Verify TESTING names exactly that set.
6. Recompute all six created-file hashes; embed all five adapter hashes in the
   report and return all six in the worker response.
7. Re-run Revision-7 document added-line ASCII, six-created-file whole-ASCII,
   source/doc scans, compatibility table, TESTING path, adapter metadata,
   template neutrality, framework/PROJECT_STATE/decision/release checks,
   `git diff --check`, and empty `app/state` status.
8. Run the fresh regression battery required by Revision 7. Do not edit
   implementation/tests to change results.

If any check fails, report BLOCKED.
</verification>

<response_contract>
Return PASS/FAIL/BLOCKED, the exact three files repaired, all six hashes, exact
RED/GREEN commands and outputs, all fresh checks/counts, and confirmation that
no forbidden action or file edit occurred.
</response_contract>
