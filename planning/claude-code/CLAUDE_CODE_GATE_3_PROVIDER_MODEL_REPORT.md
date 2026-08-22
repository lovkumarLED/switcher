# Claude Code Gate 3 Provider/Model Report

## Status

Gate 3 evidence result: PASS through Stage A. Stage C first pass and final report-inclusive pass each exited 0 with `GATE3_FIXTURE_ASCII_OK`, `GATE3_STATIC_SAFETY_OK`, `GATE3_REPORT_EVIDENCE_OK`, and `GATE3_SCOPE_OK`.
This is an evidence result, not a lifecycle assignment. Sol decides lifecycle status.

## Scope statement

This Gate tested only the named adapter-pipeline semantics and deterministic loopback fake gateway contract. The approved Gate 2 report remains the evidence source for `Fixture Validated`; that wording does not mean `Supported`. no Claude executable behavior was tested, no runtime compatibility is claimed, and no app integration or live configuration test occurred. Gates 4 and 5 remain unauthorized and unperformed. canonical-versus-packaged placement remains unresolved. No placement, derivation, synchronization, or release-packaging decision was made.

## Gate matrix

| Criterion | Result | Pipeline-backed tests | Standalone boundary tests |
|---|---|---|---|
| G3-1 | PASS | `G3-1 pipeline fake response and display-name contract` | `G3-1 display-name fallback variants standalone` |
| G3-2 | PASS | `G3-2 pipeline discovery absent sends no request`; traffic value `1` branch of `G3-2 pipeline and standalone traffic presence blocks discovery` | traffic values `0` and `false` branches |
| G3-3 | PASS | `G3-3 pipeline opaque IDs including discovery response` owns settings, environment, discovered response, and alias-pin opaque ID boundaries | None required |
| G3-4 | PASS | `G3-4 differing models precedence pipeline`; `G3-4 pipeline settings fallback and standalone none` settings branch | neither-model branch |
| G3-5 | PASS | `G3-5 pipeline alias sorting without providers` | None required |

The complete literal Stage C criterion array below preserves each executable criterion result exactly once. Harness terminal evidence also reported `SAFETY PASS - 0 failed` and `OVERALL PASS - Gate 3 provider/model evidence`.

## Changed files

Worker scope has exactly five created files and zero modified files:

- `app/engine/claude-code/inspect-provider-model.ps1`
- `app/engine/claude-code/test-provider-model.ps1`
- `app/engine/claude-code/gate3-fixtures/gateway-models-response.json`
- `app/engine/claude-code/gate3-fixtures/fake-anthropic-gateway.py`
- `planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md`

The two Gate 3 fixtures occupy the sibling namespace; no Gate 2 fixture was added, altered, moved, or recounted.

## TDD RED evidence

Task 1 RED used Python 3.14.5 resolved only by the outer verifier. Before the intended RED, public -PythonExe bound to $SuppliedPythonExe; the harness proved an absolute existing non-reparse leaf, assigned $script:PythonExe exactly once, and passed child identity and stdlib/no-site isolation before any fixture/server/test. The path-with-spaces server case, serializer round-trip, explicit -join checks, and positive-count guards passed. The sole accepted failure was `G3-1 inspector consumes fake model response - inspect-provider-model.ps1 absent`; exit was 1 and `SAFETY FAIL - 1 failed`.

Subsequent focused RED runs exposed missing discovery, selection, alias, response-negative, cleanup, and environment-restoration behavior before minimal changes. Luna review RED reproduced four focused failures: criterion ownership, explicit-port/IPv6 URL acceptance, unsupported-method/query logging, and shutdown-failure root cleanup. The failing lines were `differing precedence not owned by G3-4`, `permitted explicit-port loopback rejected`, `HEAD status was not 404`, and `owned root survived shutdown failure`. Round 2 RED then failed exactly with `TRACE status was not 404`; PROPFIND was the uncommon additional token in the same ordered method matrix. Generic unsupported-method dispatch made TRACE and PROPFIND each return fixed 404 and log exactly one method/path-only line. Minimal fixes produced focused GREEN with all 25 named tests passing. One initial child-validation attempt failed because a PowerShell 5.1 direct `-c` payload lost double quotes; that test payload was corrected before accepting RED. The first safety matrix run reported 10 focused failures, reduced through root-cause fixes until GREEN. The original Stage A regression found 42/43 Gate 2 tests because the old direct fixture location violated its fixed count. The amended handoff moved both files to `gate3-fixtures`; the fresh authoritative Stage A run then produced 43/43.

## GREEN tests run

- Stage A outer interpreter setup: exit 0; `GATE3_PYTHON_VERSION=3.14.5`.
- Gate 3 harness: exit 0; 25 named tests displayed PASS, five criteria PASS, safety 0 failed, overall evidence PASS.
- Gate 2 regression: exit 0; `Summary: 43 passed, 0 failed`.
- OpenCode regression: exit 0; `Tests : 34/34 Passed`, `Failed : 0`.
- Kilo regression: exit 0; `Tests : 32/32 Passed`, `Failed : 0`.
- PowerShell parser check: exit 0; `GATE3_POWERSHELL_PARSE_OK`.
- Isolated Python AST parser check: exit 0; `GATE3_PYTHON_PARSE_OK`.
- Combined Stage A process: exit 0; `STAGE_A_ALL_OK`.

Exact Stage A commands actually run were:

```powershell
function Invoke-Gate3OuterPython {
    param(
        [Parameter(Mandatory=$true)][string]$Executable,
        [Parameter(Mandatory=$true)][string[]]$Arguments
    )
    if($Arguments.Count-lt 2-or $Arguments[0]-cne '-I'-or $Arguments[1]-cne '-S'){throw 'Python isolation arguments missing'}
    $fixedNames=@('PYTHONPATH','PYTHONHOME','PYTHONNOUSERSITE','PYTHONDONTWRITEBYTECODE','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy')
    $names=@((Get-ChildItem Env:|Where-Object{$_.Name-like 'PYTHON*'}|ForEach-Object Name)+$fixedNames|Select-Object -Unique)
    $saved=@{}
    foreach($name in $names){$saved[$name]=[Environment]::GetEnvironmentVariable($name,'Process');[Environment]::SetEnvironmentVariable($name,$null,'Process')}
    try{
        [Environment]::SetEnvironmentVariable('PYTHONNOUSERSITE','1','Process')
        [Environment]::SetEnvironmentVariable('PYTHONDONTWRITEBYTECODE','1','Process')
        & $Executable @Arguments
    }finally{foreach($name in $names){[Environment]::SetEnvironmentVariable($name,$saved[$name],'Process')}}
}
$PythonExe=$null
$probeArguments=@('-I','-S','-c',"import ast,http.server,json,pathlib,signal,sys,threading; print(sys.version.split()[0])")
foreach($candidate in @('python.exe','python3.exe','python','python3')){$command=Get-Command $candidate -ErrorAction SilentlyContinue|Select-Object -First 1;if($command){$resolved=$command.Source;Invoke-Gate3OuterPython -Executable $resolved -Arguments $probeArguments *> $null;if($LASTEXITCODE-eq 0){$PythonExe=[IO.Path]::GetFullPath($resolved);break}}}
if(-not $PythonExe){throw 'No isolated standard-library Python interpreter available'}
$env:GATE3_PYTHON_EXE=$PythonExe
$versionArguments=@('-I','-S','-c',"import sys; print('GATE3_PYTHON_VERSION='+sys.version.split()[0])")
Invoke-Gate3OuterPython -Executable $PythonExe -Arguments $versionArguments
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe $env:GATE3_PYTHON_EXE
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1
$files=@('.\app\engine\claude-code\inspect-provider-model.ps1','.\app\engine\claude-code\test-provider-model.ps1');foreach($file in $files){$tokens=$null;$errors=$null;[void][Management.Automation.Language.Parser]::ParseFile((Resolve-Path $file),[ref]$tokens,[ref]$errors);if($errors.Count){$errors|ForEach-Object Message;exit 1}};'GATE3_POWERSHELL_PARSE_OK'
$parseArguments=@('-I','-S','-c',"import ast,pathlib; p=pathlib.Path(r'app/engine/claude-code/gate3-fixtures/fake-anthropic-gateway.py'); ast.parse(p.read_text(encoding='utf-8')); print('GATE3_PYTHON_PARSE_OK')")
Invoke-Gate3OuterPython -Executable $env:GATE3_PYTHON_EXE -Arguments $parseArguments
```

The same executable was invoked with -I -S for validation, syntax work, argument capture, and every server launch. Direct calls used array splatting. Process calls used `Join-WindowsCommandLineArguments` and the single serialized-string contract; no raw array or ad hoc Python process argument list was used.

## Fake gateway contract evidence

The server bound literal `127.0.0.1` with OS-selected port zero and served only the fixed local contract. Fixture SHA-256 was `9F5C7746CAFE141A4EA9E3B39743967805090E8075C44E43BBF38E4233E89B63`. The main pipeline case observed exactly one `GET /v1/models`, model ID `gateway/native-model-id`, type `model`, and display name `Gate 3 Native Model`.

Display-name standalone variants proved exact fallback to `gateway/fallback-id` for absent, null, empty, whitespace-only, boolean, number, array, and object values. Gateway logging used path-only parsing: a query marker was absent from evidence, while GET, HEAD, PUT, PATCH, DELETE, OPTIONS, TRACE, and PROPFIND each produced exactly one method/path line and fixed 404 handling for unsupported paths. A non-empty string was copied exactly in the fixed response case. Redirect testing observed one request and no follow-up. Invalid JSON, missing data, non-array data, empty ID, wrong type, empty data, oversized body, and delayed response all failed without a result artifact.

The focused 100 ms timeout rejected a bounded 500 ms delayed response as a gateway request failure. No unstable wall-clock threshold is claimed.

## Discovery traffic evidence

Pipeline discovery enabled with traffic key absent produced exactly one request, `requested=true`, `effective=true`, no warning, and request path `/v1/models`. Pipeline discovery absent produced zero requests, false requested/effective values, no warning, empty models, and null request path. Pipeline traffic value `1` and standalone values `0` and `false` each produced zero requests and warning `DISCOVERY_BLOCKED_BY_NONESSENTIAL_TRAFFIC`.

## Model identity and precedence evidence

Opaque IDs retained ordinal equality: settings `settings/model/id`, environment `gateway/env/model`, response `gateway/native-model-id`, and alias pin `gateway/pinned/haiku` or the named pipeline pin remained unchanged. With both differing selection values, observed effective model was `gateway/env/model`, source was `env.ANTHROPIC_MODEL`, and notice was `ANTHROPIC_MODEL overrides settings.model`. With only settings, observed `settings/only/model`, source `settings.model`, and null notice. The standalone neither-value case observed null effective model and source `none`.

## Alias pinning evidence

Unsorted input pins produced exact ordinal alias order `haiku,sonnet` and exact IDs `gateway/pin/haiku` and `gateway/pin/sonnet`. Pins did not appear in `models`. The result contained no provider collection, active-provider collection, or provider-map shape.

## Safety and cleanup evidence

The harness rejected non-temp roots, escaped paths, reparse ancestors, non-loopback and malformed URL forms, redirects, duplicate settings keys, and pre-existing result files. It accepted explicitly written `127.0.0.1:80` and `[::1]:8080` authorities without contacting them when discovery was absent. URL validation uses original-authority syntax to retain explicit default ports and normalize IPv6 independently of PowerShell 5.1 bracketed expanded `Uri.Host` output. Result transactions used create-new same-directory temporary files and left no artifact after failure.

Every server test used nested cleanup so root removal runs even if exact-child shutdown, log-handle, or port-release verification throws. A synthetic shutdown-verification failure proved the owned GUID root was still removed. Graceful shutdown had a two-second bound before exact-PID termination, the child reached exited state, the request log handle closed, and bounded literal-loopback rebind proved released ports. No PID was retained in this report. Every owned GUID temporary root was removed.

One trusted interpreter was resolved only by the outer verifier. The public -PythonExe bound to $SuppliedPythonExe. The harness checked an absolute existing non-reparse leaf, assigned $script:PythonExe exactly once, then validated child identity and stdlib/no-site isolation before any fixture/server/test. There was no retry, reassignment, harness-side discovery, or fallback. Hostile Python and proxy variables were absent in children and exact process values were restored without printing them.

The PowerShell 5.1 serializer round-trip passed all nine logical arguments: empty, plain, spaced, tab-bearing, embedded-quote, backslash-before-quote, trailing-backslash-after-space, one-backslash, and quote-only. The path-with-spaces fake server test passed with `Gate 3 path with spaces` and `server evidence with spaces`. Static helper inspection proved explicit -join on all three repeated-backslash append paths and all positive-count guards. zero counts append nothing, and no array-to-string coercion remains.

Source and evidence checks cover ASCII, loopback-only operation, redacted output, no complete settings output, and no inherited proxy value. No real Claude-owned file, external network, executable, installation, session, authentication, or later-gate surface was accessed.

Both Stage C passes ran these literal command contracts:

```powershell
$Gate3Paths=@(
  "app/engine/claude-code/inspect-provider-model.ps1",
  "app/engine/claude-code/test-provider-model.ps1",
  "app/engine/claude-code/gate3-fixtures/gateway-models-response.json",
  "app/engine/claude-code/gate3-fixtures/fake-anthropic-gateway.py",
  "planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md"
)
if($Gate3Paths.Count-ne 5){throw "authorized path count mismatch"}
foreach($path in $Gate3Paths){if(!(Test-Path -LiteralPath $path -PathType Leaf)){throw "authorized file missing"};$bytes=[IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $path));if($bytes|Where-Object{$_-gt 127}){throw "non-ASCII authorized file"}}
$fixture=Get-Content -LiteralPath "app/engine/claude-code/gate3-fixtures/gateway-models-response.json" -Raw|ConvertFrom-Json
if(@($fixture.data).Count-ne 1 -or $fixture.data[0].id-cne "gateway/native-model-id" -or $fixture.data[0].type-cne "model" -or $fixture.data[0].display_name-cne "Gate 3 Native Model" -or $fixture.data[0].created_at-cne "2026-08-14T00:00:00Z" -or $fixture.has_more-ne $false -or $fixture.first_id-cne "gateway/native-model-id" -or $fixture.last_id-cne "gateway/native-model-id"){throw "fixture contract mismatch"}
"GATE3_FIXTURE_ASCII_OK"
$authHeader="Author"+"ization"
$apiHeader="X-Api"+"-Key"
$stateLeaf="."+"claude"+".json"
$commentSuffix="."+"json"+"c"
$bs=[regex]::Escape([string][char]92)
$profilePattern='[A-Za-z]:'+$bs+'Users'+$bs+'[^'+$bs+']+'+$bs+'\.claude(?:'+$bs+'|$)'
$patterns=@(
  $profilePattern,
  [regex]::Escape($stateLeaf),
  [regex]::Escape($commentSuffix),
  'https?://(?!127\.0\.0\.1(?::\d+)?(?:/|$)|\[::1\](?::\d+)?(?:/|$))',
  'sk-[A-Za-z0-9_-]{12,}',
  'Bearer\s+[A-Za-z0-9._-]{12,}',
  [regex]::Escape($authHeader),
  [regex]::Escape($apiHeader),
  '(?i)Claude runtime compatibility (passed|proven|validated)',
  '(?i)Gate 4 (passed|complete|integrated)',
  '(?i)Gate 5 (passed|complete|validated)',
  '(?i)Status:\s*Supported',
  '(?im)^Status:\s*Compatibility Evaluated\s*$'
)
foreach($path in $Gate3Paths){if(!(Test-Path -LiteralPath $path -PathType Leaf)){throw "authorized file missing"};$text=[IO.File]::ReadAllText((Resolve-Path -LiteralPath $path));foreach($pattern in $patterns){if($text-match $pattern){throw "prohibited pattern in authorized file"}}}
"GATE3_STATIC_SAFETY_OK"
$reportPath="planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md"
$report=[IO.File]::ReadAllText((Resolve-Path -LiteralPath $reportPath))
$headings=@("Status","Scope statement","Gate matrix","Changed files","TDD RED evidence","GREEN tests run","Fake gateway contract evidence","Discovery traffic evidence","Model identity and precedence evidence","Alias pinning evidence","Safety and cleanup evidence","Regression evidence","Failures","Risks/concerns","Remaining work","Git state")
foreach($heading in $headings){if($report-notmatch ('(?m)^## '+[regex]::Escape($heading)+'\s*$')){throw "report heading missing"}}
$criterionLines=@(
  "G3-1 PASS - fake Anthropic-compatible local /v1/models response",
  "G3-2 PASS - discovery opt-in and blocked by nonessential traffic",
  "G3-3 PASS - gateway-native model ID unchanged",
  "G3-4 PASS - ANTHROPIC_MODEL precedence displayed honestly",
  "G3-5 PASS - alias pinning is not a provider list"
)
foreach($line in $criterionLines){if(([regex]::Matches($report,[regex]::Escape($line))).Count-ne 1){throw "criterion evidence missing or duplicated"}}
$required=@('exactly five created files','zero modified files','no Claude executable behavior was tested','no runtime compatibility is claimed','Gates 4 and 5 remain unauthorized and unperformed','Sol decides lifecycle status','canonical-versus-packaged placement remains unresolved','resolved only by the outer verifier','public -PythonExe bound to $SuppliedPythonExe','absolute existing non-reparse leaf','assigned $script:PythonExe exactly once','child identity and stdlib/no-site isolation','before any fixture/server/test','no retry, reassignment, harness-side discovery, or fallback','same executable was invoked with -I -S','serializer round-trip','path-with-spaces','explicit -join','positive-count guards','zero counts append nothing','no array-to-string coercion','single serialized-string contract','no commit was created')
foreach($phrase in $required){if(!$report.Contains($phrase)){throw "required report evidence missing"}}
"GATE3_REPORT_EVIDENCE_OK"
git diff --check -- $Gate3Paths
if($LASTEXITCODE-ne 0){exit 1}
$scoped=@(git status --short -- $Gate3Paths)
if($scoped.Count-ne 5){throw "authorized scoped status count mismatch"}
foreach($line in $scoped){if($line-notmatch '^\?\? '){throw "authorized path is not a newly created untracked file"}}
$reported=@($scoped|ForEach-Object{$_.Substring(3).Replace('\','/') }|Sort-Object)
$expected=@($Gate3Paths|Sort-Object)
if((Compare-Object $expected $reported)){throw "authorized scoped path mismatch"}
foreach($path in $Gate3Paths){$lines=[IO.File]::ReadAllLines((Resolve-Path -LiteralPath $path));for($i=0;$i-lt $lines.Count;$i++){if($lines[$i]-match '[ \t]+$'){throw "trailing whitespace in authorized file"}}}
"GATE3_SCOPE_OK"
$roots=@(Get-ChildItem -LiteralPath ([IO.Path]::GetTempPath()) -Directory -Filter 'bdf-claude-gate3-*' -ErrorAction SilentlyContinue)
$children=@(Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue|Where-Object{$_.CommandLine-like '*fake-anthropic-gateway.py*'})
"GATE3_TEMP_ROOT_COUNT=$($roots.Count)"
"GATE3_GATEWAY_PROCESS_COUNT=$($children.Count)"
if($roots.Count-or $children.Count){exit 1}
```

The complete block above was run unchanged for the first and final report-inclusive passes. Both complete passes exited 0 with all four markers; cleanup emitted zero roots and zero gateway processes.

## Regression evidence

The authoritative fresh Stage A run passed Gate 2 43/43, OpenCode 34/34, and Kilo 32/32, each with exit 0. The earlier 42/43 result was a pre-amendment path-layout failure and was not reinterpreted as passing. Moving the two Gate 3 fixtures to the authorized sibling namespace restored the unchanged Gate 2 artifact-count invariant.

## Failures

Expected RED failures are recorded above. A first Stage A attempt after the move reached all required regression counts but its nested parser command was quoted incorrectly and failed before parsing source; the entire Stage A sequence was restarted. The authoritative rerun passed. An earlier cleanup inspection found one exact-owned fake gateway child retained from the pre-fix readiness failure; only that exact PID was stopped. Luna review RED intentionally left two owned GUID roots before nested cleanup was implemented. Their system-temp parent and exact `bdf-claude-gate3-<32 hex>` ownership patterns were verified, only those exact roots were removed, and final counts were zero roots and zero fake-gateway processes. No cleanup, recovery, parser, criterion, or regression failure remains.

## Risks/concerns

The fake response proves only this adapter test contract; it does not prove acceptance by any Claude process. PowerShell 5.1 command-line serialization and HTTP behavior were tested on this Windows environment. The fake server uses a deterministic loopback contract but scheduling and ephemeral port numbers are intentionally not asserted. The research-plan canonical and packaged implementation relationship remains unresolved.

## Remaining work

Sol must review this evidence and decides lifecycle status. No compatibility draft was created. No runtime compatibility is claimed. Gates 4 and 5 remain unauthorized and unperformed. Any app integration, live validation, public status change, source placement, synchronization, packaging, or release work requires a separate handoff.

## Git state

Branch was `main`. The five authorized paths are new and untracked; authorized scope contains exactly five created files and zero modified files. Unrelated pre-existing tracked and untracked changes were preserved. The old direct Gate 3 fixture paths are absent. No staging occurred and no commit was created.
