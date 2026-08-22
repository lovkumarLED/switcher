# Claude Code Gate 2 Integration Handoff

> For the assigned worker: integrate only the nine reviewed Gate 2 files from the approved isolated worktree into the current repository. Do not merge the branch and do not commit.

**Assigned worker:** DeepSeek V4 Flash Max

**Effort:** Max

**Goal:** Copy exactly nine reviewed, untracked Gate 2 fixture-proof files from the approved isolated worktree into the current repository, preserve every unrelated current-repository change, and verify source integrity, destination equality, Gate 2 behavior, existing engine regressions, safety, and exact scope.

**Outcome:** The current repository contains the reviewed Gate 2 fixture-only builder, harness, five fixtures, schema, and existing Gate 2 report. This integration does not authorize Gates 3, 4, or 5; app integration; live Claude access; network access; or a public support-status change.

## 1. Authority and repository locations

Read these authoritative files before integration:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_HANDOFF.md`
5. `planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md`
6. `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\planning\CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md`

Repository roots:

```text
Source:      C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures
Destination: C:\Users\loveb\.config\opencode\docs
```

The source is the approved isolated worktree on branch `claude-gate2-fixtures`. Its reviewed Gate 2 files are untracked, so do not use a branch merge, cherry-pick, checkout, reset, clean, or commit to integrate them. Perform an explicit allowlisted copy after all preflight checks pass.

The current repository is dirty. The last observed unrelated state included:

```text
 M app/BUGFIXES.md
 M app/assets/css/onboarding.css
 M app/assets/js/pages/onboarding.js
 M app/tests/frontend_review.test.mjs
?? planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md
?? planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_HANDOFF.md
?? planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md
?? planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_HANDOFF.md
?? planning/SOL_ORCHESTRATION_POLICY.md
?? planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md
```

This list is historical context, not a substitute for a fresh status capture. Preserve all current modified and untracked files whether or not they appear above.

## 2. Exact nine-file source-to-destination mapping

Only the following nine mappings are authorized. Every source path is below the source root and every destination path is below the destination root.

| # | Exact source path | Exact destination path |
|---|---|---|
| 1 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\app\engine\claude-code\build-claude-code.ps1` | `C:\Users\loveb\.config\opencode\docs\app\engine\claude-code\build-claude-code.ps1` |
| 2 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\app\engine\claude-code\test-claude-code.ps1` | `C:\Users\loveb\.config\opencode\docs\app\engine\claude-code\test-claude-code.ps1` |
| 3 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\app\engine\claude-code\fixtures\settings-preservation.json` | `C:\Users\loveb\.config\opencode\docs\app\engine\claude-code\fixtures\settings-preservation.json` |
| 4 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\app\engine\claude-code\fixtures\routing-api-key.json` | `C:\Users\loveb\.config\opencode\docs\app\engine\claude-code\fixtures\routing-api-key.json` |
| 5 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\app\engine\claude-code\fixtures\routing-auth-token.json` | `C:\Users\loveb\.config\opencode\docs\app\engine\claude-code\fixtures\routing-auth-token.json` |
| 6 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\app\engine\claude-code\fixtures\settings-malformed.json` | `C:\Users\loveb\.config\opencode\docs\app\engine\claude-code\fixtures\settings-malformed.json` |
| 7 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\app\engine\claude-code\fixtures\settings-duplicate-key.json` | `C:\Users\loveb\.config\opencode\docs\app\engine\claude-code\fixtures\settings-duplicate-key.json` |
| 8 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\app\engine\schemas\claude-code-routing.schema.json` | `C:\Users\loveb\.config\opencode\docs\app\engine\schemas\claude-code-routing.schema.json` |
| 9 | `C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures\planning\CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md` | `C:\Users\loveb\.config\opencode\docs\planning\CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md` |

There are exactly two PowerShell scripts, five fixture JSON files, one schema JSON file, and one existing Markdown evidence report. No tenth integration file is authorized.

## 3. Forbidden files and operations

Do not copy, overwrite, edit, move, delete, stage, or regenerate any file outside the exact nine destination paths.

In particular:

- Do not copy or overwrite `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_HANDOFF.md` from any source.
- Do not copy or overwrite `planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md` from any source.
- Do not alter this integration handoff during execution.
- Do not create a separate integration report. Return integration evidence through the worker task result.
- Use the integrated `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md` as the evidence artifact; it is mapping 9 of 9, not an additional file.
- Do not alter `README.md`, `PROJECT_STATE.md`, `ROADMAP.md`, `ADAPTER.md`, `ARCHITECTURE.md`, shared/public docs, app registration, scaffold registry, release sources, generated release files, session logs, or root support status.
- Do not edit existing OpenCode or Kilo builders or harnesses.
- Do not merge or remove the source worktree or branch.
- Do not stage or commit.
- Do not use `git reset`, `git clean`, `git checkout`, `git restore`, or a recursive repository copy.
- Never read, write, generate, merge, copy, enumerate, hash, or delete a commented-JSON file.
- Never access a real Claude installation, real Claude settings, Claude state, credentials, OAuth/session data, plugins, marketplaces, MCP data, skills, agents, hooks, memory, prompts, transcripts, logs, or caches.
- No network request, gateway probe, provider process, Claude invocation, or live test.
- No Gate 3 provider/model behavior, Gate 4 app integration, or Gate 5 live validation.

The source report's strongest allowed conclusion remains fixture-only Gate 2 PASS in isolated temporary directories. Do not claim integration, production readiness, gateway compatibility, or public support beyond the literal result of this file copy and regression verification.

## 4. Preflight and protected-state capture

Run from `C:\Users\loveb\.config\opencode\docs` in Windows PowerShell. Stop on any failed assertion.

```powershell
$ErrorActionPreference = 'Stop'
$sourceRoot = 'C:\Users\loveb\.config\opencode\bdf-claude-gate2-fixtures'
$destinationRoot = 'C:\Users\loveb\.config\opencode\docs'

$relativePaths = @(
  'app\engine\claude-code\build-claude-code.ps1',
  'app\engine\claude-code\test-claude-code.ps1',
  'app\engine\claude-code\fixtures\settings-preservation.json',
  'app\engine\claude-code\fixtures\routing-api-key.json',
  'app\engine\claude-code\fixtures\routing-auth-token.json',
  'app\engine\claude-code\fixtures\settings-malformed.json',
  'app\engine\claude-code\fixtures\settings-duplicate-key.json',
  'app\engine\schemas\claude-code-routing.schema.json',
  'planning\CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md'
)
if ($relativePaths.Count -ne 9) { throw 'Allowlist must contain exactly nine paths' }
if (($relativePaths | Sort-Object -Unique).Count -ne 9) { throw 'Allowlist contains duplicate paths' }

$sourceBranch = (git -C $sourceRoot branch --show-current).Trim()
if ($sourceBranch -ne 'claude-gate2-fixtures') { throw ('Unexpected source branch: ' + $sourceBranch) }
$sourceStatus = @(git -C $sourceRoot status --porcelain=v1 --untracked-files=all | Sort-Object)
$expectedSourceStatus = @(
  $relativePaths | ForEach-Object { '?? ' + ($_ -replace '\','/') } | Sort-Object
)
if (($sourceStatus -join "`n") -ne ($expectedSourceStatus -join "`n")) {
  Write-Host 'Unexpected source worktree status:'
  $sourceStatus
  throw 'Source status must equal exactly nine expected untracked entries; tracked modifications, deletions, renames, and extra untracked paths are forbidden'
}

$preStatus = @(git -C $destinationRoot status --porcelain=v1 --untracked-files=all)
$preHead = (git -C $destinationRoot rev-parse HEAD).Trim()
$preBranch = (git -C $destinationRoot branch --show-current).Trim()

foreach ($relative in $relativePaths) {
  $source = Join-Path $sourceRoot $relative
  $destination = Join-Path $destinationRoot $relative
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw ('Missing reviewed source file: ' + $source)
  }
  if (Test-Path -LiteralPath $destination) {
    throw ('Destination already exists; never overwrite: ' + $destination)
  }
}

if (Test-Path -LiteralPath (Join-Path $destinationRoot 'planning\CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_HANDOFF.md') -PathType Leaf) {
  Write-Host 'Protected current-repo Gate 2 handoff present and will not be overwritten'
}
if (Test-Path -LiteralPath (Join-Path $destinationRoot 'planning\UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md') -PathType Leaf) {
  Write-Host 'Protected current-repo documentation design present and will not be overwritten'
}
```

The destination preexistence check is mandatory. If any destination exists, stop. Do not compare and overwrite, rename it, delete it, or decide that matching content makes replacement safe. A new Sol handoff and explicit user authorization are required to handle any pre-existing destination.

## 5. Integrity and copy procedure

Compute all source SHA-256 hashes before copying. Copy only the allowlist. Recompute each source hash after its copy and compare the destination hash to the original source hash.

```powershell
$sourceHashesBefore = @{}
foreach ($relative in $relativePaths) {
  $source = Join-Path $sourceRoot $relative
  $sourceHashesBefore[$relative] = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
}

$createdDestinations = New-Object System.Collections.Generic.List[string]
$createdDirectories = New-Object System.Collections.Generic.List[string]
try {
  foreach ($relative in $relativePaths) {
    $source = Join-Path $sourceRoot $relative
    $destination = Join-Path $destinationRoot $relative
    if (Test-Path -LiteralPath $destination) {
      throw ('Destination appeared after preflight; never overwrite: ' + $destination)
    }
    $parent = Split-Path -Parent $destination
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
      $missingDirectories = New-Object System.Collections.Generic.List[string]
      $candidate = $parent
      while (-not (Test-Path -LiteralPath $candidate -PathType Container)) {
        $missingDirectories.Add($candidate)
        $candidate = Split-Path -Parent $candidate
        if ([string]::IsNullOrWhiteSpace($candidate) -or -not $candidate.StartsWith($destinationRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
          throw ('Directory creation would leave destination root: ' + $parent)
        }
      }
      $toCreate = @($missingDirectories)
      [array]::Reverse($toCreate)
      foreach ($directory in $toCreate) {
        if (Test-Path -LiteralPath $directory) { throw ('Directory appeared before creation: ' + $directory) }
        [void](New-Item -ItemType Directory -Path $directory)
        $createdDirectories.Add($directory)
      }
    }
    Copy-Item -LiteralPath $source -Destination $destination
    $createdDestinations.Add($destination)

    $sourceHashAfter = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    $destinationHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
    if ($sourceHashAfter -ne $sourceHashesBefore[$relative]) {
      throw ('Source changed during copy: ' + $relative)
    }
    if ($destinationHash -ne $sourceHashesBefore[$relative]) {
      throw ('Destination hash mismatch: ' + $relative)
    }
  }
} catch {
  Write-Error $_
  throw
}
```

Do not continue to tests after a source-change or destination-hash failure. Preserve evidence and follow Section 9 only when deletion eligibility is proven.

## 6. Verification commands in the current repository

Run every command from `C:\Users\loveb\.config\opencode\docs`. Record exact commands, exit codes, and pass counts in the task result. Temporary evidence logs must stay below the system temporary root and must be deleted after their safety scan.

### 6.1 Gate 2 harness: expected 43/43

```powershell
$evidenceLog = Join-Path ([IO.Path]::GetTempPath()) ('bdf-claude-gate2-integration-' + [guid]::NewGuid().ToString('N') + '.log')
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1 2>&1 | Tee-Object -FilePath $evidenceLog
$gate2Exit = $LASTEXITCODE
if ($gate2Exit -ne 0) { throw ('Gate 2 harness failed with exit code ' + $gate2Exit) }
$gate2Text = Get-Content -LiteralPath $evidenceLog -Raw
if ($gate2Text -notmatch '43\s+passed' -or $gate2Text -notmatch '0\s+failed') {
  throw 'Gate 2 output did not prove 43 passed and 0 failed'
}
```

Expected: exit `0`, 43 passed, 0 failed.

### 6.2 Existing engine regressions

```powershell
$openCodeOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1 2>&1 | Out-String
$openCodeExit = $LASTEXITCODE
if ($openCodeExit -ne 0 -or $openCodeOutput -notmatch '34\s*/\s*34') {
  throw 'OpenCode regression did not prove 34/34'
}

$kiloOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1 2>&1 | Out-String
$kiloExit = $LASTEXITCODE
if ($kiloExit -ne 0 -or $kiloOutput -notmatch '32\s*/\s*32') {
  throw 'Kilo regression did not prove 32/32'
}
```

Expected: OpenCode exit `0`, 34/34; Kilo exit `0`, 32/32. If an existing harness has a pre-existing failure, report BLOCKED and do not edit it.

### 6.3 PowerShell parser checks

```powershell
powershell.exe -NoProfile -Command "$e=$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '.\app\engine\claude-code\build-claude-code.ps1'),[ref]$null,[ref]$e); if($e.Count){$e | ForEach-Object Message; exit 1}"
if ($LASTEXITCODE -ne 0) { throw 'Builder parser check failed' }

powershell.exe -NoProfile -Command "$e=$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '.\app\engine\claude-code\test-claude-code.ps1'),[ref]$null,[ref]$e); if($e.Count){$e | ForEach-Object Message; exit 1}"
if ($LASTEXITCODE -ne 0) { throw 'Harness parser check failed' }
```

Expected: both exit `0` with no parser errors.

### 6.4 JSON, malformed fixture, duplicate proof, ASCII, and safety

```powershell
$fixtureDir = '.\app\engine\claude-code\fixtures'
$fixtures = @(Get-ChildItem (Join-Path $fixtureDir '*.json') -File)
if ($fixtures.Count -ne 5) { throw ('Expected five fixtures; found ' + $fixtures.Count) }
foreach ($name in @('settings-preservation.json','routing-api-key.json','routing-auth-token.json')) {
  Get-Content (Join-Path $fixtureDir $name) -Raw | ConvertFrom-Json | Out-Null
}
Get-Content '.\app\engine\schemas\claude-code-routing.schema.json' -Raw | ConvertFrom-Json | Out-Null
$malformed = Get-Content (Join-Path $fixtureDir 'settings-malformed.json') -Raw
try {
  $malformed | ConvertFrom-Json | Out-Null
  throw 'Malformed fixture unexpectedly parsed'
} catch {
  if ($_.Exception.Message -eq 'Malformed fixture unexpectedly parsed') { throw }
}
$duplicateRaw = Get-Content (Join-Path $fixtureDir 'settings-duplicate-key.json') -Raw
$duplicateCount = [regex]::Matches($duplicateRaw, '(?m)^\s*"duplicateProbe"\s*:').Count
if ($duplicateCount -ne 2) { throw ('Expected two duplicateProbe properties; found ' + $duplicateCount) }

$integratedPaths = @($relativePaths | ForEach-Object { Join-Path $destinationRoot $_ })
foreach ($path in $integratedPaths) {
  $bytes = [IO.File]::ReadAllBytes($path)
  if ($bytes | Where-Object { $_ -gt 127 }) { throw ('Non-ASCII byte: ' + $path) }
}

$prohibited = @(
  'sk-[A-Za-z0-9]{12,}',
  'Bearer\s+[A-Za-z0-9._-]{12,}',
  '[A-Za-z]:\\Users\\[^\\]+\\\.claude(?:\\|\.json)',
  '\.claude\.json'
)
$sourceMatches = Select-String -Path $integratedPaths -Pattern $prohibited -CaseSensitive
if ($sourceMatches) { $sourceMatches; throw 'Prohibited literal found in integrated Gate 2 files' }
$evidenceMatches = Select-String -LiteralPath $evidenceLog -Pattern $prohibited -CaseSensitive
if ($evidenceMatches) { $evidenceMatches; throw 'Prohibited literal found in Gate 2 evidence' }
Remove-Item -LiteralPath $evidenceLog
```

Expected: exactly five fixtures; valid JSON and schema parse; malformed JSON fails; duplicate lexical count is exactly two; all nine files are ASCII; source and evidence safety scans have no match; only the integration evidence log is deleted.

### 6.5 Focused duplicate rejection before mutation

This verification operates only in a new GUID directory below the system temporary root. It proves the fixture contains exactly two duplicate properties, invokes only the fixture builder against copied fixture inputs, and proves rejection without target mutation, backup, or transaction temporary output. It must not access a real Claude path or any commented-JSON path.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$root=Join-Path ([IO.Path]::GetTempPath()) ('bdf-claude-gate2-dup-'+[guid]::NewGuid().ToString('N')); try { New-Item -ItemType Directory -Path (Join-Path $root 'schemas') -Force | Out-Null; Copy-Item '.\app\engine\claude-code\fixtures\settings-duplicate-key.json' (Join-Path $root 'settings.json'); Copy-Item '.\app\engine\claude-code\fixtures\routing-api-key.json' (Join-Path $root 'routing.json'); Copy-Item '.\app\engine\schemas\claude-code-routing.schema.json' (Join-Path $root 'schemas\claude-code-routing.schema.json'); $raw=Get-Content (Join-Path $root 'settings.json') -Raw; $count=[regex]::Matches($raw,'(?m)^\s*\"duplicateProbe\"\s*:').Count; if($count -ne 2){ throw ('Duplicate fixture lexical count was '+$count) }; $beforeHash=(Get-FileHash (Join-Path $root 'settings.json') -Algorithm SHA256).Hash; $beforeFiles=@(Get-ChildItem $root -Recurse -File | ForEach-Object { $_.FullName.Substring($root.Length) } | Sort-Object); $env:BDF_CLAUDE_GATE2_API_KEY='FAKE_GATE2_RUNTIME_VALUE_DO_NOT_USE'; $output=& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\app\engine\claude-code\build-claude-code.ps1' -FixtureRoot $root -RoutingProfilePath (Join-Path $root 'routing.json') -SettingsPath (Join-Path $root 'settings.json') 2>&1 | Out-String; $code=$LASTEXITCODE; $afterHash=(Get-FileHash (Join-Path $root 'settings.json') -Algorithm SHA256).Hash; $afterFiles=@(Get-ChildItem $root -Recurse -File | ForEach-Object { $_.FullName.Substring($root.Length) } | Sort-Object); if($code -eq 0){ throw 'Builder accepted duplicate keys' }; if($beforeHash -ne $afterHash){ throw 'Duplicate rejection mutated target' }; if(($beforeFiles -join '|') -ne ($afterFiles -join '|')){ throw 'Duplicate rejection created or removed files' }; if($output -notmatch 'duplicate'){ throw 'Builder output did not identify duplicate-key validation' }; if($output.Contains($env:BDF_CLAUDE_GATE2_API_KEY)){ throw 'Builder output exposed fake secret' }; 'DUPLICATE_REJECTION=PASS; TARGET_UNCHANGED=PASS; NO_BACKUP_OR_TEMP=PASS' } finally { Remove-Item Env:BDF_CLAUDE_GATE2_API_KEY -ErrorAction SilentlyContinue; if(Test-Path $root){ Remove-Item $root -Recurse -Force } }"
if ($LASTEXITCODE -ne 0) { throw 'Focused duplicate rejection verification failed' }
```

Expected: the wrapper exits `0`; the nested builder exits nonzero during duplicate validation; the target SHA-256 remains unchanged; the temporary-root file inventory is unchanged, proving no backup or transaction temporary file was created; output identifies duplicate rejection without exposing the fake runtime value. The final cleanup deletes only this command's GUID temporary root.

### 6.6 Final hash, scope, safety, and Git-state proof

```powershell
foreach ($relative in $relativePaths) {
  $source = Join-Path $sourceRoot $relative
  $destination = Join-Path $destinationRoot $relative
  if (-not (Test-Path -LiteralPath $destination -PathType Leaf)) {
    throw ('Integrated destination missing: ' + $relative)
  }
  $sourceHashFinal = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
  $destinationHashFinal = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
  if ($sourceHashFinal -ne $sourceHashesBefore[$relative]) {
    throw ('Source hash changed after integration: ' + $relative)
  }
  if ($destinationHashFinal -ne $sourceHashesBefore[$relative]) {
    throw ('Final destination hash mismatch: ' + $relative)
  }
}

$unexpectedArtifacts = @(
  Get-ChildItem '.\app\engine\claude-code' -Recurse -File |
    Where-Object { $_.FullName -notin $integratedPaths }
)
if ($unexpectedArtifacts.Count -ne 0) {
  $unexpectedArtifacts.FullName
  throw 'Unexpected file exists under integrated Claude Gate 2 tree'
}

$integrationReportCandidates = @(Get-ChildItem '.\planning' -File -Filter 'CLAUDE_CODE_GATE_2_INTEGRATION_REPORT*' -ErrorAction SilentlyContinue)
if ($integrationReportCandidates.Count -ne 0) { throw 'Unauthorized tenth integration report exists' }

$headAfter = (git -C $destinationRoot rev-parse HEAD).Trim()
$branchAfter = (git -C $destinationRoot branch --show-current).Trim()
if ($headAfter -ne $preHead) { throw 'HEAD changed; a commit or history operation occurred' }
if ($branchAfter -ne $preBranch) { throw 'Current repository branch changed' }

git -C $destinationRoot diff --check
if ($LASTEXITCODE -ne 0) { throw 'git diff --check failed' }

$postStatus = @(git -C $destinationRoot status --porcelain=v1 --untracked-files=all)
$expectedAddedStatus = @($relativePaths | ForEach-Object { '?? ' + ($_ -replace '\','/') })
$protectedBefore = @($preStatus | Where-Object { $_ -notin $expectedAddedStatus } | Sort-Object)
$protectedAfter = @($postStatus | Where-Object { $_ -notin $expectedAddedStatus } | Sort-Object)
if (($protectedBefore -join "`n") -ne ($protectedAfter -join "`n")) {
  throw 'Unrelated current-repository status changed during integration'
}
foreach ($expected in $expectedAddedStatus) {
  if ($postStatus -notcontains $expected) { throw ('Expected integrated untracked path missing from status: ' + $expected) }
}

git -C $destinationRoot status --short --branch
git -C $destinationRoot diff --name-only
git -C $destinationRoot ls-files --others --exclude-standard
```

The status comparison excludes only the exact nine expected newly integrated status lines. Every other pre-existing modified or untracked entry must remain identical. Do not interpret other pre-existing files as integration scope.

## 7. Acceptance criteria

Report PASS only when every item is proven by fresh evidence:

1. The source worktree is the expected branch and has exactly the nine reviewed untracked files, with no unrelated source path.
2. All nine destinations were absent before copy; no existing file was overwritten.
3. Exactly the nine mappings in Section 2 were copied, with no branch merge and no tenth file.
4. Each source SHA-256 was captured before copy, remained unchanged after copy and after verification, and equals its destination SHA-256.
5. Gate 2 reports 43/43 passed.
6. OpenCode reports 34/34 passed.
7. Kilo reports 32/32 passed.
8. Both PowerShell files parse without errors.
9. Exactly five fixture JSON files exist; three valid fixtures and the schema parse; the malformed fixture fails; the duplicate fixture proves exactly two duplicate properties.
10. The focused duplicate verification runs only below a GUID system-temporary root; the nested builder rejects the duplicate input before mutation; target SHA-256 and file inventory remain unchanged; no backup or transaction temporary file is created.
11. All nine integrated files are ASCII and pass prohibited secret and real-Claude-path scans.
12. No real Claude path or process, Claude-owned state, network, gateway, commented-JSON file, Gate 3, Gate 4, or Gate 5 surface was accessed.
13. No root/shared/public status document, current-repository planning authority, existing builder, app integration file, generated file, or unrelated dirty file changed.
14. The integrated Gate 2 report is the sole evidence artifact copied. No integration report or other repository evidence file was created.
15. `git diff --check` passes, branch and HEAD remain unchanged, the unrelated status projection is identical before/after, and no commit exists.
16. The worker task result satisfies Section 8 without exposing secrets or fixture values.

A failure in any criterion makes overall status FAIL or BLOCKED. Passing tests do not compensate for a scope, integrity, safety, or rollback violation.

## 8. Worker report contract

Do not create a repository report. Return evidence through the task result with exactly these sections:

1. **Status:** `PASS`, `FAIL`, or `BLOCKED`.
2. **Integrated files:** All nine exact destination paths and confirmation that no tenth file was integrated.
3. **Integrity:** The nine source SHA-256 values, confirmation each source remained stable before/after/final, and source/destination equality. Hashes are allowed; file contents and secret values are not.
4. **Tests:** Exact commands, exit codes, and counts for Gate 2 43/43, OpenCode 34/34, Kilo 32/32, both parser checks, JSON/malformed/duplicate checks, focused duplicate rejection-before-mutation with unchanged target hash and no backup/temp, ASCII scan, prohibited-pattern scan, hash checks, and scope checks.
5. **Protected state:** Branch, HEAD before/after, current-repository status before/after, and explicit confirmation that every unrelated modified or untracked path was preserved.
6. **Safety and exclusions:** Confirmation of no real Claude access, no commented-JSON access, no network, no Gates 3-5, no app integration, no root/shared/public documentation status change, no merge, no staging, and no commit.
7. **Rollback:** Whether rollback was needed; if so, list only destinations proven absent before integration and removed under Section 9. Never include file contents.
8. **Failures:** Redacted command/stage, exit code, recovery state, and unresolved blocker.
9. **Concerns:** Any integrity, filesystem, PowerShell 5.1, source drift, pre-existing regression, or status ambiguity.
10. **Remaining work:** Gates 3, 4, and 5 remain unauthorized.

The integrated `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md` remains historical Gate 2 evidence and must not be edited during integration.

## 9. Rollback and recovery

Rollback is destructive and narrowly bounded. It may remove only a destination that satisfies every condition below:

1. The exact path is in the Section 2 allowlist.
2. The preflight check recorded that the destination did not exist.
3. The current integration run successfully recorded that it created that destination.
4. No later process replaced or modified it: its current SHA-256 still equals the copied source hash recorded by this run.

If all four conditions hold, remove only those newly created files, in reverse mapping order. Do not remove any file that existed before integration, has uncertain provenance, or has hash drift.

```powershell
$filesToRemove = @($createdDestinations)
[array]::Reverse($filesToRemove)
foreach ($destination in $filesToRemove) {
  $relative = $destination.Substring($destinationRoot.Length).TrimStart('\')
  if ($relativePaths -notcontains $relative) { throw ('Rollback path not allowlisted: ' + $destination) }
  if (-not (Test-Path -LiteralPath $destination -PathType Leaf)) { continue }
  $currentHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
  if ($currentHash -ne $sourceHashesBefore[$relative]) {
    throw ('Rollback stopped because destination changed: ' + $destination)
  }
  Remove-Item -LiteralPath $destination
}

$directoriesToRemove = @($createdDirectories)
[array]::Reverse($directoriesToRemove)
foreach ($directory in $directoriesToRemove) {
  if (-not $directory.StartsWith($destinationRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw ('Recorded rollback directory leaves destination root: ' + $directory)
  }
  if (Test-Path -LiteralPath $directory -PathType Container) {
    $children = @(Get-ChildItem -LiteralPath $directory -Force)
    if ($children.Count -eq 0) { Remove-Item -LiteralPath $directory }
  }
}
```

After eligible files are removed, remove only directories explicitly recorded in `$createdDirectories`, in reverse creation order, and only when empty after file rollback. Never recursively delete a directory. Never remove `app`, `app\engine`, `app\engine\schemas`, or `planning`. Re-run status and verify the full pre-integration status is restored. Do not use Git cleanup or reset commands.

If any destination existed before preflight, stop without changing it. If a copy partially succeeds and deletion eligibility cannot be proven, leave evidence in place, report BLOCKED, and request user direction. Never overwrite an existing file to recover.

## 10. Stop conditions

Stop immediately and report BLOCKED if:

- The source worktree branch is unexpected, missing, dirty beyond the exact nine untracked paths, or any reviewed source file is missing.
- Any destination already exists or appears between preflight and copy.
- Source hashes change during integration or any destination hash differs.
- Integration requires a branch merge, checkout, commit, stage, reset, clean, move, or overwrite.
- Any command would access a real Claude path, Claude-owned state, a commented-JSON file, a network endpoint, gateway, or Claude process.
- Work expands to Gate 3, Gate 4, Gate 5, app integration, adapter status, root/shared/public docs, release files, or generated artifacts.
- A real secret or machine-derived private value is encountered or output contains a secret marker value.
- Gate 2 is not 43/43, OpenCode is not 34/34, or Kilo is not 32/32.
- Parser, JSON, malformed, duplicate, focused duplicate rejection-before-mutation, ASCII, prohibited-pattern, integrity, Git, or exact-scope verification fails.
- Any unrelated current-repository status entry changes.
- Rollback would require deleting or overwriting a pre-existing or uncertain file.
- A tenth repository file or separate integration report is required.
- The worker is asked to commit or broaden scope without a new human-approved Sol handoff.

## 11. Final boundary

This handoff authorizes only an allowlisted integration of the nine reviewed Gate 2 fixture-proof files. It does not promote `app/engine/claude-code/` to the final canonical Claude implementation, resolve the canonical-to-packaged mapping, authorize provider compatibility testing, integrate Claude into the app, access a live installation, or change public support status. Those decisions remain governed by separate future handoffs and human approval.
