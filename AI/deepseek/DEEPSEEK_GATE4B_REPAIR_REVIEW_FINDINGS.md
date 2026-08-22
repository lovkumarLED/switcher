# DeepSeek Gate 4B Repair Review Findings

<authorization_boundary>
This is a proposed revision-6 and Gate 4B repair task. Do not execute it unless
the human user explicitly authorizes this prompt. That authorization permits
only the planning correction and documentation repair described below. It does
not authorize Gate 5, real-target access, implementation changes, release work,
or any other scope expansion.
</authorization_boundary>

<task>
Repair Gate 4B after independent Sol review found reproducible contract,
content, scope, and evidence failures. First make the minimum revision-6
corrections to the Gate 4 handoff that are necessary to remove two impossible
verification requirements. Then repair only the existing Gate 4B documentation
set. Preserve accepted Gate 4A implementation and all unrelated dirty work.

Gate 4B is currently FAIL/BLOCKED, not PASS. Do not retain or repeat a PASS
claim until every revised check passes.
</task>

<authoritative_inputs>
Read before editing:

1. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md` revision 5.
2. `planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md`.
3. `planning/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md`.
4. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`.
5. `AI/DEEPSEEK_GATE4B_DOCUMENTATION_IMPLEMENTATION.md`.
6. The five current files under `adapters/claude-code/`.
</authoritative_inputs>

<safety>
1. Never inspect or mutate real Claude/OpenCode state, credentials, backups,
   prompts, sessions, plugins, MCP, OAuth, marketplaces, or transcripts.
2. Do not invoke Claude Code, contact a gateway, start a live server, pass
   `-AllowRealTarget`, or weaken either real-target lock.
3. Do not use subagents or Graphify.
4. Do not commit, stage, reset, clean, checkout, restore, or revert.
5. Do not modify Gate 4A implementation/tests, release-owned files, deferred
   BDF files, `ROADMAP.template.md`, or `PROJECT_STATE.template.md`.
6. Make surgical text edits. Preserve all unrelated dirty changes.
</safety>

<confirmed_review_evidence>
Independent review reproduced the following:

1. Regression behavior remains stable:
   - Gate 2: 51/51.
   - Gate 3: overall pass, 25 criteria tests.
   - OpenCode: 34/34.
   - Kilo: 32/32.
   - Focused Python: 87/87.
   - Focused frontend: 21/21.
   - Full Python: 171 tests with only the two established preference failures.
   - Full frontend: 99 pass and only the established onboarding-copy failure.
   - Four PowerShell files parse cleanly.
   - `git diff --check` exits 0.
2. Template target-neutrality check passed for M1-M9.
3. `PROJECT_STATE.md` has all 15 exact headings once and no unresolved
   `{{...}}` placeholders.
4. `release_registry.json` has no tracked diff.
5. The original repository-bounded path check fails on the backticked generic
   token `adapters/<agent>/` in `PROJECT_STATE.md`.
6. The report contains only one 64-hex value, the historical decision hash;
   it contains none of the required created-document hashes.
7. The literal whole-file source scan fails on `app/server.py`. Its pre-existing
   line 1 contains an em dash, and the Gate 4 diff changes only router imports
   and registrations. Editing this Gate 4A source during Gate 4B is forbidden.
8. The literal whole-file documentation ASCII scan fails on every pre-existing
   modified Gate 4B project/framework/template document because the tracked
   baseline already contains Unicode diagrams, arrows, or punctuation.
9. Created adapter documents and the current report are whole-file ASCII.
</confirmed_review_evidence>

<revision_6_corrections>
Modify `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md` only for the
following planning corrections. Mark it revision 6 and describe these as review
corrections, not new implementation scope.

1. Restore section 18's path-check source to its pre-Gate-4B condition by
   removing `< >` from the skip character class. The line must again use:

   ```powershell
   if ($token -match '\s' -or $token -match '://' -or $token -match '[*{}\[\]?]') { continue }
   ```

   Gate 4B had improperly edited this read-only handoff merely to make a check
   pass. The repair belongs in `PROJECT_STATE.md`, not in this regex.

2. Replace whole-file ASCII requirements with a baseline-aware rule:
   - Every Gate 4-created file must be whole-file ASCII.
   - Every line added by Gate 4 to a pre-existing modified file must be ASCII.
   - Pre-existing non-ASCII bytes in unchanged baseline lines are permitted and
     must not be normalized merely to satisfy Gate 4.
   - Keep all prohibited-pattern scans, exact allowlists, and repository
     boundaries unchanged.
   - Add an executable added-diff-line ASCII check that ignores diff metadata
     (`+++`, `---`, and hunk headers), examines only `+` content lines, and
     remains constrained to the exact source/document allowlists.

3. Correct section 22's self-referential hash requirement:
   - The report must contain SHA-256 values for the other five created adapter
     documents.
   - After the report is finalized, the worker response must contain SHA-256
     values for all six created files, including the final report.
   - The report cannot contain its own final SHA-256 because adding that value
     changes the file and therefore its hash.

4. Preserve the exact Gate 4B implementation scope as 35 files: six created and
   29 modified. The revision-6 handoff correction is a planning repair outside
   that implementation count and must be reported separately. No other file is
   added to Gate 4B.
</revision_6_corrections>

<gate4b_content_repairs>
After revision 6 is internally consistent, repair only the existing Gate 4B
files that require correction.

1. `PROJECT_STATE.md`:
   - Do not change the path-check regex again.
   - Make generic notation such as `adapters/<agent>/` non-path prose rather
     than a backticked literal path. Do not falsely call it absent or historical.
   - Run the original repository-bounded path check and require PASS.

2. `adapters/claude-code/ADAPTER.md`:
   - Add the full `revision` and `routesRevision` contracts, including full
     lowercase 64-character SHA-256 shape and mutation/concurrency use.
   - Add route-store, applied fingerprint, manifest, and activity lifecycle.
   - Add the manifest cap and prune/pop policy, including transactional failure
     behavior and retained hard-failure evidence semantics from Gate 4A.
   - Add the canonical source mapping from handoff section 5.
   - Add both real-target locks from handoff section 8 and state that Gate 5 is
     the only authority that may unlock them.
   - Preserve exact managed/excluded ownership and status wording.

3. `adapters/claude-code/BUILDER_SPEC.md`:
   - Document all three scripts: fixture builder, provider/model inspector, and
     production Apply/Restore entry.
   - Reproduce the exact Apply and Restore parameter/bound-parameter contract
     from handoff section 7.1, including every allowed `TestFailureStage` value
     and every forbidden combination.
   - Keep exact strict JSON output keys and exit-code semantics.
   - Add target binding, schema identity, backup eligibility, no-retry, and
     hard-failure residual-evidence behavior where currently abbreviated.
   - Explicitly state Gate 5 remains unauthorized.

4. `adapters/claude-code/TESTING.md`:
   - Explicitly cover fixture, schema, unit, regression, integration, and live
     test groups and authorization by gate.
   - Record the exact current commands, exits, and counts for Gate 2, Gate 3,
     OpenCode, Kilo, focused Python, focused frontend, full Python, and full
     frontend. Include `-W error::DeprecationWarning` in the Python commands.
   - Keep the three accepted unrelated baseline failures distinct from Gate 4.

5. `adapters/claude-code/COMPATIBILITY.md`:
   - Add the route/gateway classes actually tested without publishing any
     credential or endpoint value.
   - Do not extrapolate beyond Claude Code 2.1.153 on Windows/PowerShell 5.1.

6. `bdf/README.md`:
   - Add actual links to the generic framework contracts summarized by the
     unique-adapter section.

7. `bdf/VERSION.md` and other generic BDF files:
   - Keep reusable framework language target-neutral. Remove current
     target-specific paths/details where the same facts belong only in
     `adapters/claude-code/`; historical examples may remain clearly marked as
     examples or history.
   - Preserve framework version 2.3.0 and all required history/compatibility
     evidence.

8. `planning/DECISIONS.md`:
   - Keep the 2026-08-08 block byte-identical.
   - Place the new 2026-08-14 decision before the document footer so the footer
     remains the footer. Do not alter the decision's bounded meaning.

9. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`:
   - Change status to FAIL/BLOCKED while repairing; set PASS only after all
     revised checks pass.
   - Include actual SHA-256 values for the five adapter documents. Put the final
     report hash only in the worker response.
   - Add the missing exact section-22 fields: Harness adaptation record,
     Capability evidence, and Correction evidence. Do not replace required
     content with a broad pointer to the Gate 4A report.
   - Record exact RED and GREEN commands/evidence rather than prose-only claims.
   - Correct the source/document scan descriptions and report the revised
     whole-created-file plus added-diff-line ASCII markers honestly.
   - Remove the contradiction between "restored tracked files from HEAD" and
     "no restore was performed." State exactly what command/action happened.
     If tracked files were replaced from HEAD, do not claim the no-restore rule
     was followed; disclose the violation and the integrity evidence available.
   - Do not claim no forbidden edit until the handoff is restored and the final
     scope check proves it.
   - Preserve lifecycle `Integrated, not live validated`, Gate 5 unauthorized,
     no release, and accepted baseline failures.
</gate4b_content_repairs>

<verification>
Run and report fresh evidence after edits:

1. Exact 35-file Gate 4B inventory: six created and 29 modified, plus the
   separately authorized revision-6 planning correction.
2. Whole-file ASCII for the six Gate 4B-created files.
3. Added-diff-line ASCII for pre-existing files in the exact Gate 4 source and
   documentation allowlists.
4. Original repository-bounded `PROJECT_STATE.md` path check, all 15 headings,
   and zero unresolved placeholders.
5. Five-file lifecycle/evidence-date/document-version checks.
6. M1-M9 target-neutrality and project/template synchronization checks.
7. Framework 2.3.0 synchronization.
8. Historical decision block hash and `release_registry.json` integrity.
9. Report field and five-adapter-hash checks.
10. Source prohibited-pattern scan and line-based lifecycle scan, without
    weakening either scan.
11. Four PowerShell parser checks and `git diff --check`.
12. Fresh regression battery with the exact expected results listed above.
13. `git status --short -- app/state` must be empty.

Do not modify implementation or tests to make verification pass. If a revised
check still cannot pass within this scope, stop and report BLOCKED.
</verification>

<response_contract>
Return:

1. PASS/FAIL/BLOCKED.
2. Exact revision-6 handoff corrections.
3. Exact Gate 4B files repaired.
4. SHA-256 for all six created files in the worker response; five adapter hashes
   also embedded in the final report.
5. Exact commands, exits, counts, scan markers, and accepted baseline failures.
6. Historical/release/worktree integrity evidence.
7. Explicit disclosure of any prior or current restore-from-HEAD action.
8. Confirmation that no real state, Gate 5, release, commit, stage, reset,
   clean, checkout, `git restore`, or unrelated file edit occurred during this
   repair.
</response_contract>
