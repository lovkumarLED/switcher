# PROFILE CREATION GUIDE

> How to create, edit, and understand profiles in a BDF builder project.

---

# Purpose

Profiles are the heart of the configuration system. Each profile is a folder
under `profiles/` that contributes settings, MCP servers, and plugins to the
generated artifact.

This guide explains the default profiles, the file contract, and how to create
new ones.

---

# The Default Profiles

The framework ALWAYS creates three profiles:

```
profiles/

coding/          ← the MAIN profile (always)
experimental/
minimal/
```

Each profile carries exactly four files:

```
profiles/<profile>/

settings.json
mcp.json
plugins.json
lsp.json
```

## coding — the main profile

- `settings.json` — `$schema` + `activeProviders` (framework-writable).
- `mcp.json` — seeded once from the agent's own main JSON; **user-owned after**.
- `plugins.json` — seeded once from the agent's own main JSON; **user-owned after**.
- `lsp.json` — seeded from the main config's `lsp` value; **user-owned after**.
  Disabled by default (`enabled: false`) until you turn it on.
- May also carry `<provider>-models.json` (user-owned models, highest precedence).

## experimental / minimal

- `settings.json` — written by the framework.
- `mcp.json` — created EMPTY, never filled by the framework.
- `plugins.json` — created EMPTY, never filled by the framework.
- `lsp.json` — created with the default `{ "lsp": true, "enabled": false }`.

---

# The File Contract

## settings.json

The only file the framework writes freely.

```json
{
  "$schema": "https://opencode.ai/config.schema.json",
  "activeProviders": ["omniroute"]
}
```

- Missing file → created with `$schema` + `activeProviders`.
- Existing file → the framework only adds `$schema`/`activeProviders` if
  missing; it NEVER clobbers your keys.
- You may add anything else the agent supports (model, agent, permission, ...).

## mcp.json

```json
{
  "mcp": {
    "server-name": {
      "type": "local",
      "command": ["npx", "-y", "some-mcp-server"]
    }
  }
}
```

User-owned after creation. The framework never overwrites it.

## plugins.json

```json
{
  "plugin": ["some-plugin"]
}
```

User-owned after creation. The framework never overwrites it.

## lsp.json

```json
{
  "lsp": true,
  "enabled": false
}
```

- `lsp` — either a plain on/off boolean or an object keyed by server name (each
  server may carry optional `command`, `extensions`, `disabled`, `env`,
  `initialization`). Copied verbatim into the generated config as the `lsp` key
  when enabled.
- `enabled` — the LSP master switch. **Disabled by default**; the user turns it
  on (the app's Integrations page toggle or the builder's interactive prompt).
- User-owned after creation. The framework never overwrites it.
- Builder behavior: `enabled: true` → generated config carries `"lsp": <value>`;
  `enabled: false` → generated config carries `"lsp": false`; no `lsp.json` → no
  `lsp` key. The interactive prompt asks "LSP servers: [1] enabled [2] disabled
  (Enter keeps current)" when not `-NonInteractive`; the app and
  `-NonInteractive` runs use the stored `enabled` value.

---

# Creating a New Profile

1. Create the folder: `profiles/<name>/`.
2. Create `settings.json` (or let the framework create it).
3. Create `mcp.json`, `plugins.json`, and `lsp.json` (empty is fine; you fill
   them).
4. Add provider models if the profile needs them:
   `profiles/<name>/<provider>-models.json`.
5. Build with: `-Profile <name>`.

Example — a "gaming" profile:

```
profiles/gaming/
├── settings.json
├── mcp.json
├── plugins.json
├── lsp.json
└── omniroute-models.json
```

```powershell
.\app\engine\build-opencode-v2.7.ps1 -Profile gaming
```

---

# Profile Selection

The builder selects the profile at invocation time:

```powershell
.\app\engine\build-opencode-v2.7.ps1 -Profile <name> [-NonInteractive]
```

Active providers are read from `settings.json` → `activeProviders`.
Profiles can also be switched inside the Switcher app (Settings → Change profile); the default model profile constant is `coding`.

---

# Rules

- `coding` is ALWAYS the main profile — never delete or rename it.
- The generated main config must never be shadowed by a `.jsonc` of the same
  name — OpenCode reads the `.jsonc` *instead of* the `.json` when both exist,
  and the built config silently disappears from `/models`.
- mcp.json / plugins.json / lsp.json are user-owned after creation — the
  framework never overwrites them.
- The user may add more profiles or edit any file at any time.
- `target.json` (optional, P2) can change the generated artifact name per
  profile:

```json
{ "artifact": "my-custom.json" }
```

---

# Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| `No active providers selected` | `activeProviders` empty or all providers dropped (no models). |
| MCPs missing from output | Profile mcp.json empty / not filled yet — the framework never fills it. |
| Custom artifact ignored | `target.json` invalid — falls back to the default artifact. |

---

**Document Version:** 1.0

**Status:** Active Profile Creation Guide
