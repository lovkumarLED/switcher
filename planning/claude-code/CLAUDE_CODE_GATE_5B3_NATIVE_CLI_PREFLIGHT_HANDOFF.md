# Claude Code Gate 5B.3 Native CLI Preflight Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** Qualify one native Claude executable before real-state access;
> only after qualification, perform one complete bounded apply/status/routing/
> restore transaction. Gate 5C remains unauthorized.

## 1. Architectural correction

Gate 5B.1 and Gate 5B.2 each restored every fixed byte successfully, but both
discovered an incompatible launcher only after apply. The launcher must now be
qualified before snapshot or mutation.

Current read-only command-form evidence shows exactly four `claude` command
forms: one PowerShell script, three applications, and exactly one application
whose leaf extension is `.exe`. Gate 5B.3 may use only that native `.exe`.

If native qualification fails, stop `BLOCKED` before any real-state access,
snapshot, credential access, apply, or network contact.

## 2. Authoritative baseline

Read before any command:

1. `planning/claude-code/CLAUDE_CODE_GATE_5B_LIVE_VALIDATION_HANDOFF.md`
2. `planning/claude-code/CLAUDE_CODE_GATE_5B1_LIVE_VALIDATION_RETRY_HANDOFF.md`
3. `planning/claude-code/CLAUDE_CODE_GATE_5B2_LIVE_VALIDATION_LAUNCHER_RETRY_HANDOFF.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_5B2_LIVE_VALIDATION_LAUNCHER_RETRY_REPORT.md`
5. `app/engine/claude-code/test-provider-model.ps1`, lines 7-35
6. `adapters/claude-code/ADAPTER.md`
7. `adapters/claude-code/BUILDER_SPEC.md`
8. `app/app/claude_adapter.py`

Verify exact SHA-256:

- Gate 5B handoff:
  `37B9771013AC6D2143180782B865B406F57010EC3D6686C3020847615F4339C3`
- Gate 5B.1 handoff:
  `A39F917EE5256263744868BB6E18A5AB0AC8419550D7F64D71E1DDD57C36807C`
- Gate 5B.2 handoff:
  `DD631144A33CECF0B2A37F3C58634C87333177CA2B23226A438B85359ACDB48F`
- Gate 5B.2 `FAIL_RECOVERED` report:
  `C86E929EE35BFFBE78C9A342459CC6B4549C956F6ABF6502B462876226568C61`
- Route store:
  `927EE1D5B5684ED2F48FC1CF9095662A80DFDF1A8C25733F4309D7B86582ADFA`
- Activity:
  `7A48F6B0A9D51B96C35EADCCC44821A3B9863CB51DAD4A0429E311FC6CA0B186`

Require manifest absence and absence of the Gate 5B.3 report path.

All unchanged safety, snapshot, process-tree, exclusive-open, credential,
in-memory unlock, apply, status, routing, restore, emergency recovery,
redaction, and cleanup clauses from Gate 5B through Gate 5B.2 remain mandatory.

## 3. Report path and checkpoints

Create only:

`planning/claude-code/CLAUDE_CODE_GATE_5B3_NATIVE_CLI_PREFLIGHT_REPORT.md`

Checkpoint 1:

```text
Gate 5B.3 will first qualify the machine's single native Claude executable with
one captured --version invocation before reading or changing real Claude state.
Only if that preflight passes will it privately snapshot, apply once, run one
status check and one routing request, restore in finally, and delete the
successful snapshot. The single VS Code host tree remains open.

Reply exactly: I APPROVE GATE 5B.3 NATIVE PREFLIGHT AND LIVE RESTORE
```

Checkpoint 2, asked only after native preflight and private snapshot pass:

```text
Native Claude preflight and the private snapshot are verified. Keep this VS
Code/OpenCode window open, keep every Claude session and other IDE closed, and
do not start another VS Code root.

Reply exactly: HOST IDE ONLY FOR GATE 5B.3
```

Any other reply stops `BLOCKED`.

## 4. Native executable resolution

After checkpoint 1 and before real-state access:

1. Run `Get-Command claude -All` in memory.
2. Select candidates only when `CommandType == Application` and the source leaf
   extension equals `.exe` case-insensitively.
3. Require exactly one candidate.
4. Require an absolute canonical existing regular-file leaf.
5. Reject a reparse-point leaf and any reparse component below its stable
   existing parent boundary.
6. Require the leaf filename to equal `claude.exe` case-insensitively.
7. Store the canonical path only in memory. Never emit or report it.
8. Do not inspect or invoke the PowerShell, CMD, extensionless, or other
   application forms.

Report only:

```text
NATIVE_CLAUDE_CANDIDATE_COUNT=1
NATIVE_CLAUDE_LEAF_TRUSTED=True
```

If either condition fails, stop before any real-state access.

## 5. Serializer capability test

Run the exact non-Claude PowerShell 5.1 serializer capability test from Gate
5B.2 section 5 using app Python under `-I -S`. Require:

```text
POWERSHELL51_SERIALIZED_LAUNCHER_OK=True
```

Require zero `.ArgumentList` occurrences in the executed parent script.

## 6. Native version preflight before mutation

Use the exact Gate 3 serializer functions from Gate 5B.2 section 4 and the
in-memory `ProcessStartInfo` capture pattern from Gate 5B.2 section 6.

Set `FileName` to the trusted native `.exe`. Use one logical argument array:

```powershell
[string[]]$logicalArguments = @('--version')
```

Use an empty GUID working directory under `%LOCALAPPDATA%\Temp\opencode`.
Clear and restore proxy variables in `finally`. Require no credential access.

Require:

- `Start()` returns true;
- exactly one launched version attempt;
- exit 0 within 30 seconds;
- stderr empty;
- trimmed stdout exactly `2.1.153 (Claude Code)`;
- every transient `claude` process belongs to the privately captured owned
  child tree;
- all `claude` processes return to zero after exit;
- stdout/stderr/process variables are disposed and cleared without emission.

Emit only:

```text
GATE5B3_NATIVE_VERSION_OK
```

Delete the empty preflight working directory after proving containment,
ownership, no reparse point, and emptiness.

If any preflight condition fails, stop `BLOCKED`. Do not snapshot, resolve a
credential, unlock, apply, contact a gateway, retry, or select another command
form.

## 7. Native launcher for live stages

Only after section 6 passes, retain the exact canonical native executable in
memory for this gate. Do not resolve it again.

For `/status` and routing, use exactly the Gate 5B.2 logical argument arrays,
serializer, `ProcessStartInfo.Arguments`, in-memory async stream capture,
timeouts, redaction, empty `--tools` argument, proxy isolation, owned-child
tracking, and exact-child-tree timeout cleanup.

Do not run `--version` again after apply. Per-stage launch limits for this gate:

- version: exactly one launched attempt before real-state access;
- status: at most one launched attempt after apply;
- routing: at most one launched attempt after status success.

## 8. Complete live transaction

After native qualification:

1. Run the Gate 5B.1 process-tree checks: `claude == 0`, other IDE families
   zero, exactly one Code host tree.
2. Create and verify a new private snapshot under the fixed temporary parent.
3. Receive checkpoint 2 verbatim.
4. Run both exclusive-open probes and all immediate hash/revision guards.
5. Resolve the route credential from Windows user scope into bounded process
   scope and restore/clear it in the outer `finally`.
6. Apply exactly once through the isolated in-memory adapter unlock and
   production `-AllowRealTarget` wrapper.
7. Run `/status` at most once with the qualified native executable.
8. Only if status passes, run one routing request with the qualified native
   executable.
9. Restore exactly once in the mandatory outer `finally`, regardless of CLI
   result.
10. Byte-restore app state, remove only transaction-owned artifacts, verify all
    fixed labels and plugin aggregate, clear process credential state, return
    Claude count to zero, retain one Code tree, and dispose the snapshot.

No command-form or launcher discovery may occur after apply.

## 9. Acceptance

`PASS` requires every Gate 5B/Gate 5B.1 criterion plus:

- native candidate count exactly one and trusted leaf true;
- serializer capability true;
- native version preflight passed before real-state access;
- status successfully confirms the selected loopback route;
- routing request returns the exact fixed marker with exact selected-model
  evidence and no fallback/tool/session persistence;
- mandatory restore and complete byte equality pass;
- no process, credential copy, transaction artifact, manifest, applied route,
  or snapshot remains, except the single Code host tree.

If version preflight fails, status is `BLOCKED` with zero real-state access. If
post-apply status/routing fails but restoration passes, status is
`FAIL_RECOVERED`. Never call either result `PASS`.

## 10. Required report

Create `planning/claude-code/CLAUDE_CODE_GATE_5B3_NATIVE_CLI_PREFLIGHT_REPORT.md` as ASCII
Markdown only after a post-snapshot flow has restored, or immediately after a
preflight-only `BLOCKED` result with explicit zero-real-state attestation.

Use the full Gate 5B report contract and add:

1. Gate 5B.2 report hash/status.
2. Native candidate/trusted-leaf Booleans.
3. Serializer capability and `.ArgumentList` count.
4. Version preflight attempt count/result and confirmation it preceded all
   real-state access.
5. Status/routing attempt counts and pass/fail only.
6. Owned-child and timeout cleanup aggregate evidence.
7. Complete restore/snapshot disposal evidence when apply occurred.
8. Gate 5C recommendation, explicitly not authorization.

Never include the executable path, command output, route, model, endpoint,
session, process identity, credential, target/snapshot path, token, or cost.

## 11. Boundary

Gate 5B.3 authorizes one native preflight and, only after it passes, one
complete restored live transaction. It does not authorize command-form
fallback, Gate 5C, lifecycle/status changes, documentation synchronization,
release, commits, or deferred credential UX work.
