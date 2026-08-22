# Project Adapter

> Project-specific facts for the OpenCode Configuration Manager.

---

# Purpose

This document defines how the Builder Development Framework applies to the OpenCode Configuration Manager.

The framework is generic.

This adapter makes the framework project-specific.

Every field in this document defines a project-specific fact.

---

# Adapter Contents

## Project Name

```
OpenCode Configuration Manager
```

---

## Configuration File

The source configuration files and their format.

```
profiles/default/settings.json     (required)
profiles/default/omniroute-models.json   (optional, per-provider models)
profiles/default/plugins.json    (optional)
profiles/default/mcp.json        (optional)
profiles/default/lsp.json        (optional)
providers/<id>.json              (dynamic provider definitions,
                                  dual-key apiKey <-> options.apiKey)
```

Providers are discovered dynamically as `providers/<id>.json` files
(dual-key `apiKey` <-> `options.apiKey`); builders merge ACTIVE providers
only. Currently shipped: omniroute, tokenrouter, orcarouter,
cli-proxy-api.

Additional profiles (`coding`, `experimental`, `minimal`) contain `settings.json` (+ `<provider>-models.json` model files, `target.json`, and `lsp.json` as needed) and contribute their provider selection to the build. The Kilo and OpenCode adapters both carry `lsp.json` (disabled by default).

Format:

```
JSON
```

---

## Folder Structure

The project folders and their responsibilities.

The repository root IS `docs/`. Runtime agent configs live one level up
(`~/.config/opencode`).

```
docs/

├── app/                        self-contained Switcher app
│   ├── app/                    Python backend package + tests
│   ├── assets/                 vanilla-JS SPA assets
│   └── engine/                 bundled BDF engine
│       ├── scaffold-agent.ps1  typed by main-config presence
│       │                       (kilo.json → K1, otherwise V2.7)
│       ├── build-opencode-v2.7.ps1 / test-opencode-v2.7.ps1
│       │                       V2.7 builder + test harness
│       │                       (40 tests incl. 5 LSP)
│       ├── kilo/               build-kilo-v1.ps1 /
│       │                       test-kilo-v1.ps1 (37 tests)
│       ├── claude-code/        routing core + production builder
│       │                       + Gate2/Gate3 harnesses
│       └── schemas/
├── adapters/<agent>/           unique-adapter docs
├── bdf/                        framework docs + templates
├── planning/
├── AI/
└── <root guides>               README.md, ADAPTER.md, ...
```

| Path | Responsibility |
|--------|----------------|
| `app/` | Self-contained Switcher app (backend package, SPA assets, tests) |
| `app/engine/scaffold-agent.ps1` | Scaffold typed by main-config presence (`kilo.json` → K1, otherwise V2.7) |
| `app/engine/build-/test-opencode-v2.7.ps1` | V2.7 builder + test harness (40 tests incl. 5 LSP) |
| `app/engine/kilo/` | Kilo K1 builder + tests (`test-kilo-v1.ps1`, 37 tests) |
| `app/engine/claude-code/` | Routing core + production builder + Gate2/Gate3 harnesses |
| `app/engine/schemas/` | JSON schemas |
| `adapters/<agent>/` | Unique-adapter documentation per target agent |
| `bdf/` | Generic framework docs + templates |
| `planning/`, `AI/` | Plans/gate evidence; AI working notes |
| `<root guides>` | README.md, ADAPTER.md, ARCHITECTURE.md, ... |

---

## Supported Providers

Providers are dynamic `<id>.json` files (dual-key `apiKey` <->
`options.apiKey`); the builders merge ACTIVE providers only. Currently
shipped:

```
omniroute
tokenrouter
orcarouter
cli-proxy-api
```

---

## Supported Models

The models exposed by the `default` profile.

Sources include:

- opencode-zen models
- cloudflare-ai models
- groq models
- ollamacloud models
- gemini models
- nvidia models
- openrouter models

The complete model list is defined per active provider in the profile:

```
profiles/<profile>/<provider>-models.json
```

Providers may also own provider-specific models:

```
providers/<provider>/models.json
```

Profile-level provider models are loaded per active provider:

```
profiles/<profile>/<provider>-models.json
```

This source carries the highest precedence.

Model-source precedence (highest first):

```
profiles/<profile>/<provider>-models.json
providers/<provider>/models.json
inline provider models
profiles/<profile>/models.json
```

### Reasoning formats

Providers may declare an optional `reasoningFormat` field
(`opencode` | `openai` | `claude` | `gemini` | `none`, default `opencode`).
It selects the valid reasoning levels and the variant JSON shape the app
writes for that provider's models:

- `opencode` / `openai` → `reasoningEffort`
- `claude` → `thinking.type` + `thinking.budgetTokens`
- `gemini` → `thinkingConfig.thinkingBudget`
- `none` → no variants

The builder passes `variants` through verbatim; the field never affects the
build pipeline. Interactive builder runs ask the developer for the format when
it is missing or invalid levels are present, persist it to the provider file
(backup-first), and filter invalid levels from the generated output. See
`PROVIDER_DEVELOPMENT_GUIDE.md` for full examples.

---

## Supported Plugins

```
superpowers (superpowers@git+https://github.com/obra/superpowers.git)
```

The complete plugin list is defined in:

```
profiles/default/plugins.json
```

LSP server configuration is defined separately in `profiles/default/lsp.json`
(disabled by default).

---

## Supported MCP

MCP servers configured by the `default` profile:

- github
- browser-playwright
- shell
- filesystem
- pyright
- Remote MCP
- Sequential Thinking
- Exa Search
- context7

The complete MCP configuration is defined in:

```
profiles/default/mcp.json
```

LSP server configuration is defined separately in `profiles/default/lsp.json`
(disabled by default).

---

## Output Artifact

The final generated configuration file.

```
opencode.json
```

The builder generates this artifact from the source configuration.

It is never edited manually.

Each build also writes a provenance sidecar (`.provenance.json`, sha256 of
the artifact + inputs) next to the generated config.

> **Agent config warning:** the builders generate `opencode.json` (OpenCode) /
> `kilo.json` (Kilo). Do NOT create `opencode.jsonc` next to `opencode.json` —
> OpenCode reads the `.jsonc` *instead of* the `.json` when both exist, and your
> built config silently disappears from `/models`. Generating both formats is
> planned for a future update — not right now.

---

## Release Registry

The machine-readable release history.

```
docs/release_registry.json
```

The only hand-edited release artifact.

The AI records the release facts after implementation and testing.

The user reviews the facts before the release manager runs.

The generic release process is defined in:

```
bdf/RELEASE_MANAGER.md
```

---

## Release Artifacts

The generated release documentation.

```
CURRENT_RELEASE.md
```

Generated from the release registry by the release manager.

It is never edited manually.

---

## Builder Entry Point

The script that runs the builder.

```
scripts/build-opencode-v2.7.ps1
```

Builder V2.1 (`scripts/build-opencode-v2.ps1`) remains the legacy entry point.

Invocation example:

```
.\build-opencode-v2.7.ps1 -Profile default
```

Extra V2.7 CLI flags documented by the builder spec: `-SchemaDir`, `-WhatIf`, `-KeepBackups`, `-Doctor`, `-ProvenancePath` (defaults in `docs/BUILDER_SPEC.md`).

---

## Release Manager Entry Point

The script that generates the release documentation.

```
scripts/release-manager.ps1
```

Invocation example:

```
.\release-manager.ps1 -ConfigRoot C:\Users\loveb\.config\opencode\docs
```

Generated release files are never edited manually.

The generic release process (registry, all-or-nothing writes, marker policy) is defined in:

```
bdf/RELEASE_MANAGER.md
```

---

# Adapter Rules

- The framework stays generic.
- This adapter contains all project-specific knowledge.
- This adapter is the single source of project-specific facts.
- Every field must be defined.
- No placeholder may remain.
- The adapter changes with the project.

---

# Framework Reference

The generic framework lives in:

```
bdf/FRAMEWORK.md
```

When the framework references a project-specific value, this adapter defines it.

---

## Unique Agent Adapter Namespaces

The project adapter covers the OpenCode primary target. The project may also
carry unique bounded adapters for targets whose contracts differ materially
from the universal scaffold. Each unique adapter owns `adapters/<agent>/`
(fixed five-file documentation contract) and an approved implementation
mapping. Target-specific detail lives in the adapter documents, not here.

Currently shipped unique adapters:

- **Claude Code bounded routing adapter** — routes CRUD, apply/restore
  real-target lock OPEN by owner decision, DPAPI credential store, managed
  env vars, model roles sonnet/haiku/opus/fable, read-only inventory scan;
  LIVE VALIDATED Gate5B PASS re-run 2026-08-22.
- **KiloCode K1** — scaffold type inference.

---

**Document Version:** 1.1

**Status:** Active Project Adapter
