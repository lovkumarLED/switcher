# Claude Code Gate 5A.2 Route Provisioning Retry Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** Retry only the blocked Gate 5A.1 app-owned route provisioning
> after confirming that the selected credential reference exists at Windows
> user scope. Gate 5B and Gate 5C remain unauthorized.

## 1. Goal

Resolve the sole Gate 5A.1 blocker by creating exactly one validated saved
route and one redacted activity event. Do not apply the route or access real
Claude state.

Lifecycle remains exactly `Integrated, not live validated`.

## 2. Authoritative baseline

Read before any command:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_GATE_5A1_ROUTE_PROVISIONING_HANDOFF.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_5A1_ROUTE_PROVISIONING_REPORT.md`
5. `planning/claude-code/CLAUDE_CODE_GATE_5A_READINESS_REPORT.md`
6. `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`, Revision 7
7. `app/app/claude_adapter.py`
8. `app/app/config.py`
9. `adapters/claude-code/ADAPTER.md`
10. `adapters/claude-code/TESTING.md`

Verify these exact SHA-256 values before continuing:

- Gate 5A.1 handoff:
  `152372A69FE55FDD3424407C189AB6DE80EB8778AFBFE257D93ED9524F153277`
- Gate 5A.1 blocked report:
  `0DB583DB702B8E41CFA9C6AFC120F84C2878AE0D8B4844734029C479B928F544`

The Gate 5A.1 handoff remains the complete execution contract except for the
explicit deltas in section 3 below. If any other conflict exists, stop
`BLOCKED` before writing app state.

## 3. Exact deltas from Gate 5A.1

Only these clauses change:

1. The new report path is
   `planning/claude-code/CLAUDE_CODE_GATE_5A2_ROUTE_PROVISIONING_RETRY_REPORT.md`.
   Preserve the Gate 5A.1 report unchanged.
2. Secret-reference readiness passes when the reference is non-empty at either
   `Process` scope or Windows `User` scope. Do not query `Machine` scope.
3. Record only `SECRET_REFERENCE_SOURCE=PROCESS` or
   `SECRET_REFERENCE_SOURCE=USER`. Never record the name or value.
4. Do not copy a user-scope value into process scope in this gate. Route
   creation does not resolve the value; Gate 5B must separately authorize any
   bounded local transfer needed by the production apply subprocess.
5. A user-scope result is a developer-validation workaround only. It does not
   alter the deferred normal-user credential UX requirement in
   `planning/claude-code/CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md`.

Every prohibition, validation rule, provisioning command, rollback rule,
regression command, redaction rule, and acceptance criterion not explicitly
changed above remains mandatory exactly as written in the Gate 5A.1 handoff.

## 4. Exact scope

Create exactly:

- `app/state/claude-routes.json`
- `app/state/claude-activity.jsonl`
- `planning/claude-code/CLAUDE_CODE_GATE_5A2_ROUTE_PROVISIONING_RETRY_REPORT.md`

Do not create `app/state/claude-backup-manifest.json`.

Do not modify or delete either prior Gate 5 report, any source/test/document,
or any real-state file.

## 5. Required user fields

If the current worker conversation still contains all nine fields that Gate
5A.1 validated, reuse them in memory without reproducing them.

Otherwise ask once:

```text
Gate 5A.2 needs the same non-secret saved-route definition. Reply with these
nine fields only; do not send an API key, token, credential, or secret value:

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

Validate all nine fields exactly as required by Gate 5A.1. Do not infer,
default, normalize, or autocorrect missing or ambiguous input.

## 6. Pre-write checks

Run all Gate 5A.1 pre-write Git, state-file, ignore-rule, lock, endpoint, and
input checks with these report-path expectations:

- Gate 5A.1 report exists with the exact baseline hash above;
- Gate 5A.2 report is absent;
- all three `app/state` files remain absent.

Check secret readiness without outputting the name or value:

```powershell
$processPresent = -not [string]::IsNullOrEmpty(
  [Environment]::GetEnvironmentVariable($secretReferenceName, 'Process')
)
$userPresent = -not [string]::IsNullOrEmpty(
  [Environment]::GetEnvironmentVariable($secretReferenceName, 'User')
)

if ($processPresent) {
  $secretReferenceSource = 'PROCESS'
} elseif ($userPresent) {
  $secretReferenceSource = 'USER'
} else {
  $secretReferenceSource = 'ABSENT'
}

"SECRET_REFERENCE_PRESENT=$($secretReferenceSource -ne 'ABSENT')"
"SECRET_REFERENCE_SOURCE=$secretReferenceSource"
```

The only allowed output is the Boolean and source classification above. If the
source is `ABSENT`, stop `BLOCKED` before creating app state. Never print the
reference name or inspect, copy, compare, transform, or print its value.

## 7. Provisioning and validation

Execute the exact Gate 5A.1 section 7 provisioning command from `app`, using
the validated nine-field payload. That command uses the existing
`RouteCreateBody` and `claude_route_create` path with a non-real injected
profile root and must print only its fixed success/failure marker.

Then execute all Gate 5A.1 section 8 post-write validations with this one
secret-readiness substitution:

- require the previously established source to remain `PROCESS` or `USER`;
- do not require the value to exist specifically at process scope;
- do not inspect or emit the secret-reference name or value.

Require exactly one saved route, no applied route, one redacted
`route_created` event, no manifest, both state files Git-ignored, and both
real-target locks closed.

## 8. Regression verification

Run from `app` exactly:

```powershell
& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest tests.test_claude_adapter tests.test_capabilities
node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs
```

Require:

- focused Python: 87/87;
- focused frontend: 21/21;
- route-store and activity hashes unchanged before/after tests;
- `git diff --check` exit 0;
- `git status --short -- app/state` empty.

## 9. Failure rollback

Apply the complete Gate 5A.1 rollback contract. Delete only the two app-state
files created by this retry, and only when pre-absence and transaction hashes
prove ownership. Never delete or alter an environment variable at any scope.

If rollback cannot be proven, stop hard `BLOCKED` without retry.

## 10. Required report

Create
`planning/claude-code/CLAUDE_CODE_GATE_5A2_ROUTE_PROVISIONING_RETRY_REPORT.md` as ASCII
Markdown with exactly:

1. `Status` - `PASS`, `FAIL`, or `BLOCKED`.
2. `Authorization and scope` - Gate 5A.2 only; Gate 5B/5C unauthorized.
3. `Baseline hashes` - both exact values from section 2.
4. `User selection receipt` - all fields validated; no values reproduced.
5. `Pre-write state`.
6. `Secret-reference readiness` - Boolean and `PROCESS`/`USER` only.
7. `Provisioning evidence` - fixed marker and exit only.
8. `Route-store invariants` - aggregate/Boolean evidence and SHA-256.
9. `Activity invariants` - aggregate/Boolean evidence and SHA-256.
10. `Endpoint classification` - `LOOPBACK` or `NON_LOOPBACK` only.
11. `Lock and real-state attestation`.
12. `Tests run` - exact commands, exits, and counts.
13. `Git-ignore and scope evidence`.
14. `Failures, rollback, and risks`.
15. `Gate 5B recommendation` - `READY FOR SOL GATE 5B PLANNING` or
    `BLOCKED`; explicitly no authorization.

Do not include route details, the secret-reference name, a secret value,
absolute real-state paths, target contents, or timestamps.

## 11. Acceptance and boundary

Gate 5A.2 is `PASS` only when every unchanged Gate 5A.1 acceptance criterion
passes under the explicit user-scope readiness delta, focused tests pass at
87/87 and 21/21, and no prohibited action occurred.

A `PASS` resolves only `NO_SAVED_ROUTES`. It does not authorize Gate 5B,
Gate 5C, snapshot creation, process stop, real-state access, apply, Claude
launch, gateway contact, restore, documentation synchronization, release, or
credential UX implementation.
