# Claude Code UI Entry Points — Continuation Handoff

> **Status:** Work-in-progress, owner-directed. Nothing committed.
> **Owner rule:** Do NOT change the overall UI/UX. Make edits on the current
> UI/UX only — same color scheme, same patterns, same components, same flow.
> Claude Code gets a separate page, not a provider tile.

## 1. Where we are right now

The Claude Code adapter is fully implemented and green on fixtures, but it has
**no entry point in the app UI**. The owner clicked through the live app and
confirmed:

- The onboarding "Connect your agent" screen shows only OpenCode and KiloCode
  tiles (no Claude Code tile).
- The manual-folder dialog rejects `C:\Users\loveb\.claude` with
  "No main .json config found ... .jsonc files are never scanned".
- The dashboard sidebar shows only Overview / Providers / Activity /
  Integrations / Settings — no Claude Code entry.
- The agent switcher (provider page) has only the OpenCode/Kilo toggle.
- Backend confirms why: `/api/agents` lists only `opencode`, `kilo`,
  `import-test`; `/api/claude/discover` returns `detected: null` while the
  real-target lock is closed (`ALLOW_REAL_CLAUDE_TARGET = False`).

The Claude routes page itself works (frontend contract tests 35/35;
`/api/claude/routes` returns 200 with the saved loopback route "omniroute" at
`http://localhost:20128/v1`). It is just not reachable from the UI.

Nothing is broken in the OpenCode/Kilo paths (OpenCode 34/34, Kilo 32/32).

## 2. What the owner wants (exact requirements)

1. **Onboarding "Connect your agent" screen:** add a **Claude Code** option
   alongside OpenCode and KiloCode (same tile style/pattern). When selected
   and the wizard continues, it must land on the **Claude Code page**.
2. **Agent switcher (provider page toggle):** add **Claude Code** to the same
   toggle that switches OpenCode/Kilo. Selecting Claude Code switches the
   whole app to the Claude Code page (routing profiles), like switching to
   Kilo switches everything to Kilo.
3. **Discovery summary line:** when Claude Code is selected/detected on the
   "Connect your agent" screen, show a summary like the others — e.g.
   "Scanned Claude Code: N providers · N MCP servers · N plugins" — in the
   same style OpenCode/Kilo use.
4. **Claude Code is a separate page** (not a provider in the universal grid).

## 3. Key architecture facts (verified this session)

- Capabilities drive the UI: `app/app/capabilities.py` maps canonical agent
  names; `claude-code` → `providerMode: "scalar-route"`; OpenCode/Kilo →
  `"multi-provider"`.
- `app/assets/js/core/capabilities.js` — `isClaude()` checks
  `caps.providerMode === "scalar-route"`; `navigationFor()` already renames
  "Providers" → "Routes" and hides Integrations for Claude.
- `app/assets/js/pages/provider-workspace.js` line ~224: `if (isClaude()) {
  renderClaudeRoutes(workspace); }` — the workspace already knows how to
  render Claude routes; it's just never reached because the active agent is
  never `claude-code`.
- Onboarding: `app/assets/js/pages/onboarding.js` `loadDiscovery()` (line
  ~255) adds a Claude tile ONLY when `api.claudeDiscover().detected` is
  truthy — which is `null` while the lock is closed. `scanChosenAgent()`
  (line ~272) already handles `resolved.id === "claude-code"` and produces
  the scan result; the summary line "Scanned X: N providers · N MCP · N
  plugins" is rendered on the agent step.
- Backend connect flow exists: `POST /api/claude/connect` registers
  `claude-code` via `agentstore.upsert_agent(...)` and returns
  `{"ok": True, "active": "claude-code"}` — but it requires the lock open
  (`_require_unlocked`) and the settings target present.
- The saved route store lives at Git-ignored `app/state/claude-routes.json`
  (version 1, one route, no applied route).

## 4. What to implement (next session)

Owner-approved direction; keep UI/UX identical in style. Suggested files:

- `app/assets/js/core/sidebar.js` — add a Claude Code navigation entry
  (same pattern as Overview/Providers/...), visible in both modes or
  shown always.
- `app/assets/js/core/router.js` — route the Claude destination to
  `renderClaudeRoutes`.
- `app/assets/js/pages/onboarding.js` — make the Claude Code tile appear on
  the "Connect your agent" screen unconditionally (or via a dedicated
  connect/discover probe that doesn't require the lock), with the same tile
  style; on selection show the same summary line pattern; wire the wizard
  to the Claude page after "Skip/Continue".
- `app/assets/js/pages/provider-workspace.js` / agent switcher — add Claude
  Code to the OpenCode/Kilo toggle; on select, switch the active agent to
  `claude-code` (via `/api/claude/connect` or the agent-switch contract) and
  render the Claude routes page.
- Backend (only if needed): a lock-free "detected/connectable" probe for the
  onboarding tile and a scan summary for the Claude agent
  (`/api/claude/scan` or reuse connect + routes) so the summary line shows
  real counts without touching real Claude state. Do not weaken the
  real-target lock: apply/restore stay gated; viewing routes stays open.

Constraints:

- Do not touch OpenCode/Kilo behavior, registry, or tests.
- Do not read/hash/copy real Claude files; keep both locks closed; no
  `-AllowRealTarget`; no commits without the owner's say-so.
- Keep the exact lifecycle status `Integrated, not live validated`.
- Follow existing UI patterns (buttons, tiles, toggles, summary chips,
  colors) exactly — no redesign.

## 5. Test expectations after the change

- Frontend contract suites stay green (claude_routes 35/35,
  capability_ui 21/21) and gain new tests for the new entry points.
- Focused Python stays 94/94; full Python 178 with only the 2 accepted
  preference baselines; full frontend 114 with only the 1 accepted
  onboarding-copy baseline; Gate 2 65/65; Gate 3 OVERALL PASS; OpenCode
  34/34; Kilo 32/32.
- Manual click-through on `http://127.0.0.1:9090` proving: Claude Code tile
  on onboarding → wizard lands on Claude page; toggle switches to Claude
  page; summary line shows counts; OpenCode/Kilo unaffected.

## 6. Session log / journey updates

See `_agent/SESSION_LOG.md` (session 42 entry) and
`_agent/JOURNEY_TO_V3.md` (Current Position updated to the Claude Code UI
entry-points work; Phase 15 = Claude Code + more agents still PLANNED).

## 7. Gate ledger (unchanged)

Complete: Gate 1, 2 (65/65), 3, 4A, 4B, 5A.2 (route provisioned).
Not passed (safe, restored): 5B, 5B.1, 5B.2, 5B.3, 5B.4 (HARD_FAILURE,
historical, superseded by the env-only scope correction).
Unauthorized: corrected Gate 5B live validation, Gate 5C, credential UX fix.
Nothing committed.
