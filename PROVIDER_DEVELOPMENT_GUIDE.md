# PROVIDER DEVELOPMENT GUIDE

> How to create and manage provider definitions — the user-owned files the
> framework never writes.

---

# Purpose

Providers are **100% user-owned**. The framework creates the `providers/`
folder (like the profile folders), but it NEVER writes provider or model files
inside it. This guide explains how to create them yourself.

---

# Audience

Anyone configuring a builder project for a new provider (OpenCode, KiloCode, or
any open-source coding agent).

---

# The Provider Contract

- The framework scans the agent's main JSON and detects the provider section
  (guidance only).
- You create `providers/<id>.json` yourself.
- **The dual-key contract:** different agents read the API key from different
  fields — **OpenCode** reads `provider.<id>.apiKey`, **Kilo** reads
  `provider.<id>.options.apiKey`. Write the key in **both** places (see the
  example below). If you write only one, the builder **mirrors it
  automatically** at merge time ("Dual-key: options.apiKey mirrored from
  apiKey." in the build log) — so hand-written provider files and app-written
  files produce identical output. There are no ups and downs between using
  the app and using the builder directly.
- Models can live:
  1. inline in the provider file (`models`),
  2. in `providers/<id>/models.json`,
  3. in `profiles/<profile>/<id>-models.json` (highest precedence).

---

# Creating a Provider File

## 1. Choose an ID

The provider id is the file name. Example: `omniroute` → `providers/omniroute.json`.
IDs are slugified lowercase `[a-z0-9-]`; Windows reserved names
(`con`, `nul`, `aux`, `com1-9`, `lpt1-9`) are rejected.

## 2. Create the file

Minimal shape (dual key: `apiKey` for OpenCode, `options.apiKey` for Kilo):

```json
{
  "id": "omniroute",
  "provider": {
    "omniroute": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OmniRoute",
      "apiKey": "{env:OMNIROUTE_API_KEY_OPENCODE}",
      "options": {
        "baseURL": "http://localhost:20128/v1",
        "apiKey": "{env:OMNIROUTE_API_KEY_OPENCODE}"
      },
      "models": {}
    }
  }
}
```

Real providers work identically: `baseURL` is the provider's endpoint
(TokenRouter, Modal, OpenAI, OpenRouter, ...), `npm` is the SDK package, and
the key is the provider's API key (for Modal, the combined proxy token
`wk-<id>.ws-<secret>`). Built-in presets include Google Gemini and
NVIDIA NIM; the SDK package auto-fills from `@ai-sdk/*`; and the built-in
Test connection endpoint verifies credentials against the provider.

## 3. Add models (optional)

Inline:

```json
"models": {
  "opencode-zen/deepseek-v4-flash-free": {
    "name": "DeepSeek V4 Flash (FREE VIA ZEN)"
  }
}
```

Or profile-level (highest precedence) — `profiles/<profile>/<id>-models.json`:

```json
{
  "models": {
    "opencode-zen/deepseek-v4-flash-free": {
      "name": "DeepSeek V4 Flash (FREE VIA ZEN)",
      "variants": {
        "high": { "reasoningEffort": "high" },
        "max": { "reasoningEffort": "max" }
      }
    }
  }
}
```

## 4. Reasoning formats (optional)

Different providers accept different reasoning settings. The provider file can
carry an optional `reasoningFormat` field; the builder passes it through, and
the app uses it to offer the right levels and write the right variant JSON.

| Format | Valid levels | Variant JSON per level |
|--------|--------------|------------------------|
| `opencode` (default) | `default`, `minimal`, `high`, `max` | `{ "reasoningEffort": "<level>" }` |
| `openai` | `none`, `low`, `medium`, `high`, `xhigh` | `{ "reasoningEffort": "<level>" }` |
| `claude` | `low`, `high`, `max` | `{ "thinking": { "type": "enabled", "budgetTokens": 8000 / 16000 / 32000 } }` |
| `gemini` | `minimal`, `low`, `medium`, `high` | `{ "thinkingConfig": { "thinkingBudget": 4096 / 8192 / 16384 / 32768 } }` |
| `none` | — | no variants written |

Example provider file with a format:

```json
{
  "id": "cliproxy",
  "provider": {
    "cliproxy": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "CLI Proxy",
      "reasoningFormat": "openai",
      "options": {
        "baseURL": "http://localhost:8317/v1",
        "apiKey": "{env:CLIPROXY_API_KEY}"
      },
      "models": {}
    }
  }
}
```

Claude-style variants (written for a `claude` format provider):

```json
{
  "models": {
    "claude-sonnet-4": {
      "name": "Claude Sonnet 4",
      "variants": {
        "low":  { "thinking": { "type": "enabled", "budgetTokens": 8000 } },
        "high": { "thinking": { "type": "enabled", "budgetTokens": 16000 } },
        "max":  { "thinking": { "type": "enabled", "budgetTokens": 32000 } }
      }
    }
  }
}
```

Gemini-style variants (written for a `gemini` format provider):

```json
{
  "models": {
    "gemini-3.6-flash": {
      "name": "Gemini 3.6 Flash",
      "variants": {
        "minimal": { "thinkingConfig": { "thinkingBudget": 4096 } },
        "medium":  { "thinkingConfig": { "thinkingBudget": 16384 } },
        "high":    { "thinkingConfig": { "thinkingBudget": 32768 } }
      }
    }
  }
}
```

An unknown or missing `reasoningFormat` is treated as `opencode`. Levels that
are not valid for the provider's format are dropped when the app writes the
models file (e.g. `max` is not valid for OpenAI GPT-5.x — the app refuses to
write it for `openai` format providers). Interactive builder runs ask the
developer for the format when it is missing or invalid levels are present,
persist it to the provider file (backup-first), and filter the generated
output the same way.

---

# API Keys — The No-Secrets Rule (ULTIMATE)

- Your provider files **may** contain literal API keys — they are your files
  and you protect them.
- The **system's own artifacts** (scripts, templates, docs, examples) NEVER
  contain literal keys — only `{env:VAR}` placeholders.
- The system **copies your content verbatim** (scan → copy → paste). It never
  invents, carries, or restores keys.

Recommended pattern (works everywhere, never leaks into system artifacts):

```json
"apiKey": "{env:OMNIROUTE_API_KEY_OPENCODE}"
```

The `{env:VAR}` placeholder is resolved from the environment at runtime.

---

# Precedence

Model-source precedence (highest first):

```
profiles/<profile>/<id>-models.json
providers/<id>/models.json
inline provider models
profiles/<profile>/models.json
```

---

# How the Builder Uses Providers

The builder (e.g. `app\engine\build-opencode-v2.7.ps1`):

1. Discovers all `providers/*.json`.
2. Resolves active providers from `profiles/<profile>/settings.json` →
   `activeProviders`.
3. Loads each active provider + its models.
4. **Normalizes the dual key** (mirrors `apiKey` → `options.apiKey` when
   missing) so the merged output works in OpenCode AND Kilo.
5. Merges them into the generated artifact.

If a provider has **no models source**, the builder drops it with a warning
(not considered active). If no active provider remains, the build aborts.

> **Agent config warning:** the builders generate `opencode.json` (OpenCode)
> / `kilo.json` (Kilo). Do NOT create `opencode.jsonc` next to
> `opencode.json` — OpenCode reads the `.jsonc` *instead of* the `.json` when
> both exist, and your built config silently disappears from `/models`.
> Generating both formats is planned for a future update — not right now.

---

# Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| `No provider files found in <root>\providers` | No `providers/*.json` exists — create one. |
| `Provider 'x': models not found` | Add a models source (inline, folder, or profile-level). |
| `No active providers selected` | Every active provider was dropped (no models) or settings lists none. |
| Schema validation fails | Run `-Doctor` and check the schema message (`provider.schema.json`). |
| Agent says "401 / no token / missing key" | Provider file has `apiKey` only and the agent reads `options.apiKey` — rebuild (the builder mirrors it), then **restart the agent** (it caches config). |
| Provider missing from OpenCode `/models` | A `opencode.jsonc` is shadowing the built `opencode.json` (see the warning above) — move the `.jsonc` away and restart. |

---

**Document Version:** 1.1

**Status:** Active Provider Development Guide
