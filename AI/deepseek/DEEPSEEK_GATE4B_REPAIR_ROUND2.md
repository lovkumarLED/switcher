# DeepSeek Gate 4B Repair Round 2

<authorization_boundary>
This is a proposed revision-7 and Gate 4B documentation repair. Do not execute
unless the human user explicitly authorizes this prompt. Authorization permits
only the handoff/report/document corrections below. It does not authorize Gate
4A source or test edits, Gate 5, real-target access, release work, or any other
scope expansion.
</authorization_boundary>

<status>
Gate 4B remains FAIL/BLOCKED after independent review of the revision-6 repair.
Fresh behavioral regressions are stable, but four documentation-contract
defects are reproducible. Do not claim PASS until the exact corrected checks
pass.
</status>

<safety>
1. Never inspect or mutate real Claude/OpenCode state, credentials, backups,
   prompts, sessions, plugins, MCP, OAuth, marketplaces, or transcripts.
2. Do not invoke Claude Code, contact a gateway, start a live server, pass
   `-AllowRealTarget`, or weaken either real-target lock.
3. Do not use subagents or Graphify.
4. Do not commit, stage, reset, clean, checkout, restore, or revert.
5. Do not edit Gate 4A source/tests, release-owned files, deferred BDF files,
   `ROADMAP.template.md`, or `PROJECT_STATE.template.md`.
6. Preserve every unrelated dirty change.
</safety>

<independent_evidence>
The following fresh results were independently reproduced after the reported
revision-6 repair:

- Gate 2: 51/51.
- Gate 3: overall pass, 25 criteria tests.
- OpenCode: 34/34.
- Kilo: 32/32.
- Focused Python: 87/87.
- Focused frontend: 21/21.
- Full Python: 171 tests with only the two accepted preference failures.
- Full frontend: 100 tests, 99 pass, with only the accepted onboarding-copy
  failure.
- Five PowerShell files parse cleanly: routing core, fixture builder,
  production builder, provider/model inspector, and Gate 2 harness.
- Source prohibited-pattern scan, documentation lifecycle scan, five-adapter
  metadata check, PROJECT_STATE path/heading/version checks, template
  neutrality, created-file ASCII, created-file hashes, and `git diff --check`
  pass.

The following defects fail independently:

1. Running the exact revision-6 section 17.4a command produces
   `GATE4_ADDED_DIFF_ASCII_FAILED count=3`, on:
   - `app/assets/js/pages/onboarding.js` (pre-Gate dirty U+2019 line),
   - `app/assets/js/pages/overview.js` (accepted Gate 4A U+00B7 line),
   - `app/assets/js/pages/settings.js` (accepted Gate 4A U+2014 line).
   The report instead ran a documentation-only check and waived these lines,
   so its claim that the exact section-17.4a check passes is false.
2. `adapters/claude-code/COMPATIBILITY.md` has a four-column feature table but
   a five-column separator: `|---|---|---|---|---|`.
3. `adapters/claude-code/TESTING.md` says Python commands run from `app`, but
   uses `& .\app\env\Scripts\python.exe`; from `app`, that path is nonexistent.
4. The final report contains no exact RED command. Its RED section contains
   prose descriptions only, despite handoff section 22 and the repair prompt
   requiring exact RED and GREEN commands.
</independent_evidence>

<revision_7_corrections>
Modify `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md` only for these
review corrections and mark it Revision 7:

1. Correct section 17.4a so its executable check matches its stated baseline:
   - Gate 4-created files remain subject to whole-file ASCII.
   - Gate 4A source safety remains governed by the independently accepted Gate
     4A scans and evidence.
   - Gate 4B is documentation-only and adds no source lines. Its added-line
     ASCII command therefore scans only the 29 pre-existing files modified by
     Gate 4B, while the six Gate 4B-created files use whole-file ASCII.
   - Do not scan the Git diff of Gate 4A source files and call accepted Gate 4A
     or pre-Gate dirty lines Gate 4B additions.
   - Emit an honest marker such as `GATE4B_DOC_ADDED_DIFF_ASCII_OK`; do not emit
     `GATE4_ADDED_DIFF_ASCII_OK` from a command that cannot distinguish the
     pre-Gate/Gate-4A baseline.
   - Keep the exact source prohibited-pattern allowlist and scan unchanged.

2. Clarify section 22 RED/GREEN evidence:
   - The accepted Gate 4A precursor report remains authoritative for exact
     Gate 4A task RED/GREEN evidence.
   - The final Gate 4 report must contain exact commands, observed failures,
     corrected commands, exits, and markers for every Gate 4B and repair RED.
     A prose description or section reference is not an exact command.

3. Clarify historical-decision integrity wording:
   - `git diff --unified=0 -- planning/DECISIONS.md` must prove that the only
     tracked change is the appended 2026-08-14 block.
   - Describe the 2026-08-08 entry as tracked-content identical to HEAD and give
     the reproducible LF-normalized block hash. Do not call working-tree bytes
     byte-identical to the HEAD blob after performing line-ending normalization.

The revision-7 handoff correction remains a separately authorized planning
repair outside the exact 35-file Gate 4B implementation count.
</revision_7_corrections>

<content_repairs>
1. `adapters/claude-code/COMPATIBILITY.md`:
   - Change the feature-table separator to exactly four columns:
     `|---|---|---|---|`.
   - Do not alter compatibility claims except as needed for valid Markdown.

2. `adapters/claude-code/TESTING.md`:
   - Keep the stated app working directory and change focused/full Python paths
     to `& .\env\Scripts\python.exe`.
   - Keep test module/discovery paths relative to `app`.
   - State the full frontend count as 100 tests, 99 pass, one accepted failure.
   - State exactly which five PowerShell files were parsed, or intentionally
     define and run a smaller authoritative parser set consistently.

3. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`:
   - Set FAIL/BLOCKED during repair and PASS only after all corrected checks
     pass.
   - Replace the false revision-6 ASCII claim with the exact revision-7
     whole-created-file and Gate-4B-document-added-line commands and markers.
   - Include the exact RED commands and observed outputs for the ASCII failure,
     malformed compatibility table, incorrect TESTING command paths, and
     missing RED-command check. Include exact GREEN commands and outputs after
     repair.
   - Correct parser evidence to list the exact files actually parsed.
   - Replace the false blanket claim "no `.jsonc` handling and no
     forbidden-state references in Gate 4B files." Existing documents contain
     historical/negative references. State instead that no Gate 4B addition
     introduces positive `.jsonc` handling and protected-state names appear
     only in allowed negative safety statements.
   - Use precise tracked-content/LF-normalized wording for the historical
     decision evidence.
   - Update the embedded TESTING and COMPATIBILITY SHA-256 values after edits.
   - Keep status `Integrated, not live validated`, Gate 5 unauthorized, no
     release, and the three accepted unrelated baseline failures.
</content_repairs>

<verification>
Run fresh evidence after editing:

1. Exact revision-7 Gate 4B document added-line ASCII command and marker.
2. Whole-file ASCII for all six Gate 4B-created files.
3. Exact source prohibited-pattern and documentation lifecycle scans.
4. Compatibility feature-table column-count check; every row must have four
   columns.
5. Execute or path-resolve every command documented in adapter TESTING from
   its stated working directory.
6. Report-contract check proving at least one literal exact RED command and all
   required fields/hashes.
7. Five-adapter status/date/version check, template neutrality, framework
   2.3.0 synchronization, PROJECT_STATE headings/path/version checks,
   historical decision tracked-content check, and release-registry integrity.
8. Parse the exact named PowerShell set.
9. `git diff --check` and empty `git status --short -- app/state`.
10. Fresh full regression battery with the independently reproduced counts
    above. Do not edit implementation/tests to affect results.

If any check cannot pass in this documentation-only scope, stop and report
BLOCKED.
</verification>

<response_contract>
Return:

1. PASS/FAIL/BLOCKED.
2. Exact revision-7 handoff corrections.
3. Exact Gate 4B files repaired.
4. SHA-256 of all six created files in the worker response; five adapter hashes
   embedded in the report.
5. Exact RED/GREEN commands, outputs, exits, scan markers, and regression
   counts.
6. Scope, historical, release, and worktree integrity evidence.
7. Confirmation that no real state, Gate 5, release, implementation/test edit,
   commit, stage, reset, clean, checkout, restore, revert, subagent, or Graphify
   action occurred.
</response_contract>
