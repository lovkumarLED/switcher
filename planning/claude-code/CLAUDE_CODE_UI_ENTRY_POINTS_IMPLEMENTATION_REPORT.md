# Claude Code UI Entry Points — Implementation Report

Status: **Implemented, fixture-green, live click-through passed**
Date: 2026-08-16 (session 43)
Lifecycle: **Integrated, not live validated** (unchanged)
Commits: none

## 1. What was implemented

Claude Code now has real entry points in the existing app UI with **no
UI/UX change** (same tiles, colors, components, patterns):

1. **Onboarding "Connect your agent" screen:** the Claude Code tile is now
   always offered alongside OpenCode and KiloCode (same tile style,
   `agent-tile--claude` + bundled `claudecode.svg`). It no longer depends on
   the lock-gated `/api/claude/discover` probe.
2. **Summary line:** selecting the Claude Code tile runs the new lock-free
   `GET /api/claude/scan` and shows the same line pattern with **real counts**
   from app-owned state: `Scanned Claude Code: 1 providers · 0 MCP servers ·
   0 plugins` (the providers slot carries the app's saved routing profiles —
   currently the single "omniroute" route; MCP/plugins are never managed for
   Claude Code and honestly report zero).
3. **Agent switcher toggle:** the Providers-page toggle now has three tabs
   (OpenCode / KiloCode / Claude Code). Clicking Claude Code calls the now
   lock-free `POST /api/claude/connect` and switches the **whole app** to
   Claude mode (sidebar Routes, Integrations hidden, Claude overview/settings).
4. **Claude stays a separate page:** never a provider tile/card in the
   universal grid; the routes page is unchanged.

## 2. Backend changes (`app/app/claude_adapter.py`)

- `POST /api/claude/connect` no longer requires `_require_unlocked` or the
  settings-target probe. It only registers `claude-code` in the **app's own**
  `state.json` via `agentstore.upsert_agent` — zero Claude-file access. This
  is required so the wizard can land on the Claude page with both locks
  closed.
- New `GET /api/claude/scan` — lock-free, reads only the app-owned saved-route
  store. Returns `agent`, `split`, `hasBuilder`, `mcps`, `plugins`,
  `providers` (saved route names), `activeProviders`, `savedRoutes`,
  `appliedRouteId`, `realTargetLocked`. Never probes or reads Claude files.
- The real-target lock is **not weakened**: `ALLOW_REAL_CLAUDE_TARGET = False`
  stays; apply / restore / route CRUD stay 503-gated while locked.

## 3. Frontend changes

| File | Change |
|------|--------|
| `app/assets/js/core/api.js` | added `claudeScan()` client |
| `app/assets/js/pages/onboarding.js` | unconditional Claude tile; real scan via `claudeScan()`; summary note (same template); continue guard for claude-code; "Connecting Claude Code…" message |
| `app/assets/js/pages/provider-workspace.js` | third tab `data-provider-agent="claude-code"` |
| `app/assets/js/pages/providers.js` | `displayNames` + `activeAgentId` + `switchProviderAgent` claude branch (`claudeConnect`); dispatches `ai-switcher:agent-changed` when entering/leaving Claude mode so capabilities refresh |
| `app/assets/js/main.js` | `AGENT_DISPLAY` gains `"claude-code": "Claude Code"` |

OpenCode/Kilo behavior, registry, and tests untouched.

## 4. Test changes

- `app/tests/test_claude_adapter.py`: `test_locked_every_mutation_and_
  metadata_endpoint` no longer expects connect to 503 (it no longer touches
  the real target); + 3 new tests (connect registers app state while locked
  without probing; scan reports saved routes without real access; scan locked
  reports app state + lock flag).
- `app/tests/capability_ui_contract.test.mjs`: onboarding test now asserts the
  unconditional tile + `claudeScan` + summary-line template.
- `app/tests/providers_visual_contract.test.mjs`: tabs test now asserts the
  claude-code tab; new `switchProviderAgent` claude-connect branch test.
- `app/tests/claude_routes_contract.test.mjs`: new "Claude Code tab is a
  separate page entry, never a provider action" test.

## 5. Verification (fresh)

| Suite | Result |
|-------|--------|
| Focused frontend (claude_routes + capability_ui) | 37/37 |
| providers_visual_contract | 12/12 |
| Full frontend (`node --test .\tests\*.test.mjs`) | 122 tests, 121 pass — only the accepted onboarding-copy baseline (stale `anthropic/claude-3.5-sonnet` assertion in frontend_review) |
| Focused Python (test_claude_adapter + test_capabilities) | 97/97 |
| Full Python (`unittest discover`) | 181 tests, 2 failures — only the accepted `test_preferences` baselines |
| Gate 2 (`test-claude-code.ps1`) | 65 passed, 0 failed |
| Gate 3 (`test-provider-model.ps1`) | OVERALL PASS |
| OpenCode (`test-opencode-v2.7.ps1`) | 35/35 (session 42 had already added the apiModelId test) |
| Kilo (`test-kilo-v1.ps1`) | 32/32 |
| node --check on changed JS | 5/5 OK |
| git diff --check | 0 |
| secrets scan on changed files | 0 hits |
| Locks | `ALLOW_REAL_CLAUDE_TARGET = False`; `settingsPresent: null` throughout |

## 6. Live click-through (`http://127.0.0.1:9090`, server restarted with new code)

1. Welcome → "Set up your workspace" → "Connect your agent" shows OpenCode,
   KiloCode, **Claude Code** tiles + manual option.
2. Click Claude Code tile → `Scanned Claude Code: 1 providers · 0 MCP servers
   · 0 plugins` (real count from the app-owned route store), Continue enabled.
3. Continue → review ("Providers 1") → "Use this workspace" → "Claude Code
   connected" → Open dashboard.
4. Whole app in Claude mode: sidebar **Routes** (Integrations hidden),
   "Claude Code" chip, Claude overview (lock: Locked), Routes page shows the
   saved omniroute card, Settings shows Claude Code settings.
5. Wizard back to OpenCode → Providers page shows the three-tab toggle →
   click **Claude Code** tab → whole app switches back to Claude mode.
6. Active agent restored to opencode afterwards; console: 0 errors;
   OpenCode/Kilo unaffected (relay, chips, integrations intact).

## 7. Notes / decisions for the owner

1. **Return path from Claude mode** uses the wizard ("Set up your workspace"),
   because the Claude page intentionally has no toggle — consistent with
   "Claude stays a separate page". The Claude Code tab lives on the
   OpenCode/Kilo workspace only. (One-line change if the owner wants the tabs
   on the Claude page too.)
2. **Route CRUD stays 503-gated** while the lock is closed (existing Gate 4
   behavior, untouched) — the routes page is view-only until Gate 5.
3. **Summary copy:** the line reads "N providers" with the saved-route count
   in the providers slot, exactly per the requested pattern. If the owner
   prefers "N routes", it is a one-line change in `onboarding.js`.
4. **`claude_connect` lock change:** it no longer requires the real-target
   lock because it performs zero Claude-file access (app-owned `state.json`
   only). This is what allows the wizard to land on the Claude page while both
   locks are closed. Apply/restore are still gated.
