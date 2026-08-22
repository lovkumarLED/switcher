# DeepSeek Gate 4B Documentation Implementation

<task>
Implement Gate 4B exactly as authorized by revision 5 of
`planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`. Gate 4A is accepted
after three repair rounds and independent Sol verification. Gate 4B is a
documentation/framework/template synchronization task only. Do not modify Gate
4A implementation or tests, and do not start Gate 5.

Create or modify exactly the 35 Gate 4B files identified as A1-A5, G1-G7,
D1-D13, M1-M9, and R1 in handoff sections 3.6-3.10. Six files are created and
29 are modified.
</task>

<authoritative_sources>
Read these before editing:

1. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`, especially
   sections 3.6-3.12, 5, 15-23.
2. `planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md`, especially
   sections 4, 6-10.
3. `planning/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md`, read-only.
4. `planning/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md`, accepted Gate 4A
   evidence including repair-round residual hard-failure evidence wording.
5. Gate 1, Gate 2, and Gate 3 reports for evidence-level and compatibility
   facts.
6. Current versions of every paired project document and template before
   editing either side.
</authoritative_sources>

<grounding_rules>
1. Use only facts present in the repository and accepted gate reports.
2. The strongest lifecycle phrase is exactly `Integrated, not live validated`.
   It means not supported for normal use and does not imply Gate 5 evidence.
3. Root and generic BDF documents summarize reusable architecture. All Claude-
   specific paths, settings, environment variables, behavior tables, version
   evidence, and limitations belong under `adapters/claude-code/`.
4. Preserve historical entries. Append the new decision; never rewrite the
   2026-08-08 decision or historical ROADMAP wording.
5. Do not claim zero baseline failures. Record the accepted unrelated baseline:
   two preference-test failures and one onboarding-copy frontend failure.
6. Do not infer compatibility beyond Claude Code 2.1.153 observed in Gate 1.
7. No placeholders, TODOs, unsupported promises, or invented generated tools.
</grounding_rules>

<action_safety>
1. Documentation and repository metadata only. Never inspect or mutate real
   Claude/OpenCode configuration, credentials, backups, prompts, sessions,
   plugins, MCP, OAuth, marketplaces, or transcripts.
2. Do not invoke Claude Code, start a live server, contact a gateway, pass
   `-AllowRealTarget`, or alter either real-target lock.
3. Do not use subagents or Graphify.
4. Do not commit, stage, reset, clean, restore, or revert files.
5. Preserve all unrelated dirty worktree changes.
6. Do not modify any forbidden file from handoff section 3.11, including Gate
   4A source/tests, release sources/generated artifacts, deferred BDF files,
   `ROADMAP.template.md`, or `PROJECT_STATE.template.md`.
</action_safety>

<file_contract>
Create exactly:

1. `adapters/claude-code/README.md`
2. `adapters/claude-code/ADAPTER.md`
3. `adapters/claude-code/BUILDER_SPEC.md`
4. `adapters/claude-code/TESTING.md`
5. `adapters/claude-code/COMPATIBILITY.md`
6. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`

Modify exactly:

1. `bdf/FRAMEWORK.md`
2. `bdf/PROJECT_ADAPTER.md`
3. `bdf/AI_WORKFLOW.md`
4. `bdf/TESTING.md`
5. `bdf/BUILDER_EVOLUTION.md`
6. `bdf/README.md`
7. `bdf/VERSION.md`
8. `planning/DECISIONS.md`
9. `README.md`
10. `PROJECT_STATE.md`
11. `ROADMAP.md`
12. `ADAPTER.md`
13. `ARCHITECTURE.md`
14. `BUILDER_SPEC.md`
15. `FOLDER_STRUCTURE.md`
16. `JSON_SCHEMAS.md`
17. `TESTING.md`
18. `CONTRIBUTING_FOR_AI.md`
19. `app/README.md`
20. `app/engine/schemas/README.md`
21. `bdf/templates/ADAPTER.template.md`
22. `bdf/templates/ARCHITECTURE.template.md`
23. `bdf/templates/BUILDER_SPEC.template.md`
24. `bdf/templates/CONTRIBUTING_FOR_AI.template.md`
25. `bdf/templates/FOLDER_STRUCTURE.template.md`
26. `bdf/templates/JSON_SCHEMAS.template.md`
27. `bdf/templates/README.template.md`
28. `bdf/templates/TESTING.template.md`
29. `bdf/templates/README.md`

Stop if correct implementation requires any additional file.
</file_contract>

<implementation_sequence>
1. Record pre-edit `git status`, exact Gate 4B path inventory, SHA-256 of every
   existing file to be modified, SHA-256 of `release_registry.json`, and the
   exact bytes of the historical 2026-08-08 decision block. Do not print file
   contents or unrelated paths.
2. Create the five adapter documents per handoff A1-A5. Every file must contain
   the exact lifecycle phrase, evidence date, document-version footer `1.0`,
   Gate 5 warning, and target-appropriate links. The README lists all five
   document versions. Implementation version is `0.1.0`; tested target version
   is only `2.1.153`.
3. Update G1-G7 with neutral framework concepts: same-architecture adapters,
   unique bounded patch adapters, capability-driven unique-adapter layers, and
   fixture/integration/live evidence gates. Retain historical Claude statements
   as explicitly historical.
4. Update `bdf/VERSION.md` from 2.2.11 to 2.3.0 exactly per handoff sections 18
   and 19: current block, `## Version 2.3.0` history, Version History row,
   Compatibility table row. Update `bdf/README.md` footer and registered docs.
   Do not create an app/project release and do not touch release-owned files.
5. Append D1 to `planning/DECISIONS.md`: reverse the broad exclusion only for
   the narrow unique routing adapter, preserve all prohibitions, and record the
   canonical `app/engine/claude-code/` plus `app/state/claude-routes.json` path
   amendment. Prove the 2026-08-08 block is byte-identical.
6. Update D2-D13 with concise summaries and links. Preserve historical ROADMAP
   Phase 11 resolution. Keep root `ADAPTER.md` OpenCode-focused and link target
   detail outward.
7. Update M1-M9 with only reusable generic structure. Templates must contain no
   Claude-specific path, setting name, environment variable, target version, or
   support claim. Do not edit `ROADMAP.template.md` or
   `PROJECT_STATE.template.md`.
8. Regenerate `PROJECT_STATE.md` manually from current repository facts using
   the exact 15-section structure in handoff section 15. Preserve generated
   release/version regions and existing generated version rows. Mark historical
   or absent paths inline with `(historical)` or `(absent)`. Remove all template
   placeholders.
9. Run stage-1 source/document scans using only the exact allowlists in handoff
   section 17. Never broaden a scan to global configuration or paths outside the
   repository.
10. Create R1 at
    `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md` with all 14 required
    fields from section 22. Cite the Gate 4A precursor report and all three
    repair rounds. Include accepted residual hard-failure evidence semantics.
11. Run final report-inclusive stage-3 scans, all section-18 synchronization
    checks, exact scope/file-count checks, ASCII checks, path checks, version
    checks, historical-block and release-registry integrity checks, and
    `git diff --check`.
</implementation_sequence>

<verification_contract>
1. Adapter five-file check: all five files exist, contain the exact lifecycle
   phrase and same evidence date, and use document version 1.0.
2. Template check: M1-M8 mirror generic paired-project changes; M9 inventory and
   pairing matrix are synchronized; no target-specific tokens appear.
3. Framework check: 2.3.0 is consistent across `bdf/VERSION.md`,
   `bdf/README.md`, and `PROJECT_STATE.md`; all required 2.3.0 history and
   compatibility rows exist.
4. PROJECT_STATE check: all 15 exact headings exist once, no `{{...}}`
   placeholders remain, and the repository-bounded backticked-path check from
   section 18 passes.
5. History/release check: new decision exists, 2026-08-08 block is byte-
   identical, `release_registry.json` and all generated release artifacts are
   byte-identical.
6. Scope check: exactly 35 Gate 4B files changed, with exactly six created and
   29 modified; no forbidden or deferred file changed because of Gate 4B.
7. Regression evidence remains current:
   - Gate 2: 51/51.
   - Gate 3: overall pass.
   - OpenCode: 34/34.
   - Kilo: 32/32.
   - Focused Gate 4A Python: 79 adapter + 8 capability tests.
   - Focused frontend: 21/21.
   - Full Python: 171 tests with only the two established preference failures.
   - Full frontend: 99 pass with only the established onboarding-copy failure.
8. `git diff --check`, PowerShell parser checks, source scan, documentation scan,
   report contract, and ASCII checks pass.
</verification_contract>

<completeness_contract>
Gate 4B is complete only when all A1-A5, G1-G7, D1-D13, M1-M9, and R1
requirements are implemented; every synchronization and integrity check passes;
the status remains `Integrated, not live validated`; Gate 5 remains explicitly
unauthorized; and no release-owned or implementation file was changed.
</completeness_contract>

<output_contract>
Return a concise result matching report section 22:

1. Status PASS/FAIL/BLOCKED.
2. Exact created/modified file lists and SHA-256 for created files.
3. Documentation RED/GREEN evidence.
4. Exact test commands, exits, and counts including accepted baseline failures.
5. Framework/template synchronization and 2.3.0 evidence.
6. PROJECT_STATE regeneration evidence.
7. Security/status/source/doc scan markers.
8. Historical-decision and release-registry integrity evidence.
9. Rollback state, failures, risks, limitations, and deferred documents.
10. Explicit confirmation: no real state access, Gate 5 not run, no release,
    no forbidden edit, no commit/stage/reset/clean/revert.

Do not claim PASS if any file count, status phrase, history integrity, template
neutrality, version synchronization, or required check fails.
</output_contract>
