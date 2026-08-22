# Claude Code Gate 3 Provider/Model Handoff

> **For the assigned worker:** Use `superpowers:test-driven-development` before implementation and `superpowers:verification-before-completion` before reporting. This handoff authorizes Gate 3 only.

**Assigned worker:** DeepSeek V4 Flash Max

**Effort:** Max

**Goal:** Prove the five Gate 3 provider/model criteria across the approved Gate 2 fixture-builder output, Gate 3 inspection semantics, and a deterministic loopback-only fake Anthropic-compatible `/v1/models` gateway, without invoking Claude Code, accessing Claude-owned state, or using an external network.

**Outcome:** The isolated harness first runs the approved Gate 2 builder against temporary routing/settings fixtures, then gives the resulting settings artifact to the Gate 3 inspector. This proves the bounded adapter pipeline from validated routing profile through generated fixture settings to provider/model presentation, plus the standalone fake gateway contract. It does not prove Claude executable behavior, app integration, live routing, or public support.

## 1. Authority and prerequisite evidence

Read these files before editing, in this order:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_HANDOFF.md`
5. `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md`
6. `planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md`
7. `app/engine/claude-code/build-claude-code.ps1`
8. `app/engine/claude-code/test-claude-code.ps1`
9. `app/engine/schemas/claude-code-routing.schema.json`
10. Existing local HTTP test patterns in `app/tests/test_security.py` and `app/app/testing.py`, only as needed.

The approved Gate 2 report records `PASS`, 43/43 isolated Gate 2 tests, passing OpenCode and Kilo regressions, and no gateway, Claude runtime, real configuration, or effective precedence test. Gate 3 may cite that report as the basis for lifecycle wording `Fixture Validated`. Gate 3 must not retroactively change Gate 2 evidence.

Before work, run read-only `git branch --show-current`, `git status --short --branch`, and an explicit authorized-path inventory. Preserve all unrelated tracked and untracked changes. Do not stage, discard, clean, move, overwrite, or commit anything.

## 2. What Gate 3 tests

Gate 3 tests the bounded adapter pipeline and the deterministic fake gateway contract. Each criterion must include at least one pipeline-backed case that creates a temporary routing profile and temporary settings input, invokes the approved `app/engine/claude-code/build-claude-code.ps1`, requires builder exit 0 and post-write verification success, then passes that builder-produced settings artifact to the Gate 3 inspector. Inspector-only cases may bypass the builder only for URL, HTTP, timeout, malformed-response, path-guard, and settings states that the valid Gate 2 source contract cannot express. Specifically, nonessential-traffic string values `0` and `false`, absence of both model sources, invalid response metadata, and invalid inspector URLs are standalone boundary-contract cases; they must be labeled as such. The report must distinguish every pipeline-backed case from every standalone inspector/gateway contract case.

This evidence proves that Gate 2 output is consumed without semantic drift by Gate 3 logic. It does not test the Claude executable.

The research plan asks for provider/model behavior, but no live Claude session is authorized before Gate 5. Do not invoke `claude`, inspect its installation, infer its version, launch a disposable session, or claim runtime compatibility. Do not use an official noninteractive Claude capability in this gate. If a worker believes such a capability is necessary or useful, stop and request explicit human authorization in a new Sol handoff; do not assume that noninteractive means safe or authorized.

Allowed claims in the worker report after all required checks pass are limited to:

- the approved Gate 2 report remains the evidence source for `Fixture Validated`;
- the named Gate 3 adapter-pipeline semantics and deterministic local fake gateway contract passed the authorized checks;
- no Claude runtime compatibility was tested or established.

The worker must not assign `Compatibility Evaluated` or any other lifecycle transition. Sol decides lifecycle status only after reviewing the Gate 3 evidence. The research-plan canonical sources versus packaged `app/engine/` placement remains unresolved; Gate 3 neither selects a canonical source nor establishes a synchronization or packaging direction.

Do not use `Supported`, `compatible`, `ready`, `working`, or `production-ready` as an unqualified status.

## 3. Exact implementation scope

Create only these five files:

1. `app/engine/claude-code/inspect-provider-model.ps1`
   - Read-only, fixture-confined Gate 3 provider/model inspector.
   - Fetches only a loopback fake `/v1/models` endpoint when discovery is effectively enabled.
   - Produces a redacted structured result for assertions.
2. `app/engine/claude-code/test-provider-model.ps1`
   - PowerShell 5.1-compatible Gate 3 harness.
   - Creates all settings inputs and result files below a GUID directory under the system temporary directory.
   - Starts, observes, and stops the fake gateway in `try`/`finally`.
3. `app/engine/claude-code/gate3-fixtures/gateway-models-response.json`
   - Static deterministic fake Anthropic-compatible model-list response.
4. `app/engine/claude-code/gate3-fixtures/fake-anthropic-gateway.py`
   - Test-only loopback HTTP server for exactly the fake `/v1/models` contract.
5. `planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md`
   - Exact Gate 3 evidence report described in Section 13.

Modify no existing file. In particular, do not modify the Gate 2 builder, Gate 2 harness, routing schema, existing fixtures, app/API/UI code, shared docs, root docs, release files, project state, session logs, or generated files.

The authorized implementation/report count is exactly five created files and zero modified files. The handoff itself is not part of the worker's five-file count.

Gate 2 owns the direct `app/engine/claude-code/fixtures/` directory and its approved harness enforces a fixed artifact count there. Gate 3 must not add files to that directory: doing so would break the proven Gate 2 regression and make Gate 2 recursively depend on later-gate artifacts. The sibling `app/engine/claude-code/gate3-fixtures/` namespace isolates Gate 3 evidence, preserves Gate 2 ownership/count invariants, and prevents future recursive coupling between gate harnesses. Do not alter, move, rename, or recount any Gate 2 fixture.

Do not create `adapters/claude-code/COMPATIBILITY.md` in this gate. The approved documentation design permits a carefully scoped draft, but the smallest correct Gate 3 approach needs only the Gate 3 report. A future documentation handoff may create the compatibility ledger from the approved Gate 2 report and Gate 3 evidence. No other adapter document is authorized.

If the proof cannot remain within these five files, stop and request a new Sol handoff.

## 4. Hard safety boundary

The worker must obey all of the following:

- No access, listing, search, metadata probe, hash, parse, copy, or write of any real user Claude directory or file.
- No access to a real Claude settings file, Claude state file, project Claude directory, MCP file, auth/session data, transcript, prompt, cache, marketplace, plugin, skill, hook, permission, memory, snapshot, or log.
- No read, list, search, creation, or reference to commented-JSON files or suffixes.
- No external gateway, provider, DNS lookup, internet request, redirect, proxy, telemetry endpoint, auth endpoint, or model endpoint.
- No real API key, bearer token, OAuth value, credential-shaped test value, or inherited proxy credential.
- No Claude executable, IDE integration, install, package install, authentication, session, or live route.
- No Gates 4 or 5, app integration, scaffold registration, public support update, or shared documentation status update.
- No commit.

All settings/result writes must occur below a new GUID directory rooted at `[System.IO.Path]::GetTempPath()`. Repository fixtures are read-only. Use marker values such as `FAKE_GATE3_SECRET_DO_NOT_USE`; never use a real-looking key prefix.

Before starting the fake gateway, clear proxy influence for the child process or use a direct local connection implementation that cannot honor proxy environment variables. The inspector must reject every non-literal-loopback host before opening a socket. It may accept only `127.0.0.1` or `::1`; do not accept `localhost`, hostnames, wildcard addresses, or DNS-resolved loopback names.

## 5. Deterministic fake gateway contract

`gateway-models-response.json` must be ASCII UTF-8 without BOM and contain exactly this semantic JSON value (whitespace may follow repository style):

```json
{
  "data": [
    {
      "id": "gateway/native-model-id",
      "type": "model",
      "display_name": "Gate 3 Native Model",
      "created_at": "2026-08-14T00:00:00Z"
    }
  ],
  "has_more": false,
  "first_id": "gateway/native-model-id",
  "last_id": "gateway/native-model-id"
}
```

This is the fixture contract used by the adapter test. Do not state that the Claude executable accepts this shape; that remains untested.

`fake-anthropic-gateway.py` must:

- use only the Python standard library;
- bind `ThreadingHTTPServer` to `("127.0.0.1", 0)` so the OS selects an unused port;
- accept command arguments `--response-file`, `--ready-file`, and `--request-log`;
- validate that all three paths resolve below the harness-provided temporary root passed as `--fixture-root`;
- write the selected numeric port to `--ready-file` only after binding succeeds;
- return the fixture bytes with status 200 and `Content-Type: application/json` only for `GET /v1/models`;
- return status 404 with a fixed empty JSON object for every other path;
- never redirect;
- append one ASCII line per request containing method and path only, with no headers, query values, or body;
- suppress default HTTP logs;
- install clean `SIGINT`/`SIGTERM` handling where supported and always close the server socket.

The outer Stage A verification process resolves one trusted existing Python interpreter exactly once. It passes that exact absolute executable path to the harness through mandatory `-PythonExe`. The harness must not call `Get-Command`, search `PATH`, try fallback executable names, inspect launchers, or independently discover or replace Python. If the outer verifier cannot resolve an existing interpreter that can run the required standard-library imports under `-I -S`, stop; do not install Python or any package.

`test-provider-model.ps1` must begin with this mandatory CLI interface. The public parameter remains `-PythonExe`, but it binds to `$SuppliedPythonExe` so PowerShell does not initialize `$script:PythonExe` during parameter binding:

```powershell
param(
    [Parameter(Mandatory=$true)][Alias('PythonExe')][ValidateNotNullOrEmpty()][string]$SuppliedPythonExe
)
```

Do not declare a parameter variable named `$PythonExe`; script parameters live in script scope and would pre-initialize `$script:PythonExe`, recreating the initialization deadlock. The alias preserves the exact required invocation syntax `-PythonExe <absolute-path>`.

The harness must initialize and validate the supplied interpreter in this exact order before creating any temporary root, server process, fixture, or test artifact:

1. Syntactically require `$SuppliedPythonExe` from public `-PythonExe` to be an absolute path with `[IO.Path]::IsPathRooted`; reject a relative path without probing it.
2. Canonicalize the supplied absolute path once with `[IO.Path]::GetFullPath`.
3. Require the canonical path to be an existing leaf with `Test-Path -LiteralPath $canonicalPython -PathType Leaf`.
4. Read that exact leaf with `Get-Item -LiteralPath $canonicalPython -Force`; reject it if `PSIsContainer` is true or `FileAttributes.ReparsePoint` is set. Do not resolve a link or substitute another executable.
5. Require that the script-scoped variable is not already assigned, then assign `$script:PythonExe=$canonicalPython` exactly once. No later line may assign, clear, normalize, or replace `$script:PythonExe`.
6. Only after that one assignment, invoke `Invoke-Gate3Python -Mode Direct` with logical arguments beginning exactly `-I`, `-S` to perform child identity and standard-library/no-site validation.
7. Require child validation to pass. On any child launch, import, JSON, identity, or flag failure, throw and stop before creating a temporary root, starting a server, or running any test. Do not retry with another executable and do not reassign `$script:PythonExe`.

The helper initialization and child-validation block in Section 5.2 is mandatory. Every Python child invocation, including this first child validation, uses `$script:PythonExe` with `-I -S`. Before launch, temporarily save and clear every process variable whose name starts with `PYTHON`, including `PYTHONPATH` and `PYTHONHOME`; use `try`/`finally` so the parent environment is restored. Set `PYTHONNOUSERSITE=1` and `PYTHONDONTWRITEBYTECODE=1` for the child context. Also save and clear `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, and their lowercase forms, then restore them in `finally`. `-I` ignores `PYTHON*` variables and user site; `-S` prevents automatic `site` import. The explicit clearing is defense in depth and must be tested. Use only standard-library imports.

### 5.1 One PowerShell 5.1 Python launch and argument contract

Windows PowerShell 5.1 `Start-Process -ArgumentList` joins array elements into one command-line string and does not preserve argument boundaries automatically. Passing raw path elements is forbidden. The harness must define the helpers below once and use them for every Python validation, syntax/test invocation, and fake-server launch. No call site may invoke Python directly or call `Start-Process` with an ad hoc argument list.

All Python call sites construct one logical `[string[]]$Arguments` whose first two elements are exactly `-I` and `-S`. `Invoke-Gate3Python` validates that prefix. In direct mode it uses PowerShell array splatting, which preserves each logical argument. In process mode it serializes the complete array with the Windows C-runtime/`CommandLineToArgvW` quoting rules and passes the resulting single string to `Start-Process -ArgumentList`. This is the sole argument serialization contract.

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
    param([Parameter(Mandatory=$true)][string[]]$Arguments)
    return (($Arguments|ForEach-Object{ConvertTo-WindowsCommandLineArgument -Value $_})-join ' ')
}

function Invoke-WithIsolatedPythonEnvironment {
    param([Parameter(Mandatory=$true)][scriptblock]$Body)
    $fixedNames=@('PYTHONPATH','PYTHONHOME','PYTHONNOUSERSITE','PYTHONDONTWRITEBYTECODE','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy')
    $isolatedNames=@((Get-ChildItem Env:|Where-Object{$_.Name-like 'PYTHON*'}|ForEach-Object Name)+$fixedNames|Select-Object -Unique)
    $savedEnvironment=@{}
    foreach($name in $isolatedNames){
        $savedEnvironment[$name]=[Environment]::GetEnvironmentVariable($name,'Process')
        [Environment]::SetEnvironmentVariable($name,$null,'Process')
    }
    try {
        [Environment]::SetEnvironmentVariable('PYTHONNOUSERSITE','1','Process')
        [Environment]::SetEnvironmentVariable('PYTHONDONTWRITEBYTECODE','1','Process')
        & $Body
    } finally {
        foreach($name in $isolatedNames){[Environment]::SetEnvironmentVariable($name,$savedEnvironment[$name],'Process')}
    }
}

function Invoke-Gate3Python {
    param(
        [Parameter(Mandatory=$true)][ValidateSet('Direct','Process')][string]$Mode,
        [Parameter(Mandatory=$true)][string[]]$Arguments
    )
    if($Arguments.Count-lt 2-or $Arguments[0]-cne '-I'-or $Arguments[1]-cne '-S'){throw 'Python isolation arguments missing'}
    if($Mode-eq 'Direct'){
        return Invoke-WithIsolatedPythonEnvironment { & $script:PythonExe @Arguments }
    }
    $serialized=Join-WindowsCommandLineArguments -Arguments $Arguments
    return Invoke-WithIsolatedPythonEnvironment {
        Start-Process -FilePath $script:PythonExe -ArgumentList $serialized -PassThru -WindowStyle Hidden
    }
}
```

The use of `$script:PythonExe` above refers to the syntactically checked, canonicalized, existing non-reparse leaf assigned exactly once before child validation. The assignment enables the mandatory helper; child validation then proves that executable's identity and runtime contract. Never assign it again.

### 5.2 Exact harness initialization and child-validation block

Define all Section 5.1 helper functions first. Immediately after the mandatory `param(...)` block and helper definitions, run this sequence before any fixture-root creation or test setup:

```powershell
if(![IO.Path]::IsPathRooted($SuppliedPythonExe)){throw 'PythonExe must be absolute'}
try{$canonicalPython=[IO.Path]::GetFullPath($SuppliedPythonExe)}catch{throw 'PythonExe path invalid'}
if(!(Test-Path -LiteralPath $canonicalPython -PathType Leaf)){throw 'PythonExe leaf missing'}
$pythonItem=Get-Item -LiteralPath $canonicalPython -Force
if($pythonItem.PSIsContainer-or (($pythonItem.Attributes-band [IO.FileAttributes]::ReparsePoint)-ne 0)){throw 'PythonExe leaf invalid'}
if($null-ne (Get-Variable -Name PythonExe -Scope Script -ErrorAction SilentlyContinue)){throw 'PythonExe already initialized'}
$script:PythonExe=$canonicalPython

$validationCode=@'
import ast, http.server, json, pathlib, signal, sys, threading
result = {
    "executable": str(pathlib.Path(sys.executable).resolve()),
    "isolated": sys.flags.isolated,
    "no_site": sys.flags.no_site,
    "no_user_site": sys.flags.no_user_site,
    "ignore_environment": sys.flags.ignore_environment,
    "site_loaded": "site" in sys.modules,
    "stdlib_ok": True,
}
print(json.dumps(result, sort_keys=True, separators=(",", ":")))
'@
$validationOutput=@(Invoke-Gate3Python -Mode Direct -Arguments @('-I','-S','-c',$validationCode))
if($LASTEXITCODE-ne 0-or $validationOutput.Count-ne 1){throw 'Python child validation failed'}
try{$validation=$validationOutput[0]|ConvertFrom-Json}catch{throw 'Python child validation output invalid'}
try{$childExecutable=[IO.Path]::GetFullPath([string]$validation.executable)}catch{throw 'Python child executable invalid'}
if(!$childExecutable.Equals($script:PythonExe,[StringComparison]::OrdinalIgnoreCase)){throw 'Python child identity mismatch'}
if($validation.isolated-ne 1-or $validation.no_site-ne 1-or $validation.no_user_site-ne 1-or $validation.ignore_environment-ne 1-or $validation.site_loaded-ne $false-or $validation.stdlib_ok-ne $true){throw 'Python isolation or standard-library contract failed'}
```

This is the only harness initialization path. The child emits exactly one compact JSON line. `pathlib.Path(...).resolve()` is permitted only as child-reported identity; it must equal the already assigned non-reparse canonical path and must never be fed back into `$script:PythonExe`. A validation failure stops immediately with no fixture root, server, retry, fallback, or reassignment.

Subsequent direct syntax/test calls use the same helper:

```powershell
$pythonOutput=Invoke-Gate3Python -Mode Direct -Arguments @('-I','-S','-c',$PythonCode)
```

The fake server must use:

```powershell
$serverArguments=@('-I','-S',$ServerPath,'--fixture-root',$Root,'--response-file',$ResponsePath,'--ready-file',$ReadyPath,'--request-log',$RequestLogPath)
$serverProcess=Invoke-Gate3Python -Mode Process -Arguments $serverArguments
```

Every value remains one logical array element before serialization. Do not pre-quote a path, concatenate a flag with its value, escape with PowerShell backticks, or pass a raw string array directly to `Start-Process`. The serializer must correctly handle empty strings, spaces, tabs, embedded double quotes, backslashes before embedded quotes, and trailing backslashes in quoted values.

PowerShell's string multiplication returns a collection-like result that must not rely on implicit `StringBuilder.Append(object)` coercion. Every repeated-backslash expression passed to `StringBuilder.Append` must explicitly collapse to one string with `-join ''`, exactly as shown above. Compute each repetition count first and call `Append` only when the count is greater than zero. A zero count appends nothing; never evaluate a zero-count repetition for append and never pass an array to `Append`.

The harness must assert that every saved environment variable has its exact original process value after `finally`. It must not print those values.

## 6. Inspector interface and result contract

`inspect-provider-model.ps1` must expose exactly:

```powershell
param(
    [Parameter(Mandatory = $true)][string]$FixtureRoot,
    [Parameter(Mandatory = $true)][string]$SettingsPath,
    [Parameter(Mandatory = $true)][string]$GatewayBaseUrl,
    [Parameter(Mandatory = $true)][string]$ResultPath,
    [ValidateRange(100, 5000)][int]$TimeoutMs = 2000
)
```

It is read-only with respect to settings and writes only `ResultPath`. It must not call the Gate 2 builder or patch settings. The harness, not the inspector, invokes Gate 2 first and supplies the resulting settings artifact.

### 6.1 Path and input rules

Before reading or writing:

- canonicalize `FixtureRoot`, `SettingsPath`, and `ResultPath`;
- require `FixtureRoot` below the system temporary directory;
- require settings and result paths to be descendants of that fixture root;
- reject every reparse-point component;
- require settings to pre-exist and result not to exist;
- read raw settings, reject exact and decoded-equivalent duplicate keys before `ConvertFrom-Json`, parse JSON, and require an object root;
- require root `env`, when present, to be an object;
- never print settings values or the complete parsed object.

The duplicate-key and reparse checks may be copied narrowly from the approved Gate 2 proof into the new inspector because the Gate 3 script must remain independently safe. Do not refactor or modify Gate 2 files.

### 6.2 Loopback URL and HTTP rules

`GatewayBaseUrl` must be an absolute `http` URI with:

- host exactly `127.0.0.1` or `::1` as a parsed IP literal;
- an explicit nonzero port;
- no userinfo, query, or fragment;
- path either empty, `/`, or `/v1`.

Construct the request URI as `/v1/models` for an empty/root base path or `/v1` plus `/models` for a `/v1` base path. Reject all other base paths. Do not contact the URL during validation.

For the request:

- disable redirects;
- disable default proxy use;
- allow only GET;
- set `Accept: application/json`;
- use `TimeoutMs` for connection and read timeouts;
- reject non-200 status;
- reject a body larger than 65536 bytes;
- require JSON object root, `data` array, one or more entries, non-empty string `id`, and string `type` equal to `model`;
- preserve every returned model `id` exactly, including slash and punctuation characters;
- set output `displayName` to `display_name` only when `display_name` is a non-empty string; when it is absent, JSON null, empty, whitespace-only, boolean, number, array, or object, set `displayName` to the exact model `id` without failing the otherwise valid model entry;
- ignore response fields not named in the output contract rather than copying them;
- write no auth header because the local gateway uses no authentication.

### 6.3 Discovery and traffic semantics

Treat flags by presence semantics from fixture settings:

- discovery is requested only when `env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY` exists with string value `1`;
- nonessential traffic is disabled when `env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` exists with any non-empty string, including `0` and `false`;
- if nonessential traffic is disabled, discovery is not effective even when requested, no HTTP request is made, and the result contains warning code `DISCOVERY_BLOCKED_BY_NONESSENTIAL_TRAFFIC`;
- if discovery is absent or not exactly `1`, discovery is not effective and no HTTP request is made;
- only requested, unblocked discovery sends exactly one GET to `/v1/models`.

### 6.4 Model precedence semantics

The inspector must report, without changing either value:

- `settingsModel`: root `model` when it is a non-empty string, otherwise JSON null;
- `environmentModel`: `env.ANTHROPIC_MODEL` when it is a non-empty string, otherwise JSON null;
- `effectiveModel`: `environmentModel` when present, otherwise `settingsModel`;
- `effectiveModelSource`: exactly `env.ANTHROPIC_MODEL`, `settings.model`, or `none`;
- `precedenceNotice`: exactly `ANTHROPIC_MODEL overrides settings.model` only when both non-empty values are present and differ; otherwise JSON null.

This is the adapter's display contract. It is based on the approved research plan and does not claim that a Claude process was launched to re-prove precedence.

### 6.5 Alias pinning semantics

Recognize only these preserved env keys for Gate 3 presentation:

- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `ANTHROPIC_DEFAULT_FABLE_MODEL`

For every non-empty string value, emit one `aliasPins` entry with exactly:

```json
{
  "alias": "haiku",
  "modelId": "gateway/pinned-haiku"
}
```

Sort entries by alias using ordinal comparison. Do not create a provider object, provider ID, active-provider list, provider-to-model map, or synthetic discovered model from an alias pin. The top-level result contract must have no property named `providers`, `providerList`, or `activeProviders`.

### 6.6 Exact result shape

Write ASCII-compatible UTF-8 JSON without BOM and with these properties:

```json
{
  "contract": "claude-code-gate3-provider-model-v1",
  "discovery": {
    "requested": true,
    "effective": true,
    "warningCode": null,
    "requestPath": "/v1/models"
  },
  "models": [
    {
      "id": "gateway/native-model-id",
      "type": "model",
      "displayName": "Gate 3 Native Model"
    }
  ],
  "selection": {
    "settingsModel": "settings/model-id",
    "environmentModel": "gateway/native-model-id",
    "effectiveModel": "gateway/native-model-id",
    "effectiveModelSource": "env.ANTHROPIC_MODEL",
    "precedenceNotice": "ANTHROPIC_MODEL overrides settings.model"
  },
  "aliasPins": [
    {
      "alias": "haiku",
      "modelId": "gateway/pinned-haiku"
    }
  ]
}
```

When discovery is not effective, `models` must be an empty array and `requestPath` must be JSON null. Do not include endpoint URLs, ports, headers, settings paths, fixture roots, secrets, or complete environment data in the result.

Write the result through a create-new same-directory temporary file, flush and close it, reparse it, then atomically move it to the previously absent `ResultPath`. On failure, delete only the inspector's own result temporary file and leave no result file.

## 7. One-to-one Gate 3 acceptance matrix

The harness must print exactly one terminal result line for each criterion, in this order, and map each line to one test group. No alternate punctuation or wording is allowed:

```text
G3-1 PASS - fake Anthropic-compatible local /v1/models response
G3-2 PASS - discovery opt-in and blocked by nonessential traffic
G3-3 PASS - gateway-native model ID unchanged
G3-4 PASS - ANTHROPIC_MODEL precedence displayed honestly
G3-5 PASS - alias pinning is not a provider list
```

On criterion failure, replace only `PASS` with `FAIL`, print the redacted contributing test failures after the five criterion lines, and exit nonzero. A criterion passes only when every assertion in its group passes. The Markdown checkboxes below are the one-to-one acceptance mapping; the plain-text lines above are the exact executable output contract.

- [ ] **G3-1 fake Anthropic-compatible local `/v1/models` response**
  - Start the loopback server from the static response fixture.
  - Run the inspector with discovery requested and nonessential traffic absent.
  - Assert one request, exact path `/v1/models`, status-driven success, exact response shape parsing, and the expected single model.
  - Add response variants under the temporary root proving a non-empty string `display_name` is copied exactly and absent, null, empty, whitespace-only, boolean, number, array, and object values each fall back to the exact model ID without changing that ID.
- [ ] **G3-2 discovery opt-in and disabled/flagged with nonessential traffic**
  - With discovery absent, assert no request, `requested=false`, `effective=false`, empty models, null path, and no warning.
  - With discovery `1` plus nonessential traffic value `1` produced by Gate 2, assert no request and warning `DISCOVERY_BLOCKED_BY_NONESSENTIAL_TRAFFIC`.
  - In standalone inspector-boundary cases using temporary settings not claimed as Gate 2 output, repeat with nonessential traffic values `0` and `false`; assert no request and the same warning.
  - With discovery `1` and traffic key absent in Gate 2 output, assert exactly one request and no warning.
- [ ] **G3-3 gateway-native model ID unchanged**
  - Set root `model`, `ANTHROPIC_MODEL`, the fake response ID, and an alias-pin model ID to slash-containing opaque IDs.
  - Assert exact ordinal equality at every corresponding output boundary. Do not normalize, prefix, split, or rewrite the IDs.
- [ ] **G3-4 `ANTHROPIC_MODEL` precedence displayed honestly**
  - With different non-empty root and environment models, assert both original values remain visible, effective model equals the environment value, source is `env.ANTHROPIC_MODEL`, and the exact precedence notice is present.
  - With no environment model, assert the settings model is effective, source is `settings.model`, and notice is null.
  - In a standalone inspector-boundary case, with neither value, assert effective model and source semantics are null/`none`; do not describe this impossible valid Gate 2 output as a pipeline case.
- [ ] **G3-5 alias pinning does not become a fake provider list**
  - Supply at least two alias pins in unsorted input order.
  - Assert deterministic alias ordering and exact opaque model IDs.
  - Assert alias pins do not appear in `models` unless independently returned by `/v1/models`.
  - Assert the result has no `providers`, `providerList`, or `activeProviders` property and no provider-map shape.

Passing all five checkboxes is necessary and sufficient only for the five-criterion matrix. Overall Gate 3 `PASS` additionally requires every required safety/lifecycle test, Gate 2/OpenCode/Kilo regression, parser check, staged evidence check, final report-inclusive ASCII/safety check, authorized-path diff check, cleanup check, and report contract check to pass. Additional safety tests do not create extra criterion checkboxes, but any such failure makes the overall result `FAIL` or `BLOCKED`.

## 8. Required safety and lifecycle tests

Add focused harness cases that prove:

1. Non-temp fixture root is rejected before settings or result access.
2. Escaped settings/result paths and reparse-point ancestors are rejected.
3. Non-loopback, hostname, HTTPS, missing-port, userinfo, query, fragment, and unsupported-base-path URLs are rejected before a request.
4. Redirect responses are not followed. Add a test-only mode to the fake server only if it can be selected by a command argument and remains within `fake-anthropic-gateway.py`; otherwise use a second fixed handler path in that file. Assert no second request.
5. Malformed model JSON, oversized body, missing `data`, non-array `data`, empty ID, and wrong `type` fail with redacted output and no result artifact. These variants may be generated under the temporary root by the harness; do not add fixture files.
6. A delayed fake response exceeding a focused 100 ms inspector timeout fails promptly, emits no sensitive value, and leaves no result or transaction temp. The fake server delay must be opt-in and bounded.
7. Server startup waits at most 5 seconds for the ready file and verifies the process is still alive.
8. Every test stops the server in `finally`; graceful stop gets at most 2 seconds, then the harness may terminate only the exact child PID it created.
9. After shutdown, require the exact child process to reach an exited state and the request log handle to close. Then verify socket release with a bounded retry: attempt to bind a new `System.Net.Sockets.TcpListener` to the same literal loopback address and port every 100 ms for at most 2 seconds, closing each successful probe immediately. Do not require an immediate rebind. Fail cleanup only if every bounded retry fails.
10. Every GUID fixture root is removed in `finally`, including failed test cases.
11. Inspector stdout/stderr, result JSON, request log, and final report contain no fake secret value, `Authorization`, `X-Api-Key`, full settings JSON, or inherited proxy value.
12. Source and generated evidence are ASCII and contain no absolute user-profile Claude path, external URL, credential-shaped string, support claim, or forbidden scope instruction.
13. Static inspection of `test-provider-model.ps1` proves the only Python source is mandatory public `-PythonExe` bound to `$SuppliedPythonExe`: harness source contains no parameter variable named `$PythonExe`, no `Get-Command`, `python.exe`, `python3`, `py.exe`, PATH search, or fallback candidate loop. It contains exactly one assignment matching `$script:PythonExe=$canonicalPython`, that assignment occurs after absolute/existing/non-reparse checks and before the first `Invoke-Gate3Python`, and no later assignment clears or replaces it.
14. A dedicated path-with-spaces case creates a GUID root containing the literal directory segment `Gate 3 path with spaces`, copies the fake server script and response beneath it, and places ready and request-log files beneath a second segment `server evidence with spaces`. It launches only through `Invoke-Gate3Python -Mode Process`, waits for readiness, performs the expected `/v1/models` request, and asserts the server received and used every full path rather than split arguments. Cleanup must remove that exact spaced root in `finally`.
15. A serializer round-trip test invokes the validated Python executable through `Invoke-Gate3Python -Mode Process` with a temporary standard-library argument-capture script. Use this exact logical argument set after the script/output-path arguments: `''`, `'plain'`, `'two words'`, `"tab`tvalue"`, `'quote"value'`, `'slash\"quote'`, `'ends with slash\'`, `'\'`, and `'"'`. The child writes `sys.argv` payload arguments as JSON below the fixture root. Assert the same item count and ordinal equality for every expected item, including the zero-backslash ordinary cases, one-backslash case, quote-only case, backslash-before-quote case, and trailing-backslash-after-space case. Generate this capture script under the temporary root; do not add another repository file.
16. Static helper inspection rejects every `StringBuilder.Append` argument containing a repetition expression that lacks `-join ''`. It proves all three repeated-backslash append paths are guarded by a positive count: `$escapedSlashCount-gt 0`, `$slashes-gt 0`, and `$trailingSlashCount-gt 0`. It also proves no helper line contains an unjoined `Append(('\' * ...))` form. The round-trip test alone is not sufficient if source inspection finds implicit array-to-string coercion.

The fake gateway may expose test-only `--delay-ms` and `--redirect-location` arguments for the lifecycle/redirect cases. If present, constrain delay to `0..2000`, allow redirect locations only as local paths beginning with `/`, and never permit another host.

## 9. TDD RED/GREEN execution

Use red-green-refactor in these sequential tasks. Do not write the complete inspector before proving RED. The outer verification process resolves the trusted interpreter once. The harness requires public `-PythonExe` through mandatory `[Parameter(Mandatory=$true)][Alias('PythonExe')][ValidateNotNullOrEmpty()][string]$SuppliedPythonExe`, performs the exact pre-assignment checks, assigns `$script:PythonExe` once, validates that same executable through the helper, and uses the unchanged canonical path with `-I -S` for its AST syntax check, server-contract tests, and every server launch. The harness must contain no Python discovery or fallback logic and no parameter variable named `$PythonExe`.

For every positive G3-1 through G3-5 case, the harness must copy the approved Gate 2 preservation fixture, schema, and an appropriate routing fixture into its GUID temporary root; adjust only the temporary copies; set only fake process-secret values; invoke the approved Gate 2 builder; require exit 0 and `SUCCESS POST-WRITE VERIFICATION`; then invoke the Gate 3 inspector on the generated settings. For precedence and alias cases, place `ANTHROPIC_MODEL` and alias pins in the temporary pre-build settings as unknown env keys and prove Gate 2 preserves them. Never patch the post-build settings by hand.

### Task 1 - Fake gateway contract and lifecycle [M]

**Files:** Create `gateway-models-response.json`, `fake-anthropic-gateway.py`, and the initial `test-provider-model.ps1`.

**RED:** Add G3-1, the Section 8 path-with-spaces fake-server case, the exact argument serializer round-trip cases, the unjoined-repetition static rejection, the three positive-count guard assertions, and lifecycle assertions that invoke the not-yet-existing inspector. The spaced-path, serializer, and helper-source checks must pass before the missing-inspector assertion is accepted as the intended RED. Run:

First run the exact Stage A interpreter-resolution block in Section 10.1 in the current PowerShell process. Then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe $env:GATE3_PYTHON_EXE
```

Expected: nonzero after successful mandatory public `-PythonExe` binding to `$SuppliedPythonExe`, successful pre-assignment absolute/existing/non-reparse checks, exactly one `$script:PythonExe` assignment, and successful helper-based child identity/stdlib/no-site validation; G3-1 fails specifically because `inspect-provider-model.ps1` is absent. A missing or invalid `-PythonExe`, a failure before the one assignment, or a child-validation failure is not acceptable RED evidence. The fake server's normal-path and path-with-spaces checks, every exact serializer round-trip case, the explicit `-join ''` checks, and all three positive-count guards must already pass. Record the exact pass/fail summary, initialization/child-validation result, spaced-path result, serializer result, and helper-source result in the report.

**GREEN:** Create the smallest inspector skeleton that validates paths/loopback URL, performs one bounded GET when discovery is effective, validates the fixed response, and writes the result contract. Run the same command with the same `$env:GATE3_PYTHON_EXE`; do not resolve Python again.

Expected: G3-1 and its lifecycle checks pass; later Gate 3 groups may still fail.

### Task 2 - Discovery policy [M]

**Files:** Modify only the three scripts created in this gate.

**RED:** Add all G3-2 cases, including discovery absent and nonessential values `1`, `0`, and `false`. Assert request-log line counts before and after each inspector invocation.

Expected: nonzero with focused G3-2 failures before traffic-presence logic is complete.

**GREEN:** Implement the minimal discovery requested/effective/warning state machine. Re-run until G3-1 and G3-2 pass.

### Task 3 - Model precedence and opaque IDs [M]

**Files:** Modify only `inspect-provider-model.ps1` and `test-provider-model.ps1`.

**RED:** Add G3-3 and G3-4 cases with distinct slash-containing IDs and the three precedence states.

Expected: nonzero with focused selection/identity failures.

**GREEN:** Implement exact, non-normalizing selection output and the precise notice/source strings. Re-run until G3-1 through G3-4 pass.

### Task 4 - Alias pin presentation [S]

**Files:** Modify only `inspect-provider-model.ps1` and `test-provider-model.ps1`.

**RED:** Add G3-5 with unsorted pins and negative provider-list assertions.

Expected: nonzero with focused alias-pin failures.

**GREEN:** Add the fixed four-key alias extraction and ordinal sorting without adding any provider collection. Re-run until all five Gate 3 checkboxes pass.

### Task 5 - Negative safety matrix and evidence [M]

**Files:** Modify only the three scripts created in this gate and create the Gate 3 report.

Add the Section 8 negative cases one group at a time, observe focused RED where implementation is missing, make the smallest GREEN change, and rerun the complete Gate 3 harness after each group. Do not weaken assertions to obtain GREEN.

No task includes a commit step because commits are forbidden by this handoff.

## 10. Staged verification and exact commands

Run from repository root in one clean Windows PowerShell 5.1 process. Capture exit codes and concise summaries, not sensitive output. Verification is deliberately staged: Stage A verifies implementation, harness, cleanup, parsers, and regressions before the report exists; Stage B creates the report from that evidence; Stage C runs final report-inclusive ASCII, safety, scope, and evidence checks. Overall `PASS` is forbidden until Stage C passes.

### 10.1 Stage A setup: resolve and isolate one Python interpreter

Run this block once in the verification process:

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
foreach($candidate in @("python.exe","python3.exe","python","python3")){
    $command=Get-Command $candidate -ErrorAction SilentlyContinue|Select-Object -First 1
    if($command){
        $resolved=$command.Source
        Invoke-Gate3OuterPython -Executable $resolved -Arguments $probeArguments *> $null
        if($LASTEXITCODE -eq 0){$PythonExe=[IO.Path]::GetFullPath($resolved);break}
    }
}
if(-not $PythonExe){throw "No isolated standard-library Python interpreter available"}
$env:GATE3_PYTHON_EXE=$PythonExe
$versionArguments=@('-I','-S','-c',"import sys; print('GATE3_PYTHON_VERSION='+sys.version.split()[0])")
Invoke-Gate3OuterPython -Executable $PythonExe -Arguments $versionArguments
if($LASTEXITCODE -ne 0){exit 1}
```

Expected: one line beginning exactly `GATE3_PYTHON_VERSION=` followed by the resolved interpreter's version, and exit 0. This outer block is the only Python discovery step in Gate 3. Do not print `sys.path` or environment values. All subsequent Stage A Python use must reference `$env:GATE3_PYTHON_EXE`; the harness and later commands must not call `Get-Command`, try executable aliases, or resolve another interpreter.

### 10.2 Stage A implementation harness

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe $env:GATE3_PYTHON_EXE
if($LASTEXITCODE -ne 0){exit 1}
```

Expected: exit 0 after the harness binds public `-PythonExe` to `$SuppliedPythonExe`, checks absolute/existing/non-reparse leaf status, assigns `$script:PythonExe` exactly once, then uses `Invoke-Gate3Python` with `-I -S` to prove child identity, standard-library imports, isolated mode, no-site, no-user-site, ignored environment, and absent `site` module before any fixture root or server exists. The five exact criterion lines from Section 7 then print in order with `PASS`; the harness prints exactly `SAFETY PASS - 0 failed` and `OVERALL PASS - Gate 3 provider/model evidence`; every criterion records at least one Gate 2 builder success before inspection; standalone boundary cases are identified separately; no child gateway process or GUID fixture directory remains. Harness output must contain no Python discovery attempt, fallback selection, retry, or reassignment.

### 10.3 Stage A existing regressions

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1
if($LASTEXITCODE -ne 0){exit 1}
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1
if($LASTEXITCODE -ne 0){exit 1}
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1
if($LASTEXITCODE -ne 0){exit 1}
```

Expected: all exit 0. Gate 2 should report `Summary: 43 passed, 0 failed` unless the authoritative harness has a legitimately different higher count. Record every observed total exactly; stop on any failure.

### 10.4 Stage A parser and Python isolation checks

```powershell
powershell.exe -NoProfile -Command '$files=@(".\app\engine\claude-code\inspect-provider-model.ps1",".\app\engine\claude-code\test-provider-model.ps1");foreach($file in $files){$tokens=$null;$errors=$null;[void][Management.Automation.Language.Parser]::ParseFile((Resolve-Path $file),[ref]$tokens,[ref]$errors);if($errors.Count){$errors|ForEach-Object Message;exit 1}};"GATE3_POWERSHELL_PARSE_OK"'
if($LASTEXITCODE -ne 0){exit 1}
$parseArguments=@('-I','-S','-c',"import ast,pathlib; p=pathlib.Path(r'app/engine/claude-code/gate3-fixtures/fake-anthropic-gateway.py'); ast.parse(p.read_text(encoding='utf-8')); print('GATE3_PYTHON_PARSE_OK')")
Invoke-Gate3OuterPython -Executable $env:GATE3_PYTHON_EXE -Arguments $parseArguments
if($LASTEXITCODE -ne 0){exit 1}
```

Expected: `GATE3_POWERSHELL_PARSE_OK` and `GATE3_PYTHON_PARSE_OK`. The Python parse command uses the same outer-resolved `$env:GATE3_PYTHON_EXE`, the same logical string-array contract, and direct array splatting; it does not discover Python or use `Start-Process`. Do not use `py_compile`; it may create repository artifacts. The harness must separately assert that hostile temporary `PYTHONPATH`, `PYTHONHOME`, proxy, and user-site settings do not affect the supplied executable's `-I -S` child and are restored after the test. Static initialization-order checks must also confirm the public parameter binds to `$SuppliedPythonExe`, the one `$script:PythonExe=$canonicalPython` assignment follows all pre-assignment checks, and the first helper call follows that assignment.

### 10.5 Stage B: create the report

Only after every Stage A command passes, create `planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md` from the captured redacted evidence. Do not rerun or reinterpret a failed command as passing. The report is the fifth authorized worker-created file.

Stage B creates a provisional complete report containing Stage A evidence and a clearly labeled `Final verification pending` entry for Stage C. Run all Stage C commands once. If they pass, replace only that pending entry with the exact Stage C command results and exit codes, then rerun every Stage C command against the final report. Only the second complete Stage C pass is authoritative. If the first or second pass fails, report `FAIL` or `BLOCKED`; do not leave `Status` as `PASS`.

### 10.6 Stage C exact fixture and ASCII check

Run this exact report-inclusive command:

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
```

Expected: exit 0 and `GATE3_FIXTURE_ASCII_OK`. This command reads only the five literal authorized paths. It performs no directory enumeration and no access to any commented-JSON or real Claude path.

### 10.7 Stage C exact prohibited-pattern safety check

Run this exact report-inclusive command. Sensitive pattern names are assembled from fragments so the evidence report does not contain a contiguous forbidden header or state filename merely by recording the command.

```powershell
$Gate3Paths=@(
  "app/engine/claude-code/inspect-provider-model.ps1",
  "app/engine/claude-code/test-provider-model.ps1",
  "app/engine/claude-code/gate3-fixtures/gateway-models-response.json",
  "app/engine/claude-code/gate3-fixtures/fake-anthropic-gateway.py",
  "planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md"
)
$authHeader="Author"+"ization"
$apiHeader="X-Api"+"-Key"
$stateLeaf="."+"claude"+".json"
$commentSuffix="."+"json"+"c"
$patterns=@(
  '[A-Za-z]:\\Users\\[^\\]+\\\.claude(?:\\|$)',
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
foreach($path in $Gate3Paths){
  if(!(Test-Path -LiteralPath $path -PathType Leaf)){throw "authorized file missing"}
  $text=[IO.File]::ReadAllText((Resolve-Path -LiteralPath $path))
  foreach($pattern in $patterns){if($text-match $pattern){throw "prohibited pattern in authorized file"}}
}
"GATE3_STATIC_SAFETY_OK"
```

Expected: exit 0 and `GATE3_STATIC_SAFETY_OK`. The implementation may contain `/v1/models`, `127.0.0.1`, `::1`, and `FAKE_GATE3_SECRET_DO_NOT_USE`. The command does not list or access any path outside the five literals.

### 10.8 Stage C report evidence check

Run this exact command:

```powershell
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
```

Expected: exit 0 and `GATE3_REPORT_EVIDENCE_OK`.

### 10.9 Stage C authorized-path diff and scope checks

Scope pass/fail checks to the five authorized paths:

```powershell
$Gate3Paths=@(
  "app/engine/claude-code/inspect-provider-model.ps1",
  "app/engine/claude-code/test-provider-model.ps1",
  "app/engine/claude-code/gate3-fixtures/gateway-models-response.json",
  "app/engine/claude-code/gate3-fixtures/fake-anthropic-gateway.py",
  "planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md"
)
git diff --check -- $Gate3Paths
if($LASTEXITCODE -ne 0){exit 1}
$scoped=@(git status --short -- $Gate3Paths)
if($scoped.Count-ne 5){throw "authorized scoped status count mismatch"}
foreach($line in $scoped){if($line-notmatch '^\?\? '){throw "authorized path is not a newly created untracked file"}}
$reported=@($scoped|ForEach-Object{$_.Substring(3).Replace('\\','/') }|Sort-Object)
$expected=@($Gate3Paths|Sort-Object)
if((Compare-Object $expected $reported)){throw "authorized scoped path mismatch"}
foreach($path in $Gate3Paths){$lines=[IO.File]::ReadAllLines((Resolve-Path -LiteralPath $path));for($i=0;$i-lt $lines.Count;$i++){if($lines[$i]-match '[ \t]+$'){throw "trailing whitespace in authorized file"}}}
"GATE3_SCOPE_OK"
```

Expected: exit 0 and `GATE3_SCOPE_OK`. Then report whole-worktree status separately, for context only:

```powershell
git status --short --branch
```

Unrelated pre-existing changes in whole status do not fail Gate 3. Do not run a repository-wide diff check, clean, reset, or require the whole worktree to be otherwise clean.

## 11. Acceptance evidence

The report must include evidence sufficient for Sol to verify each checkbox without trusting a narrative summary alone:

- the five exact executable criterion result lines from Section 7, each exactly once;
- `SAFETY PASS - 0 failed` and `OVERALL PASS - Gate 3 provider/model evidence` only when their full requirements passed;
- for each criterion, at least one named pipeline-backed case with Gate 2 exit 0 and `SUCCESS POST-WRITE VERIFICATION`, plus separately labeled standalone boundary cases;
- the exact Gate 3 checkbox label and PASS/FAIL result;
- the exact harness test names contributing to that checkbox;
- request-log counts proving opt-in and blocked cases did or did not send traffic;
- the loopback bind address and ephemeral-port policy, but not a machine-specific port;
- the exact fake response fixture SHA-256;
- exact expected and observed model IDs for opaque pass-through assertions;
- exact selection source/notice results for precedence cases;
- display-name exact-copy and all fallback/non-string case results;
- exact alias-pin result and the negative provider-property assertions;
- timeout duration and observed bounded failure class, without unstable timing promises;
- child PID cleanup and released-port evidence stated without retaining PIDs;
- every verification command, exit code, and exact pass/fail count;
- the one outer-resolved Python version and the exact initialization-order evidence: public `-PythonExe` bound to `$SuppliedPythonExe`; absolute/existing/non-reparse checks passed; `$script:PythonExe` was assigned exactly once before helper use; child identity plus stdlib/isolated/no-site/no-user-site/ignore-environment/absent-site checks passed; no fixture root or server existed before validation; no retry, reassignment, harness-side discovery, or fallback occurred. Do not record the machine-specific absolute interpreter path;
- confirmation that every Python call used logical string-array arguments beginning `-I`, `-S`, direct calls used array splatting, process calls used `Join-WindowsCommandLineArguments`, and no raw array or ad hoc string reached `Start-Process -ArgumentList`;
- path-with-spaces fake-server PASS evidence and serializer round-trip PASS evidence for the exact nine logical arguments in Section 8, including zero-backslash, one-backslash, quote-only, backslash-before-quote, and trailing-backslash cases;
- static helper PASS evidence that every repeated-backslash `Append` expression uses explicit `-join ''`, all three repetition paths have `-gt 0` guards, zero counts append nothing, and no array-to-string coercion remains;
- final authorized-file inventory and count.

Do not paste complete settings, environment blocks, process output containing fake secrets, request headers, or response bodies into the report.

## 12. Rollback and recovery

Implementation rollback is deletion of only the five files created by this Gate 3 worker, including the two files under `app/engine/claude-code/gate3-fixtures/`. After explicit permission and only when that sibling directory is empty, rollback may remove the now-empty `gate3-fixtures` directory; it must never delete, move, enumerate for cleanup, or alter the Gate 2-owned direct `app/engine/claude-code/fixtures/` directory. Deletion is destructive and requires explicit user permission before it is performed. Do not perform rollback automatically.

Test cleanup is pre-authorized only for resources created by the current harness invocation:

- stop or terminate only the exact fake-gateway child PID created by the harness;
- delete only the current GUID temporary fixture directory and its contents;
- delete only the inspector's own incomplete result temporary file;
- never kill by process name, wildcard, or port;
- never delete repository files, unrelated temporary directories, or pre-existing evidence.

If cleanup cannot prove ownership of a process or path, leave it in place, report the exact concern without sensitive data, and stop.

## 13. Gate 3 report contract

Create `planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md` only after verification. It must contain these headings:

1. `Status`
2. `Scope statement`
3. `Gate matrix`
4. `Changed files`
5. `TDD RED evidence`
6. `GREEN tests run`
7. `Fake gateway contract evidence`
8. `Discovery traffic evidence`
9. `Model identity and precedence evidence`
10. `Alias pinning evidence`
11. `Safety and cleanup evidence`
12. `Regression evidence`
13. `Failures`
14. `Risks/concerns`
15. `Remaining work`
16. `Git state`

The report must state:

- exactly five created files and zero modified files for worker scope;
- the exact five paths from Section 3;
- no Claude executable behavior was tested;
- no runtime compatibility is claimed;
- no app integration or live configuration test occurred;
- Gates 4 and 5 remain unauthorized and unperformed;
- `Fixture Validated` cites the approved Gate 2 report and does not mean `Supported`;
- the worker does not assign `Compatibility Evaluated`; Sol decides any lifecycle status after evidence review;
- the exact sentence `canonical-versus-packaged placement remains unresolved`; Gate 3 makes no placement, derivation, synchronization, or release-packaging decision;
- one trusted Python interpreter was resolved only by the outer verifier; public `-PythonExe` bound to `$SuppliedPythonExe`; the harness checked an absolute existing non-reparse leaf, assigned `$script:PythonExe` exactly once, then used the helper with `-I -S` to validate child identity and stdlib/no-site isolation before any fixture/server/test; no retry, reassignment, harness-side discovery, or fallback occurred;
- the PowerShell 5.1 serializer round-trip and fake-server path-with-spaces tests passed; every repeated-backslash append explicitly joined to one string with positive-count guards and safe zero-count behavior; every `Start-Process` Python launch used the single serialized-string contract;
- no compatibility draft was created;
- no commit was created.

If any Gate 3 checkbox, safety/lifecycle test, required regression, parser check, cleanup check, first or final Stage C ASCII/safety/scope/evidence check, or report-contract check fails, report `FAIL` or `BLOCKED`, not `PASS`.

## 14. Stop conditions

Stop immediately and return a blocked report or worker message if any of these occurs:

1. The approved Gate 2 report is missing, contradicted, or cannot be cited.
2. Any required behavior appears to require Claude executable invocation, real Claude state, authentication, a live session, an external provider, DNS, or internet access.
3. A test attempts a non-loopback connection or follows a redirect.
4. The fake server binds a wildcard, hostname, external interface, or fixed shared port.
5. A real or credential-shaped secret appears in source, output, evidence, or environment handling.
6. The implementation would require modifying an existing file or creating more than the five authorized files.
7. Gate 4 app integration, shared status documentation, release work, installation, or Gate 5 live validation appears necessary.
8. An official noninteractive Claude capability is proposed without a new explicit authorization.
9. A required existing regression fails.
10. Cleanup cannot identify the exact child PID or temporary root it owns.
11. The harness discovers Python, searches PATH, accepts an omitted `-PythonExe`, declares a parameter variable named `$PythonExe`, invokes the helper before assigning `$script:PythonExe`, assigns `$script:PythonExe` before absolute/existing/non-reparse checks, assigns it more than once, retries or reassigns after child-validation failure, creates a fixture root/server/test before child validation passes, or invokes any Python executable without `-I -S`.
12. Any Python `Start-Process` launch bypasses `Invoke-Gate3Python`, passes a raw string array to `-ArgumentList`, pre-quotes individual paths, fails the path-with-spaces or serializer round-trip test, passes an unjoined repetition result to `StringBuilder.Append`, or evaluates/appends a repeated-backslash expression when its count is zero.
13. Source documentation and implementation disagree about a behavior that changes acceptance.
14. Any worker is asked to broaden scope, commit, or claim support.

Do not work around a stop condition. Return the evidence to Sol for a new handoff.

## 15. Worker return format

Return to Sol:

- `Status`: PASS, FAIL, or BLOCKED.
- `Paths`: the exact five created paths and confirmation that zero existing files were modified.
- `Checks`: each of the five Gate 3 checkbox labels with PASS/FAIL, plus exact test/regression counts and exit codes.
- `Concerns`: failures, cleanup issues, unproven behavior, and remaining risks.
- `Claims`: explicit confirmation that only adapter semantics and the fake gateway contract were tested, with no Claude runtime compatibility, Gate 4 integration, Gate 5 validation, support claim, or commit.

Do not begin Gate 4. Gate 3 completion requires Sol review of the report and separate human authorization for any later gate.
