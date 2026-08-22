# Claude Code Gate 5B.4 Default 2.1.153 Hosted CLI Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** Qualify and invoke only the default PowerShell-resolved Claude
> Code 2.1.153 command through Windows PowerShell; then perform one bounded
> apply/status/routing/restore transaction. Gate 5C remains unauthorized.

## 1. Goal and corrected command ownership

The user's default `claude` command reports `2.1.153 (Claude Code)`. The native
`claude.exe` that reports 2.1.150 belongs to the user's Free Claude Code (FCC)
toolchain and is not stale or disposable.

Gate 5B.4 must use only the default PowerShell-resolved Claude 2.1.153 script,
hosted by Windows PowerShell. It must ignore and protect the complete FCC
toolchain.

## 2. Absolute FCC protection boundary

Do not enumerate, inspect, hash, invoke, update, install over, rename, move,
delete, quarantine, repair, compare, or otherwise access:

- the native `claude.exe` command form;
- the extensionless or CMD Claude command forms;
- `free-claude-code.exe`;
- `fcc-claude.exe`;
- `fcc-codex.exe`;
- `fcc-init.exe`;
- `fcc-server.exe`;
- any other file under the user's `.local\bin` directory.

Do not run `Get-Command claude -All`. Resolve only the default command with
`Get-Command claude` after checkpoint 1. Never emit its path.

## 3. Authoritative baseline and hashes

Read before any command:

1. `planning/claude-code/CLAUDE_CODE_GATE_5B_LIVE_VALIDATION_HANDOFF.md`
2. `planning/claude-code/CLAUDE_CODE_GATE_5B1_LIVE_VALIDATION_RETRY_HANDOFF.md`
3. `planning/claude-code/CLAUDE_CODE_GATE_5B2_LIVE_VALIDATION_LAUNCHER_RETRY_HANDOFF.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_5B3_NATIVE_CLI_PREFLIGHT_HANDOFF.md`
5. `planning/claude-code/CLAUDE_CODE_GATE_5B3_NATIVE_CLI_PREFLIGHT_REPORT.md`
6. `app/engine/claude-code/test-provider-model.ps1`, lines 7-35
7. `adapters/claude-code/ADAPTER.md`
8. `adapters/claude-code/BUILDER_SPEC.md`
9. `app/app/claude_adapter.py`

Verify exact SHA-256:

- Gate 5B handoff:
  `37B9771013AC6D2143180782B865B406F57010EC3D6686C3020847615F4339C3`
- Gate 5B.1 handoff:
  `A39F917EE5256263744868BB6E18A5AB0AC8419550D7F64D71E1DDD57C36807C`
- Gate 5B.2 handoff:
  `DD631144A33CECF0B2A37F3C58634C87333177CA2B23226A438B85359ACDB48F`
- Gate 5B.3 handoff:
  `BD6CA0DCE357160D30AC95DA779638EAFDEF1DD5AB5D72CABBD4C3D2011D2EB1`
- Gate 5B.3 `BLOCKED` report:
  `F964BCAE23FA6AF73354102F903E0BEA74AEE8C841C6D103046FA559F68199B3`
- Route store:
  `927EE1D5B5684ED2F48FC1CF9095662A80DFDF1A8C25733F4309D7B86582ADFA`
- Activity:
  `7A48F6B0A9D51B96C35EADCCC44821A3B9863CB51DAD4A0429E311FC6CA0B186`

Require manifest absence and absence of the Gate 5B.4 report path.

All unchanged Gate 5B/Gate 5B.1 safety, snapshot, process-tree,
exclusive-open, credential, in-memory unlock, apply, restore, recovery,
redaction, and cleanup clauses remain mandatory.

## 4. Report path and checkpoints

Create only:

`planning/claude-code/CLAUDE_CODE_GATE_5B4_DEFAULT_2153_HOSTED_CLI_REPORT.md`

Checkpoint 1:

```text
Gate 5B.4 will qualify only your normal default Claude Code 2.1.153 command
through Windows PowerShell before reading or changing real Claude state. It
will not inspect, invoke, update, remove, or otherwise touch the FCC binaries
or anything under .local\bin. Only after preflight passes will it snapshot,
apply once, run one status and one no-tools routing request, restore in finally,
and delete the successful snapshot.

Reply exactly: I APPROVE GATE 5B.4 DEFAULT 2.1.153 LIVE RESTORE
```

Checkpoint 2, asked only after preflight and snapshot pass:

```text
Default Claude 2.1.153 preflight and the private snapshot are verified. Keep
this VS Code/OpenCode window open, keep all Claude sessions and other IDEs
closed, and do not start another VS Code root.

Reply exactly: HOST IDE ONLY FOR GATE 5B.4
```

Any other reply stops `BLOCKED`.

## 5. Default script and host resolution

After checkpoint 1, before real-state access:

1. Resolve only `Get-Command claude` without `-All`.
2. Require exactly one result with `CommandType == ExternalScript`.
3. Require source leaf extension `.ps1` and leaf filename `claude.ps1`, both
   case-insensitive.
4. Require an absolute canonical existing regular-file leaf with no reparse
   point at the leaf or below its stable existing parent boundary.
5. Store the canonical script path only in memory; do not read its contents or
   emit/report its path.
6. Resolve the host only as `[IO.Path]::Combine($PSHOME, 'powershell.exe')`.
7. Require the host to be an absolute canonical existing regular `.exe` leaf
   with no reparse point.
8. Do not search for another host or command form.

Emit only:

```text
DEFAULT_CLAUDE_EXTERNAL_SCRIPT=True
POWERSHELL_HOST_TRUSTED=True
```

If either condition fails, stop before real-state access.

## 6. Serializer capability test

Use the exact Gate 3 `ConvertTo-WindowsCommandLineArgument` and
`Join-WindowsCommandLineArguments` functions copied in Gate 5B.2 section 4.
Run the non-Claude app-Python serializer capability test from Gate 5B.2 and
require:

```text
POWERSHELL51_SERIALIZED_LAUNCHER_OK=True
```

Require zero `.ArgumentList` occurrences in the executed parent script. Do not
use `Start-Process`, native `&` invocation, `cmd.exe`, or a shell command
string.

## 7. Hosted version preflight before mutation

Use `ProcessStartInfo.FileName = $powershellHost` and serialize this exact
logical argument array into `ProcessStartInfo.Arguments`:

```powershell
[string[]]$logicalArguments = @(
  '-NoProfile',
  '-NonInteractive',
  '-ExecutionPolicy', 'Bypass',
  '-File', $defaultClaudeScript,
  '--version'
)
```

Use an empty GUID work directory under `%LOCALAPPDATA%\Temp\opencode`,
`UseShellExecute=false`, `CreateNoWindow=true`, and async in-memory stdout/
stderr capture. Clear and restore proxy variables in `finally`. Do not resolve
a credential.

Require:

- exactly one launched version attempt;
- child `Start()` true and exit 0 within 30 seconds;
- stderr empty;
- trimmed stdout exactly `2.1.153 (Claude Code)`;
- every process created by the hosted invocation belongs to the privately
  captured PowerShell-rooted child tree;
- aggregate `claude` count returns to zero;
- streams, process objects, and private output variables are disposed/cleared
  without emission;
- the preflight working directory is verified empty and deleted.

Emit only:

```text
GATE5B4_DEFAULT_VERSION_OK
```

If preflight fails, stop `BLOCKED` before snapshot, credential access, unlock,
apply, or network contact. Do not retry or choose another command form.

## 8. Hosted status and routing launchers

Retain the exact qualified script and host paths in memory. Do not resolve
either again after preflight.

Prefix both logical arrays with:

```powershell
@('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
  '-File', $defaultClaudeScript)
```

Append for status:

```powershell
@('--print', '/status',
  '--output-format', 'json',
  '--no-session-persistence',
  '--bare',
  '--setting-sources', 'user',
  '--disallowedTools', '*',
  '--permission-mode', 'dontAsk',
  '--no-chrome',
  '--max-budget-usd', '0.10')
```

Append for routing:

```powershell
@('--print', 'Reply exactly GATE5B_ROUTE_OK',
  '--output-format', 'json',
  '--no-session-persistence',
  '--bare',
  '--setting-sources', 'user',
  '--disable-slash-commands',
  '--disallowedTools', '*',
  '--permission-mode', 'dontAsk',
  '--no-chrome',
  '--max-budget-usd', '0.10')
```

`--disallowedTools '*'` replaces the fragile empty `--tools ''` argument and
must be passed as the literal two-element option/value pair. Require no tool-use
record in parsed output. Any attempted tool use fails the gate.

Use the Gate 5B.2 async in-memory capture, 120-second timeout, owned-child-tree
tracking, exact-tree timeout cleanup, output redaction, and disposal rules.
The PowerShell host root and every descendant are transaction-owned only for
that invocation. Never kill by executable name.

Per-stage limits:

- version: exactly one preflight attempt;
- status: at most one post-apply attempt;
- routing: at most one attempt, only after status passes.

Do not run version again after apply.

## 9. Complete live transaction

Only after version preflight passes:

1. Require `claude == 0`, other IDE families zero, and exactly one Code host
   tree.
2. Create/verify a new private snapshot and plugin aggregate.
3. Receive checkpoint 2 verbatim.
4. Run both exclusive target-open probes and immediate hash/revision checks.
5. Resolve the selected route credential into bounded process scope and
   restore/clear it in the outer `finally`.
6. Apply exactly once through the in-memory adapter unlock and production
   `-AllowRealTarget` wrapper.
7. Run hosted `/status` at most once and validate selected loopback-route
   evidence without emitting content.
8. Only after status passes, run one hosted routing request and require exact
   fixed result, selected-model evidence, no fallback, no tools, and no session
   persistence.
9. Restore exactly once in the mandatory outer `finally`.
10. Byte-restore app state, remove only transaction-owned artifacts, verify all
    fixed labels/plugin aggregate/process cleanup, clear process credential
    state, retain one Code tree, and dispose the snapshot.

No command discovery, FCC access, or launcher substitution may occur after
preflight.

## 10. Acceptance

`PASS` requires every Gate 5B/Gate 5B.1 acceptance criterion plus:

- default command is the trusted PowerShell script and host is trusted;
- serializer capability passes;
- default hosted version preflight passes before real-state access;
- literal wildcard tool denial is present for both live arrays;
- `/status` confirms the selected loopback route;
- exactly one routing request returns the fixed marker with exact selected
  model evidence, no fallback/tool use/session persistence;
- complete restore, byte equality, cleanup, process cleanup, and snapshot
  disposal pass;
- FCC protection boundary has zero access or mutation.

Preflight failure is `BLOCKED` with zero real-state access. Post-apply evidence
failure with full restoration is `FAIL_RECOVERED`. Neither is `PASS`.

## 11. Required report

Create `planning/claude-code/CLAUDE_CODE_GATE_5B4_DEFAULT_2153_HOSTED_CLI_REPORT.md` as
ASCII Markdown. Use the full Gate 5B report contract and include:

1. Gate 5B.3 report hash/status.
2. FCC protection attestation: zero access/mutation.
3. Default-script and PowerShell-host trust Booleans.
4. Serializer capability and `.ArgumentList` count.
5. Hosted version preflight result/attempt count and pre-real-state ordering.
6. Status/routing attempt counts and pass/fail only.
7. Wildcard tool-denial presence and no-tool-use result.
8. Owned hosted-child cleanup and timeout aggregate evidence.
9. Restore/equality/snapshot disposal evidence when apply occurred.
10. Gate 5C recommendation, explicitly not authorization.

Never include any command path, FCC path/content, command output, route, model,
endpoint, session, process identity, credential, target/snapshot path, token,
or cost.

## 12. Boundary

Gate 5B.4 authorizes only the default 2.1.153 hosted preflight and, after it
passes, one complete restored live transaction. It does not authorize FCC
access, installation changes, Gate 5C, lifecycle/status updates, documentation
synchronization, release, commits, or deferred credential UX work.
