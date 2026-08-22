# Pi Agent — Research Report (Phase 15 Pre-Study)

> **Purpose:** Understand how Pi stores data so the BDF framework can later discover → scan → scaffold → build → manage Pi the same way it does OpenCode/Kilo (and bounded-patch Claude). This is a read-only research doc; no code was changed for it.
>
> **Date:** 2026-08-20
> **Pi version inspected:** `0.84.2` (`@earendil-works/pi-coding-agent@0.84.2`)
> **Status:** Research only — Phase 15 planning, not yet implemented. Follows the same gate pattern as Claude Code (`planning/CLAUDE_CODE_GATE_*`).
> **Author:** Muse Spark + sub-agents (verify-before-complete, evidence-backed)

---

## TL;DR Answer to Your Question

> **Does Pi use a main JSON file like `opencode.json` / `kilo.json`, or is it like Claude's `.claude/settings.json`?**

**Neither — Pi is fundamentally different:**

* **No single generated main JSON.** OpenCode and Kilo merge `providers/*.json` + `profiles/coding/*` into one **generated artifact** (`opencode.json` / `kilo.json`) that the agent reads. Claude Code patches one **user-scope JSON** (`.claude/settings.json` `env` field only).
* **Pi has no generated main artifact to patch.** It reads **multiple small files** from `~/.pi/agent/` (global) and `.pi/` (project-local) at runtime: `settings.json` (prefs), `auth.json` (credentials), `models-store.json` (cached catalog), `trust.json` (project trust), plus **TypeScript extensions** (`*.ts`) and **Pi Packages** (npm/git). Models/extensions/MCP are *not* JSON blobs merged into one file — they are distinct storage mechanisms. See §2-6.

> **One-line model:** `OpenCode/Kilo = builder merges JSON → one artifact` ; `Claude = surgical patch of one env field in settings.json` ; `Pi = runtime reads of several JSON + live TS extension loading + npm/git Pi Packages — no MCP`.

---

## 1. What Is Pi?

* **Full name:** `@earendil-works/pi-coding-agent` — the interactive **coding agent CLI** from the **Pi Agent Harness** monorepo `earendil-works/pi` (`packages/coding-agent`).
* **Publisher/author:** Mario Zechner / Earendil Works. License MIT. `package.json:99`.
* **Official entry points:**
  * GitHub monorepo: `https://github.com/earendil-works/pi` (primary source — `package.json:101` + `README.md:2` logo link to `https://pi.dev`)
  * npm: `https://www.npmjs.com/package/@earendil-works/pi-coding-agent` (1.88M weekly, verified 2026-08-20)
  * Website/installer: `https://pi.dev` (`https://pi.dev/install.sh`, `https://pi.dev/api/latest-version`, `https://pi.dev/api/report-install`)
  * Docs (in repo): `https://github.com/earendil-works/pi/tree/main/packages/coding-agent/docs` — 32 markdown files, mirrored locally under `dist/docs/` after build.
* **Install (official):**
  ```bash
  npm install -g --ignore-scripts @earendil-works/pi-coding-agent  # README.md:65
  # or
  curl -fsSL https://pi.dev/install.sh | sh                         # README.md:74
  ```
  Requires Node `>=22.19.0` (`package.json:106`). Verified locally: `C:\Users\loveb\AppData\Roaming\npm\node_modules\@earendil-works\pi-coding-agent\dist\cli.js` is the bin (`package.json:10` `bin.pi`).
* **Tagline/philosophy (official):** *“Pi is a minimal terminal coding harness. Adapt pi to your workflows, not the other way around, without forking pi internals. Extend it with TypeScript Extensions, Skills, Prompt Templates, and Themes.”* — `README.md:15`, `docs/index.md`. Ships with 4 tools only (`read, bash, edit, write` plus off-by-default `grep, find, ls` — `README.md:91,589`). No built-in sub-agents or plan mode — you build them as extensions or install a Pi Package. **No MCP by design** — see §6.
* **Modes:** interactive (default), print/JSON (`-p`, `--mode json`), RPC (`--mode rpc`), SDK (`createAgentSession`) — `README.md:19`, `docs/sdk.md`.

### How People Download Extensions

* **Extensions** = TypeScript modules (`*.ts`) loaded via `jiti` (no compile needed). See §5.
* **Skills** = reusable on-demand capabilities (markdown-described, auto-discovered).
* **Prompt Templates** = slash-expandable reusable prompts.
* **Themes** = terminal theme JSON.
* **Pi Packages** = bundles of the above shared via **npm** or **git** and installed with `pi install` — e.g. `pi install npm:@scope/pkg`, `pi install git:github.com/user/repo@v1`, or local `pi install ./my-pkg`. Managed globally (`~/.pi/agent/npm` / `~/.pi/agent/git/...`) or project-local (`.pi/npm` / `.pi/git`) with `-l`. Deduplication: project wins over global unless `autoload:false`. See §5 and `docs/packages.md`.

---

## 2. Where Pi Stores Data — Global vs Project

### 2.1 Canonical resolver (official, not inferred)

Source: `dist/config.js:412-420` (read from installed package) — the *only* truth for paths:

```ts
export function getAgentDir() {
  const envDir = process.env[`${APP_NAME.toUpperCase()}_CODING_AGENT_DIR`]; // = PI_CODING_AGENT_DIR
  if (envDir) return expandTildePath(envDir);
  return join(homedir(), CONFIG_DIR_NAME, "agent"); // CONFIG_DIR_NAME = pkg.piConfig.configDir || ".pi"  →  ~/.pi/agent
}
export const getSettingsPath = () => join(getAgentDir(), "settings.json");
export const getAuthPath     = () => join(getAgentDir(), "auth.json");
export const getModelsPath   = () => join(getAgentDir(), "models.json");
```

* `piConfig.configDir` comes from `package.json:7` `"piConfig": {"configDir": ".pi"}`. Verified `dist/config.js: CONFIG_DIR_NAME = pkg.piConfig?.configDir || ".pi"`.
* On **Windows** this resolves to `C:\Users\<user>\.pi\agent` (not XDG `~/.config/pi` — verified `Test-Path C:\Users\loveb\.config\pi` → `False`). On Unix it is `~/.pi/agent`.
* Local inspection confirms: `C:\Users\loveb\.pi` exists (created 2026-08-08), contains `agent/` (see §9).

### 2.2 Global (all projects) — `~/.pi/agent/`

| File / Dir | Purpose | When created | Docs |
|---|---|---|---|
| `settings.json` | Global preferences (model, theme, compaction, retry, tools, etc.) | On first run / `/settings` | `docs/settings.md:5` |
| `auth.json` | Credentials — API keys + OAuth tokens (chmod 0600) | On `/login` or first API key | `docs/providers.md:27,111` |
| `models-store.json` | Cached provider catalogs (offline reuse) | Auto on first provider use / `pi update --models` | `docs/providers.md:3` |
| `models.json` | Custom provider/model entries (optional) | When user adds Ollama/LM Studio etc via `docs/models.md` | `docs/models.md:18` |
| `trust.json` | Saved project trust decisions | On `/trust` | `docs/settings.md:14` |
| `sessions/<project-hash>/<ts>_<uuid>.jsonl` | File-per-session JSONL history (v3) | Per session | `docs/session-format.md:5` |
| `bin/fd.exe`, `bin/rg.exe` | Bundled binaries for file/grep tools | Shipped with agent | Local `C:\Users\loveb\.pi\agent\bin\` |
| `extensions/*.ts` or `extensions/*/index.ts` | Global TypeScript extensions (auto-discovered, hot-reload `/reload`) | When user creates or `pi install`s | `docs/extensions.md:7`, `examples/extensions/README.md` |
| `npm/`, `git/<host>/<path>` | Pi Packages installed globally | On `pi install <source>` | `docs/packages.md` |
| `prompts/`, `skills/`, `themes/` | Project-agnostic resources if placed globally | Optional | `docs/settings.md:268` |

### 2.3 Project-local (per `cwd`, trusted only after approval)

| Location | Purpose | Trust requirement |
|---|---|---|
| `.pi/settings.json` | Project overrides (merged over global; nested objects are deep-merged — `docs/settings.md:337-352`) | Requires trust (`defaultProjectTrust: ask/always/never`) — `docs/settings.md:14-20` |
| `.pi/extensions/*.ts` | Project extensions | Trusted only after `/trust` or `pi -a/--approve` |
| `.pi/skills/`, `.pi/prompts/`, `.pi/themes/`, `.pi/SYSTEM.md`, `AGENTS.md`/`CLAUDE.md` discovery | Project resources | Same |
| `.pi/npm/`, `.pi/git/` | Project-scoped Pi Packages (`-l`) | `pi install -l` |
| `.pi/sessions` | Alternative session dir if `sessionDir: .pi/sessions` in settings | Via `settings.json:239` |

> **Key rule:** Non-interactive modes (`-p`, `--mode json|rpc`) do *not* show a trust prompt; they obey `defaultProjectTrust` unless overridden with `--approve`/`--no-approve`. `pi config` and package commands use the same flow except `pi update` never prompts (`docs/settings.md:16,20`).

### 2.4 Env overrides (same as Claude's scope but different names)

* `PI_CODING_AGENT_DIR` → overrides `~/.pi/agent`
* `PI_CODING_AGENT_SESSION_DIR` → overrides session dir
* `PI_PACKAGE_DIR`, `PI_OFFLINE`, `PI_SKIP_VERSION_CHECK`, `PI_TELEMETRY`, `PI_CACHE_RETENTION`, provider keys (`ANTHROPIC_API_KEY` etc.), runtime `PI_SESSION_ID/FILE/PROVIDER/MODEL/REASONING_LEVEL` in bash tool (`docs/environment-variables.md`, `docs/providers.md:69`).

---

## 3. Does Pi Have a Main JSON Like `opencode.json`?

**No.**

* **OpenCode/Kilo:** The BDF builders *merge* modular sources (`providers/*.json` + `profiles/coding/*.json`) into **one generated artifact** (`opencode.json` / `kilo.json`) that the agent reads as its entire config. The artifact is the source of truth at runtime; the app never edits it by hand.
  * Registry: `app/app/config.py:33-36` `opencode: main=["opencode.json"] @ .config\opencode`, `kilo: main=["kilo.json"] @ .config\kilo` (and `scaffold-agent.ps1:88-95` canonical). Builders: `app/engine/build-opencode-v2.7.ps1` + `app/engine/kilo/build-kilo-v1.ps1`.
  * Data model: `providers/<id>.json` (dual-key `apiKey`+`options.apiKey`), `profiles/coding/<provider>-models.json`, `plugins.json`, `mcp.json`, `lsp.json`, `settings.json: {activeProviders[]}` — see `app/app/agentstore.py`, `ADAPTER.md:38-39`, `ARCHITECTURE.md:62-89`.
* **Claude Code:** Single user-scope file `.claude/settings.json` whose only managed key is top-level `env` (one scalar route: `ANTHROPIC_BASE_URL` + one auth kind + `ANTHROPIC_MODEL` etc.). Bounded patch adapter, revision + routesRevision locks, DPAPI credential store (`adapters/claude-code/ADAPTER.md:34-72`, `app/app/claude_adapter.py`).
* **Pi:** No merged artifact. No `pi.json`. No `config.json` at `~/.pi` that aggregates everything. Each concern lives in its own file(s) and is read directly:
  * Preferences → `settings.json` (global + optional `.pi/settings.json` merge)
  * Credentials → `auth.json`
  * Catalog → `models-store.json` (cache) + optional `models.json` (custom entries)
  * Sessions → `sessions/*.jsonl`
  * Extensions/tools → `extensions/*.ts` (live)
  * Packages → `npm/` / `git/` directories + `settings.json: packages[]`

The closest analog to `opencode.json` is **not a file at all** — it is the *in-memory union* of `settings.json` + `auth.json` + extension registry + package dirs + session state, resolved at startup via `dist/config.js` and the extension loader (`jiti`).

---

## 4. How Pi Stores Models

### 4.1 Built-in catalog + cache (`models-store.json`)

* Pi ships with a **built-in catalog of 30+ providers**. On first use (or update check) it **refreshes** and caches the catalog in `~/.pi/agent/models-store.json` for offline reuse (`docs/providers.md:3: "Configured provider catalogs refresh automatically; run pi update --models to force an immediate refresh"`).
* Verified locally: `C:\Users\loveb\.pi\agent\models-store.json` = 56,918 bytes, `checkedAt: 1787218475599`, entries for `opencode` (`https://opencode.ai/zen/v1`), `google` (Generative AI), etc., ~70 models cataloged (excerpt: `glm-5.1/5.2`, `gpt-5/5-codex/5.1-codex-max`, `grok-4.5`, `kimi-k2.5/2.6`, `muse-spark-1.2`, `gemini-2.5-flash/pro`, `gemini-3.5-flash-lite` …). Full structure per model: `{id, name, api (openai-completions/openai-responses/google-generative-ai/anthropic-messages), provider, baseUrl, reasoning, input [text/image], cost, contextWindow, maxTokens, thinkingLevelMap}`.
* Commands: `pi --list-models [search]` lists the live catalog; `pi update --models` / `pi update --all --force` refreshes it. Verified `pi --help` + `docs/providers.md:69` provider table.

### 4.2 Subscription vs API-key providers (official)

* **Subscriptions (OAuth via `/login`):** Anthropic Pro/Max, OpenAI Codex (ChatGPT Plus/Pro), GitHub Copilot, xAI, Radius — tokens stored in `auth.json` and auto-refreshed, `/logout` clears (`docs/providers.md:15-57`).
* **API keys (env or auth file):** Anthropic, OpenAI, Azure OpenAI, DeepSeek, NVIDIA NIM, Google Gemini/Vertex, Bedrock, Mistral, Groq, Cerebras, Cloudflare AI Gateway/Workers AI, xAI, OpenRouter, Vercel AI Gateway, ZAI, OpenCode Zen/Go, HuggingFace, Fireworks, Together, Baseten, Kimi, MiniMax, Qwen, Xiaomi MiMo, etc. — full table `README.md:98-139`, `docs/providers.md:69-106`. Resolution order: CLI `--api-key` → `auth.json` → env → `models.json` (`docs/providers.md:310-317`).
* **Auth file shape (`~/.pi/agent/auth.json`):** chmod 0600, `docs/providers.md:139`, e.g.:
  ```json
  {
    "anthropic": { "type": "api_key", "key": "sk-ant-..." },
    "google":    { "type": "api_key", "key": "..." },
    "opencode":  { "type": "api_key", "key": "sk-..." }
  }
  ```
  The `key` field supports `!command` (shell exec), `$ENV_VAR` interpolation, `$$`/`$!` escapes, or literal (`docs/providers.md:159-184`). Provider-scoped `env` object can override process env for that credential (`docs/providers.md:143-157`).

### 4.3 Custom providers/models (`~/.pi/agent/models.json`)

* Optional file for Ollama, LM Studio, vLLM, or any provider speaking a supported API. Shape (`docs/models.md:18`):
  ```json
  {
    "providers": {
      "ollama": {
        "baseUrl": "http://localhost:11434/v1",
        "api": "openai-completions",
        "apiKey": "ollama",
        "models": [{ "id": "llama3.1:8b" }]
      }
    }
  }
  ```
  Supports value resolution `!cmd`, `$ENV`, `$$`, `$!`.
* **Custom API/OAuth** via **extension providers** (`docs/custom-provider.md`, example `examples/extensions/custom-provider-gitlab-duo/`).

---

## 5. How Pi Stores Extensions / Plugins

Pi **has no `plugins.json`** and no `plugin` string array. It has an **Extension API** of live TypeScript modules.

### 5.1 What extensions are

* A TypeScript file (or `index.ts` in a subfolder) exporting `default function(pi: ExtensionAPI)` — sync or async (async is awaited before `session_start`, useful for `registerProvider` remote fetches). Loaded with `jiti` (no compile step).
* They extend behavior by: `registerTool`, `registerCommand`, `registerShortcut`, `registerFlag`, `registerProvider`, `pi.on(event, handler)` (50+ events), `ctx.ui.*` (confirm/select/input/notify/custom overlays), `ctx.sessionManager`, `ctx.modelRegistry`. See `docs/extensions.md:5-50`, `examples/extensions/README.md:1-213`.
* 90+ examples in `examples/extensions/` (`permission-gate.ts`, `protected-paths.ts`, `todo.ts`, `plan-mode/`, `subagent/`, `sandbox/`, `doom-overlay`, `ssh.ts`, etc.) + `examples/sdk/` 13 SDK demos.

### 5.2 Where extensions live / how they get downloaded

| Location | Scope | How it gets there | Hot-reload |
|---|---|---|---|
| `~/.pi/agent/extensions/*.ts` or `*/index.ts` | Global | User creates file *or* `pi install <source>` puts npm/git package under `~/.pi/agent/npm` or `git/<host>/` and registers via `settings.json: packages[]` / `extensions[]` | `/reload` |
| `.pi/extensions/*.ts` | Project | Same, project-local; needs trust | `/reload` |
| `settings.json: extensions: []` | Explicit paths/globs (relative to `settings.json` location, supports `!` exclusions, `+`/`-` force) | Manual edit | — |
| `pi -e ./path.ts` / `pi --extension npm:..|git:...` | Ephemeral (temp dir) | CLI flag for one run | No |

* `pi install <source> [-l]` / `pi remove|uninstall <source> [-l]` / `pi list` / `pi update [--self|--extensions|--models|--all|--extension <src>] [--force]` — verified `pi --help`, `pi install --help`, `docs/packages.md:1-228`.
* Global installs → `~/.pi/agent/npm/<pkg>` & `~/.pi/agent/git/<host>/<path>`; project installs → `.pi/npm/` & `.pi/git/` (`-l`). Git packages run `npm install --omit=dev` (or `npmCommand` argv). Pinned `@version`/`@ref` are skipped by `update --all`.
* Manifest `package.json: { keywords:["pi-package"], pi:{extensions:[],skills:[],prompts:[],themes:[]} }`; without manifest, auto-discovers `extensions/ skills/ prompts/ themes/` dirs. Deduplication: project entry wins over global unless `autoload:false`.

### 5.3 How this differs from OpenCode/Kilo plugins

* **OpenCode/Kilo:** `profiles/<profile>/plugins.json` = `{ "plugin": ["superpowers@git+https://..."] }` — string identifiers only; the builder copies them verbatim into the artifact's `plugin` / `skills.urls` field. Managed via Switcher Plugins card, backup-first, deduped (`app/app/agentstore.py:397-417`, `BUILDER_SPEC`). The app never claims install/version/health.
* **Pi:** Extensions are *executable code*, not string IDs. No `plugins.json`. Manage by placing `*.ts` on disk or via Pi Package managers. Switcher would need to write files, not JSON arrays.

---

## 6. How Pi Stores MCP

**Short answer: It doesn't — by design.**

* **Official stance (`README.md:498-499` — Philosophy):** *“No MCP. Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support. [Why?](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)”* Verified via grep — no `mcp.json` or `mcpServers` config exists in docs except this note.
* **OpenCode/Kilo:** `profiles/<profile>/mcp.json` = `{ "mcp": { "<id>": { "type":"local|remote", "command":[...], ... } } }` — JSON config merged into artifact (`agentstore.py:419-440`, `build:1280-1292`, Switcher MCP card with JSON validation).
* **Claude Code:** No `mcp.json` either — gate decision excluded MCP/skills/permissions/hooks/memory/sessions/credentials (`adapters/claude-code/ADAPTER.md:19`).
* **Pi alternative:** Build an extension that *calls* an MCP server (`registerTool` wrapper) or use **Skills** (CLI tools with READMEs) — the idiomatic Pi way (`docs/skills.md`). `examples/extensions/` contains bridging patterns (`ssh.ts`, `sandbox/`). An extension *could* add MCP support, but Pi itself has no MCP file to merge.

---

## 7. Auth / Provider File — Pi vs Others

| Agent | Where the key lives | File shape | Dual-key? | How Switcher manages it |
|---|---|---|---|---|
| **OpenCode** | `providers/<id>.json` → `provider.<id>.apiKey` | `{id, provider:{<id>:{name, apiKey, options:{baseURL, apiKey}, npm, reasoningFormat, models:{}}}}` | **Yes** — app writes both `apiKey` *and* `options.apiKey` so one file works in both agents; builder mirrors at merge time `build-opencode-v2.7.ps1:880-889` | CRUD + `switch` + `test GET /v1/models`, backup-first `backup/` |
| **Kilo** | Same `providers/<id>.json` → `provider.<id>.options.apiKey` (same file, same dual write) | Same | Same | Same (agent-agnostic `agentstore.py`) |
| **Claude Code** | `.claude/settings.json: env.ANTHROPIC_API_KEY` by **referenced env name** (`secretEnvRef` regexp `^[A-Za-z_][A-Za-z0-9_]*$`), value never in JSON; stored encrypted in `app/state/claude-credentials.bin` DPAPI (`claude_adapter.py:586-636`) | `env: {ANTHROPIC_BASE_URL, ANTHROPIC_API_KEY|ANTHROPIC_AUTH_TOKEN (indirect), ANTHROPIC_MODEL, ...}` plus top-level `availableModels/enforceAvailableModels` | No | Bounded patch + staged backup + revision locks |
| **Pi** | `~/.pi/agent/auth.json` (global) keyed by provider id (`anthropic`, `google`, `opencode`, `openai`, …) + env fallback | `{"<provider>": {"type":"api_key|oauth","key":"<value|!cmd|$ENV>","env":{...}}}` + separate `models-store.json` cache | No — single `key` field; `!`/`$` resolution at runtime (`docs/providers.md:159-184`) | Would need to read/write `auth.json` (file-per-provider key), not a per-id file |

---

## 8. Other Pi Storage Worth Knowing

* **Settings schema** — `docs/settings.md:24-353` covers every key: `defaultProvider/Model/ThinkingLevel`, `theme`, `compaction{enabled,reserveTokens,keepRecentTokens}`, `retry{...}`, `steeringMode/followUpMode`, `transport`, `sessionDir`, `enabledModels`, `packages/extensions/skills/prompts/themes`, `defaultTools`, etc. Project `.pi/settings.json` overrides global with deep merge (`docs/settings.md:337-352`).
* **Sessions** — `docs/session-format.md:5-7` JSONL v3 (tree with `id/parentId`, `type: session|model_change|thinking_level_change|message`). Header `{"type":"session","version":3,"id":...}`. Viewer commands: `/tree`, `/branch`, `/fork`, `/resume -r`, `/continue -c`. Sample verified: `C:\Users\loveb\.pi\agent\sessions\--C--Users-loveb--\2026-08-16T16-25-51-838Z_01a00b64...jsonl`.
* **Trust** — `~/.pi/agent/trust.json` + `defaultProjectTrust: ask|always|never` (`docs/settings.md:12-20`).
* **Bins** — `~/.pi/agent/bin/fd.exe` + `rg.exe` (shipped, not PATH).
* **Themes/prompts/skills** — resolved relative to `settings.json` location (`docs/settings.md:268`).

---

## 9. What We Found on *Your* Machine (ground truth)

*Inspection date 2026-08-20 via recursive filesystem + `pi --help/version` + live reads (no inference).*

* **Pi install:** `@earendil-works/pi-coding-agent@0.84.2` at `C:\Users\loveb\AppData\Roaming\npm\node_modules\@earendil-works\pi-coding-agent\` (`dist/cli.js` entry). Shims: `C:\Users\loveb\AppData\Roaming\npm\pi`, `pi.cmd`, `pi.ps1` (PowerShell shim execs `node ...dist/cli.js`). `pi --version → 0.84.2`, `pi --help` lists `install/remove/update/list/config/auth` + flags (`--provider --model --extension -e --skill --prompt-template --theme --mode` etc.). Not a Python package (`pip list` has no `pi`).
* **Global config:** `C:\Users\loveb\.pi\agent\` (exists, `d----- 2026-08-08`) — *not* under `C:\Users\loveb\.config` (XDG). Contents:
  ```
  C:\Users\loveb\.pi\agent\settings.json      165 B  {lastChangelogVersion:"0.84.2", theme:"dark", defaultProvider:"google", defaultModel:"gemini-3.5-flash-lite", defaultThinkingLevel:"high"}
  C:\Users\loveb\.pi\agent\auth.json          236 B  {opencode:{type:"api_key",key:"sk-..."}, google:{type:"api_key",key:"AQ.Ab8RN..."}}  (redacted, chmod 0600)
  C:\Users\loveb\.pi\agent\models-store.json 56918 B  checkedAt 1787218475599, ~70 models cached (glm-5.1/5.2, gpt-5/codex, kimi-k2.5, muse-spark-1.2, gemini-2.5-flash/pro etc.)
  C:\Users\loveb\.pi\agent\bin\fd.exe         4060672 B
  C:\Users\loveb\.pi\agent\bin\rg.exe         4218880 B
  C:\Users\loveb\.pi\agent\sessions\--C--Users-loveb--\2026-08-16T...01a00b64.jsonl              64844 B
  C:\Users\loveb\.pi\agent\sessions\--C--Users-loveb-OneDrive-Desktop-haymimo--\2026-08-16T...01a00c02.jsonl 127547 B
  C:\Users\loveb\.pi\agent\sessions\--C--Users-loveb-.config-opencode-docs--  (empty, no JSONL yet)
  C:\Users\loveb\.pi\agent\sessions\--C--Users-loveb-OneDrive-Desktop-my python projects-- (empty)
  ```
  Absent (clean install): `~/.pi/agent/extensions/` (no extensions yet), `~/.pi/agent/trust.json`, `~/.pi/agent/models.json`, `~/.pi/agent/keybindings.json`, `~/.pi/agent/npm/`, `~/.pi/agent/git/`.
* **Not found (confirming negative):** `C:\Users\loveb\.config\pi`, `AppData\Local\pi`, `AppData\Roaming\pi`, `C:\Users\loveb\.pi\agent\extensions`, `C:\Users\loveb\.config\opencode\docs\.pi` (project-local) — all `False`.
* **Env/registry:** No `PI_*` env vars (`PI_CODING_AGENT_DIR`, `PI_OFFLINE` etc.) set; Pi relies on file + npm shims, not registry keys. `PATH` contains `C:\Users\loveb\AppData\Roaming\npm` (where `pi` lives). Roadmap mentions (not runtime): `ROADMAP.md:659`, `PROJECT_STATE.md:790`, `README.md:677`, `_agent/JOURNEY_TO_V3.md:96,216`, `SESSION_LOG.md:29,30` — Pi = Phase 15 next agent after Claude, deferred.

---

## 10. Comparison Table: OpenCode / Kilo / Claude Code / Pi

| Dimension | **OpenCode** | **Kilo Code** | **Claude Code** (bounded patch) | **Pi** (0.84.2) |
|---|---|---|---|---|
| **Home** | `%USERPROFILE%\.config\opencode` | `%USERPROFILE%\.config\kilo` | `%USERPROFILE%\.claude` | `%USERPROFILE%\.pi` (`~/.pi/agent` global; `.pi` project) |
| **Main JSON** | `opencode.json` (generated, never hand-edited) | `kilo.json` (generated) | `.claude/settings.json` (user-scope, patch `env` only) | **No artifact** — multiple files (`settings.json`, `auth.json`, `models-store.json`, `trust.json`, `sessions/*.jsonl`) |
| **Is the main file merged?** | Yes — builder F1 schema → F2 preflight → merge `settings→providers→models→plugins→mcp→lsp→verify→backup→provenance→diff` (`build-opencode-v2.7.ps1`) | Same K1 pipeline, `settings` merges *all* keys (not only `$schema`) (`build-kilo-v1.ps1:828-854`) | No — surgical patch only `env` fields (`claude-routing-core.psm1`) | No — runtime reads, no builder |
| **Providers** | `providers/<id>.json` dual-key `apiKey` + `options.apiKey`, `npm`, `reasoningFormat`, `baseURL` | Same | One route via `env.ANTHROPIC_*` by ref, stored DPAPI `app/state/claude-credentials.bin` | `auth.json` `{provider:{type,key,env}}`, env fallback, `!cmd`/`$ENV` resolution; catalog cache `models-store.json` |
| **Models** | `profiles/coding/<provider>-models.json` highest precedence + other tiers (`ADAPTER.md:101-128`) | Same | Not applicable — `ANTHROPIC_MODEL` + `availableModels` in same `settings.json` | Built-in 30+ providers catalog cached in `models-store.json`; custom `models.json` optional |
| **Plugins / Extensions** | `profiles/coding/plugins.json` `{plugin:[...]}` string IDs | Same (`plugin` + `skills.urls` plugkeys) | Out of scope (excluded in adapter) | **TS extensions** `*.ts` in `extensions/` (global `.pi/agent/extensions` / project `.pi/extensions`) + `pi install` Pi Packages (npm/git) |
| **MCP** | `profiles/coding/mcp.json` `{mcp:{...}}` (local/remote/expert) | Same | Out of scope | **No MCP** — `README.md:498` `No MCP. Build CLI tools with READMEs (Skills), or build an extension that adds MCP support.` |
| **Private state** | `backup/<TargetBase>_*.json` (KeepBackups=10) | Same | `backup/settings.backup.<ts>.<guid>.json` + `app/state/claude-{routes,backup-manifest,activity,credentials.bin}` | `sessions/*/*.jsonl` + `trust.json` |
| **Active selection** | `profiles/coding/settings.json:activeProviders[]` (first = primary for `/v1` proxy) | Same | Not a list — single env route | `settings.json:defaultProvider/defaultModel/defaultThinkingLevel` (+ `enabledModels` for Ctrl+P cycling) |
| **Builder** | `scripts/build-opencode-v2.7.ps1` / `app/engine/build-opencode-v2.7.ps1` | `scripts/kilo/build-kilo-v1.ps1` / `app/engine/kilo/build-kilo-v1.ps1` | `app/engine/claude-code/build-claude-code{-production}.ps1` + `claude-routing-core.psm1` | **None** (would be new BDF Phase 15) |
| **Scaffold** | `scripts/scaffold-agent.ps1` registry entry `opencode: .config\opencode main=[opencode.json] plugkeys=[plugin]` | `kilo: .config\kilo main=[kilo.json] plugkeys=[plugin,skills.urls]` | Registry discover-only `claudecode: Home=.claude Main=[.claude.json,settings.json]` never scaffold target | **Future:** registry would be `pi: Home=.pi agentDir=.pi/agent settings=[settings.json] auth=[auth.json] extensions=[extensions/*.ts]` |
| **Hard rule** | Never read `.jsonc` (`*.jsonc` never scanned/merged) | Same, refuses `.jsonc` without `-AllowJsonc` | `.claude.json` opaque, never read | `.pi` resources require explicit trust (`defaultProjectTrust`) — same shape as `jsonc` guard |

---

## 11. Implications for BDF Phase 15 (Pi Adapter Design Sketch — not a spec)

*This section is derivative; it interprets the research for planning. It does not add new facts about Pi beyond what is cited above.*

**Pattern to follow:** Claude Code's *bounded patch* is the closer analog than OpenCode/Kilo's *merged artifact*, because Pi also has no merged artifact. But unlike Claude (one JSON + one env field), Pi has **many files + code artifacts**, so the adapter will be a **hybrid**:

1. **Discover** — extend `AGENT_REGISTRY` (`app/app/config.py:33`, `scripts/scaffold-agent.ps1:88`) with `pi: {name:"pi", home:".pi", agentDir:".pi\\agent", main:["agent\\settings.json","agent\\auth.json"]}`. Discovery already shows `~/.pi` exists on this machine.

2. **Scan (read-only)** — enumerate `~/.pi/agent/{settings,auth,models-store,trust,mcp:absent}.json` + `~/.pi/agent/extensions/*.ts` + `~/.pi/agent/npm|git` + `.pi/settings.json` (if trusted). Never read another agent's home, never modify `auth.json` without backup.

3. **Split** — conceptual; Pi doesn't need splitting (already split). The scaffold would *seed* `extensions/` + example `.pi/settings.json` overrides, not generate a builder that merges JSON.

4. **Providers/auth adapter** — closest to Claude's credential store but file-shaped: Switcher would read/write `auth.json` entries (`{type,key,env}`) + trigger `pi update --models` to refresh `models-store.json`. Would need backup `~/.pi/agent/backup/auth.<ts>.<guid>.json` (mirror `backup\` pattern) and verification of catalog.

5. **Extensions (instead of plugins)** — Switcher Plugins/MCP cards would become Extensions/Skills/Package cards that write `*.ts` or run `pi install`. The current `agentstore.py` (`plugins_file→profiles/coding/plugins.json`, `mcp_file→mcp.json`) has **no Pi analog** — new store functions `get_extensions_path`, `list_extensions` (enumerate `*.ts`), `pi_extensions_file` would be needed.

6. **No MCP** — Integrations page would show `Configured extensions` (count of `*.ts` + `packages[]`) and optionally `MCP via extension` guidance, not `mcp.json`.

7. **No builder today** — Pi would be **Phase 15 Step 1: discover+scan+read**, then **Step 2: write/auth + package install**, then **Step 3: no-build verification** (there is no artifact to provenance/diff). The `build-pi-v1.ps1` would be a *validator* (`pi config`, `pi list`, `pi update --models` test) rather than a merger.

**Risks noted during research:** Pi's extension API is TypeScript + `jiti` hot reload; writing `*.ts` verbatim (copy/paste) is safe, but *executing* them requires trust + `pi -a` vs `defaultProjectTrust`. `models-store.json` is a cache, not a source — writing it directly would be lost on next refresh. `auth.json` holds secrets; must respect No-Secrets (never log/show key, only `hasKey`), backup-first, local-first (same as current). Windows has no special setup (`docs/windows.md:394B`).

---

## 12. Sources — Only Verified, No Hallucination

> Every URL/file below was read directly during this research. Do not cite beyond them.

**Official Pi sources (primary):**
* GitHub monorepo — `https://github.com/earendil-works/pi` (repo home)
* Pi monorepo README — `https://github.com/earendil-works/pi/blob/main/README.md`
* Coding agent package — `https://github.com/earendil-works/pi/tree/main/packages/coding-agent` (branch main, verified `package.json:directory`)
* Coding agent README (installed) — `C:\Users\loveb\AppData\Roaming\npm\node_modules\@earendil-works\pi-coding-agent\README.md` (713 lines, includes Providers table `98-139`, Philosophy `498-499` “No MCP…”, modes `19`)
* Docs index — `https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/index.md` (lists all 32 docs)
* Docs locally mirrored — `C:\Users\loveb\AppData\Roaming\npm\node_modules\@earendil-works\pi-coding-agent\docs\{settings,providers,extensions,packages,models,custom-provider,sdk,windows,etc}.md`
* Verified doc excerpts:
  * `docs/settings.md:5` global vs project settings, `docs/settings.md:12-22` trust, `docs/settings.md:24-353` all settings
  * `docs/providers.md:3` cache in `models-store.json`, `docs/providers.md:15-57` subscriptions, `docs/providers.md:69-106` env/API key table, `docs/providers.md:139` chmod 0600, `docs/providers.md:159-184` key resolution, `docs/providers.md:310-317` resolution order
  * `docs/extensions.md:5-50` quick start + capabilities, `docs/extensions.md:56-100` example
  * `docs/packages.md:1-228` Pi Packages + `README.md:407-456` sharing
  * `docs/models.md:18` custom `models.json` shape
* npm registry — `https://www.npmjs.com/package/@earendil-works/pi-coding-agent` (v0.84.2)
* Website — `https://pi.dev` (project website + `https://pi.dev/install.sh` installer per `README.md:74`)

**Local install evidence (your machine, 2026-08-20):**
* `C:\Users\loveb\AppData\Roaming\npm\node_modules\@earendil-works\pi-coding-agent\package.json:1-108` (name, version, `piConfig.configDir:.pi`, bin, engines `node>=22.19.0`)
* `C:\Users\loveb\AppData\Roaming\npm\node_modules\@earendil-works\pi-coding-agent\dist/config.js:412-420` (canonical `getAgentDir/getSettingsPath/getAuthPath`)
* `C:\Users\loveb\.pi\agent\settings.json` (165 B, `defaultProvider:google`, `defaultModel:gemini-3.5-flash-lite`, `theme:dark`, `lastChangelogVersion:0.84.2`)
* `C:\Users\loveb\.pi\agent\auth.json` (236 B, `opencode`+`google` api_key)
* `C:\Users\loveb\.pi\agent\models-store.json` (56,918 B, `checkedAt`, providers `opencode`/`google`, ~70 models)
* `C:\Users\loveb\.pi\agent\sessions\--C--Users-loveb--\2026-08-16T16-25-51-838Z_01a00b64...jsonl` (64,844 B, JSONL v3)
* Live CLI — `pi --version` → `0.84.2`, `pi --help`, `pi list` → “No packages installed”, `pi --list-models` (catalog output)

**Project sources (how OpenCode/Kilo/Claude do it — for contrast):**
* `C:\Users\loveb\.config\opencode\docs\ADAPTER.md` (Claude bounded patch, phases, backup/lock)
* `C:\Users\loveb\.config\opencode\docs\ARCHITECTURE.md:62-89` (source diagram, pipeline)
* `C:\Users\loveb\.config\opencode\docs\app\app\config.py:13-44` (`AGENT_REGISTRY`, `CLAUDE_SETTINGS_REL`, `ENGINE_DIR`)
* `C:\Users\loveb\.config\opencode\docs\app\app\agentstore.py:111-504` (provider/model/plugin/mcp/store logic)
* `C:\Users\loveb\.config\opencode\docs\app\engine\build-opencode-v2.7.ps1` / `app/engine/kilo/build-kilo-v1.ps1` (merge pipelines)
* `C:\Users\loveb\.config\opencode\docs\app\engine\claude-code\claude-routing-core.psm1` + `adapters/claude-code/ADAPTER.md`
* `C:\Users\loveb\.config\opencode\docs\scripts\scaffold-agent.ps1:88-95` (canonical registry)
* `C:\Users\loveb\.config\opencode\docs\ROADMAP.md:659`, `PROJECT_STATE.md:790`, `README.md:677`, `_agent/JOURNEY_TO_V3.md:96,216`, `SESSION_LOG.md:29,30` (Pi = Phase 15 next agent, deferred)

**Web search excerpts (used only to locate official URLs, not as facts):**
* `earendil-works/pi: AI agent toolkit: unified LLM API, agent loop, TUI, coding agent CLI` — `https://github.com/earendil-works/pi`
* `pi/packages/coding-agent at main — Pi is a minimal terminal coding harness...` — `https://github.com/earendil-works/pi/tree/main/packages/coding-agent`
* `Pi Documentation — docs/index.md` — `https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/index.md`

**What was *not* used:** No YouTube video was needed — official docs + local install were sufficient; no third-party blog was cited as fact. If you want a YouTube deep-dive later, search `pi coding agent demo` and cross-check against `https://pi.dev` before adding.

---

## 13. Open Questions for Gate 1 (keep — do not answer by guessing)

1. **Trust UX for Pi in Switcher** — Does Switcher auto-approve `.pi` on scaffold, or mirror `defaultProjectTrust: ask` with an explicit Approve toggle?
2. **Auth write policy** — Mutate `auth.json` directly (backup-first + `pi auth check`) or delegate to `pi auth` subcommands only?
3. **Extension authoring from GUI** — Does Switcher write `*.ts` templates (safe) or run `pi install` for packages only in v1?
4. **No build — what does the Build button do for Pi?** Likely `pi update --models` + `pi list` validation + `pi config` check, not a merge. Decide before scaffolding the builder stub.
5. **Sessions** — Read-only in GUI (list recent `sessions/*.jsonl`) or ignore in v1 like Claude's memory/sessions exclusion?

---

## 14. How to Use This File Next

* When you are ready for Claude Code post-completion (`planning/CLAUDE_CODE_GATE_5C_*`), create `planning/PI_GATE_1_RESEARCH_HANDOFF.md` (your question) and have the next session consume *this* report as input alongside `ADAPTER.md`.
* Gate 1 will answer the 5 open questions, then Gate 2 will scaffold a Pi fixture builder (validator, not merger) and `fixtures/` for live validation — same order as `CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_*`.

---

*End of report. No file was written outside `planning/PI_RESEARCH.md`. All `C:\Users\loveb\.pi` secrets were redacted; the sample key prefix above is fake-edited. Re-run `pi --help` and re-inspect `docs/` after any Pi update (0.84.x moves fast) before starting Phase 15.*
