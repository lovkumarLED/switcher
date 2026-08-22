# README Template

> Template: project entry point. Becomes `README.md`.

---

# {{PROJECT_NAME}}

> A modular configuration management system for {{APP_NAME}}.

---

## Overview

{{PROJECT_NAME}} is a modular configuration system designed to simplify the management of {{APP_NAME}}.

Instead of manually maintaining a large configuration file, the project separates configuration into smaller, independent files and automatically generates the final configuration through a builder script.

This approach makes the configuration easier to maintain, easier to extend, and significantly reduces the risk of configuration errors.

---

## Current Features

- Modular configuration architecture
- Provider integration
- Profile-based configuration
- Dynamic profile selection
- Dynamic provider loading
- Separate model management
- Separate plugin management
- Separate service management
- Automatic configuration generation
- Automatic backup creation
- Structured project documentation

---

## Project Structure

The project is organized into several independent components.

| Component | Purpose |
|-----------|---------|
| `{{CONFIG_SOURCE_DIR}}/` | Profile-specific configuration |
| `{{PROVIDER_DIR}}/` | Provider definitions |
| `{{BACKUP_DIR}}/` | Automatic configuration backups |
| `{{SCRIPTS_DIR}}/` | Builder scripts |
| `{{DOCS_DIR}}/` | Project documentation |

### User-Run vs System-Run

The user only ever runs the BUILDERS (`{{BUILDER_SCRIPT}}` / `{{BUILDER_SCRIPT_ALT}}`).
Everything else — test harnesses (`{{TEST_HARNESS}}`), the release manager
(`{{RELEASE_MANAGER_SCRIPT}}`), and the scaffold (`{{UNIVERSAL_SCRIPT}}`) — is
system/AI-run machinery.

---

## How Configuration Is Organized

```
{{PROJECT_ROOT}}/
├── profiles/            ← YOU edit these
│   ├── coding/          ← the MAIN profile (always)
│   │   ├── settings.json          (framework-writable: $schema + activeProviders)
│   │   ├── mcp.json               (user-owned after creation)
│   │   ├── plugins.json           (user-owned after creation)
│   │   ├── lsp.json               (user-owned after creation; disabled by default)
│   │   └── <provider>-models.json (user-owned models)
│   ├── experimental/    ← settings.json + EMPTY mcp/plugins + lsp.json (disabled)
│   └── minimal/         ← settings.json + EMPTY mcp/plugins + lsp.json (disabled)
├── {{PROVIDER_DIR}}/    ← YOU own the JSON files inside (e.g. <provider>.json)
├── schemas/             ← JSON Schemas used for validation
├── {{SCRIPTS_DIR}}/     ← builder + test harnesses (system-run)
├── {{BACKUP_DIR}}/      ← automatic timestamped backups (system-made)
├── {{GENERATED_ARTIFACT}}            ← GENERATED artifact (never edit)
└── {{GENERATED_ARTIFACT}}.provenance.json  ← GENERATED sidecar (never edit)
```

**The rules:**

- 🔒 **Providers and models are 100% user-owned.** The framework creates the
  providers folder but never writes files inside it.
- 🔑 **No-Secrets Rule (ULTIMATE):** the system's own artifacts (scripts,
  templates, docs, examples) never contain a literal API key — only `{env:VAR}`
  placeholders. User files may contain keys; the user protects them. The system
  copies user content verbatim — it never invents keys.
- 🧬 **mcp.json / plugins.json / lsp.json are user-owned after creation.** The
  system seeds them once from the agent's own main JSON, then never overwrites
  them. LSP is disabled by default (`enabled: false`) until you turn it on.
- 💾 **Backup-first:** before touching anything, the system backs up the previous
  state.
- 🚫 **Never touch `.jsonc` without user consent.**

---

## Documentation

The documentation is split into multiple files.

| Document | Description |
|----------|-------------|
| `AGENT.md` | AI agent entry guide |
| `ARCHITECTURE.md` | Overall system architecture |
| `DESIGN_PRINCIPLES.md` | Core engineering principles |
| `FOLDER_STRUCTURE.md` | Directory and file responsibilities |
| `JSON_SCHEMAS.md` | Configuration file schemas |
| `BUILDER_SPEC.md` | Builder implementation specification |
| `CONTRIBUTING_FOR_AI.md` | AI contribution rules |
| `TESTING.md` | Testing procedures |
| `TROUBLESHOOTING.md` | Common issues and fixes |
| `ROADMAP.md` | Planned future improvements |
| `CHANGELOG.md` | Project version history |
| `PROJECT_STATE.md` | Living state snapshot |
| `ADAPTER.md` | Project-specific facts |
| `LESSONS_LEARNED.md` | Reusable engineering lessons |

---

## Documentation Architecture

The documentation is organized into two layers.

### Layer 1 - Builder Development Framework

Reusable engineering knowledge shared by every builder project.

```
{{DOCS_DIR}}/bdf/
```

This layer contains the engineering process, the blueprint engine, the project adapter concept, the builder evolution workflow, the framework lifecycle, the AI workflow, the project generation workflow, the migration guide, reusable lessons, and documentation templates.

See `{{DOCS_DIR}}/bdf/README.md` for the full overview.

### Layer 2 - Project Documentation

Project-specific documentation. Describes the current implementation only.

The framework stays generic; the project layer holds what is specific to this target.

---

## Releases

Releases follow a single automated workflow:

1. The AI records the release facts in `{{RELEASE_REGISTRY}}`.
2. The user reviews the release facts.
3. The release manager generates all release documentation (`{{RELEASE_MANAGER_SCRIPT}}`).
4. Run the test harness (Release Docs group must pass).
5. Commit.

The registry is the only hand-edited release artifact.

Generated release files are never edited manually.

---

## Current Status

### Implemented

- Configuration management for {{APP_NAME}}
- Provider integration
- Profile-based configuration
- Dynamic profile selection
- Dynamic provider loading
- Automatic configuration builder
- Backup system
- Project documentation

### Not Yet Implemented

The following features are planned but **are not currently part of the project**:

- Additional providers
- Advanced validation
- Extended CLI features

These planned features are documented only in `ROADMAP.md`.

---

## Source of Truth

The project follows a strict source-of-truth policy.

### Source Files

These files are intended to be edited manually.

- Provider definitions
- Profile configuration
- Documentation
- Builder scripts
- `{{RELEASE_REGISTRY}}` (the only hand-edited release artifact)

### Generated Files

Generated files are never edited manually.

Current generated files:

- `{{GENERATED_ARTIFACT}}`
- `CURRENT_RELEASE.md`
- The marker sections in `CHANGELOG.md` and `PROJECT_STATE.md`
- The compatibility rows in `{{DOCS_DIR}}/bdf/VERSION.md`

All changes should always be made to the source files and regenerated using the
builder or the release manager.

---

## Testing

Automated test harnesses keep the system green:

| Harness | Covers | Result |
|---------|--------|--------|
| `{{TEST_HARNESS}}` | Builder + release pipeline | 17/17 ✅ |
| `{{V25_TEST_HARNESS}}` | Active-Provider Selector | 13/13 ✅ |
| `{{V27_TEST_HARNESS}}` | JSON Schema validation + hardening | 40/40 ✅ |

Every builder build must pass the **Alpha → Beta → General Release** gates in
`{{DOCS_DIR}}/bdf/BUILDER_PHASES.md` before it becomes the main builder.

---

## Roadmap

The journey to the destination milestone is tracked in
`{{DOCS_DIR}}/_agent/JOURNEY_TO_V3.md`; planned phases live in `ROADMAP.md`.
Completed phases carry ✅ markers so the current position is always visible.

---

## Project Philosophy

This project follows a few simple principles:

- Keep configuration modular.
- Avoid duplicated configuration.
- Separate implementation from configuration.
- Prefer automation over manual editing.
- Document everything that exists.
- Keep future ideas separate from completed features.

---

## Project Status

The project is currently under active development.

All documentation describes the current implementation only.

Future features are intentionally excluded from the architecture and implementation documents until they are fully designed, implemented, and tested.

Planned work is documented separately in `ROADMAP.md`.

---

**Version:** {{CURRENT_VERSION}}

## Unique Agent Adapters (generic)

A project may combine the universal scaffold with unique bounded adapters,
each with a fixed five-file documentation namespace. Root documents summarize
and link; adapter documents specify.

---

**Document Version:** {{DOC_VERSION}}

Documentation Status: Current Implementation
