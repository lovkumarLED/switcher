# ROADMAP

> Planned evolution of the OpenCode Configuration Manager toward the Builder Development Framework (BDF) V3.

---

# Purpose

This document describes the planned direction of the project.

Only planned or proposed features should appear here.

Completed features belong in:

```
CHANGELOG.md
```

Implementation details belong in:

```
BUILDER_SPEC.md
```

The long-term vision and version philosophy live in:

```
planning/BDF_ROAD_TO_V3.md
```

The live tracker of our position on the road to V3 lives in:

```
_agent/JOURNEY_TO_V3.md
```

This roadmap is intended to guide future development while keeping the overall project vision clear.

---

# Destination — BDF V3

Every phase below serves one destination:

> **BDF V3 — the first stable public version of the Builder Development Framework.**

V3 is complete when the same engineering framework can successfully create and maintain
builders for **OpenCode**, **KiloCode**, and any open-source coding agent sharing their
architecture, without redesigning the framework.

Only Project Adapters should differ between supported projects.

The path is:

```
Current (Builder V2.7 JSON Schema Validation) ✅
↓
KiloCode Builder V1 ✅ (Kilo V1, harness now 37/37 incl. 5 LSP tests)
↓
BDF V3 (Universal Builder Generator) — in progress
```

Claude Code is not on this generic same-architecture path (its config is a single entropic
~/.claude.json) — it is served instead by its own dedicated routing adapter, which is complete
and live validated (see Narrow Unique Adapter below).

Each step is built, tested, and validated before the next begins.

Real projects shape the framework — never assumptions.

---

# Project Status

Current Version

```
2.5.3
```

Current Status

```
Builder V2.7 JSON Schema Validation
```

Journey Position

```
Step 3 Universal Agent Framework core — IN PROGRESS (~98%); BDF V2.5 ✅, V2.7 gate ✅, KiloCode V1 COMPLETE ✅,
Claude unique routing adapter COMPLETE + live validated ✅, full-system check V2 PASS ✅; next: BUILDER_PHASES gates for the universal framework, then Step 4 / Step 5
```

The project currently provides:

- Modular configuration
- Provider abstraction
- Profile abstraction
- Configuration builder (V2.7)
- Dynamic profile selection
- Dynamic provider loading
- Backup system
- Automated release pipeline (registry + release manager)
- Documentation framework

The next development phases focus on expanding flexibility while preserving the existing architecture.

---

# Development Phases

## Phase 1 — Foundation ✅

Status

```
Completed
```

Completed work includes:

- Project architecture
- Builder
- Provider abstraction
- Profile abstraction
- Backup system
- Documentation
- Manual testing framework

---

## Phase 2 — Builder Improvements ✅

Status

```
Completed
```

Completed work includes:

- Dynamic provider loading.
- Dynamic profile selection.
- Improved configuration validation.
- Better console output.
- Improved error reporting.
- Cleaner internal builder architecture.

The implementation is documented in:

```
BUILDER_SPEC.md
```

---

## Phase 3 — Multiple Profiles ✅

Status

```
Completed
```

Completed work includes:

- Multiple profiles: `default`, `coding`, `experimental`, `minimal`.
- The `default` profile is fully configured.
- Additional profiles contribute their provider selection to the build.

---

## Phase 4 — Additional Providers ✅

Status

```
Completed — dynamic provider loading (V2.2) + all-provider discovery (V2.5)
```

Objectives

Support additional provider definitions.

Examples

```
providers/

omniroute.json

cliproxy.json

future-provider.json
```

Goals

- Builder automatically discovers providers.
- No builder modifications required for new providers.
- Provider configuration remains modular.

---

## Phase 5 — Validation Framework ✅

Status

```
Completed
```

Completed work includes:

- Duplicate provider identifier detection.
- Duplicate model identifier detection (raw text, not collapsed by parsing).
- Duplicate model name detection.
- Duplicate plugin identifier detection.
- Duplicate MCP identifier detection.
- Malformed provider definition rejection.
- Malformed profile definition rejection.
- Missing required field rejection.
- Invalid configuration structure rejection.

Remaining (possible additions)

- Unknown key detection.
- JSON Schema validation.

Goal

Catch configuration errors before generation begins.

---

## Phase 6 — Automated Testing ✅

Status

```
Completed
```

Completed work includes:

- Reusable test harness (`scripts/test-opencode-v2.ps1`).
- Valid profile testing against the real coding profile.
- Failure-mode testing (invalid JSON, missing provider, duplicates, malformed definitions).
- Backup failure safety testing.
- Provider-specific models testing.

Remaining (possible additions)

- Configuration comparison across builds.
- Integration testing with a running provider.

Goal

Reduce manual testing effort.

---

## Phase 7 — Builder Refactoring ✅

Status

```
Completed
```

Completed work includes:

- Modular merge pipeline (settings, providers, models, plugins, MCP).
- Split verification stages (JSON, providers, models, plugins, MCP).
- Concise count-based logging.
- Clearer diagnostics.
- Independent, maintainable functions.

Remaining (possible additions)

- Easier future extension.

Goal

Keep the builder simple even as functionality grows.

---

## Phase 8 — Documentation Expansion ✅

Status

```
Completed (2026-08-08) — 4 onboarding guides created
```

Completed work includes:

- `DEVELOPER_GUIDE.md` — how to work on the project (read order, workflow, verification, common tasks).
- `PROVIDER_DEVELOPMENT_GUIDE.md` — creating user-owned provider definitions + models, No-Secrets `{env:VAR}` policy.
- `PROFILE_CREATION_GUIDE.md` — the three default profiles, the file contract, creating new profiles.
- `BUILDER_EXTENSION_GUIDE.md` — the builder pipeline, adding features/tests/CLI flags/merge stages, verification checklist.
- All four guides mirrored as framework templates (`bdf/templates/*.template.md`) — template count 15 → 19.
- Registered in `FOLDER_STRUCTURE.md`, `PROJECT_STATE.md`, `README.md`, `bdf/PROJECT_GENERATOR.md` (Stage 4 + 5), `bdf/templates/README.md` (list + matrix).

Goal

Make onboarding easier for future contributors.

---

## Phase 9 — Release Manager V1 ✅

Status

```
Completed
```

Completed on

```
2026-08-04
```

Completed work includes:

- `docs/release_registry.json` — machine-readable release history (the only hand-edited release artifact).
- `scripts/release-manager.ps1` — generates all release documentation from the registry.
- Rich CHANGELOG marker section, `CURRENT_RELEASE.md`, `bdf/VERSION.md` compatibility rows, and the PROJECT_STATE version history table.
- Marker policy: the manager rewrites only generated sections; manual prose is preserved.
- All-or-nothing failure policy: nothing is written when validation fails.
- Release Docs test group (tests 10-17) added to the test harness; test 17 is the only read-only real-docs test.

Remaining (possible additions)

- Release channels and support status in the registry.

Goal

Make every version release one command instead of a manual 10-file edit.

---

## Phase 10 — BDF V2.5: Framework Generalization ✅

Status

```
Completed (2026-08-04)
```

Objective

Strengthen the framework. Not redesign it.

Purpose

```
Prepare the framework for becoming V3.
```

Planned work includes:

- `NEW_PROJECT_GUIDE.md` — documented process for onboarding a new project.
- Better `PROJECT_ADAPTER.md` — cleaner generic/project boundary.
- More generic templates.
- Better Blueprint Engine.
- Cleaner framework boundaries.
- Improved validation, testing, adapters, templates, documentation, provider handling, and release system.

Not included

- Automatic project generation. That arrives with V3.

Goal

Make the framework reusable across OpenCode, KiloCode, and any same-architecture
open-source coding agent without redesign.

---

## Phase 10.5 — Active-Provider Selector Builder (V2.5 Builder) ✅

Status

```
Completed — released as registry 2.4.0 (2026-08-05)
```

Objective

Extend the builder so it:

- Considers every `provider` definition in `providers/` (all `*.json` files, not just the ones already listed in `settings.json`).
- Lets the user pick which providers are active via an interactive selection menu, and persists the chosen list back into `profiles/<profile>/settings.json`.
- Attaches the chosen provider's model list from profile-level `<provider>-models.json` files (`modal-models.json`, `omniroute-models.json`, ...) into the final `opencode.json`.

Resilience rule (regeneration guarantee)

The builder must be fully reproducible from documentation. If `scripts/*` are deleted, an
agent must be able to regenerate `build-opencode-v2.5.ps1` with every feature by reading
`BUILDER_SPEC.md` and `AI/builder/BUILD_BUILDER_V2.5_SELECTOR.md`. The spec must describe every
stage, function contract, CLI switch, precedence rule, and file shape exactly.

Expected release

```
registry 2.4.0
```

---

## Phase 10.6 — JSON Schema Validation (schemas/) ✅

Status

```
Completed — gate before KiloCode Builder V1 (V2.7, F1-F7, harness 31/31)
```

Objective

Implement JSON Schema validation for configuration files before the builder's own
validation runs:

```
profiles/<profile>/settings.json
providers/*.json
models.json
<provider>-models.json   (new in Phase 10.5)
plugins.json
mcp.json
lsp.json
```

Reserved location and workflow

`schemas/README.md` describes the future flow:

```

Configuration Files

↓

JSON Schema Validation

↓

Builder Validation

↓

Configuration Merge

↓

Generate opencode.json

```

Required before

KiloCode Builder V1 (Phase 12 — COMPLETED 2026-08-07; harness grown to 37/37 with the LSP group).

Note: Claude Code Builder V1 (Phase 11) is DROPPED — decision 2026-08-08,
see `planning/DECISIONS.md`. Claude config (`~/.claude.json`) is entropic and does not
support adding providers; it will never work with this framework.

---

## Phase 11 — Claude Code Builder V1 — DROPPED THEN DELIVERED ✅ (unique routing adapter)

Status

```
RESOLVED 2026-08-08 — DROPPED from the generic builder path (see original decision below).
DELIVERED 2026-08-14..22 — as a dedicated unique bounded routing adapter (not a generic
BDF profile builder): routes UI + apply/restore, DPAPI credential store, model roles,
read-only inventory. LIVE VALIDATED (Gate 5B PASS 2026-08-17; re-executed live 2026-08-22).
```

Original decision, kept for history: 2026-08-08. Claude Code config is a huge entropic
`~/.claude.json` with no way to add providers (one provider at a time) — building a
maintainable Claude *generic* builder from BDF is not feasible. That reasoning still holds;
the shipped adapter solves it by managing one scalar route at a time instead.

---

## Phase 12 — KiloCode Builder V1 ✅

Status

```
COMPLETED 2026-08-07 — Kilo V1: build-kilo-v1.ps1, test-kilo-v1.ps1 bundled at app/engine/kilo/;
harness now 37/37 incl. the LSP test group (KILO_ADAPTER + real ~/.config/kilo)
```

Objective

Use the same framework to build the KiloCode builder.

Second real validation of the framework against a second project.

---

## Phase 13 — BDF V3: Universal Builder Generator 🔄

Status

```
IN PROGRESS — core built (session 24b) + scaffold contract finalized (session 28):
scaffold-agent.ps1 universal, registry opencode/kilo/other, -Bootstrap generates per-agent builders
```

Objective

Turn the framework into a generator of builder projects.

One command flow:

```
Create New Builder Project

↓

Discover installed open-source coding agents (OpenCode / Kilo / any same-architecture)

↓

Choose agent

↓

Read project schema

↓

Generate adapter

↓

Generate docs

↓

Generate folder structure

↓

Generate builder

↓

Generate tests

↓

Done
```

Definition of complete

- The same framework creates and maintains builders for OpenCode, KiloCode, and ANY
  open-source coding agent (Aider, Goose, Codex-Cli, ...) — discovery finds whatever
  open-source agents are installed; if none are found, the framework asks the user for
  the location of their coding agents.
- Only Project Adapters differ.
- No framework redesign is required per project — main configs (JSON), profiles, MCP,
  plugin-splitting, per-agent generated build/test/scaffold scripts.
- The scaffold's ONE job for any agent: scan the agent's OWN main JSON, split it into
  mcp / plugin / lsp sections, and seed the profiles — `coding` (always the main profile) +
  `experimental` + `minimal`, each with `settings.json`, `mcp.json`, `plugins.json`,
  `lsp.json` (disabled by default).
- The framework creates the `providers/` folder but NEVER writes provider or model
  files inside it — providers and models are 100% user-owned. The framework never
  copies another agent's config into a project; each agent's profiles are seeded
  from its own main JSON.
- Claude Code is supported through its own unique bounded routing adapter (complete, live validated);
  it never joins the generic same-architecture builder path above.

V3 is the first stable public milestone — not the end of development.

---

## Phase 14 — GUI App: "Switcher" for Normal Users ✅

Status

```
COMPLETED 2026-08-08 (session 29) — docs/app/: FastAPI backend + gui.html frontend + start.bat,
local OpenAI-compatible proxy on 127.0.0.1:9090, calls the real scaffold-agent.ps1 -Bootstrap
engine (one engine, two surfaces). Smoke-tested end-to-end green on the real opencode agent.
Feature set: BDF-exact data model (app reads/writes the agent's own providers/,
<provider>-models.json, plugins.json, mcp.json, lsp.json, settings.json activeProviders — backup-first),
MULTI-AGENT management (Agents card: add any agent's config folder, switch the managed agent
instantly, already-set-up folders load directly without the wizard), models with thinking
levels (default/minimal/high/max, provider modal + Models card), plugins card, MCP servers
card, SDK type selector (15 npm packages, registry-verified), active-hero showing EVERY
active provider side-by-side, self-contained Python env (env/ bootstrapped by start.bat),
flame ASCII-art startup banner with local addresses, rule.md live theme + agent rulebook,
kilo verified live (omniroute + tokenrouter, 19 models in kilo.json). Full E2E click-through
battery on a real agent config with snapshot backup + hash-verified restore (32/32).
Committed: 459d407 (docs batch) + b3a0bdb (feat app).

EXTENDED (session 31, 2026-08-08): real-provider support — the app writes the key in both
agent contracts (apiKey for OpenCode, options.apiKey for Kilo — fixes Kilo's TokenRouter
401), Add-provider presets for TokenRouter, Modal, OpenAI, Google (Gemini), OpenRouter and
NVIDIA NIM with SDK auto-fill, and the builders mirror the dual key at merge time so
builder-only users get the same result as app users. 56 app unit tests, kilo harness 31/31, opencode harness 33/33.
```

Objective

A normal person (zero dev knowledge) opens the app, follows the wizard alone,
and the APP does the BDF's work autonomously:

```
Double-click start.bat → browser opens
↓
Wizard: discover agent → scan main JSON → found-sections cards
↓
Generate builder scripts (the app calls the real scaffold-agent.ps1 -Bootstrap engine)
↓
Add provider (preset or custom, keys stay in the user's providers.json only)
↓
Test connection ✓ → Switch to this (one click)
↓
Build my config (runs the generated builder)
↓
AI tool points at http://127.0.0.1:9090/v1 once — switching is one click forever
```

Definition of complete

- Full API contract: GET / (gui.html), GET /api/status, POST /api/discover, POST /api/scan,
  GET/POST /api/providers, PUT/DELETE /api/providers/<id>, POST /api/test, POST /api/switch,
  POST /api/scaffold (runs scaffold-agent.ps1 -Agent <agent> -NonInteractive -Bootstrap),
  POST /api/build (runs build-<agent>.ps1 -Profile coding -NonInteractive),
  POST /v1/* local OpenAI-compatible proxy to the ACTIVE provider.
- API keys NEVER returned by GET (masked/omitted); providers.json backed up before every write;
  local-first 127.0.0.1 only; No-Secrets rule.
- SUCCESS TEST passed: the wizard flow (discover → scan → scaffold on the real opencode agent
  → build) completed green without any AI agent — build-<agent>.ps1 generated and executed,
  providers switched, chat through the proxy answered.

---

## Phase 15 — More Coding Agents 🔜

Status

```
PLANNED — OpenCode + KiloCode verified today (app + universal scaffold). Other
open-source coding agents are expected to work with the same universal engine,
but have NOT been tested yet — we will find out when we try them.
```

Objective

The app and the framework should work with more coding agents — not just the
ones verified so far. The universal scaffold-agent.ps1 registry already knows
several agents; the goal is to verify and support each one end-to-end (discover
→ scan → scaffold → build → manage providers/models/plugins) through the same
two surfaces: the MD framework and the GUI app.

Next agent planned: **Pi** (recorded 2026-08-17, session 48). Pi is the next
coding agent to be added and verified after the Claude credential-store UX is
complete — the Claude Code adapter program (Gates 5B/5C, model roles) is done;
Pi comes next, then the remaining roadmap phases.

Definition of complete (when tried)

- Each new agent verified end-to-end through the app and the framework.
- The scaffold registry and the app's agent store handle its config shape.
- Verification documented in this roadmap and the project state.

---

# Phase Completion Summary

| Phase | Status |
|-------|--------|
| Phase 1 — Foundation | ✅ Completed |
| Phase 2 — Builder Improvements | ✅ Completed |
| Phase 3 — Multiple Profiles | ✅ Completed |
| Phase 4 — Additional Providers | ✅ Completed |
| Phase 5 — Validation Framework | ✅ Completed |
| Phase 6 — Automated Testing | ✅ Completed |
| Phase 7 — Builder Refactoring | ✅ Completed |
| Phase 8 — Documentation Expansion | ✅ Completed |
| Phase 9 — Release Manager V1 | ✅ Completed |
| Phase 10 — BDF V2.5 Framework Generalization | ✅ Completed |
| Phase 10.5 — Active-Provider Selector Builder | ✅ Completed |
| Phase 10.6 — JSON Schema Validation | ✅ Completed |
| Phase 11 — Claude Code Builder V1 | ✅ Complete (dedicated routing adapter, live validated) |
| Phase 12 — KiloCode Builder V1 | ✅ Completed |
| Phase 13 — BDF V3 Universal Builder Generator | 🔄 In Progress |
| Phase 14 — GUI App (Switcher) | ✅ Completed |
| Phase 15 — More Coding Agents | 🔜 Planned (untested) |

**13 of 15 phases complete. Phase 13 (BDF V3) remains IN PROGRESS — not yet released; more development is planned before the official V3 release. Phase 15 (More Coding Agents) is planned but untested.**

---

# Long-Term Vision

The long-term objective is to build a configuration management system that is:

- Modular
- Extensible
- Predictable
- Well documented
- Easy for both humans and AI agents to maintain

The framework's destination is BDF V3 — the first stable public version that generates
builders for OpenCode, KiloCode, and any same-architecture open-source coding agent from
a single reusable engineering framework. Future features should extend the existing
architecture rather than replacing it.

---

# Out of Scope

The following items are intentionally excluded until explicitly planned.

- Cloud synchronization.
- Automatic internet downloads.
- Features unrelated to configuration management.

Keeping the project focused is considered a design goal.

---

# Roadmap Maintenance

The roadmap should be reviewed whenever a major milestone is completed.

When a planned feature is implemented:

1. Remove it from this document.
2. Record it in `CHANGELOG.md`.
3. Update the relevant documentation.

Position on the road to V3 is tracked separately in:

```
_agent/JOURNEY_TO_V3.md
```

Update it whenever a roadmap phase advances.

This ensures that the roadmap always reflects future work rather than project history.

---

## Narrow Unique Adapter Effort (2026-08-14)

A later approved direction: the Switcher app gains a narrow Claude Code routing
adapter as a unique bounded adapter (one scalar route at a time), documented
under `adapters/claude-code/`. This is a later decision that does not rewrite
the historical Phase 11 outcome (see `planning/DECISIONS.md`). Lifecycle
status: **Live validated** (2026-08-17 corrected Gate 5B PASS + Gate 5C approved;
re-executed live on 2026-08-22 with byte-exact restore; see `planning/claude-code/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_PASS_REPORT.md`).
The real-target lock stays closed until the owner opens it.

---

**Document Version:** 1.1

**Status:** Active Development Roadmap
