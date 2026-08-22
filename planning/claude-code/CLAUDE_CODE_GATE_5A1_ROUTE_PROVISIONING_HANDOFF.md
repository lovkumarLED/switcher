# Claude Code Gate 5A.1 Route Provisioning Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** Resolve only the `NO_SAVED_ROUTES` Gate 5A blocker by asking
> the user for one non-secret route definition and creating app-owned,
> Git-ignored route state through the existing adapter validation path.

## 1. Goal and outcome

Create exactly one user-selected saved Claude route in the app-owned route
store without reading or changing real Claude settings, launching Claude,
contacting a gateway, changing either real-target lock, or applying the route.

Successful Gate 5A.1 produces:

- `app/state/claude-routes.json` with one validated saved route and no applied
  route;
- `app/state/claude-activity.jsonl` with one redacted `route_created` event;
- `planning/claude-code/CLAUDE_CODE_GATE_5A1_ROUTE_PROVISIONING_REPORT.md` with redacted
  evidence;
- a recommendation `READY FOR SOL GATE 5B PLANNING`, which is not Gate 5B
  authorization.

Lifecycle status remains exactly `Integrated, not live validated`.

## 2. Governing sources

Read before any command:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_GATE_5A_READ_ONLY_READINESS_HANDOFF.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_5A_READINESS_REPORT.md`
5. `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`, Revision 7
6. `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`
7. `adapters/claude-code/ADAPTER.md`
8. `adapters/claude-code/BUILDER_SPEC.md`
9. `adapters/claude-code/TESTING.md`
10. `app/app/claude_adapter.py`
11. `app/app/config.py`
12. `app/engine/schemas/claude-code-routing.schema.json`

If these sources disagree, stop `BLOCKED` without writing app state.

## 3. Exact scope

Create exactly:

- `app/state/claude-routes.json`
- `app/state/claude-activity.jsonl`
- `planning/claude-code/CLAUDE_CODE_GATE_5A1_ROUTE_PROVISIONING_REPORT.md`

The `app/state/` files are runtime data and must remain Git-ignored.

Do not create `app/state/claude-backup-manifest.json`; no route is applied in
this gate, so no target backup or manifest entry may exist.

Do not modify, move, or delete any existing repository or real-state file.

## 4. Absolute prohibitions

1. Do not read, hash, parse, copy, or write any real Claude file. Gate 5A has
   already established the read-only baseline; Gate 5A.1 does not repeat it.
2. Do not stop, launch, signal, suspend, or attach to Claude or any IDE.
3. Do not invoke `claude`, start the Switcher server, call HTTP, resolve DNS,
   or contact any gateway/network host.
4. Do not invoke `build-claude-code-production.ps1`.
5. Do not pass `-AllowRealTarget`.
6. Do not change `ALLOW_REAL_CLAUDE_TARGET = False`.
7. Do not enter a secret value. The user supplies only an environment-variable
   reference name; perform only a Boolean process-environment presence check
   without printing either the name or value.
8. Do not print or include in the report the route name, endpoint, model,
   environment-variable reference name, generated route ID, timestamps, or
   route JSON.
9. Do not create a route by manually composing JSON. Use the existing
   `RouteCreateBody`, `_validate_route`, and `claude_route_create` path in one
   isolated in-process invocation with a non-real injected profile root.
10. Do not start a server or temporarily set `ALLOW_REAL_CLAUDE_TARGET = True`.
11. Do not commit, stage, reset, clean, checkout, restore, revert, push, or use
    a new worktree.
12. Do not use subagents, Graphify, output redirection, a temporary script, a
    screenshot, or a transcript.

## 5. Required user interaction

Before any write, ask the user once for these nine non-secret fields:

1. Route display name: 1-64 characters.
2. Base URL: HTTPS, or HTTP only for a literal loopback host.
3. Auth kind: exactly `apiKey` or `authToken`.
4. Secret environment-variable reference name: a name only, never its value;
   must match `^[A-Za-z_][A-Za-z0-9_]*$` and be at most 128 characters.
5. Model ID: non-empty, no leading/trailing whitespace.
6. Gateway discovery: `true` or `false`.
7. Disable experimental betas: `true` or `false`.
8. Auto-compact window: integer from 100000 through 1000000.
9. Disable nonessential traffic: `true` or `false`.

Use this exact question:

```text
Gate 5A.1 needs one non-secret saved-route definition. Reply with these nine
fields only; do not send an API key, token, credential, or other secret value:

Route name:
Base URL:
Auth kind (apiKey or authToken):
Secret environment-variable reference NAME only:
Model ID:
Gateway discovery (true/false):
Disable experimental betas (true/false):
Auto-compact window (100000-1000000):
Disable nonessential traffic (true/false):
```

Do not infer, choose, default, autocorrect, or normalize an omitted field. If
the user sends a secret value or ambiguous input, stop and ask them to rotate
the exposed credential outside this task; do not repeat it or proceed.

The user's answer is their private route selection for a future Gate 5B plan.
It does not authorize applying the route.

## 6. Pre-write checks

Run from the repository root:

```powershell
git status --short --branch
git status --short --untracked-files=all
git diff --check
git status --short -- app/state
```

Require:

- `git diff --check` exits 0;
- `git status --short -- app/state` is empty;
- `app/state/claude-routes.json`, `app/state/claude-activity.jsonl`, and
  `app/state/claude-backup-manifest.json` are all absent;
- `app/.gitignore` still contains the exact `state/` rule;
- `ALLOW_REAL_CLAUDE_TARGET` is exactly `False`;
- the report path does not already exist.

If any state file exists, stop `BLOCKED`; do not merge, overwrite, append, or
delete it.

Validate the nine user inputs in memory before importing the adapter. Check the
secret reference with:

```powershell
$secretPresent = -not [string]::IsNullOrEmpty(
  [Environment]::GetEnvironmentVariable($secretReferenceName, 'Process')
)
```

Do not output `$secretReferenceName` or its value. If `$secretPresent` is false,
stop `BLOCKED` before creating app state.

Classify the endpoint syntactically as `LOOPBACK` or `NON_LOOPBACK` without DNS
or contact. Record only the classification. A non-loopback endpoint is allowed
to be saved, but Gate 5B must later obtain explicit network authorization for
that selected endpoint.

## 7. Provisioning command

Run from `app`. Keep all route inputs in the current process only. Place the
JSON payload in `BDF_GATE5A1_ROUTE_INPUT` for the child invocation, then remove
that environment variable in `finally`.

Use this exact PowerShell shape after assigning the validated user inputs to
the local variables named below:

```powershell
$payload = [ordered]@{
  name = $routeName
  baseUrl = $baseUrl
  authKind = $authKind
  secretEnvRef = $secretReferenceName
  model = $modelId
  gatewayDiscovery = $gatewayDiscovery
  disableExperimentalBetas = $disableExperimentalBetas
  autoCompactWindow = $autoCompactWindow
  disableNonessentialTraffic = $disableNonessentialTraffic
} | ConvertTo-Json -Compress

$env:BDF_GATE5A1_ROUTE_INPUT = $payload
$code = @'
try:
    import json
    import os
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path.cwd()))
    from app import claude_adapter as adapter

    if adapter.ALLOW_REAL_CLAUDE_TARGET is not False:
        raise RuntimeError
    if adapter.CLAUDE_ROUTES_FILE.exists() or adapter.CLAUDE_ACTIVITY_FILE.exists() or adapter.CLAUDE_MANIFEST_FILE.exists():
        raise RuntimeError
    payload = json.loads(os.environ["BDF_GATE5A1_ROUTE_INPUT"])
    body = adapter.RouteCreateBody(**payload)
    adapter.get_profile_root = lambda: Path(os.environ["TEMP"]) / "bdf-gate5a1-nonreal-profile-root"
    result = adapter.claude_route_create(body)
    if not isinstance(result, dict) or "route" not in result or "routesRevision" not in result:
        raise RuntimeError
    if not adapter.CLAUDE_ROUTES_FILE.is_file() or not adapter.CLAUDE_ACTIVITY_FILE.is_file():
        raise RuntimeError
    if adapter.CLAUDE_MANIFEST_FILE.exists():
        raise RuntimeError
    print("GATE5A1_PROVISION_OK")
except BaseException:
    print("GATE5A1_PROVISION_FAILED")
    raise SystemExit(1)
'@

try {
  & .\env\Scripts\python.exe -I -c $code
  if ($LASTEXITCODE -ne 0) { throw 'Route provisioning failed' }
} finally {
  [Environment]::SetEnvironmentVariable('BDF_GATE5A1_ROUTE_INPUT', $null, 'Process')
}
```

The child must print only `GATE5A1_PROVISION_OK` or
`GATE5A1_PROVISION_FAILED`. It must never print an exception, payload, route,
path, or environment detail.

The explicit `Path.cwd()` entry is limited to the repository's `app` working
directory; `-I` must continue to isolate environment and user-site path input.
If this command cannot import the app and its installed dependencies, stop
`BLOCKED`; do not weaken interpreter isolation or retry without `-I`.

## 8. Post-write validation

Read only the two newly created app-state files. Validate in memory:

### Route store

- exact root keys: `version`, `appliedRouteId`,
  `appliedRouteConfigSha256`, `routes`;
- `version == 1`;
- `appliedRouteId` is null;
- `appliedRouteConfigSha256` is null;
- exactly one route;
- exact route keys: `id`, `name`, `baseUrl`, `authKind`, `secretEnvRef`,
  `model`, `gatewayDiscovery`, `disableExperimentalBetas`,
  `autoCompactWindow`, `disableNonessentialTraffic`, `createdAt`, `updatedAt`;
- no persisted `configSha256`;
- generated route ID matches `^route-[0-9a-f]{12}$`;
- route values equal the user-selected inputs exactly after only the adapter's
  documented edge trimming;
- canonical route fingerprint is lowercase 64-hex when computed with the
  existing adapter function;
- route-store revision is lowercase 64-hex;
- secret-reference environment value remains present without printing name or
  value.

### Activity log

- exactly one non-empty line;
- line parses as an object with exactly `ts`, `type`, `routeId`;
- `type == route_created`;
- `routeId` equals the stored route ID;
- no route name, endpoint, model, secret-reference name, or secret value occurs
  in the activity bytes.

### Manifest and Git

- `app/state/claude-backup-manifest.json` remains absent;
- no target backup exists or was inspected;
- `git status --short -- app/state` remains empty because `state/` is ignored;
- `git check-ignore -v app/state/claude-routes.json` and the activity path both
  identify the `app/.gitignore` `state/` rule;
- `ALLOW_REAL_CLAUDE_TARGET` remains `False`;
- no command contained `-AllowRealTarget`.

Record only aggregate/Boolean evidence and SHA-256 of the two app-state files.
Do not record route details.

## 9. Regression verification

Run from `app`:

```powershell
& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest tests.test_claude_adapter tests.test_capabilities
node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs
```

Expected:

- focused Python: 87/87;
- focused frontend: 21/21.

The tests must not alter the two provisioned app-state files. Hash both files
before and after the tests and require equality.

Run `git diff --check` and require exit 0.

## 10. Failure rollback

Before provisioning, record that all three app-state files are absent.

If provisioning or validation fails after creating app state:

1. Do not touch real Claude state.
2. Delete only `app/state/claude-routes.json` and
   `app/state/claude-activity.jsonl`, and only after proving they did not exist
   before this gate and their current hashes match the files created by this
   transaction.
3. Do not delete any manifest; its existence is a stop-condition violation.
4. Verify all three app-state files are absent again.
5. Clear `BDF_GATE5A1_ROUTE_INPUT`.
6. Report `BLOCKED` with a generic stage label and rollback result; do not
   include route details or exception text.

If safe rollback cannot be proven, stop immediately and report a hard
`BLOCKED` state. Do not retry.

## 11. Acceptance criteria

Gate 5A.1 is `PASS` only when:

1. The user explicitly supplied all nine non-secret fields.
2. No secret value was supplied, printed, or persisted; access was limited to
   a Boolean presence check of its pre-existing process environment variable.
3. The exact existing adapter validation/creation path created one route.
4. The route store contains exactly one saved route and no applied route.
5. Activity contains exactly one redacted `route_created` event.
6. No manifest, target backup, snapshot, server, HTTP request, network request,
   process action, Claude invocation, real-state read, or real-state write
   occurred.
7. Both real-target locks remain closed and unchanged.
8. Both state files are Git-ignored and absent from Git status.
9. Focused Python is 87/87 and focused frontend is 21/21.
10. State-file hashes are unchanged by regression tests.
11. The only repository-visible file created is the report.

`PASS` resolves only `NO_SAVED_ROUTES`. Gate 5B remains unauthorized.

## 12. Required report

Create `planning/claude-code/CLAUDE_CODE_GATE_5A1_ROUTE_PROVISIONING_REPORT.md` as ASCII
Markdown with exactly:

1. `Status` - `PASS`, `FAIL`, or `BLOCKED`.
2. `Authorization and scope` - Gate 5A.1 only; Gate 5B/5C unauthorized.
3. `User selection receipt` - nine fields received and validated, values not
   reproduced.
4. `Pre-write state` - all three state files absent.
5. `Provisioning evidence` - marker and exit only.
6. `Route-store invariants` - aggregate/Boolean evidence and file SHA-256.
7. `Activity invariants` - aggregate/Boolean evidence and file SHA-256.
8. `Secret-reference readiness` - Boolean only.
9. `Endpoint classification` - `LOOPBACK` or `NON_LOOPBACK` only.
10. `Lock and real-state attestation`.
11. `Tests run` - exact commands, exits, and counts.
12. `Git-ignore and scope evidence`.
13. `Failures, rollback, and risks`.
14. `Gate 5B recommendation` - `READY FOR SOL GATE 5B PLANNING` or
    `BLOCKED`; explicitly no authorization.

Worker response must include report path/SHA-256, status, created/modified
files, state-file hashes, aggregate validation results, endpoint
classification, test counts, rollback state, risks, and confirmation that no
prohibited action occurred. It must not include any route detail.

## 13. Final boundary

This handoff authorizes app-owned route provisioning only. It does not
authorize snapshot creation, process stop, real settings access, route apply,
Claude launch, gateway contact, restore, support status, documentation
synchronization, or release.

After a PASS, Sol reviews the report and may draft a separate Gate 5B handoff
for explicit human approval.
