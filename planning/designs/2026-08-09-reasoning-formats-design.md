# Design: Per-Provider Reasoning Formats (OpenAI / Claude / Gemini level presets)

Date: 2026-08-09
Status: Approved
App: Switcher (BDF app) — `docs/app/`

## Problem

The app hardcodes one set of reasoning levels — `["default", "minimal", "high", "max"]` —
and writes every model variant as `{"reasoningEffort": "<level>"}`. Different providers
speak different reasoning dialects:

- **OpenAI / ChatGPT (GPT-5.x):** valid levels are `none`, `low`, `medium`, `high`,
  `xhigh` (ChatGPT app shows Light / Medium / High / Extra High). `max` is NOT valid on
  GPT-5.5 and earlier — only on GPT-5.6 via the Responses API. A user's CLI Proxy
  (OpenAI-compatible) rejected the app's `max` variant with:
  `level "max" not supported, valid levels: low, medium, high, xhigh`.
- **Claude:** no effort levels — a token budget:
  `thinking: { "type": "enabled", "budgetTokens": <number> }` (camelCase, AI-SDK style,
  because variants are opencode `settings` overlays).
- **Gemini:** `thinkingConfig: { "thinkingBudget": <number> }`.
- **DeepSeek and others:** no effort parameter at all.

Because the level names are hardcoded, users cannot express valid reasoning configs for
non-OpenCode providers, and the app actively writes invalid variants (`max` for GPT-5.5).

## Research findings (source-verified)

| Provider | Valid levels | Request JSON (via opencode settings overlay) |
|---|---|---|
| OpenAI GPT-5.5 / 5.4 / 5.6 | `none`, `low`, `medium`, `high`, `xhigh` (`max` only gpt-5.6, Responses API) | `reasoningEffort: "<level>"` |
| Claude | budget tokens (low 8k / high 16k / max 32k) | `thinking: { type: "enabled", budgetTokens: N }` |
| Gemini 2.5 / 3.x | `minimal`, `low`, `medium`, `high` (2.5: budget only) | `thinkingConfig: { thinkingBudget: N }` |
| OpenCode built-ins | per provider; generic = `default/minimal/high/max` | `reasoningEffort: "<level>"` |

Source notes: OpenAI reasoning guide (`reasoning.effort` values include `none`, `minimal`,
`low`, `medium`, `high`, `xhigh`, `max`, model-dependent); GPT-5 model page (gpt-5 supports
`minimal/low/medium/high`); GPT-5.5/5.6 guidance (low/medium/high/xhigh; `max` = gpt-5.6 +
Responses API only); Anthropic extended-thinking docs (`thinking.type: "enabled"` +
`budget_tokens`, deprecated in favor of `adaptive` on newest models — camelCase
`budgetTokens` for AI-SDK settings); Gemini thinking docs (`thinkingBudget`, `thinkingLevel`,
0 = off, -1 = dynamic); opencode models docs (variants = named settings overlays; settings
keys like `reasoningEffort`, `thinkingConfig`).

## Goals

- Users can choose a reasoning format per provider and add models with that provider's
  valid reasoning levels.
- The app writes the correct variant JSON per format.
- Existing providers keep working unchanged (default format = `opencode`).
- Fix the real-world failure: GPT-5.x models must not get `max`.

## Non-goals

- No custom/user-defined formats (presets only).
- No per-model format override (per provider only).
- No auto-rewrite of existing variants on format switch (only the next Save rewrites).

## Decisions (from user Q&A)

1. Format is chosen **per provider**.
2. **Presets only** — no custom JSON editor.
3. Existing providers **default to `opencode`** (current behavior) until the user picks
   another format.

## Presets

| id | Label | Levels (chips) | Variant JSON per level |
|---|---|---|---|
| `opencode` | OpenCode (default) | default, minimal, high, max | `{ "reasoningEffort": "<level>" }` |
| `openai` | OpenAI / ChatGPT | none, low, medium, high, xhigh | `{ "reasoningEffort": "<level>" }` |
| `claude` | Claude | low, high, max | `{ "thinking": { "type": "enabled", "budgetTokens": <budget> } }` — low=8000, high=16000, max=32000 |
| `gemini` | Gemini | minimal, low, medium, high | `{ "thinkingConfig": { "thinkingBudget": <budget> } }` — minimal=4096, low=8192, medium=16384, high=32768 |
| `none` | No reasoning | (no chips) | no variants written |

## Data model

- `providers/<id>.json` gains an optional `"reasoningFormat": "<format-id>"` field on the
  provider inner object (sibling of `name`, `npm`, `models`). Absent = `opencode`.
  Unknown/removed format ids fall back to `opencode` at read time.
- Model files (`<provider>-models.json`) keep their existing shape
  (`models.<modelId>.variants.<level>.<settings>`). The builder passes `variants` through
  untouched, so no builder changes are required.
- The app never stores the format in the models file — the provider file is the source of
  truth, so backups and the builder stay consistent.

## API changes (`app/providers.py` + `app/agentstore.py`)

- `GET /api/formats` → `{ "formats": [ { "id", "label", "levels": [...] }, ... ] }`.
- `GET /api/providers` → each provider payload includes `reasoningFormat` (resolved,
  default `opencode`).
- `POST /api/providers` and `PUT /api/providers/<id>` accept optional
  `reasoningFormat` (validated against known ids; invalid → 400).
- `PUT /api/providers/<id>` with `models`: backend resolves the provider's current format
  and writes each model's variants from `thinking` levels using that format's templates.
  Levels not in the format are ignored (dropped).
- `GET /api/providers` model rows: `thinking` list = variant keys filtered to the
  provider's format levels (so stale/invalid levels are not shown as checked chips).

Implementation shape: `agentstore.py` owns a `REASONING_FORMATS` dict
(`id → { label, levels, template(level) → settings dict }`) plus `write_models(..., format)`
and `read_models(..., format)`; `providers.py` exposes it over the API. Backend-owned
presets keep one source of truth and let the backend validate.

## UI changes (`gui.html`)

- **Add/Edit provider modal:**
  - New "Reasoning format" dropdown (`#fFormat`), populated from `GET /api/formats`.
  - Auto-picked from the preset when the preset changes: OpenAI / CLI Proxy → `openai`,
    Google (Gemini) → `gemini`, everything else → `opencode`. Still editable manually.
  - Model row chips render from the selected format's levels.
- **Models card:** when a provider is selected, its format's chips are shown. Changing the
  format dropdown (new "Reasoning format" selector next to the provider selector) changes
  the chips immediately.
- **Save semantics:** saving always rebuilds `variants` from the checked levels using the
  format's templates. Unchecked/unsupported levels are removed from the file on save —
  this is how an existing invalid `max` on a GPT-5.x model gets fixed (set format to
  `openai`, check low/medium/high/xhigh, save).
- `none` format: no chips rendered, no variants written, existing variants left alone
  unless the models are edited and saved.

## Edge cases

- Format switch alone never rewrites files; only a models Save does.
- Provider file with unknown `reasoningFormat` → treated as `opencode`.
- `read_models` returns `thinking` filtered to the format's levels so the UI never shows
  unsupported chips as checked.
- Backups: every write stays backup-first (unchanged behavior).

## Testing

- **Unit (`app/tests/`):** `write_models` per format — openai writes `reasoningEffort`
  with exact levels; claude writes `thinking.budgetTokens` with 8000/16000/32000; gemini
  writes `thinkingConfig.thinkingBudget`; `none` writes no variants; unknown level dropped.
  `read_models` filtering; invalid `reasoningFormat` → 400 on create/update.
- **API:** `GET /api/formats` shape; provider payload carries `reasoningFormat`.
- **Manual UI:** add CLI Proxy with format `openai` + gpt-5.6-luna with
  low/medium/high/xhigh → saved file matches the reference example; Models card chips
  follow format; save drops `max`.

## Framework (BDF) updates

The app and the framework stay in sync — the same reasoning formats must work through
the builder pipeline and be documented in the framework docs.

Findings: no functional builder changes are required. `provider.schema.json` only
constrains `id` + `provider` (object) at the top level, so a `reasoningFormat` field
inside `provider.<id>` passes validation. `models.schema.json` declares
`variants: { "type": "object" }` (free-form), so `thinking.budgetTokens` and
`thinkingConfig.thinkingBudget` shapes already validate. The builder merges provider and
model entries wholesale (`build-opencode-v2.7.ps1` ~lines 853-871), so variant settings
pass through untouched.

Work items:

- **Schemas** (`schemas/*.json`): no structural changes. Optionally extend
  `models.schema.json` `variants` to document the accepted settings keys
  (`reasoningEffort`, `thinking.budgetTokens`, `thinkingConfig.thinkingBudget`) — keep
  `additionalProperties` permissive so new formats never fail old builders.
- **Builder test harness** (`scripts/test-opencode-v2.7.ps1`): add a test with fixtures
  proving claude-style (`thinking.budgetTokens`) and gemini-style
  (`thinkingConfig.thinkingBudget`) variant files pass validation and merge into the
  built config correctly.
- **Framework docs** (docs repo): update `BUILDER_SPEC.md`, `JSON_SCHEMAS.md`,
  `FOLDER_STRUCTURE.md`, `ADAPTER.md`, `PROVIDER_DEVELOPMENT_GUIDE.md`,
  `ARCHITECTURE.md`, `TESTING.md` — document the `reasoningFormat` field on provider
  files, the preset table (opencode/openai/claude/gemini/none), the per-format variant
  JSON shapes, and that `<provider>-models.json` may carry any of these shapes.
- **App docs** (`app/README.md`, `app/rule.md`): same concept, GUI-facing.

## Files touched

- `app/app/agentstore.py` — formats registry + template-aware read/write models
- `app/app/providers.py` — `/api/formats`, format in payloads, validation
- `app/gui.html` — format dropdown (modal + Models card), chip rendering, preset mapping
- `app/tests/test_agentstore.py` — new format tests
- `app/README.md` + `app/rule.md` — document the feature
- `app/BUGFIXES.md` — log the max-on-GPT-5.x fix (root cause: hardcoded level set)
- `scripts/test-opencode-v2.7.ps1` — format-aware variant fixtures test (framework)
- `schemas/models.schema.json` — document accepted variant settings keys (framework)
- Docs: `BUILDER_SPEC.md`, `JSON_SCHEMAS.md`, `FOLDER_STRUCTURE.md`, `ADAPTER.md`,
  `PROVIDER_DEVELOPMENT_GUIDE.md`, `ARCHITECTURE.md`, `TESTING.md` (framework docs)
