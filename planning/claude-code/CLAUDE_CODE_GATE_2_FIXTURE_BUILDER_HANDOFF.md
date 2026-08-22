# Claude Code Gate 2 Fixture Builder Handoff

> **For the assigned worker:** Use `superpowers:test-driven-development` before implementation and use `superpowers:verification-before-completion` before reporting. This handoff authorizes Gate 2 fixture work only.

**Assigned worker:** DeepSeek V4 Flash Max

**Effort:** Max

**Goal:** Build and test a PowerShell 5.1-compatible, fixture-only Claude Code settings patcher that proves the five Gate 2 criteria without reading or writing any real Claude-owned file.

**Outcome:** A repository-contained builder, schema, fixtures, and isolated test harness demonstrate semantic preservation, safe auth/routing patches, strict validation, backup-first atomic replacement, post-write verification, and automatic recovery. Passing Gate 2 does not authorize app integration or a live Claude test.

## 1. Authority and current repository state

Read these documents before editing, in this order:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md`
5. `README.md`
6. `PROJECT_STATE.md`
7. `ADAPTER.md`
8. `ARCHITECTURE.md`
9. `BUILDER_SPEC.md`
10. `DESIGN_PRINCIPLES.md`
11. `FOLDER_STRUCTURE.md`
12. `JSON_SCHEMAS.md`
13. `CONTRIBUTING_FOR_AI.md`

The last observed repository state was branch `main`, tracking `origin/main`, with unrelated dirty changes:

```text
 M app/BUGFIXES.md
 M app/assets/css/onboarding.css
 M app/assets/js/pages/onboarding.js
 M app/tests/frontend_review.test.mjs
?? planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md
?? planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_HANDOFF.md
?? planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md
?? planning/SOL_ORCHESTRATION_POLICY.md
```

Re-run read-only `git branch --show-current` and `git status --short --branch` before work. Preserve every unrelated dirty or untracked path. Do not stage, discard, clean, move, overwrite, or include any unrelated change. Do not commit; the user did not request a commit.

Repository-native conventions mapped during planning:

- The self-contained distributable engine is `app/engine/`.
- Agent-specific builder/test pairs use a dedicated subdirectory when their contract differs, as in `app/engine/kilo/`.
- PowerShell harnesses create GUID roots below `$env:TEMP`, invoke `powershell.exe -NoProfile -ExecutionPolicy Bypass -File`, collect exit code/output, use `Run-Test`, clean in `finally`, print a pass/fail summary, and exit nonzero on failure.
- Live schemas are in `app/engine/schemas/` and are written for the PowerShell 5.1-supported subset.
- Existing duplicate-key checks inspect raw JSON before `ConvertFrom-Json` because PowerShell otherwise collapses duplicate keys.
- Existing builders back up before writes, but their direct `WriteAllText` pattern is not sufficient for this task. The Claude fixture builder must use same-directory temporary output plus atomic replacement and recovery.

The existing project docs still describe Claude Code as unsupported/dropped. That is not permission to update those docs in Gate 2. The human-approved research plan and this handoff authorize only a fixture proof. Stop rather than changing status or integration documentation.

## 2. Exact file scope

Create only these nine files: two PowerShell scripts, five fixture JSON files, one schema JSON file, and one Markdown evidence report.

1. `app/engine/claude-code/build-claude-code.ps1`
   - Fixture-only routing profile validator and settings patcher.
2. `app/engine/claude-code/test-claude-code.ps1`
   - Standalone PowerShell 5.1 test harness; all writes occur under a GUID directory below `$env:TEMP`.
3. `app/engine/claude-code/fixtures/settings-preservation.json`
   - Valid target settings fixture containing unknown root settings, unknown `env` entries, enabled plugins, marketplace data, MCP-like data, nested arrays/objects/null/booleans/numbers, and fake secret markers.
4. `app/engine/claude-code/fixtures/routing-api-key.json`
   - Valid user-scope API-key routing profile using only a fake environment-variable reference.
5. `app/engine/claude-code/fixtures/routing-auth-token.json`
   - Valid user-scope bearer-token routing profile using only a fake environment-variable reference.
6. `app/engine/claude-code/fixtures/settings-malformed.json`
   - Deliberately malformed target JSON.
7. `app/engine/claude-code/fixtures/settings-duplicate-key.json`
   - Syntactically plausible JSON with an exact duplicate key in one object.
8. `app/engine/schemas/claude-code-routing.schema.json`
   - Adapter-owned routing source schema.
9. `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md`
   - Sole documentation output for the worker's exact Gate 2 evidence and report contract in Section 12.

Do not modify an existing file in Gate 2. In particular, do not update the app, scaffold registry, shared builder, existing OpenCode/Kilo builders or harnesses, README files, release files, project state, session logs, or generated artifacts. The report above is the only authorized documentation output. If implementation or reporting cannot remain inside the nine files above, stop and request a new Sol handoff.

Fixture JSON may use marker strings such as `FAKE_GATE2_API_KEY_DO_NOT_USE`, `FAKE_GATE2_BEARER_TOKEN_DO_NOT_USE`, and `FAKE_EXISTING_SECRET_MARKER`. Never use a real-looking key prefix or any value copied from a machine configuration.

## 3. Hard scope boundary

The following are forbidden:

- No read, metadata probe, hash, parse, copy, write, or enumeration of the real user-profile Claude directory, any real Claude `settings.json`, or any path resolved from a real Claude installation.
- No access to the real user-profile Claude state JSON or any file with that Claude state filename.
- No commented-JSON read, write, generation, or fixture. A rejection test may construct a forbidden suffix from separate string components, but it must not create or access that path.
- No `CLAUDE.md`, plugins, marketplaces, MCP databases, skills, agents, hooks, permissions, memory, transcripts, snapshots, logs, OAuth/session data, or credentials outside static fake fixtures.
- No app/API/UI/discovery/scaffold integration (Gate 4).
- No network request, gateway process, `/v1/models` probe, or provider/model behavior test (Gate 3).
- No live Claude invocation or live settings test (Gate 5).
- No app test or code path that points the fixture builder at a registered agent.
- No secret value in command output, exception text, assertion failure, report, source comments, or persisted test artifact.
- No commit.

The builder must be structurally unable to target arbitrary or real files in this gate. It must require `-FixtureRoot`, canonicalize all paths, require `FixtureRoot` to be below `[System.IO.Path]::GetTempPath()`, require routing/profile/schema/target paths to remain descendants of that root, reject reparse-point escape, reject the Claude state filename, reject every commented-JSON suffix, and require the target file to pre-exist. Tests copy repository fixtures into the temporary root before invocation. Repository fixture files are never patched in place.

Neither the builder nor harness may embed a literal absolute user-profile Claude path. The harness must construct an out-of-root candidate only from runtime components, for example `[Environment]::GetFolderPath('UserProfile')` plus a separately constructed `'.' + 'claude'` leaf, pass it only to a path-boundary rejection case, and assert rejection occurs before `Test-Path`, `Get-Item`, `Resolve-Path`, file open, enumeration, or hashing. Likewise, construct forbidden filenames/suffixes from components such as `'.' + 'claude' + '.json'` and `'.' + 'jsonc'`; do not include either contiguous forbidden token in production or harness source.

## 4. Builder command interface

`build-claude-code.ps1` must expose this fixture-only interface:

```powershell
param(
    [Parameter(Mandatory = $true)][string]$FixtureRoot,
    [Parameter(Mandatory = $true)][string]$RoutingProfilePath,
    [Parameter(Mandatory = $true)][string]$SettingsPath,
    [string]$SchemaPath = "",
    [ValidateSet("None", "AfterBackup", "AfterTempWrite", "AfterReplace")]
    [string]$TestFailureStage = "None"
)
```

Rules:

- An empty `SchemaPath` resolves to `<FixtureRoot>\schemas\claude-code-routing.schema.json`.
- `TestFailureStage` is an explicit fixture fault-injection seam, not a production feature. It must be accepted only because every target is already constrained below the temporary fixture root.
- Exit `0` only after validation, backup, replacement, re-parse, semantic verification, and cleanup succeed.
- Exit nonzero with a stage name and redacted reason on any failure.
- Output may name stages and fixture-relative file names, but must never print an `env` value, resolved secret, full routing object, full settings object, exception input excerpt, or process environment value.

### 4.1 Routing profile contract

The schema and builder consume this shape:

```json
{
  "target": "claude-code",
  "scope": "user",
  "endpoint": {
    "baseUrl": "http://127.0.0.1:20128/v1",
    "auth": {
      "apiKeySecretRef": "BDF_CLAUDE_GATE2_API_KEY"
    }
  },
  "model": {
    "value": "gateway/native-model-id",
    "source": "settings"
  },
  "envPolicy": {
    "gatewayDiscovery": true,
    "disableExperimentalBetas": true,
    "autoCompactWindow": 190000,
    "disableNonessentialTraffic": false
  }
}
```

Auth-token profiles replace `apiKeySecretRef` with `authTokenSecretRef`. Exactly one of those two properties must be present and non-empty. Both or neither are errors. The reference is an environment-variable name matching `^[A-Za-z_][A-Za-z0-9_]*$`; the resolved value must be non-empty. The builder never persists the reference itself into Claude settings.

Validation not expressible in the repository's compact schema subset must be implemented explicitly in PowerShell. The schema remains useful for root/object/type/required/property validation, while code enforces exact-one auth, integer/range, URL, model, and path rules.

### 4.2 Supported patch surface

Patch only:

- Root `model` from `model.value` when `model.source` is exactly `settings`.
- `env.ANTHROPIC_BASE_URL`.
- Exactly one of `env.ANTHROPIC_API_KEY` or `env.ANTHROPIC_AUTH_TOKEN`; remove the opposite managed auth key.
- `env.CLAUDE_CODE_AUTO_COMPACT_WINDOW` as the invariant decimal string form of an integer from `100000` through `1000000`, inclusive.
- `env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`: property present with string value `1` when true; property absent when false.
- `env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`: property present with string value `1` when true; property absent when false.
- `env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`: property present with string value `1` when true; property absent when false. Never write `0`, `false`, or an empty string to represent off.

The builder does not manage `ANTHROPIC_MODEL` in Gate 2. It does not discover models or interpret gateway-native model IDs. A valid non-empty model string, including slashes, must pass through unchanged.

### 4.3 Input validation

Reject before backup or target mutation:

- Malformed routing or settings JSON.
- Any exact duplicate key at any object depth in either JSON input. Scan raw text before `ConvertFrom-Json`.
- `target` other than `claude-code`.
- `scope` other than exactly `user`.
- Auth with both/neither strategies, invalid reference syntax, or missing referenced fake environment value.
- Base URL that is not an absolute `http` or `https` URI, has no host, contains userinfo, or contains query/fragment data. Loopback HTTP is valid for fixtures. No URL is contacted.
- Missing, non-string, or whitespace-only model. Do not reject a valid opaque gateway-native model ID merely because it is unfamiliar.
- `model.source` other than `settings`.
- `autoCompactWindow` that is a string, decimal, non-integer numeric type, or outside `100000..1000000` inclusive.
- Any path-boundary violation described in Section 3.

Unsupported settings values are not schema-validated as Claude semantics. They are pass-through data and must retain at least their parsed semantic value.

## 5. Preservation and write transaction

Formatting preservation is not an acceptance criterion. Do not promise byte-for-byte whitespace, indentation, property order, newline, or encoding preservation because the existing PowerShell architecture parses and serializes JSON. Semantic preservation is mandatory.

Before mutation, capture a deep semantic snapshot of:

1. Every root property except managed root `model` and `env`.
2. Every property below root `env` except the seven managed env keys listed in Section 4.2.

Use a deterministic recursive comparison that distinguishes null, boolean, number, string, array order, object property names, and nested values. Do not compare by a shallow `ConvertTo-Json` string alone. After the write, re-parse and prove those unsupported snapshots are semantically equal. Preserve unknown property names and values; do not whitelist only the fixture examples.

Required transaction order:

1. Canonicalize and enforce fixture path boundaries.
2. Read raw profile and target text without logging values.
3. Reject duplicate keys.
4. Parse both JSON documents.
5. Validate routing profile, URL, model, auth, env policy, and target root shape.
6. Capture unsupported semantic snapshots.
7. Resolve the selected fake secret from the named process environment variable without printing it.
8. Construct the patched object in memory and verify supported/unsupported invariants before disk I/O.
9. Create a uniquely named, timestamped backup in the target settings directory before any target write. Backup content must equal the original target bytes.
10. If fault stage is `AfterBackup`, throw a redacted synthetic failure and run recovery verification.
11. Serialize UTF-8 without BOM to a unique temporary file in the target settings directory.
12. Flush and close the temporary file, re-open it, reject duplicate keys, parse it, and verify the complete semantic contract before replacement.
13. If fault stage is `AfterTempWrite`, throw and recover; the original target must remain unchanged.
14. Atomically replace the existing target with `[System.IO.File]::Replace` or an equivalent Windows atomic replace primitive. A direct final-path `WriteAllText`, `Set-Content`, or remove-then-move sequence is forbidden.
15. If fault stage is `AfterReplace`, throw and restore the backup through a same-directory temporary file plus atomic replacement.
16. Re-open the final target, parse it, and re-verify supported values, unsupported semantic values, selected/opposite auth state, and policy presence/absence.
17. Delete only the transaction's own temporary file after success or handled failure. Retain the backup as recovery evidence.

On any failure after the backup exists:

- If the target might have changed, restore the backup using the same safe temp-plus-replace pattern.
- Parse and semantically compare the restored target to the backup/original before returning failure.
- If restoration or restoration verification fails, emit a redacted `RECOVERY FAILED` message and leave the backup and any useful transaction temp artifact in place. Never claim recovery.
- Do not delete a pre-existing target or backup.

## 6. TDD execution plan

Keep changes small and follow red-green-refactor. Do not write the full builder before tests.

### Task 1 - Harness safety and fixture contract [M]

**Files:** Create all five JSON files under `app/engine/claude-code/fixtures/`, create `app/engine/claude-code/test-claude-code.ps1`, and create `app/engine/schemas/claude-code-routing.schema.json`. Together with the builder created in Task 2, these are exactly eight implementation/test artifacts. Task 5 adds the one authorized evidence report, making the total authorized scope exactly nine files.

1. Add harness helpers matching repository style: `New-TestRoot`, `Remove-TestRoot`, `Write-JsonFile`, `Assert-True`, `Run-Test`, and an `Invoke-Builder` that always supplies all fixture paths and never uses stdin.
2. Add safety tests proving a non-temp `FixtureRoot`, escaped path, forbidden commented-JSON suffix, forbidden Claude state filename, and missing target are rejected. Build the out-of-root path and forbidden names from runtime/string components as specified in Section 3; do not embed a literal real target path or either contiguous forbidden filename token in builder/harness source. Assert rejection occurs before any filesystem probe of the rejected candidate.
3. Add a fixture-shape test proving the preservation fixture contains unknown settings, enabled plugins, marketplace data, MCP-like data, nested semantic types, and fake secret markers.
4. Add a static scan of builder, harness, schema, and all five fixtures that fails on non-ASCII bytes, literal absolute user-profile Claude paths, contiguous forbidden filename/suffix tokens, or suspicious real-key patterns. Scan captured builder/harness evidence with the same prohibited-pattern set. No source exemption is permitted; rejection tests must use component construction.
5. Run the harness. Expected red evidence: nonzero exit because `build-claude-code.ps1` does not exist or required behavior is absent. Record the failing test names, not fixture values.

### Task 2 - Validation and no-write failures [M]

**Files:** Create `app/engine/claude-code/build-claude-code.ps1`; extend the harness.

Add failing tests first for malformed JSON, duplicate keys, unsupported target/scope, both/neither auth, missing secret reference, invalid URL cases, invalid model cases, non-settings model source, and auto-compact type/bounds (`99999`, `100000`, `1000000`, `1000001`, decimal, and string). The duplicate fixture must contain the exact property token `"duplicateProbe"` twice in one object. The harness must count that raw lexical token and assert the count is exactly two before invoking the builder; it must never make this assertion conditional on `ConvertFrom-Json` failure. For every rejected input assert:

- Exit is nonzero.
- Output names the validation stage and contains no fake secret value.
- Target SHA-256 is unchanged.
- No backup or same-directory transaction temp file exists because validation failed before backup.

Implement the minimum validation to make those tests green. Re-run after each related test group.

### Task 3 - Semantic patching and both auth strategies [L]

**Files:** Extend the builder and harness; use both valid route fixtures.

Add failing tests first, then minimal implementation, for:

- API-key strategy writes API key, removes auth token, and never logs either fake marker.
- Auth-token strategy writes auth token, removes API key, and never logs either fake marker.
- Endpoint and opaque model are exact requested strings.
- Auto-compact lower/upper bounds and a middle integer become invariant decimal strings.
- Gateway discovery and beta disable each use presence=`1`/absence semantics.
- Nonessential traffic true means presence=`1`; false means property absence even if the input fixture contained `0`, `false`, empty, or another non-empty value.
- Every unsupported root and env value is semantically equal before and after, including plugin, marketplace, MCP-like, fake-secret-marker, array-order, number, boolean, null, and nested object values.
- A backup exists beside the temporary target and its bytes/hash equal the original target.
- The final target re-parses and the builder exits `0` only after verification.

Refactor only after all tests are green. Keep validation, semantic comparison, patch construction, write transaction, and recovery as separate functions.

### Task 4 - Atomic interruption and backup recovery [L]

**Files:** Extend the builder and harness.

Add failing tests first for each `TestFailureStage`:

- `AfterBackup`: nonzero exit, original target unchanged, valid backup retained, no stale temp.
- `AfterTempWrite`: nonzero exit, original target unchanged, valid backup retained, transaction temp cleaned after verified recovery.
- `AfterReplace`: nonzero exit, target restored to original bytes/semantics, backup retained, output reports recovery without secret values.

Also simulate a replacement failure without altering a real file, for example by a test-controlled file lock or the explicit failure stage. Assert the target is never missing and is always parseable after the harness regains control. Implement restore-through-temp plus atomic replacement and post-restore verification. A catch block that only copies over the target without verification is insufficient.

### Task 5 - Full Gate 2 regression and evidence report [M]

Run all commands in Section 8 and inspect output and filesystem evidence. Then create `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md` in the isolated worktree with exactly the Section 12 report contract. This report is the sole documentation output and must contain redacted evidence only. Re-run the ASCII, placeholder, prohibited-pattern, file-count, Gate-mapping, exclusion, diff, and scope checks against the final nine-file state. Confirm only the nine authorized files changed. Do not create any other report, log in the repository, or documentation file. Do not commit.

## 7. Acceptance criteria mapped one-to-one to Gate 2

Each criterion is independent. The worker reports PASS, FAIL, or BLOCKED for each; a PASS elsewhere cannot compensate.

### G2-1 - Required preservation fixture

Maps exactly to: "Add fixtures containing unknown settings, enabled plugins, marketplaces, MCP-like data, and fake secrets."

PASS only if:

- `settings-preservation.json` contains all five categories using fictional ASCII markers.
- Nested objects, arrays, null, boolean, number, and string values are represented.
- No real machine data or real secret-shaped value is present.
- Tests copy the fixture to a temporary root and never patch the repository copy.

### G2-2 - Patch supported route and preserve unsupported values

Maps exactly to: "Test patching endpoint/auth/model while every unsupported key remains unchanged."

PASS only if:

- Endpoint, selected auth value, and opaque model are patched as requested.
- Opposite managed auth is absent.
- Every unsupported root and env property remains semantically equal after re-parse.
- Backup precedes write; temp is in the target directory; replacement is atomic; final JSON is parsed and verified.
- No byte-for-byte formatting claim is made.

### G2-3 - Both auth strategies and ambiguity rejection

Maps exactly to: "Test both auth strategies and reject ambiguous simultaneous auth unless explicitly supported."

PASS only if:

- API-key and auth-token fixtures each pass independently.
- Both and neither auth references fail before backup/write.
- No output contains a resolved fake secret or existing fake secret marker.
- Gate 2 does not introduce an exception that permits simultaneous auth.

### G2-4 - Environment policy semantics

Maps exactly to: "Test auto-compact bounds, gateway discovery, beta disabling, and nonessential-traffic presence semantics."

PASS only if:

- Integer-only inclusive bounds `100000..1000000` are enforced.
- Gateway discovery and beta disabling use present=`1`, absent=off semantics.
- Nonessential traffic uses present=`1`, absent=off; `0` and `false` are never treated as off while present.
- Tests cover both presence and absence without probing a gateway or Claude runtime.

### G2-5 - Failure and recovery matrix

Maps exactly to: "Test malformed JSON, unsupported scope, invalid URL, invalid model, duplicate keys, interrupted replace, and backup recovery."

PASS only if each named condition has a distinct test and expected nonzero/success evidence as appropriate:

- Malformed JSON: rejected before backup/write.
- Unsupported scope: rejected before backup/write.
- Invalid URL: rejected before backup/write.
- Invalid model: rejected before backup/write while valid opaque IDs pass unchanged.
- Duplicate keys: the fixture's raw text independently proves exactly two `"duplicateProbe"` property tokens in one object, and the builder rejects the raw duplicate before `ConvertFrom-Json`, backup, or mutation.
- Interrupted replacement: injected after backup, after temp write, and after replace; target remains/restores valid.
- Backup recovery: original bytes/semantics restored and verified; backup retained; recovery failure is never hidden.

## 8. Exact verification commands and expected evidence

Run from the isolated worktree repository root with Windows PowerShell 5.1.

### 8.1 Gate 2 harness

```powershell
$evidenceLog = Join-Path ([IO.Path]::GetTempPath()) ('bdf-claude-gate2-evidence-' + [guid]::NewGuid().ToString('N') + '.log')
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1 2>&1 | Tee-Object -FilePath $evidenceLog
$harnessExit = $LASTEXITCODE
if ($harnessExit -ne 0) { throw "Gate 2 harness failed with exit code $harnessExit; redacted evidence: $evidenceLog" }
Write-Host "Gate 2 redacted evidence: $evidenceLog"
```

Expected evidence:

- Process exit code `0`.
- One redacted evidence log named `bdf-claude-gate2-evidence-<guid>.log` exists below the system temp root for the mandatory static scan in Section 8.6.
- Summary reports every test PASS and zero failed.
- Named tests visibly cover G2-1 through G2-5 and all required subcases.
- No fake secret marker value appears in captured builder output.
- Harness-created roots are below `$env:TEMP` and are removed in `finally`, except a deliberately retained diagnostic root only when a test fails and the output names it without sensitive content.

### 8.2 Existing engine regression

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1
```

Expected evidence for each:

- Exit code `0`.
- Final line reports all tests passed.
- No repository or real agent configuration is written by these isolated harnesses. If an existing harness attempts an external real path or fails for a pre-existing repository issue, stop, preserve the output, and report BLOCKED; do not broaden scope to fix it.

### 8.3 PowerShell syntax parse

```powershell
powershell.exe -NoProfile -Command "$e=$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '.\app\engine\claude-code\build-claude-code.ps1'),[ref]$null,[ref]$e); if($e.Count){$e | ForEach-Object Message; exit 1}"
powershell.exe -NoProfile -Command "$e=$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '.\app\engine\claude-code\test-claude-code.ps1'),[ref]$null,[ref]$e); if($e.Count){$e | ForEach-Object Message; exit 1}"
```

Expected evidence: both commands exit `0` with no parser error.

### 8.4 JSON fixture/schema parse, unconditional duplicate proof, and ASCII check

```powershell
powershell.exe -NoProfile -Command "$fixtureDir='.\app\engine\claude-code\fixtures'; $all=@(Get-ChildItem (Join-Path $fixtureDir '*.json') -File); if($all.Count -ne 5){ throw ('Expected exactly five fixture JSON files; found '+$all.Count) }; $valid=@('settings-preservation.json','routing-api-key.json','routing-auth-token.json'); foreach($name in $valid){ Get-Content (Join-Path $fixtureDir $name) -Raw | ConvertFrom-Json | Out-Null }; Get-Content '.\app\engine\schemas\claude-code-routing.schema.json' -Raw | ConvertFrom-Json | Out-Null; $malformed=Get-Content (Join-Path $fixtureDir 'settings-malformed.json') -Raw; try { $malformed | ConvertFrom-Json | Out-Null; throw 'Malformed fixture unexpectedly parsed' } catch { if($_.Exception.Message -eq 'Malformed fixture unexpectedly parsed'){ throw } }; $dupRaw=Get-Content (Join-Path $fixtureDir 'settings-duplicate-key.json') -Raw; $dupCount=[regex]::Matches($dupRaw,'(?m)^\s*\"duplicateProbe\"\s*:').Count; if($dupCount -ne 2){ throw ('Expected exactly two duplicateProbe properties; found '+$dupCount) }"
powershell.exe -NoProfile -Command "$paths=@('.\app\engine\claude-code\build-claude-code.ps1','.\app\engine\claude-code\test-claude-code.ps1','.\app\engine\schemas\claude-code-routing.schema.json') + @(Get-ChildItem '.\app\engine\claude-code\fixtures\*.json' | ForEach-Object FullName); foreach($p in $paths){ $b=[IO.File]::ReadAllBytes((Resolve-Path $p)); if($b | Where-Object { $_ -gt 127 }){ throw ('Non-ASCII byte: '+$p) } }"
```

Expected evidence:

- Exactly five fixture JSON files exist.
- Exactly three valid fixture JSON files and the schema parse successfully.
- The malformed fixture deterministically fails parsing.
- Raw lexical scanning always runs for the duplicate fixture and finds exactly two `"duplicateProbe"` properties, regardless of whether PowerShell 5.1 would collapse them during parsing.
- ASCII check exits `0`.

### 8.5 Focused duplicate rejection before mutation

This command operates only in a new GUID directory below the system temp root. It proves the fixture contains the duplicate, invokes the builder, and verifies rejection occurred without changing or adding files. Do not print file content.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$root=Join-Path ([IO.Path]::GetTempPath()) ('bdf-claude-gate2-dup-'+[guid]::NewGuid().ToString('N')); try { New-Item -ItemType Directory -Path (Join-Path $root 'schemas') -Force | Out-Null; Copy-Item '.\app\engine\claude-code\fixtures\settings-duplicate-key.json' (Join-Path $root 'settings.json'); Copy-Item '.\app\engine\claude-code\fixtures\routing-api-key.json' (Join-Path $root 'routing.json'); Copy-Item '.\app\engine\schemas\claude-code-routing.schema.json' (Join-Path $root 'schemas\claude-code-routing.schema.json'); $raw=Get-Content (Join-Path $root 'settings.json') -Raw; $count=[regex]::Matches($raw,'(?m)^\s*\"duplicateProbe\"\s*:').Count; if($count -ne 2){ throw ('Duplicate fixture lexical count was '+$count) }; $beforeHash=(Get-FileHash (Join-Path $root 'settings.json') -Algorithm SHA256).Hash; $beforeFiles=@(Get-ChildItem $root -Recurse -File | ForEach-Object { $_.FullName.Substring($root.Length) } | Sort-Object); $env:BDF_CLAUDE_GATE2_API_KEY='FAKE_GATE2_RUNTIME_VALUE_DO_NOT_USE'; $output=& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\app\engine\claude-code\build-claude-code.ps1' -FixtureRoot $root -RoutingProfilePath (Join-Path $root 'routing.json') -SettingsPath (Join-Path $root 'settings.json') 2>&1 | Out-String; $code=$LASTEXITCODE; $afterHash=(Get-FileHash (Join-Path $root 'settings.json') -Algorithm SHA256).Hash; $afterFiles=@(Get-ChildItem $root -Recurse -File | ForEach-Object { $_.FullName.Substring($root.Length) } | Sort-Object); if($code -eq 0){ throw 'Builder accepted duplicate keys' }; if($beforeHash -ne $afterHash){ throw 'Duplicate rejection mutated target' }; if(($beforeFiles -join '|') -ne ($afterFiles -join '|')){ throw 'Duplicate rejection created or removed files' }; if($output -notmatch 'duplicate'){ throw 'Builder output did not identify duplicate-key validation' }; if($output.Contains($env:BDF_CLAUDE_GATE2_API_KEY)){ throw 'Builder output exposed fake secret' }; 'DUPLICATE_REJECTION=PASS; TARGET_UNCHANGED=PASS; NO_BACKUP_OR_TEMP=PASS' } finally { Remove-Item Env:BDF_CLAUDE_GATE2_API_KEY -ErrorAction SilentlyContinue; if(Test-Path $root){ Remove-Item $root -Recurse -Force } }"
```

Expected evidence:

- Exit code `0` for the wrapper command because all assertions pass.
- Evidence line reports duplicate rejection, unchanged target, and no backup/temp.
- The nested builder exits nonzero at duplicate validation before parse/mutation.
- No fake secret value or JSON content appears in output.

### 8.6 Secret/path/static safety scan

```powershell
$gateFiles = @(
  '.\app\engine\claude-code\build-claude-code.ps1',
  '.\app\engine\claude-code\test-claude-code.ps1',
  '.\app\engine\schemas\claude-code-routing.schema.json'
) + @(Get-ChildItem '.\app\engine\claude-code\fixtures\*.json' | ForEach-Object FullName)
$prohibited = @(
  'sk-[A-Za-z0-9]{12,}',
  'Bearer\s+[A-Za-z0-9._-]{12,}',
  '[A-Za-z]:\\Users\\[^\\]+\\\.claude(?:\\|\.json)',
  '\.claude\.json',
  '\.jsonc'
)
$sourceMatches = Select-String -Path $gateFiles -Pattern $prohibited -CaseSensitive
if ($sourceMatches) { $sourceMatches; throw 'Prohibited literal found in Gate 2 source' }
$evidenceFiles = @(Get-ChildItem (Join-Path ([IO.Path]::GetTempPath()) 'bdf-claude-gate2-evidence-*.log') -File -ErrorAction SilentlyContinue)
if ($evidenceFiles.Count -eq 0) { throw 'Required Gate 2 evidence log not found' }
$evidenceMatches = Select-String -Path $evidenceFiles.FullName -Pattern $prohibited -CaseSensitive
if ($evidenceMatches) { $evidenceMatches; throw 'Prohibited literal found in Gate 2 evidence log' }
```

Expected evidence: at least one evidence log is found and neither source nor evidence logs contain a match. Builder and harness prove rejection using runtime/component path construction, so neither source file receives an exemption. Fixture files contain none of the forbidden names or paths. After recording the scan result, delete only the evidence log created by Section 8.1.

### 8.7 Diff and scope proof

```powershell
git diff --check
git status --short --branch
git diff --name-only
git ls-files --others --exclude-standard
```

Expected evidence:

- `git diff --check` exits `0`.
- Only the nine files in Section 2 are new/changed in the isolated worktree: eight implementation/test artifacts plus the one evidence report.
- No generated target, backup, temp, forbidden commented-JSON file, Claude state file, app integration file, or unrelated source is present.
- No commit exists for this work.

## 9. Isolated worktree setup

Do not implement in the currently dirty main worktree. From the current repository, first capture read-only state:

```powershell
git branch --show-current
git status --short --branch
$repo = (git rev-parse --show-toplevel).Trim()
$parent = Split-Path $repo -Parent
$worktree = Join-Path $parent 'bdf-claude-gate2-fixtures'
git worktree add -b claude-gate2-fixtures $worktree HEAD
```

Then:

```powershell
Set-Location $worktree
git status --short --branch
```

Expected evidence: the new worktree starts clean on branch `claude-gate2-fixtures`. Read this handoff from its absolute path in the original worktree if it is not tracked in `HEAD`; do not copy unrelated dirty planning files into the isolated worktree. Do not commit on the new branch.

If the branch or destination already exists, stop and inspect with `git worktree list` and `git branch --list claude-gate2-fixtures`; do not delete or reuse an uncertain worktree.

## 10. Rollback and recovery

During tests, each case owns one GUID temporary root. `finally` may delete only that test root after assertions and recovery verification. It must never recursively remove a parent temp directory or repository directory.

If implementation must be abandoned:

1. Record `git status --short --branch` and `git diff --` for evidence.
2. Do not use `git reset --hard`, `git clean`, or checkout paths from the original dirty worktree.
3. With user permission, delete only the nine newly created files in the isolated worktree.
4. Verify the isolated worktree is clean with `git status --short`.
5. With user permission, return to the original worktree and run `git worktree remove <worktree-path>` and `git branch -d claude-gate2-fixtures` only after proving there are no wanted changes.

A failed builder transaction recovers from its same-directory backup as specified in Section 5. If recovery cannot be verified, leave the fixture backup and diagnostic temp artifact intact, report `RECOVERY FAILED`, and stop. Never continue to another write after an unverified recovery.

## 11. Stop conditions

Stop immediately and report BLOCKED if any of these occurs:

- Any command would probe, read, or write a real Claude file or directory.
- A resolved path leaves the GUID fixture root or encounters an unapproved reparse point.
- Work requires `.claude.json`, `.jsonc`, app/API/UI integration, gateway probing, or a live Claude run.
- A real secret or non-fictional machine value is encountered.
- PowerShell 5.1 cannot provide an atomic replacement primitive for the tested existing-file case.
- Semantic preservation cannot be demonstrated for an unsupported value.
- Duplicate-key detection cannot reject the supplied fixture before mutation.
- Backup creation, restore, or post-restore verification fails.
- Existing docs and approved Gate 2 scope require a modification outside the nine files.
- Existing regression harnesses expose a pre-existing failure that would require unrelated edits.
- The isolated worktree contains unrelated changes.
- The worker is asked to commit or broaden scope without a new human-approved Sol handoff.

## 12. Worker report contract

Create the report from the isolated worktree at exactly:

```text
planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md
```

This Markdown file is authorized as the ninth file and is the sole documentation output. Do not create another report, handoff, session entry, changelog entry, README update, project-state update, or evidence file inside the repository. Temporary redacted evidence logs required by Section 8 remain below the system temp root and are removed as directed.

The report file, and the concise response returned to Sol, must contain these exact sections:

1. **Status:** `PASS`, `FAIL`, or `BLOCKED` for the overall handoff.
2. **Gate matrix:** One row each for G2-1, G2-2, G2-3, G2-4, and G2-5 with status and evidence/test names.
3. **Changed files:** Exact paths; they must match all nine paths in Section 2, including this report.
4. **Tests run:** Exact commands, exit codes, pass/fail counts, and the relevant red-then-green evidence.
5. **Transaction evidence:** Backup location pattern, same-directory temp proof, atomic replacement method, post-write parse/verification result, and each fault-injection recovery result. Do not include JSON values.
6. **Safety evidence:** Confirmation that no real Claude path, Claude state file, commented-JSON file, network endpoint, app integration, or live Claude process was probed or accessed; confirmation that builder/harness source and captured evidence logs passed the prohibited-pattern scan and captured output contains no fake secret value.
7. **Failures:** Full redacted error stages and whether recovery was verified.
8. **Risks/concerns:** Include PowerShell 5.1 limitations, formatting normalization, and any unproven assumption.
9. **Remaining work:** Gate 3/4/5 remain unauthorized; name any Gate 2 gap.
10. **Git state:** Branch, final `git status --short --branch`, unrelated changes (expected none in the isolated worktree), explicit confirmation that exactly the nine authorized paths are present, and explicit confirmation that no commit was created.

Do not claim the Claude adapter is integrated, production-ready, live-tested, or compatible with a particular gateway. The strongest allowed conclusion is that the fixture-only Gate 2 contract passed in isolated temporary directories.
