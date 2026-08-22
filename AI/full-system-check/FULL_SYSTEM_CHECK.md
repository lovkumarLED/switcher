# FULL_SYSTEM_CHECK — complete end-to-end verification

> Rule: run a THOROUGH full-system check — not a spot check. Verify that every MD file
> is connected to every other MD file, that docs ↔ scripts ↔ profiles ↔ providers stay
> in sync, that the harnesses and release pipeline are green, and that per-session MD
> snapshots guarantee regeneration of the SAME builder features added in this session.
> Read `AGENT.md`, `AI/START_TASK.md`, and `bdf/TESTING.md` first.

---

# Why

Small edits (a feature here, a doc there) leave the system in a state nobody has
verified end-to-end. A full-system check is the only way to confirm:

- every MD file's references resolve (nothing references a file that does not exist),
- documents that must mirror each other (template ↔ reference, registry ↔ generated)
  are in sync,
- a clean-room regeneration produces a builder with the EXACT same features as the
  developer's real config,
- session snapshots exist so any future session can reproduce the current feature set.

---

# The Check (all parts must pass)

## Part 1 — Document graph (every MD ↔ every MD)

1. For every `.md` in `docs\` (recursive), extract every file reference (paths like
   `docs/X.md`, `scripts/x.ps1`, `profiles/...`, `providers/...`, `AI/...`, `bdf/...`, `templates/...`)
   and verify the target exists. List every broken reference.
2. For every "Read X first" / "see Y" link, confirm the file actually exists and the
   linked section heading exists.
3. `FOLDER_STRUCTURE.md` tree must match the real directory tree (folder names, file
   names, no phantom files).
4. `README.md`/`START_TASK.md` reading order must point to files that exist.

## Part 2 — Version consistency (registry ↔ generated)

1. `release_registry.json`: exactly ONE release with `"status": "Current"`.
2. `CHANGELOG.md` top entry version/date == Current release version/date.
3. `CURRENT_RELEASE.md` == Current release entry content (builder version, highlights).
4. `PROJECT_STATE.md` version table == registry Current + Previous versions.
5. `bdf/VERSION.md` "Supported Builder Versions" rows == registry versions.
6. `ROADMAP.md` status field (Completed/current builder) == registry Current.
7. Re-run `scripts/release-manager.ps1 -Update` twice; both runs must be a no-op
   (files byte-identical, exit 0) — determinism test.

## Part 3 — Harness + spec sync

1. `powershell -File scripts/test-opencode-v2.ps1` → 17/17 PASSED, exit 0.
2. `powershell -File scripts/test-opencode-v2.5.ps1` → 13/13 PASSED, exit 0.
3. Executable sync tests must be green: Test 12 (BUILDER_SPEC holds the 6 V2.5 tokens)
   and the V2.1 real-docs consistency test.
4. BUILDER_SPEC.md feature list ↔ builder script: every specified feature/stage exists
   in `scripts/build-opencode-v2.5.ps1` (grep the function names), and every stage in
   the script is documented in BUILDER_SPEC.md.

## Part 4 — Regeneration guarantee (clean-room rebuild)

1. Copy the current `opencode.json` as the expected result.
2. In a fresh temp root (`-ConfigRoot`), recreate profiles + providers + models, run
   `build-opencode-v2.5.ps1 -Profile <p> -NonInteractive`, and diff the output against
   the expected result. Features filled by per-session snapshots (Part 5) must reproduce
   identically — any new feature added since the last check must appear HERE.
3. If a difference is expected (new feature), confirm it is intentional and that the
   snapshot for this session (Part 5) contains it.

## Part 5 — Per-session MD snapshot rule

Rule: at the end of EVERY session that changes builder features or docs, snapshot the
documents so a future session can regenerate the same builder:

- Copy the building-block MD files — `BUILDER_SPEC.md`, `TESTING.md`,
  `ARCHITECTURE.md`, `ADAPTER.md`, `README.md`, `PROJECT_STATE.md`, `CHANGELOG.md`,
  `CURRENT_RELEASE.md`, `release_registry.json` — to
  `docs/.superpowers/snapshot-<SESSION N>/`.
- The snapshot proves "the builder generated from these docs has exactly these features"
  and lets the regeneration test (Part 4) run against a pinned feature set.

Check: does `docs/.superpowers/snapshot-<latest>/` exist, is it complete, and does the
clean-room build (Part 4) reproduce its features?

## Part 6 — Session artifacts

1. `_agent/SESSION_LOG.md` newest entry is accurate and `← recent session` is on it;
   only 5 entries kept.
2. `_agent/JOURNEY_TO_V3.md` `Current Position` matches reality (step, status, %).
3. No stale generated files: run the harness to confirm no file regenerates differently
   (the "double" rule — generated-once files must not be hand-edited).

## Part 7 — Template ↔ reference sync (bdf/templates)

The framework rule: templates mirror the reference implementation. A template that has
drifted from its reference doc means a new project bootstrap would miss features the
current project has.

1. `bdf/templates/README.md` template list must cover every `*.template.md` present;
   the mapping table must name the reference doc each template mirrors.
2. Every template pair must be in sync:
   - Patch the template, not just the reference — the reference doc gains a section, the
     template must gain the placeholder-driven equivalent (or a documented intentional
     deviation).
   - Heading drill-down (`^#`/`^##`): if the reference adds sections (V2.5 features,
     release pipeline, new file shapes, extra fields), the template must mirror them.
   - Field tables (e.g. `ADAPTER.template.md` is the single source of truth for the
     adapter fields): template table rows == reference sections resolving them.
3. Placeholder audit: every `{{TOKEN}}` in any template appears in the
   `bdf/templates/README.md` placeholder table, and every table row is used by ≥1
   template (no orphans, no undocumented tokens).
4. Version-bump rule (AGENT.md): when a template changes, `bdf/VERSION.md` framework
   version must be bumped (patch for sync fixes) and the change recorded.
5. Reference-side drift is expected (the reference evolves first); a FAIL is any pair
   where the reference has structure the template lacks WITHOUT the template being
   updated in the same release.

---

# Report Format

Give the check output as a table:

| Part | Result | Detail |
|------|--------|--------|
| 1 Document graph | PASS/FAIL | broken refs found |
| 2 Version consistency | PASS/FAIL | mismatches found |
| 3 Harness + spec sync | PASS/FAIL | test counts |
| 4 Regeneration | PASS/FAIL | diffs found / expected |
| 5 Session snapshots | PASS/FAIL | snapshot state |
| 6 Session artifacts | PASS/FAIL | staleness found |
| 7 Templates sync | PASS/FAIL | drifted pairs found |

Any FAIL must be fixed before the session ends (or recorded in SESSION_LOG with the
`Next:` line pointing at the fix).

---

# Resume Prompt

Paste this at the start of the next session to run the full check:

```
Run the FULL-SYSTEM CHECK now.

Read C:\Users\loveb\.config\opencode\docs\AI\FULL_SYSTEM_CHECK.md

Execute every part in order (document graph, version consistency, harness +
spec sync, clean-room regeneration, per-session snapshots, session artifacts,
template ↔ reference sync).
Report the results table, then fix any FAILs (or log them in SESSION_LOG with a
precise Next: line). Do not commit anything on your own.
```

---

**Document Version:** 1.1

**Status:** Active Verification Rule

> Changelog: 1.1 — added Part 7 (template ↔ reference sync, placeholder audit,
> version-bump rule) after the template drift found in the session-19 rerun.