# LSP Support in BDF Builders + Switcher App (OpenCode + KiloCode)

Status: **Approved design, not implemented**  
Approved by user: 2026-08-17 (session 46)  
Scope: OpenCode + KiloCode only. Claude Code is COMPLETELY untouched (different architecture — routing adapter, not a builder).

## 1. Problem

A developer can set `lsp` in their main agent config (`opencode.json` → `"lsp": true` or an object keyed by server name), but when the BDF builder regenerates the main JSON, the `lsp` section is **silently dropped** — the builders only know `$schema` / `provider` / `plugin` / `mcp`. KiloCode has the same gap.

The owner wants:
1. The BDF **framework** to preserve LSP: scaffold seeds it, builder asks (interactive 1/2 prompt) or reads the stored toggle, and emits `lsp` into the generated main JSON when enabled.
2. The **app** to manage LSP like plugins/MCP: a new **LSP block on the Integrations page** (between Plugins and MCP servers) with an **on/off toggle** that controls whether the generated JSON includes `lsp`.

## 2. Data model

### New profile file: `profiles/coding/lsp.json`

Exactly parallel to `mcp.json` and `plugins.json`:

```json
{
  "lsp": true,
  "enabled": true
}
```

- `lsp` — the value copied verbatim into the generated main JSON as the `lsp` key. OpenCode accepts `true` (enable built-ins), `false` (explicitly disable), or an object keyed by server name (`{ "typescript": { "command": [...], "extensions": [...], "disabled": false, "env": {...}, "initialization": {...} } }`). KiloCode config passes the value through unchanged.
- `enabled` — the app's toggle state. `true` → builder emits `lsp`; `false` → builder omits `lsp`. The `lsp` value is preserved when toggled off, so no user config is ever lost.

The file is user-owned after creation (V3 rule 6 — same as mcp.json/plugins.json): the framework never overwrites it.

### Validation

New `lsp.schema.json` next to `mcp.schema.json` / `plugins.schema.json` (builder checks it when `lsp.json` exists):

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "title": "LSP Configuration",
  "type": "object",
  "properties": {
    "lsp": { "type": ["boolean", "object"] },
    "enabled": { "type": "boolean" }
  },
  "required": ["lsp", "enabled"]
}
```

`lsp` as an object is loosely validated (any server-name → object with optional `command`/`extensions`/`disabled`/`env`/`initialization`), mirroring how `mcp` is treated (opaque object).

## 3. Framework changes (BDF engine)

### 3.1 `scaffold-agent.ps1` — split + seed

In the scan loop (currently reads `Main.mcp`, `Main.plugin`, `Main.provider`), also read `Main.lsp`:

- If the main config has a top-level `lsp` property, seed `profiles/coding/lsp.json` with `{ "lsp": <value>, "enabled": false }`.
- If the main config has no `lsp`, seed `{ "lsp": true, "enabled": false }` (OpenCode default; harmless pass-through for KiloCode).
- `experimental` / `minimal` profiles: create default `lsp.json` — never filled (same rule as mcp/plugins).
- **LSP is DISABLED BY DEFAULT in every profile** (owner directive, session 46): every seeded `lsp.json` carries `enabled: false` until the user turns LSP on in the app's Integrations page and runs the builder.
- `Seed-IfMissing` semantics: never overwrite an existing user-owned lsp.json.

### 3.2 Builders — `build-opencode-v2.7.ps1` + `build-kilo-v1.ps1` (identical change in both)

1. **Prompt (interactive only):** after the profile is loaded (alongside the existing reasoning-format prompt), ask:

   ```
   LSP servers: [1] enabled  [2] disabled  (Enter keeps current)
   ```

   - `1` → `enabled = true`; `2` → `enabled = false`; Enter → keep stored value.
   - Prompt is skipped when `-NonInteractive` (uses stored `enabled` — this is what the app and the harness use).
   - After a change, persist the toggle back to `lsp.json` (backup-first, same writer pattern as the settings `activeProviders` update).

2. **Merge:** add `Merge-Lsp` — reads `lsp.json`, returns the `lsp` value when `enabled` is true, else `$null`.

3. **Final assembly:** `Merge-Final` gains `if ($Lsp) { $Final.lsp = $Lsp }` (after `plugin`, before/after `mcp` — order: `$schema`, `provider`, `plugin`, `lsp`, `mcp`; exact key order in the JSON does not matter to either runtime).

4. **Verification:** if `lsp.json` exists with `enabled=true` and a non-false `lsp` value, the generated config must contain a top-level `lsp` key. If `enabled=false`, the generated config must NOT contain `lsp`.

5. **Diff summary:** add LSP to the diff lines ("Added/Removed LSP servers") when the toggle or value changes between prior and current builds (optional, mirrors mcp/plugin diff).

6. **Pre-flight dependency check:** require `lsp.schema.json` when `lsp.json` exists (same as plugins/mcp).

7. **Doctor:** report lsp.json presence + enabled state.

### 3.3 Harness tests — `test-opencode-v2.7.ps1` + `test-kilo-v1.ps1`

New tests (identical in both harnesses, ~4 each):

- T1: `lsp.json` with `{ "lsp": true, "enabled": true }` → generated main JSON contains `"lsp": true`.
- T2: `lsp.json` with `{ "lsp": {...}, "enabled": true }` → generated JSON contains the exact object.
- T3: `enabled: false` (any value) → generated JSON has NO `lsp` key.
- T4: no `lsp.json` → generated JSON has NO `lsp` key (no regression for existing configs).
- T5 (opencode only): object form round-trips with `command`/`extensions`/`env`/`initialization`.

## 4. App changes (Switcher)

### 4.1 Backend — `app/agentstore.py` + new `app/lsp.py`

Agentstore functions (mirror `read_plugins`/`read_mcp`):

- `lsp_file(agent_dir, profile=MODEL_PROFILE)` → `profiles/coding/lsp.json`
- `read_lsp(agent_dir, profile=MODEL_PROFILE)` → `{ "lsp": <value or true>, "enabled": true }` (defaults when file missing)
- `write_lsp(agent_dir, value, enabled, profile=MODEL_PROFILE)` → backup-first write of `{ "lsp": value, "enabled": enabled }`

New `app/lsp.py` router (`/api/lsp`), registered in `server.py`:

- `GET /api/lsp` → `{ "lsp": <value>, "enabled": <bool> }`
- `PUT /api/lsp` body `{ "lsp": <bool|object>, "enabled": <bool> }` → validates + writes, returns updated state

### 4.2 Frontend — Integrations page

- New **LSP block** on the Integrations page between the Plugins block and the MCP servers block, styled with the same card/chip components.
- Contents:
  - Title "LSP servers" + a note line ("Controls whether LSP servers are included when building your agent config.")
  - **On/off toggle** (same switch component family as the app's other toggles) bound to `enabled`.
  - When on, show the current `lsp` value: `true` renders as "Built-in servers enabled"; an object renders as chips per server name; a small "Edit JSON" affordance (same expert-JSON pattern as the MCP dialog) lets the user supply an object.
  - Toggle change → `PUT /api/lsp` immediately (app-owned state, no build needed).
- Build button on the same page already calls `/api/build`; the builder reads `lsp.json` → generated JSON reflects the toggle.
- Claude mode: Integrations page hidden (existing behavior — Claude is a separate page), so no Claude exposure.

### 4.3 App tests

- Python: `test_lsp.py` — read defaults, write round-trip, backup-first, toggle-safe preservation, validation (reject non-bool/object `lsp`? accept `true/false/object`), route GET/PUT contract.
- Frontend: `lsp_contract.test.mjs` (or extend `integrations_visual_contract.test.mjs`) — LSP block present between plugins and MCP, toggle bound, chips for object form, edit-JSON dialog wired.

## 5. Behavior contract (both framework and app)

| State | Builder output |
| --- | --- |
| `enabled: true`, `lsp: true` | generated JSON has `"lsp": true` |
| `enabled: true`, `lsp: { ... }` | generated JSON has the exact object |
| `enabled: false` (any `lsp`) | generated JSON has NO `lsp` key |
| no `lsp.json` | generated JSON has NO `lsp` key |

Claude Code: zero changes — no profile file, no builder change, no app block, no schema.

## 6. Testing plan

1. Engine harnesses: opencode V2.7 (35 → ~39) + kilo K1 (32 → ~36), exit 0.
2. Full app Python suite (209 + new lsp tests), focused adapter/capabilities unaffected.
3. Frontend contract suites + full frontend.
4. Gate 2 65/65 + Gate 3 OVERALL PASS (unchanged — Claude untouched, must still pass to prove no regression).
5. Live on real configs: snapshot → scaffold-reseed lsp.json → build opencode + kilo with LSP enabled → verify `lsp` in output → toggle off via app → rebuild → verify absent → restore byte-identical.
6. `git diff --check`, secrets scan, locks closed.

## 7. Non-goals

- No Claude Code changes of any kind.
- No LSP server installation/management — the framework/app only carry the config value (same as plugins: "stores the identifier, does not install, run, or monitor").
- No multi-server CRUD UI for now — single toggle + value (boolean or object via expert JSON).
- No changes to providers/models/settings pipelines.
