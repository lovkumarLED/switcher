# Claude Code Gate 5B.1 Live Validation Retry Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** Retry Gate 5B while allowing the one VS Code process tree that
> hosts the current OpenCode conversation. Gate 5C remains unauthorized.

## 1. Root cause and goal

The first Gate 5B attempt stopped safely because its checkpoint required every
`Code` helper process to be zero while the user was running OpenCode inside VS
Code. Current aggregate evidence after the user closed Claude is:

- `claude`: 0;
- `Code`: 21 in one root tree;
- `Cursor`, `Windsurf`, `idea64`, `pycharm64`: 0.

The zero-`Code` condition is structurally incompatible with this execution
host. The actual safety requirement is that no Claude process is running and
the selected settings target is not held open by another process.

Retry the complete Gate 5B flow from a new private snapshot, retaining the
current VS Code host only when exclusive target-open and revision checks pass.

## 2. Authoritative baseline

Read before any command:

1. `planning/claude-code/CLAUDE_CODE_GATE_5B_LIVE_VALIDATION_HANDOFF.md`
2. `planning/claude-code/CLAUDE_CODE_GATE_5A2_ROUTE_PROVISIONING_RETRY_REPORT.md`
3. `adapters/claude-code/ADAPTER.md`
4. `adapters/claude-code/BUILDER_SPEC.md`
5. `app/app/claude_adapter.py`

Verify:

- Gate 5B handoff SHA-256:
  `37B9771013AC6D2143180782B865B406F57010EC3D6686C3020847615F4339C3`
- Gate 5A.2 report SHA-256:
  `091D3E0B3A57865C2A3418B4B39F9D2F19AD0CA9E0A6664FC4E588018A10D6AD`
- Route store SHA-256:
  `927EE1D5B5684ED2F48FC1CF9095662A80DFDF1A8C25733F4309D7B86582ADFA`
- Activity SHA-256:
  `7A48F6B0A9D51B96C35EADCCC44821A3B9863CB51DAD4A0429E311FC6CA0B186`
- `planning/claude-code/CLAUDE_CODE_GATE_5B_LIVE_VALIDATION_REPORT.md` is absent.

The Gate 5B handoff remains mandatory except for the exact substitutions in
sections 3-6 below. Any other conflict stops `BLOCKED`.

## 3. Report-path substitution

Create only:

`planning/claude-code/CLAUDE_CODE_GATE_5B1_LIVE_VALIDATION_RETRY_REPORT.md`

Do not create the original Gate 5B report path. Preserve all prior handoffs and
reports unchanged.

## 4. Checkpoint substitutions

### Checkpoint 1

Replace the original phrase with:

```text
Gate 5B.1 will repeat the private snapshot and bounded live test while keeping
the current VS Code host open. It requires zero Claude processes, zero other
IDE-family processes, one existing VS Code root tree, and successful exclusive
open checks on the Claude settings target before apply. It will restore exact
pre-test bytes and delete the successful snapshot.

Reply exactly: I APPROVE GATE 5B.1 LIVE APPLY AND RESTORE
```

### Checkpoint 2

Replace the original process-stop prompt with:

```text
The private snapshot is verified. Keep this VS Code/OpenCode window open, but
close every other VS Code window and ensure no terminal or extension is running
Claude Code. Keep Cursor, Windsurf, IntelliJ, and PyCharm closed.

Reply exactly: HOST IDE ONLY FOR GATE 5B.1
```

Any other reply stops `BLOCKED`.

## 5. Process-tree acceptance substitution

After checkpoint 2, poll every 500 ms for at most 15 seconds. Require:

1. Exact executable-name count `claude == 0`.
2. `Cursor == 0`, `Windsurf == 0`, `idea64 == 0`, `pycharm64 == 0`.
3. At least one `Code` process because it hosts this conversation.
4. Exactly one root `Code` process whose parent is not another `Code` process;
   every other `Code` process must descend from that root.
5. The root/descendant relationship is checked in memory. Report only
   `HOST_CODE_TREE_COUNT=1` and aggregate executable counts; do not emit PIDs,
   parent IDs, paths, titles, command lines, arguments, owners, or window data.

Do not signal, suspend, or kill any process.

If the Code processes do not form exactly one tree, stop `BLOCKED`; ask the user
to close additional VS Code instances. Do not guess which process is safe.

## 6. Exclusive-open safety substitution

After process-tree acceptance and after verifying the private snapshot source
hashes remain unchanged, test the selected `USER_SETTINGS` leaf with this exact
PowerShell shape:

```powershell
$exclusive = $null
try {
  $exclusive = [System.IO.File]::Open(
    $userSettingsPath,
    [System.IO.FileMode]::Open,
    [System.IO.FileAccess]::Read,
    [System.IO.FileShare]::None
  )
} finally {
  if ($null -ne $exclusive) { $exclusive.Dispose() }
}
```

This is a zero-byte-write lock probe. Do not read or emit content. If the open
fails, stop `BLOCKED`, delete the untouched snapshot after hash verification,
and do not apply.

Immediately after closing the exclusive handle:

- recompute `USER_SETTINGS` size/SHA-256 and require equality with snapshot;
- recompute route-store/activity hashes and require the section 2 values;
- require manifest absence;
- require `claude == 0` and one accepted Code tree again.

Repeat the same exclusive-open probe and all five immediate checks inside the
single apply parent process directly before the isolated adapter apply. No
unrelated command may run between that second probe and apply.

The adapter's expected target revision remains the final concurrency guard. A
revision mismatch stops with no retry.

## 7. Unchanged live transaction

After the substituted checks pass, execute Gate 5B sections 10-15 exactly:

- bounded user-scope-to-process credential handling;
- in-memory-only HTTP lock unlock;
- injected `-AllowRealTarget` for production subprocesses;
- exactly one adapter apply;
- one `/status` print-mode check;
- at most one no-tools/no-session-persistence routing request;
- mandatory adapter restore in `finally`;
- exact app-state/target byte restoration;
- owned-artifact cleanup;
- emergency recovery if required;
- private snapshot disposal only after complete equality.

During and after the owned Claude CLI child, the `claude` count may be exactly
the worker-owned child tree. Capture its process identity privately at launch,
require every transient `claude` descendant to belong to that exact child, and
require all `claude` processes to return to zero after exit. Report no PIDs.

The current Code host may remain positive throughout. Re-run the one-tree check
after restoration; do not require Code zero.

## 8. Acceptance substitution

Replace original Gate 5B acceptance criterion 3 with:

```text
Before apply, Claude and every non-host IDE-family count were zero; Code formed
exactly one host tree; both exclusive-open probes passed; all target/app-state
hashes remained unchanged; and the adapter revision guard accepted the same
target revision.
```

Replace criterion 12's process clause with:

```text
No Claude process, non-host IDE process, session persistence, transaction
artifact, manifest, applied route, process credential copy, or private snapshot
remains. The single Code host tree may remain.
```

All other Gate 5B acceptance criteria remain unchanged.

## 9. Required report additions

Use the original Gate 5B report contract at the substituted Gate 5B.1 path.
Add these redacted fields:

- `Prior attempt`: `BLOCKED_PROCESS_CHECKPOINT`, no report created, untouched
  snapshot deleted.
- `Host exception`: `HOST_CODE_TREE_COUNT=1`.
- `Claude pre-apply count`: zero.
- `Other IDE-family counts`: zero.
- `Exclusive-open probe 1`: pass/fail.
- `Exclusive-open probe 2`: pass/fail.
- `Revision guard`: pass/fail.
- `Post-restore Claude count`: zero/nonzero.
- `Post-restore host Code tree`: one/not-one.

Do not emit process identities or any private value.

## 10. Boundary

Gate 5B.1 authorizes only this retry. It does not authorize worker-driven
process termination, multiple Code trees, Gate 5C, lifecycle/status changes,
documentation synchronization, release, commits, or credential UX work.
