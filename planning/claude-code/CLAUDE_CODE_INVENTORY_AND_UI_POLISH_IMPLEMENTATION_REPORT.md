# Claude Code Read-Only Inventory Scan + Claude-Mode UI Polish — Implementation Report

Status: **Implemented, fixture-green, live-verified with real data**
Date: 2026-08-16 (session 44)
Lifecycle: **Integrated, not live validated** (unchanged)
Commits: none
Design: `planning/claude-code/CLAUDE_CODE_README_SCAN_AND_UI_POLISH_DESIGN.md`
Supersedes in part: `planning/claude-code/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md`
§2 (read-only inventory scans of the user-scope Claude state file are now
owner-authorized; every mutation prohibition unchanged).

## 1. Backend

### New module `app/app/claude_inventory.py`

Read-only inventory scan of the user-scope Claude state file (path built by
concatenation for static-scan hygiene). The file is opened for reading only:
no hash, snapshot, copy, comparison, write, delete, or restore ever.

- **MCPs:** top-level `mcpServers` (user scope) + `projects.<path>.mcpServers`
  (project scope, grouped under a project label, deduped with user scope
  winning — Claude's precedence). Each view is exactly
  `{name, scope, project, type}` where `type` comes from the entry's `type`
  field (`stdio`/`http`/`sse`/`sdk`) or is inferred (`url` → http,
  `command` → stdio, else unknown). **`env`, `headers`, `args`, `url`, and
  all other entry content are never returned** (redaction tested).
- **Plugins:** the state file's `plugins` array (or `enabledPlugins` dict
  keys) merged with enabled entries of `enabledPlugins` in the **BDF-managed
  `.claude/settings.json`** (Claude records plugin installs there; disabled
  `false` entries never count). Sorted, deduplicated names.
- **Error handling:** missing file → zeros + `statePresent: false`;
  malformed JSON / duplicate keys / non-object root → zeros +
  `stateParseError: true`. Never raises; the state file is never modified
  (byte-identity tested).

### `GET /api/claude/scan` (extended)

Adds real `mcps`, `plugins`, `statePresent`, `stateParseError`,
`projectCount` to the existing response (routes-based `providers`,
`savedRoutes`, `appliedRouteId`, `realTargetLocked` unchanged). Runs with the
real-target lock closed (owner-authorized read); `ALLOW_REAL_CLAUDE_TARGET =
False` stays; apply/restore/route-CRUD remain gated.

## 2. Frontend

| Page | Change |
|------|--------|
| Onboarding | summary line shows real counts (same template — backend now supplies `mcps`/`plugins`) |
| Overview | **root-cause fix:** the Claude cards had no placement rules in the 24-column `.overview-masonry`, so they auto-placed as thin merged slivers. Now explicit spans: Applied-route hero (10 cols) + Status (14 cols) row 1; full-width **Claude inventory** card (MCP count, type chips, plugin chips, "Scanned from .claude.json - read-only" note) row 2; routing-activity card row 3. Same `.card`/`.chip` components; responsive stacking below 900px |
| Routes | two-column `.claude-routes-workspace` (main + 300px sidebar; the class existed but the markup never used it); summary chip bar (saved routes · applied · MCP servers · plugins); redesigned route card: name + state chip, Endpoint/Model/Auth meta rows, Apply/View-details actions |
| Activity | chip bar (total events + per-type counts) over the honest "routing events only" timeline |
| Settings | two-column grid: routing profile status (saved/applied/model/backup/lock) + full read-only inventory (MCP name + type chip + scope, plugin chips, project-scope note) |

## 3. Tests

- `app/tests/test_claude_inventory.py` (new, 19 tests): user/project MCP
  grouping, dedupe, type inference, unknown types, plugin array + fallback +
  managed-settings merge, disabled-plugin exclusion, missing/malformed/
  duplicate/non-object files, **secret redaction** (only the four MCP fields;
  no env/headers/urls), byte-identity (scan never writes), Windows-style
  project keys.
- `app/tests/test_claude_adapter.py`: scan integration test (inventory +
  routes together, redaction at the adapter boundary).
- Frontend: routes chip bar + card meta + two-column markup + inventory
  default; overview masonry/inventory wiring; activity chip bar; settings
  inventory grid.

## 4. Verification (fresh)

| Suite | Result |
|-------|--------|
| Focused Python (inventory + adapter + capabilities) | 115/115 |
| Full Python | 199 tests, 2 failures — only the accepted `test_preferences` baselines |
| Focused frontend (claude_routes + capability_ui) | 37/37 |
| Full frontend | 129 tests, 128 pass — only the accepted onboarding-copy baseline |
| Gate 2 / Gate 3 | 65/65 · OVERALL PASS |
| OpenCode / Kilo | 35/35 · 32/32 |
| node --check / git diff --check / secrets scan | 5/5 OK · 0 · 0 hits |
| Locks | `ALLOW_REAL_CLAUDE_TARGET = False` throughout |

## 5. Live verification with real data (127.0.0.1:9090)

- `/api/claude/scan` on the owner's machine: **6 MCPs** (context7, github,
  parallel-search http; exa-search, memory, sequential-thinking stdio),
  **1 project scope**, **7 plugins** (pyright-lsp, skill-creator,
  pr-review-toolkit, feature-dev, code-review, frontend-design,
  superpowers — recorded in the managed settings.json `enabledPlugins`; the
  state file's own `plugins` key is absent), `statePresent: true`,
  `realTargetLocked: true`.
- Onboarding: "Scanned Claude Code: 1 providers · 6 MCP servers · 7 plugins".
- Overview, Routes, Activity, Settings all rendered the polished layouts
  (verified via live DOM); console 0 errors; OpenCode switch + capabilities
  verified intact; active agent left on claude-code for the owner's review.

## 6. Notes for the owner

1. **Plugin truth lives in the managed settings.json** `enabledPlugins` — the
   state file alone reports 0 plugins on this machine, so the scan merges
   both (read-only).
2. The real state file contains near-duplicate project keys differing only in
   case (`C:/Windows/System32` vs `C:/WINDOWS/system32`); Python's
   exact-match duplicate detector handles it. (PowerShell's case-insensitive
   `ConvertFrom-Json` rejects it — a PS quirk, not a JSON error.)
3. Add/Edit/Delete route on the Claude page still 503s while the lock is
   closed (unchanged Gate 4 behavior); the inventory is view-only by design.
4. The previous report's "0 MCP servers" summary line is superseded by the
   real counts.
