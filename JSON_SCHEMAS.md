# JSON Schemas

> Specification of every JSON configuration file used by the OpenCode Configuration Manager.

---

# Purpose

The OpenCode Configuration Manager stores configuration in multiple independent JSON files.

Each JSON file has a single responsibility.

This document describes:

- Purpose
- Location
- Ownership
- Expected structure
- Builder usage

Only the current implementation is documented.

Future JSON files will be added after they are implemented.

---

# Global Rules

Every configuration file follows these rules.

## Encoding

- UTF-8

---

## Format

- JSON Object

---

## Comments

Comments are not permitted.

---

## Trailing Commas

Trailing commas are not permitted.

---

## Ownership

Configuration files are maintained by the developer.

Generated files are maintained by the builder.

---

## Validation

Every configuration file must pass validation before configuration generation begins.

If validation fails, the build process must terminate immediately.

---

# settings.json

## Schema

| Key | Type | Required | Description |
|------|------|----------|-------------|
| $schema | String | No | Schema reference URL. |
| activeProviders | Array<String> | Yes | List of provider identifiers to load. |
| instructions | Array<String> | No | File paths relative to the config root, injected into the agent's system context (for example `AGENTS.md`). |

---

## Example

```json
{
    "$schema": "https://opencode.ai/config.schema.json",
    "activeProviders": [
        "omniroute"
    ],
    "instructions": [
        "AGENTS.md"
    ]
}
```

---

## Validation Rules

- The array must contain at least one provider.
- Provider names must be unique.
- Every provider listed must exist inside the `providers/` directory.
- `instructions` is optional (only present on real profiles, e.g. `coding`); values must be strings.

---

## Builder-Written

`settings.json` is a source file that the builder also writes.

After the user (or `-Provider` / `-NonInteractive`) resolves the active provider list, the builder persists it back to `activeProviders`.

- The current file is backed up to `backup/settings_<profile>_<timestamp>.json` before any rewrite.
- `$schema` is preserved when present.
- Written as UTF-8 without BOM.
- Written only when the resolved list differs from the stored list; a no-op run leaves the file untouched.

---

# models.json

## Schema

| Key | Type | Required | Description |
|------|------|----------|-------------|
| models | Object | Yes | Collection of model definitions. |

---

## Validation Rules

- Model identifiers must be unique.
- Model names must be unique within a models source.
- Every model must contain valid configuration.
- Model resolution per active provider follows this precedence (first source that exists wins):

```
profiles/<profile>/<provider>-models.json   (highest)
providers/<provider>/models.json
inline provider models
models.json (global)
(none)
```

---

# <provider>-models.json

Profile-level provider models.

## Location

```
profiles/<profile>/<provider>-models.json
```

One file per active provider, named after the provider id (for example `omniroute-models.json`).

Optional: the file is loaded only when it exists.

## Schema

Same shape as `models.json`.

| Key | Type | Required | Description |
|------|------|----------|-------------|
| models | Object | Yes | Collection of model definitions. |

Each model entry has the same shape as a `models.json` entry (for example `name`).

## Model entry shape

| Key | Type | Required | Description |
|------|------|----------|-------------|
| name | String | Yes | Display name. |
| variants | Object | No | Named reasoning overlays (see below). |
| reasoning | Boolean | No | Whether the model reasons. |
| temperature | Number | No | Sampling temperature. |
| limit | Number | No | Token limit. |

`variants` is a map of level → settings object. The settings keys follow the
provider's reasoning format (the optional `reasoningFormat` field on the
provider file):

| Reasoning format | Levels | Settings keys |
|------------------|--------|---------------|
| `opencode` (default) | `default`, `minimal`, `high`, `max` | `reasoningEffort` |
| `openai` | `none`, `low`, `medium`, `high`, `xhigh` | `reasoningEffort` |
| `claude` | `low`, `high`, `max` | `thinking.type`, `thinking.budgetTokens` |
| `gemini` | `minimal`, `low`, `medium`, `high` | `thinkingConfig.thinkingBudget` |
| `none` | — | no variants written |

The schema keeps `variants` permissive (`{"type": "object"}`) so new settings
keys never fail older builders; unknown keys pass through unchanged.

## Validation Rules

- Model identifiers must be unique (duplicate keys are rejected).
- Model names must be unique within the file.
- The `models` section is required.
- The file carries the highest precedence: it overrides `providers/<provider>/models.json`, inline provider models, and the global `models.json`.

---

# plugins.json

## Schema

| Key | Type | Required | Description |
|------|------|----------|-------------|
| plugin | Array of strings | Yes | Collection of plugin identifiers. |

---

## Validation Rules

- Plugin identifiers must be unique.
- Invalid plugin configuration causes the build to fail.

---

# mcp.json

## Schema

| Key | Type | Required | Description |
|------|------|----------|-------------|
| mcp | Object | Yes | Collection of MCP server definitions. |

---

## Validation Rules

- MCP identifiers must be unique.
- Invalid MCP configuration causes the build to fail.

---

# lsp.json

## Location

```
profiles/<profile>/lsp.json
```

## Schema

| Key | Type | Required | Description |
|------|------|----------|-------------|
| lsp | Boolean or Object | Yes | Either a plain on/off boolean or an object of LSP server definitions (each may carry optional `command`, `extensions`, `disabled`, `env`, `initialization`). |
| enabled | Boolean | Yes | Master switch; LSP is disabled by default (`false`). |

## Validation Rules

- Disabled by default — the user turns it on (the app's Integrations page toggle or the builder's interactive prompt).
- User-owned after creation (Seed-IfMissing; the framework never overwrites it).
- Validated against `schemas/lsp.schema.json` when present.
- The builder merges it only when `lsp.json` exists.

---

# target.json

Profile-level target artifact; selects the file the builder generates for this profile.

## Location

```
profiles/<profile>/target.json
```

## Schema

| Key | Type | Required | Description |
|------|------|----------|-------------|
| artifact | String | Yes | Generated artifact file name (e.g. `opencode.json`). |

## Validation Rules

- Validated against `schemas/targets.schema.json` when present (`artifact`: string, `additionalProperties: false`).
- Missing, unreadable, or schema-invalid `target.json` falls back to `opencode.json` (backward compatible).
- The builder derives the backup prefix (`<base>_*`), provenance sidecar (`<base>.provenance.json`), WhatIf names, and retention prefix from the artifact base name.
- A future same-architecture profile (e.g. KiloCode) would set its own artifact name — no builder code change required.

---

# omniroute.json

## Schema

| Key | Type | Required | Description |
|------|------|----------|-------------|
| id | String | Yes | Unique provider identifier. |
| provider | Object | Yes | Provider definition. |

---

### provider.omniroute

| Key | Type | Required |
|------|------|----------|
| npm | String | Yes |
| name | String | Yes |
| apiKey | String | Yes |
| options | Object | Yes |
| models | Object | Yes |

The `options` object carries the agent-specific keys; the dual-key contract
(`apiKey` + `options.apiKey`) is documented in `PROVIDER_DEVELOPMENT_GUIDE.md`.

### provider.omniroute.options

| Key | Type | Required | Description |
|------|------|----------|-------------|
| baseURL | String | Yes | The provider endpoint (e.g. `http://localhost:20128/v1`). |
| apiKey | String | Yes | The API key - mirrored from the top-level `apiKey` by the app and the builders (Kilo reads the key from `options.apiKey`; OpenCode from `apiKey`). |

---

## Validation Rules

- `id` must match the provider filename.
- The provider object must contain exactly one root provider.
- The `models` object is populated by the builder during generation.

---

# Source Files vs Generated Files

The following files are considered source files.

| File | Editable |
|------|----------|
| settings.json | Yes |
| models.json | Yes |
| <provider>-models.json | Yes |
| plugins.json | Yes |
| mcp.json | Yes |
| lsp.json | Yes |
| target.json | Yes (optional) |
| omniroute.json | Yes |

`settings.json` is also written by the builder (see the Builder-Written section above): it persists the resolved `activeProviders` list back to the file, with a backup created first.

---

The following file is generated automatically.

| File | Editable |
|------|----------|
| opencode.json | No |

Generated files should never be modified manually.

---

# Validation Rules

Every JSON file must satisfy the following rules.

- Valid JSON syntax.
- UTF-8 encoding.
- Correct root object.
- Required fields must exist.
- No duplicate provider identifiers.
- No duplicate model identifiers.

Validation is performed by the builder before configuration generation.

---

# Current Status

## Implemented

- settings.json
- models.json
- <provider>-models.json
- plugins.json
- mcp.json
- lsp.json
- target.json (P2 dynamic target artifact)
- omniroute.json

## Planned

Additional JSON schemas will only be documented after implementation.

Future configuration formats belong exclusively in `ROADMAP.md`.

Implemented in Builder V2.7.

---

## JSON Schema Files (Builder V2.7)

The eight live schema files live in `schemas/`.

| File | Validates | Required | additionalProperties |
|------|-----------|----------|----------------------|
| `schema.json` | Root shape of the generated `opencode.json` (documentation only; not validated by the builder pipeline) | — | — |
| `settings.schema.json` | `profiles/<profile>/settings.json` | `activeProviders` (array of strings); optional `instructions` (array of strings) | false |
| `provider.schema.json` | `providers/<id>.json` | `id` (string), `provider` (object) | false |
| `models.schema.json` | Covers BOTH `models.json` AND `<provider>-models.json` (profile-level per-provider model files) | `models` (object); model entries require `name` (string) | false |
| `plugins.schema.json` | `profiles/<profile>/plugins.json` | `plugin` (array of strings) | false |
| `mcp.schema.json` | `profiles/<profile>/mcp.json` | `mcp` (object); server entries permissive by design | false at root |
| `lsp.schema.json` | `profiles/<profile>/lsp.json` | `lsp` (boolean or object — permissive), `enabled` (boolean) | false at root |
| `targets.schema.json` | `profiles/<profile>/target.json` | `artifact` (string) | false |

---

## Validation Subset (PS 5.1)

The builder implements schema validation inside the script: Windows PowerShell 5.1 has no `Test-Json -Schema`.

The supported keyword subset:

- `type` (string / number / object / array / boolean / null).
- `required`.
- `properties`.
- `additionalProperties: false`.
- `items`.
- `enum`.
- `$ref` (local same-file references only).

---

# Configuration Relationships

The builder loads configuration in the following order.

```
settings.json

↓

provider

↓

models.json

↓

plugins.json

↓

mcp.json

↓

lsp.json

↓

Generated Configuration
```

Each file contributes one independent section to the final configuration.

No configuration file is responsible for another file's contents.

## Adapter-Owned Schemas

Unique bounded adapters may own schema files under
`app/engine/schemas/` (for example `claude-code-routing.schema.json`).
Adapter schema responsibilities and validation subsets are documented in the
adapter's own BUILDER_SPEC and JSON schema notes under `adapters/<agent>/`.
Generic schema contracts never absorb target-specific fields.

---

**Document Version:** 1.1

**Status:** Current JSON Schemas