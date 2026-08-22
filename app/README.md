# Switcher — the app guide

> This is the plain-language user guide for the Switcher desktop app.
> New here? Start with the [main README](../README.md), then come back.

A local Windows control room for people who already understand coding agents,
models, and API keys. It lets you **switch between AI servers (providers)**,
inspect the local proxy, and build your agent configuration without hand-editing
generated JSON.

Your AI tool (for example OpenCode, Cursor, or anything that speaks the
"OpenAI way") points at this app once, and the app forwards everything to
whichever provider you pick. Switching providers = one click in the app.

## Demos

Current walkthroughs (sanitized fixture data only) — also embedded in the
[main README](../README.md):

| Demo | What it shows |
|---|---|
| ![Onboarding wizard](assets/demos/shared/onboarding.gif) | First-run wizard: detect agents → read-only review → ready |
| ![Overview dashboard](assets/demos/shared/workspace-overview.gif) | Activity KPIs, usage split, recent proxy calls |
| ![Provider deck + build](assets/demos/opencode/provider-and-build.gif) | OpenCode: provider switching + build to success |
| ![Integrations](assets/demos/opencode/integrations.gif) | OpenCode: plugins, MCP servers, LSP toggle |
| ![KiloCode providers](assets/demos/kilocode/provider-and-build.gif) | KiloCode: provider deck + kilo.json build |
| ![KiloCode integrations](assets/demos/kilocode/integrations.gif) | KiloCode: plugins, MCP, LSP |
| ![Claude routes](assets/demos/claude-code/routes-and-credentials.gif) | Claude Code: routes, details, DPAPI credentials |
| ![Claude inventory + activity](assets/demos/claude-code/inventory-and-activity.gif) | Claude Code: read-only inventory + route activity |

The static hero image is [assets/demos/switcher-overview.png](assets/demos/switcher-overview.png).

---

## What you need

- **Windows** (10 or 11)
- **Python** — install it from <https://www.python.org/downloads/>
  (during installation, tick **"Add python.exe to PATH"**)

That's it. No other setup, no terminal commands. The app is **self-contained**:
its full engine (the builder generator, the OpenCode builder + tester, the
Kilo adapter + tester, and the JSON schemas) ships inside the repo under
`app\engine\`. Download the repo, run the app, pick your coding agent (OpenCode
or Kilo), and the app creates the agent's profiles, schemas, builders, testers,
and scaffolds **by itself** — nothing lives outside the repo. (Power users can
point `BDF_SCRIPTS_DIR` at their own copy of the engine.)

---

## How to start

1. Open the `app` folder.
2. Double-click **`install.bat`** once - it creates the environment, installs
   the packages, and adds an **"Switcher"** shortcut to your desktop.
3. From now on, double-click the desktop shortcut (or `start.bat`).
4. Your browser opens the app automatically.

Prefer commands? From PowerShell:

```powershell
git clone https://github.com/lovkumarLED/switcher.git
cd switcher\app
.\install.bat   # one-time: creates env\, installs packages, adds the desktop shortcut
```

A small black window stays open - that's the app running. **Close it to stop
the app** (or just leave it open while you work).

> If a browser tab doesn't open, go to `http://127.0.0.1:9090` yourself.

The app always opens on the **Welcome** screen and stays there — it never
jumps ahead on its own. From Welcome, **Set up your workspace** starts the
wizard; the dashboard is reached through the wizard's final **Open dashboard**
step (or any time after setup, by going through the wizard).

---

## How the app's Python works

The first time you double-click `start.bat`, the app creates its own private
Python environment in an `env` folder next to the app, then installs the
packages it needs from `requirements.txt`. That is a one-time thing (needs
internet).

- The second launch onward is instant — no re-installing.
- If `requirements.txt` changes (when new features are added), the app
  re-installs automatically the next time you start it.
- The `env` folder is private to this computer. Copy the app folder to
  another PC and it simply creates a fresh `env` there on first launch —
  your providers, settings, and rule.md stay untouched.
- Deleting `env` is safe: it is recreated on the next launch.

## Backend modules (`app/app/`)

One responsibility per module. Entry point: `server.py` (FastAPI + uvicorn,
binds `127.0.0.1:9090` only).

| Module | Responsibility |
|--------|----------------|
| `config.py` | paths, host/port, agent registry, app-owned runtime locations |
| `storage.py` | `state.json` persistence (atomic writes) |
| `agents.py` | `/api/agents` — register/remove/switch which agent the app manages |
| `capabilities.py` | per-agent capability map and canonical identity (drives which pages/features each agent sees) |
| `discovery.py` | `/api/status`, `/api/discover`, `/api/scan` — find agents, read their main JSON read-only |
| `agentstore.py` | **the heart**: reads/writes the agent's real BDF files (providers, models, plugins, mcp, settings), backups, builder discovery, agent registry logic |
| `providers.py` | `/api/providers` CRUD + `/api/switch` + models writing |
| `profiles.py` | `/api/profiles` — list profiles, switch the active one |
| `plugins.py` | `/api/plugins` — profile plugin list |
| `mcp.py` | `/api/mcp` — profile MCP servers |
| `lsp.py` | `/api/lsp` — profile LSP toggle + value |
| `engine.py` | `/api/scaffold` (runs the bundled engine's scaffold) + `/api/build`, setup verify/revert |
| `testing.py` | `/api/test` — connection tester (GET /v1/models) |
| `proxy.py` | `/v1/*` — OpenAI-compatible passthrough to the ACTIVE provider |
| `activity.py` | `/api/activity` (+ summary): bounded, privacy-safe local proxy metadata |
| `preferences.py` | `/api/preferences`: retention, motion, browser preference; redaction stays mandatory |
| `claude_adapter.py` | Claude Code routes: save/edit/delete/apply/restore with transaction contract |
| `claude_credentials.py` | Windows DPAPI-encrypted credential store (names only leave it) |
| `claude_envvars.py` | user-scope environment-variable management for Claude route credentials |
| `claude_inventory.py` | read-only inventory scan of Claude-owned MCP servers and plugins |
| `serve.py` | `GET /` (gui.html) with the rule.md theme injected, `/api/rules` |
| `rules.py` | parses `rule.md` (theme front-matter + rulebook); never crashes on bad input |
| `banner.py` | local startup banner and local addresses |

---

## First-time setup (the wizard)

The wizard is fully wired to the real engine — everything it shows comes from
your actual configs. The four guided stages:

1. **Welcome** — the local-first intro with the interactive Counterphase
   symbol. You stay here until you choose to continue.
2. **Workspace** — the app detects the agents actually installed on this
   computer (**OpenCode** and **Kilo** are the verified targets; manual folder
   entry is available for anything else). You pick **one** agent — the app
   immediately scans that agent's config, and if the agent isn't set up yet it
   runs the BDF setup itself: creates `profiles/coding` + `experimental` +
   `minimal`, seeds `mcp.json`/`plugins.json`/`lsp.json` in the coding profile
   **from your target JSON's MCP/plugin/LSP sections** (LSP disabled by default),
   writes `settings.json` with the
   detected active providers, creates the `providers/` folder, backs up before
   every write, and never touches files you already own. A summary line shows
   what was found ("Scanned KiloCode: 2 providers · 7 MCP servers · 0
   plugins"). Continue stays disabled until you actually choose an agent.
3. **Provider** — you see the providers already in your config as status
   chips (name + active/not-active), and the cards are only the BDF presets
   **LiteLLM** and **CLI Proxy** plus **Custom** — any preset you already have
   is hidden. Every card shows the full configuration form: Base URL, SDK
   type (OpenAI-compatible, OpenAI, Claude, Gemini, DeepSeek, Groq, Other…),
   reasoning format (OpenCode/OpenAI/Claude/Gemini levels or none), API key,
   and structured **Models** rows (model ID + display name, add/remove).
   **Custom** additionally asks for a **Provider ID** (lowercase letters,
   numbers, hyphens, underscores) and a **Display name**, and saves the
   provider file with exactly the ID you typed. **Skip for now** goes straight
   to the final step — you are never forced to add a provider; add or manage
   them later on the Providers page.
4. **Complete** — summary of what's connected, the local endpoint
   (`127.0.0.1:9090`), and **Open dashboard**.

---

## The Overview page

The dashboard's home screen shows **only real data** — nothing is invented:

- **Provider relay** — a deck of your actual providers, with the active one
  forward. Hover it and scroll (or use the arrow keys): the deck cycles
  through your providers with a smooth depth animation — the front card moves
  forward and fades, and the next one takes its place (scroll back to reverse).
- **Activity summary** — request count, success rate, median latency, and
  failed requests over the last 30 days, read straight from the local
  activity log. When there's no traffic yet, the page says so honestly
  instead of showing sample numbers.
- **Requests over time** and **Provider usage** — charted from the same real
  proxy metadata; **Recent proxy calls** lists the actual latest calls.
- The header chip beside `127.0.0.1:9090` shows **which agent you're managing**
  (OpenCode or Kilo), and the sidebar shows **● Local proxy online** just above
  the theme and help buttons.

The sidebar also gained working tools: the **theme button** switches the whole
workspace to a dark palette (remembered on reload), and the **help button**
opens the docs.

Provider logos: the main providers (OmniRoute, LiteLLM, CLI Proxy, TokenRouter,
OpenRouter) carry their real brand marks, bundled locally in the app; any
custom provider gets its own generated logo (a colored tile with its initials)
— no provider ever shows a wrong brand.

---

## Agents (which coding agent the app manages)

The **Agents card** sits at the top of the home screen:

- It shows every agent the app knows about — name, config folder, and who's
  **Active** (the one being managed right now).
- **Add agent**: type a name + the config folder (e.g.
  `C:\Users\YourName\.config\opencode`) → the app can manage it too. You can
  have kilo AND opencode (and more) registered at once.
- **Switch to this**: the whole app — providers, models, plugins, MCP, build —
  instantly starts managing the chosen agent. Nothing is mixed up between
  agents; each one keeps its own config.
- ✕ removes an agent from the list (never deletes its files).

After the first-time wizard, your agent is registered automatically.

---

## Adding a provider

A *provider* is an AI server that speaks the OpenAI way. Common ones:

| Preset          | Example address                          |
|-----------------|------------------------------------------|
| OmniRoute       | `http://localhost:20128/v1`              |
| LiteLLM         | `http://localhost:4000/v1`               |
| CLI Proxy       | `http://localhost:PORT/v1`               |
| TokenRouter     | `https://api.tokenrouter.com/v1`         |
| Modal           | `https://inference.us-west.modal.direct/v1` |
| OpenAI          | `https://api.openai.com/v1`              |
| Google (Gemini) | `https://generativelanguage.googleapis.com/v1beta/openai` |
| OpenRouter      | `https://openrouter.ai/api/v1`           |
| NVIDIA NIM      | `https://integrate.api.nvidia.com/v1`    |
| Custom          | any address you like                     |

To add one:

1. Click **"Add provider"**.
2. Pick a preset (or Custom). The preset fills in the address **and** the SDK
   type for you — change either one if you like. (For **Modal**, paste your own
   endpoint URL — every Modal account has its own, e.g.
   `https://you--your-app.us-west.modal.direct/v1` — and use your proxy token
   `wk-…ws-…` as the API key.)
3. Give it a **name** (anything, e.g. "TokenRouter").
4. Check the address.
5. Pick the **SDK type** — how your server talks. "OpenAI-compatible (most
   servers)" fits OmniRoute, LiteLLM, CLI proxies, TokenRouter, Modal,
   NVIDIA NIM, and almost any local gateway. Choose OpenAI, OpenRouter, Claude
   (Anthropic), Gemini (Google), DeepSeek, Groq, and others for those APIs —
   or "Other…" to type any exact package name.
6. Paste the **API key** (if it needs one) — the little eye 👁 hides/shows it.
7. Pick the **Reasoning format** — which thinking levels your provider accepts
   (OpenCode: default/minimal/high/max, OpenAI/ChatGPT: none/low/medium/high/xhigh,
   Claude: low/high/max, Gemini: minimal/low/medium/high, or No reasoning).
   Presets pick it for you automatically (CLI Proxy / OpenAI → OpenAI, Google → Gemini);
   change it anytime.
8. (Optional) Add its **models** — each with the thinking levels of the chosen format.
9. Click **"Test connection"** — green ✓ means it works.
10. Click **Save** — the provider is added but remains inactive. Use the
    separate **Switch provider** action when you intentionally want to route
    traffic through it.

> **Real providers (TokenRouter, Modal, OpenAI, Google, OpenRouter, NVIDIA …)
> work just like proxies**: add one, save, rebuild, and it appears in your
> agent (Kilo/OpenCode) ready to chat — the app writes your key in both
> places your agent reads it. Remember to **restart your agent** after a
> rebuild so it picks up the new config.

---

## Rules: what NOT to do

- **Don't hand-edit your agent's main config** (`opencode.json`, `kilo.json`).
  It's *generated* — the app and the builder own it. Change a provider or
  model in the app and click **Build my config** instead.
- **Never create `opencode.jsonc` next to `opencode.json`.** OpenCode reads
  the `.jsonc` *instead of* the `.json` when both exist, so your built config
  silently disappears from `/models`. If a `opencode.jsonc` shows up, move it
  away (the app reads the built `.json`).
  We will update the app in the future to generate **both** `opencode.json`
  and `opencode.jsonc` — but not right now.
- **The app works with `.json` only — it never scans, reads, or modifies any
  `.jsonc` — ever.** Providers or models that live in a `.jsonc` are invisible
  to the app and will not run.
  > **If you have a provider in your `.jsonc` and you want to use it in the
  > app: remove the provider (and its API key) from the `.jsonc`, then add it
  > through the app instead (Providers → Add provider). Do that and the
  > provider works with the app — because the app can only work with `.json`,
  > never `.jsonc`.** The same applies to models: remove them from the
  > `.jsonc` and add them through the app, otherwise they will not run.

> When you save a provider, the app **writes it into your agent's own
> `providers/` folder** (e.g. `providers\omniroute.json`) — the same place your
> agent's builder reads from. Your keys are only ever stored in your own
> provider files. They never leave your computer, and the app never shows them
> back to you (you can only add a new one, never read the old one).
>
> **Your key is written where your agent reads it** — the app saves it in
> **both** places: top-level `apiKey` (what OpenCode reads) **and**
> `options.apiKey` (what Kilo and other agents read). One save, every agent
> works.
>
> Existing provider files (created by you earlier, or by the app) show up
> automatically — the app never overwrites anything without making a backup
> first (`backup\` folder in your agent's config).
>
> **Models:** add each model name with the thinking levels of its provider's
> reasoning format (OpenCode: default/minimal/high/max; OpenAI/ChatGPT:
> none/low/medium/high/xhigh — no `max`, GPT-5.x doesn't support it; Claude:
> low/high/max; Gemini: minimal/low/medium/high) right in the provider screen —
> the app writes your `profiles\coding\<provider>-models.json` for you with the
> correct JSON shape per format (`reasoningEffort`, `thinking.budgetTokens`, or
> `thinkingConfig.thinkingBudget`), exactly like the builder expects. No
> hand-editing JSON.
>
> **Plugins:** the app has a Plugins card on the home screen — type a plugin
> id and click Add; the app writes your `profiles\coding\plugins.json`.
> Remove is one click (backup kept first).
>
> **MCP servers:** an MCP card next to Plugins — your agent's MCP servers with
> their type, each removable in one click. Add a new one with a name + its
> config (JSON — e.g. `{"type": "local", "command": ["npx", "-y", "@example/mcp"]}`),
> validated before it's written to `profiles\coding\mcp.json` (backup-first).
>
> **Models card:** the home screen also has a Models card — pick a provider
> and its models load as rows (model id, display name, thinking chips for the provider's reasoning format: OpenAI none/low/medium/high/xhigh, Claude low/high/max, Gemini minimal/low/medium/high, OpenCode default/minimal/high/max).
> Remove a dead model, add a new one (e.g. when a provider swaps models),
> click **Save models** — the app writes
> `profiles\coding\<provider>-models.json` for you, backup-first. No JSON
> editing ever.

---

## Switching providers

On the home screen you see all your providers as cards, and the big glowing
hero shows **every active provider** — all of them 🔥 Active, side by side.

- The **first** one in the list is the primary — the one your tool talks to
  through `127.0.0.1:9090` (the note under the hero says so).
- Click **"Switch to this"** on any other card — it moves to the front and
  becomes the primary; **every active provider is still merged into the build**.
- **Test** re-checks a provider's connection (green = working, red = not
  reachable, gray = never tested).

---

## Building your configuration

Your AI agent works best with a *built* configuration (profiles + providers
merged into its main config file).

- **"Generate my builder"** (in the wizard) creates your personal builder
  scripts — exactly like the professional tool would, but done by the app.
- **"Build my config"** (home screen) runs the build for you. You see a
  terminal-style panel with colored lines while it works.
  - Green lines = done ✓
  - Amber lines = warnings
  - Red lines = problems (the Run button re-enables so you can retry)

The build **backs up your old config first**, so nothing is ever lost.

---

## Chatting

Anything that can talk to `http://127.0.0.1:9090/v1` in the OpenAI way can
talk through this app. Point your tool at:

```
http://127.0.0.1:9090/v1
```

and it will reach whichever provider is active — switching is still one click
in the app.

---

## Where your data lives

Everything stays inside the `app` folder (or next to your agent):

| File | What it is |
|------|------------|
| `state.json` | which agent is set up, where it lives |
| `<agent>\providers\` | your providers — the app writes them here (backup-first), exactly where your agent's builder reads them |
| `<agent>\profiles\coding\<provider>-models.json` | your models (with thinking levels) — the app writes them when you add models |
| `<agent>\profiles\coding\plugins.json` | your plugins — the app writes them from the Plugins card |
| `<agent>\profiles\coding\mcp.json` | your MCP servers — the app writes them from the MCP card |
| `<agent>\profiles\coding\lsp.json` | your LSP on/off + value — the app writes it from the Integrations LSP block (disabled by default) |
| `<agent>\profiles\coding\settings.json` | which provider is active (`activeProviders`) — the app updates it when you switch |
| `<agent>\backup\` | automatic backups of everything the app changes |
| `profiles\` | your agent's profiles (`coding`, `experimental`, `minimal`) |
| `<agent>\scripts\build-<agent>.ps1` etc. | your generated builder scripts (created by the app's bundled engine in `app\engine\`) |
| `env\` | the app's private Python environment (created on first run — safe to delete, recreated next launch) |
| `preferences.json` | app-only local preferences: Activity retention and motion preference; request-content redaction stays on |
| `activity.jsonl` | bounded local proxy metadata for the Activity page; not agent configuration and not sent anywhere |
| `rule.md` | the app's look (theme colors) + the rulebook for AI agents |

To move the app, copy the whole folder. Your providers live with your agent —
copy your agent's config folder too (or re-add your providers in the app).

---

## Hybrid Studio look and interaction

Hybrid Studio has a dark cinematic startup and a warm operational workspace.
The Counterphase symbol is the letter-free product mark: its pointer response
and click burst are bounded, keyboard reachable, and disabled when reduced
motion is requested. Operational pages use the same small purposeful motion
for navigation, cards, and dialogs — never perpetual decorative effects.

The app bundles OFL-licensed **Inter Tight** locally in
`assets\fonts\InterTight-Variable.woff2`; it never fetches fonts, scripts, or
visual assets from a CDN. The main destinations are **Overview**, **Providers**,
**Activity**, **Integrations**, and **Settings**. They adapt from wide desktop
to a narrow Windows window, retain labelled controls, 44px targets, visible
focus, keyboard dialogs, and a readable forced-colors mode.

The editable theme tokens remain in `rule.md` (next to this README).

- The top part of `rule.md` is the **theme** — colors and corner rounding.
  Edit a color (e.g. change `accent` to a color you like), save the file, and
  refresh the browser. The app applies it immediately.
- The bottom part of `rule.md` is the **rulebook** — the design and feature
  rules the app follows. AI agents working on this app read it before making
  changes, and every change keeps it in sync.

If you mess up `rule.md` (bad color, broken file), the app just keeps its
built-in look and shows a warning in the black window — nothing breaks.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Double-clicking `start.bat` does nothing | Python is not installed, or "Add python.exe to PATH" wasn't ticked. Install/reinstall Python. |
| "The server is running but the browser says it can't connect" | Check the small black window — it should say "Application startup complete". If it shows an error (e.g. port already in use), close other apps and retry. |
| A provider shows red on Test | That server isn't running right now. Start it, or check the address. |
| Your agent says "401 / no token / missing key" after adding a provider | Rebuild your config, then **restart the agent** — it keeps the old config in memory. The app writes your key in both places your agent reads it. |
| "No active provider" when chatting | Add a provider, then click "Switch to this" on it. |

---

## Privacy and Activity

- The app runs **only on your computer** (`127.0.0.1`) — nothing is sent
  anywhere except your own requests to the provider you chose.
- No account, no phone-home, and no remote telemetry.
- Keys never appear in the app's own files, logs, or on screen (only inside
  your agent's `providers\` folder, in your own files).
- **Activity is local and metadata-only.** It records the time, generated trace
  ID, provider/model IDs, route/method, status, latency, optional numeric token
  counts, and a sanitized error category for requests sent through the local
  proxy. It never stores prompts, messages, responses, response content, API
  keys, authorization headers, or raw request/response bodies.
- Activity retention is configurable from 1 to 365 days (30 by default) and
  is bounded to 1,000 records. Request-content redaction is mandatory and
  cannot be turned off. The page shows an honest empty state until the local
  proxy has traffic; it never invents usage data.
- Integrations shows plugin identifiers only, MCP configurations as
  **Configured** with their declared type, and an LSP block between Plugins and
  MCP (on/off toggle persisted via `PUT /api/lsp`, server-name chips, "Edit
  JSON" expert dialog). It does not claim plugin installs,
  MCP connectivity, discovered tools, provider health, or a successful test
  unless you explicitly run the relevant provider test.

## Claude Code

The app includes a narrow Claude Code routing adapter (one scalar route at a
time) documented under [`adapters/claude-code/`](../adapters/claude-code/README.md).
Claude Code is its own mode in the app: a tile on "Connect your agent", a tab
in the agent switcher, and a separate Routes page (routing profiles + the
Gateway compatibility assistant). Route keys pasted in the route form are
stored in a **Windows DPAPI-encrypted** credential store — the route only ever
references them by name. A read-only inventory shows the MCP servers (with
types) and plugins Claude Code has configured, scanned from the Claude state
file and the managed settings file - never edited. Lifecycle status:
**Live validated** (2026-08-17, corrected Gate 5B live validation PASS + Gate
5C approved; see `adapters/claude-code/`). The real-target lock was opened by
owner decision (session 48), so Apply/Restore work from the UI.

---

## More documentation

- [Main README](../README.md) — what Switcher is, install, demos
- [BDF framework guide](../bdf/README.md) — the engineering process behind the builders
- [Claude Code adapter](../adapters/claude-code/README.md) — adapter scope, ownership boundaries, evidence
- [Architecture](../ARCHITECTURE.md) · [JSON schemas](../JSON_SCHEMAS.md) · [Testing](../TESTING.md)
- [Contributing](../CONTRIBUTING.md) · [Security policy](../SECURITY.md) · [Code of conduct](../CODE_OF_CONDUCT.md)
