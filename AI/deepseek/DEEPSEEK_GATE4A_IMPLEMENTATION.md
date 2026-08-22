# DeepSeek Gate 4A Implementation

You are DeepSeek V4 Flash Max implementing Gate 4A in the shared workspace.

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

Use only fixed fake secret markers from the Gate 4 handoff. Stop with `BLOCKED`
if protected data is encountered. Never quote protected values.

Do not invoke Claude Code. Do not authenticate. Do not contact an external
gateway. Do not use external network access. Do not pass `-AllowRealTarget`.

## Read First

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`
4. `planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md`
5. `planning/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md`
6. `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`
7. Gate 2 and Gate 3 reports
8. Every actual Gate 4A source/test file named by handoff section 3

## Authorization

Implement **Gate 4A only**:

- capabilities;
- dedicated Claude discovery;
- active-agent adaptive interface;
- shared PowerShell routing core;
- fixture and production entry points;
- multiple saved Claude routes with one applied route;
- apply/restore transactions;
- adaptive Overview, Routes, Settings, navigation, and Route Activity;
- backend/frontend tests;
- all required regressions.

Do not implement Gate 4B documentation/framework/template changes yet.
Do not create final Gate 4 report.
Do not start Gate 5.

Do not commit, stage, push, merge, reset, clean, move, or delete pre-existing
files. Preserve all unrelated dirty changes, including changes inside a Gate 4A
file. Read and layer changes; never overwrite user work.

## Pre-Implementation Corrections

Before production code, amend exactly these planning files to record the six
final corrections below:

- `planning/CLAUDE_CODE_ADAPTIVE_SWITCHER_UI_DESIGN.md`
- `planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`

These two planning edits are explicitly authorized in addition to Gate 4A
scope. Update exact file counts/report scope accordingly.

### Correction 1: Remove Clear-Applied-Route

Do not implement `POST /api/claude/routes/clear`.

Clearing only `appliedRouteId` while leaving Claude settings unchanged would
make Switcher claim no route is applied when Claude still uses the prior route.

Rules:

- No clear endpoint.
- No clear button.
- No `route_cleared` activity event.
- An applied route cannot be deleted.
- To delete it, user must first apply another saved route.
- Restore may move `appliedRouteId` backward according to the manifest.
- Before any route has ever been applied, `appliedRouteId` may be null.

Update API, design, tests, activity types, transaction text, and frontend copy.

### Correction 2: Track Applied Configuration Fingerprint

`appliedRouteId` alone cannot tell whether an applied route was edited after
application.

Add to route-store shape:

```text
appliedRouteConfigSha256: string|null
```

Define canonical route fingerprint:

- deterministic JSON over only the selected route's managed configuration;
- stable key order;
- UTF-8;
- lowercase full SHA-256;
- excludes name, id, createdAt, updatedAt;
- includes endpoint, auth kind/reference name, model, and env policies.

Rules:

- Apply sets `appliedRouteId` and `appliedRouteConfigSha256` atomically.
- A route is `Applied` only when id and fingerprint both match.
- Editing the applied route causes fingerprint mismatch and UI state
  `Changes not applied`.
- Reapplying updates target and applied fingerprint.
- Restore restores both previous id and previous fingerprint from the manifest.
- Manifest records `previousAppliedRouteConfigSha256`.
- Null applied id requires null applied fingerprint.

Add backend and frontend tests.

### Correction 3: Normalize Agent Identity Centrally

Current persisted agent names can be `claudecode`, while capability key is
`claude-code`. Agent names can also be user-facing state names.

Define one backend canonicalization function in `capabilities.py`:

```text
opencode -> opencode
kilo -> kilo
kilocode -> kilo
claudecode -> claude-code
claude-code -> claude-code
unknown -> opencode-family safe default only when explicitly justified
```

Prefer registering new Claude entries under canonical name `claude-code`.
Support persisted legacy alias `claudecode` without rewriting or losing the
existing entry. Return both active display name and canonical agent type where
needed. Capabilities key off canonical type, not arbitrary display name.

Frontend receives canonical type from backend and never guesses from directory
or display label. Add migration/alias tests.

### Correction 4: Define Route-Store and Activity Transaction

Create/edit/delete modify route store plus activity log. Two files cannot be
magically atomically replaced together.

Define and implement a rollback-backed transaction under the same adapter lock:

1. Capture previous route-store bytes/absence.
2. Capture previous activity-log bytes/absence.
3. Atomically write route store.
4. Atomically append/rewrite capped activity log.
5. Verify both.
6. If activity commit fails, restore prior route store and prior activity bytes
   atomically and verify.
7. If rollback fails, return generic hard failure and preserve evidence.

Apply/restore transaction must include activity in its existing rollback plan.
Add failure injection tests for activity write and activity rollback.

To reduce private metadata, remove `routeName` from activity events. Store only:

```json
{ "ts": "<UTC>", "type": "route_applied", "routeId": "<id|null>" }
```

No user-entered route names in activity logs.

### Correction 5: Prevent Capability-Load Render Race

Current `showWorkspace()` calls async `refreshAgentContext()` without awaiting
it, then initializes the router immediately.

Update contract and implementation:

- `showWorkspace` becomes async or otherwise waits for status, agents, and
  capabilities before first route render and sidebar adaptation.
- Router never renders an incompatible page using stale/null capabilities.
- On capability-load failure, use a documented safe fallback and show an error;
  never expose Claude-incompatible controls for an active Claude agent.
- Agent switch awaits refreshed context before navigation/render.
- Add delayed-response tests proving no first-render flash of Integrations,
  provider controls, or Build controls for Claude.

### Correction 6: Hide Global Builder Controls for Claude

The shared shell includes `#globalBuildButton`. Claude first adapter does not use
the OpenCode/Kilo builder action.

Add capability field:

```text
builderAvailable: boolean
```

Values:

- OpenCode: true
- KiloCode: true
- Claude Code: false

Capability navigation/shell adaptation hides the global Build button for Claude
and restores it when switching back. Direct invocation of the generic build
action while Claude is active must be blocked in frontend and backend-safe
behavior. Add switching and direct-action tests.

## Implementation Method

Use strict TDD and the Gate 4A sequence from the corrected handoff.

### Phase A1: Baseline and protected state

- Capture `git status --short --branch`.
- Record pre-existing modified/untracked paths.
- Do not inspect global config, real Claude paths, backups, or credentials.
- Run current Gate 2, Gate 3, OpenCode, Kilo, app Python, and current frontend
  suites before edits.
- If a baseline suite fails, report exact failure and stop unless the handoff
  explicitly identifies it as pre-existing and permits continuation.

### Phase A2: Planning corrections

- Apply six planning corrections above.
- Recalculate Gate 4A and total scope counts.
- Run ASCII, placeholder, and `git diff --check` on planning files.

### Phase A3: Shared core and Gate 2 harness

- Preserve all 43 original Gate 2 intents.
- Add exactly the eight named core/wrapper tests.
- RED before extraction where applicable.
- Extract shared core.
- Adapt wrapper and harness.
- Gate 2 must finish 51/51.

### Phase A4: Capabilities and identity

- Tests first for matrix, canonical agent aliases, API, active-agent switching,
  builderAvailable, and safe fallback.
- Implement backend/frontend capability source.
- Fix initial render and switch sequencing.

### Phase A5: Saved routes and production transaction

- Tests first for saved-route store including applied fingerprint.
- Implement production Apply/Restore and shared-core operations.
- Implement strict route CRUD/apply/restore/activity endpoints.
- All tests use GUID temporary profile roots and fake markers.
- Never pass `-AllowRealTarget`.

### Phase A6: Adaptive UI

- Tests first for Connect Agent, navigation, Routes, Overview, Settings, Route
  Activity, hidden Integrations, hidden Build, switching back, accessibility,
  mobile, and escaping.
- Implement only capability-dependent content. Keep shared visual shell.

### Phase A7: Full verification

Required:

- Gate 2: 51/51.
- Gate 3: 25/25.
- OpenCode: 34/34.
- Kilo: 32/32.
- App Python: zero failures; record total.
- Every frontend suite: zero failures; record each total.
- PowerShell parser checks.
- Python syntax/import checks.
- Node syntax/tests.
- Host/Origin security tests.
- Full SHA-256 revision tests.
- Real-target dual-lock tests without file probing.
- Saved-route/apply/restore/manifest/prune/rollback/activity tests.
- Capability alias, first-render race, hidden navigation, hidden Build, and
  switch-back tests.
- Exact Gate 4A scope and pre-existing dirty-state preservation.

## Gate 4A Report

Create exactly:

`planning/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md`

This intermediate report is authorized in addition to corrected handoff scope.
It must contain:

- status PASS/FAIL/BLOCKED;
- exact changed files;
- pre-existing dirty paths preserved;
- RED/GREEN evidence by phase;
- exact commands, exit codes, and counts;
- Gate 2 original-name/intention mapping plus eight new tests;
- security scans and fake-marker redaction;
- dual-lock proof;
- fixture-only execution proof;
- failures and rollback evidence;
- remaining risks;
- explicit statement that Gate 4B and Gate 5 are unperformed.

Do not update BDF, templates, root docs, adapter docs, PROJECT_STATE, or final
Gate 4 report in this task.

## Stop Conditions

Stop with `BLOCKED` if:

- any real Claude path would be probed or mutated;
- protected data appears;
- external network or Claude invocation would occur;
- a file outside corrected planning files, Gate 4A scope, or Gate 4A report
  must change;
- Gate 2 original behavior must be weakened;
- OpenCode/Kilo behavior regresses;
- the shared app shell requires redesign;
- Gate 4B or Gate 5 work becomes necessary;
- user work would be overwritten or reverted.

## Final Self-Review

Before reporting PASS:

- all six pre-implementation corrections present in design/handoff and code;
- no clear-applied-route endpoint/action/event;
- applied fingerprint accurately marks pending edits;
- canonical agent identity handles `claudecode` and `claude-code`;
- route/activity transaction rollback proven;
- first render waits for capabilities;
- global Build hidden and blocked for Claude;
- same shell and visual identity retained;
- no plugin/MCP counts or protected reads;
- no request analytics claimed for Claude;
- all required suites green;
- no commit/staging;
- unrelated dirty changes preserved;
- report complete and ASCII;
- `git diff --check` passes for Gate 4A paths.

## Return Contract

Return only:

```text
Status: PASS, FAIL, or BLOCKED
Planning files amended:
Gate 4A files created:
Gate 4A files modified:
Gate 4A exact file count:
Gate 2 result:
Gate 3 result:
OpenCode result:
Kilo result:
App Python result:
Frontend results:
Security verification:
Failures and rollback:
Pre-existing changes preserved:
Report path:
Remaining work:
```

Put detailed evidence in the Gate 4A report, not chat.
