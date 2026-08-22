# Claude Code Gate 5B.2 Live Validation Launcher Retry Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** Retry the complete bounded Gate 5B transaction with the
> repository-proven PowerShell 5.1 Windows argument serializer. Gate 5C remains
> unauthorized.

## 1. Root cause and goal

Gate 5B.1 completed one real production apply and one restore with complete
byte recovery, but its Claude CLI launcher failed before launch because
`ProcessStartInfo.ArgumentList` is unavailable under Windows PowerShell 5.1.

The existing Gate 3 harness already solves this runtime constraint with
`ConvertTo-WindowsCommandLineArgument` and
`Join-WindowsCommandLineArguments`, assigning the serialized result to
`ProcessStartInfo.Arguments`. Sol independently verified this path preserves an
empty argument, whitespace, an embedded quote, and a trailing backslash under
the current PowerShell 5.1/app-Python runtime.

Repeat the bounded live transaction once, replacing only the launcher.

## 2. Authoritative baseline and hashes

Read before any command:

1. `planning/claude-code/CLAUDE_CODE_GATE_5B_LIVE_VALIDATION_HANDOFF.md`
2. `planning/claude-code/CLAUDE_CODE_GATE_5B1_LIVE_VALIDATION_RETRY_HANDOFF.md`
3. `planning/claude-code/CLAUDE_CODE_GATE_5B1_LIVE_VALIDATION_RETRY_REPORT.md`
4. `app/engine/claude-code/test-provider-model.ps1`, lines 7-35
5. `adapters/claude-code/ADAPTER.md`
6. `adapters/claude-code/BUILDER_SPEC.md`
7. `app/app/claude_adapter.py`

Verify exact SHA-256:

- Gate 5B handoff:
  `37B9771013AC6D2143180782B865B406F57010EC3D6686C3020847615F4339C3`
- Gate 5B.1 handoff:
  `A39F917EE5256263744868BB6E18A5AB0AC8419550D7F64D71E1DDD57C36807C`
- Gate 5B.1 `FAIL_RECOVERED` report:
  `4B0CDAB01492F341D06D1946262A4E0DDA7AB30B461CCC0143D8E9D58259935E`
- Route store:
  `927EE1D5B5684ED2F48FC1CF9095662A80DFDF1A8C25733F4309D7B86582ADFA`
- Activity:
  `7A48F6B0A9D51B96C35EADCCC44821A3B9863CB51DAD4A0429E311FC6CA0B186`

Require manifest absence, no Gate 5B report, and no Gate 5B.2 report.

The Gate 5B and Gate 5B.1 handoffs remain mandatory except for the exact
launcher, checkpoint phrase, and report-path substitutions below.

## 3. Report path and checkpoints

Create only:

`planning/claude-code/CLAUDE_CODE_GATE_5B2_LIVE_VALIDATION_LAUNCHER_RETRY_REPORT.md`

Checkpoint 1:

```text
Gate 5B.2 will repeat the already recovered bounded live transaction using the
PowerShell 5.1 argument serializer proven by Gate 3. It will keep the single VS
Code host tree, require zero Claude/other IDE processes, privately snapshot,
apply once, run at most one status and one routing request, restore in finally,
and delete the successful snapshot.

Reply exactly: I APPROVE GATE 5B.2 LIVE APPLY AND RESTORE
```

Checkpoint 2:

```text
The private snapshot is verified. Keep this VS Code/OpenCode window open, keep
Claude Code and every other IDE closed, and do not start another VS Code root.

Reply exactly: HOST IDE ONLY FOR GATE 5B.2
```

Any other reply stops `BLOCKED`.

## 4. Exact PowerShell 5.1 serializer

Copy these functions exactly from the tested Gate 3 harness into the in-memory
Gate 5B.2 parent script:

```powershell
function ConvertTo-WindowsCommandLineArgument {
    param([AllowEmptyString()][Parameter(Mandatory=$true)][string]$Value)
    if($Value.Length-eq 0){return '""'}
    if($Value-notmatch '[\s"]'){return $Value}
    $builder=New-Object Text.StringBuilder
    [void]$builder.Append('"')
    $slashes=0
    foreach($character in $Value.ToCharArray()){
        if($character-eq '\'){$slashes++;continue}
        if($character-eq '"'){
            $escapedSlashCount=($slashes*2)+1
            if($escapedSlashCount-gt 0){[void]$builder.Append((('\' * $escapedSlashCount)-join ''))}
            [void]$builder.Append('"')
            $slashes=0
            continue
        }
        if($slashes-gt 0){[void]$builder.Append((('\' * $slashes)-join ''));$slashes=0}
        [void]$builder.Append($character)
    }
    $trailingSlashCount=$slashes*2
    if($trailingSlashCount-gt 0){[void]$builder.Append((('\' * $trailingSlashCount)-join ''))}
    [void]$builder.Append('"')
    return $builder.ToString()
}

function Join-WindowsCommandLineArguments {
    param([AllowEmptyString()][Parameter(Mandatory=$true)][string[]]$Arguments)
    return (($Arguments|ForEach-Object{ConvertTo-WindowsCommandLineArgument -Value $_})-join ' ')
}
```

Do not use `.ArgumentList`, `Start-Process`, native PowerShell `&` invocation,
`cmd.exe`, a shell command string, or ad hoc quoting for any Claude CLI stage.

## 5. Mandatory pre-live capability test

After checkpoint 1 but before real-state access or snapshot, run one
non-Claude capability test with the existing app Python executable under
`-I -S`. Its logical argument array must append exactly:

```text
<empty string>
a b
q"r
trail\
```

The Python child serializes `sys.argv[1:]` as JSON. Launch it through
`ProcessStartInfo.Arguments` using the exact functions in section 4,
`UseShellExecute = false`, `CreateNoWindow = true`, and in-memory standard
output/error capture. Require exit 0, empty stderr, parseable JSON, and exact
ordinal equality of all four values.

Emit only:

```text
POWERSHELL51_SERIALIZED_LAUNCHER_OK=True
```

If false, stop `BLOCKED` before snapshot. Do not attempt Claude or real apply.

Statically scan the parent script and require zero `.ArgumentList`
occurrences before continuing.

## 6. Exact Claude child launcher

For each authorized Claude stage, construct a fresh logical `[string[]]` and
serialize it with `Join-WindowsCommandLineArguments`. Use:

```powershell
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $claudeExecutable
$startInfo.Arguments = Join-WindowsCommandLineArguments -Arguments $logicalArguments
$startInfo.WorkingDirectory = $emptyGate5WorkDirectory
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true

$child = New-Object System.Diagnostics.Process
$child.StartInfo = $startInfo
if (-not $child.Start()) { throw 'Claude child failed to start' }
$stdoutTask = $child.StandardOutput.ReadToEndAsync()
$stderrTask = $child.StandardError.ReadToEndAsync()
if (-not $child.WaitForExit(120000)) {
    & taskkill.exe /PID $child.Id /T /F | Out-Null
    $child.WaitForExit()
    throw 'Claude child timed out'
}
$stdout = $stdoutTask.GetAwaiter().GetResult()
$stderr = $stderrTask.GetAwaiter().GetResult()
$exitCode = $child.ExitCode
```

The redirected streams remain in memory only and are never printed, written,
logged, or included in a report. This in-memory capture is explicitly allowed;
file/shell output redirection remains prohibited.

On timeout, `taskkill` is authorized only for the exact privately captured
worker-owned root PID and its descendants. No name/wildcard/port kill is
allowed. Record only `OWNED_TIMEOUT_CLEANUP=True|False`, never a PID.

Dispose the process and clear stdout/stderr variables in `finally` after each
stage. Require every worker-owned Claude descendant to exit and aggregate
`claude` count to return to zero.

## 7. Exact logical argument arrays

Resolve the same existing Claude executable once after apply. Do not search
fallback names.

Version:

```powershell
[string[]]$logicalArguments = @('--version')
```

Require exit 0 and exact in-memory version `2.1.153 (Claude Code)`.

Status:

```powershell
[string[]]$logicalArguments = @(
  '--print', '/status',
  '--output-format', 'json',
  '--no-session-persistence',
  '--bare',
  '--setting-sources', 'user',
  '--tools', '',
  '--permission-mode', 'dontAsk',
  '--no-chrome',
  '--max-budget-usd', '0.10'
)
```

Routing:

```powershell
[string[]]$logicalArguments = @(
  '--print', 'Reply exactly GATE5B_ROUTE_OK',
  '--output-format', 'json',
  '--no-session-persistence',
  '--bare',
  '--setting-sources', 'user',
  '--disable-slash-commands',
  '--tools', '',
  '--permission-mode', 'dontAsk',
  '--no-chrome',
  '--max-budget-usd', '0.10'
)
```

The empty `--tools` value must survive serializer round-trip exactly. Do not
replace it with an omitted value or another tools policy.

## 8. Complete live transaction

After the capability test, execute the complete Gate 5B.1 flow from checkpoint
1 onward with a new private snapshot and both exclusive-open probes:

1. Verify zero Claude/other IDE processes and exactly one Code host tree.
2. Snapshot and verify all fixed labels and plugin aggregate.
3. Receive checkpoint 2.
4. Run both exclusive target-open checks and revision/hash guards.
5. Resolve the user-scope credential into bounded process scope.
6. Apply exactly once through the in-memory adapter unlock and
   `-AllowRealTarget` wrapper.
7. Run version once, status at most once, and routing at most once through the
   section 6 launcher.
8. Restore exactly once in the mandatory outer `finally`.
9. Restore app state byte-for-byte, remove only transaction-owned artifacts,
   verify all fixed labels/plugin aggregate/process cleanup, and dispose the
   snapshot.

Do not treat the successful Gate 5B.1 apply/restore as a substitute for this
attempt's complete transaction. Do not skip this attempt's restoration.

## 9. Acceptance

All Gate 5B and Gate 5B.1 acceptance criteria remain mandatory. Additionally:

- capability serializer test passes before real-state access;
- `.ArgumentList` count is zero;
- all three Claude logical arrays use the exact tested serializer;
- version receives exactly one attempt;
- status receives at most one attempt;
- routing receives at most one attempt;
- empty tools argument survives exactly;
- no private stream content escapes memory;
- timeout cleanup, if needed, is limited to the exact owned child tree;
- restoration and byte equality pass regardless of CLI outcome.

`PASS` still requires successful status route confirmation and exact selected
model evidence. A launcher success alone is insufficient.

## 10. Required report

Create
`planning/claude-code/CLAUDE_CODE_GATE_5B2_LIVE_VALIDATION_LAUNCHER_RETRY_REPORT.md` as
ASCII Markdown after restoration. Use the complete Gate 5B report contract and
add:

1. Gate 5B.1 report hash and `FAIL_RECOVERED` baseline.
2. `POWERSHELL51_SERIALIZED_LAUNCHER_OK`.
3. `.ArgumentList` static count.
4. Per-stage launch-attempt counts: version/status/routing.
5. Empty-tools round-trip Boolean.
6. Owned timeout cleanup Boolean/not-needed.
7. In-memory stream disposal/redaction Boolean.
8. Gate 5C recommendation, explicitly not authorization.

Do not include command output, model, endpoint, route, session, process,
credential, target path, snapshot path, token, or cost details.

## 11. Boundary

Gate 5B.2 authorizes only this single launcher retry and complete restored live
transaction. Gate 5C, lifecycle/status updates, documentation synchronization,
release, commits, and deferred credential UX work remain unauthorized.
