# APP FULL CHECK — Switcher (docs/app) complete test runbook

> Rule: a THOROUGH end-to-end check of the A app (Switcher) — every page,
> every button, every dialog, every card, every error path, every graph.
> Two full passes: (1) **FIRST-STARTUP TEST** on a wiped kilo config
> (pre-seeded models in the Jason), then (2) **NORMAL TEST** on the restored
> real config. Anything broken = bug → fix → re-run → repeat until clean.

---

# Ground truth (read first)

| Thing | Path |
|-------|------|
| App (the "A" app) | `C:\Users\loveb\.config\opencode\docs\app` |
| App server | `http://127.0.0.1:9090` (FastAPI, launch via `env\Scripts\python server.py`) |
| GUI | `docs\app\gui.html` (pages: Overview, Providers, Activity, Integrations, Settings) |
| **kilo** (agent config under test) | `C:\Users\loveb\.config\kilo` |
| **jason** (the main JSON) | `C:\Users\loveb\.config\kilo\kilo.json` — has `provider` (tokenrouter, omniroute … each with `models` map + variants), `mcp` sections |
| App registry | `docs\app\state.json` (`agent`, `dir`, `agents[]`, `activeAgent`, `activeProfile`) |
| App prefs | `docs\app\preferences.json` (retention, redaction, motion) |
| Activity log | `docs\app\activity.jsonl` (proxy metadata) |
| Agent data written by the app | `<agent>\providers\`, `<agent>\profiles\coding\*.json`, `<agent>\backup\`, `<agent>\scripts\` |

Agent files the app reads/writes:
`kilo.json` (generated — never hand-edit after setup), `providers\<id>.json`
(dual key: `apiKey` + `options.apiKey`), `profiles\coding\<provider>-models.json`,
`profiles\coding\plugins.json`, `profiles\coding\mcp.json`,
`profiles\coding\settings.json` (`activeProviders`).

---

# Non-negotiables (discipline — always)

1. **Backup-first.** Before ANY destructive step: copy `~\.config\kilo` + `docs\app\state.json`
   + `preferences.json` to `%TEMP%\opencode\appcheck\` and record a SHA256 manifest
   of every file. Restore + hash-verify after the phase.
2. **No-Secrets.** Never echo API keys. Mask them (`sk-***`). Never paste a key into chat output.
3. **Snapshot → click → hash-verify restore** for anything touching the real kilo config.
4. **Zero-console-error rule.** Watch the browser console; any JS error = FAIL → fix → re-run.
5. **Check → fix → check** loop. Every FAIL fixed before the session ends.
6. Never commit anything on your own.

---

# Phase 0 — Pre-flight

- [ ] 0.1 Stop any running app instance (`Get-Process python | Stop-Process` if server.py is running).
- [ ] 0.2 Confirm clean state: `git status` in `docs` — no stray files.
- [ ] 0.3 Start the app: `workdir docs\app` → `env\Scripts\python server.py` (background).
- [ ] 0.4 Console: `Application startup complete` on `127.0.0.1:9090`, no exceptions.
- [ ] 0.5 Open GUI in playwright (Chromium). Record baseline console messages — must be empty.
- [ ] 0.6 The app MUST open on the **Welcome** screen (startup page) — never jumps ahead.
- [ ] 0.7 Baseline snapshot: `~\.config\kilo` + `state.json` + `preferences.json` → temp; write SHA256 manifest.

---

# Phase 1 — FIRST STARTUP TEST (wiped kilo, seeded jason)

Goal: simulate a brand-new user setting up kilo for the first time. The app must
scan kilo + jason and create kilo's folders by itself.

## 1.1 Seed models into the Jason (`kilo.json`)
- [ ] Backup `kilo.json` first.
- [ ] Add 2 new models to `provider.tokenrouter.models` (keep the shape: `"<model-id>": {"name": "...", "variants": {"default": {"reasoningEffort": "default"}, "high": {"reasoningEffort": "high"}, "max": {"reasoningEffort": "max"}}}`).
- [ ] Add 1 new model to `provider.omniroute.models` (e.g. `"test/seed-model"`).
- [ ] Validate JSON parses (`ConvertFrom-Json`), no syntax error.
- [ ] Record these as the **seed set** — they must be readable by the wizard later.

## 1.2 Wipe kilo (keep ONLY the jason)
- [ ] Move everything inside `~\.config\kilo` EXCEPT `kilo.json` to a temp quarantine
  (profiles/, providers/, schemas/, scripts/, backup/, docs/, node_modules/,
  `kilo.jsonc`, `kilo.provenance.json`, package*.json, .gitignore).
- [ ] Resulting kilo folder = ONLY `kilo.json` (the jason). Verify.

## 1.3 Fresh startup
- [ ] Restart the app server. Open GUI fresh.
- [ ] **Welcome screen**: `Set up your workspace` button visible.
- [ ] Click **Set up your workspace** → step 02 Connect your agent.
- [ ] Agent detection lists OpenCode AND KiloCode (Detected). Manual folder option present.
- [ ] **Continue stays disabled until an agent is picked** (verify).
- [ ] Pick **KiloCode** → scan runs → summary line "Scanned KiloCode: N providers · M MCP servers · 0 plugins".
- [ ] Providers detected from the jason = tokenrouter + omniroute (the seeded models must be present later).
- [ ] **Review workspace** screen: Profiles/Plugins/MCP/Providers counts shown; "Nothing will be changed until you approve".
- [ ] Click **Use this workspace** → the app CREATES kilo's folders:
  - [ ] `profiles\coding` + `experimental` + `minimal` exist
  - [ ] `profiles\coding\mcp.json` seeded FROM the jason's `mcp` section
  - [ ] `profiles\coding\plugins.json` seeded (even if empty list)
  - [ ] `profiles\coding\settings.json` with detected active providers
  - [ ] `providers\` folder created
  - [ ] `schemas\`, `scripts\`, `backup\` created by the bundled engine
  - [ ] `state.json` now registers kilo as the set-up agent
- [ ] Step 03 Add a provider: existing providers shown as chips (tokenrouter, omniroute + status);
      preset cards for LiteLLM/CLI Proxy/Custom only (already-present presets hidden).
- [ ] Models section: `＋ Add model` adds a row; `×` removes a row; empty model rows blocked.
- [ ] (Optional) Add one provider via the wizard: preset auto-fills URL + SDK; key eye toggle works.
- [ ] **Skip for now** works → step 04 Complete.
- [ ] Step 04: endpoint `127.0.0.1:9090` shown; **copy endpoint** button copies; **Open dashboard** opens the workspace.
- [ ] Dashboard loads for kilo with NO console errors; sidebar shows "● Local proxy online".

## 1.4 After-first-startup sanity (fresh kilo state)
- [ ] Overview shows the agents card with kilo Active.
- [ ] Providers page shows the 2 providers detected from the jason, models incl. the **seed set**.
- [ ] Quick build (`Build my config`) succeeds on the fresh setup; kilo.json regenerated, seed models survive.

## 1.5 Restore gate (MANDATORY)
- [ ] Stop app. Restore `~\.config\kilo` and `state.json`/`preferences.json` from the snapshot.
- [ ] SHA256 hash-verify: every restored file byte-identical to baseline. Report the diff count (must be 0).
- [ ] Restart the app; confirm real config is back (activeAgent, providers intact).

---

# Phase 2 — NORMAL TEST — global chrome (every session, every page)

- [ ] 2.1 Sidebar navigation: Overview / Providers / Activity / Integrations / Settings all switch pages.
- [ ] 2.2 **Theme button** toggles dark palette; persisted after reload.
- [ ] 2.3 **Help button** opens docs.
- [ ] 2.4 Header chip shows the agent being managed (`opencode · connected` or `kilo · connected`).
- [ ] 2.5 "● Local proxy online" indicator present above theme/help.
- [ ] 2.6 Any page error state: kill server → page shows error + **Try again** button → restart server → Try again recovers.
- [ ] 2.7 Browser console: zero errors on every page transition.

---

# Phase 3 — NORMAL TEST — Overview page (every button)

- [ ] 3.1 **Agents card**: lists all known agents (opencode, kilo, …) with config folder + Active marker.
  - [ ] **Add agent**: name + folder → appears in list.
  - [ ] **Switch to this** on another agent → whole app switches (providers/models/plugins/MCP/build).
  - [ ] **✕ remove agent** removes from list only — files untouched; removed agent stops being manageable.
- [ ] 3.2 **Provider relay hero** (front card = primary):
  - [ ] Hover + scroll cycles the deck (forward = next, back = reverse).
  - [ ] Arrow keys cycle too.
  - [ ] Front card shows `Remove provider` (danger) when active / `Add provider` when not.
  - [ ] `View details` routes to Providers page.
- [ ] 3.3 **Activity summary** KPI cards: request count, success rate, median latency, failures.
  - [ ] With zero traffic: honest empty state ("no traffic yet"), NO invented numbers.
- [ ] 3.4 **Requests over time** line chart (SVG) with Successful/Failed legend — see Phase 5 for traffic.
- [ ] 3.5 **Provider usage** card renders per-provider breakdown.
- [ ] 3.6 **Recent proxy calls** table: shows actual latest calls; `View all` routes to Activity.
- [ ] 3.7 **Range selector** (Last 24 hours / 7 days / 30 days): KPIs + charts re-render, no console errors.
- [ ] 3.8 Empty-providers state: with no providers, empty-state card + `Add a provider` button routes to Providers.

---

# Phase 4 — NORMAL TEST — Providers page + provider workspace (every button)

- [ ] 4.1 `Add provider` (page top) opens the add dialog / embedded panel.
- [ ] 4.2 **Provider cards**:
  - [ ] `Switch provider` → becomes primary (moves to front of deck, status Primary).
  - [ ] `Test` → green (ok) / red (fail) / gray (untested) dot + result.
  - [ ] `Details` → dialog with endpoint, SDK package, reasoning format, key status ("Stored locally (hidden)"), model list, `Edit provider`.
  - [ ] `Edit provider` (from Details) reopens the form pre-filled.
  - [ ] `× delete` → confirm dialog → provider file removed (backup kept).
  - [ ] `Primary provider` button disabled on the primary card.
- [ ] 4.3 **Deck controls**: `←` `→` cycle cards; click (non-button) selects a card.
- [ ] 4.4 **Agent tabs**: OpenCode ↔ Kilo switch the whole provider view per agent (isolation — see Phase 6).
- [ ] 4.5 `+ Add agent` routes to Settings.
- [ ] 4.6 **Add-provider dialog — 5 steps (Choose / Configure / Models / Test / Save)**:
  - [ ] Step buttons gated: can only reach completed steps; Back/Next work; Save appears at step 5.
  - [ ] **Every preset** (OmniRoute, LiteLLM, CLI Proxy, TokenRouter, Modal, OpenAI, Google/Gemini, OpenRouter, NVIDIA NIM, Custom): selecting it auto-fills base URL + SDK (and hides presets already configured).
  - [ ] Name: required — empty name shows error, cannot advance.
  - [ ] Base URL: required — empty URL shows error.
  - [ ] SDK: datalist suggestions; "Other" accepts any package name.
  - [ ] API key: eye toggle show/hide; `(leave empty to keep existing)` on edit.
  - [ ] Reasoning format select: options per provider (opencode/openai/claude/gemini/none).
  - [ ] Models textarea (one ID per line) accepted.
  - [ ] Step 4 `Test connection`: success + failure paths (see Phase 9).
  - [ ] Step 5 review: name/ID slug preview, URL, models, format, key status → `Save provider`.
  - [ ] **Duplicate rejection**: adding a provider with an existing ID/name → clear error, nothing written.
- [ ] 4.7 **Embedded provider panel (provider-workspace)**:
  - [ ] Close `×` works.
  - [ ] SDK choice buttons toggle aria-pressed.
  - [ ] Reasoning-format choice buttons toggle.
  - [ ] Provider choice buttons (OmniRoute / CLI Proxy / LiteLLM / Custom) toggle.
  - [ ] Provider ID input validates (lowercase letters, numbers, hyphens, underscores).
  - [ ] `＋ Add model` rows / `×` remove row.
  - [ ] Key eye toggle; `Test connection`; `Save provider`; Back/Next step footer.
  - [ ] `Manage agents` routes to Settings.
  - [ ] Card actions in deck: `Add provider`/`Remove provider` (activate/deactivate), `Details`, `Test connection`.
- [ ] 4.8 **Save writes both keys**: verify saved `providers\<id>.json` has `apiKey` AND `options.apiKey`; API responses never return the key (only `hasKey`).

---

# Phase 5 — NORMAL TEST — Models: add + remove on EVERY surface

## 5.1 Overview Models card
- [ ] Provider picker loads that provider's models as rows (id, display name, thinking chips per reasoning format).
- [ ] Remove a model row → `Save models` writes `profiles\coding\<provider>-models.json` (backup-first).
- [ ] Add a new model row (id + name) → `Save models` persists it.
- [ ] Chip/variant correctness per format: OpenAI none/low/medium/high/xhigh, Claude low/high/max, Gemini minimal/low/medium/high, OpenCode default/minimal/high/max.

## 5.2 Providers page
- [ ] Models added in the dialog textarea appear in the provider file after save.
- [ ] Editing provider models updates `-models.json` (never duplicates).

## 5.3 Settings — Models & reasoning module
- [ ] Provider select → Model select populates; panel opens for a selected model.
- [ ] Reasoning format select; level checkboxes; `Save reasoning` → written to the model file; "saved" status appears.
- [ ] `Remove model` → removed with confirm; file updated.
- [ ] `Add model` → model editor form (`settingsModelForm`): rows add/remove, save persists.
- [ ] Model manager (provider library): checkboxes select rows → `N selected` counter → `Delete selected` (disabled at 0) deletes.

## 5.4 Wizard provider step
- [ ] `＋ Add model` adds row, `×` removes, save persists (covered in Phase 1).

## 5.5 Verification for every surface
- [ ] Writes are backup-first (`backup\` gets the previous file).
- [ ] JSON shape matches the provider's reasoning format (`reasoningEffort` / `thinking.budgetTokens` / `thinkingConfig.thinkingBudget`).
- [ ] Rebuild regenerates kilo.json and ALL models survive the build.

---

# Phase 6 — NORMAL TEST — Graphs (how they work)

## 6.1 Generate real traffic
- [ ] Via the proxy, send a tiny chat completion: `POST http://127.0.0.1:9090/v1/chat/completions`
  with model `moonshotai/kimi-k3-free` (active provider tokenrouter). Record status.
- [ ] Send 1 request to a dead/never-active provider (or with active removed) → expected failure event.
- [ ] Confirm `activity.jsonl` gained records (time, trace id, provider/model, route, status, latency; NO content).

## 6.2 Overview charts
- [ ] After traffic: KPIs show real counts (not empty state).
- [ ] **Requests over time**: SVG line chart renders, legend Successful/Failed matches data.
- [ ] **Provider usage**: shows the provider that served the calls.
- [ ] **Recent proxy calls**: lists the actual calls; `View all` → Activity.
- [ ] Range switch (24h/7d/30d) filters correctly.

## 6.3 Activity page
- [ ] Traffic chart (requests over time) renders from real events.
- [ ] Latency chart renders when samples exist.
- [ ] Filters: range, provider, status (all/success/failed) — each re-renders correctly.
- [ ] Empty state: with no matching events → honest empty message, no fake data.
- [ ] No console errors while rendering charts.

## 6.4 Data honesty
- [ ] Zero traffic = zero charts/zero KPIs; charts never invent numbers.

---

# Phase 7 — NORMAL TEST — Agent switching (isolation)

- [ ] 7.1 Switch active agent to kilo via Overview Agents card → providers/models/plugins/MCP all read kilo's files.
- [ ] 7.2 Switch to opencode → everything reads opencode's files (no mixups).
- [ ] 7.3 Add a temp third agent (e.g. `appcheck-temp` in `%TEMP%\opencode`) → add a provider to it → switch back to opencode → third agent's provider NOT visible (isolation).
- [ ] 7.4 Remove the temp agent → files still exist on disk; app no longer lists it.
- [ ] 7.5 Provider page agent tabs (OpenCode/Kilo) mirror the same isolation.

---

# Phase 8 — NORMAL TEST — Plugins (add + remove)

- [ ] 8.1 Integrations page: `Add plugin` opens dialog (identifier input).
- [ ] 8.2 Invalid/empty identifier → error message, nothing written.
- [ ] 8.3 Valid identifier (e.g. `package@git+https://github.com/owner/repo.git`) → saved to `profiles\coding\plugins.json` (backup-first), appears in list + Settings module.
- [ ] 8.4 `Remove` (trash icon) → confirm dialog ("keeps a backup") → removed from file.
- [ ] 8.5 Settings page: plugin rows render; switch + `...` buttons route to Integrations.
- [ ] 8.6 Rebuild: plugins section survives.

---

# Phase 9 — NORMAL TEST — MCP servers (add + remove + error paths)

- [ ] 9.1 `Add MCP server` dialog: mode segment **Local / Remote / Expert JSON** toggles aria-pressed and fields.
- [ ] 9.2 **Local**: name + command → saved to `profiles\coding\mcp.json` (e.g. `{"type":"local","command":["npx","-y","@example/mcp"]}`), shown as **Configured · Local**.
- [ ] 9.3 **Remote**: name + HTTPS URL → saved as `Configured · Remote`.
- [ ] 9.4 **Expert JSON**: textarea with default template; valid JSON accepted.
- [ ] 9.5 **Error paths (the "connecting hits an error" cases)**:
  - [ ] Invalid JSON in Expert mode → visible `mcpMessage` error, NOTHING written to mcp.json.
  - [ ] Empty name → required error.
  - [ ] Remote with non-HTTPS URL → error.
  - [ ] Duplicate name → error (or documented replace behavior).
  - [ ] After each failure: dialog stays open, retry with valid input succeeds.
- [ ] 9.6 `Remove` (trash icon) → confirm → removed (backup kept).
- [ ] 9.7 Settings page MCP rows (max 5) render with Configured status; `...` routes to Integrations.
- [ ] 9.8 Rebuild: MCP section survives.

---

# Phase 10 — NORMAL TEST — Connection errors (red paths)

- [ ] 10.1 Test connection against a stopped endpoint → red status + readable error; page does NOT crash; Test button re-enabled.
- [ ] 10.2 Test against the local OmniRoute (if running) → green.
- [ ] 10.3 Proxy chat with NO active provider → clean error ("No active provider"), server logs no keys.
- [ ] 10.4 Proxy chat with active provider → request forwarded; response returned; activity records the call.
- [ ] 10.5 Wizard provider step `Test connection` failure → error shown, Save still possible.
- [ ] 10.6 No Authorization header/body ever logged by the server console.

---

# Phase 11 — NORMAL TEST — Build pipeline

- [ ] 11.0 **Content parity (MANDATORY — catches silent data loss)**: after each
      build, diff the SOURCE files against the GENERATED JSON:
  - [ ] Every provider in `providers\` exists in the generated `opencode.json` / `kilo.json`.
  - [ ] Every model in `profiles\coding\<provider>-models.json` exists in the
        generated output, with the SAME variant names AND identical variant
        content (compare `ConvertTo-Json -Compress` per variant, not just names).
  - [ ] Zero "dropped" warnings in the build output (grep the log for `dropped`).
  - [ ] Missing/differing items = FAIL → fix the builder, never accept it.
  - [ ] This phase exists because the 2026-08-12 full check only verified the
        build RAN and missed that the reasoning-format filter stripped
        low/medium/xhigh variants from cli-proxy models.
- [ ] 11.1 Overview `Build my config` → terminal-style output: green done lines, amber warnings, red problems; Run re-enables on failure.
- [ ] 11.2 Build backs up old config first (`backup\`).
- [ ] 11.3 Build is idempotent: second build = "No changes detected".
- [ ] 11.4 `kilo.json` after build: providers carry dual keys, models merged, provenance stamped.
- [ ] 11.5 Integrations `Build my config` (buildMessage updates, button re-enables).
- [ ] 11.6 Settings Build module: `Build my config` → terminal output in `#settingsBuildOutput`.
- [ ] 11.7 Run-build dialog (main.js): `Run build` executes; `Close` closes; output updates live.

---

# Phase 12 — Edge cases, persistence, hygiene

- [ ] 12.1 Reload persistence: theme, active agent, last page.
- [ ] 12.2 Keyboard: dialogs Esc-close, Tab order, focus visible, Enter submits.
- [ ] 12.3 Narrow window (responsive): no broken layout, 44px targets, controls labelled.
- [ ] 12.4 Server restart: GUI reloads, no stale state, state.json intact.
- [ ] 12.5 Secrets hygiene: grep app files/console for `sk-`/`wk-`/`ws-`/`nvapi`/`gsk_`/`AIza`/`ghp_` in SYSTEM artifacts (kilo/opencode configs keep their own keys; nothing else may).
- [ ] 12.6 Activity privacy: `activity.jsonl` contains metadata only (no prompts/responses/content).
- [ ] 12.7 Node syntax check: `node --check` on gui.html inline JS and page modules — clean.
- [ ] 12.8 Unit suite (if app changed): `env\Scripts\python -m pytest ..\app` green.

---

# Phase 13 — Final restore + report gate

- [ ] 13.1 Stop the app. Restore `~\.config\kilo` + `state.json` + `preferences.json` from the Phase-0 snapshot.
- [ ] 13.2 SHA256 hash-verify ALL restored files byte-identical. Diff count must be 0.
- [ ] 13.3 Remove temp agents/seed models/quarantine; `git status` in `docs` clean of stray files (`.playwright-mcp` ignored).
- [ ] 13.4 Write the report (format below). Every FAIL listed as `FAIL → fixed → re-PASS` or left as an Open Question with a `Next:` line.
- [ ] 13.5 No commit without the user asking.

---

# Report format

One line per check: `PASS` / `FAIL → fixed → re-PASS` / `FAIL → Open`.
End with:

- **Found & fixed:** list
- **Open questions / not tested:** list with `Next:` lines
- **Phases summary table:** | Phase | Result | Notes |

---

# Resume prompt (paste to run this check)

```
Run the APP FULL CHECK now.

Read C:\Users\loveb\.config\opencode\docs\AI\APP_FULL_CHECK.md

Execute every phase in order:
0. Pre-flight (snapshot ~/.config/kilo + app state.json/preferences.json to
   %TEMP%\opencode\appcheck, SHA256 manifest).
1. FIRST-STARTUP TEST: seed 3 models into the jason (kilo.json provider
   sections), wipe ~/.config/kilo except kilo.json, restart the app, walk the
   whole wizard on Kilo (detect -> scan -> review -> use workspace -> provider
   step -> complete -> open dashboard), verify the app created kilo's folders
   (profiles coding/experimental/minimal, seeded mcp.json/plugins.json from
   the jason, settings.json, providers/, schemas/, scripts/, backup/), then
   RESTORE kilo + state.json and hash-verify byte-identical.
2. NORMAL TEST on the restored config: global chrome, Overview (agents card
   add/remove/switch, relay deck scroll+arrows+activate/deactivate, KPIs,
   range selector), Providers (every card action, 5-step add dialog, every
   preset auto-fill, embedded panel buttons, dup/empty-field errors, dual-key
   write), Models add+remove on EVERY surface (overview card, providers
   dialog, settings model editor + reasoning panel + model manager,
   wizard), Graphs (generate real proxy traffic incl. a failing call, verify
   overview line chart + provider usage + activity page charts + filters +
   honest empty states), agent switching isolation, plugins add/remove,
   MCP local/remote/expert + invalid-JSON and all error paths, connection
   error red paths, build pipeline (idempotent, backup-first), edge cases
   (persistence, keyboard, responsive, zero console errors, secrets hygiene).
3. Restore + hash-verify + write the report table, fix any FAILs (check ->
   fix -> check loop), do NOT commit anything.

Discipline: backup-first, snapshot -> click -> hash-verify restore,
No-Secrets (never echo keys), zero-console-error rule, report every FAIL.
```
