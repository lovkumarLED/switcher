# Framework Version

> Versioning and compatibility of the Builder Development Framework.

---

# Purpose

The Builder Development Framework is versioned independently from any builder project.

This document records the current framework version, its compatibility, and its evolution history.

Every change to the framework must be recorded here.

---

# Current Version

Version

```
2.3.0
```

Status

```
Active
```

---

# Compatibility

| Item | Value |
|------|-------|
| Framework Version | 2.3.0 |
| Supported Builder Versions | V2.7, V2.5, V2.3, V2.1 |
| Compatible Projects | OpenCode Configuration Manager documentation, KiloCode V1 adapter, V3 universal scaffold, unique agent adapters |
| Last Updated | 2026-08-17 |
| Breaking Changes | None |
| Migration Required | No |

---

# Compatibility Notes

## Supported Builder Versions

The framework describes the builder architecture (load, validate, backup, merge, generate).

Framework 2.0.0 supports the Builder V2 and Builder V2.1 architectures.

Builder V2.1 extends V2 with the same architectural shape:

- Extended validation (duplicate and malformed definition detection).
- Modular merge pipeline.
- Provider-specific models.
- Pre-write output verification.
- Automated testing.

Builder V2.7 extends the same architectural shape with:

- JSON Schema validation (F1) of config sources before builder validation.
- Pre-flight dependency check (F2) that aborts on any missing input.
- `-WhatIf` dry-run (F3).
- Backup retention pruning (F4).
- Provenance sidecar (F5).
- `-Doctor` read-only diagnostics (F6).
- Merge diff summary vs the previous backup (F7).

The project's release manager (`release-manager.ps1`) supports the registry workflow: release facts are recorded once in `release_registry.json`, and the changelog, quick reference, compatibility rows, and project state version history are generated from it. The generated table rows in this document are never edited manually.

Future builder architecture versions will be listed here when they are documented.

## Compatible Projects

Projects that use this framework version.

The OpenCode Configuration Manager is the first project built using the framework.

---

# Versioning Policy

Framework evolution is tracked independently from builder evolution.

Major Version

```
Changes that break the structure or process of existing projects.
```

Minor Version

```
Additive changes. New templates, new workflow stages, new concepts.
```

Patch Version

```
Fixes and clarifications. No structural change.
```

Example

```
1.0.0

1.1.0

2.0.0
```

---

# Change History

## Version 2.3.0

Date

```
2026-08-14
```

Status

```
Current
```

Summary

```
Unique bounded adapter category and capability-driven unique-adapter layer
added to the framework: adapter categories (same-architecture and unique
bounded patch), the fixed five-file `adapters/<agent>/` documentation
namespace, evidence gates (fixture, integration, live), and lifecycle status
vocabulary. First application: a unique bounded routing adapter for the
Switcher app; its target-specific paths and facts are documented only in its
own adapter namespace.
```

Changed

- `FRAMEWORK.md` - Adapter Categories and evidence gates sections.
- `PROJECT_ADAPTER.md` - Unique Agent Adapters section.
- `AI_WORKFLOW.md` - Unique adapter read order and gate-aware status checks.
- `TESTING.md` - Adapter test groups.
- `BUILDER_EVOLUTION.md` - Adapter documentation and compatibility evolution.
- `README.md` - Unique agent adapters summary.
- `templates/ADAPTER.template.md`, `templates/ARCHITECTURE.template.md`,
  `templates/BUILDER_SPEC.template.md`,
  `templates/CONTRIBUTING_FOR_AI.template.md`,
  `templates/FOLDER_STRUCTURE.template.md`,
  `templates/JSON_SCHEMAS.template.md`, `templates/README.template.md`,
  `templates/TESTING.template.md` - neutral adapter-category structure.
- `templates/README.md` - template inventory and pairing matrix updated.

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.11

Date

```
2026-08-08
```

Status

```
Previous
```

Summary

```
Final full-system check (session 33, pre-public gate): template-to-reference
sync round 3 — ARCHITECTURE (Data Flow, Ownership Rules), BUILDER_SPEC
(Verification Additions, V2 Verbatim Messages V2.7, Agent Map, function
contracts), CONTRIBUTING_FOR_AI (Rule 11), DEVELOPER_GUIDE (Layer 1/2 +
common tasks), FOLDER_STRUCTURE (User-Run vs System-Run, test harness),
JSON_SCHEMAS (V2.7 files + validation subset), PROJECT_STATE (docs/
subsection, section-7 order), ROADMAP (Phases 14-15 + naming), TESTING
(JSON Schema test group). jsonc-shadow warning added to every reference
doc + template that discusses generated configs. Placeholder audit 66/66.
```

Changed

- `templates/ARCHITECTURE.template.md` — Data Flow + Ownership Rules sections.
- `templates/BUILDER_SPEC.template.md` — Verification Additions, V2 Verbatim Messages V2.7, Agent Map, V2.7 function-contract block (+`{{FUNCTION_NAME}}`, `{{FUNCTION_PURPOSE}}` tokens).
- `templates/CONTRIBUTING_FOR_AI.template.md` — Rule 11 (Keep README Current).
- `templates/DEVELOPER_GUIDE.template.md` — Layer 1/2 + Keep Documentation Synchronized + four common-task subsections.
- `templates/FOLDER_STRUCTURE.template.md` — User-Run vs System-Run + test-harness section.
- `templates/JSON_SCHEMAS.template.md` — V2.7 schema-files + validation-subset sections.
- `templates/PROJECT_STATE.template.md` — docs/ subsection + section-7 order.
- `templates/ROADMAP.template.md` — Phases 14-15 + Phase 3/11 naming aligned.
- `templates/TESTING.template.md` — JSON Schema (V2.7) test group.
- `templates/README.md` — placeholder table +2 rows (66 total).
- jsonc-shadow warning added to `DEVELOPER_GUIDE.md`, `BUILDER_EXTENSION_GUIDE.md`, `TROUBLESHOOTING.md`, `ADAPTER.md`, `ARCHITECTURE.md`, `BUILDER_SPEC.md`, `PROFILE_CREATION_GUIDE.md`, `app/rule.md`, and the `.template.md` mirrors.

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.9

Date

```
2026-08-08
```

Status

```
Previous
```

Summary

```
README Synchronization Rule added (user ruling): README.md must be updated in
the SAME change whenever something is added, changed, or fixed; footer versions
kept in sync; never claim an unreached status.
```

Changed

- `templates/AGENT.template.md` — README Synchronization Rule section added.
- Reference `AGENT.md` — README Synchronization Rule added.
- `CONTRIBUTING_FOR_AI.md` — Rule 11 (Keep README Current).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.8

Date

```
2026-08-08
```

Status

```
Previous
```

Summary

```
Phase 8 Documentation Expansion: four onboarding guides added (Developer,
Provider Development, Profile Creation, Builder Extension) + four mirrored
templates. Template count 15 -> 19.
```

Changed

- New templates: `DEVELOPER_GUIDE.template.md`, `PROVIDER_DEVELOPMENT_GUIDE.template.md`, `PROFILE_CREATION_GUIDE.template.md`, `BUILDER_EXTENSION_GUIDE.template.md`.
- `templates/README.md` — template list + cross-reference matrix updated (19 templates).
- `PROJECT_GENERATOR.md` — Stage 4 copy list + Stage 5 rename map extended.
- Reference docs: `DEVELOPER_GUIDE.md`, `PROVIDER_DEVELOPMENT_GUIDE.md`, `PROFILE_CREATION_GUIDE.md`, `BUILDER_EXTENSION_GUIDE.md` (new).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.7

Date

```
2026-08-08
```

Status

```
Previous
```

Summary

```
README.md rebuilt as the project entry point (badges, mermaid architecture
diagrams, quick start, user-run vs system-run, config organization rules,
no-secrets rule, testing table, roadmap summary, full docs map). Template
mirrored with the new sections.
```

Changed

- `templates/README.template.md` — new sections: User-Run vs System-Run, How Configuration Is Organized (rules incl. No-Secrets), Testing, Roadmap; Source of Truth extended.
- `templates/README.md` — +1 placeholder row (`{{BUILDER_SCRIPT_ALT}}`).
- Reference `README.md` — rebuilt entry point (version 2.0).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.6

Date

```
2026-08-08
```

Status

```
Previous
```

Summary

```
ROADMAP phase completion markers: every completed phase (1-7, 9, 10, 10.5, 10.6,
11 resolved, 12) now carries a ✅ in its heading and status; Phase 13 carries 🔄;
a Phase Completion Summary table was added (12 of 13 complete). Template synced.
```

Changed

- `templates/ROADMAP.template.md` — all phase headings + statuses synced to the reference (Phases 2-7 Completed, ✅/🔄 markers, summary table).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.5

Date

```
2026-08-08
```

Status

```
Previous
```

Summary

```
No-Secrets Rule codified (ULTIMATE, user ruling, corrected session 28c): the
SYSTEM's own artifacts (scripts, templates, docs, examples) NEVER contain literal
API keys - only {env:VAR} placeholders. User-owned files (main config, profiles,
providers) may contain literal keys (user protects them); the system copies user
content verbatim (scan -> copy -> paste), so generated output reflects the user's
source files, keys included.
```

Changed

- `templates/BUILDER_SPEC.template.md` — added "No-Secrets Rule (ULTIMATE)" section to the Scaffold contract (system artifacts never contain keys; user files may; copy verbatim).
- `BUILDER_SPEC_KILO_ADAPTER.md` — same No-Secrets section (kilo reality).
- Reference `BUILDER_SPEC.md` — P1 API key policy rewritten as two-world rule: user files may hold keys (user protects), system artifacts never do; system copies verbatim.

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.4

Date

```
2026-08-08
```

Status

```
Previous
```

Summary

```
Scaffold contract finalized (V3 universal, user ruling): the framework creates the
providers/ folder (like the profile folders) but NEVER writes provider/model JSON
files inside it (100% user-owned); ONE job = scan the agent's OWN main JSON, split
mcp/plugin sections, seed profiles (coding main + experimental + minimal, three files
each); mcp/plugins user-owned after creation; settings.json = schema + activeProviders
only.
```

Changed

- `templates/BUILDER_SPEC.template.md` — Contract rewritten (own-main-JSON scan, never providers/models, empty experimental/minimal shells, settings minimal).
- `BUILDER_SPEC_KILO_ADAPTER.md` — same contract sync (kilo reality).
- Reference `BUILDER_SPEC.md` — same universal-scaffold contract section.

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.3

Date

```
2026-08-08
```

Status

```
Previous
```

Summary

```
Full-system check (session 28): template ↔ reference sync fixes — ROADMAP
Destination section, PROJECT_STATE contents rows, JSON_SCHEMAS plugin array type,
ARCHITECTURE status section, TESTING three-harness coverage, CHANGELOG date typo,
placeholder table +7 rows (63/63 audit clean).
```

Changed

- `templates/ROADMAP.template.md` — Destination block + completed phase statuses.
- `templates/PROJECT_STATE.template.md` — bdf contents rows + CURRENT_RELEASE/release_registry doc-structure rows.
- `templates/JSON_SCHEMAS.template.md` — plugins.json `plugin` type corrected to array of strings.
- `templates/ARCHITECTURE.template.md` — Implemented list + schema validation; Not-Implemented item corrected.
- `templates/TESTING.template.md` — three-harness coverage (17/13/31) + new tokens `{{V25_TEST_HARNESS}}`, `{{V27_TEST_HARNESS}}`.
- `templates/CHANGELOG.template.md` — `YYY-MM-DD` → `YYYY-MM-DD`.
- `templates/README.md` — example values refreshed (2.5.0/V2.7, 31/31); +4 placeholder rows (`{{DESTINATION_NAME}}`, `{{DESTINATION_DESCRIPTION}}`, `{{DESTINATION_TAG}}`, `{{FIRST_VALIDATION_PROJECT}}`, `{{CURRENT_BUILDER_NAME}}`, `{{V25_TEST_HARNESS}}`, `{{V27_TEST_HARNESS}}`).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.2

Date

```
2026-08-08
```

Status

```
Previous
```
Summary

```
Universal scaffold documentation added to the builder spec + template:
Discovery (V3 rule), Contract, refresh-with-backup policy, Non-JSON guard,
extensible agent registry; Claude Code removed as a supported target
(planning/DECISIONS.md).
```

Changed

- `templates/BUILDER_SPEC.template.md` — "Scaffold Mode (Universal, V3)" section (Discovery / Contract / Non-JSON Guard / Agent Registry).
- `templates/README.md` — placeholder table +2 rows (`{{UNIVERSAL_SCRIPT}}`, `{{AGENT_WRAPPER_SCRIPT}}`).
- Reference `BUILDER_SPEC.md` — same universal-scaffold section added (opencode reality).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.1

Date

```
2026-08-06
```

Status

```
Previous
```
Summary

```
Full template-to-reference sync (Part 7 of the full-system check): all 15 template pairs now mirror the reference docs' V2.5/V2.7 structure; placeholder audit back to parity.
```

Changed

- `templates/BUILDER_SPEC.template.md` — Release Pipeline, Stage 7 Verification, Model Precedence, Builder V2.5 + V2.7 sections, current-builder status.
- `templates/ARCHITECTURE.template.md` — Release Pipeline, builder pipeline evolution, per-provider model files, provenance/retention concepts.
- `templates/FOLDER_STRUCTURE.template.md` — Root Directory, schemas/, mcp.json, `<provider>-models.json`, target.json, provenance sidecar; obsolete file entries removed.
- `templates/JSON_SCHEMAS.template.md` — mcp.json, per-provider models, target.json, builder-written files, schema table, validation subset.
- `templates/CHANGELOG.template.md` — modern entry subsections (Highlights, New Features, Improvements, Bug Fixes, Testing Summary, Known Issues, Docs Updated).
- `templates/ROADMAP.template.md` — Phases 9-13 incl. Framework Generalization, Active-Provider Selector, JSON Schema Validation, KiloCode builder (Claude Code variant dropped 2026-08-08), Destination BDF V3.
- `templates/TESTING.template.md` — V2.5 Active-Provider Selector and V2.7 JSON Schema Validation test groups.
- `templates/AGENT.template.md`, `templates/PROJECT_STATE.template.md` — Build Continuation + Release Workflow sections.
- `templates/README.template.md` — Documentation Architecture + Releases sections.
- `templates/LESSONS_LEARNED.template.md` — Lessons 11-12 added.
- `templates/README.md` — placeholder table extended 36 → 54 rows; audit clean (54 used = 54 rows).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.2.0

Date

```
2026-08-06
```

Status

```
Previous
```

Summary

```
Registered Builder V2.7 (JSON Schema Validation) in the supported-builder list and the reference documentation.
```

Changed

- `VERSION.md` — compatibility table now lists V2.7 as a supported builder version.
- `ARCHITECTURE.md`, `BUILDER_SPEC.md`, `README.md`, `ADAPTER.md`, `FOLDER_STRUCTURE.md`, `JSON_SCHEMAS.md`, `TESTING.md` — Builder V2.7 (F1-F7, 9-stage pipeline) documented as the current builder.
- `templates/` — example placeholders updated to the current runner scripts where they name the builder.

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.1.1

Date

```
2026-08-05
```

Status

```
Previous
```

Summary

```
Template sync: ADAPTER.template.md gained the three release fields the reference adapter already defined (Release Registry, Release Artifacts, Release Manager Entry Point).
```

Changed

- `templates/ADAPTER.template.md` — field table + sections now match the reference `ADAPTER.md` (single source of truth restored).
- `templates/README.md` — placeholder audit gained the three new tokens (`{{RELEASE_REGISTRY}}`, `{{RELEASE_ARTIFACTS}}`, `{{RELEASE_MANAGER_SCRIPT}}`).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.1.0

Date

```
2026-08-04
```

Status

```
Previous
```

Summary

```
BDF V2.5 framework generalization: generalized the framework for reuse across targets.
```

Added

- `NEW_PROJECT_GUIDE.md` — the onboarding process for starting a new project.
- `RELEASE_MANAGER.md` — the generic release process.
- `TESTING.md` — the generic test-harness pattern.
- The adapter field table moved into `templates/ADAPTER.template.md` (single source of truth).
- The adapter validation checklist in `PROJECT_ADAPTER.md`.
- The Impact Analysis record in `BLUEPRINT_ENGINE.md`.
- The placeholder audit and cross-reference matrix in `templates/README.md`.

Changed

- `FRAMEWORK.md`, `bdf/README.md` registered the three new framework documents.
- `AI_WORKFLOW.md` and `PROJECT_GENERATOR.md` reference the new project guide.
- `MIGRATION.md` generalized an example and a layer description.
- Templates now state the sync rule (templates mirror the reference implementation).

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 2.0.0

Date

```
2026-08-03
```

Status

```
Previous
```

Summary

```
Renamed the framework to Builder Development Framework (BDF) and added the intelligence layer.
```

Added

- `BLUEPRINT_ENGINE.md` — the intelligence layer and change pipeline.
- `PROJECT_ADAPTER.md` — project-specific adapter concept.
- `BUILDER_EVOLUTION.md` — predictable builder evolution workflow.
- `FRAMEWORK_LIFECYCLE.md` — master lifecycle reference.
- `AI_WORKFLOW.md` — the master AI agent workflow.
- `templates/ADAPTER.template.md` — project adapter template.
- The four framework questions.

Changed

- Framework renamed from Blueprint Framework to Builder Development Framework (BDF).
- Framework folder renamed from `blueprint/` to `bdf/`.
- `FRAMEWORK.md` updated to reference the new components.
- `PROJECT_GENERATOR.md` now requires a project adapter stage.
- Templates reference the framework instead of OpenCode.

Breaking Changes

```
Yes
```

Migration Required

```
Yes
```

---

## Version 1.1.0

Date

```
2026-08-03
```

Status

```
Previous
```

Summary

```
Added the PROJECT_STATE template.
```

Added

- `PROJECT_STATE.template.md` generic template.
- Project state regeneration rules for builder projects.

Breaking Changes

```
None
```

Migration Required

```
No
```

---

## Version 1.0.0

Date

```
2026-08-03
```

Status

```
Previous
```

Summary

```
Initial release of the Blueprint Framework.
```

Added

- Framework process documentation.
- Project generation workflow.
- Migration guide.
- Reusable documentation templates.
- Reusable lessons document.
- Independent framework versioning.

Breaking Changes

```
None
```

Migration Required

```
No
```

---

# Version History

| Version | Status | Description |
|----------|--------|-------------|
| 2.3.0 | Current | Unique bounded adapter category, five-file adapter namespace, capability-driven unique-adapter layer, evidence gates (fixture/integration/live) |
| 2.2.11 | Previous | Template sync round 3 (session 33): 9 templates gained missing sections, jsonc-shadow warning everywhere, placeholder audit 66/66 |
| 2.2.9 | Previous | README Synchronization Rule (README updated in same change, versions in sync, no false status claims) |
| 2.2.8 | Previous | Phase 8: 4 onboarding guides + 4 templates (15 → 19) |
| 2.2.7 | Previous | README rebuilt (badges, mermaid diagrams, quick start, rules); template mirrored |
| 2.2.6 | Previous | ROADMAP phase completion markers (✅ on 12/13 phases) + summary table; template synced |
| 2.2.5 | Previous | No-Secrets Rule (ULTIMATE): system artifacts never contain literal keys ({env:VAR} only); user files may hold keys; system copies verbatim |
| 2.2.4 | Previous | V3 scaffold contract finalized: providers/ folder created, provider/model files user-owned, own-main-JSON scan, 3-profile seed (coding main), settings minimal |
| 2.2.3 | Previous | Template↔reference sync round 2: ROADMAP destination, PROJECT_STATE rows, plugin array type, 3-harness coverage, placeholder audit 63/63 |
| 2.2.2 | Previous | Universal scaffold (V3) registered in builder spec + template; Claude dropped as target |
| 2.2.1 | Previous | Full template-to-reference sync (15 pairs, placeholder audit 54/54) |
| 2.2.0 | Previous | Builder V2.7 (JSON Schema Validation) registered |
| 2.1.1 | Previous | Template sync: ADAPTER template release fields |
| 2.1.0 | Previous | BDF V2.5 framework generalization |
| 2.0.0 | Previous | Builder Development Framework rename + intelligence layer |
| 1.1.0 | Previous | PROJECT_STATE template added |
| 1.0.0 | Previous | Initial Blueprint Framework release |

---

# Evolution Rules

Every change to the framework must:

- Update this document.
- Update the change history.
- Follow the versioning policy.

When the framework changes:

1. Existing projects do not need to change unless a breaking change is declared.
2. Breaking changes require a major version bump.
3. Migration guidance is added to the migration guide.

---

**Document Version:** 1.2

**Status:** Active Framework Version


## License

The Builder Development Framework is released under the MIT License - see the LICENSE file in the repository root.

