# Claude Code Gate 4 App Integration and Documentation Handoff (Revision 7)

> For the assigned worker: implement the Claude Code app integration per the
> user-approved adaptive interface design
> (`planning/claude-code/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md`) and this handoff. Gate
> 4 work only. Gate 5 is not authorized. Do not commit, stage, push, merge,
> reset, clean, move, or delete anything.

**Assigned worker:** DeepSeek V4 Flash Max

**Effort:** Max

**Date:** 2026-08-14

**Revision:** 7 (review corrections only: restores the section 18 path-check
source, replaces whole-file ASCII requirements for modified files with the
Gate 4B documentation-only added-line ASCII rule and the honest
`GATE4B_DOC_ADDED_DIFF_ASCII_OK` marker, requires exact command RED/GREEN
evidence per section 22 with the Gate 4A precursor report authoritative for
Gate 4A tasks, and corrects the self-referential report-hash requirement and
the historical-decision wording to tracked-content identity with the
LF-normalized block hash. No new implementation scope.)

## 1. Goal and user-visible outcome

Switcher gains Claude Code as a separate, narrow, scalar routing adapter
without any visual redesign of the app shell. When the active agent is
OpenCode or KiloCode, every existing page, control, and feature works
unchanged. When Claude Code is active, only capability-dependent content
changes: navigation labels, hidden destinations, page content, and data.

After Gate 4:

- A central capability contract drives all pages; no page invents independent
  agent checks.
- Connect Your Agent auto-detects Claude Code through a dedicated structural
  settings-target check; the generic agent registry no longer contains a
  Claude entry.
- The Providers page becomes `Claude routes`: multiple saved routing profiles,
  exactly one applied route, apply through the approved production
  transaction, applied-route deletion rejected.
- Overview shows applied-route status; Activity becomes redacted Route
  activity; Integrations is hidden and redirects safely; Settings shows only
  Claude-supported adapter settings.
- All revision-4 security and transaction contracts hold: locked endpoints,
  full SHA-256 revision tokens, dual real-target locks, manifest pop and
  prune, rollback ordering, Host/Origin protection, restore without
  current-route equivalence, runtime-state ignore rules, shared routing core,
  semantic preservation, and the "Claude-owned settings preserved" and
  restart notices.

Allowed status language after this gate: **"Integrated, not live validated."**

Never claim: "Supported", "Production ready", or "Live validated". Those
require Gate 5.

## 2. Authority and repository locations

Read in this order before implementing:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`
4. `planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md`
5. `planning/claude-code/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md` (user-approved design;
   this handoff is its executable contract)
6. `planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md`
7. `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md`
8. `planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md`
9. This handoff

Repository root: `C:\Users\loveb\.config\opencode\docs`

Verified repository facts this revision relies on:

- `app/server.py` includes every router; `app/app/serve.py` does not.
- `app/gui.html` registers one module script (`main.js`), links
  `app/assets/css/provider-workspace.css`, and contains the static sidebar nav
  with `data-route` buttons (overview, providers, activity, integrations,
  settings). `app/gui.html` is NOT modified; nav adaptation happens at runtime
  in `app/assets/js/core/sidebar.js`.
- `app/assets/js/core/router.js` validates destinations from a fixed Set and
  falls back to `overview`; `app/assets/js/core/store.js` holds global state;
  `app/assets/js/main.js` builds the `pages` map and renders routes;
  `app/assets/js/pages/overview.js` renders the provider relay and KPIs;
  `app/assets/js/pages/activity.js` renders request analytics;
  `app/assets/js/pages/settings.js` renders the model editor and BDF profile
  switcher; `app/assets/js/pages/integrations.js` renders plugins and MCP;
  `app/assets/js/pages/onboarding.js` renders Connect Your Agent from
  `api.discover`; `app/assets/js/pages/provider-workspace.js` renders the
  provider deck.
- `app/app/agents.py` already exposes the app state contract:
  `POST /api/agents` and `POST /api/agents/switch`.
- `app/app/config.py` `AGENT_REGISTRY` contains a generic `claudecode` entry
  with `main: [".claude.json", "settings.json"]` (line 28) that Gate 4
  removes.
- `app/engine/claude-code/test-claude-code.ps1` contains three source-text
  tests that must move to the shared core (section 4.4).
- No root `schemas/` directory exists. The only adapter schema is
  `app/engine/schemas/claude-code-routing.schema.json`.
- `bdf/VERSION.md` current version is 2.2.11; Minor means additive changes.
- `app/.gitignore` does not ignore a new `app/state/` directory.
- No automatic PROJECT_STATE generator script exists in the repository.
- The app test pattern is `unittest` with `unittest.mock.patch` calling route
  functions directly.
- The app binds `config.HOST = "127.0.0.1"`, `config.PORT = 9090`.

## 3. Exact file scope

The worker may create or modify ONLY the files listed in this section. No
alternatives, no "or", no "and/or", no "as needed". No worker may decide file
scope during implementation.

### 3.1 Gate 4A - backend (4 files)

| # | Path | Change |
|---|---|---|
| B1 | `app/app/claude_adapter.py` | Create. Separate Claude adapter: dedicated structural discovery, saved-route store with applied-config fingerprint, route CRUD/apply, restore orchestration, route activity log, manifest lifecycle (cap, pop, prune), full SHA-256 revision tokens, Host/Origin endpoint protection, concurrency lock, HTTP-layer safety lock, `get_profile_root()` injectable dependency. No clear-applied-route endpoint exists. Never parses `.claude.json` (state-leaf guard built by string concatenation). Never calls OpenCode/Kilo registry or `agentstore.py` provider/model functions |
| B2 | `app/app/capabilities.py` | Create. Single backend capability source of truth: the exact matrix of the design document section 2.1 (including `builderAvailable`) keyed by canonical agent type, plus the single canonicalization function `canonical_agent_type(name)` with the mapping `opencode -> opencode`, `kilo -> kilo`, `kilocode -> kilo`, `claudecode -> claude-code`, `claude-code -> claude-code`, and `router` with `GET /api/capabilities` returning `{ agent, canonicalType, displayName, capabilities }` for `agentstore.active_agent_name()`. Persisted legacy alias `claudecode` is supported without rewriting or losing the existing entry. No Claude-state access |
| B3 | `app/app/config.py` | Modify. Remove the `claudecode` entry from `AGENT_REGISTRY` (exact deletion of line 28). Add `CLAUDE_ROUTES_FILE = APP_DIR / "state" / "claude-routes.json"`, `CLAUDE_MANIFEST_FILE = APP_DIR / "state" / "claude-backup-manifest.json"`, `CLAUDE_ACTIVITY_FILE = APP_DIR / "state" / "claude-activity.jsonl"`, and the exact structural tuple `CLAUDE_SETTINGS_REL = (".claude", "settings.json")` |
| B4 | `app/server.py` | Modify. Import `from app.claude_adapter import router as claude_router` and `from app.capabilities import router as capabilities_router`; include both beside the existing includes |

### 3.2 Gate 4A - shared routing core, entry points, harness (4 files)

| # | Path | Change |
|---|---|---|
| P1 | `app/engine/claude-code/claude-routing-core.psm1` | Create. Single source of routing behavior: duplicate-key scan, JSON read, schema compliance, input validation, unsupported-snapshot capture, apply patch, contract verification, UTF-8 no-BOM write, and two explicit exported operations: `Invoke-ClaudeRoutingApply` and `Invoke-ClaudeRoutingRestore`, each with the boundary policy parameters `BoundaryRoot`, `TargetLeafName`, `ForbidStateLeaf`, `ForbidCommentSuffix`, `TargetMustExist`, and `TestFailureStage`. Declares `$script:CLAUDE_ROUTING_CORE_VERSION = "0.1.0"`. Restore never applies the routing contract to the restored document (section 12) |
| P2 | `app/engine/claude-code/build-claude-code.ps1` | Modify. Refactor to dot-source `claude-routing-core.psm1`. CLI contract unchanged: `-FixtureRoot`, `-RoutingProfilePath`, `-SettingsPath`, `-SchemaPath`, `-TestFailureStage`. Enforces the Gate 2 temp-boundary policy and delegates to `Invoke-ClaudeRoutingApply`. Output format remains the Gate 2 human-readable contract |
| P3 | `app/engine/claude-code/build-claude-code-production.ps1` | Create. Production entry with the exact Apply/Restore contract of section 7, the PowerShell-layer real-target lock of section 8.2, and strict JSON output |
| P4 | `app/engine/claude-code/test-claude-code.ps1` | Modify. Reviewed harness adaptation (section 4.4) with a fixed final count of 51 (43 preserved intents plus 8 named new tests) |

### 3.3 Gate 4A - frontend (13 files)

| # | Path | Change |
|---|---|---|
| F1 | `app/assets/js/core/api.js` | Modify. Add `capabilities: () => request("/api/capabilities")`, `claudeStatus: () => request("/api/claude/status")`, `claudeDiscover: () => request("/api/claude/discover")`, `claudeRoutes: () => request("/api/claude/routes")`, `createClaudeRoute: body => request("/api/claude/routes", send("POST", body))`, `updateClaudeRoute: (id, body) => request(\`/api/claude/routes/${encodeURIComponent(id)}\`, send("PUT", body))`, `deleteClaudeRoute: (id, body) => request(\`/api/claude/routes/${encodeURIComponent(id)}\`, send("DELETE", body))`, `applyClaudeRoute: (id, body) => request(\`/api/claude/routes/${encodeURIComponent(id)}/apply\`, send("POST", body))`, `restoreClaude: body => request("/api/claude/restore", send("POST", body))`, `claudeActivity: (limit = 100) => request(\`/api/claude/activity?limit=${encodeURIComponent(limit)}\`)`. No clear-applied-route client exists |
| F2 | `app/assets/js/core/capabilities.js` | Create. Central frontend consumption point: reads `store.get().capabilities`; exports `agentCapabilities()`, `isClaude()`, `isOpenCodeFamily()`, `builderAvailable()`, `navigationFor(capabilities)` (returns the exact label map and hidden destinations), `resolveDestination(destination, capabilities)` (redirects hidden destinations to `overview`). The canonical agent type comes from the backend response and is never guessed from a directory or display label. No page invents independent agent checks |
| F3 | `app/assets/js/core/store.js` | Modify. Add `capabilities: null` to the state object |
| F4 | `app/assets/js/core/router.js` | Modify. Destination validation and `navigate` consult `resolveDestination` from `capabilities.js` so hidden destinations redirect to `overview`; fallback behavior unchanged for known destinations |
| F5 | `app/assets/js/core/sidebar.js` | Modify. Add `applyCapabilityNavigation(capabilities)`: sets the Providers button label to `Routes` for Claude (restores `Providers` otherwise), hides the Integrations button for Claude (restores otherwise), hides `#globalBuildButton` when `builderAvailable` is false (restores otherwise), updates `aria-hidden` and `hidden` attributes, and is called on every agent change |
| F6 | `app/assets/js/main.js` | Modify. `refreshAgentContext` fetches status, agents, and capabilities into the store; `showWorkspace` becomes async and awaits the first `refreshAgentContext` before the first route render and sidebar adaptation (no first-render flash of hidden controls); after each agent change, awaits refreshed context before applying `applyCapabilityNavigation` and re-rendering; `renderRoute` resolves the destination through `resolveDestination` before rendering; on capability-load failure, renders the documented safe fallback with an error and never exposes Claude-incompatible controls for an active Claude agent; the global Build action is blocked while Claude is active |
| F7 | `app/assets/js/pages/onboarding.js` | Modify. Connect Your Agent merges generic discovery with the dedicated Claude discovery result (`api.claudeDiscover`); renders a Claude Code card when structurally detected; selecting Claude registers it via `api.addAgent({ name: "claudecode", dir: <structurally resolved> })` through the existing app state contract |
| F8 | `app/assets/js/pages/claude-routes.js` | Create. The Claude Routes workspace: page title `Claude routes`, one-route-applied explanation, `Add route` action, saved-route cards with `Applied`/`Saved` markers (a route is `Applied` only when its id AND canonical fingerprint match the store's applied id and fingerprint; a fingerprint mismatch renders `Changes not applied`), card actions `Apply route` (inactive) and `View details`, route editor and details dialogs (field IDs and copy in section 11), delete-applied-route disabled copy, preservation/restart/backup/restore status, revision handling, `inspectionState` rendering. No clear-applied-route action exists |
| F9 | `app/assets/js/pages/provider-workspace.js` | Modify. When `isClaude()` is true, render the Claude Routes workspace (`claude-routes.js`) instead of the provider deck; otherwise render the existing provider workspace unchanged |
| F10 | `app/assets/js/pages/overview.js` | Modify. When `isClaude()` is true, render the Claude Overview section (applied route name, endpoint configured state, active model ID, auth-reference configured state, saved-route count, latest backup availability, real-target lock state, restart notice, recent routing activity) in the same page shell; otherwise render the existing provider relay and KPIs unchanged |
| F11 | `app/assets/js/pages/activity.js` | Modify. When `isClaude()` is true, render the Route activity timeline from `api.claudeActivity` (page title `Route activity`, same shell); otherwise render the existing request analytics unchanged |
| F12 | `app/assets/js/pages/settings.js` | Modify. When `isClaude()` is true, render only Claude-supported adapter settings and routing-profile information (route list summary, applied-route state, backup/restore status, restart notice, preservation notice, unsupported-surface statement); plugin, MCP, SDK, reasoning-format, and BDF profile sections are absent; otherwise unchanged |
| F13 | `app/assets/css/provider-workspace.css` | Modify. Add styles for the Claude routes workspace: `.claude-routes-workspace`, `.claude-route-card`, `.claude-route-card--applied`, `.claude-route-card--saved`, `.claude-route-editor`, `.claude-editor-notice`, `.claude-editor-status`, `.claude-unsupported-list`, `.claude-activity-timeline`, and the dialog layout class `.claude-route-dialog`. No shared shell CSS changes |

`app/gui.html`, `app/assets/js/pages/integrations.js`, and
`app/assets/js/pages/settings-workspace.js` are NOT modified.

### 3.4 Gate 4A - app configuration (1 file)

| # | Path | Change |
|---|---|---|
| I1 | `app/.gitignore` | Modify. Add the exact rule `state/` so the runtime adapter state directory is never tracked. A test asserts generated route, manifest, and activity files never appear in Git status |

### 3.5 Gate 4A - tests (4 files)

| # | Path | Change |
|---|---|---|
| T1 | `app/tests/test_capabilities.py` | Create. Backend capability matrix tests (section 14.1) |
| T2 | `app/tests/test_claude_adapter.py` | Create. Saved-route API, apply/restore, locks, manifest, revisions, Host/Origin, activity tests (section 14.1) |
| T3 | `app/tests/claude_routes_contract.test.mjs` | Create. Claude routes workspace contract tests (section 14.2) |
| T4 | `app/tests/capability_ui_contract.test.mjs` | Create. Capability-driven UI tests: navigation labels, hidden destinations, redirects, page adaptation, agent switching (section 14.2) |

### 3.6 Gate 4B - adapter documentation namespace (5 files, all Create)

| # | Path | Purpose |
|---|---|---|
| A1 | `adapters/claude-code/README.md` | Entry point: purpose, audience, lifecycle status "Integrated, not live validated", supported and explicitly unsupported scope, saved-route model summary, reading order, implementation locations, evidence gates reached, links, status warning |
| A2 | `adapters/claude-code/ADAPTER.md` | Authoritative target contract: managed sources, exclusions and ownership boundaries, precedence limitations, scalar routing model (multiple saved routes, one applied), secret-reference policy, revision-token contract, semantic preservation and backup/atomic/verification/rollback contract, route-store and route-activity lifecycle, manifest cap and prune policy, canonical source mapping (section 5), dual real-target locks (section 8), version detection and restart expectations, release boundary |
| A3 | `adapters/claude-code/BUILDER_SPEC.md` | Executable behavior contract: command interfaces of all three scripts, the exact Apply and Restore parameter contracts, output JSON fields, exit codes, validation stages and fail-fast rules, managed patch surface, path and scope guards, duplicate-key and malformed-input handling, semantic preservation requirements, transaction order, backup, atomic replacement, post-write verification, recovery, restore verification without current-route equivalence, output redaction, fixture-only versus integrated-not-live-validated restrictions |
| A4 | `adapters/claude-code/TESTING.md` | Verification guide: fixture, unit, regression, integration, and live-validation groups; which groups each gate authorizes; isolation and privacy constraints; negative and recovery cases; expected evidence and redaction rules; documentation consistency checks; separation of passing tests from support claims |
| A5 | `adapters/claude-code/COMPATIBILITY.md` | Versioned evidence ledger: adapter core version 0.1.0, schema revision, target version 2.1.153 as observed in Gate 1, platform, evidence level per feature, precedence and reload caveats, unresolved questions, last verification date |

### 3.7 Gate 4B - generic BDF framework documents (7 files, all Modify)

| # | Path | Content |
|---|---|---|
| G1 | `bdf/FRAMEWORK.md` | Add the adapter categories: same-architecture adapter and unique bounded (patch) adapter; capability-driven unique-adapter layer; fixture-gate versus live-gate vocabulary |
| G2 | `bdf/PROJECT_ADAPTER.md` | Replace the one-adapter-per-project assumption with a project adapter plus reusable unique-agent adapter contract; retain historical statements about Claude while marking them historical |
| G3 | `bdf/AI_WORKFLOW.md` | Add the unique-adapter read order and gate-aware status checks |
| G4 | `bdf/TESTING.md` | Add generic fixture, compatibility, integration, and live-validation test groups without target-specific commands |
| G5 | `bdf/BUILDER_EVOLUTION.md` | Require adapter documentation and compatibility evidence to evolve with target-specific implementation |
| G6 | `bdf/README.md` | Summarize the hybrid architecture and link the generic contracts |
| G7 | `bdf/VERSION.md` | Framework version 2.2.11 to 2.3.0 per the versioning policy in section 16 |

Deferred to a later gate with rationale recorded in the report (not edited
now): `bdf/BLUEPRINT_ENGINE.md`, `bdf/PROJECT_GENERATOR.md`,
`bdf/NEW_PROJECT_GUIDE.md`, `bdf/MIGRATION.md`, `bdf/FRAMEWORK_LIFECYCLE.md`,
`bdf/BUILDER_PHASES.md`, `bdf/RELEASE_MANAGER.md`, `bdf/LESSONS_LEARNED.md`.

### 3.8 Gate 4B - root and shared project documentation (13 files, all Modify)

| # | Path | Content |
|---|---|---|
| D1 | `planning/DECISIONS.md` | Append the dated reversal decision: the 2026-08-08 exclusion is preserved as history and reversed only for a narrow unique routing adapter; name the preserved prohibitions; record the Gate 4 path amendment (section 5). Never rewrite the 2026-08-08 entry |
| D2 | `README.md` | Public support summary: Claude Code listed as "Integrated, not live validated"; link to `adapters/claude-code/` and the design file; keep the historical "dropped" wording as history |
| D3 | `PROJECT_STATE.md` | Regenerate manually per the honest procedure of section 15, preserving the exact 15-section template structure |
| D4 | `ROADMAP.md` | Preserve the historical Phase 11 "resolved (dropped)" row; add the narrow unique-adapter effort as a later approved direction |
| D5 | `ADAPTER.md` | Keep OpenCode project facts; add the project's use of unique adapter namespaces; do not absorb Claude details |
| D6 | `ARCHITECTURE.md` | Add the hybrid documentation and engine ownership layers and the capability-driven unique-adapter layer |
| D7 | `BUILDER_SPEC.md` | Define routing from the universal path to dedicated engine adapters; link detailed behavior out |
| D8 | `FOLDER_STRUCTURE.md` | Document `adapters/`, `adapters/claude-code/`, `app/engine/claude-code/`, and the ignored `app/state/` runtime files |
| D9 | `JSON_SCHEMAS.md` | Summarize adapter-owned schemas and link the adapter docs |
| D10 | `TESTING.md` | Summarize adapter test groups and link `adapters/claude-code/TESTING.md` |
| D11 | `CONTRIBUTING_FOR_AI.md` | Add status and gate checks before adapter edits |
| D12 | `app/README.md` | Describe Claude Code only at "Integrated, not live validated"; link adapter docs |
| D13 | `app/engine/schemas/README.md` | List the Claude routing schema as part of the integrated engine |

### 3.9 Gate 4B - templates (9 files, all Modify)

| # | Path | Paired with |
|---|---|---|
| M1 | `bdf/templates/ADAPTER.template.md` | `ADAPTER.md` |
| M2 | `bdf/templates/ARCHITECTURE.template.md` | `ARCHITECTURE.md` |
| M3 | `bdf/templates/BUILDER_SPEC.template.md` | `BUILDER_SPEC.md` |
| M4 | `bdf/templates/CONTRIBUTING_FOR_AI.template.md` | `CONTRIBUTING_FOR_AI.md` |
| M5 | `bdf/templates/FOLDER_STRUCTURE.template.md` | `FOLDER_STRUCTURE.md` |
| M6 | `bdf/templates/JSON_SCHEMAS.template.md` | `JSON_SCHEMAS.md` |
| M7 | `bdf/templates/README.template.md` | `README.md` |
| M8 | `bdf/templates/TESTING.template.md` | `TESTING.md` |
| M9 | `bdf/templates/README.md` | Template-set guide and pairing registry (update the inventory and cross-reference matrix) |

Each template gains only the generic content of section 3.7: adapter
categories, capability-driven unique-adapter layer, fixture-gate versus
live-gate vocabulary, preservation boundaries. Templates must never contain a
Claude path, Claude setting name, Claude environment-variable name, or Claude
support claim. `ROADMAP.template.md` and `PROJECT_STATE.template.md` are NOT
modified.

### 3.10 Gate 4B - report (1 file, Create)

| # | Path | Purpose |
|---|---|---|
| R1 | `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md` | Worker evidence report per section 22 |

### 3.11 Forbidden edits

Do NOT modify, move, or delete:

- `app/app/agentstore.py`, `app/app/discovery.py`, `app/app/agents.py`,
  `app/app/serve.py`, OpenCode or Kilo builders and harnesses,
  `app/engine/opencode*`, `app/engine/kilo/*`
- `app/engine/claude-code/test-provider-model.ps1`,
  `app/engine/claude-code/inspect-provider-model.ps1`, all existing fixtures
  under `app/engine/claude-code/fixtures/` and `gate3-fixtures/`,
  `app/engine/schemas/claude-code-routing.schema.json` (byte-identical)
- `app/gui.html`, `app/assets/js/main.js` page-map core (only the specified
  additive changes in F6 are allowed), `app/assets/js/pages/integrations.js`,
  `app/assets/js/pages/settings-workspace.js`, `app/assets/js/pages/settings-model-editor.js`,
  `app/assets/js/core/dialog.js`, `app/assets/js/core/motion.js`,
  `app/assets/js/core/custom-select.js`, `app/assets/js/core/about.js`
- `release_registry.json`, generated regions of `CHANGELOG.md`,
  `CURRENT_RELEASE.md`, generated version rows, generated release artifacts
- `_agent/SESSION_LOG.md`, `_agent/JOURNEY_TO_V3.md`, `_agent/SESSION_WORKFLOW.md`
- The eight deferred `bdf/*` files listed in section 3.7
- `ROADMAP.template.md`, `PROJECT_STATE.template.md`
- `planning/claude-code/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md` (created by the design
  task; read-only during Gate 4)

### 3.12 File counts

- Gate 4A: 26 files (B1-B4, P1-P4, F1-F13, I1, T1-T4); 10 created (B1, B2,
  P1, P3, F2, F8, T1-T4), 16 modified (B3, B4, P2, P4, F1, F3-F7, F9-F13, I1).
- Gate 4B: 35 files (A1-A5, G1-G7, D1-D13, M1-M9, R1); 6 created (A1-A5, R1),
  29 modified (G1-G7, D1-D13, M1-M9).
- Total: 61 files; 16 created, 45 modified.
- The six pre-implementation corrections do not change these counts: the
  clear-applied-route endpoint is removed from the API surface (no file
  change), the applied-config fingerprint and canonical identity live inside
  the already-scoped modules, the route-store/activity transaction is a
  behavior contract on the already-scoped files, and the first-render and
  Build-button adaptations are part of the already-scoped `main.js`,
  `sidebar.js`, and `capabilities.js` changes.

## 4. Shared routing core architecture and fixed Gate 2 count

### 4.1 Decision

One shared PowerShell routing core is the single source of routing behavior for
both entry points. Apply, restore, validation, backup, atomic-replace,
verification, and recovery logic exist exactly once, in PowerShell, in
`app/engine/claude-code/claude-routing-core.psm1`. Python never re-implements
patch logic; the Python adapter performs only interface validation (Pydantic
request schemas), path resolution, subprocess invocation with array arguments,
saved-route and manifest bookkeeping, revision handling, Host/Origin checks,
and response shaping.

### 4.2 Entry points

- `build-claude-code.ps1` (fixture entry, Gate 2 contract): keeps its exact
  CLI, its temp-boundary policy, and its human-readable output contract; it
  delegates apply behavior to `Invoke-ClaudeRoutingApply`.
- `build-claude-code-production.ps1` (production entry): accepts only the
  server-resolved target. `-SettingsPath` must equal
  `-ProfileRoot\.claude\settings.json` exactly (case-insensitive). No
  client-supplied filesystem target ever reaches this script.

### 4.3 Why not alternatives

- Reusing the fixture entry for production writes: impossible without weakening
  the Gate 2 temp-boundary guarantee.
- A separate Python implementation of the patch logic: rejected because it
  duplicates one source of routing behavior across languages.
- Inlining the core into both scripts: rejected because it duplicates the logic
  twice in PowerShell and allows drift.

### 4.4 Gate 2 harness adaptation with a fixed final count

1. All 43 existing test intents are preserved. Before adaptation, the worker
   records the full list of the 43 test names; the report proves every
   original name or intent remains represented.
2. The three source-structure tests are rewritten to target the shared core
   seams in `claude-routing-core.psm1` with the same intents.
3. Eight named new tests are added (exact N, no worker discretion):
   - "G2-6 wrapper imports shared core"
   - "G2-6 wrapper CLI contract preserved"
   - "G2-6 wrapper temp boundary preserved"
   - "G2-6 core module static safety"
   - "G2-6 wrapper mutant references core safely"
   - "G2-6 core verify-contract seam rejects corrupt output"
   - "G2-6 core replacement bookkeeping is conservative"
   - "G2-6 core boundary cleanup failure restores target"
4. The synthetic replacement-cleanup mutant copies `claude-routing-core.psm1`
   beside itself or imports it by absolute path from the temporary test root.
5. The static-safety path list is extended to include `claude-routing-core.psm1`
   and `build-claude-code-production.ps1`, and the path count is updated.
6. **The final Gate 2 expected count is fixed at 51/51** (43 preserved
   intents plus the 8 named new tests). No conditional count language is used
   anywhere in Gate 4 verification or the report contract.

### 4.5 Behavioral equivalence proof

The refactor is proven by the adapted Gate 2 harness: exit 0 with 51 passed
and 0 failed. If any preserved behavioral test fails after the refactor, the
worker fixes the core (not the harness) until the suite is green before
starting any new functionality.

## 5. Routing source ownership and Gate 4 path amendment

### 5.1 Decision

- **Single authoritative saved-route store (app-owned):**
  `app/state/claude-routes.json` with the versioned shape
  `{ version: 1, appliedRouteId: null|string, routes: [...] }` per the design
  document section 4. Written only by the adapter backend using the
  storage-style atomic write.
- **Single authoritative backup manifest (app-owned):**
  `app/state/claude-backup-manifest.json`. Derived data, never hand-edited.
- **Single route activity log (app-owned):** `app/state/claude-activity.jsonl`,
  capped at 200 events (design document section 5).
- **Single adapter schema:** `app/engine/schemas/claude-code-routing.schema.json`
  (existing, unchanged). No root `schemas/claude-code-routing.schema.json` is
  created.
- **Runtime state is Git-ignored:** `app/.gitignore` gains the rule `state/`.
- **No second route source:** the research-plan canonical proposal is NOT
  created by Gate 4.

### 5.2 Required amendment task

`planning/DECISIONS.md` gains the dated Gate 4 entry stating: the Switcher app
surface treats `app/engine/claude-code/` as the canonical implementation
location and `app/state/claude-routes.json` as the canonical route source; the
research-plan root canonical proposal remains the proposal for a future
BDF-native surface and is not created by Gate 4. The same mapping is recorded
in `adapters/claude-code/ADAPTER.md` and cited in the report.

### 5.3 Drift prevention

- Exactly one route store, one manifest, one activity log, and one schema
  file exist.
- The adapter passes the packaged schema path to both entry points; the Gate 4
  tests assert the adapter constant equals the packaged path.
- The manifest records `coreVersion` and `schemaIdentity` from the production
  entry's machine-readable output (section 13); an entry whose recorded
  `schemaIdentity` differs from the packaged schema's computed SHA-256 is
  ineligible for restore.

## 6. Capability contract (design document sections 1-2)

The capability matrix of the design document is authoritative, including the
`builderAvailable` field (OpenCode true, Kilo true, Claude Code false).
Backend source of truth: `app/app/capabilities.py`; `GET /api/capabilities`
returns `{ agent, canonicalType, displayName, capabilities }` for the active
agent, where `canonicalType` comes from the single `canonical_agent_type`
function. Frontend source of truth: `app/assets/js/core/capabilities.js`.
Pages, the router, and the sidebar consume the central contract only; no page
may contain an independent `agent === "claude"` check outside
`capabilities.js`.

Canonical agent identity (Correction 3): `opencode -> opencode`, `kilo ->
kilo`, `kilocode -> kilo`, `claudecode -> claude-code`, `claude-code ->
claude-code`. New Claude registrations use the canonical name `claude-code`;
persisted legacy entries named `claudecode` are supported through the alias
mapping without rewriting or losing the existing entry. Capabilities key off
the canonical type, never an arbitrary display name, directory, or label.

OpenCode and KiloCode capabilities match the design matrix exactly
(providerMode multi-provider, requestAnalytics true, routingActivity false,
builderAvailable true). Claude capabilities match the design matrix exactly
(providerMode scalar-route, savedRoutes true, providerCreation false,
providerActivation false, pluginsManaged false, mcpManaged false,
integrationsVisible false, reasoningFormats false, sdkSelection false,
profilesMode routing-profiles, requestAnalytics false, routingActivity true,
builderAvailable false).

## 7. Production entry exact contract

### 7.1 Parameters

`build-claude-code-production.ps1` accepts exactly:

| Parameter | Apply | Restore | Required |
|---|---|---|---|
| `-Operation` | `Apply` | `Restore` | Yes; enum `Apply|Restore` |
| `-ProfileRoot` | Yes | Yes | Yes; the boundary root; must contain no reparse components |
| `-SettingsPath` | Yes | Yes | Yes; must equal `-ProfileRoot\.claude\settings.json` (case-insensitive) |
| `-RoutingProfilePath` | Yes | No | Yes for Apply only; forbidden for Restore |
| `-SchemaPath` | Yes | Yes | Yes for both; for Restore it is a trusted adapter-selected input (section 7.3) |
| `-BackupPath` | No | Yes | Forbidden for Apply; required for Restore |
| `-ExpectedBackupSha256` | No | Yes | Forbidden for Apply; required for Restore |
| `-TargetBindingSha256` | No | Yes | Forbidden for Apply; required for Restore |
| `-AllowRealTarget` | Optional | Optional | Gate 5-only switch (section 8.2) |
| `-TestFailureStage` | Optional | Optional | `None|AfterBackup|AfterTempWrite|AfterReplace|AfterRecoveryCopy|AfterRecoveryReplace`; used only by tests |

Forbidden combinations: `-Operation Restore` with `-RoutingProfilePath`;
`-Operation Apply` with `-BackupPath`, `-ExpectedBackupSha256`, or
`-TargetBindingSha256`. Unknown parameters are rejected by the parameter
declaration.

Path containment rules: `-SettingsPath` and `-BackupPath` are strictly
`-ProfileRoot`-bound; `-RoutingProfilePath` (server-resolved, under the ignored
`app/state/`) and `-SchemaPath` (packaged engine schema) are trusted
adapter-selected inputs validated for leaf, no-reparse, not-state-leaf, and
not-`.jsonc`; `-RoutingProfilePath` is additionally validated against the
routing schema before apply.

### 7.2 Output contract

The production entry emits exactly one strict JSON object on stdout with
non-secret metadata only.

Apply output:

```json
{ "ok": true, "backupName": "<settings.backup.<UTC>.json>",
  "backupSha256": "<hex>", "preWriteTargetSha256": "<hex>",
  "postWriteTargetSha256": "<hex>", "coreVersion": "0.1.0",
  "schemaIdentity": "<schema sha256 hex>" }
```

Restore output:

```json
{ "ok": true, "restoredTargetSha256": "<hex>", "coreVersion": "0.1.0",
  "schemaIdentity": "<schema sha256 hex>" }
```

Errors: nonzero exit codes with redacted messages on stderr; stdout carries no
partial result object. Exit code 0 means success; 1 means validation or
transaction failure with the target in a verified state; 2 means a hard
recovery failure.

Never emitted: absolute paths, usernames, resolved secret values, target
contents, manifest paths, or backup paths. The Python adapter parses only this
JSON; it never scrapes human prose and never infers backups from directory
ordering.

The fixture entry keeps its existing human-readable output contract for Gate 2
compatibility.

### 7.3 Restore schema handling

`-SchemaPath` is required for Restore. The entry validates that the schema
file exists, is a leaf with no reparse components, its filename is not the
state leaf, does not end in `.jsonc`, and parses as JSON; it computes
`schemaIdentity` (SHA-256 of the schema file) and emits it. The entry never
applies the routing schema to the backed-up settings document (section 12).
The Python adapter validates the returned `schemaIdentity` against the
packaged schema's computed SHA-256 before accepting the restore result.

## 8. Dual real-target locks

### 8.1 HTTP-layer lock

`app/app/claude_adapter.py` declares `ALLOW_REAL_CLAUDE_TARGET = False`. The
adapter resolves `ProfileRoot` through the injectable `get_profile_root()`
function:

- Production default: `get_profile_root()` returns `Path.home()`.
- Every Gate 4 endpoint test overrides it with a GUID temporary root through
  `unittest.mock.patch.object(claude_adapter, "get_profile_root", ...)` - the
  repository's exact in-process test pattern. No general environment variable
  redirects the production profile root.
- Locked state (lock on AND profile root equals `Path.home()`, case-
  insensitive): exact per-endpoint behavior in section 10.1. No locked
  endpoint performs any file probing, reading, enumeration, or mutation of
  the real layout.

### 8.2 PowerShell-layer lock (defense in depth)

The production entry itself:

- Rejects a `-ProfileRoot` that equals the process user profile
  (`$env:USERPROFILE`, case-insensitive) by default, before any file probing,
  backup, or mutation, with exit code 1 and a redacted message.
- Accepts real-profile execution only when `-AllowRealTarget` is passed.
- Gate 4 never passes `-AllowRealTarget`; every Gate 4 invocation uses a
  temporary profile root, and the Gate 4 tests prove direct real-profile
  invocation is rejected before probing, backup, or mutation.
- A Gate 5 handoff is the only authority that may pass `-AllowRealTarget`.

Both locks must exist; neither replaces the other.

## 9. Full SHA-256 revision tokens

Two revision tokens exist:

- `revision`: the full lowercase 64-character SHA-256 of the current settings
  target at the injected or unlocked profile root.
- `routesRevision`: the full lowercase 64-character SHA-256 of
  `app/state/claude-routes.json`.

Both match `^[0-9a-f]{64}$`. They are opaque; they contain no path and no
settings content.

- `GET /api/claude/routes` returns `{ routes, appliedRouteId, routesRevision }`.
- `GET /api/claude/routes/{route_id}` returns the route and `routesRevision`.
- `POST /api/claude/routes` (create) requires no revision (new store entry is
  created under the lock after a current store read).
- `PUT /api/claude/routes/{route_id}` (edit) requires `expectedRoutesRevision`;
  mismatch returns 409 with no store write.
- `DELETE /api/claude/routes/{route_id}` requires `expectedRoutesRevision`;
  deleting the applied route is rejected with 409.
- `POST /api/claude/routes/{route_id}/apply` requires `expectedRevision` AND
  `expectedRoutesRevision`; the server recomputes both under the lock
  immediately before mutation; mismatch returns 409 with no backup,
  route-store write, manifest write, or target mutation. This works on first
  apply (the target revision is derived from the target itself).
- There is no clear-applied-route endpoint: clearing only `appliedRouteId`
  while leaving Claude settings unchanged would falsely claim no route is
  applied. An applied route can only be replaced by applying another route,
  or moved backward by restore per the manifest.
- `POST /api/claude/restore` requires `expectedRevision` AND
  `expectedRoutesRevision` with the same recompute-and-409 semantics.
- Successful apply and restore responses return the new `revision` and
  `routesRevision`.
- Apply sets `appliedRouteId` and `appliedRouteConfigSha256` atomically in the
  route store; restore restores both the previous id and the previous
  fingerprint from the manifest.
- The frontend stores both revisions loaded with the route list and submits
  them with each mutation, then adopts the returned values.

## 10. API contract and security boundary

### 10.1 Exact endpoints and locked behavior

Locked state is defined once: `ALLOW_REAL_CLAUDE_TARGET` is False AND the
resolved profile root equals `Path.home()` (case-insensitive).

| Endpoint | Locked behavior | Unlocked behavior |
|---|---|---|
| `GET /api/claude/status` | HTTP 200 with the static no-probe locked response (below) | HTTP 200 with the inspected response |
| `GET /api/claude/discover` | HTTP 200, `{ detected: <boolean|null>, realTargetLocked: true }`; detects only via the structural settings-target existence check | HTTP 200, `{ detected, realTargetLocked: false }` |
| `GET /api/claude/routes` | HTTP 200 with the route store contents and `realTargetLocked: true`; no target read, no revision field | HTTP 200 `{ routes, appliedRouteId, revision, routesRevision }` |
| `GET /api/claude/routes/{route_id}` | HTTP 200 with the route and `realTargetLocked: true`; no target read | HTTP 200 `{ route, revision, routesRevision }` |
| `POST /api/claude/routes` | HTTP 503 | HTTP 201 with the created route and `routesRevision` |
| `PUT /api/claude/routes/{route_id}` | HTTP 503 | HTTP 200 with the updated route and `routesRevision`, or 409 |
| `DELETE /api/claude/routes/{route_id}` | HTTP 503 | HTTP 200 `{ ok, routesRevision }`, or 409 |
| `POST /api/claude/routes/{route_id}/apply` | HTTP 503 | HTTP 200 `{ ok, revision, routesRevision }`, or 4xx/409 |
| `POST /api/claude/restore` | HTTP 503 | HTTP 200 `{ ok, restored, revision, routesRevision, message }`, or 4xx/409 |
| `GET /api/claude/activity` | HTTP 200 with the redacted route activity log and `realTargetLocked: true` | HTTP 200 `{ events, count, cappedAt }` |

There is no `POST /api/claude/routes/clear` endpoint.

Status response, locked (static, no probing):

```json
{ "scope": "user", "inspectionState": "locked", "settingsPresent": null,
  "routeConfigured": false, "lastBackupAvailable": false, "model": null,
  "endpointConfigured": false,
  "restartNotice": "Restarting Claude Code may be required for startup-only values.",
  "realTargetLocked": true }
```

Status response, unlocked (temp root tests):

```json
{ "scope": "user", "inspectionState": "unlocked", "settingsPresent": <boolean>,
  "routeConfigured": <boolean>, "lastBackupAvailable": <boolean>,
  "model": <string|null>, "endpointConfigured": <boolean>,
  "restartNotice": "Restarting Claude Code may be required for startup-only values.",
  "realTargetLocked": false }
```

Explicit field types: `inspectionState` is the enum `"locked"|"unlocked"`;
`settingsPresent` is `boolean|null` (null only in the locked state);
`routeConfigured`, `lastBackupAvailable`, `endpointConfigured`,
`realTargetLocked` are always booleans; `model` is `string|null`; `restartNotice`
is always the exact string. No paths, no usernames, no resolved values, no
backup paths.

Route create/edit request bodies accept exactly the route fields of the design
document section 4 (name, baseUrl, authKind, secretEnvRef, model,
gatewayDiscovery, disableExperimentalBetas, autoCompactWindow,
disableNonessentialTraffic) plus `expectedRoutesRevision` where required.
Apply requires `{ expectedRevision, expectedRoutesRevision }`. Restore
requires `{ expectedRevision, expectedRoutesRevision }`. Delete requires
`{ expectedRoutesRevision }`. There is no clear request body.

Error responses contain `detail` with a generic message only.

### 10.2 Request validation rules

- JSON-only request bodies; strict Pydantic models with `extra="forbid"` so
  unknown fields are rejected with 422.
- No client-supplied filesystem paths of any kind in any request.
- `name`: non-empty string, length 1-64, unique under a case-insensitive
  comparison among saved routes.
- `baseUrl`: string, length 1-2048, must parse as an absolute http or https URI
  with a non-empty host, no userinfo, no query, no fragment.
- `model`: non-empty string, length 1-256.
- `authKind`: enum `apiKey` or `authToken`; exactly one env key is written at
  apply time; both or neither is a validation error.
- `secretEnvRef`: validated against `^[A-Za-z_][A-Za-z0-9_]*$`, length 1-128.
- `autoCompactWindow`: integer 100000-1000000.
- `gatewayDiscovery`, `disableExperimentalBetas`, `disableNonessentialTraffic`:
  required booleans.
- `expectedRevision` and `expectedRoutesRevision`: required strings matching
  `^[0-9a-f]{64}$` where required.

### 10.3 Host and Origin protection for Claude endpoints

Endpoint-specific protection, applied before request-body processing:

- `Host` header must equal `127.0.0.1:9090` or `localhost:9090` (from
  `config.HOST` and `config.PORT`); any other Host is rejected with 403.
- When an `Origin` header is present, it must be exactly
  `http://127.0.0.1:9090` or `http://localhost:9090`; any other Origin,
  including other localhost ports, is rejected with 403.
- An absent `Origin` is permitted only when the Host is valid (in-process
  tests and approved local non-browser clients).
- The strict checks apply to every `POST`, `PUT`, and `DELETE` Claude endpoint,
  to `POST /api/claude/routes/{route_id}/apply`, to `POST /api/claude/restore`,
  and to the two `GET` endpoints that return route metadata (`GET
  /api/claude/routes`, `GET /api/claude/routes/{route_id}`) and `GET
  /api/claude/activity`. `GET /api/claude/status` and
  `GET /api/claude/discover` are not protected by Host/Origin checks because
  they return no sensitive data; they stay governed by the global CORS policy.
- Global CORS, unrelated routes, and the loopback-only binding are unchanged.
- Tests: malicious Origin, wrong localhost port, bad Host, missing Origin with
  valid Host, and valid same-origin requests.

### 10.4 Execution rules

- The production entry is invoked via `subprocess.run` with an array of
  arguments; no shell, no string interpolation.
- The adapter makes no outbound network request; no gateway test call exists.
- No sensitive data in logs or exception responses; exceptions map to generic
  messages.
- A module-level `threading.Lock` in `claude_adapter.py` serializes every
  Claude mutation; route-store reads and writes, manifest reads, writes, pops,
  and prunes, activity appends, and revision recomputes all happen under the
  same lock.
- No Gate 4 verification command starts a server that can inspect the real
  profile; endpoint tests use the in-process pattern of section 8.1.

## 11. Backup, restore, route-store, and commit consistency

### 11.1 Backup filename contracts

Target backup: `settings.backup.<UTC yyyyMMddHHmmssfff>.<32-hex-guid>.json` in
the settings target directory. Match regex
`^settings\.backup\.\d{17}\.[0-9a-f]{32}\.json$`.

Route-store backup: `claude-routes.backup.<UTC yyyyMMddHHmmssfff>.<32-hex-guid>.json`
under the ignored `app/state/` directory only. Match regex
`^claude-routes\.backup\.\d{17}\.[0-9a-f]{32}\.json$`.

### 11.2 Previous-route-store backup lifecycle

- Route-store backups live only under ignored `app/state/`; never elsewhere.
- The manifest stores `previousStoreBackupName` and `previousStoreSha256`
  only, never an absolute path.
- When a previous route-store state exists, its content is written atomically
  to a route-store backup BEFORE the target apply begins.
- A null previous store state creates no route-store backup file.
- Restore validation of a route-store backup before use: filename contract,
  containment under `app/state/`, no reparse components, actual file hash
  equals `previousStoreSha256`, JSON parses, no duplicate keys, and the shape
  satisfies the route-store versioned shape.
- A failed save removes only the route-store backup files created by that
  failed transaction (each validated by name contract and hash before
  removal).
- A successful restore consumes the manifest entry: after the route store is
  restored and verified, the consumed entry's route-store backup is deleted
  (name and hash validated) and the entry is popped.

### 11.3 Manifest hash model (non-tautological)

Each manifest entry records exactly:

| Field | Meaning |
|---|---|
| `backupName` | The adapter-created target backup file name |
| `backupSha256` | SHA-256 of the target backup file content |
| `preWriteTargetSha256` | SHA-256 of the target before apply |
| `postWriteTargetSha256` | SHA-256 of the target after successful apply |
| `targetBindingSha256` | SHA-256 of the normalized canonical target identity (section 11.5); internal only, never returned by the API |
| `appliedRouteId` | The route applied by this entry |
| `appliedRouteConfigSha256` | The applied-config fingerprint at apply time |
| `previousAppliedRouteId` | The applied route before this entry, or null |
| `previousAppliedRouteConfigSha256` | The applied-config fingerprint before this entry, or null |
| `previousStorePresent` | Whether a route-store state existed before this apply |
| `previousStoreBackupName` | Route-store backup file name under `app/state/`, or null |
| `previousStoreSha256` | SHA-256 of the previous route-store content, or null |
| `createdAt` | UTC ISO 8601 timestamp |
| `coreVersion` | From the production entry output |
| `schemaIdentity` | From the production entry output |

Restore eligibility recomputes the actual target backup file hash and compares
it to `backupSha256`, and recomputes the actual route-store backup hash
against `previousStoreSha256` when a previous store existed; it never compares
a recorded value to itself. Stale-write detection uses the full revision
tokens of section 9.

### 11.4 Manifest cap, pop, and pruning (no orphans, no unsafe deletion)

- The manifest is capped at 10 entries.
- A successful restore pops the consumed newest entry, so the next restore
  walks backward one adapter transaction.
- When an eleventh entry must be added, the adapter prunes only the oldest
  manifest-owned target backup and route-store backup, and only after
  validating, for each file: filename contract, target binding equality,
  containment, and actual hash equality with the recorded value.
- Never delete a file not named by an eligible manifest entry. Never use
  recursive deletion.
- If safe pruning cannot be verified for either file, the adapter retains the
  oldest entry and fails the apply with a generic error rather than orphaning
  or deleting unknown files.
- Manifest and backup pruning occur under the same lock and the same
  transaction as the apply.
- Tests: entry-11 add with valid prune, entry-11 add with a foreign similarly
  named file (not deleted), entry-11 add with a tampered oldest backup (apply
  fails, entry retained), consumed restore entries popped, and no orphaned
  adapter-owned files after any operation sequence.

### 11.5 Target binding algorithm

Normalize the canonical target path with the same case and path policy as the
production entry: full path, lower-cased, backslashes normalized to forward
slashes, trailing separator trimmed. Compute SHA-256 over the UTF-8 bytes of
the normalized identity text. Store only `targetBindingSha256` internally;
never return it through the API and never include the normalized path in
reports. Tests prove different roots produce different bindings and
case-equivalent Windows paths produce the same binding.

### 11.6 Restore recovery (never retry the same backup)

1. Validate manifest entry, target binding, schema identity, backup name,
   containment, reparse policy, actual target backup hash versus
   `backupSha256`, JSON parseability, and duplicate-key scan - all before
   mutation. When the entry has a previous store, also validate the
   route-store backup per section 11.2.
2. Create a same-directory recovery copy of the current target
   (`.bdf-transaction-recovery-<guid>.tmp`).
3. Atomically replace the target with the validated backup content.
4. Parse and verify the restored target: valid JSON, no duplicate keys, byte
   equality to the validated backup, parseable semantic state, and hash
   expectations. Restore verification never requires the restored settings to
   match the current route profile (section 12).
5. If post-restore verification fails, atomically restore the recovery copy
   and verify it.
6. Delete transaction temporaries only after verification succeeds.
7. If recovery-copy restoration fails, return a redacted hard failure (exit
   code 2, `{ ok: false }`), stop, and never retry the same backup.

Synthetic failure tests are required at every restore boundary:
`AfterBackup`, `AfterTempWrite`, `AfterReplace`, `AfterRecoveryCopy`,
`AfterRecoveryReplace`.

### 11.7 Three-artifact commit consistency and rollback ordering

Apply commits the settings target, the saved-route store, and the manifest
consistently:

1. Acquire the adapter lock.
2. Validate the request, both expected revisions, Host, and Origin; recompute
   the target revision and the route-store revision under the lock.
3. Capture the previous route-store state (including absence). When a
   previous store state exists, write its backup atomically under
   `app/state/` (section 11.2).
4. Apply the target transaction through the production entry (Apply).
5. Atomically write the new route store with `appliedRouteId` set to the
   applied route and `appliedRouteConfigSha256` set to the route's canonical
   fingerprint.
6. Atomically append the manifest entry, including the previous-store
   metadata and `previousAppliedRouteConfigSha256`. When this would exceed
   the cap of 10, prune per section 11.4.
7. Append the `route_applied` activity event through the store-plus-activity
   transaction rules of section 11.8.
8. If any commit after step 4 fails, roll back in this exact order:
   a. Keep the newly created target backup and its metadata from Apply.
   b. Restore the target through the production Restore operation (never ad
      hoc Python file replacement), using the newly created backup, its
      `backupSha256`, and the target binding.
   c. Restore the previous route-store state atomically from its validated
      backup, or remove the newly created route store when the previous
      state was absent.
   d. Restore the previous manifest bytes atomically.
   e. Restore the previous activity-log bytes atomically, or append a
      `validation_failed` or `apply_failed` event as applicable.
   f. Verify the target revision, the route-store state, the manifest state,
      the activity-log state, and the directory inventory.
   g. Remove only transaction-created route-store backup and temporary files
      after verification.
9. If rollback fails at any point, return a generic hard failure, preserve
   all evidence files, never claim success, and never continue mutation.

Failure-injection tests are required at every commit and rollback boundary:
route-store write, manifest write, activity write, activity rollback, target
rollback, route-store rollback, and manifest rollback.

Route create, edit, and delete commit only the route store and the activity
log through the store-plus-activity transaction of section 11.8; they never
touch the target and never create manifest entries.

On successful restore:

- the target returns to the backup state;
- the route store returns to the corresponding previous state recorded in the
  manifest entry (`appliedRouteId` restored to `previousAppliedRouteId` and
  `appliedRouteConfigSha256` restored to `previousAppliedRouteConfigSha256`),
  or is removed when the previous state was absent;
- the consumed manifest entry is popped and its route-store backup is removed
  after verification;
- a `restore_completed` activity event is appended through the section 11.8
  transaction rules;
- the response returns the new `revision` and `routesRevision`.

### 11.8 Route-store and activity transaction

Create, edit, and delete modify two files (route store plus activity log) that
cannot be atomically replaced together. They use a rollback-backed transaction
under the same adapter lock:

1. Capture previous route-store bytes or absence.
2. Capture previous activity-log bytes or absence.
3. Atomically write the route store.
4. Atomically append or rewrite the capped activity log.
5. Verify both files.
6. If the activity commit fails, restore the prior route store and prior
   activity bytes atomically and verify.
7. If the rollback fails, return a generic hard failure and preserve
   evidence; never claim success or continue mutation.

Activity events carry exactly `{ "ts": "<UTC>", "type": "<event>", "routeId":
"<id|null>" }`; user-entered route names are never stored in activity events.
Failure-injection tests cover activity write and activity rollback.

## 12. Restore does not apply the routing contract to old state

A valid backup may represent settings from before the currently selected
route. Restore verification checks exactly: valid JSON, no duplicate keys,
successful atomic target replacement, byte equality to the validated backup
after restore, parseable semantic state, and target/backup hash expectations.
It must NOT require the restored settings to match the current route profile
or the current routing schema. This is stated explicitly in the shared-core
contract, the production-entry contract (section 7.3), and the tests.

## 13. Discovery separation and version observability

### 13.1 Discovery separation

1. `app/app/config.py`: the `claudecode` entry is deleted from
   `AGENT_REGISTRY`. This is an exact removal, not a re-registration.
2. `app/app/discovery.py` is unchanged: it iterates the registry, so the
   removal makes generic discovery and scan unable to select or parse Claude
   state.
3. Claude discovery lives only in `app/app/claude_adapter.py`:
   `GET /api/claude/discover` performs the single supported structural check -
   existence of the settings target resolved from `get_profile_root()` and
   `CLAUDE_SETTINGS_REL`. No directory enumeration and no content reads.
4. The OpenCode/Kilo JSON parsers never parse `.claude.json`; the state leaf
   is referenced only by string concatenation in the adapter guard.
5. Connect Your Agent combines generic discovery with this dedicated check
   (`onboarding.js`), and selecting Claude registers it through the existing
   `POST /api/agents` app state contract.
6. Regression tests prove the registry exclusion and that no generic
   component references the Claude layout.

### 13.2 Capability versus execution and version observability

Gate 4 implements production-capable code but executes it only against
temporary fixture copies. The HTTP-layer lock (section 8.1) and the
PowerShell-layer lock (section 8.2) are both in place; Gate 4 never passes
`-AllowRealTarget` and never overrides `ALLOW_REAL_CLAUDE_TARGET`. Gate 4 does
not invoke Claude Code, does not perform a live route change, and never
exercises the production entry with the real home directory. App status
remains "Integrated, not live validated."

Version observability: the Python adapter receives `coreVersion` and
`schemaIdentity` from the production entry's strict JSON output on every Apply
and Restore call. Python never parses PowerShell source text. The adapter
validates the returned `schemaIdentity` against the packaged schema's computed
SHA-256.

## 14. Tests required for new Claude behavior

### 14.1 `app/tests/test_capabilities.py`

1. The capability matrix for `opencode` and `kilo` matches the design
   document exactly, including `builderAvailable: true`.
2. The capability matrix for `claude-code` matches the design document
   exactly, including `builderAvailable: false`.
3. `GET /api/capabilities` returns `{ agent, canonicalType, displayName,
   capabilities }` for the active agent.
4. `canonical_agent_type` maps `opencode -> opencode`, `kilo -> kilo`,
   `kilocode -> kilo`, `claudecode -> claude-code`, and `claude-code ->
   claude-code`.
5. A persisted legacy agent entry named `claudecode` resolves to the
   `claude-code` capability set without rewriting or losing the entry.
6. Capability responses contain no Claude paths, secrets, or protected
   values.

### 14.2 `app/tests/test_claude_adapter.py`

Every endpoint test overrides `get_profile_root` with a GUID temporary root.
Tests:

5. `AGENT_REGISTRY` contains no entry named `claudecode` and no entry whose
   home contains `.claude`.
6. `GET /api/discover` response contains no `claudecode` agent.
7. `GET /api/claude/discover` performs only the structural settings-target
   existence check (patch the probe helper and assert it is never called for
   any other path, and that no directory enumeration occurs).
8. Unlocked status response: exactly the section 10.1 field set with
   `inspectionState: "unlocked"`, `settingsPresent` a real boolean, and no key
   containing "path" and no value that is an absolute path.
9. Locked behavior (lock on, profile root equal to the real home): `GET
   /api/claude/status` returns HTTP 200 with the exact static locked response;
   `GET /api/claude/discover` returns `{ detected: null, realTargetLocked:
   true }`; every mutating endpoint (`POST`/`PUT`/`DELETE` routes, apply,
   restore) returns HTTP 503; `GET` route metadata and activity return
   HTTP 200 without target reads; no filesystem probe of the real layout
   occurs.
10. `GET /api/claude/routes` returns the route list, `appliedRouteId`,
    `appliedRouteConfigSha256`, and `revision` plus `routesRevision` matching
    `^[0-9a-f]{64}$`; no resolved value and no path appears.
11. `POST /api/claude/routes` rejects unknown fields with 422 (strict
    schema).
12. Route create rejects empty, overlong, or duplicate names (case-insensitive
    uniqueness) with 400.
13. Route create rejects invalid baseUrl forms, invalid model, invalid
    `authKind`, invalid `secretEnvRef`, and out-of-range `autoCompactWindow`
    with 400.
14. Route create success: route persisted with a server-generated immutable
    id, `appliedRouteId` unchanged, `routesRevision` returned, `route_created`
    activity event appended, no target mutation.
15. Route edit with a stale `expectedRoutesRevision` returns 409 and mutates
    nothing.
16. Route delete of the applied route is rejected with 409 and explanatory
    copy.
17. Route delete success removes the route, records `route_deleted`, and
    returns the new `routesRevision`.
18. No clear-applied-route endpoint exists: a request to
    `/api/claude/routes/clear` returns 404, and the API surface contains no
    clear route, action, or `route_cleared` event type.
19. Apply with a stale `expectedRevision` or `expectedRoutesRevision` returns
    409 and mutates nothing (no backup, no store write, no manifest write).
20. Apply success on a temporary fixture copy: managed fields written exactly,
    every unsupported key semantically preserved (snapshot compare), exactly
    one target backup created with the filename contract, `appliedRouteId`
    and `appliedRouteConfigSha256` set atomically to the applied route and
    its canonical fingerprint, previous store backup created when a previous
    store existed and absent when none did, manifest entry appended with
    `appliedRouteConfigSha256` and `previousAppliedRouteConfigSha256`,
    `route_applied` activity event appended, no transaction temporary file
    left behind, response returns new 64-hex `revision` and `routesRevision`.
21. Apply with a missing referenced environment variable returns 400 and the
    target SHA-256 remains unchanged (failure before mutation).
22. The production entry, invoked directly with a profile root equal to the
    real user profile and without `-AllowRealTarget`, exits nonzero before
    any file probing, backup, or mutation (assert target directory inventory
    unchanged).
23. The canonical fingerprint is stable: identical managed configuration
    produces the same `appliedRouteConfigSha256`; a change to any managed
    field (or to the reference name) produces a different fingerprint; `name`,
    `id`, `createdAt`, and `updatedAt` never affect the fingerprint; a null
    `appliedRouteId` requires a null `appliedRouteConfigSha256`.
24. Editing the applied route changes its fingerprint; the store retains the
    old `appliedRouteConfigSha256`, so the frontend can render `Changes not
    applied` until the user explicitly applies.
25. Concurrent mutations serialize under the adapter lock; after interleaved
    calls the route store, manifest, target, and activity log are consistent
    and parseable.
26. Route-store and activity transaction: failure injection at the activity
    write restores the prior route store and prior activity bytes and
    verifies; failure at the activity rollback returns a generic hard failure
    and preserves evidence.
27. Restore rejects a foreign backup (not in the manifest) without mutation.
28. Restore rejects a malformed backup (unparseable or duplicate keys) without
    mutation.
29. Restore rejects a manifest entry whose target binding differs from the
    current resolved target without mutation.
30. Restore rejects a tampered backup (actual target backup file hash differs
    from `backupSha256`) without mutation.
31. Restore success restores the target bytes, returns the route store to the
    recorded previous state (`appliedRouteId` restored to
    `previousAppliedRouteId` and `appliedRouteConfigSha256` restored to
    `previousAppliedRouteConfigSha256`, or store removed when previously
    absent), pops the consumed manifest entry, removes the consumed
    route-store backup after verification, appends `restore_completed`, and
    returns `{ ok, restored, revision, routesRevision, message }` with no
    path and no secret value.
32. Restore of a backup whose settings do not match the current route profile
    succeeds (restore verification never requires current-route equivalence).
33. Restore recovery: each synthetic failure stage (`AfterBackup`,
    `AfterTempWrite`, `AfterReplace`, `AfterRecoveryCopy`,
    `AfterRecoveryReplace`) leaves the target in a verified parseable state
    and never retries the same backup.
34. Rollback ordering: failure injection at route-store write, manifest write,
    activity write, activity rollback, target rollback, route-store rollback,
    and manifest rollback each leaves target revision, route-store state,
    manifest state, activity-log state, and directory inventory verified per
    sections 11.7 and 11.8; a failed rollback returns a generic hard failure
    and preserves evidence files.
35. Manifest lifecycle: entry 11 add with valid prune removes only the oldest
    manifest-owned backups after hash validation; a foreign similarly named
    file is never deleted; a tampered oldest backup causes the apply to fail
    with the entry retained; no orphaned adapter-owned files remain; consumed
    restore entries are popped.
36. Activity log: capped at 200 events; every event matches exactly
    `{ "ts", "type", "routeId" }` with no user-entered route names, no
    secrets, no resolved values, no paths, and no payloads; `GET
    /api/claude/activity` returns `{ events, count, cappedAt }`.
37. Generated route-store, manifest, and activity files never appear in Git
    status: the ignore rule `state/` exists in `app/.gitignore` and matches
    `app/state/`.
38. Every response and captured subprocess output is scanned for the allowed
    fake markers; zero occurrences outside test fixtures.
39. Static source scan of `app/app/claude_adapter.py`, `app/app/capabilities.py`,
    `app/app/config.py`, and `app/app/server.py`: no literal real user path,
    no literal `.claude.json` (concatenation only), no literal `.jsonc`, no
    credential-shaped value outside the allowed fake markers.
40. Host and Origin protection: a malicious Origin returns 403; a wrong
    localhost port in Origin or Host returns 403; a bad Host returns 403; a
    missing Origin with a valid Host passes; valid same-origin requests pass;
    the checks apply to every protected endpoint of section 10.3 before body
    processing; `GET /api/claude/status` and `GET /api/claude/discover` stay
    governed by global CORS only.
41. Responses never contain absolute paths or backup paths.
42. The manifest records all fifteen fields of section 11.3 and is capped at
    10 entries; different profile roots produce different
    `targetBindingSha256` values and case-equivalent Windows paths produce
    the same value.
43. The adapter receives `coreVersion` and `schemaIdentity` from the
    production entry JSON output on both Apply and Restore, and validates
    `schemaIdentity` against the packaged schema hash.

### 14.3 `app/tests/claude_routes_contract.test.mjs`

44. The providers workspace renders the Claude routes workspace when the
    capabilities say `isClaude()` and the provider deck otherwise.
45. Page title is `Claude routes` with the one-route-applied explanation.
46. Saved-route cards render with `Applied` or `Saved` markers; applied route
    is visibly marked; inactive routes show only `Apply route` and `View
    details`.
47. Card actions never include provider activation, deactivation, test, SDK,
    reasoning format, model-list count, plugin count, MCP count, or remove.
48. The route editor renders exactly the design-document fields (name, base
    URL, auth kind, environment-variable reference name with the helper
    "Environment variable name, not the secret value.", model, gateway
    discovery toggle, disable beta toggle, auto-compact window, disable
    traffic toggle) and never renders SDK type, provider package,
    reasoning-format selector, model collection, or activation controls.
49. The preservation notice renders the exact string "Claude-owned settings
    preserved.".
50. The restart notice renders the exact string "Restarting Claude Code may be
    required for startup-only values.".
51. Delete applied route is disabled with the explanatory copy.
52. Editing the applied route marks the route "Changes not applied" (id and
    fingerprint mismatch) and never auto-applies.
53. The backup status line and restore button render and the button is wired
    to the restore API client with both stored revisions.
54. Loading, error, and success states behave per the shared dialog
    conventions.
55. The editor dialog respects the responsive viewport at 390px width.
56. Focus moves to the first field on open and returns to the trigger on
    close; Escape closes.
57. API-derived values are never injected into `innerHTML` unescaped.
58. The 64-hex `revision` and `routesRevision` loaded with the route list are
    stored and submitted with each mutation; the returned values replace
    them.

### 14.4 `app/tests/capability_ui_contract.test.mjs`

59. The capability matrix for all three agents resolves from
    `core/capabilities.js`; no page module contains an independent agent
    check.
60. Switching the active agent to Claude changes only capability-dependent
    content: sidebar label Providers becomes Routes, Integrations button
    hidden.
61. Switching back to OpenCode or Kilo restores the Providers label, the
    Integrations button, and the existing page content.
62. Claude appears in Connect Your Agent only when `GET /api/claude/discover`
    reports detected; selecting it registers through the app state contract.
63. A stale direct URL to Integrations while Claude is active redirects to the
    Overview without rendering forbidden controls.
64. Overview with Claude active shows route status and never the provider
    relay, active provider count, plugin count, MCP count, or reasoning
    summary.
65. Activity with Claude active shows the redacted Route activity timeline and
    never request charts.
66. Settings with Claude active hides plugins, MCP, SDK, reasoning formats,
    and BDF profiles, and shows only Claude-supported adapter settings and
    routing-profile information.
67. OpenCode/Kilo regressions remain unchanged (existing page modules render
    identically with their capabilities).
68. The global Build button is hidden while Claude is active and restored when
    OpenCode or Kilo is active; a direct Build action invocation while Claude
    is active is blocked.
69. First-render race: with a delayed capabilities response, the first render
    never flashes Integrations, provider, or Build controls for an active
    Claude agent; on capability-load failure the safe fallback renders with
    an error and no Claude-incompatible controls.
70. A route shows `Applied` only when its id and canonical fingerprint both
    match the store; editing the applied route renders `Changes not applied`
    and never auto-applies.

### 14.5 Mandatory regressions (no hard-coded app totals)

| Suite | Command | Expected |
|---|---|---|
| Gate 2 adapted Claude harness | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1` | 51/51, exit 0 (fixed count, section 4.4) |
| Gate 3 provider/model harness | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe <isolated python>` | 25/25, exit 0 |
| OpenCode harness | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1` | 34/34, exit 0 |
| Kilo harness | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1` | 32/32, exit 0 |
| App Python suite | `& .\app\env\Scripts\python.exe -m unittest discover -s app\tests -p "test_*.py"` | zero failures; record final count |
| Frontend contract suites | `node .\app\tests\claude_routes_contract.test.mjs`, `node .\app\tests\capability_ui_contract.test.mjs`, `node .\app\tests\providers_visual_contract.test.mjs`, `node .\app\tests\frontend_review.test.mjs` | zero failures each |

A pre-existing failure outside Gate 4 scope: report it, do not edit the suite,
do not weaken any test.

## 15. PROJECT_STATE regeneration procedure

No automatic PROJECT_STATE generator script exists in the repository
(verified). The exact available process is:

1. Regenerate `PROJECT_STATE.md` manually from current repository facts while
   preserving the exact 15-section template structure of
   `bdf/templates/PROJECT_STATE.template.md`.
2. Do not copy unresolved template placeholders (`{{...}}`) into the
   regenerated file.
3. Do not manually alter generated release and version regions governed
   elsewhere (section 10 Versioning System and the release-owned version
   table): since no release is created, keep the existing generated rows
   unchanged and update only the non-generated sections.
4. Every historical or absent path referenced in the regenerated file carries
   the literal marker "(absent)" or "(historical)" inline so the path check
   (section 18) skips it deterministically.
5. Run the exact checks of section 18.

## 16. TDD RED/GREEN task sequence and phases

Gate 4B may start only after all Gate 4A tests and regressions pass.

### 16.1 Gate 4A

1. **Shared core extraction with harness adaptation (refactor with regression
   proof):** create `claude-routing-core.psm1`; refactor `build-claude-code.ps1`
   to dot-source it; adapt `test-claude-code.ps1` per section 4.4 with the 8
   named new tests. Proof: adapted Gate 2 harness exit 0 with 51/51. A
   preserved-test failure means the core diverged; fix the core (not the
   harness) until green. No new functionality yet.
2. **Capabilities RED/GREEN:** write `test_capabilities.py` (items 1-6) and
   `capability_ui_contract.test.mjs` (items 59-70). RED: endpoints 404,
   capability module absent. GREEN: implement `capabilities.py`,
   `core/capabilities.js`, `store.js`, `router.js`, `sidebar.js`, `main.js`
   capability wiring including the awaited first-render contract and the
   hidden Build button; tests pass.
3. **Production entry RED/GREEN:** write the production-entry portions of
   `test_claude_adapter.py` (items 20-22, 38-43). RED: production entry
   absent, invocations exit nonzero. GREEN: implement
   `Invoke-ClaudeRoutingApply`, `Invoke-ClaudeRoutingRestore`, and
   `build-claude-code-production.ps1`; tests pass.
4. **Saved routes and adaptive pages RED/GREEN:** write the remaining
   `test_claude_adapter.py` tests (items 5-19, 23-37, 40-42) and
   `claude_routes_contract.test.mjs` (items 44-58). RED: endpoints 404,
   markup absent. GREEN: implement `claude_adapter.py`, `config.py` registry
   removal, `server.py` includes, `app/.gitignore` rule, `api.js`,
   `claude-routes.js`, `provider-workspace.js`, `overview.js`, `activity.js`,
   `settings.js`, `onboarding.js`, and the CSS; tests pass.
5. **Regression gate:** run all Gate 4A suites of section 14.5; every
   expected count holds with zero failures and no test edits.

### 16.2 Gate 4B

6. **Documentation GREEN:** create the five adapter documents (A1-A5), the
   DECISIONS entry (D1), the generic BDF updates (G1-G7), the root document
   updates (D2-D13), the paired templates (M1-M9), regenerate `PROJECT_STATE.md`
   (D3) per section 15, and run the documentation checks of section 18.
7. **Staged scans and report:** run the implementation and documentation scans
   of section 17 (stage 1), create the report (R1), then run the final
   report-inclusive scans and scope checks (stage 3), `git diff --check`, and
   section 18 checks.

## 17. Exact verification commands and static scans

### 17.1 Allowlisted scan set

The allowlist below is the ONLY set scanned. Never scan global configuration,
backups, real Claude directories, environment state, or paths outside the
repository.

```powershell
$sourceAllowlist = @(
  'app/app/claude_adapter.py',
  'app/app/capabilities.py',
  'app/app/config.py',
  'app/server.py',
  'app/engine/claude-code/claude-routing-core.psm1',
  'app/engine/claude-code/build-claude-code.ps1',
  'app/engine/claude-code/build-claude-code-production.ps1',
  'app/engine/claude-code/test-claude-code.ps1',
  'app/assets/js/core/api.js',
  'app/assets/js/core/capabilities.js',
  'app/assets/js/core/store.js',
  'app/assets/js/core/router.js',
  'app/assets/js/core/sidebar.js',
  'app/assets/js/main.js',
  'app/assets/js/pages/onboarding.js',
  'app/assets/js/pages/claude-routes.js',
  'app/assets/js/pages/provider-workspace.js',
  'app/assets/js/pages/overview.js',
  'app/assets/js/pages/activity.js',
  'app/assets/js/pages/settings.js',
  'app/assets/css/provider-workspace.css',
  'app/.gitignore',
  'app/tests/test_capabilities.py',
  'app/tests/test_claude_adapter.py',
  'app/tests/claude_routes_contract.test.mjs',
  'app/tests/capability_ui_contract.test.mjs'
)
$docAllowlist = @(
  'adapters/claude-code/README.md',
  'adapters/claude-code/ADAPTER.md',
  'adapters/claude-code/BUILDER_SPEC.md',
  'adapters/claude-code/TESTING.md',
  'adapters/claude-code/COMPATIBILITY.md',
  'bdf/FRAMEWORK.md',
  'bdf/PROJECT_ADAPTER.md',
  'bdf/AI_WORKFLOW.md',
  'bdf/TESTING.md',
  'bdf/BUILDER_EVOLUTION.md',
  'bdf/README.md',
  'bdf/VERSION.md',
  'README.md',
  'PROJECT_STATE.md',
  'ROADMAP.md',
  'ADAPTER.md',
  'ARCHITECTURE.md',
  'BUILDER_SPEC.md',
  'FOLDER_STRUCTURE.md',
  'JSON_SCHEMAS.md',
  'TESTING.md',
  'CONTRIBUTING_FOR_AI.md',
  'app/README.md',
  'app/engine/schemas/README.md',
  'planning/DECISIONS.md',
  'bdf/templates/ADAPTER.template.md',
  'bdf/templates/ARCHITECTURE.template.md',
  'bdf/templates/BUILDER_SPEC.template.md',
  'bdf/templates/CONTRIBUTING_FOR_AI.template.md',
  'bdf/templates/FOLDER_STRUCTURE.template.md',
  'bdf/templates/JSON_SCHEMAS.template.md',
  'bdf/templates/README.template.md',
  'bdf/templates/TESTING.template.md',
  'bdf/templates/README.md'
)
```

### 17.2 Staged scanning

Stage 1 (before the report exists): scan `$sourceAllowlist` and the subset of
`$docAllowlist` that exists.

Stage 2: create the report (R1).

Stage 3 (final): run the documentation scan over the exact variable:

```powershell
$finalDocAllowlist = $docAllowlist + @(
  'planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md'
)
```

then run the report-contract check, the scope check, the ASCII check, and
`git diff --check`.

### 17.3 Source scan

```powershell
foreach ($path in $sourceAllowlist) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Allowlisted source missing: $path" }
  $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $path))
  $patterns = @(
    '[A-Za-z]:\\Users\\[^\\]+\\',
    '\.claude\.json',
    '\.jsonc',
    'sk-[A-Za-z0-9]{12,}',
    'Bearer\s+[A-Za-z0-9._-]{12,}',
    'Authorization',
    'X-Api-Key'
  )
  foreach ($pattern in $patterns) {
    if ($text -match $pattern) { throw "Prohibited pattern in source: $path -> $pattern" }
  }
}
'GATE4_SOURCE_SCAN_OK'
```

Protected filenames and header names must be constructed by concatenation in
source code, matching Gate 2 and Gate 3 practice.

### 17.4 Intentional test literals

Tests may contain exactly these fake markers, which the credential-shaped
patterns above do not match:

- `FAKE_GATE4_RUNTIME_VALUE_DO_NOT_USE`
- `FAKE_EXISTING_SECRET_MARKER`
- `FAKE_GATE4_TOKEN_VALUE_DO_NOT_USE`
- `FAKE_GATE4_KEY_VALUE_DO_NOT_USE`

Any other credential-shaped value in a test fixture is forbidden. Negative
protected-name assertions in tests use split or concatenated names.
Documentation may name protected files only in negative safety statements.
Scans are never weakened; no file outside the exact allowlist is ever scanned.

### 17.4a Baseline-aware ASCII rule

- Every file created by Gate 4 must be whole-file ASCII. Gate 4B creates six
  files; each is checked whole-file with zero non-ASCII bytes.
- Every line added by Gate 4 to a pre-existing modified file must be ASCII.
- Gate 4B is documentation-only and adds no source lines. Its added-line
  command scans only the 29 pre-existing files modified by Gate 4B (the
  `$docAllowlist` entries that already existed before Gate 4B); the six
  Gate 4B-created files use whole-file ASCII instead.
- Gate 4A source safety remains governed by the independently accepted Gate 4A
  scans and evidence. Do not scan the Git diff of Gate 4A source files and
  call accepted Gate 4A or pre-Gate dirty lines Gate 4B additions.
- Pre-existing non-ASCII bytes in unchanged baseline lines are permitted and
  must never be normalized merely to satisfy Gate 4.
- The executable added-diff-line ASCII check below applies only to the 29
  pre-existing modified Gate 4B documents, ignores diff metadata (`+++`, `---`,
  hunk headers), examines only `+` content lines, and never scans files outside
  that exact list or outside the repository.

```powershell
$gate4bModifiedDocs = $docAllowlist | Where-Object {
  $_ -notlike 'adapters/claude-code/*' -and $_ -notlike 'planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md'
}
foreach ($path in $gate4bModifiedDocs) {
  $basePath = $path -replace '/', '\'
  if (-not (Test-Path -LiteralPath $basePath -PathType Leaf)) { continue }
  $added = git -C (Resolve-Path '.').Path diff -- $basePath 2>$null |
    Where-Object { $_ -match '^\+' -and $_ -notmatch '^\+\+\+' } |
    ForEach-Object { $_.Substring(1) }
  foreach ($line in $added) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($line)
    if ($bytes | Where-Object { $_ -gt 127 }) { throw "Non-ASCII added line in: $path" }
  }
}
'GATE4B_DOC_ADDED_DIFF_ASCII_OK'
```

The marker `GATE4B_DOC_ADDED_DIFF_ASCII_OK` is emitted only by a command that
scans exactly the 29 pre-existing Gate 4B-modified documents. Do not emit
`GATE4_ADDED_DIFF_ASCII_OK` from a command that cannot distinguish the
pre-Gate/Gate-4A baseline from Gate 4B additions; the accepted Gate 4A scans
and evidence remain the authority for Gate 4A source lines.

### 17.5 Documentation scan (line-based status validation)

The scan validates lifecycle status line by line. It explicitly allows the
exact lifecycle phrase "Integrated, not live validated", rejects affirmative
lifecycle lines equal to "Supported", "Production ready", or "Live
validated", and permits those words inside clearly marked negative,
prohibited, or historical explanations. No global substring counting is used.

```powershell
$forbiddenStatusValues = @('Supported','Production ready','Live validated')
foreach ($path in $docAllowlist) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
  $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $path))
  foreach ($line in (Get-Content -LiteralPath $path)) {
    if ($line -match '(?i)^\s*(?:Status|Lifecycle status)\s*[:=]\s*(.+?)\s*$') {
      $value = $Matches[1].Trim()
      if ($forbiddenStatusValues -contains $value) {
        throw "Affirmative status line in doc: $path -> $value"
      }
    }
    if ($line -match '(?i)\b(?:status|lifecycle)\b.{0,40}?\b(supported|production[- ]ready|live validated)\b' -and $line -notmatch '(?i)\bnot\b|never|must not|forbidden|prohibited|historical|rejected') {
      throw "Unqualified status wording in doc: $path"
    }
  }
  if ($path -like 'adapters\claude-code\*' -or $path -like 'adapters/claude-code/*') {
    if ((Get-Content -LiteralPath $path -Raw) -notmatch [regex]::Escape('Integrated, not live validated')) {
      throw "Adapter doc lacks required lifecycle phrase: $path"
    }
  }
}
'GATE4_DOC_SCAN_OK'
```

The scan is validated against two samples before the full run:

```powershell
$negativeSample = "Status: Integrated, not live validated. Gate 5 approval is required before this may be claimed as supported."
$affirmativeSample = "Status: Supported"
$negativeOk = $true
foreach ($line in @($negativeSample)) {
  if ($line -match '(?i)^\s*(?:Status|Lifecycle status)\s*[:=]\s*(.+?)\s*$') {
    if ($forbiddenStatusValues -contains $Matches[1].Trim()) { $negativeOk = $false }
  }
}
if (-not $negativeOk) { throw 'Permitted negative status sentence failed the scan' }
$affirmativeRejected = $false
foreach ($line in @($affirmativeSample)) {
  if ($line -match '(?i)^\s*(?:Status|Lifecycle status)\s*[:=]\s*(.+?)\s*$') {
    if ($forbiddenStatusValues -contains $Matches[1].Trim()) { $affirmativeRejected = $true }
  }
}
if (-not $affirmativeRejected) { throw 'Forbidden affirmative status line passed the scan' }
'GATE4_DOC_SCAN_SAMPLES_OK'
```

The exact lifecycle phrase "Integrated, not live validated" is explicitly
allowed: rule 1 compares the captured value exactly against the three
forbidden values, and rule 2 permits any line containing a "not", "never",
"must not", "forbidden", "prohibited", "historical", or "rejected" marker, so
negative statements such as "not live validated", "not production-ready", and
"is not supported" never fail merely because the phrase appears.

### 17.6 Adapter five-file check

```powershell
$status = [regex]::Escape('Integrated, not live validated')
foreach ($file in @('README.md','ADAPTER.md','BUILDER_SPEC.md','TESTING.md','COMPATIBILITY.md')) {
  $path = Join-Path 'adapters/claude-code' $file
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Adapter doc missing: $path" }
  if ((Get-Content -LiteralPath $path -Raw) -notmatch $status) { throw "Adapter doc lacks required status: $path" }
}
'GATE4_ADAPTER_DOCS_OK'
```

### 17.7 Git checks

```powershell
git diff --check
git status --short --branch
git diff --name-only
git status --short -- app/state
```

`git diff --check` must pass. `git status --short -- app/state` must be empty
after any save test (runtime state ignored). `git status` must show only the
section 3 paths as new or modified plus the pre-existing dirty state recorded
before the gate (preserve every unrelated modified or untracked file).

## 18. Documentation synchronization checks

1. All five adapter documents carry the same lifecycle status "Integrated,
   not live validated" and the same evidence date (section 17.6).
2. The paired templates M1-M8 mirror the generic content of the paired project
   documents; `bdf/templates/README.md` inventory and cross-reference matrix
   are updated.
3. `bdf/VERSION.md`: current version block reads 2.3.0; a "## Version 2.3.0"
   change-history section lists the changed framework documents and templates;
   the Version History table gains the 2.3.0 row; the Compatibility table
   lists Framework Version 2.3.0 and the new "Unique agent adapters"
   compatible-project entry. Project release files are untouched (no release).
4. `PROJECT_STATE.md` regeneration per section 15, verified by:

```powershell
$expected = @('1. Executive Summary','2. Current Version','3. Current Folder Structure','4. Architecture Overview','5. Builder Development Framework','6. OpenCode Builder','7. AI Workflow','8. Documentation Structure','9. Template System','10. Versioning System','11. Current Status','12. Known Limitations','13. Next Planned Work','14. File Relationships','15. Important Engineering Decisions')
$content = Get-Content 'PROJECT_STATE.md' -Raw
foreach ($heading in $expected) {
  if ($content -notmatch ('(?m)^# ' + [regex]::Escape($heading) + '\s*$')) { throw "PROJECT_STATE section missing: $heading" }
}
if ($content -match '\{\{[A-Z0-9_]+\}\}') { throw 'PROJECT_STATE contains an unresolved placeholder' }
'PROJECT_STATE_15_SECTIONS_OK'
```

5. Repository-relative path check, executable and repository-bounded:

```powershell
$repoRoot = (Resolve-Path '.').Path
$tokens = [regex]::Matches((Get-Content 'PROJECT_STATE.md' -Raw), '`([^`]+)`') | ForEach-Object { $_.Groups[1].Value }
$failed = @()
foreach ($token in $tokens) {
  if ($token -match '\s' -or $token -match '://' -or $token -match '[*{}\[\]?]') { continue }
  if ($token -match '^[~%$]' -or $token -match '^[A-Za-z]:\\') { continue }
  if ($token -match '(?i)\(absent\)|\(historical\)') { continue }
  $candidate = Join-Path $repoRoot ($token -replace '\\','/')
  if (-not (Test-Path -LiteralPath $candidate)) { $failed += $token }
}
if ($failed.Count) { throw ('PROJECT_STATE referenced path missing: ' + ($failed -join '; ')) }
'PROJECT_STATE_PATHS_OK'
```

The check selects only repository-relative literal backticked paths; URLs,
glob notation, placeholders, commands, environment-style tokens, drive-letter
paths, and explicitly marked "(absent)" or "(historical)" paths are skipped.
No path outside the repository is inspected.

6. Version numbers are consistent across `bdf/VERSION.md` (2.3.0),
   `PROJECT_STATE.md`, and `bdf/README.md`.
7. `planning/DECISIONS.md` contains the new dated entry.
   `git diff --unified=0 -- planning/DECISIONS.md` must prove that the only
   tracked change is the appended 2026-08-14 block. The 2026-08-08 entry is
   tracked-content identical to HEAD; its reproducible LF-normalized block hash
   (UTF-8 read, entry heading through the Reversal line, lines joined with LF,
   no trailing newline) is `2ac7962441da2ba07ef0585d14f79b1715a7078887ae21466fe261f7b02c01dd`.
   Do not call working-tree bytes byte-identical to the HEAD blob after
   performing line-ending normalization; state tracked-content identity and the
   LF-normalized hash instead.
8. No generated release artifact was modified; `release_registry.json` is
   byte-identical.

## 19. Framework version rules

`bdf/VERSION.md` defines Minor as additive changes (new templates, new
workflow stages, new concepts) and Patch as fixes and clarifications with no
structural change. Unique bounded adapters and the new framework concepts are
additive, so the framework bump is **2.2.11 to 2.3.0**, not a patch bump.
Every scope item, verification rule, documentation requirement, and report
field in this handoff uses 2.3.0.

The repository contains no `release-manager.ps1` executable (verified);
`bdf/VERSION.md` Evolution Rules are the in-repository framework version
process. Gate 4 therefore:

- Bumps the framework to 2.3.0 by updating `bdf/VERSION.md` as specified in
  section 18 item 3.
- Updates `bdf/README.md` footer and registered-documents list in the same
  change.
- Records the version evidence in the report.
- Does not touch project release sources or generated release documents. No
  project or app release is created.

## 20. Version and status update rules

- **Adapter implementation version:** `$script:CLAUDE_ROUTING_CORE_VERSION =
  "0.1.0"` in `claude-routing-core.psm1` is the single version authority;
  observable through the production entry's JSON output on both Apply and
  Restore, never through source scraping. Bump rules (design document section
  8.1): bump when executable behavior, managed surface, transaction logic,
  validation, or CLI contract changes; mirror in `BUILDER_SPEC.md`,
  `TESTING.md`, and `COMPATIBILITY.md` in the same change.
- **Adapter document versions:** each of the five adapter documents carries a
  footer document version 1.0; `adapters/claude-code/README.md` lists the five
  current document versions.
- **Adapter schema version:** `app/engine/schemas/claude-code-routing.schema.json`
  is unchanged in Gate 4; a schema bump requires an approved handoff and
  updates `ADAPTER.md`, `BUILDER_SPEC.md`, `TESTING.md`, and
  `COMPATIBILITY.md`.
- **Tested Claude Code version:** 2.1.153 as observed in Gate 1; compatibility
  rows cite gate evidence and never assume future versions.
- **App version:** `APP_VERSION` in `app/app/__init__.py` stays 1.0.0; no
  release is created.
- **Lifecycle status:** all five adapter documents are updated atomically; root
  docs are synchronized in the same change. After Gate 4 the only allowed
  status is "Integrated, not live validated."

## 21. Rollback and recovery

1. Before any write test, record SHA-256 of every file the worker will create
   or modify and of every fixture copy used.
2. All Claude write tests operate on fixture copies under a GUID temporary
   root with an injected profile root; rollback for those is deletion of the
   GUID root only.
3. If a repository-file edit must be reverted, restore the recorded pre-edit
   content; never use `git checkout`, `git restore`, `git clean`, or
   `git reset`.
4. Do not delete any file that existed before the gate. If a deletion is
   required, stop and report BLOCKED.
5. If the production entry is ever invoked with a profile root equal to the
   real home or with `-AllowRealTarget`, stop immediately: that is a Gate 4
   safety violation, not a retry.
6. If a restore operation fails during tests, the recovery-copy rule of
   section 11.6 applies, the target remains parseable, and the test reports
   the failure without retrying the same backup.
7. Report rollback state in the Gate 4 report: whether rollback was needed,
   which paths, and proof that pre-existing state was restored.

## 22. Worker response contract and report path

Report path: `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`

The worker task result and the report must both contain exactly:

1. **Status:** `PASS`, `FAIL`, or `BLOCKED`.
2. **Changed files:** exact list of created and modified paths from section 3,
   with SHA-256 of every created file; contents and secret values never
   included. The report R1 itself contains SHA-256 values for the five adapter
   documents (A1-A5); the report cannot contain its own final SHA-256 because
   adding that value changes the file and therefore its hash, so the worker
   response must carry the SHA-256 of all six created files including the
   final report.
3. **RED/GREEN evidence:** for each task in section 16, the exact RED command,
   expected failure observed, GREEN command, and passing count. The accepted
   Gate 4A precursor report (`planning/claude-code/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md`)
   remains authoritative for exact Gate 4A task RED/GREEN evidence. The final
   Gate 4 report must contain exact commands, observed failures, corrected
   commands, exits, and markers for every Gate 4B and repair RED. A prose
   description or a section reference is not an exact command; every RED and
   GREEN claim requires its literal command and observed output.
4. **Tests run:** exact commands, exit codes, and counts for section 14.5
   (Gate 2 51/51, Gate 3 25/25, OpenCode 34/34, Kilo 32/32) plus the app
   suites with zero failures and the final recorded counts.
5. **Harness adaptation record:** the before-list of all 43 Gate 2 test names,
   the 8 new test names, proof that every original intent remains represented,
   and the fixed 51/51 result.
6. **Capability evidence:** the capability matrix for all three agents
   (including `builderAvailable`), the canonical-identity alias mapping
   (`claudecode` and `claude-code`), the adaptive-page tests, the first-render
   race tests, the hidden-Build tests, and the agent-switching tests.
7. **Correction evidence:** no clear-applied-route endpoint, action, or event;
   the applied-config fingerprint contract (`appliedRouteConfigSha256`) with
   its stability tests; the route-store-plus-activity rollback transaction
   with its failure-injection tests.
8. **Security checks:** the section 17 scans with their markers, the fake
   marker scans, the dual-lock evidence, the Host/Origin evidence, and the
   fixture-only execution evidence.
9. **Framework and template synchronization:** the exact G1-G7, M1-M9 changes,
   the 2.3.0 version evidence, and the PROJECT_STATE regeneration evidence.
10. **Rollback state:** whether rollback was needed, which paths, and proof
    that pre-existing state was restored.
11. **Failures:** redacted command or stage, exit code, recovery state,
    unresolved blocker, if any.
12. **Risks:** precedence, reload, filesystem, PowerShell 5.1, concurrency,
    capability, or status wording risks observed.
13. **Limitations:** formatting normalization, semantic-only preservation,
    fixture-only execution, no request analytics for Claude, and any deferred
    framework documents.
14. **Status wording:** the report uses "Integrated, not live validated" and
    explicitly states that Gate 5 is unauthorized and unperformed.

The intermediate Gate 4A evidence report
(`planning/claude-code/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md`) is an authorized
precursor artifact created after Gate 4A completes and is referenced by the
final report (R1) created in Gate 4B.

## 23. Stop conditions

Stop immediately and report BLOCKED if any of the following occurs:

- Any action would touch a real Claude path, real settings file, `.claude.json`,
  `.jsonc`, plugin/marketplace/MCP/credential/OAuth/transcript content, or a
  live Claude or IDE process.
- Any command would invoke Claude Code, authenticate, contact an external
  gateway, or use external network access.
- The OpenCode/Kilo provider registry, `agentstore.py`, `discovery.py`, or any
  Gate 3/OpenCode/Kilo test would be weakened; the registry entry were merely
  renamed instead of removed; or a preserved Gate 2 behavioral test were
  removed without a report entry.
- The Claude interface would gain provider, plugin, MCP, marketplace, SDK,
  reasoning-format, BDF-profile, or request-analytics controls, or a fake
  multi-provider model.
- A regression count drops below its expected value.
- Documentation would claim a status stronger than "Integrated, not live
  validated."
- A file outside section 3 would be edited, including any release source,
  generated release file, session file, or deferred framework document.
- The production entry would be exercised against the real home or with
  `-AllowRealTarget` while the lock is on, or either lock would be weakened.
- A real secret or machine-derived private value is encountered.
- The worker is asked to commit, stage, push, or broaden scope without a new
  human-approved Sol handoff.

## 24. Gate 5 is not authorized

This handoff authorizes Gate 4A implementation and Gate 4B documentation only.
Gate 5 (approved live validation: stopping Claude/IDE processes, applying a
route change to a real installation, launching a disposable Claude session,
restore verification against the real target, passing `-AllowRealTarget`) is
explicitly NOT authorized. Any request to perform, plan, or describe Gate 5
execution is out of scope; stop and report BLOCKED. Public support status for
Claude Code remains unchanged until Gate 5 passes and is released.
