# Claude Code Adaptive Switcher Interface Design

Date: 2026-08-14
Status: Approved design (user-approved product direction; Gate 4 implementation
handoff is the executable contract)
Scope: Capability-driven adaptive interface for OpenCode, KiloCode, and Claude
Code inside the Switcher app

## 1. Approved product direction

Switcher does NOT receive a new visual identity or a complete redesign.

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

Claude Code is fundamentally different from OpenCode/KiloCode and is not forced
into their provider, plugin, MCP, or profile contracts.

## 2. Agent capability contract

One central capability contract exists. Pages never scatter repeated
`if agent == claude` checks.

### 2.1 Contract fields and values

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
builderAvailable: boolean
```

OpenCode and KiloCode:

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
builderAvailable = true
```

Claude Code:

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
builderAvailable = false
```

### 2.2 Source of truth

- Backend: `app/app/capabilities.py` (new module) holds the exact matrix above
  keyed by canonical agent type (`opencode`, `kilo`, `claude-code`) and
  exposes `GET /api/capabilities` returning the capability object for the
  active agent. It also exposes the single canonicalization function
  `canonical_agent_type(name)` mapping `opencode -> opencode`, `kilo ->
  kilo`, `kilocode -> kilo`, `claudecode -> claude-code`, `claude-code ->
  claude-code`. This module is the single backend source of truth for both
  capabilities and canonical agent identity. It performs no Claude-state
  access.
- Frontend: `app/assets/js/core/capabilities.js` (new module) reads
  `store.get().capabilities` and exposes `agentCapabilities()`,
  `isClaude()`, `isOpenCodeFamily()`, `navigationFor(capabilities)`, and
  `resolveDestination(destination, capabilities)`. The frontend receives the
  canonical agent type from the backend and never guesses it from a directory
  or display label. Every page, the router, and the sidebar consume this
  module; no page invents its own agent checks.
- State: `app/assets/js/core/store.js` gains the `capabilities` field,
  populated by `main.js` `refreshAgentContext` alongside status and agents.
- Tests prove all pages consume the central contract (section 11).

## 3. Page-by-page behavior

### 3.1 Connect Your Agent (onboarding)

- Generic registry discovery (OpenCode, Kilo) is unchanged and the generic
  `claudecode` registry entry is removed (no `.claude.json` in the generic
  registry).
- A dedicated Claude discovery call (`GET /api/claude/discover`) performs the
  supported structural settings-target check: existence of
  `%USERPROFILE%\.claude\settings.json` resolved via structural path
  construction. No protected state is read or enumerated.
- The agent screen combines generic OpenCode/Kilo cards with a Claude Code
  card when the structural check passes.
- Selecting Claude Code registers it as the active agent through the existing
  app state contract (`POST /api/agents` with the structurally resolved Claude
  directory), then continues to the dashboard.
- Switching the active agent immediately refreshes capability-dependent
  navigation and page content (sidebar labels, hidden destinations, page
  modules).

### 3.2 Navigation

- Providers navigation label becomes `Routes` when Claude is active.
- Integrations navigation is hidden when Claude is active.
- The global Build button (`#globalBuildButton`) is hidden when Claude is
  active and restored when OpenCode or Kilo is active; direct invocation of
  the generic build action while Claude is active is blocked in the frontend
  and safe by backend behavior (the generic build endpoint is not wired to
  any Claude surface).
- A stale direct URL to Integrations while Claude is active redirects to the
  Claude Overview instead of rendering forbidden controls.
- Plugin, MCP, SDK, reasoning-format, and OpenCode/Kilo profile controls are
  absent, not merely disabled.
- When OpenCode or Kilo becomes active again, all existing navigation and
  features return unchanged.

### 3.3 Overview

Same page shell and design language. OpenCode/Kilo keep the provider relay,
KPIs, and request analytics. Claude shows:

- applied route name;
- endpoint configured state (boolean, no private values);
- active model ID;
- auth-reference configured state (boolean);
- saved-route count;
- latest backup availability;
- real-target lock state;
- restart-required notice;
- recent routing activity summary.

Claude Overview never shows: active provider count, multi-provider relay deck,
plugin count, MCP count, reasoning-format summary, or OpenCode/Kilo build
status presented as Claude status.

### 3.4 Providers page becomes Routes (Claude active)

Page title: `Claude routes`. Short explanation: one route can be applied at a
time.

- `Add route` action.
- Saved-route cards; applied route visibly marked `Applied`; inactive routes
  marked `Saved`.
- Card actions show only `Apply route` (inactive) and `View details` (every
  route).
- No provider activation/deactivation, provider test, SDK, reasoning format,
  model-list count, plugin count, MCP count, or remove action on the card.
- Add, edit, delete, and detailed validation controls live inside the route
  details/editor flow.
- Delete applied route is disabled with clear copy ("Apply another route or
  clear the applied route before deleting this one.").

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

Never shown: SDK type, provider package, reasoning-format selector, provider
model collection, provider activation controls.

### 3.5 Activity becomes Route activity (Claude active)

Gate 4 builds no Anthropic-compatible request proxy. Claude analytics claim no
request, token, latency, success-rate, or model-usage telemetry. Route activity
records only Switcher-controlled routing events (section 5). Same page shell.

### 3.6 Integrations (Claude active)

Hidden from navigation; direct navigation redirects to Overview. No plugin,
MCP, marketplace, or integration counts anywhere for Claude. The first Claude
adapter does not manage or inspect those surfaces, and no protected state is
read to calculate counts.

### 3.7 Settings (Claude active)

Settings renders only Claude-supported adapter settings and routing-profile
information: route list summary, applied-route state, backup/restore status,
restart notice, preservation notice, and the unsupported-surface statement.
Plugins, MCP, SDK selection, reasoning-format editor, BDF profile switcher, and
builder controls are absent.

### 3.8 Terminology

- OpenCode/Kilo keep BDF profile and provider terminology.
- Claude UI uses `Routes` or `Routing profiles`, never providers, never BDF
  profiles.
- Exactly one route may be applied. No fake provider registry is created.

## 4. Saved-route model

Store: `app/state/claude-routes.json` (ignored, atomic, locked, revisioned).

Versioned shape:

```json
{
  "version": 1,
  "appliedRouteId": null,
  "appliedRouteConfigSha256": null,
  "routes": []
}
```

Each route contains only non-secret configuration metadata:

```json
{
  "id": "<server-generated immutable id>",
  "name": "<user-visible, non-empty, bounded, unique>",
  "baseUrl": "<endpoint>",
  "authKind": "apiKey",
  "secretEnvRef": "<environment-variable name>",
  "model": "<model id>",
  "gatewayDiscovery": false,
  "disableExperimentalBetas": false,
  "autoCompactWindow": 190000,
  "disableNonessentialTraffic": false,
  "createdAt": "<UTC ISO 8601>",
  "updatedAt": "<UTC ISO 8601>"
}
```

Rules:

- Route ID is immutable and generated server-side.
- Route name is unique under a case-insensitive comparison, length 1-64.
- Secret values are never stored; only environment-variable reference names.
- Exactly zero or one `appliedRouteId` exists.
- `appliedRouteId` must reference an existing route.
- `appliedRouteConfigSha256` is the canonical fingerprint of the applied
  route's managed configuration: deterministic JSON over exactly the fields
  `baseUrl`, `authKind`, `secretEnvRef`, `model`, `gatewayDiscovery`,
  `disableExperimentalBetas`, `autoCompactWindow`,
  `disableNonessentialTraffic` with stable key order, UTF-8 encoding, lowercased
  full SHA-256. It excludes `id`, `name`, `createdAt`, and `updatedAt`.
- Apply sets `appliedRouteId` and `appliedRouteConfigSha256` atomically.
- A route is shown as `Applied` only when both `appliedRouteId` and
  `appliedRouteConfigSha256` match that route's current fingerprint.
- Editing the applied route causes a fingerprint mismatch, and the route shows
  `Changes not applied` until the user explicitly chooses Apply.
- Reapplying updates the target and the applied fingerprint.
- A null `appliedRouteId` requires a null `appliedRouteConfigSha256`.
- Creating or editing a saved route does not automatically apply it.
- Applying route B does not delete route A.
- Deleting the applied route is rejected until another route is applied.
  There is no clear-applied-route action: clearing `appliedRouteId` alone
  would falsely claim no route is applied while Claude still uses the prior
  route. Before any route has ever been applied, `appliedRouteId` is null.
- Editing the applied route does not silently patch Claude. After a save the
  route shows `Changes not applied`; the user must explicitly choose Apply.
  Save never applies.
- Route-store writes are atomic (same-directory `.tmp` plus replace), serialized
  under the adapter lock, revisioned (store SHA-256), and Git-ignored.
- Target settings, the saved-route store, route activity, and the backup
  manifest remain transactionally consistent (section 6).
- Restore may move `appliedRouteId` and `appliedRouteConfigSha256` backward
  according to the manifest's previous-route metadata.

Apply derives the schema-compliant routing profile document (target, scope,
endpoint with one auth reference, model, envPolicy) from the selected route and
passes it through the production entry transaction; Claude Code receives only
one scalar tuple at a time. This is not simultaneous multi-provider activation.

## 5. Route activity model

Store: `app/state/claude-activity.jsonl` (ignored), capped at 200 events
(oldest dropped first via bounded rewrite under the adapter lock).

Event shape:

```json
{
  "ts": "<UTC ISO 8601>",
  "type": "route_applied",
  "routeId": "<id or null>"
}
```

Event types: `route_created`, `route_edited`, `route_deleted`,
`route_applied`, `backup_created`, `restore_completed`, `validation_failed`,
`apply_failed`, `restore_failed`. User-entered route names never appear in
activity events.

Events never contain: secret values, environment-variable resolved values,
private absolute paths, target contents, prompts, transcripts, request
payloads, user message content, or user-entered route names.

API: `GET /api/claude/activity?limit=100` returns
`{ events: [...], count, cappedAt: 200 }`. The Route activity page renders a
chronological timeline with the same page shell.

## 6. Transactional consistency

The adapter lock serializes all mutations. Three artifacts commit
consistently for route mutations:

- route store (`app/state/claude-routes.json`) for create/edit/delete/apply;
- backup manifest (`app/state/claude-backup-manifest.json`) for apply and
  restore;
- target settings through the production entry for apply and restore.

Route create/edit/delete commit the store and the activity log through a
rollback-backed transaction under the adapter lock: capture previous route-
store bytes or absence, capture previous activity-log bytes or absence,
atomically write the route store, atomically append or rewrite the capped
activity log, verify both, and if the activity commit fails, restore the prior
store and prior activity bytes atomically and verify. If the rollback fails,
return a generic hard failure and preserve evidence. Apply and restore include
the activity log in their existing rollback plans (the apply plan of the Gate
4 handoff section 11.7 gains the activity-log step).

First-render sequencing: `showWorkspace` waits for status, agents, and
capabilities before the first route render and sidebar adaptation; the router
never renders an incompatible page with stale or null capabilities; on
capability-load failure a documented safe fallback renders with an error and
never exposes Claude-incompatible controls for an active Claude agent; agent
switch awaits refreshed context before navigation or render.

## 7. Accessibility and responsive behavior

All Claude content inherits the shared shell conventions: dialog focus
management (focus first field on open, Escape closes, focus returns to the
trigger), keyboard operability, HTML escaping of every API-derived value, the
390px responsive viewport contract, loading/error/success states, and
prefers-reduced-motion handling. No new shell CSS; page styles extend
`app/assets/css/provider-workspace.css`.

## 8. Non-goals

- No visual redesign of the app shell or shared components.
- No simultaneous multi-provider activation inside Claude settings.
- No Anthropic-compatible request proxy.
- No request/token/latency analytics for Claude.
- No plugin, MCP, marketplace, skill, permission, hook, memory, or credential
  management for Claude.
- No reads of protected Claude state to compute counts.
- No fake provider registry for Claude.
- No BDF profile management for Claude.
- No Gate 5 live validation in Gate 4.
- No public support claim beyond "Integrated, not live validated."

## 9. Acceptance criteria

1. All three agents resolve capabilities from the single backend matrix and
   the single frontend helper module; no page contains independent agent
   checks.
2. Switching active agent changes only capability-dependent content; switching
   back restores OpenCode/Kilo controls unchanged.
3. Claude appears in Connect Your Agent through dedicated structural
   discovery; the generic registry excludes Claude protected-state parsing.
4. Multiple saved routes persist; exactly one route is applied; apply patches
   the target only through the approved transaction; applied-route deletion is
   rejected.
5. Integrations is hidden and redirects safely for Claude; the Providers label
   becomes Routes.
6. Overview and Activity swap provider/request content for route status and
   redacted route activity.
7. Settings hides plugins, MCP, SDK, reasoning formats, and BDF profiles for
   Claude.
8. All revision-4 security and transaction contracts hold (locked endpoints,
   full SHA-256 revisions, dual locks, manifest pop/prune, rollback ordering,
   Host/Origin, restore without current-route equivalence).
9. No clear-applied-route endpoint, action, or activity event exists; deleting
   the applied route is rejected; restore moves `appliedRouteId` and
   `appliedRouteConfigSha256` backward per the manifest.
10. A route shows `Applied` only when its id and canonical fingerprint both
    match; editing the applied route shows `Changes not applied`.
11. Canonical agent identity maps `claudecode` and `claude-code` to
    `claude-code`; capabilities key off the canonical type; persisted legacy
    aliases are supported without rewriting.
12. Route store and activity log commit and roll back together.
13. First render waits for capabilities; no flash of Integrations, provider,
    or Build controls for Claude.
14. The global Build button is hidden for Claude and restored on switch-back;
    direct build invocation is blocked for Claude.
15. Gate 2 51/51, Gate 3 25/25, OpenCode 34/34, Kilo 32/32, and zero-failure
    app/frontend suites.

## 10. Gate 4A/4B split

Gate 4A (implementation and tests): capabilities module, dedicated Claude
discovery and agent switching, shared routing core and production entry, saved
routes and APIs, adaptive Overview/Routes/Settings/navigation/Route Activity,
backend and frontend tests, and all regressions.

Gate 4B (documentation): the five Claude adapter documents, BDF framework 2.3.0
and templates, root and app documentation, DECISIONS amendment, PROJECT_STATE
regeneration, and the final report and scans.

Gate 4B may start only after Gate 4A tests and regressions pass. The exact
file scope of both phases is defined in the Gate 4 implementation handoff
(`planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`).

## 11. Capability-driven testing

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
- applied fingerprint marks pending edits (`Changes not applied`);
- no clear-applied-route endpoint, action, or event;
- canonical agent identity handles `claudecode` and `claude-code`;
- create/edit/delete/apply stale revisions;
- route store and activity log roll back together;
- applied-route deletion rejected;
- applying a route patches target only through the approved transaction;
- restore returns target, applied-route id, and applied fingerprint
  consistently;
- first render waits for capabilities (no flash of hidden controls);
- global Build hidden and blocked for Claude;
- OpenCode/Kilo regressions remain unchanged.

Real DOM/behavior tests are used where repository conventions permit; critical
navigation behavior is not proven by fragile source substring checks alone.
