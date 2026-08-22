# Claude Code Model Roles — Multi-Model Routes (Design)

Date: 2026-08-17 (session 48)
Status: **Approved by owner 2026-08-17**; implementing in the same session.
Precedent: Claude adapter lifecycle is **Live validated**; the real-target lock
is open (owner decision, session 48). This feature builds on the corrected
env-only surgical contract (`planning/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md`)
and deliberately extends its managed set.

## 1. Problem

A route today carries exactly one model (`ANTHROPIC_MODEL`, the main session
model). Gateways such as OmniRoute/orcarouter expose several models (e.g.
DeepSeek V4 Flash, DeepSeek V4 Pro, Qwen 3.8 27B) but Claude Code can only
actively run one model at a time via `ANTHROPIC_MODEL`. Claude Code's model
picker supports a set of role aliases (`opus`, `sonnet`, `haiku`, `fable`),
each pinable via an `ANTHROPIC_DEFAULT_<ROLE>_MODEL` environment variable.
Users cannot currently assign models to those roles from the app, and a stale
unmanaged haiku default survives every apply (the reported gemini/gemini-3.5
-flash-lite leftover).

## 2. Goal

Let the user assign additional models to Claude Code's role aliases per route,
and restrict the `/model` picker to the route's models, so switching routes
completely and deterministically re-wires Claude Code's model set. Stale role
models are removed on apply (the leftover-model bug becomes impossible).

## 3. Research basis (official Claude Code docs, 2026-08-17)

- Role aliases: `opus`, `sonnet`, `haiku`, `fable`. Pinned via
  `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`,
  `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_FABLE_MODEL`.
- `opusplan` uses the opus model while Plan Mode is active, sonnet otherwise;
  the haiku alias also drives background functionality. Env values are read at
  startup (restart required after apply — the adapter already shows the notice).
- `ANTHROPIC_CUSTOM_MODEL_OPTION(+_NAME/_DESCRIPTION)` adds one custom row to
  the picker (out of scope for this design).
- `availableModels` (settings.json top-level) restricts which named models are
  selectable; `enforceAvailableModels: true` extends the allowlist to the
  Default option (requires Claude Code >= 2.1.175; ignored before that —
  harmless, enforcement starts after an upgrade).
- Gateway model discovery (`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`)
  populates the picker from the gateway's `/v1/models`; results are still
  filtered by `availableModels`. Coexists with role pins.

## 4. Data model

Each saved route gains:

- `modelRoles`: optional object `{ "opus"?, "sonnet"?, "haiku"?, "fable"? }`,
  each value a non-empty model-ID string (<= 256 chars). At most one model per
  role. Unknown role names rejected.
- `restrictModelPicker`: boolean, default `true`. When true, apply writes
  top-level `availableModels` = [main model + all assigned role models]
  (deduped, order stable) and `enforceAvailableModels` = true. When false,
  both top-level keys are removed.

Route-store stays version 1 (optional fields, backward compatible; existing
routes get `modelRoles: {}` + `restrictModelPicker: true` defaults on read).
The route fingerprint and the derived routing profile gain both fields, so a
role edit changes the applied-route fingerprint.

## 5. Schema

`app/engine/schemas/claude-code-routing.schema.json` gains:

- `modelRoles`: object, `additionalProperties: false`, four optional string
  properties `opus`/`sonnet`/`haiku`/`fable` (non-empty via minLength 1).
- `restrictModelPicker`: boolean (required).
Both added to the profile root (`additionalProperties` stays false).

## 6. Builder core (`claude-routing-core.psm1` 0.2.0 -> 0.3.0)

- `New-SettingsEnvEdits` managed list grows four env fields:
  `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`,
  `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_FABLE_MODEL` —
  Action `set` when the route assigns that role, `remove` when it does not.
- Top-level managed keys: `availableModels` (array literal) and
  `enforceAvailableModels` (boolean literal `true`). A small value-token
  writer is added (`ConvertTo-JsonValueLiteral`) for arrays/booleans; the
  existing layout already records top-level member spans, so insertion,
  replacement, and removal reuse the same surgical mechanics. All writes stay
  byte-surgical (never a full-document regeneration).
- `Get-UnsupportedSnapshot` excludes the two new managed root keys from the
  root snapshot (they are now managed state).
- `Verify-Contract` asserts: each tier env var present with the route's value
  when assigned / absent when not; `availableModels` and
  `enforceAvailableModels` present with the exact derived allowlist when
  `restrictModelPicker` is true / absent when false.

## 7. Adapter (`app/app/claude_adapter.py`)

- `RouteCreateBody` / `RouteEditBody` gain `modelRoles` (dict) and
  `restrictModelPicker` (bool, default true; `extra="forbid"` retained).
- Validation: role names restricted to the four aliases; values non-empty
  strings; existing conflict checks unchanged.
- `_fingerprint` and `_routing_profile` include both fields.
- Route views expose both fields; locked GET behavior unchanged.

## 8. App UI

Route editor gains an "Assign models to Claude roles" section:

- A "+ Add model" button opens a row with a role picker (Opus / Sonnet / Haiku
  / Fable) and a model-ID input. Each role holds at most one model; selecting a
  role already in use replaces its value.
- Rows render as labeled chips ("Use as Opus: deepseek/deepseek-v4-pro") with
  edit/remove.
- A toggle "Restrict the /model picker to this route's models" (default on)
  maps to `restrictModelPicker`.
- The four curated compatibility options, credential field, and the existing
  main-model field are unchanged.

## 9. Testing

- Gate 2 fixture harness: tier set/remove per role, stale-tier removal,
  allowlist set/remove + exact contents, boolean/array value literals,
  byte-preservation outside managed spans, schema rejection of unknown roles.
- Adapter unit tests: body validation, fingerprint changes, routing-profile
  shape, route CRUD round-trip.
- Frontend contract tests: role rows, add/edit/remove, toggle wiring, existing
  suite counts preserved.
- Live re-verify through the now-open lock on the real `settings.json`: apply a
  route with two role models, verify env + allowlist on disk, restore
  byte-for-byte, re-verify the lock stays open.

## 10. Docs

Adapter doc set (README/ADAPTER/BUILDER_SPEC/TESTING/COMPATIBILITY), design
doc §2 managed-set extension note, `JSON_SCHEMAS.md`, release registry,
CHANGELOG, session log, journey tracker. Historical records preserved.

## 11. Out of scope

- `ANTHROPIC_CUSTOM_MODEL_OPTION` custom picker row.
- `CLAUDE_CODE_SUBAGENT_MODEL` subagent model slot.
- `[1m]` extended-context suffixes (accepted verbatim if typed, but not
  validated/explained).
- Changing the env-only surgical philosophy: this extends the managed set, it
  does not reintroduce full-document regeneration.