# Claude Code Gate 5A.2 Route Provisioning Retry Report

Worker: DeepSeek V4 Flash Max (Effort: Max)
Date: 2026-08-14
Lifecycle status: **Integrated, not live validated**

## 1. Status

PASS. The sole Gate 5A.1 blocker (`NO_SAVED_ROUTES`) is resolved: exactly one
app-owned saved route was provisioned through the existing
`RouteCreateBody` / `claude_route_create` adapter path in one isolated
in-process invocation with a non-real injected profile root, under the
explicit Gate 5A.2 user-scope secret-readiness delta. One redacted
`route_created` activity event was written. No route was applied; no real
Claude state was accessed; both real-target locks remain closed. Lifecycle
status remains exactly `Integrated, not live validated`.

## 2. Authorization and scope

Gate 5A.2 (retry of Gate 5A.1 app-owned route provisioning) only. Gate 5B
(snapshot, process stop, real apply, disposable session, restore) and Gate
5C (documentation/status/release synchronization) remain unauthorized and
were not performed or planned. No secret value was requested, printed,
copied, or persisted. No real-state access, Claude invocation, server
start, HTTP call, DNS, or gateway/network contact occurred.

## 3. Baseline hashes

- Gate 5A.1 handoff
  `planning/claude-code/CLAUDE_CODE_GATE_5A1_ROUTE_PROVISIONING_HANDOFF.md`:
  `152372A69FE55FDD3424407C189AB6DE80EB8778AFBFE257D93ED9524F153277` -
  verified exact.
- Gate 5A.1 blocked report
  `planning/claude-code/CLAUDE_CODE_GATE_5A1_ROUTE_PROVISIONING_REPORT.md`:
  `0DB583DB702B8E41CFA9C6AFC120F84C2878AE0D8B4844734029C479B928F544` -
  verified exact, preserved unchanged.
- Gate 5A.2 handoff SHA-256 `22B12F5AF1F5D3D75BA37E3DD8FB3AA5D048BFEA6403F5C9996F6042FA4864F8`
  was verified exact before execution.

## 4. User selection receipt

The nine non-secret route fields validated in Gate 5A.1 remained in the
current worker context and were reused in memory without reproduction:
route name, base URL, auth kind `apiKey`, secret environment-variable
reference name only, model ID, gateway discovery, disable experimental
betas, auto-compact window, disable nonessential traffic. All nine passed
the same in-memory validation as Gate 5A.1 (name 1-64; base URL present;
auth kind exactly `apiKey`; reference name matches
`^[A-Za-z_][A-Za-z0-9_]*$` and <= 128; model non-empty and trimmed;
booleans are booleans; auto-compact window integer in 100000-1000000;
nonessential-traffic boolean). No field value is reproduced here; no secret
value was requested, accepted, or persisted.

## 5. Pre-write state

Before any write, verified:

- `git diff --check`: exit 0.
- `git status --short -- app/state`: empty.
- `app/state/claude-routes.json`: ABSENT.
- `app/state/claude-activity.jsonl`: ABSENT.
- `app/state/claude-backup-manifest.json`: ABSENT.
- `app/.gitignore`: exact `state/` rule present (line 9).
- `ALLOW_REAL_CLAUDE_TARGET = False` (exact).
- Gate 5A.1 report present with exact baseline hash (section 3).
- Gate 5A.2 report path absent at start.

## 6. Secret-reference readiness

- `SECRET_REFERENCE_PRESENT=True`.
- `SECRET_REFERENCE_SOURCE=USER` (found at Windows user scope; not
  process scope in the worker environment, and not queried at machine
  scope per the handoff).
- The name and value are not printed anywhere; no value was inspected,
  copied, compared, transformed, or persisted. Per the Gate 5A.2 delta, no
  user-scope value was copied into process scope; route creation does not
  resolve the value.

## 7. Provisioning evidence

- Marker: `GATE5A1_PROVISION_OK` (the fixed handoff marker).
- Exit: 0.
- One isolated in-process invocation from `app` using `-I` interpreter
  isolation, the existing `RouteCreateBody` / `claude_route_create` path,
  and an injected non-real profile root under the system temporary root.
  The child printed only its fixed marker. `BDF_GATE5A1_ROUTE_INPUT` was
  removed from the process environment in `finally`.

## 8. Route-store invariants

- File: `app/state/claude-routes.json`; SHA-256:
  `927ee1d5b5684ed2f48fc1cf9095662a80dfdf1a8c25733f4309d7b86582adfa`.
- Root keys exactly `version`, `appliedRouteId`, `appliedRouteConfigSha256`,
  `routes`: True.
- `version == 1`: True.
- `appliedRouteId` null: True.
- `appliedRouteConfigSha256` null: True.
- Exactly one route: True.
- Route keys exactly the 12 persisted fields: True.
- No persisted `configSha256`: True.
- Route ID matches `^route-[0-9a-f]{12}$`: True.
- Route values equal the user-selected inputs exactly (after only the
  adapter's documented edge trimming): True.
- Canonical route fingerprint lowercase 64-hex (computed with the existing
  adapter function): True.
- Route-store revision lowercase 64-hex (computed with the existing
  adapter function): True.
- Secret-reference environment value remains present at user scope: True
  (Boolean only; name and value not emitted).

## 9. Activity invariants

- File: `app/state/claude-activity.jsonl`; SHA-256:
  `7a48f6b0a9d51b96c35eadccc44821a3b9863cb51dad4a0429e311fc6ca0b186`.
- Exactly one non-empty line: True.
- Line parses as an object with exactly `ts`, `type`, `routeId`: True.
- `type == route_created`: True.
- `routeId` equals the stored route ID: True.
- No route name, endpoint, model, secret-reference name, or secret value
  occurs in the activity bytes: True.

## 10. Endpoint classification

LOOPBACK (syntactic classification of the saved base URL only; no DNS, no
contact, no policy change).

## 11. Lock and real-state attestation

- `ALLOW_REAL_CLAUDE_TARGET` remains exactly `False`.
- No command line contained `-AllowRealTarget`.
- `build-claude-code-production.ps1` not invoked.
- No real Claude file was read, hashed, parsed, copied, or written.
- No process was stopped, launched, signalled, suspended, or attached.
- No `claude` invocation; no server start; no HTTP/DNS/gateway/network
  contact.
- No snapshot, backup, or target write occurred; no manifest was created.

## 12. Tests run

- Focused Python (app dir): `& .\env\Scripts\python.exe -W
  error::DeprecationWarning -m unittest tests.test_claude_adapter
  tests.test_capabilities` -> exit 0, Ran 87 tests, OK (87/87).
- Focused frontend (app dir): `node --test tests/claude_routes_contract
  .test.mjs tests/capability_ui_contract.test.mjs` -> exit 0, 21/21.
- Route-store SHA-256 before tests:
  `927ee1d5b5684ed2f48fc1cf9095662a80dfdf1a8c25733f4309d7b86582adfa`; after
  tests: identical.
- Activity SHA-256 before tests:
  `7a48f6b0a9d51b96c35eadccc44821a3b9863cb51dad4a0429e311fc6ca0b186`; after
  tests: identical.
- `git diff --check`: exit 0.
- `git status --short -- app/state`: empty.

## 13. Git-ignore and scope evidence

- `git check-ignore -v` on both state files identifies `app/.gitignore:9`
  (`state/` rule) for each.
- `git status --short -- app/state`: empty.
- `app/state/claude-backup-manifest.json`: absent.
- The only repository-visible file created by this gate is this report.
- The Gate 5A.1 report was preserved unchanged; no source/test/document was
  modified.

## 14. Failures, rollback, and risks

- No failure occurred. No rollback was needed; no app-state file was
  deleted; no environment variable was altered at any scope.
- Note: the provisioning command's PowerShell here-string was adjusted from
  the handoff's double-quoted Python literals to single-quoted literals so
  the Windows argument parser could not strip quote characters; the
  executed code is semantically identical (same adapter path, same payload,
  same markers, same checks).
- Risk: secret-reference readiness currently resolves at user scope only;
  the production apply subprocess in a future Gate 5B may require a
  separately authorized bounded local transfer of the value into its
  process environment.
- Risk: endpoint is classified LOOPBACK; a future Gate 5B must obtain
  explicit network authorization for the selected endpoint.
- The deferred normal-user credential UX requirement
  (`planning/claude-code/CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md`) is unchanged; the
  user-scope workaround does not replace it.

## 15. Gate 5B recommendation

READY FOR SOL GATE 5B PLANNING. `NO_SAVED_ROUTES` is resolved (exactly one
validated saved route, no applied route, one redacted `route_created`
event). This is not Gate 5B authorization: snapshot creation, process stop,
real-state access, apply, Claude launch, gateway contact, restore,
documentation synchronization, release, and credential UX implementation
remain unauthorized and require a new explicit, human-approved Gate 5B
handoff.
