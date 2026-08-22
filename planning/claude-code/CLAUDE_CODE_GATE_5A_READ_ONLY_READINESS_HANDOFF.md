# Claude Code Gate 5A Read-Only Readiness Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** This handoff authorizes Gate 5A only. It does not authorize a
> real write, process stop, Claude session, gateway request, lock change,
> `-AllowRealTarget`, release, or Gate 5B.

## 1. Goal and user-visible outcome

Establish whether the accepted Claude Code adapter is ready for a separately
approved live apply/session/restore test without changing real Claude state.

Gate 5A produces a redacted readiness report that answers:

1. Is the expected user-scope settings target present and stable enough to
   snapshot later?
2. Are the opaque Claude state file and known higher-precedence candidates
   baseline-hashed without reading their values?
3. Is the app route store structurally valid, and is at least one route
   technically eligible for a future live test?
4. Does each candidate route's exact secret-reference environment variable
   exist, without exposing its name or value?
5. Are Claude/IDE processes currently present and therefore required to be
   stopped by a future Gate 5B handoff?
6. Is an external recovery snapshot feasible outside the target tree?
7. Do all accepted Gate 2-4 regressions remain at their approved counts?

Gate 5A does not select a route for the user and does not prove runtime routing,
precedence, reload behavior, gateway compatibility, or support.

## 2. Why Gate 5 is split

The research plan's Gate 5 combines snapshot creation, process shutdown, a real
settings write, a disposable Claude session, route verification, and restore.
Those operations share real state and must be sequential. The safe decomposition
is:

- **Gate 5A (this handoff):** read-only readiness and redacted baselines.
- **Gate 5B (not authorized):** private recovery snapshot, process shutdown,
  one approved route apply, disposable session, `/status` and routing evidence,
  restore, and byte/hash comparison.
- **Gate 5C (not authorized):** documentation/status/release synchronization
  only if Gate 5B passes and the user separately approves release work.

The user must review the Gate 5A report before Sol may write Gate 5B.

## 3. Governing sources

Read before any command:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`, especially Gate 5
4. `planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md`
5. `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`, Revision 7
6. `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`
7. `adapters/claude-code/README.md`
8. `adapters/claude-code/ADAPTER.md`
9. `adapters/claude-code/BUILDER_SPEC.md`
10. `adapters/claude-code/TESTING.md`
11. `adapters/claude-code/COMPATIBILITY.md`

If these sources disagree, stop and report `BLOCKED`; do not choose the broader
authority.

## 4. Exact repository scope

Create exactly one file:

- `planning/claude-code/CLAUDE_CODE_GATE_5A_READINESS_REPORT.md`

Do not modify, move, or delete any existing repository file.

Do not create scripts, fixtures, snapshots, logs, screenshots, transcripts,
temporary report fragments, app-state files, backups, or release artifacts.

## 5. Exact real-state read scope

Gate 5A may inspect only the following exact targets and only as specified:

| Label | Target | Allowed operation |
|---|---|---|
| `USER_SETTINGS` | `%USERPROFILE%\.claude\settings.json` | Existence, type, byte size, whole-file SHA-256; parse in memory only to count top-level keys and validate JSON/duplicate-key status without emitting names or values |
| `OPAQUE_STATE` | `%USERPROFILE%\.claude.json` | Existence, type, byte size, whole-file SHA-256 only; never open, parse, copy, enumerate, or scan contents |
| `PROFILE_LOCAL` | `%USERPROFILE%\.claude\settings.local.json` | Existence, type, byte size, whole-file SHA-256 only; never parse or emit content |
| `WORKSPACE_PROJECT` | `.\.claude\settings.json` from the repository root | Existence, type, byte size, whole-file SHA-256 only; never parse or emit content |
| `WORKSPACE_LOCAL` | `.\.claude\settings.local.json` from the repository root | Existence, type, byte size, whole-file SHA-256 only; never parse or emit content |
| `WORKSPACE_MCP` | `.\.mcp.json` from the repository root | Existence, type, byte size, whole-file SHA-256 only; never parse or emit content |
| `ROUTE_STORE` | `app/state/claude-routes.json` | Parse in memory under section 8; emit structural/readiness facts only |
| `BACKUP_MANIFEST` | `app/state/claude-backup-manifest.json` | Existence, type, byte size, SHA-256; parse in memory only for version/entry-count/invariant checks |
| `ACTIVITY_LOG` | `app/state/claude-activity.jsonl` | Existence, type, byte size, SHA-256; validate line count and JSON-line shape without emitting events |

No other Claude, IDE, app-state, environment, registry, credential, cache,
plugin, marketplace, MCP, skill, hook, memory, prompt, session, transcript,
debug, snapshot, backup, or log target may be entered, enumerated, read, copied,
or hashed.

Directory enumeration is forbidden. Resolve only the exact paths above.

## 6. Absolute safety rules

1. No real file write, copy, rename, delete, ACL change, timestamp change, or
   lock acquisition outside normal read handles.
2. Do not stop, suspend, signal, launch, or attach to any process.
3. Do not invoke Claude except the non-interactive `claude --version` command.
4. Do not start the Switcher server or call any HTTP endpoint.
5. Do not contact any gateway, external URL, package registry, or network host.
6. Do not pass `-AllowRealTarget` and do not invoke
   `build-claude-code-production.ps1`.
7. Do not change `ALLOW_REAL_CLAUDE_TARGET = False`.
8. Do not resolve or print a secret value. Check presence with
   `[Environment]::GetEnvironmentVariable([string]$route.secretEnvRef,
   'Process')` and reduce immediately to a Boolean.
9. Do not print route names, base URLs, model IDs, environment-variable names,
   settings values, JSON excerpts, process IDs, command lines, usernames, or
   absolute real-state paths.
10. Do not commit, stage, reset, clean, checkout, restore, revert, push, or use
    a new worktree.
11. Do not use subagents, Graphify, screenshots, transcripts, shell history
    export, output redirection, or temporary scripts.
12. Keep lifecycle status exactly `Integrated, not live validated`.

Encountering a real secret value in output is an immediate stop condition. Do
not repeat or redact-and-continue; stop the task and report only that prohibited
output occurred.

## 7. Pre-command repository baseline

Run from the repository root:

```powershell
git status --short --branch
git status --short --untracked-files=all
git diff --check
git status --short -- app/state
```

Record only:

- branch name;
- total modified count and total untracked count;
- whether `git diff --check` exited 0;
- whether `app/state` is visible in Git status.

Do not print unrelated filenames in the report. Preserve the full command
output privately in the current terminal only; do not redirect it.

If `app/state` appears in Git status, stop `BLOCKED` before reading real state.

## 8. Read-only readiness procedure

### 8.1 Version and exact-path metadata

Run `claude --version` once. Record only exit code and version string. It must be
non-interactive and must not start authentication or a session.

For each exact label in section 5:

- use `Test-Path -LiteralPath`;
- if present, require a regular file with no reparse component;
- collect byte size and whole-file SHA-256 without printing the resolved path;
- emit report rows keyed only by the fixed labels.

For `OPAQUE_STATE`, size/hash is the entire and only permitted access. The
worker must not open a stream to its contents for any other purpose.

### 8.2 User settings structural readiness

Only if `USER_SETTINGS` exists and is a regular non-reparse file:

1. Read it once in memory as bytes.
2. Decode UTF-8 strictly.
3. Run the repository's established decoded-equivalent duplicate-key logic in
   memory without writing a helper file. If safely reusing that logic requires
   importing or invoking implementation against the real path, do not do it;
   report duplicate-key status `NOT ASSESSED` instead.
4. Parse JSON in memory.
5. Record only:
   - parseable Boolean;
   - root-is-object Boolean;
   - top-level key count;
   - duplicate-key status `PASS`, `FAIL`, or `NOT ASSESSED`.

Never emit a key name, value, type, excerpt, nested count, or parser exception
that contains source text.

### 8.3 Route-store readiness

If `ROUTE_STORE` is absent, record `NO_SAVED_ROUTES` and Gate 5A result
`BLOCKED`; do not create it.

If present, parse it in memory and validate:

- root object and `version == 1`;
- `routes` is an array;
- `appliedRouteId` and `appliedRouteConfigSha256` are both null or both
  non-null;
- applied fingerprint, when present, matches lowercase 64-hex;
- each route has exactly these persisted fields: `id`, `name`, `baseUrl`,
  `authKind`, `secretEnvRef`, `model`, `gatewayDiscovery`,
  `disableExperimentalBetas`, `autoCompactWindow`,
  `disableNonessentialTraffic`, `createdAt`, and `updatedAt`;
- every route passes the same type/range/URL/auth-kind/reference-name checks as
  the schema and adapter contract;
- route IDs and names are unique under their documented comparison rules;
- no derived `configSha256` field is persisted;
- the applied route ID, when non-null, names exactly one stored route.

For each structurally valid route, check only:

- secret-reference environment value present: Boolean;
- endpoint classification: `LOOPBACK` or `NON_LOOPBACK`, based only on parsed
  host syntax and without DNS or network access;
- canonical fingerprint equals stored applied fingerprint: Boolean, only for
  the applied route;
- candidate readiness: Boolean.

The report may contain aggregate counts only:

- total routes;
- structurally valid routes;
- routes with a present secret reference;
- loopback versus non-loopback routes;
- ready candidates;
- whether an applied route exists;
- whether the applied fingerprint matches.

Do not emit route IDs, names, endpoints, models, secret-reference names, or
route JSON.

Candidate readiness requires a structurally valid route, a present secret
reference, a non-empty model, and a syntactically valid HTTPS or literal
loopback HTTP base URL. It does not imply gateway compatibility.

If ready-candidate count is zero, Gate 5A is `BLOCKED`. If it is greater than
one, Gate 5A may pass readiness but the report must require the user to select
the route privately before Gate 5B; the worker must not choose.

### 8.4 App-state invariants

For `BACKUP_MANIFEST`, when present, validate in memory:

- JSON array;
- no more than 10 entries;
- each entry has exactly these metadata fields: `backupName`, `backupSha256`,
  `preWriteTargetSha256`, `postWriteTargetSha256`, `targetBindingSha256`,
  `appliedRouteId`, `appliedRouteConfigSha256`, `previousAppliedRouteId`,
  `previousAppliedRouteConfigSha256`, `previousStorePresent`,
  `previousStoreBackupName`, `previousStoreSha256`, `createdAt`, `coreVersion`,
  and `schemaIdentity`;
- every recorded hash is lowercase 64-hex;
- no absolute path or secret value is present.

Do not open or hash any backup named by the manifest in Gate 5A.

For `ACTIVITY_LOG`, when present:

- require at most 200 non-empty lines;
- parse each line independently as JSON;
- require only `ts`, `type`, and `routeId` keys;
- do not emit any line or value.

An absent manifest or activity log is allowed before first apply. An unreadable
or invalid present file blocks Gate 5B readiness.

### 8.5 Process-presence readiness

Use one process query restricted to these exact executable names:

- `claude`
- `Code`
- `Cursor`
- `Windsurf`
- `idea64`
- `pycharm64`

Record counts by the fixed executable labels only. Do not emit PIDs, owners,
paths, windows, command lines, arguments, or unrelated processes. Do not stop
anything.

Any positive count means Gate 5B must include a user-visible process-stop
checkpoint; it does not by itself fail Gate 5A.

### 8.6 Snapshot feasibility without creating a snapshot

Compute the total bytes required to copy only:

- `USER_SETTINGS`;
- existing `ROUTE_STORE`;
- existing `BACKUP_MANIFEST`;
- existing `ACTIVITY_LOG`.

`OPAQUE_STATE`, `PROFILE_LOCAL`, project/local settings, and MCP remain
hash-only never-copy boundaries.

Inspect only the system temporary root itself for:

- existence and directory type;
- no reparse component in the root path;
- available free bytes on its volume.

Do not create a directory or file. Record only `SNAPSHOT_FEASIBLE` Boolean,
required byte count, and whether free space is at least 10 times the required
bytes plus 1 MiB.

If feasibility fails, Gate 5A is `BLOCKED`.

## 9. Required regression verification

Run only repository/temporary-fixture tests; these commands must not access the
real Claude target:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe .\app\env\Scripts\python.exe
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1
```

From `app`:

```powershell
& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest tests.test_claude_adapter tests.test_capabilities
node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs
& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"
node --test ".\tests\*.test.mjs"
```

Expected evidence:

- Gate 2: 51/51.
- Gate 3: overall pass, 25 criteria tests.
- OpenCode: 34/34.
- Kilo: 32/32.
- Focused Python: 87/87.
- Focused frontend: 21/21.
- Full Python: 171 tests with only the two established preference failures.
- Full frontend: 100 tests, 99 pass, with only the established onboarding-copy
  failure.

Any new failure or lower passing count blocks Gate 5A.

## 10. Post-read integrity verification

Re-run:

```powershell
git status --short --branch
git status --short --untracked-files=all
git diff --check
git status --short -- app/state
```

Recompute size and SHA-256 for every present exact real-state target from
section 5. Every pre/post value must match exactly.

Also verify:

- no new file exists beside any exact real-state target;
- no snapshot directory was created;
- no Claude/IDE process count was changed by the worker;
- `ALLOW_REAL_CLAUDE_TARGET` remains `False`;
- no command line contained `-AllowRealTarget`;
- repository changes are exactly the pre-existing dirty state plus the one
  Gate 5A report.

## 11. Acceptance matrix

Gate 5A is `PASS` only when all are true:

1. The only repository file created is the report.
2. `USER_SETTINGS` is a regular non-reparse file, parseable as a root JSON
   object, with stable pre/post size and SHA-256.
3. `OPAQUE_STATE` was accessed only for metadata/hash and is stable pre/post.
4. Every other present exact real-state target is stable pre/post.
5. Route store and present app-state files pass structural invariants.
6. At least one route is a ready candidate.
7. Snapshot feasibility passes.
8. Process counts are recorded without stopping anything.
9. All required regressions match the accepted counts/baselines.
10. No secret, private value, route detail, process detail, or absolute
    real-state path entered output or the report.
11. Both real-target locks remain closed and unused.

`PASS` means ready for Sol to draft Gate 5B. It does not authorize Gate 5B and
does not change lifecycle status.

## 12. Stop conditions

Stop immediately and report `BLOCKED` if:

- any exact path resolves through a reparse component;
- an exact target changes between pre/post checks;
- a prohibited value, excerpt, path, process detail, or secret appears in
  output;
- safe metadata collection cannot avoid source-bearing errors;
- route/app state is unreadable or structurally invalid;
- no ready route exists;
- snapshot feasibility fails;
- a regression has a new failure or lower count;
- any command would require a write, process stop, network request, Claude
  session, lock change, or `-AllowRealTarget`;
- any additional repository or real-state target becomes necessary.

Do not repair readiness failures in this gate. Record the redacted blocker for
Sol.

## 13. Rollback and recovery

Gate 5A is read-only, so no real-state rollback should be possible or needed.

If an unintended write is detected:

1. Stop all commands immediately.
2. Do not attempt an automatic restore.
3. Do not delete evidence or retry.
4. Report `BLOCKED`, the fixed target label, whether bytes changed, and whether
   a safe pre-read hash exists. Do not report content or the absolute path.
5. Wait for a new Sol recovery handoff.

If only the new report is malformed, edit that report in place; do not touch
any other file.

## 14. Required report contract

Create `planning/claude-code/CLAUDE_CODE_GATE_5A_READINESS_REPORT.md` as ASCII Markdown
with exactly these sections:

1. `Status` - `PASS`, `FAIL`, or `BLOCKED`.
2. `Scope and authorization` - Gate 5A only; Gate 5B/5C unauthorized.
3. `Repository baseline` - branch and aggregate dirty counts only.
4. `Target manifest` - fixed labels, existence/type/bytes/SHA-256, no paths.
5. `Settings structural readiness` - the four allowed facts from section 8.2.
6. `Route readiness` - aggregate counts and user-selection requirement only.
7. `App-state invariants` - manifest/activity structural results.
8. `Process readiness` - fixed process labels and counts only.
9. `Snapshot feasibility` - Boolean and aggregate byte/free-space threshold.
10. `Tests run` - exact commands, exits, and counts.
11. `Pre/post integrity` - equality results by fixed label.
12. `Privacy attestation` - prohibited output/access did not occur.
13. `Failures, risks, and blockers` - redacted labels only.
14. `Gate 5B recommendation` - `READY FOR USER SELECTION`, `NOT READY`, or
    `BLOCKED`; explicitly no authorization.

The worker response must include:

- report path and SHA-256;
- status and Gate 5B recommendation;
- created/modified file lists;
- exact tests and counts;
- pre/post equality summary by fixed label;
- route candidate count without route details;
- process-presence summary;
- failures, risks, and remaining work;
- explicit confirmation that no write, copy, process stop, session, network,
  lock change, `-AllowRealTarget`, commit, stage, or extra path access occurred.

## 15. Final authority boundary

This handoff supersedes the Gate 4 prohibition only enough to permit the exact
read-only Gate 5A inspection above. It does not authorize the Gate 5 live test
described in the research plan.

After the worker returns, Sol reviews the report. Only a new, explicit,
human-approved Gate 5B handoff may authorize snapshot creation, process stop,
real apply, disposable Claude session, gateway contact, restore, or status
change.
