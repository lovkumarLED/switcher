# FOLDER_STRUCTURE Template

> Template: directory and file organization. Becomes `FOLDER_STRUCTURE.md`.

---

# Folder Structure

> Directory and file organization of {{PROJECT_NAME}}.

---

# Purpose

{{PROJECT_NAME}} is organized into independent directories, where each directory has a single responsibility.

This separation improves maintainability, readability, and future expansion.

The builder relies on this structure when generating the final configuration.

---

# Root Directory

```
{{PROJECT_ROOT}}/
```

The {{PROJECT_ROOT}} directory is the root of the entire project.

Everything required by the configuration manager exists inside this directory.

---

# Project Structure

```
{{PROJECT_ROOT}}/

├── {{BACKUP_DIR}}/
├── {{DOCS_DIR}}/
├── {{CONFIG_SOURCE_DIR}}/
├── {{PROVIDER_DIR}}/
├── {{SCHEMA_DIR}}/
├── {{SCRIPTS_DIR}}/
├── {{GENERATED_ARTIFACT}}
└── {{PROVENANCE_SIDECAR}}
```

Each directory has a dedicated responsibility.

Tooling directories, package manifests, and lockfiles belong to the project tooling; they are not configuration sources.

---

# {{BACKUP_DIR}}/

```
{{BACKUP_DIR}}/
```

## Purpose

Stores automatically created backups of the generated `{{GENERATED_ARTIFACT}}`.

> **Agent config warning:** do NOT create a `.jsonc` next to the generated
> `{{GENERATED_ARTIFACT}}` - the agent reads the `.jsonc` instead when both
> exist, and the built config silently disappears from its model list.

Before generating a new configuration, the builder creates a timestamped backup of the previous configuration.

This allows recovery if a configuration change introduces errors.

## Example

```
{{BACKUP_DIR}}/

{{GENERATED_ARTIFACT}}_2026-08-02_18-30-45.json
```

## Managed By

Builder

## Manual Editing

Not required.

---

# {{DOCS_DIR}}/

```
{{DOCS_DIR}}/
```

## Purpose

Contains all project documentation.

The documentation explains the project architecture, configuration files, testing procedures, troubleshooting steps, and future roadmap.

Documentation is intended for both humans and AI coding agents.

## Contents

```
README.md

AGENT.md

ARCHITECTURE.md

DESIGN_PRINCIPLES.md

FOLDER_STRUCTURE.md

JSON_SCHEMAS.md

BUILDER_SPEC.md

CONTRIBUTING_FOR_AI.md

TESTING.md

TROUBLESHOOTING.md

ROADMAP.md

CHANGELOG.md

CURRENT_RELEASE.md

PROJECT_STATE.md

release_registry.json

ADAPTER.md

LESSONS_LEARNED.md

AI/

planning/
planning/designs/

_agent/

bdf/
```

## Managed By

Developer

## Manual Editing

Yes.

> Generated working folders (`.superpowers/`, `superpowers/`,
> `.playwright-cli/`, `.playwright-mcp/`, `output/`) are git-ignored
> implementation evidence and never part of the tracked structure. Durable
> design records belong in `planning/designs/`.

---

# {{CONFIG_SOURCE_DIR}}/

```
{{CONFIG_SOURCE_DIR}}/
```

## Purpose

Contains profile-specific configuration.

Profiles define the configuration that will be merged into the final configuration.

The builder selects the profile at invocation time.

```
{{CONFIG_SOURCE_DIR}}/

{{DEFAULT_PROFILE}}/

other-profiles/
```

The `{{DEFAULT_PROFILE}}` profile is the primary profile (settings, per-provider models, plugins, MCP).

Additional profiles carry a settings file, a small per-provider model file, an `lsp.json`, and an optional `target.json`; they contribute their provider selection to the build.

---

## {{DEFAULT_PROFILE}}/

Contains the active configuration.

```
{{DEFAULT_PROFILE}}/

settings.json

<provider>-models.json

plugins.json

mcp.json

lsp.json

target.json (optional)
```

---

### settings.json

Purpose:

General profile configuration.

Contains profile-level settings used by the builder.

The builder also writes the resolved `activeProviders` list back to this file after provider selection (backed up first).

---

### <provider>-models.json

Purpose:

Profile-level model definitions for a single provider.

The file name follows the pattern `<provider>-models.json` (for example `{{CURRENT_PROVIDER}}-models.json`), one file per active provider.

Carries the highest model-source precedence.

Each model entry may carry `variants` — named reasoning overlays in the
provider's reasoning format (`reasoningEffort` for opencode/openai,
`thinking.budgetTokens` for claude, `thinkingConfig.thinkingBudget` for
gemini). See `PROVIDER_DEVELOPMENT_GUIDE.md` § Reasoning formats.

---

### plugins.json

Purpose:

Defines plugins enabled for the profile.

---

### mcp.json

Purpose:

Defines MCP server configuration for the profile.

---

### lsp.json

Purpose:

Defines LSP server configuration for the profile.

Shape: `{ "lsp": <bool|object>, "enabled": <bool> }`. Disabled by default
(`enabled: false`) until the user turns it on. User-owned after creation
(Seed-IfMissing, never overwritten). Validated against
`{{SCHEMA_DIR}}/lsp.schema.json` when present.

---

### target.json (optional, P2)

Purpose:

Names the generated target artifact for this profile (e.g. `{{GENERATED_ARTIFACT}}`).

Falls back to `{{GENERATED_ARTIFACT}}` when missing or invalid.

Drives the output file, backup prefix (`<base>_*`), provenance sidecar (`<base>.provenance.json`), WhatIf names, and retention.

Validated against `{{SCHEMA_DIR}}/targets.schema.json` when present.

---

## Managed By

Developer

## Manual Editing

Yes.

---

# {{PROVIDER_DIR}}/

```
{{PROVIDER_DIR}}/
```

## Purpose

Contains provider definitions.

Each provider describes how the application communicates with an external service.

The current implementation contains a single provider.

```
{{PROVIDER_DIR}}/

{{CURRENT_PROVIDER}}.json
```

---

## {{CURRENT_PROVIDER}}.json

Purpose:

Defines the provider.

Contains:

- provider metadata
- API configuration
- connection settings

Provider definitions are independent from profiles.

## Provider-specific models

Each provider may own provider-specific models:

```
{{PROVIDER_DIR}}/{{CURRENT_PROVIDER}}/models.json
```

When present, these take precedence over inline provider models and the global profile models.

## Managed By

Developer

## Manual Editing

Yes.

---

# {{SCHEMA_DIR}}/

```
{{SCHEMA_DIR}}/
```

## Purpose

Contains the live JSON Schema files used by the builder.

Each schema validates one configuration source before the builder generates `{{GENERATED_ARTIFACT}}`: a missing `{{SCHEMA_DIR}}/` directory produces a warning and the build continues (legacy compatibility).

## Contents

```
{{SCHEMA_DIR}}/

{{SCHEMA_FILE_PATTERN}}
```

The schema files are the machine-readable definitions behind `JSON_SCHEMAS.md`:

- `schema.json` — root shape of the generated `{{GENERATED_ARTIFACT}}` (documentation only; not validated by the builder pipeline).
- `settings.schema.json` — validates settings files.
- `provider.schema.json` — validates provider files.
- `models.schema.json` — covers both `models.json` and `<provider>-models.json` (profile-level per-provider model files).
- `plugins.schema.json` — validates plugin files.
- `mcp.schema.json` — validates MCP files.
- `lsp.schema.json` — validates `lsp.json` (`lsp` boolean|object + `enabled` boolean, both required).
- `targets.schema.json` — validates `target.json` (P2).

A README in the schema directory describes the validation flow and the artifact list.

## Managed By

Developer

## Manual Editing

Yes.

---

# {{SCRIPTS_DIR}}/

```
{{SCRIPTS_DIR}}/
```

## Purpose

Contains automation scripts.

The primary script is the configuration builder.

```
{{BUILDER_SCRIPT}}
```

---

## User-Run vs System-Run

The user only ever runs the BUILDERS directly.

Everything else — test harnesses, the release manager, and scaffold scripts — is system/AI-run machinery.

The scaffolds run once per agent to create the profile structure and seed the user-owned files.

After that, the user edits profiles and providers and runs only the builder.

---

## {{BUILDER_SCRIPT}}

Purpose

Generates the final `{{GENERATED_ARTIFACT}}`.

Responsibilities

- Load and validate configuration files.
- Validate configuration.
- Create backup.
- Merge configuration.
- Generate output and the provenance sidecar.

Supports

- Dynamic profile selection.
- Active-provider discovery and selection with settings persistence.
- Optional profile sections.
- Provider-specific models with profile-level precedence.

The builder never edits source configuration files.

## {{TEST_HARNESS}}

Automated test harness.

Runs the builder against isolated temporary fixtures and verifies both success and failure behavior.

System-run only; exits non-zero when any test fails.

---

## Managed By

Developer

## Manual Editing

Yes.

---

# {{GENERATED_ARTIFACT}}

## Purpose

Generated configuration.

This file is produced automatically by the builder.

The application reads this file during startup.

---

## Important

This file is considered a generated artifact.

It should never be edited manually.

Any configuration changes must be made to the source files.

---

# {{PROVENANCE_SIDECAR}}

The sidecar file follows the pattern `<artifactBase>.provenance.json`.

## Purpose

Generated provenance sidecar for the configuration build.

Written by the builder to the root of the configuration directory, next to `{{GENERATED_ARTIFACT}}`.

Contains:

- builder version
- profile
- active providers
- generated timestamp (UTC)
- SHA-256 of the generated `{{GENERATED_ARTIFACT}}` content

The provenance is written **never into `{{GENERATED_ARTIFACT}}`**: the sidecar keeps the generated configuration consumer-schema safe.

## Managed By

Builder

## Manual Editing

Not required.

---

# Directory Relationships

```
{{CONFIG_SOURCE_DIR}}/

↓

{{PROVIDER_DIR}}/

↓

builder

↓

{{BACKUP_DIR}}/

↓

{{GENERATED_ARTIFACT}}

↓

{{APP_NAME}}
```

---

# Ownership

| Directory | Owner |
|------------|-------|
| {{BACKUP_DIR}} | Builder |
| {{DOCS_DIR}} | Developer |
| {{CONFIG_SOURCE_DIR}} | Developer |
| {{PROVIDER_DIR}} | Developer |
| {{SCHEMA_DIR}} | Developer |
| {{SCRIPTS_DIR}} | Developer |
| {{GENERATED_ARTIFACT}} | Builder |

---

# Editing Rules

## Edit Manually

- {{DOCS_DIR}}/
- {{CONFIG_SOURCE_DIR}}/
- {{PROVIDER_DIR}}/
- {{SCHEMA_DIR}}/
- {{SCRIPTS_DIR}}/

## Do Not Edit

- {{BACKUP_DIR}}/
- {{GENERATED_ARTIFACT}}
- {{PROVENANCE_SIDECAR}}

Generated files should always be recreated by the builder.

---

# Current Status

## Existing

- {{BACKUP_DIR}}/
- {{DOCS_DIR}}/
- {{CONFIG_SOURCE_DIR}}/
- {{PROVIDER_DIR}}/
- {{SCHEMA_DIR}}/
- {{SCRIPTS_DIR}}/
- {{GENERATED_ARTIFACT}}
- {{PROVENANCE_SIDECAR}}

## Planned

Additional directories will only be documented after they are implemented.

Future project ideas are documented exclusively in `ROADMAP.md`.

---

## Unique Agent Adapter Folders (generic)

- `adapters/` - unique bounded adapter documentation namespaces.
- `adapters/<agent>/` - README, ADAPTER, BUILDER_SPEC, TESTING, COMPATIBILITY.
- `app/engine/<agent>/` - packaged unique-adapter implementation, fixtures,
  and harnesses.
- `app/state/` - app-owned runtime state (Git-ignored).

---

**Document Version:** {{DOC_VERSION}}

**Status:** Current Project Structure
