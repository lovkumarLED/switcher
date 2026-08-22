# PROJECT STATE

> Living snapshot of the OpenCode Configuration Manager.

> Regenerated after every major refactor.

---

# 1. Executive Summary

The OpenCode Configuration Manager is a modular configuration generation system.

Its purpose is to generate a valid `opencode.json (absent)` from a set of smaller configuration files.

The project separates:

- Source configuration
- Builder implementation
- Generated configuration
- Documentation

The documentation is organized into two layers.

Layer 1: the Builder Development Framework (BDF), reusable engineering knowledge shared by every builder project.

Layer 2: the OpenCode-specific project documentation.

A hybrid unique-adapter layer adds adapter namespaces (the generic notation adapters/<agent>/) for targets
whose contracts differ materially from the universal scaffold. The Switcher
app currently carries one unique bounded adapter: Claude Code (lifecycle
status **Live validated**; see `adapters/claude-code/`).

The project-specific facts are defined in the project adapter:

```
ADAPTER.md
```

This document is the living state snapshot of the repository.

It is regenerated after every major refactor.

---

# 2. Current Version

Version

```
2.5.3
```

Status

```
LSP support (OpenCode + KiloCode) in the engine and Switcher app
```

## Version History
<!-- AUTO-GENERATED START -->
| Version | Status | Description |
|----------|--------|-------------|
| 2.5.3 | Current | LSP support for OpenCode + KiloCode in BOTH the BDF engine and the Switcher app (Claude Code untouched). New profiles/<profile>/lsp.json source { "lsp": <bool or object>, "enabled": <bool> } seeded by the scaffold in EVERY profile (coding + experimental + minimal, disabled by default, user-owned after creation - Seed-IfMissing, never overwritten). Both builders (OpenCode V2.7 + Kilo K1) merge LSP: interactive "LSP servers: [1] enabled [2] disabled (Enter keeps current)" prompt (skipped under -NonInteractive, stored enabled used), backup-first persist, -WhatIf never writes, verification throws if an enabled LSP is missing from the output, diff summary adds/removes "LSP servers", Doctor reports it via the generic sources walk. New lsp.schema.json (Draft-07) pre-flight dependency. App: GET/PUT /api/lsp router + Integrations page LSP block between Plugins and MCP (on/off toggle persisted via PUT, server-name chips, "Edit JSON" expert dialog). Toggle OFF emits "lsp": false in the generated config (was: key removed). Harnesses: opencode 40/40, kilo 37/37 (5 new LSP tests each); full Python 217 (2 accepted preference baselines), full frontend 133 (1 accepted onboarding-copy baseline). |
| 2.5.2 | Previous | Full-system health check + security hardening + per-model reasoning formats + profile switcher. The Switcher app was tested end-to-end on a temp clone agent (onboarding, overview, providers wizard, activity tracking with 49 real proxy calls, integrations, settings, builders). Security review found and fixed 6 issues: SSRF-via-redirect in /api/test, SSRF userinfo injection in the proxy path, profile-switch path traversal, unvalidated agent name reaching the scaffold script, a storage.py lock deadlock, and a wrong agent-label display. Builders now preserve per-model reasoning formats (the reasoning-format filter accepts levels valid in ANY format, so gemini models keep thinkingConfig inside an opencode provider). The app supports per-model reasoning format on save, model overwrite-by-ID, model deletion, and an active-profile switcher persisted in state.json. 79 app unit tests, 75 frontend contract tests, kilo + opencode harnesses all green. The project is now MIT licensed (LICENSE file + README section). |
| 2.5.1 | Previous | Real-provider compatibility: the app and the builders now write the API key in both places agents read it (provider.<id>.apiKey for OpenCode, provider.<id>.options.apiKey for Kilo), fixing the TokenRouter 401 in Kilo. The Switcher gains real-provider presets (TokenRouter, Modal, OpenAI, Google Gemini, OpenRouter, NVIDIA NIM) with SDK auto-fill. Builders mirror the dual key automatically at merge time, so builder-only users get the same result as app users. Reasoning formats: per-provider reasoning levels (opencode / openai / claude / gemini / none) with correct variant JSON per format (reasoningEffort, thinking.budgetTokens, thinkingConfig.thinkingBudget); interactive builder runs ask the developer, persist the choice backup-first, and filter invalid levels from the generated config. 56 app unit tests, kilo harness 31/31, opencode harness 33/33. |
| 2.5.0 | Previous | Builder V2.7 JSON Schema Validation: config sources validated against schemas/*.schema.json before builder validation (F1), pre-flight dependency check (F2), -WhatIf dry run (F3), backup retention (F4), provenance sidecar (F5), -Doctor diagnostics (F6), merge diff summary (F7), 9-stage pipeline. P2 dynamic target artifact (profiles/<profile>/target.json) + P1 env-key policy. |
| 2.4.0 | Previous | Builder V2.5 Active-Provider Selector: discovers all providers, interactive active-provider selection persisted to settings.json, profile-level <provider>-models.json with highest precedence. |
| 2.3.0 | Previous | BDF V2.5 framework generalization: generalized the framework for reuse across OpenCode, Claude Code, and KiloCode targets. |
| 2.2.0 | Previous | Builder V2.1: extended validation, modular merge pipeline, provider-specific models, output verification, and automated testing. |
<!-- AUTO-GENERATED END -->

---

# 3. Current Folder Structure

```
.config/
└── opencode/
```

The `opencode` directory is the root of the entire project.

```
opencode/ (the docs repository root)

├── backup/
├── docs/
├── profiles/
├── providers/
├── schemas/
├── scripts/
└── opencode.json
```

## docs/

Contains all project documentation.

```
docs/

├── _agent/
│   ├── SESSION_LOG.md
│   ├── SESSION_WORKFLOW.md
│   └── JOURNEY_TO_V3.md
├── AI/                      (AI task documents, grouped by theme)
│   ├── builder/             (BUILD_* implementation docs, builder continuations)
│   ├── claude-code/         (Claude gate session resume prompts)
│   ├── deepseek/            (DeepSeek gate-4 implementation records)
│   ├── full-system-check/   (system check runbooks, reports, FSC2 evidence)
│   └── plan/                (implementation plans)
├── planning/
│   ├── BDF_ROAD_TO_V3.md
│   ├── DECISIONS.md
│   ├── FUTURE_IDEAS.md
│   ├── NEXT_PHASE_IMPLEMENTATION_PLAN.md
│   ├── SOL_ORCHESTRATION_POLICY.md
│   ├── UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md
│   ├── VERSION_STRATEGY.md
│   ├── claude-code/         (adapter evidence chain: gates 1-5)
│   ├── designs/             (durable design records, ex-superpowers/specs)
│   └── pi/                  (Pi-agent planning)
├── bdf/
│   ├── AI_WORKFLOW.md
│   ├── BLUEPRINT_ENGINE.md
│   ├── BUILDER_EVOLUTION.md
│   ├── BUILDER_PHASES.md
│   ├── FRAMEWORK.md
│   ├── FRAMEWORK_LIFECYCLE.md
│   ├── LESSONS_LEARNED.md
│   ├── MIGRATION.md
│   ├── NEW_PROJECT_GUIDE.md
│   ├── PROJECT_ADAPTER.md
│   ├── PROJECT_GENERATOR.md
│   ├── README.md
│   ├── RELEASE_MANAGER.md
│   ├── TESTING.md
│   ├── VERSION.md
│   └── templates/
│       ├── README.md
│       └── *.template.md
├── ADAPTER.md
├── app/
│   ├── app/        (Python package: config, storage, discovery, providers, agentstore, engine, testing, proxy, serve, rules)
│   ├── gui.html    (frontend — built by parallel agent)
│   ├── state.json  (runtime state: which agent, where)
│   ├── env/        (private Python venv, auto-created on first run)
│   ├── rule.md     (theme colors + AI-agent rulebook)
│   ├── server.py   (FastAPI backend + /v1 proxy)
│   ├── start.bat   (double-click launcher)
│   └── README.md   (plain-language usage)
├── AGENT.md
├── ARCHITECTURE.md
├── BUILDER_EXTENSION_GUIDE.md
├── BUILDER_SPEC.md
├── CHANGELOG.md
├── CONTRIBUTING_FOR_AI.md
├── CURRENT_RELEASE.md
├── DESIGN_PRINCIPLES.md
├── DEVELOPER_GUIDE.md
├── FOLDER_STRUCTURE.md
├── JSON_SCHEMAS.md
├── PROFILE_CREATION_GUIDE.md
├── PROJECT_STATE.md
├── PROVIDER_DEVELOPMENT_GUIDE.md
├── README.md
├── release_registry.json
├── ROADMAP.md
├── TESTING.md
└── TROUBLESHOOTING.md
```

## Purpose of Each Folder

| Folder | Purpose |
|--------|---------|
| `backup/` | Automatic configuration backups |
| `profiles/` | Profile-specific configuration |
| `providers/` | Provider definitions |
| `schemas/` | Reserved for future JSON Schema validation |
| `scripts/` | Builder scripts |
| `docs/` | Project documentation |
| `docs/_agent/` | Session continuity + journey tracker |
| `docs/AI/` | AI task documents (including build-continuation rule) |
| `docs/planning/` | Long-term planning and vision (road to V3) |
| `docs/bdf/` | Reusable Builder Development Framework |
| `docs/app/` | The self-contained "Switcher" GUI app (backend + frontend + launcher) |
| `docs/app/app/` | The app's Python backend package (modular: config/storage/discovery/providers/engine/testing/proxy/serve) |

---

# 4. Architecture Overview

The architecture separates configuration, implementation, and generated output.

```
Configuration

↓

Builder

↓

Generated Configuration

↓

Application
```

Each layer communicates only with the layer immediately below it.

Dependencies always point downward.

## Components

| Component | Responsibility |
|------------|----------------|
| Profile | Defines user configuration |
| Provider | Defines API connection |
| Builder | Merges configuration |
| Backup | Preserves previous configuration |
| OpenCode | Uses generated configuration |

## Build Pipeline

```
Source Files

↓

Profile

↓

Provider

↓

Builder

↓

Validation

↓

Backup

↓

Generation

↓

opencode.json

↓

OpenCode
```

## Source of Truth

Editable source files:

- Provider definitions
- Profile configuration
- Documentation
- Builder scripts

Generated output:

- `opencode.json`

Generated files are never edited manually.

---

# 5. Builder Development Framework

Generic engineering knowledge shared by every builder project.

Lives in:

```
bdf/
```

## Contents

| Document | Purpose |
|----------|---------|
| `FRAMEWORK.md` | The complete engineering process |
| `BLUEPRINT_ENGINE.md` | The intelligence layer |
| `PROJECT_ADAPTER.md` | Making the framework project-specific |
| `BUILDER_EVOLUTION.md` | Creating future builder versions |
| `BUILDER_PHASES.md` | The Alpha → Beta → General Release quality gates every builder build must pass |
| `FRAMEWORK_LIFECYCLE.md` | The master lifecycle reference |
| `AI_WORKFLOW.md` | The AI agent workflow |
| `VERSION.md` | Framework versioning |
| `MIGRATION.md` | Adopting the framework in an existing project |
| `PROJECT_GENERATOR.md` | Creating a new builder project |
| `NEW_PROJECT_GUIDE.md` | Onboarding process for starting a new project |
| `RELEASE_MANAGER.md` | The generic release process |
| `TESTING.md` | The generic test-harness pattern |
| `LESSONS_LEARNED.md` | Reusable engineering lessons |
| `templates/` | Reusable documentation templates |

The framework contains no project-specific knowledge.

Project names appear only as examples.

The OpenCode Configuration Manager is the first project built using the framework.

The project adapter defines the project-specific facts:

```
ADAPTER.md
```

---

# 6. OpenCode Builder

The project-specific implementation.

## profiles/

Contains profile-specific configuration.

The builder selects the profile at invocation time.

```
profiles/

default/

coding/

experimental/

minimal/
```

The `default` profile is fully configured.

```
default/

settings.json

models.json

plugins.json

mcp.json

lsp.json
```

Additional profiles contain only `settings.json` and contribute their provider selection to the build.

## providers/

Contains provider definitions.

```
providers/

omniroute.json
```

The current implementation contains a single provider.

Each provider may optionally own provider-specific models:

```
providers/<provider>/models.json
```

These take precedence over inline provider models and the global profile models.

Profile-level provider models (`profiles/<profile>/<provider>-models.json`, V2.5) take precedence over the provider-folder file.

## scripts/

Contains automation scripts.

```
build-opencode-v2.7.ps1
```

The current builder (Builder V2.7, JSON Schema Validation): config sources validated
against `schemas/*.schema.json` before builder validation (F1), pre-flight dependency
check (F2), `-WhatIf` dry run (F3), backup retention (F4), provenance sidecar (F5),
`-Doctor` diagnostics (F6), merge diff summary (F7), 9-stage pipeline, dynamic target
artifact (P2) and env-key policy (P1).

```
build-opencode-v2.5.ps1
```

The established builder (Builder V2.5, Active-Provider Selector): provider discovery, provider selection via prompt or `-Provider` argument, persisted `activeProviders`, profile-level `<provider>-models.json` precedence.

```
build-opencode-v2.ps1
```

The established builder (Builder V2.1, evolved in place from V2.0), retained alongside V2.5.

```
build-opencode.ps1
```

The V2.7 builder bootstrapped by the GUI app scaffold (session 29): adapted from build-opencode-v2.7.ps1, supports -Profile coding -NonInteractive. Previous legacy version backed up at backup/build-opencode.ps1.pre-gui-app.

```
test-opencode-v2.7.ps1
```

The V2.7 test harness (31 tests), including schema validation, P1/P2 policy, and
docs-spec sync tests.

```
test-opencode-v2.5.ps1
```

The V2.5 test harness (13 tests), including the docs-spec sync test `Test-BuilderSpecCoversV25`.

```
test-opencode-v2.ps1
```

The automated test harness (17 tests: 9 builder + 8 Release Docs).

```
test-opencode.ps1
```

The bootstrapped V2.7 test harness (31 tests), generated by the GUI app scaffold (session 29).

```
release-manager.ps1
```

The release manager: generates all release documentation from `release_registry.json`.

```
scaffold-agent.ps1
```

The V3 UNIVERSAL core: open-source agent registry (opencode, kilo, claudecode — allowed
name only, aider, goose, codex-cli), discovery, `-List`, `-Bootstrap` per-agent builder
generation. ONE job: scan the agent's own main JSON, split mcp/plugin/lsp sections, seed
`profiles/coding/mcp.json` + `plugins.json` + `lsp.json` (user-owned after creation; LSP
disabled by default), create
`profiles/{coding,experimental,minimal}` with settings/mcp/plugins/lsp. Creates the
`providers/` folder but NEVER writes provider/model files inside it (user-owned),
never touches `.jsonc` without consent. Closed-source agents never touched.

SYSTEM-RUN ONLY — the user never runs the scaffolds directly; they only run the
builders (`build-opencode-v2.7.ps1` / `build-kilo-v1.ps1`).

```
scaffold-opencode.ps1
```

Wrapper delegating to the universal scaffold for OpenCode (moved). SYSTEM-RUN ONLY. (regenerated as the bootstrap wrapper by the GUI app scaffold, session 29 — old version at backup/scaffold-opencode.ps1.pre-gui-app)

```
scaffold-kilo-v1.ps1
```

KiloCode V1 scaffold wrapper — lives in the Kilo builder project
(`~/.config/kilo/scripts/`), not in this repository's `scripts/`. SYSTEM-RUN ONLY.

## backup/

Stores timestamped backups of the generated configuration.

Created automatically by the builder before each build.

## opencode.json

The generated configuration.

OpenCode reads this file during startup.

Never edited manually.

---

# 7. AI Workflow

AI agents are guided by `AGENT.md`.

Every agent reads `AGENT.md` first.

The master framework AI workflow is defined in:

```
bdf/AI_WORKFLOW.md
```

## Read Order

```
README.md

↓

PROJECT_STATE.md

↓

ADAPTER.md

↓

ARCHITECTURE.md

↓

BUILDER_SPEC.md

↓

DESIGN_PRINCIPLES.md

↓

FOLDER_STRUCTURE.md

↓

JSON_SCHEMAS.md

↓

CONTRIBUTING_FOR_AI.md
```

## Session Continuity

Sessions span multiple context windows.

At session start:

- Read `_agent/SESSION_WORKFLOW.md`.
- Read `_agent/SESSION_LOG.md`.
- Check the `Next:` line of the most recent entry.
- Read `_agent/JOURNEY_TO_V3.md` — current position on the road to V3.

At session end:

- Follow `_agent/SESSION_WORKFLOW.md`.
- Write the session summary to `_agent/SESSION_LOG.md`, including the `Journey:` line.
- Update the `Current Position` section of `_agent/JOURNEY_TO_V3.md`.

## Build Continuation

Large version builds that exceed the context budget stop at a clean checkpoint, write
`AI/builder/CONTINUE_BUILD_<VERSION>_<STEP>.md`, and resume from it in the next session.
Rule: `AI/builder/CONTINUE_PROJECT_BUILD.md`.

## Project State

After every major refactor:

- Regenerate `PROJECT_STATE.md`.
- Keep the 15-section structure.
- Never leave it stale.

## Release Workflow

Releases follow one workflow:

1. The AI records the release facts in `docs/release_registry.json`.
2. The user reviews the release facts.
3. Run `release-manager.ps1` — it generates CHANGELOG.md, CURRENT_RELEASE.md, bdf/VERSION.md, and this version history table.
4. Run the test harness (Release Docs group must pass).
5. Commit.

Generated release files are never edited manually.

The registry is the sequence authority.

---

# 8. Documentation Structure

| Document | Description |
|----------|-------------|
| `AGENT.md` | AI agent entry guide |
| `ARCHITECTURE.md` | Overall system architecture |
| `DESIGN_PRINCIPLES.md` | Core engineering principles |
| `FOLDER_STRUCTURE.md` | Directory and file responsibilities |
| `JSON_SCHEMAS.md` | Configuration file schemas |
| `BUILDER_SPEC.md` | Builder implementation specification |
| `CONTRIBUTING_FOR_AI.md` | AI contribution rules |
| `DEVELOPER_GUIDE.md` | How to work on the project (human onboarding) |
| `PROVIDER_DEVELOPMENT_GUIDE.md` | Creating user-owned provider definitions + models |
| `PROFILE_CREATION_GUIDE.md` | Creating and editing profiles |
| `BUILDER_EXTENSION_GUIDE.md` | Extending the builder |
| `TESTING.md` | Testing procedures |
| `TROUBLESHOOTING.md` | Common issues and fixes |
| `ROADMAP.md` | Planned future improvements |
| `CHANGELOG.md` | Project version history |
| `CURRENT_RELEASE.md` | Quick reference for the current release (generated) |
| `PROJECT_STATE.md` | Living state snapshot |
| `ADAPTER.md` | Project-specific facts |
| `_agent/SESSION_WORKFLOW.md` | Session start, end, and log rules |
| `_agent/SESSION_LOG.md` | Session history |
| `_agent/JOURNEY_TO_V3.md` | Live tracker of progress toward BDF V3 |
| `planning/` | Long-term planning: BDF_ROAD_TO_V3, VERSION_STRATEGY, FUTURE_IDEAS, DECISIONS |
| `AI/builder/CONTINUE_PROJECT_BUILD.md` | Build checkpoint + resume rule for large versions |
| `AI/` | AI task documents (builder/, claude-code/, deepseek/, full-system-check/, plan/) |
| `bdf/` | Reusable Builder Development Framework |

---

# 9. Template System

Reusable documentation templates live in:

```
bdf/templates/
```

Templates are generic.

They contain no project-specific knowledge.

Project-specific values appear only as placeholders.

Placeholders follow the convention defined in:

```
bdf/templates/README.md
```

Every template becomes one project document when a new builder project is created.

Current templates:

- `README.template.md`
- `AGENT.template.md`
- `ARCHITECTURE.template.md`
- `DESIGN_PRINCIPLES.template.md`
- `BUILDER_SPEC.template.md`
- `FOLDER_STRUCTURE.template.md`
- `JSON_SCHEMAS.template.md`
- `CONTRIBUTING_FOR_AI.template.md`
- `TESTING.template.md`
- `TROUBLESHOOTING.template.md`
- `ROADMAP.template.md`
- `CHANGELOG.template.md`
- `LESSONS_LEARNED.template.md`
- `PROJECT_STATE.template.md`
- `ADAPTER.template.md`

---

# 10. Versioning System

The project follows a simple versioning strategy.

Major Version

```
Large architectural changes.
```

Minor Version

```
New functionality.
```

Patch Version

```
Bug fixes and documentation improvements.
```

## Project Versioning

Recorded in `CHANGELOG.md`.

The release sequence is defined by `docs/release_registry.json` — the registry is the sequence authority.

All version documentation (CHANGELOG marker section, CURRENT_RELEASE.md, bdf/VERSION.md compatibility rows, this version history table) is generated from the registry by the release manager.

Future plans belong exclusively in `ROADMAP.md`.

## Framework Versioning

The Builder Development Framework is versioned independently.

Recorded in `bdf/VERSION.md`.

Current framework version:

```
2.3.0
```

---

# 11. Current Status

## Implemented

- GUI App 'Switcher' (docs/app/) COMPLETE - the BDF made autonomous (session 29, 2026-08-08): FastAPI backend + gui.html + start.bat + local /v1 proxy on 127.0.0.1:9090; calls the real scaffold-agent.ps1 engine and the generated builders. BDF-exact data model: the app reads/writes the agent's own providers/, <provider>-models.json, plugins.json, mcp.json and settings.json activeProviders (a LIST - every listed provider merges into the build), all backup-first. MULTI-AGENT management: Agents card registers any agent config folder, switches the managed agent instantly, loads already-set-up folders directly (no wizard forced). Features: models with per-provider reasoning formats (opencode/openai/claude/gemini/none - correct variant JSON per format) in the provider modal + Models card, plugins card, MCP servers card, SDK type selector (15 npm packages, registry-verified), active hero showing every active provider side-by-side, flame startup banner with local addresses, self-contained Python env (env/ auto-bootstrapped), rule.md live theme + agent rulebook. Verified live on opencode and kilo (kilo.json: omniroute 18 models + tokenrouter 1 model, 19 merged); full E2E click-through battery with snapshot backup + hash-verified restore (32/32). Committed 459d407 + b3a0bdb.
- Real-provider fix + presets (session 31, 2026-08-08): the app writes the key in BOTH agent contracts (provider.<id>.apiKey for OpenCode + provider.<id>.options.apiKey for Kilo) — fixes Kilo's TokenRouter 401; the builders mirror the dual key at merge time (builder-only parity); Add-provider presets for TokenRouter, Modal, OpenAI, Google (Gemini), OpenRouter, NVIDIA NIM with SDK auto-fill; 56 app unit tests, kilo harness 31/31, opencode harness 33/33.
- Modular configuration architecture
- OmniRoute provider integration
- Profile-based configuration
- Multiple profiles (default, coding, experimental, minimal)
- Dynamic profile selection
- Dynamic provider loading
- Separate model management
- Separate plugin management
- Separate MCP management
- Automatic configuration generation
- Automatic backup creation
- Builder V2
- Builder V2.1 (extended validation, modular merge pipeline, provider-specific models, output verification)
- Builder V2.3 / BDF V2.5 (framework generalization: NEW_PROJECT_GUIDE, RELEASE_MANAGER, TESTING framework docs, adapter validation checklist, Impact Analysis record)
- Builder V2.5 (Active-Provider Selector: provider discovery, persisted activeProviders, profile-level `<provider>-models.json` precedence)
- Builder V2.7 (JSON Schema Validation F1-F7, 9-stage pipeline, dynamic target artifact, env-key policy; released as version 2.5.0)
- Automated test harnesses (V2.1: 17 tests — 9 builder + 8 Release Docs; V2.5: 13 tests; V2.7: 31 tests)
- Release Manager V1 (registry-driven release documentation)
- Documentation framework
- Builder Development Framework
- Blueprint Engine
- Project adapter
- Session continuity system
- Project state system
- KiloCode Builder V1 (Kilo project: build/test/scaffold-kilo-v1, harness 31/31)
- V3 Universal Agent Framework core (scaffold-agent.ps1: agent registry, discovery, -List, -Bootstrap per-agent builder generation)

## Not Implemented

- Additional providers
- Extended CLI features
- Additional same-architecture agents beyond opencode/kilo (registry is open — add-a-line)

Planned features are documented only in `ROADMAP.md`.

---


The Switcher app additionally contains a narrow Claude Code routing adapter
(one scalar route at a time) implemented under `app/engine/claude-code/` and
documented under `adapters/claude-code/`. Lifecycle status: **Integrated and
live validated** (Gate 5B corrected live validation PASS 2026-08-17 - sessions
46 + 48; apply, /status evidence, routing marker, byte-verified restore, and
re-lock all verified). The real-target lock is OPEN by owner decision (session
48), so apply/restore work from the UI. Runtime state is Git-ignored under
`app/state/`.
# 12. Known Limitations

- One active profile at build time.
- One provider definition (dynamic loading supported).
- One generated configuration.
- One active builder.
- Documentation expanded only after implementation.

These limitations simplify development and provide a stable foundation for future expansion.

---

# 13. Next Planned Work

- Gate 5 live validation of the Claude Code unique adapter: **COMPLETE**
  (corrected Gate 5B PASS 2026-08-17 + Gate 5C documentation/release sync).
- Baseline test failures: **RESOLVED 2026-08-22** (full-system check V2 fixed
  the two preference tests and the onboarding-copy contract; zero accepted
  baselines remain).
- Phase 15 continues: additional coding agents remain unverified. **Pi is the
  next agent planned** (recorded 2026-08-17): after the Claude Code adapter
  program (Gates 5B/5C, model roles, DPAPI credential store) ships, Pi is
  verified end-to-end (discover → scan → scaffold → build → manage) through the
  framework and the app.
# 14. File Relationships

```
AGENT.md
|
|-- points to the read order documents
|-- points to bdf/FRAMEWORK.md
|-- points to ADAPTER.md
|-- points to _agent/ session files
|-- defines the project state rules

README.md
|
|-- overview of the project
|-- documents the two-layer architecture
|-- links every documentation file

ADAPTER.md
|
|-- defines every project-specific fact
|-- referenced by the framework components

ARCHITECTURE.md
|
|-- describes the build pipeline
|-- defines the source of truth

FOLDER_STRUCTURE.md
|
|-- describes every folder and file
|-- defines ownership

BUILDER_SPEC.md
|
|-- implements the builder specification

CHANGELOG.md
|
|-- records completed work

ROADMAP.md
|
|-- records planned work

bdf/
|
|-- generic engineering knowledge
|-- templates generate project documentation

_agent/
|
|-- session continuity files
|-- referenced by AGENT.md

PROJECT_STATE.md
|
|-- snapshot of all of the above
|-- regenerated after every major refactor
```

---

# 15. Important Engineering Decisions

1. Generated configuration is never edited manually.
2. Source configuration is always the source of truth.
3. Documentation First: documentation is part of the project.
4. Documentation is split into two layers: generic framework and project-specific docs.
5. Future features are documented only in `ROADMAP.md`.
6. The Builder Development Framework is versioned independently from the project.
7. Session continuity files externalize context across sessions.
8. `PROJECT_STATE.md` is regenerated after every major refactor to keep the repository state current.
9. A major refactor is any change that adds, removes, moves, or renames files, or changes architecture.
10. Consistency is more important than speed.

---

A narrow unique routing adapter for Claude Code was approved on 2026-08-14
(`planning/DECISIONS.md`), reversing only the blanket exclusion of the
2026-08-08 decision for a unique bounded routing adapter. The historical
decision remains byte-identical.

**Document Version:** 1.2

**Status:** Current Project State
