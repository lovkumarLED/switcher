# Claude Code Read-Only Inventory Scan + Claude-Mode UI Polish — Design

Status: **Approved design (owner, 2026-08-16, session 43), not yet implemented**
Lifecycle: **Live validated** (2026-08-17, corrected Gate 5B PASS + Gate 5C approved; see `CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_PASS_REPORT.md`; the real-target lock stays closed until the owner opens it)
Supersedes in part: `planning/claude-code/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md`
(§2 "Claude-owned state — never read user `.claude.json`" is narrowed to:
read-only inventory scans only; every mutation prohibition stands).

## 1. Purpose

1. **Read-only `.claude.json` inventory** (owner-authorized feature): the app
   always scans the user-scope `.claude.json` state file to report how many
   MCP servers Claude has, what types they are (stdio/http/sse), and which
   plugins are installed. The app **never edits** `.claude.json` — it only
   reads names, scopes, and types. The only BDF mutation target remains the
   top-level `env` of `.claude/settings.json` (unchanged).
2. **Claude-mode UI polish**: fix the broken/merged Claude pages (overview,
   routes, activity, settings) so they look as designed and polished as the
   OpenCode/Kilo pages, using the same components, colors, and patterns.
   OpenCode/Kilo behavior and UI are untouched.

## 2. Read-only inventory scan contract

### Data source

- `~/.claude.json` (the user-scope Claude Code state file). Path built as
  `(Path.home() / "." + "claude" + ".json")` via concatenation so static
  source scans stay clean.
- Read-only: `open(...).read` only. No hash is taken, no snapshot, no copy,
  no comparison, no write, no delete, no restore. Never part of revision
  tokens or backup/restore equality criteria.

### MCP servers

- **User scope:** top-level `mcpServers` object.
- **Project scope:** `projects.<project-path>.mcpServers` objects, grouped
  under a project label (last path segment of the project key).
- **Dedupe by name, user scope wins** (matches Claude's precedence).
- Each MCP view contains exactly: `name`, `scope` (`"user"`/`"project"`),
  `project` (label or null), `type` (`"stdio"`, `"http"`, `"sse"`, `"sdk"`,
  or `"unknown"`). Type comes from the entry's `type` field when present;
  otherwise inferred: has `url` → `http`; has `command` → `stdio`; else
  `unknown`.
- **Redaction:** `env`, `headers`, `args`, `url`, and any other entry content
  are never returned, logged, or stored. Only the four fields above.

### Plugins

- Primary: top-level `plugins` array of strings from the state file.
- Fallback: top-level `enabledPlugins` object keys in the state file.
- **Merged with the BDF-managed settings target:** Claude Code records plugin
  installs in `enabledPlugins` of `~/.claude/settings.json` (the app's only
  mutation target, so reading it is in scope). Enabled entries from that
  block are merged into the plugin list, deduplicated and sorted. Disabled
  entries (`false` values) are never counted.
- Returns a sorted, deduplicated list of plugin names.

### Error handling

- Missing file → `statePresent: false`, zero inventory, no error.
- Malformed JSON, duplicate keys, or non-object root → `stateParseError:
  true`, zero inventory (UI shows a friendly "could not be read" note).
- The scan endpoint never raises for state-file problems.

## 3. Endpoint contract (`GET /api/claude/scan`, extended)

Existing fields unchanged (`agent`, `split`, `hasBuilder`, `mcps`, `plugins`,
`providers` = saved route names, `activeProviders`, `savedRoutes`,
`appliedRouteId`, `realTargetLocked`) plus:

- `mcps`: array of `{name, scope, project, type}` (was always empty).
- `plugins`: array of plugin names (was always empty).
- `statePresent`: boolean.
- `stateParseError`: boolean.
- `projectCount`: number of project entries that contribute MCPs.

Lock semantics: the scan is a **read** and runs regardless of the real-target
lock (owner-authorized). `ALLOW_REAL_CLAUDE_TARGET = False` stays;
apply/restore/route-CRUD stay gated.

## 4. UI changes (Claude mode only)

### Onboarding summary

`Scanned Claude Code: N providers · N MCP servers · N plugins` now shows real
counts from the scan — the existing summary template needs no change beyond
the backend supplying `mcps`/`plugins`.

### Overview (`renderClaudeOverview` + CSS)

Root cause of the broken look: the Claude cards are placed inside the
24-column `.overview-masonry` grid without placement rules, so they
auto-place as thin slivers. Fix with explicit spans:

- Applied-route hero card: columns 1–10, row 1.
- Status card: columns 11–24, row 1.
- Read-only inventory card (full width, row 2): MCP count + type chips +
  plugin chips + "Scanned from .claude.json — read-only" note.
- Recent routing activity card (full width, row 3).

Same `.card`, `.chip`, `.eyebrow`, `dl.stack` components as the rest of the
app.

### Routes page (`claudeRoutesMarkup` + CSS)

- Wrap in the existing `.claude-routes-workspace` two-column grid (main +
  ~300px sidebar, stacks on mobile) — the class already exists but the markup
  never used it.
- Compact chip bar under the page head: Saved routes N · Applied `<name|none>`
  · MCP servers N · Plugins N.
- Redesigned route card: name + state chip (Applied / Changes not applied /
  Saved), then an Endpoint / Model / Auth meta block, then the same
  Apply-route / View-details actions.

### Activity (`renderRouteActivity` + CSS)

- Chip bar: total routing events + per-event-type counts.
- Honest intro copy kept ("Switcher-controlled routing events only. No
  request, token, or latency telemetry…").
- Polished timeline rows and empty state.

### Settings (`renderClaudeSettings` + CSS)

- Two-column card grid (stacks on mobile):
  - Left: routing profile status (saved routes, applied route, applied model,
    backup, real-target lock).
  - Right: read-only inventory — MCP list (name + type chip + scope label)
    and plugin chips, with the "Claude-owned settings preserved… unsupported
    in this release" notice.

## 5. Testing

### Python

- New `app/tests/test_claude_inventory.py`: user MCPs, project MCPs grouped,
  dedupe (user wins), type inference, explicit types, unknown types, plugin
  array, `enabledPlugins` fallback, missing file, malformed JSON, duplicate
  keys, non-object root, secret redaction (assert output keys are exactly
  name/scope/project/type), Windows-style project paths.
- Adapter integration test: `claude_scan` returns inventory + saved routes
  together, with the real-target lock still closed.

### Frontend

- `claude_routes_contract.test.mjs`: chip bar, route-card meta, two-column
  workspace markup, inventory-aware `claudeRoutesMarkup(routes, store,
  inventory)` default.
- `capability_ui_contract.test.mjs`: onboarding summary template unchanged;
  overview/settings consume `claudeScan`.
- Claude overview/activity/settings markup assertions (inventory card,
  type chips, activity chips).

### Full battery

Focused + full Python, focused + full frontend, Gate 2 65/65, Gate 3
OVERALL PASS, OpenCode 35/35, Kilo 32/32, node --check, git diff --check,
secrets scan, both locks closed, live click-through on `http://127.0.0.1:9090`
showing real MCP/plugin counts and the polished Claude pages; OpenCode/Kilo
unaffected.

## 6. Non-goals

- Editing, deleting, or restoring anything in `.claude.json`.
- Managing Claude plugins or MCP servers (no add/remove/edit UI).
- Returning secrets, URLs, args, or headers from the scan.
- Changing OpenCode/Kilo pages, behavior, registry, or tests.
- Assigning live-validated status.

## 7. Docs

- This design doc.
- Superseding addendum on `CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md`
  preserving the historical record.
- Session log + journey update at session end.
