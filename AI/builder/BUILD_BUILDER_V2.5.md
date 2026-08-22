# Build BDF V2.5

> Objective
>
> Use the Builder Development Framework (BDF) to evolve the framework from its current
> state (Builder V2.2.0, Release Manager V1) into **BDF V2.5 — Framework Generalization**.
>
> V2.5 is the first step of the road to V3 (see `planning/BDF_ROAD_TO_V3.md`).
>
> Its purpose is to prepare the framework for becoming V3: strengthen, generalize,
> and validate — **not** redesign.

---

# Before Starting

Read the project in the documented order.

Read:

- AGENT.md
- _agent/SESSION_WORKFLOW.md
- _agent/SESSION_LOG.md (latest entry — continue from its `Next:` line)
- _agent/JOURNEY_TO_V3.md (current position)
- planning/BDF_ROAD_TO_V3.md (destination + philosophy)
- PROJECT_STATE.md
- bdf/FRAMEWORK.md
- bdf/BLUEPRINT_ENGINE.md
- bdf/PROJECT_ADAPTER.md
- bdf/PROJECT_GENERATOR.md
- bdf/AI_WORKFLOW.md
- bdf/BUILDER_EVOLUTION.md
- bdf/FRAMEWORK_LIFECYCLE.md
- bdf/templates/README.md
- ADAPTER.md (reference implementation)

Understand the architecture before modifying anything.

If the context budget reaches 70-80% of the 200k window before V2.5 is complete:
follow `AI/CONTINUE_PROJECT_BUILD.md` — stop at a clean checkpoint, write the
checkpoint file, update the tracking files, and hand over the resume prompt.
Never restart from scratch.

---

# Goal

BDF V2.5 is **not** a redesign.

The architecture must remain compatible with everything built so far.

Focus on:

- generalization (make the framework reusable across OpenCode, Claude Code, KiloCode)
- cleaner boundaries (generic vs project-specific knowledge)
- verifiable processes (no prose-only rules)
- documentation completeness (nothing referenced but undocumented)

**Out of scope:** automatic project generation. That is V3. Do not build it in V2.5.

---

# Requested Features

## 1. NEW_PROJECT_GUIDE.md (new framework document)

Create `bdf/NEW_PROJECT_GUIDE.md` — the onboarding process for starting a NEW project
with the framework. The audience is the human/maintainer (and their AI).

The guide must define the numbered steps:

```
Study the target software.
↓
Create ADAPTER.md.
↓
Create PROJECT_STATE.md.
↓
Define folder structure.
↓
Document configuration schema.
↓
Run Blueprint Engine.
↓
Generate Builder.
↓
Generate Tests.
↓
Generate Release Manager.
↓
Commit.
```

The guide must answer: "What is claude.json? Where does Claude store config? What fields
exist?" — i.e., it must teach the reader that project-specific knowledge lives ONLY in
the adapter, and how to research it for any target (OpenCode, Claude Code, KiloCode).

Register the new document everywhere the framework lists its documents:

- `bdf/FRAMEWORK.md` — add to the 15-doc architecture table and the component list.
- `bdf/AI_WORKFLOW.md` — Branch B (New Project) must reference it.
- `bdf/PROJECT_GENERATOR.md` — link to it as the human-facing companion to the generator workflow.

No `NEW_PROJECT_GUIDE.template.md` is required — it is a framework process document,
not a generated project document.

## 2. PROJECT_ADAPTER.md — single source of truth + testable validation

Current problems (from the audit):

- The 9 adapter fields are duplicated in `bdf/PROJECT_ADAPTER.md` and
  `bdf/templates/ADAPTER.template.md` — two sources of truth.
- Adapter validation is prose-only — nothing machine-checkable.

Required changes:

- **One source of truth:** the field table lives in `bdf/templates/ADAPTER.template.md`.
  `PROJECT_ADAPTER.md` describes each field and REFERS to the template instead of
  duplicating the table.
- **Testable validation criteria:** replace the prose checklist with a concrete,
  checkable list ("adapter validation checklist") that can be executed as a test.
  Each criterion is a yes/no statement, e.g. "every field listed in
  ADAPTER.template.md exists in ADAPTER.md", "no `{{PLACEHOLDER}}` remains in a
  released adapter", "no builder code is referenced that the framework does not define".
- Update `ADAPTER.md` (reference implementation) so it passes the new checklist.

## 3. Templates — generic and cross-referenced

Required changes:

- **Placeholder audit:** verify every `{{PLACEHOLDER}}` in all 15 templates against the
  table in `bdf/templates/README.md`. Fix gaps (missing rows, stale example values).
- **Cross-reference matrix:** add to `bdf/templates/README.md` a matrix of which
  framework documents reference which templates, so a change to one doc shows what
  must be re-checked.
- **Provider handling:** confirm `{{CURRENT_PROVIDER}}` / `{{SUPPORTED_PROVIDERS}}`
  (and any provider-related placeholders) are generic — not OpenCode-shaped.
- **Template sync rule:** templates must mirror the reference implementation
  (example values come from the reference). State this explicitly if missing.

Template changes count as framework changes: record them in the framework change
history (bdf/VERSION.md + framework CHANGELOG notes).

## 4. Blueprint Engine — defined impact-analysis artifact

Current gap: `bdf/BLUEPRINT_ENGINE.md` forbids skipping stages, but the Impact
Analysis stage has no defined output, so it can be skipped silently.

Required change:

- Define the **Impact Analysis record** — the output artifact of the Impact Analysis
  stage. Format (as a template inside BLUEPRINT_ENGINE.md):

```
Impact Analysis — <change title>

Affected documents: <list>
Affected components: <list>
Affected tests: <list>
Backwards compatibility: <safe | breaking — migration required>
```

- Any blueprint change must produce this record before the next stage starts.
- Keep the rest of BLUEPRINT_ENGINE.md unchanged.

## 5. Framework boundaries — audit + release documentation

Required changes:

- **Generic/project audit:** read every `bdf/` document and remove or generalize any
  OpenCode-specific knowledge (file names like `opencode.json`, OpenCode folder
  layouts, OpenCode provider shapes) that is not already inside the reference
  `ADAPTER.md`. Layer 1 must never depend on Layer 2.
- **New `bdf/RELEASE_MANAGER.md`:** the release system is referenced by
  `AI_WORKFLOW.md` and `BUILDER_EVOLUTION.md` ("release manager", "release registry")
  but has no framework document. Create the generic release process document:

```
release_registry.json (the only hand-edited release artifact)
↓
release-manager script (generates all release docs)
↓
CHANGELOG / CURRENT_RELEASE / PROJECT_STATE version table / VERSION.md rows
```

  Define: registry as single source of truth, all-or-nothing writes, marker policy,
  "verify generated output before writing". Register it in FRAMEWORK.md components
  and document list. The reference implementation (`docs/RELEASE_MANAGER.md` does not
  exist — release docs live in `scripts/release-manager.ps1` + `docs/release_registry.json`;
  the reference ADAPTER.md or PROJECT_STATE may point to the script) must be updated
  to reference the new framework document.

## 6. Generic testing documentation (new framework document)

Current gap: the framework lists a "Testing Framework" component and ships
`TESTING.template.md`, but there is no `bdf/TESTING.md` describing the generic
test-harness pattern.

Required change:

- Create `bdf/TESTING.md` — the generic testing philosophy for the framework:
  - every builder project gets a reusable test harness script
  - test groups: valid build, failure modes, release docs
  - tests must run headlessly and deterministically
  - harness + test results are part of a version's definition of complete
- Register it in FRAMEWORK.md (component + document list).
- The reference implementation's `docs/TESTING.md` already implements this; align
  wording where it makes the reference the mirror of the framework.

## 7. Documentation synchronization (reference implementation)

After the framework changes:

- Update the reference docs that mirror framework content:
  `docs/ROADMAP.md` (Phase 10 → Completed), `docs/PROJECT_STATE.md` (regenerate per
  AGENT.md rules — new bdf/ documents appear in the tree),
  `docs/FOLDER_STRUCTURE.md` (bdf/ section lists new documents if it enumerates them),
  `docs/CHANGELOG.md` (via the release), `docs/ADAPTER.md` (if it must pass the new
  checklist), `_agent/JOURNEY_TO_V3.md` (Current Position → V2.5 COMPLETE).
- Do not hand-edit generated files (CHANGELOG marker section, CURRENT_RELEASE.md,
  bdf/VERSION.md rows, PROJECT_STATE version table — the release manager owns them).

---

# Backwards Compatibility

BDF V2.5 must remain compatible with:

- the current builder scripts (`build-opencode-v2.ps1`, `build-opencode.ps1`)
- existing profiles and providers
- the 17-test harness — all 17 tests must still pass
- the release manager — deterministic no-op on unchanged registry

No breaking changes unless absolutely required.

If breaking changes are introduced: generate migration documentation automatically.

---

# Documentation

Use the Builder Development Framework.

Determine which documents require updates.

Do not ask the user which files to edit.

The framework should determine affected documentation automatically.

---

# Builder Evolution

Treat this as a complete framework Version upgrade.

The Builder Evolution workflow must be followed automatically:

```
Feature Request
↓
Impact Analysis (write the Impact Analysis record — see feature 4)
↓
Architecture Update
↓
Builder Update
↓
Testing Update
↓
Documentation Update
↓
Version Update
↓
Migration Update
↓
Release
```

---

# Release

Produce:

- Framework version bump in `bdf/VERSION.md` (framework change history + version rows;
  template + document additions are framework changes).
- A new release-registry entry for the reference implementation
  (builderVersion 2.3.0 — "BDF V2.5 framework generalization"), then run
  `scripts/release-manager.ps1` and confirm the 17-test harness still passes.
- Updated CHANGELOG.md, CURRENT_RELEASE.md, ROADMAP.md (Phase 10 → Completed),
  PROJECT_STATE.md, _agent/JOURNEY_TO_V3.md (V2.5 COMPLETE, next: Claude Code Builder).
- Migration notes if required.
- Testing results.
- Release summary.

---

# Success Criteria

V2.5 is complete when ALL of these hold:

- `bdf/NEW_PROJECT_GUIDE.md` exists and is registered in FRAMEWORK.md, AI_WORKFLOW.md,
  PROJECT_GENERATOR.md.
- The adapter field table exists in exactly ONE place (the template); PROJECT_ADAPTER.md
  references it; the adapter validation checklist is executable; the reference
  `ADAPTER.md` passes it.
- templates/README.md has the placeholder audit + cross-reference matrix; no stale or
  missing placeholder rows.
- BLUEPRINT_ENGINE.md defines the Impact Analysis record.
- No OpenCode-specific knowledge remains in `bdf/` outside what the adapter defines.
- `bdf/RELEASE_MANAGER.md` and `bdf/TESTING.md` exist and are registered in FRAMEWORK.md.
- All 17 harness tests pass; release manager is a deterministic no-op.
- Reference docs are synchronized (ROADMAP Phase 10 Completed, PROJECT_STATE
  regenerated, JOURNEY_TO_V3 shows V2.5 COMPLETE).
- The V2.5 release is recorded in the release registry and generated docs.

The framework — not the user — determines:

- what changes
- why it changes
- where it changes

This task is the first step of the road to V3: it prepares the framework to build the
Claude Code Builder next.
