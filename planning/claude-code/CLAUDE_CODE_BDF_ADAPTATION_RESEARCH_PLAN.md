# Claude Code BDF Adaptation Research Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` when implementation begins. This document is research-backed scope and an execution plan; it does not authorize edits to a user’s Claude installation.

**Goal:** Add Claude Code as a safely bounded BDF target without treating Claude’s state, marketplace, plugin, MCP, or credential databases as generated configuration.

**Architecture:** Keep Claude as a separate adapter. The adapter reads and preserves unknown data, makes backup-first atomic patches only to the supported user/project `settings.json` scope, and exposes provider/model switching as a scalar Claude routing profile rather than an OpenCode/Kilo-style provider registry. `~/.claude.json`, plugin caches, marketplaces, skills, MCP state, OAuth/session data, and transcripts remain Claude-owned and outside generated BDF output.

**Tech Stack:** Existing BDF PowerShell builders and JSON schemas; Switcher’s FastAPI discovery/scaffold/build API; Windows `%USERPROFILE%` paths; JSON-only edits with atomic replacement and backup manifests.

## Required orchestration policy

Sol is the orchestrator for this project. Sol coordinates work, decomposes
tasks, chooses the worker, writes handoff documents, checks results, and reports
status. Sol must not write code, edit project files, run implementation
commands, or claim that a feature is complete. Every implementation task is
performed by a worker model.

### Worker selection

| Situation | Worker | Effort |
|---|---|---|
| Small isolated change or focused investigation | DeepSeek V4 Flash | Max by default |
| Main implementation, refactor, tests, or documentation | DeepSeek V4 Flash | Max |
| Specialized review, difficult debugging, or second opinion | Luna | High, X-high, or Max |
| Genuinely hard or very large task after decomposition | Terra | Highest practical effort only when needed |

DeepSeek V4 Flash is the default implementation worker. Luna is added only when
the task benefits from an independent specialist or difficult reasoning pass.
Terra is reserved for genuinely hard or very large work and is not the routine
worker. Independent tasks may run in parallel; shared files or state must be
handled sequentially.

### Handoff rules

- Every non-trivial task gets a Markdown handoff before implementation.
- The handoff states the goal, exact files or folders, constraints, acceptance
  criteria, verification commands, rollback requirements, assigned worker, and
  effort level.
- Sol gives the worker a prompt that points to the handoff file.
- For a small task, Sol may provide a short prompt instead of a separate plan
  file, but it must still specify target files, behavior, and verification.
- Workers report changed files, tests run, failures, risks, and remaining work.
- Workers must not broaden scope without a new handoff.
- Sol reviews worker output and requests Luna review for risky, security-sensitive,
  architecturally significant, or uncertain changes.

### Ready-to-paste Sol system prompt

See the standalone policy and prompt in
`planning/SOL_ORCHESTRATION_POLICY.md`.

## Global Constraints

- Never read, write, generate, merge, or delete `.jsonc`; the project rule explicitly forbids it because it can shadow generated `.json`.
- Never rewrite the whole Claude state file. `~/.claude.json` contains OAuth/session state, user/local MCP configuration, per-project trust/allowed-tool state, caches, and other volatile data.
- Never copy or persist API keys, bearer tokens, OAuth values, prompt text, transcripts, plugin contents, or MCP credentials in BDF sources, logs, reports, analytics, or screenshots.
- Preserve every unknown key and value in a Claude settings file byte-for-byte where practical; at minimum preserve its parsed semantic value and formatting-independent data.
- Backup before every write; write to a same-directory temporary file, flush/replace atomically, and verify the resulting JSON before reporting success.
- Treat Claude Code version behavior as a compatibility matrix, not a timeless contract. Record the detected Claude Code version and adapter schema version with every build report.
- Initial supported surface is routing only: `env` endpoint/auth/model-related variables and the top-level `model` field. Marketplaces, `enabledPlugins`, MCP, skills, permissions, hooks, memory, and UI preferences remain pass-through/unsupported.
- A Claude routing profile is one scalar endpoint/auth/model tuple at a time. Do not promise simultaneous multi-provider activation inside native Claude settings.
- No implementation task starts until this research plan’s validation gates are complete and a human approves the adapter scope.

---

## Verified local baseline (read-only)

The supplied machine has the normal Windows Claude layout:

| Path | Observed role | Safe BDF treatment |
|---|---|---|
| `C:\Users\loveb\.claude\settings.json` | User-scope Claude settings | Narrow, preserve-unknown-fields routing patch target |
| `C:\Users\loveb\.claude.json` | Claude OAuth/session state, user/local MCP, per-project state, caches | Opaque Claude-owned state; do not generate or replace |
| `%USERPROFILE%\.claude\plugins` | Installed marketplace/plugin cache | Claude-owned; do not model as BDF plugins |
| project `.claude/settings.json` | Shared project settings | Future opt-in target only; never silently prefer it over user settings |
| project `.claude/settings.local.json` | Local project overrides | Future opt-in target only; normally gitignored |
| project `.mcp.json` | Project-scoped MCP servers | Claude-native; separate adapter, not part of routing MVP |

The local `settings.json` has these top-level keys (values intentionally not copied): `env`, `model`, `enabledPlugins`, `extraKnownMarketplaces`, `effortLevel`, and `theme`. Its `env` keys are `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`, and `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`.

The local `.claude.json` is approximately 52 KB and a generic PowerShell JSON parser rejected it because the object contains path keys that differ only by case. That is another reason to treat it as opaque state rather than round-trip it through a normalizer. No secret values were copied into this plan.

## What the official layout means

Claude’s official documentation says that on Windows `~/.claude` resolves to `%USERPROFILE%\\.claude`; user settings live in `~/.claude/settings.json`, while project and local settings use `.claude/settings.json` and `.claude/settings.local.json`. The same documentation states that `~/.claude.json` stores OAuth session data, user/local MCP configuration, per-project state, and caches, while project MCP lives in `.mcp.json` ([settings](https://code.claude.com/docs/en/settings), [Claude directory](https://code.claude.com/docs/en/claude-directory), [MCP](https://code.claude.com/docs/en/mcp)).

Therefore, the user’s placement is normal—not a broken install and not unique to Free Claude Code. The Free Claude Code project is an Anthropic-compatible proxy/integration that can route Claude Code traffic to alternative backends; its environment values are integration-specific and should not be mistaken for universal Claude Code settings ([repository](https://github.com/Alishahryar1/free-claude-code)).

## Safe support boundary

### Manage in the first Claude adapter

1. `ANTHROPIC_BASE_URL`: the Anthropic-compatible endpoint/gateway. It changes where requests go, not which model is selected.
2. Exactly one auth strategy per routing profile:
   - `ANTHROPIC_API_KEY`: sent as `X-Api-Key`.
   - `ANTHROPIC_AUTH_TOKEN`: sent as `Authorization: Bearer <value>`.
   - Never write both unless a provider explicitly requires both and the adapter’s compatibility test proves the behavior.
3. `model`: the persistent model setting in `settings.json`.
4. `ANTHROPIC_MODEL`: a session/environment override that takes precedence over the `model` setting. The UI must show that precedence instead of claiming the settings-file model is active when this variable is present.
5. Optional gateway discovery flag `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`, only when the selected endpoint is known to expose a compatible `/v1/models` endpoint.
6. Optional proxy compatibility flag `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`, only when the selected proxy rejects Anthropic beta headers or beta tool-schema fields.
7. Optional context policy `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, validated as a plain integer from 100000 through 1000000. It is not a model ID and should not be shown in the model list.
8. Optional privacy/network policy `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, represented as an explicit presence/absence toggle because any non-empty value disables the traffic; `0` and `false` do not turn it off.

### Do not manage in the first Claude adapter

- `.claude.json` OAuth/session/trust/cache data.
- `enabledPlugins`, `extraKnownMarketplaces`, plugin installation, plugin cache, marketplace clones, or plugin-provided skills/MCP.
- User/project MCP server definitions (`.claude.json` and `.mcp.json`).
- `CLAUDE.md`, skills, agents, hooks, permissions, memory, transcripts, snapshots, debug logs, and UI preferences.
- Provider-family switches such as Bedrock, Vertex, Foundry, Mantle, or Anthropic AWS until a separate provider adapter proves their credential and model semantics.

## Model configuration findings

Claude Code’s native model setting is scalar, not a provider → models map. Official model documentation supports:

| Form | Meaning | BDF treatment |
|---|---|---|
| `"model": "default"` | Clear the override and use the account/org default | Supported enum |
| `"model": "sonnet"` / `"opus"` / `"haiku"` / `"fable"` | Provider-resolved family aliases | Supported aliases, version-aware display |
| `"model": "opusplan"` | Opus during plan mode, Sonnet during execution | Supported special alias |
| `"model": "sonnet[1m]"` / `"opus[1m]"` | Request a one-million-token context variant where supported | Supported only after provider capability validation |
| `"model": "provider-native-id"` | Full Anthropic ID, Bedrock ARN, Foundry deployment, or Agent Platform version | Pass through as opaque ID after validation |
| `ANTHROPIC_MODEL=...` | Session/environment model override | Display as higher-precedence override; do not silently overwrite |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`, `...SONNET_MODEL`, `...HAIKU_MODEL`, `...FABLE_MODEL` | Pin what an alias resolves to; companion `*_NAME`, `*_DESCRIPTION`, and `*_SUPPORTED_CAPABILITIES` customize picker metadata | Future advanced model-pinning surface, not the initial provider registry |
| `ANTHROPIC_CUSTOM_MODEL_OPTION` plus name/description/capabilities | Add a custom entry to the `/model` picker | Future opt-in surface; preserve unknown env keys now |

Official docs state that `ANTHROPIC_BASE_URL` controls destination, while `model`/`ANTHROPIC_MODEL` controls model selection. Gateway/custom model IDs are passed through without Claude’s normal Anthropic model-name check, so the adapter must not “correct” IDs that belong to a gateway ([model configuration](https://code.claude.com/docs/en/model-config)).

### User-supplied examples mapped safely

- `ANTHROPIC_BASE_URL=http://localhost:8082` + `ANTHROPIC_AUTH_TOKEN=...` is a bearer-token gateway profile.
- `ANTHROPIC_BASE_URL=http://localhost:20128/v1` + `ANTHROPIC_API_KEY=...` is an API-key gateway profile.
- `model=nvidia_nim/z-ai/glm-5.2` is a gateway-native model ID; it is not evidence that Claude supports an OpenCode/Kilo provider object.
- `ANTHROPIC_DEFAULT_HAIKU_MODEL=oc/deepseek-v4-flash-free` pins the `haiku` alias to a gateway model; it does not add a second provider.

## Exact meanings of the requested environment variables

| Variable | Verified meaning | Important implementation consequence |
|---|---|---|
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | Auto-compaction threshold in tokens; official range 100000–1000000; plain integer; overrides `/autocompact`, CLI `--autocompact`, and `autoCompactWindow` | Validate range and integer syntax; do not treat `190000` as a model/context guarantee |
| `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY` | `1` populates `/model` from an Anthropic-compatible gateway `/v1/models`; off by default because shared keys could expose every model the key can access | Only enable with endpoint capability check and explain exposure; apply `availableModels` filtering when present |
| `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` | `1` strips Anthropic beta headers and beta tool-schema fields; it also disables MCP tool search unless managed settings explicitly keep it on in newer versions | Use for proxy compatibility, but warn that MCP tools may load up front |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Any non-empty value disables auto-updates, telemetry, error reporting, `/feedback`, release notes, gateway discovery refreshes, and availability checks; `0`/`false` still disable | Model it as presence/absence, not boolean string semantics; it can conflict with gateway discovery freshness |

The spelling in the user’s example, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFIC`, has one `F` and is not the documented variable. The documented spelling is `...TRAFFIC`.

## Additional documented variables worth cataloguing

The official environment-variable reference contains a large, versioned list—not a small fixed set. The first adapter should maintain a generated allowlist with categories rather than hard-code every variable into the UI. Important categories include:

- **Auth/endpoints:** `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, AWS/Bedrock, Vertex, Foundry, Mantle, and provider-specific credential variables.
- **Model routing:** `ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_*_MODEL`, `ANTHROPIC_CUSTOM_MODEL_OPTION*`, `CLAUDE_CODE_SUBAGENT_MODEL`.
- **Context/reasoning:** `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `DISABLE_AUTO_COMPACT`, `CLAUDE_CODE_DISABLE_1M_CONTEXT`, `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`, `MAX_THINKING_TOKENS`, `CLAUDE_CODE_EFFORT_LEVEL`.
- **Gateway/protocol:** `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`, `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`, `ENABLE_TOOL_SEARCH`, `ANTHROPIC_CUSTOM_HEADERS`.
- **Privacy/network:** `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_TELEMETRY`, `DISABLE_ERROR_REPORTING`, `DO_NOT_TRACK`, `CLAUDE_CODE_SKIP_PROMPT_HISTORY`.
- **Claude-owned runtime:** `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_PLUGIN_CACHE_DIR`, debug paths, temp paths, shell/process controls, sync-plugin/skills flags, and IDE integration flags.

The official page currently documents dozens of variables and changes frequently. The adapter must record the Claude Code version and link to the versioned reference instead of claiming a permanent “all variables” list ([environment variables](https://code.claude.com/docs/en/env-vars)).

## BDF adapter design

### Canonical source model

Create a Claude-specific source under the existing BDF source tree:

```text
providers/claude-code.json                 # endpoint/auth metadata; secrets never persisted
profiles/<profile>/claude-settings.json    # safe routing patch + model selection
schemas/claude-code-routing.schema.json    # adapter-owned allowlist and constraints
scripts/build-claude-code.ps1              # backup → patch → validate → verify
scripts/test-claude-code.ps1               # isolated fixture harness
```

The source model represents one active route at a time:

```json
{
  "target": "claude-code",
  "scope": "user",
  "endpoint": { "baseUrl": "...", "auth": { "kind": "apiKey", "secretRef": "..." } },
  "model": { "value": "...", "source": "settings" },
  "envPolicy": {
    "gatewayDiscovery": false,
    "disableExperimentalBetas": false,
    "autoCompactWindow": 190000,
    "disableNonessentialTraffic": false
  }
}
```

`secretRef` must resolve at runtime from the existing secret mechanism; it must never contain a token. The builder patches only the selected keys in `settings.json`, preserves all other keys, writes a backup, validates against the adapter schema, and verifies that no unsupported root was changed.

### Multiple “providers” in Switcher

Switcher may offer multiple Claude routing profiles (for example, Anthropic direct, Free Claude Code gateway, and another Anthropic-compatible gateway), but Claude Code receives only the selected profile’s scalar `env`/`model` values. Switching means selecting one profile and applying its route; it is not the same as activating multiple OpenCode/Kilo providers simultaneously.

### Build and rollback contract

1. Detect Claude by `%USERPROFILE%\\.claude\\settings.json` and/or `%USERPROFILE%\\.claude.json`; never infer readiness from `.claude.json` alone.
2. Read only the supported settings file for the selected scope; refuse ambiguous scope writes.
3. Snapshot file path, size, SHA-256, and a redacted structural summary.
4. Validate URL scheme/host policy, auth kind, model string, integer bounds, and flag interactions.
5. Create a timestamped backup beside the target; atomically replace the target.
6. Re-parse and assert: supported keys equal requested values, unknown keys remain, secrets are not present in reports, and `.claude.json` is unchanged.
7. On failure, restore the backup and report the exact stage without exposing values.

## Research and implementation gates

### Gate 1 — confirm Claude installation and scope

- [ ] Capture redacted structural manifests for `.claude/settings.json`, `.claude.json`, `.mcp.json` if present, and `%USERPROFILE%\\.claude`.
- [ ] Record Claude Code version and whether `CLAUDE_CONFIG_DIR` is set.
- [ ] Confirm the selected target is user scope, not project/local/managed scope.
- [ ] Confirm duplicate/case-colliding keys in `.claude.json` are preserved by the chosen opaque-state strategy.

### Gate 2 — fixture-only builder

- [ ] Add fixtures containing unknown settings, enabled plugins, marketplaces, MCP-like data, and fake secrets.
- [ ] Test patching endpoint/auth/model while every unsupported key remains unchanged.
- [ ] Test both auth strategies and reject ambiguous simultaneous auth unless explicitly supported.
- [ ] Test auto-compact bounds, gateway discovery, beta disabling, and nonessential-traffic presence semantics.
- [ ] Test malformed JSON, unsupported scope, invalid URL, invalid model, duplicate keys, interrupted replace, and backup recovery.

### Gate 3 — provider/model behavior

- [ ] Test an Anthropic-compatible local gateway with a fake `/v1/models` response.
- [ ] Verify discovery is opt-in and is disabled/flagged when `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is present.
- [ ] Verify a gateway-native model ID passes through unchanged.
- [ ] Verify `ANTHROPIC_MODEL` precedence over `model` is displayed honestly.
- [ ] Verify alias pinning (`ANTHROPIC_DEFAULT_*_MODEL`) does not become a fake provider list.

### Gate 4 — app integration

- [ ] Add Claude discovery as a separate adapter; do not mutate the OpenCode/Kilo registry contracts.
- [ ] Add a narrow Claude routing editor, with an explicit “Claude-owned settings preserved” notice.
- [ ] Keep marketplaces, plugin installation, MCP, skills, and `.claude.json` read-only/unsupported in the first release.
- [ ] Add an explicit backup/restore status and a “restart Claude Code may be required” notice for startup-only values.

### Gate 5 — user-approved live test

- [ ] Take a full byte-for-byte snapshot of the Claude target files and app state outside the target tree.
- [ ] Stop Claude Code/IDE processes that may hold settings files.
- [ ] Apply one route change, launch a disposable Claude session, verify `/status` and model routing, then restore the snapshot.
- [ ] Compare path/size/SHA-256 manifests and verify `.claude.json`, marketplace/plugin state, MCP state, and unsupported settings are unchanged.

## Questions intentionally left for validation

These are not assumptions to encode in BDF until a fixture or live test proves them:

- Whether a specific Free Claude Code release expects `/v1` on `ANTHROPIC_BASE_URL`, a bare host, or a translated Anthropic Messages path.
- Whether the selected gateway implements `/v1/models` with the exact response shape Claude Code expects.
- Whether a gateway supports all beta headers/tool-schema fields when `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` is absent.
- Whether a model alias or custom model ID supports extended thinking, effort, and 1M context.
- Whether the user’s current Claude Code version reloads each selected env variable live or only at startup.
- Whether project or managed settings override the user-scope route on the target machine.

## Sources

- [Claude Code settings and precedence](https://code.claude.com/docs/en/settings)
- [Claude directory and file locations](https://code.claude.com/docs/en/claude-directory)
- [Claude Code environment variables](https://code.claude.com/docs/en/env-vars)
- [Claude Code model configuration](https://code.claude.com/docs/en/model-config)
- [Claude Code MCP configuration](https://code.claude.com/docs/en/mcp)
- [Free Claude Code repository](https://github.com/Alishahryar1/free-claude-code)
