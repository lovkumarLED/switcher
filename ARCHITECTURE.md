# Architecture

> High-level architecture of the OpenCode Configuration Manager.

---

# Purpose

The OpenCode Configuration Manager separates configuration into small, independent components that can be maintained individually and automatically merged into a final `opencode.json` file.

The primary goal is to eliminate manual editing of a large configuration file while keeping the system modular, maintainable, and extensible.

---

# Design Principles

The architecture follows the following principles:

- Single Responsibility
- Separation of Concerns
- Modular Configuration
- Configuration over Hardcoding
- Automation over Manual Editing
- Documentation First

Every component has exactly one responsibility.

---

# Architectural Philosophy

The architecture follows a strict separation between configuration, implementation, and generated output.

The project is intentionally divided into independent layers.

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

This separation reduces coupling and makes future changes easier to implement without affecting unrelated parts of the system.

---

# High-Level Architecture

The following diagram illustrates the overall system structure.

```text
                        Source Configuration

        +--------------------------------------------+
        |                                            |
        |   profiles/<profile>/                      |
        |                                            |
        |   ├── settings.json                        |
        |   ├── <provider>-models.json               |
        |   ├── models.json                          |
        |   ├── plugins.json                         |
        |   ├── mcp.json                             |
        |   └── lsp.json                             |
        |                                            |
        +--------------------------------------------+

                         +

        +--------------------------------------------+
        |                                            |
        | providers/                                 |
        |                                            |
        | └── <id>.json x N - dynamic multi-provider |
        |     files feed Discover -> active          |
        |     selection -> merge (may carry          |
        |     reasoningFormat: opencode | openai |   |
        |     claude | gemini | none)                |
        |                                            |
        +--------------------------------------------+

                         │
                         ▼

                build-opencode-v2.7.ps1

                         │
                         ▼

                 Discover Providers

                         │
                         ▼

                 Select & Persist Active ──────► profiles/<profile>/settings.json
                 (writes activeProviders back     (persisted: backed up first,
                  to settings.json)                written only when the list
                                                    differs)

                         │
                         ▼

                 Load Profile

                         │
                         ▼

                 Validate Configuration

                         │
                         ▼

                 Merge Configuration

                         │
                         ▼

                 Backup Existing Config

                         │
                         ▼

                  Generate opencode.json

                         │
                         ▼

                 Verify Output

                         │
                         ▼

                  Write opencode.json

                         │
                         ▼

                      OpenCode

        +--------------------------------------------+
        |                                            |
        |  docs/release_registry.json                |
        |  (hand-edited release facts)               |
        |                                            |
        +--------------------------------------------+

                         │
                         ▼

                  release-manager.ps1

                         │
                         ▼

        CHANGELOG.md · CURRENT_RELEASE.md
        bdf/VERSION.md · PROJECT_STATE.md
```

> **Agent config warning:** the builders generate `opencode.json` (OpenCode) /
> `kilo.json` (Kilo). Do NOT create `opencode.jsonc` next to `opencode.json` —
> OpenCode reads the `.jsonc` *instead of* the `.json` when both exist, and your
> built config silently disappears from `/models`. Generating both formats is
> planned for a future update — not right now.

---

# Component Overview

The project consists of five major components plus the Application layer
(the self-contained Switcher app).

## 1. Profiles

Profiles define the configuration that should be included in the generated OpenCode configuration.

A profile contains:

- settings
- models
- plugins
- MCP configuration

Profiles do not contain provider definitions.

---

## 2. Providers

Providers define how OpenCode communicates with an AI service.

A provider contains:

- provider metadata
- API configuration
- connection information

Provider definitions are independent from profiles.

---

## 3. Builder

The builder is responsible for generating the final OpenCode configuration.

Responsibilities:

- Discover all providers from `providers/*.json`.
- Select active providers (interactive menu / `-Provider` / `-NonInteractive`).
- Persist the selection back to `settings.json` (backed up first).
- Load profile configuration.
- Load provider definitions.
- Validate configuration (structure, duplicates, malformed definitions).
- Merge configuration in stages (settings, providers, models, plugins, MCP, LSP).
- Create backups.
- Verify the generated configuration before writing.
- Generate `opencode.json`.

The builder never modifies source files except `settings.json`, where it writes the resolved `activeProviders` list back after selection.

---

## 4. Generated Configuration

`opencode.json`

This file is generated automatically.

It is considered a build artifact.

It should never be edited manually.

Any configuration changes should always be made to the source files.

---

## 5. OpenCode

OpenCode only reads the generated configuration.

OpenCode has no knowledge of:

- profiles
- builders
- provider definitions
- documentation

It only consumes the generated `opencode.json`.

---

## 6. Application Layer (Switcher App)

A self-contained local web app wraps the same pipeline:

- Python backend package `app/app/` — 23 modules incl. `preferences`,
  `lsp`, `mcp`, `proxy`, `activity`, `claude_adapter`, `claude_credentials`
  (DPAPI).
- Vanilla-JS SPA `assets/js/` — pages incl. `claude-routes`.
- Bundled engine under `app/engine/`.

---

# Dependency Direction

Dependencies always point downward.

```
Profiles

↓

Providers

↓

Builder

↓

Generated Configuration

↓

OpenCode
```

Higher layers never depend on lower layers.

This keeps the architecture predictable and minimizes coupling.

---

# Build Pipeline

The following diagram shows what happens during a build.

```
Source Files

↓

Profile

↓

Discover Providers

↓

Select & Persist Active
(settings.json)

↓

Load

↓

Validate

↓

Merge

↓

Backup

↓

Generate

↓

Verify

↓

Write opencode.json

↓

OpenCode
```

---

## Builder V2.7 pipeline (JSON Schema Validation)

Builder V2.7 (`build-opencode-v2.7.ps1`) extends the V2.5 pipeline with JSON Schema validation (F1) and a pre-flight dependency check (F2), renumbered into the following 9-stage pipeline:

| Stage | Name | V2.7 Notes |
|-------|------|-----------|
| 0 | Discover-Providers | unchanged (V2.5) |
| 1 | Load Profile | unchanged |
| 2 | Load Provider | provider reference check (merge moved to Stage 6) |
| 3 | Schema Validation | NEW: F1 JSON Schema + F2 pre-flight gate; build aborts here on missing deps |
| 4 | Validation | was V2.5 Stage 2 (settings shape, list lengths) |
| 5 | Backup | was V2.5 Stage 4 (F4 retention prune) |
| 6 | Merge | providers + models + plugins + mcp + final merge |
| 7 | Generation | writes opencode.json + F5 provenance sidecar |
| 8 | Verification | round-trip + F7 diff summary + F4 prune |

---

# Release Pipeline

Release documentation is generated, not hand-written.

The release pipeline mirrors the build pipeline: one source of facts, one generator, generated artifacts.

```
docs/release_registry.json

↓

release-manager.ps1

↓

CHANGELOG.md (marker section)

CURRENT_RELEASE.md

bdf/VERSION.md (compatibility rows)

PROJECT_STATE.md (version history table)
```

## Data Flow

- Release facts are recorded once in `docs/release_registry.json`.
- The release manager validates the registry (unique versions, one Current, required fields).
- The manager rewrites only the marker sections and generated rows.
- Manual prose is preserved verbatim.
- Generation is all-or-nothing: if validation fails, nothing is written.

## Ownership Rules

| File | Owner |
|------|-------|
| `release_registry.json` | AI (edits release facts) + user (reviews before generation) |
| CHANGELOG marker section | Release Manager |
| `CURRENT_RELEASE.md` | Release Manager |
| `bdf/VERSION.md` compatibility rows | Release Manager |
| PROJECT_STATE version history table | Release Manager |
| Manual prose in release docs | Developer |

Generated release artifacts are never edited manually.

The registry is the sequence authority for version documentation.

---

# Separation of Responsibilities

| Component | Responsibility |
|------------|----------------|
| Profile | Defines user configuration |
| Provider | Defines API connection |
| Builder | Merges configuration |
| Backup | Preserves previous configuration |
| OpenCode | Uses generated configuration |

Each component is independent.

No component performs the responsibility of another component.

---

# Source of Truth

The project distinguishes between editable source files and generated output.

## Editable Source Files

The following files represent the authoritative project configuration.

- Provider definitions
- Profile configuration
- Documentation
- Builder scripts

These files should be modified directly by the developer.

---

## Generated Output

The following file is generated automatically.

```
opencode.json
```

Generated files are disposable.

They must never be edited manually.

Whenever configuration changes are required, the source files should be updated and the builder executed again.

---

# Configuration Lifecycle

The following diagram shows the developer workflow.

```
Edit Source Files

↓

Run Builder

↓

Validate Configuration

↓

Create Backup

↓

Generate Configuration

↓

OpenCode Uses Configuration
```

---

# Design Constraints

The current architecture intentionally limits functionality to reduce complexity during the initial implementation.

Current constraints include:

- One active profile at build time
- One ACTIVE provider set drives each build (dynamic multi-provider discovery; activeProviders selection)
- One generated configuration
- One active builder

These constraints simplify development and provide a stable foundation for future expansion.

Future architectural improvements will be introduced only after the current implementation is fully documented and tested.

---

# Current Architecture Status

## Implemented

- Modular configuration
- OmniRoute provider
- Profile configuration
- Builder
- JSON Schema validation (F1, schemas/*.schema.json)
- Backup system
- Generated configuration
- Documentation
- Backend API surface (preferences incl. browser pref, GET/PUT `/api/lsp`,
  setup verify/revert, global loopback Host+Origin middleware on `/api` +
  `/v1`, reserved-id rejection, proxy `..` rejection, `/v1` metadata-only
  activity allowlist)
- Claude Code routes adapter (live validated)
- Kilo target
- LSP/MCP/plugins merge
- Provenance sidecar
- Test suites green (Python 270 + Node contracts 192)

## Not Implemented

Previously listed: "Additional provider integrations". This is no longer
accurate — multiple providers ship today (presets + dual-key mirror +
Test connection), Claude Code ships as a unique bounded adapter, and a
read-only inventory scan exists.

---

# Long-Term Vision

The architecture is designed to remain stable even as additional features are introduced.

Future improvements should extend the existing architecture rather than replacing it.

Whenever possible, new functionality should be introduced by adding new modules instead of modifying existing ones.

This approach minimizes breaking changes and keeps the project maintainable over time.

- Keep configuration modular.
- Avoid duplicated configuration.
- Make configuration easy to maintain.
- Keep generated files separate from source files.
- Allow future expansion without redesigning the project.
- Ensure every component has a clearly defined responsibility.

---

## Unique Adapter and Hybrid Documentation Layers

The repository uses a hybrid documentation architecture: generic BDF contracts
define reusable adapter categories, root project documents summarize and link,
unique adapter namespaces (`adapters/<agent>/`) own durable target-specific
documentation, and gate evidence lives under `planning/`. Engine ownership is
layered: canonical unique-adapter implementation plus an explicitly derived
packaged copy under `app/engine/<agent>/` when the app ships a self-contained
engine.

---

**Document Version:** 1.1

**Status:** Current Architecture