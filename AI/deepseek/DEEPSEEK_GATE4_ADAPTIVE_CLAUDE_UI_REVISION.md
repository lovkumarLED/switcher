# DeepSeek Gate 4 Adaptive Claude Interface Revision

You are DeepSeek V4 Flash Max updating the approved Gate 4 design and handoff
after the user clarified how Claude Code must behave inside Switcher.

## Workspace

`C:\Users\loveb\.config\opencode\docs`

## Security Override

Do not read global `opencode.json`, credentials, credential-bearing backups,
environment-secret values, generated configuration containing real keys, or
real Claude configuration/state.

Never read, enumerate, search, copy, hash, parse, modify, or delete:

- `C:\Users\loveb\.claude.json`
- real `C:\Users\loveb\.claude` contents
- any `.jsonc` file
- plugin or marketplace contents
- MCP credentials
- OAuth/session data
- prompts or transcripts

Use fixed fake markers only. Stop with `BLOCKED` if protected data is
encountered. Never quote protected values.

## Task

Create or revise exactly these two planning files:

1. Create `planning/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md`.
2. Revise `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`.

Do not implement Gate 4. Do not edit any other project file. Do not commit,
stage, push, merge, reset, clean, move, or delete files.

Read the current Gate 4 handoff revision first. Preserve its corrected safety,
transaction, manifest, revision-token, shared-core, framework, template,
version, and Gate 5 boundaries unless this prompt explicitly changes them.

## User-Approved Product Direction

Switcher does NOT receive a new visual identity or complete redesign.

The following remain unchanged across OpenCode, KiloCode, and Claude Code:

- app shell;
- sidebar structure and visual language;
- colors;
- typography;
- spacing system;
- dialogs;
- animations;
- responsive conventions;
- overall navigation style.

When the active agent changes, only capability-dependent page content,
navigation availability, labels, cards, controls, and data change.

Claude Code is fundamentally different from OpenCode/KiloCode and must not be
forced into their provider/plugin/MCP/profile contracts.

## 1. Introduce an Agent Capability Contract

Design one central capability contract. Do not scatter repeated
`if agent == claude` checks across pages.

The contract must represent at least:

```text
providerMode: "multi-provider" | "scalar-route"
savedRoutes: boolean
providerCreation: boolean
providerActivation: boolean
pluginsManaged: boolean
mcpManaged: boolean
integrationsVisible: boolean
reasoningFormats: boolean
sdkSelection: boolean
profilesMode: "bdf-profiles" | "routing-profiles"
requestAnalytics: boolean
routingActivity: boolean
```

Required values:

### OpenCode and KiloCode

```text
providerMode = multi-provider
savedRoutes = false
providerCreation = true
providerActivation = true
pluginsManaged = true
mcpManaged = true
integrationsVisible = true
reasoningFormats = true
sdkSelection = true
profilesMode = bdf-profiles
requestAnalytics = true
routingActivity = false
```

### Claude Code

```text
providerMode = scalar-route
savedRoutes = true
providerCreation = false
providerActivation = false
pluginsManaged = false
mcpManaged = false
integrationsVisible = false
reasoningFormats = false
sdkSelection = false
profilesMode = routing-profiles
requestAnalytics = false
routingActivity = true
```

Inspect the actual backend status, frontend router, sidebar, page modules, and
state store. Select one exact source of truth for capabilities and name every
file required to expose and consume it.

Tests must prove all pages consume the central contract rather than inventing
independent Claude checks.

## 2. Connect Your Agent Must Auto-Detect Claude

When the user opens Connect Your Agent, Claude Code must appear automatically
when its supported settings target is structurally detected.

Requirements:

- Generic `AGENT_REGISTRY` must still remove the unsafe Claude entry that lists
  `.claude.json`.
- Dedicated Claude discovery performs the supported structural settings-target
  check.
- Connect Your Agent combines generic OpenCode/Kilo discovery with dedicated
  Claude discovery without parsing protected Claude state.
- Selecting Claude sets it as the active agent through an exact app state
  contract.
- Switching active agent immediately refreshes capability-dependent navigation
  and page content.
- A stale direct URL to a hidden Claude-incompatible page redirects to the
  Claude Overview instead of rendering forbidden controls.

Inspect `app/app/discovery.py`, `app/app/agents.py`, onboarding modules, router,
store, and sidebar/navigation modules. Revise the Gate 4 exact file scope to
include every required file. Do not leave alternatives or worker-selected
scope.

## 3. Multiple Saved Claude Routing Profiles, One Applied Route

The user approved multiple saved routes with exactly one applied route.

Concept:

- Switcher may remember several Claude connection presets.
- Claude Code receives only one scalar endpoint/auth/model/policy tuple at a
  time.
- Applying a saved route backs up and patches Claude settings through the
  production transaction.
- Other routes remain saved but inactive.
- This is not simultaneous multi-provider activation.

Replace the single-route source design with one exact saved-route store, for
example:

`app/state/claude-routes.json`

Define and validate an exact versioned shape containing:

```text
version
appliedRouteId
routes[]
```

Each route must contain only non-secret configuration metadata:

```text
id
name
endpoint.baseUrl
endpoint.auth kind plus environment-variable reference name
model.value
model.source
envPolicy
createdAt
updatedAt
```

Rules:

- Route ID is immutable and generated server-side.
- Route name is user-visible, bounded, non-empty, and unique under an explicit
  case policy.
- Secret values are never stored; only environment-variable reference names.
- Exactly zero or one `appliedRouteId` exists.
- `appliedRouteId` must reference an existing route.
- Creating/editing a saved route does not automatically apply it.
- Applying route B does not delete route A.
- Deleting the applied route is rejected until another route is applied or the
  active route is explicitly cleared under a separately defined safe action.
- Editing the applied route does not silently patch Claude. It becomes a saved
  unapplied change until the user explicitly chooses Apply, or the UI clearly
  requires Apply after Save. Choose one behavior and state it exactly.
- Route store writes are atomic, locked, revisioned, and Git-ignored.
- Target settings, saved-route store, route activity, and backup manifest remain
  transactionally consistent.

Update the prior single `claude-route.json` source, manifest previous-route
metadata, backup/restore logic, revision tokens, rollback ordering, API fields,
tests, docs, and file-scope counts consistently.

## 4. Exact Claude Route API

Design strict endpoints for saved routes. Prefer resource-oriented routes such
as:

```text
GET    /api/claude/routes
POST   /api/claude/routes
GET    /api/claude/routes/{route_id}
PUT    /api/claude/routes/{route_id}
DELETE /api/claude/routes/{route_id}
POST   /api/claude/routes/{route_id}/apply
POST   /api/claude/restore
GET    /api/claude/status
GET    /api/claude/activity
```

Inspect project conventions and choose the exact endpoint set now. No
alternatives in the final handoff.

Requirements:

- No endpoint accepts a filesystem path.
- Strict schemas reject unknown fields.
- Save/edit stores environment-reference names only.
- Apply requires full target revision and route-store revision tokens.
- Delete requires route-store revision and rejects applied route deletion.
- Restore requires target revision and restores corresponding applied-route
  state.
- Responses never include private paths, resolved secrets, protected values, or
  backup paths.
- Host/Origin protections from the corrected handoff remain.
- All mutations share one lock and stale-write contract.
- PowerShell real-target lock remains independent.

## 5. Claude Providers Page Becomes Routes

Do not redesign the page shell. When Claude is active, replace only provider
content with a Claude Routes workspace.

Required Claude content:

- Page title: `Claude routes`.
- Short explanation: one route can be applied at a time.
- `Add route` action.
- Saved-route cards.
- Applied route visibly marked `Applied`.
- Inactive routes visibly marked `Saved`.
- Card actions show only:
  - `Apply route` for an inactive route;
  - `View details` for every route.
- Do not show provider activation/deactivation, provider test, SDK, reasoning
  format, model-list count, plugin count, MCP count, or remove action directly
  on the card.
- Add, edit, delete, and detailed validation controls live inside the route
  details/editor flow.
- Delete applied route is disabled with clear copy.

Route editor fields:

- Route name.
- Endpoint base URL.
- Auth strategy: API key reference or bearer-token reference.
- Environment-variable reference name.
- Model ID.
- Gateway discovery toggle.
- Disable experimental beta headers toggle.
- Auto-compact window.
- Disable nonessential traffic toggle.

Do not show:

- SDK type;
- provider package;
- reasoning-format selector;
- provider model collection;
- provider activation controls.

Keep preservation, backup, restart, unsupported-surface, accessibility,
escaping, focus, keyboard, mobile, loading, error, and success requirements.

## 6. Claude Overview Is Tailored, Not Redesigned

When Claude is active, Overview keeps the same page shell and design language
but shows Claude-relevant information:

- applied route name;
- endpoint configured state without exposing private values unnecessarily;
- active model ID;
- auth-reference configured state;
- saved-route count;
- latest backup availability;
- real-target lock state;
- restart-required notice;
- recent routing activity.

Do not show:

- active provider count;
- multi-provider relay deck;
- plugin count;
- MCP count;
- reasoning-format summary;
- OpenCode/Kilo build status presented as Claude status.

Inspect the actual Overview module and add exact files/tests to handoff scope.

## 7. Claude Navigation and Hidden Features

When Claude is active:

- Providers navigation label becomes `Routes`.
- Integrations navigation is hidden.
- Direct navigation to Integrations redirects to Claude Overview.
- Plugin and MCP controls are absent, not merely disabled.
- OpenCode/Kilo profile management is absent.
- Reasoning-format and SDK controls are absent.
- Settings renders only Claude-supported adapter settings and routing-profile
  information.

When OpenCode or Kilo becomes active again, all their existing navigation and
features return unchanged.

Inspect actual navigation, router, settings, integrations, and page modules.
Name exact modified files and exact tests. Do not redesign shared shell CSS.

## 8. Claude Analytics Is Routing Activity Only

Gate 4 does not build an Anthropic-compatible request proxy.

Therefore Claude analytics must not claim request, token, latency, success-rate,
or model-usage telemetry.

Claude Activity records only Switcher-controlled routing events:

- route created;
- route edited;
- route deleted;
- route applied;
- backup created;
- restore completed;
- validation failed;
- apply failed;
- restore failed.

Define exact redacted event shape, storage path under ignored `app/state/`,
retention/cap, atomic append or storage contract, API response, and UI timeline.

Events must never contain:

- secret values;
- environment-variable resolved values;
- private absolute paths;
- target contents;
- prompts;
- transcripts;
- request payloads;
- user message content.

When Claude is active, Analytics page becomes `Route activity` using the same
page shell. When OpenCode/Kilo is active, existing request analytics remains
unchanged.

## 9. Plugins, MCP, and Integrations

Do not show plugin, MCP, marketplace, or integration counts for Claude.

The first Claude adapter intentionally does not manage or inspect those
surfaces. Obtaining counts could require protected Claude state or plugin
directory inspection.

Requirements:

- Integrations navigation hidden for Claude.
- No plugin/MCP count on Overview.
- No plugin/MCP controls in Settings.
- No reads of protected state to calculate counts.
- Adapter docs state that these remain Claude-owned and unsupported in the
  first release.

## 10. Claude Profiles Terminology

For Claude UI, use `Routes` or `Routing profiles`, not BDF profiles and not
providers.

- OpenCode/Kilo keep BDF profile terminology.
- Claude saved routes are routing profiles.
- Exactly one route may be applied.
- No fake provider registry is created.

## 11. Capability-Driven Testing

Add exact tests proving:

- central capabilities for all three agents;
- switching active agent changes only capability-dependent content;
- switching back restores OpenCode/Kilo controls;
- Claude appears in Connect Your Agent through dedicated discovery;
- generic registry still excludes Claude protected-state parsing;
- hidden navigation routes redirect safely;
- Integrations absent for Claude;
- Providers label becomes Routes;
- Overview swaps relay/provider metrics for route status;
- Analytics swaps request charts for redacted route activity;
- Settings hides plugins, MCP, SDK, reasoning formats, and BDF profiles;
- multiple saved routes persist;
- exactly one applied route;
- create/edit/delete/apply stale revisions;
- applied route deletion rejected;
- applying a route patches target only through approved transaction;
- restore returns target and applied-route state consistently;
- OpenCode/Kilo regressions remain unchanged.

Use real DOM/behavior tests where repository conventions permit; do not rely
only on fragile source substring checks for critical navigation behavior.

## 12. Documentation and Framework Impact

Update design/handoff documentation requirements to explain:

- capability-driven agent interface;
- shared shell with adaptive content;
- scalar routing profiles;
- multiple saved routes, one applied;
- routing activity versus request analytics;
- unsupported plugin/MCP/integration surfaces;
- no fake multi-provider Claude model.

Generic BDF/templates describe capability-driven unique adapters without Claude
specifics. Claude-specific details remain under `adapters/claude-code/`.

Keep framework 2.3.0, status `Integrated, not live validated`, and Gate 5
boundary unless new repository evidence requires a documented change.

## 13. Reconcile with Technical Revision 4

Preserve and reconcile all valid technical fixes from revision 4, including:

- coherent locked endpoint behavior;
- full SHA-256 revisions;
- Apply/Restore schema identity;
- previous-route backup lifecycle, adapted to multiple routes;
- manifest pop/prune safety;
- rollback ordering;
- Host/Origin protection;
- executable lifecycle-status scans;
- report-inclusive final scan;
- repository-bounded PROJECT_STATE verification;
- fixed Gate 2 expected count;
- restore of old state without current-route equivalence;
- runtime-state ignore rules;
- dual real-target locks;
- shared routing core;
- semantic preservation and formatting disclosure.

If revision 4 is not yet present in the handoff, incorporate its report output
and verify each technical item directly in the file before completing this
task.

## 14. Exact Scope and Phased Implementation

Recalculate exact file scope after inspecting actual modules. No alternatives,
wildcards, `as needed`, `and/or`, or worker-selected scope.

Split implementation into two executable phases inside the handoff:

### Gate 4A

- capabilities;
- dedicated discovery and active-agent switching;
- shared core/production entry;
- saved routes and APIs;
- adaptive Overview, Routes, Settings, navigation, and Route Activity;
- backend/frontend tests;
- all regressions.

### Gate 4B

- five Claude adapter documents;
- BDF framework 2.3.0;
- templates;
- root/app docs;
- DECISIONS;
- PROJECT_STATE regeneration;
- final report and scans.

Gate 4B may start only after Gate 4A tests and regressions pass.

## Required Outputs

### Design file

`planning/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md` must contain:

- approved product direction;
- capability matrix;
- page-by-page behavior for each agent family;
- saved-route model;
- route lifecycle;
- activity model;
- navigation behavior;
- accessibility/responsive behavior;
- non-goals;
- acceptance criteria;
- Gate 4A/4B split.

### Revised handoff

`planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md` must:

- supersede single-route assumptions;
- include exact files and counts;
- include exact RED/GREEN tasks;
- include exact verification commands;
- include fixed expected regression counts;
- include report contract;
- include security scans;
- preserve Gate 5 prohibition.

## Self-Review

Before returning, verify:

- no full visual redesign;
- shared shell unchanged;
- capability contract is central;
- Claude auto-detects safely;
- multiple saved routes and one applied route are coherent;
- provider terminology is not used for Claude UI;
- no plugin/MCP counts or protected inspection;
- request analytics are not claimed for Claude;
- Route Activity is redacted;
- hidden pages redirect safely;
- OpenCode/Kilo behavior returns unchanged when selected;
- all revision-4 transaction/security fixes remain;
- exact Gate 4A/4B file scope;
- no implementation occurred;
- no protected configuration read;
- ASCII, no unresolved TODO/TBD placeholders;
- `git diff --check` passes for both planning files.

## Return Contract

Return only:

```text
Status: PASS or BLOCKED
Created design file:
Modified handoff file:
Capability source of truth:
Saved-route store:
Gate 4A exact file count:
Gate 4B exact file count:
Total exact file count:
Final Gate 2 expected count:
Checks performed:
Concerns:
Remaining work:
```

Put full details in the two planning files, not chat.
