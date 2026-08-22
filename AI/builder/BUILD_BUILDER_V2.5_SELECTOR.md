# BUILD_BUILDER_V2.5_SELECTOR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Companion tracking docs: `_agent/JOURNEY_TO_V3.md` (side goals), `ROADMAP.md`
> (Phases 10.5 + 10.6), `schemas/README.md` (Phase 10.6 reservation).

**Goal:** Build `scripts/build-opencode-v2.5.ps1` — a new builder that discovers every
provider in `providers/`, asks the user which providers are active (interactively, with
`-Provider` and `-NonInteractive` overrides), persists the choice into the profile's
`settings.json`, and attaches each active provider's models from profile-level
`<provider>-models.json` files with the highest precedence.

**Architecture:** New standalone script `build-opencode-v2.5.ps1` = copy of the proven
V2.1 builder (`build-opencode-v2.ps1`) plus three new stages: (1) Provider Discovery
(all `providers/*.json`), (2) Active-Provider Selection (menu / flag / stored default,
with settings.json persistence), (3) profile-level `<provider>-models.json` merge with
new precedence. The V2.1 script and its 17-test harness stay untouched and green.
A second test harness (`test-opencode-v2.5.ps1`) verifies the new behavior.

**Tech Stack:** PowerShell 5.1 (Windows), no extra modules, UTF-8 no-BOM JSON output.

---

## Global Constraints

- PowerShell 5.1 only; no NuGet/module installs; `ConvertTo-Json -Depth 100` for output.
- Source of truth: `profiles/`, `providers/`, `scripts/`, `docs/` sources. Never hand-edit
  generated files (`opencode.json`, `CURRENT_RELEASE.md`, `bdf/VERSION.md` rows,
  marker sections, `SESSION_LOG.md` entries).
- `build-opencode-v2.ps1` and `test-opencode-v2.ps1` must remain byte-for-byte untouched;
  their 17/17 tests must still pass after this build.
- Fail-fast validation, deterministic output, backups before any overwrite.
- Release flow: edit `docs/release_registry.json` (new entry `2.4.0`, `builderVersion`
  `"V2.5"`) → user review → `release-manager.ps1` → tests → commit (docs repo).
- New release docs group: full docs sweep per Task 7 (all listed files).
- Interactive menu only when: console input available AND no `-Provider` AND no
  `-NonInteractive`. Tests always run non-interactive.
- Registry version for this build: **2.4.0** (current 2.3.0 is the old "V2.5
  generalization" release — do not confuse: this is a new builder named
  `build-opencode-v2.5.ps1`, released as registry 2.4.0).

---

## Builder Regeneration Guarantee (read first)

**Rule:** if `scripts/` gets deleted, an agent must be able to regenerate
`build-opencode-v2.5.ps1` — with ALL features — by reading only project docs.
The agent never reverse-engineers from the old script; the docs are the spec.

What must be true after this build (and what the tasks below enforce):

1. `BUILDER_SPEC.md` documents, with exact names, every stage and function:
   `Discover-Providers`, `Select-ActiveProviders`, `Resolve-ActiveProviders`,
   `Persist-ActiveProviders`, `Get-ProfileProviderModels`, and the full
   `Merge-Models` precedence order (profile `<provider>-models.json` >
   `providers/<provider>/models.json` > inline > global).
2. `BUILDER_SPEC.md` documents the CLI switches `-Profile`, `-ConfigRoot`,
   `-Provider`, `-NonInteractive`, and the selection rules
   (menu semantics: comma list, `a`, `n`, empty = keep).
3. `BUILDER_SPEC.md` documents the new file shape `profiles/<profile>/<provider>-models.json`
   (`{"models": {...}}`, unique keys, unique model names) and that non-active
   providers' model files are ignored with a detail log line.
4. `AI/BUILD_BUILDER_V2.5_SELECTOR.md` (this file) is the task-by-task recipe; the
   implementing session follows it from a fresh context with no memory of the old script.
5. A sync test (`Test-BuilderSpecCoversV25` in Task 6) greps `BUILDER_SPEC.md` for the
   required feature tokens and fails if any are missing — so spec drift is caught by CI.
6. The test harness itself is the acceptance oracle: 10+ new tests must pass before
   release, so a regenerated builder must pass them by construction.

If regeneration is needed: read `AGENT.md` → `README.md` → `PROJECT_STATE.md` →
`ADAPTER.md` → `ARCHITECTURE.md` → `BUILDER_SPEC.md` → `DESIGN_PRINCIPLES.md` →
`FOLDER_STRUCTURE.md` → `JSON_SCHEMAS.md` → this plan → reimplement the script.

---

## File Structure

| File | Role |
|---|---|
| `scripts/build-opencode-v2.5.ps1` | NEW — the V2.5 builder (single file, ~1100 lines) |
| `scripts/test-opencode-v2.5.ps1` | NEW — V2.5 test harness (~10 tests) |
| `docs/BUILDER_SPEC.md` | MODIFY — full V2.5 spec (regeneration source) |
| `docs/JSON_SCHEMAS.md` | MODIFY — add `<provider>-models.json` + updated precedence |
| `docs/FOLDER_STRUCTURE.md` | MODIFY — document new file name pattern |
| `docs/ADAPTER.md` | MODIFY — model-source table row |
| `docs/ARCHITECTURE.md` | MODIFY — new stage diagram |
| `docs/TESTING.md` | MODIFY — V2.5 harness group |
| `docs/README.md` | MODIFY — builder version row |
| `docs/PROJECT_STATE.md` | MODIFY — version/status |
| `docs/CHANGELOG.md` | MODIFY — via release manager |
| `docs/CURRENT_RELEASE.md` | MODIFY — via release manager |
| `docs/bdf/VERSION.md` | MODIFY — via release manager |
| `docs/release_registry.json` | MODIFY — add 2.4.0 entry |
| `docs/_agent/JOURNEY_TO_V3.md` | MODIFY — tick side goal when released |
| `profiles/coding/settings.json` | MODIFY — real-world validation (activeProviders) |
| `profiles/coding/modal-models.json` | KEEP — becomes the demo `<provider>-models.json` |
| `profiles/coding/models.json` | KEEP (optionally: remove `modal` dup) |

---

## Task 1: Scaffold V2.5 builder from V2.1

**Files:**
- Create: `scripts/build-opencode-v2.5.ps1`

**Interfaces:**
- Consumes: `scripts/build-opencode-v2.ps1` (copy source, unchanged)
- Produces: `build-opencode-v2.5.ps1` with params `-Profile`, `-ConfigRoot`,
  `-Provider`, `-NonInteractive`; version banner `Builder V2.5`

- [ ] **Step 1: Copy V2.1 script**

```powershell
Copy-Item scripts\build-opencode-v2.ps1 scripts\build-opencode-v2.5.ps1
```

- [ ] **Step 2: Update the param block**

Replace the existing param block (top of file, currently `-Profile` default `"default"`
and `-ConfigRoot` default `Join-Path $HOME ".config\opencode"`) with:

```powershell
param(
    [string]$Profile = "default",
    [string]$ConfigRoot = (Join-Path $HOME ".config\opencode"),
    [string]$Provider = "",
    [switch]$NonInteractive
)
```

- [ ] **Step 3: Update the header comment**

First line block: `# Purpose: Generate opencode.json from modular profile files. (Builder V2.5 - Active-Provider Selector)`. Keep the rest of the comment.

- [ ] **Step 4: Verify scaffold runs on the default profile**

```powershell
powershell -NoProfile -File scripts\build-opencode-v2.5.ps1 -Profile default -NonInteractive
```

Expected: identical output to V2.1 build (providers omniroute, same model count), `exit 0`.
If output differs, diff `opencode.json` before/after and fix.

- [ ] **Step 5: Verify V2.1 untouched**

```powershell
powershell -NoProfile -File scripts\test-opencode-v2.ps1
```

Expected: `Passed 17/17`, `exit 0`.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-opencode-v2.5.ps1
git commit -m "feat: scaffold build-opencode-v2.5.ps1 from V2.1"
```

---

## Task 2: Provider Discovery stage

**Files:**
- Modify: `scripts/build-opencode-v2.5.ps1` (insert new stage before Stage 1)

**Interfaces:**
- Consumes: `Assert-ProviderDefinition` (already in script), `Load-Json`,
  `Write-Step`, `Write-Detail`, `Write-Warning`, `$ProvidersRoot`
- Produces: `Discover-Providers` → `[string[]]$DiscoveredProviders` (sorted, valid ids);
  `$ProviderIssues` (list of malformed files, if any)

- [ ] **Step 1: Add `Discover-Providers` function**

```powershell
function Discover-Providers {

    # Returns every valid provider id from providers/*.json.
    # Malformed provider file => terminating error listing ALL bad files.
    $Files = @(Get-ChildItem -Path $ProvidersRoot -Filter "*.json" -File | Sort-Object Name)
    if ($Files.Count -eq 0) { throw "No provider files found in $ProvidersRoot" }

    $Valid  = @()
    $Issues = @()

    foreach ($File in $Files) {
        try {
            $Json = Load-Json $File.FullName
            Assert-ProviderDefinition ([System.IO.Path]::GetFileNameWithoutExtension($File.Name)) $Json $File.FullName
            $Valid += [System.IO.Path]::GetFileNameWithoutExtension($File.Name)
            Write-Detail "Discovered provider: $($File.Name)"
        }
        catch {
            $Issues += "$($File.Name) - $($_.Exception.Message)"
        }
    }

    if ($Issues.Count -gt 0) {
        throw "Provider discovery failed for: $( $Issues -join '; ' )"
    }

    return ,$Valid
}
```

- [ ] **Step 2: Wire discovery into the script body**

Insert right before `Stage 1 - Load Profile`:

```powershell
# ------------------------------------------------------------
# Stage 0 - Discover Providers (ALL providers, not only active)
# ------------------------------------------------------------
Write-Step "Discovering providers..."
$DiscoveredProviders = Discover-Providers
Write-Success "$($DiscoveredProviders.Count) provider(s) discovered."
```

- [ ] **Step 3: Manual verification**

Run with `-NonInteractive` against a temp root containing a valid provider and one
malformed (`{"id": "x"}` without `provider` object). Malformed must fail with a
clear message naming the file; valid-only root must list all providers.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-opencode-v2.5.ps1
git commit -m "feat(v2.5): provider discovery stage scans all providers/*.json"
```

---

## Task 3: Active-Provider selection + settings.json persistence

**Files:**
- Modify: `scripts/build-opencode-v2.5.ps1`

**Interfaces:**
- Consumes: `$DiscoveredProviders`, `$Settings.activeProviders`, `$ProfilePath`,
  `$BackupDir`, `Write-*` helpers
- Produces: `Resolve-ActiveProviders` → `[string[]]` (final active list);
  `Select-ActiveProviders` → `[string[]]` (menu pick);
  `Persist-ActiveProviders` → writes `$ProfilePath\settings.json`

- [ ] **Step 1: Add `Select-ActiveProviders` (interactive menu)**

```powershell
function Select-ActiveProviders {

    param([string[]]$Discovered, [string[]]$Current)

    # Numbered menu. Current providers marked "(active)".
    # Input: comma/space separated numbers, 'a' = all, 'n' = none, empty = keep current.
    $Selected = @($Current | Where-Object { $Discovered -contains $_ })

    Write-Host ""
    Write-Host "Select active providers for profile '$Profile':" -ForegroundColor Cyan

    for ($i = 0; $i -lt $Discovered.Count; $i++) {
        $mark = ""
        if ($Selected -contains $Discovered[$i]) { $mark = " (active)" }
        Write-Host ("  {0,2}) {1}{2}" -f ($i + 1), $Discovered[$i], $mark)
    }

    Write-Host ""
    $Answer = Read-Host "Numbers, 'a' for all, 'n' for none, Enter to keep current"

    if ([string]::IsNullOrWhiteSpace($Answer)) { return ,$Selected }

    if ($Answer.Trim().ToLower() -eq "a") { return ,$Discovered }

    if ($Answer.Trim().ToLower() -eq "n") { return ,@() }

    $Picked = @()
    foreach ($Part in ($Answer -split "[,\s]+")) {
        if ($Part -match "^\d+$") {
            $Idx = [int]$Part
            if ($Idx -ge 1 -and $Idx -le $Discovered.Count -and $Picked -notcontains $Discovered[$Idx - 1]) {
                $Picked += $Discovered[$Idx - 1]
            }
        }
    }
    return ,$Picked
}
```

- [ ] **Step 2: Add `Resolve-ActiveProviders`**

```powershell
function Resolve-ActiveProviders {

    param([string[]]$Discovered, [string[]]$Stored)

    if (-not [string]::IsNullOrWhiteSpace($Provider)) {
        # -Provider wins over everything; order = given order.
        $List = @($Provider -split "[,\s]+" | Where-Object { $_ })
        foreach ($Id in $List) {
            if ($Discovered -notcontains $Id) {
                throw "Provider not found: $Id (discovered: $( $Discovered -join ', ' ))"
            }
        }
        return ,$List
    }

    if ($NonInteractive) { return ,$Stored }   # stored settings.json list

    return Select-ActiveProviders $Discovered $Stored
}
```

- [ ] **Step 3: Add `Persist-ActiveProviders` (with backup)**

```powershell
function Persist-ActiveProviders {

    param([string[]]$Active)

    if ($Active.Count -eq 0) { throw "No active providers selected; build aborted." }

    $SettingsFile = Join-Path $ProfilePath "settings.json"

    # Backup existing settings.json before overwrite (only if it differs).
    $NewJson = (Get-Content $SettingsFile -Raw | ConvertFrom-Json) -ne $null
    $Raw = Get-Content $SettingsFile -Raw
    $Obj = $Raw | ConvertFrom-Json
    if (-not (Compare-JsonArrays $Obj.activeProviders $Active)) {
        if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }
        $BackupFile = Join-Path $BackupDir ("settings_{0}_{1:yyyy-MM-dd_HH-mm-ss}.json" -f $Profile, [DateTime]::Now)
        Copy-Item $SettingsFile $BackupFile
        Write-Detail "settings.json backed up to $BackupFile"
    }

    $Out = [ordered]@{}
    if ($Obj.PSObject.Properties.Name -contains '$schema') { $Out['$schema'] = $Obj.'$schema' }
    $Out['activeProviders'] = @($Active)
    $Json = $Out | ConvertTo-Json -Depth 100
    [System.IO.File]::WriteAllText($SettingsFile, $Json, (New-Object System.Text.UTF8Encoding $false))
    Write-Success "settings.json updated (activeProviders: $( $Active -join ', ' ))"
}
```

- [ ] **Step 4: Add `Compare-JsonArrays` helper**

```powershell
function Compare-JsonArrays {
    param([object[]]$A, [object[]]$B)
    if ($A.Count -ne $B.Count) { return $false }
    for ($i = 0; $i -lt $A.Count; $i++) { if ("$($A[$i])" -ne "$($B[$i])") { return $false } }
    return $true
}
```

- [ ] **Step 5: Wire selection + persistence into the script body**

After Stage 0 discovery, before Stage 1, and replacing the settings load:

```powershell
$SettingsFile = Join-Path $ProfilePath "settings.json"
$Settings = Load-Json $SettingsFile
Assert-SettingsShape $Settings

Write-Step "Resolving active providers..."
$ActiveProviders = Resolve-ActiveProviders $DiscoveredProviders @($Settings.activeProviders)
Persist-ActiveProviders $ActiveProviders
$Settings.activeProviders = $ActiveProviders
```

Note: the old `Load-OptionalJson` for models/plugins/mcp stays unchanged in Stage 1.

- [ ] **Step 6: Manual verification**

- Interactive: run without flags against a temp root with 3 providers; pick via menu;
  check settings.json rewritten (order = pick order, `$schema` preserved), backup created.
- `-Provider modal,omniroute`: no prompt; settings.json updated.
- `-NonInteractive`: no prompt; settings.json updated to stored list.
- Enter empty in menu: keeps current, no settings.json change.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-opencode-v2.5.ps1
git commit -m "feat(v2.5): interactive active-provider selection with settings.json persistence"
```

---

## Task 4: Profile-level `<provider>-models.json` merge

**Files:**
- Modify: `scripts/build-opencode-v2.5.ps1` (Merge-Models replacement)

**Interfaces:**
- Consumes: `$ProfilePath`, `$ProvidersRoot`, `Assert-NoDuplicateKeys`,
  `Assert-NoDuplicateModelNames`, `Set-ObjectProperty`, `$Expected`
- Produces: `Get-ProfileProviderModels` → `$null` or `@{models=...}`;
  new `Merge-Models` with precedence: profile `<provider>-models.json` >
  `providers/<provider>/models.json` > inline > global

- [ ] **Step 1: Add `Get-ProfileProviderModels`**

```powershell
function Get-ProfileProviderModels {

    param([string]$ProviderId)

    $File = Join-Path $ProfilePath ("{0}-models.json" -f $ProviderId)
    if (-not (Test-Path $File)) { return $null }

    Assert-NoDuplicateKeys $File "model"
    $Json = Load-Json $File
    if (-not $Json.models) {
        throw "Profile models file '$File' validation failed: 'models' section is missing or invalid."
    }
    Assert-NoDuplicateModelNames $Json "$ProfilePath/$ProviderId-models.json"
    Write-Detail "Profile-level models: $($File) ($(@($Json.models.PSObject.Properties).Count) model(s))"
    return ,$Json
}
```

- [ ] **Step 2: Replace `Merge-Models` precedence block**

In `Merge-Models`, insert this check as the FIRST branch of the per-provider loop
(above the existing `providers/<provider>/models.json` branch):

```powershell
$ProfileModels = Get-ProfileProviderModels $ProviderName

if ($null -ne $ProfileModels) {
    Set-ObjectProperty $ProviderRoot[$ProviderName] "models" $ProfileModels.models
    $Count = @($ProfileModels.models.PSObject.Properties).Count
    Write-Detail "Provider '$ProviderName': $Count model(s) (profile-level)"
    $Expected[$ProviderName] = $Count
    continue
}
```

The remaining branches (providers/<p>/models.json → inline → global → none) are
unchanged. Non-active providers never enter this loop; their `<provider>-models.json`
is ignored by design (optionally log one detail line per discovered-but-inactive file).

- [ ] **Step 3: Manual verification**

Temp root fixture:
```
profiles/coding/settings.json        -> activeProviders: ["modal", "omniroute"]
profiles/coding/modal-models.json    -> {"models": {"modal/kimi-k3": {"name": "Kimi K3"}}}
providers/modal.json                 -> provider def WITHOUT inline models
providers/omniroute.json             -> real omniroute def
```
Expected: final opencode.json `provider.modal.models` contains exactly
`modal/kimi-k3`; omniroute keeps its own models; non-active provider's
`-models.json` absent from output.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-opencode-v2.5.ps1
git commit -m "feat(v2.5): profile-level <provider>-models.json with highest precedence"
```

---

## Task 5: Verification additions

**Files:**
- Modify: `scripts/build-opencode-v2.5.ps1`

- [ ] **Step 1: Extend `Verify-Models`**

After the existing per-provider model-count check, assert:

```powershell
# Every active provider must have a models source (profile-level, provider folder, inline, or global).
foreach ($ProviderName in $ActiveProviders) {
    $M = $ProviderRoot[$ProviderName].models
    if (-not $M -or @($M.PSObject.Properties).Count -eq 0) {
        throw "Verification failed: active provider '$ProviderName' has no models."
    }
}
```

- [ ] **Step 2: Verify settings.json round-trip**

After writing `opencode.json`, read `$ProfilePath\settings.json` back, assert
`activeProviders` equals `$ActiveProviders` exactly (order included). Fail with a
clear message if mismatch.

- [ ] **Step 3: Run V2.1 harness to confirm no regression**

```powershell
powershell -NoProfile -File scripts\test-opencode-v2.ps1
```

Expected: `Passed 17/17`, `exit 0`.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-opencode-v2.5.ps1
git commit -m "feat(v2.5): verification covers active-provider models + settings round-trip"
```

---

## Task 6: V2.5 test harness

**Files:**
- Create: `scripts/test-opencode-v2.5.ps1`

**Interfaces:**
- Consumes: `build-opencode-v2.5.ps1` via `powershell.exe -NoProfile -File ...` child
  process on temp roots (same pattern as `test-opencode-v2.ps1`'s `Invoke-Builder`)
- Produces: PASS/FAIL report, `exit 0`/`exit 1`; fixture helper `New-V25Root`

- [ ] **Step 1: Reuse harness scaffolding**

Copy the scaffolding from `scripts/test-opencode-v2.ps1`: `New-TestRoot`,
`Remove-TestRoot`, `Write-JsonFile`, `Write-JsonObject`, `Assert-True`,
`Run-Test`, `Invoke-Builder` (pointing at `build-opencode-v2.5.ps1`, always called
with `-NonInteractive` and/or `-Provider`). No test may require real stdin.

- [ ] **Step 2: Write the 10 tests**

Each test is `function Test-X` registered via `Run-Test "name" { Test-X }`:

| # | Test name | What it proves |
|---|---|---|
| 1 | `Test-AllProvidersDiscovered` | 2 valid provider files + `-Provider` lists both; final JSON contains both providers |
| 2 | `Test-MalformedProviderFails` | 1 malformed provider file → nonzero exit, error names the file, no opencode.json written |
| 3 | `Test-NonInteractiveUsesStored` | stored `activeProviders: ["omniroute"]`, `-NonInteractive` → output only omniroute, settings.json unchanged |
| 4 | `Test-ProviderArgSkipsPrompt` | `-Provider omniroute,modal` → output both, settings.json rewritten to that order |
| 5 | `Test-ProviderArgUnknownFails` | `-Provider ghost` → nonzero exit, clear message |
| 6 | `Test-ProfileModelsHighestPrecedence` | profile `modal-models.json` + `providers/modal/models.json` both exist → profile wins in output |
| 7 | `Test-NonActiveProfileModelsIgnored` | `groq-models.json` exists, groq NOT active → absent from output |
| 8 | `Test-SettingsPersistRoundTrip` | run with `-Provider modal,omniroute` → settings.json `activeProviders` exactly `["modal","omniroute"]`, `$schema` preserved |
| 9 | `Test-SettingsBackupCreated` | settings.json differs → backup file exists under `backup/`; original content in backup |
| 10 | `Test-EmptySelectionFails` | `-Provider ""` + `-NonInteractive` with empty stored list → nonzero exit (guard against zero providers) |
| 11 | `Test-ProfileModelsDupKeyFails` | `modal-models.json` with duplicate key → nonzero exit |
| 12 | `Test-BuilderSpecCoversV25` | read-only grep of real `docs/BUILDER_SPEC.md`; assert tokens `Discover-Providers`, `Select-ActiveProviders`, `Persist-ActiveProviders`, `Get-ProfileProviderModels`, `-NonInteractive`, `<provider>-models.json` all present (regeneration-guarantee sync test) |

- [ ] **Step 3: Run harness**

```powershell
powershell -NoProfile -File scripts\test-opencode-v2.5.ps1
```

Expected: `Passed 12/12`, `exit 0`. Iterate until green.

- [ ] **Step 4: Confirm both harnesses green**

```powershell
powershell -NoProfile -File scripts\test-opencode-v2.ps1   # 17/17
powershell -NoProfile -File scripts\test-opencode-v2.5.ps1 # 12/12
```

- [ ] **Step 5: Commit**

```bash
git add scripts/test-opencode-v2.5.ps1
git commit -m "test(v2.5): add test-opencode-v2.5.ps1 harness (12 tests)"
```

---

## Task 7: Spec + docs sync (regeneration source)

**Files:** `BUILDER_SPEC.md`, `JSON_SCHEMAS.md`, `FOLDER_STRUCTURE.md`, `ADAPTER.md`,
`ARCHITECTURE.md`, `TESTING.md`, `README.md`, `PROJECT_STATE.md`

- [ ] **Step 1: `BUILDER_SPEC.md`** — add section "Builder V2.5 (Active-Provider Selector)":
  CLI table (`-Profile`, `-ConfigRoot`, `-Provider`, `-NonInteractive`), stage list
  (Discover → Select/Persist → Load → Validate → Merge → Backup → Generate → Verify →
  Write), function contracts for the 4 new functions (name, params, returns, throw
  conditions), selection rules (menu input grammar, `-Provider` precedence, non-interactive
  behavior), model precedence list (new order), `<provider>-models.json` shape + validation,
  note that non-active providers' model files are ignored, and the regeneration guarantee
  (this spec must fully describe the builder). Update the "Current Builder" line to V2.5.
- [ ] **Step 2: `JSON_SCHEMAS.md`** — document `profiles/<profile>/<provider>-models.json`
  (same shape as `models.json`), updated precedence chain, and settings.json now being
  a builder-writable source file (backed up before write).
- [ ] **Step 3: `FOLDER_STRUCTURE.md`** — add the `<provider>-models.json` file name
  pattern to the profiles/ section; note scripts/ gains `build-opencode-v2.5.ps1` +
  `test-opencode-v2.5.ps1`.
- [ ] **Step 4: `ADAPTER.md`** — model-source table: add profile-level row.
- [ ] **Step 5: `ARCHITECTURE.md`** — stage diagram gains Discovery + Selection stages.
- [ ] **Step 6: `TESTING.md`** — document the V2.5 harness group (12 tests), definition
  of complete now requires both harnesses green.
- [ ] **Step 7: `README.md` / `PROJECT_STATE.md`** — builder version rows → V2.5,
  scripts list updated, status "Active-Provider Selector".
- [ ] **Step 8: Commit**

```bash
git add docs
git commit -m "docs: V2.5 builder spec + profile-level models docs (regeneration source)"
```

---

## Task 8: Real-world validation + release

**Files:** `docs/release_registry.json`, `profiles/coding/settings.json`, generated docs

- [ ] **Step 1: Real coding-profile build**

```powershell
powershell -NoProfile -File scripts\build-opencode-v2.5.ps1 -Profile coding -Provider modal,omniroute
```

Inspect `opencode.json`: `provider.modal.models` contains `modal/kimi-k3`,
omniroute intact, settings.json updated, backup created. Run once interactively to
validate the menu on the real profile.

- [ ] **Step 2: Add registry entry** — `docs/release_registry.json` new top entry:

```json
{
  "version": "2.4.0",
  "builderVersion": "V2.5",
  "date": "2026-08-05",
  "status": "Current",
  "summary": "Builder V2.5 Active-Provider Selector: discovers all providers, interactive active-provider selection persisted to settings.json, profile-level <provider>-models.json with highest precedence.",
  "highlights": [
    "All-provider discovery (providers/*.json)",
    "Interactive active-provider selection persisted to profile settings.json",
    "Profile-level per-provider model files (<provider>-models.json)",
    "-Provider / -NonInteractive CLI switches",
    "12-test V2.5 harness + builder-regeneration guarantee in docs"
  ],
  "newFeatures": [
    "scripts/build-opencode-v2.5.ps1",
    "scripts/test-opencode-v2.5.ps1",
    "profiles/<profile>/<provider>-models.json"
  ],
  "improvements": [
    "Model precedence: profile <provider>-models.json > providers/<p>/models.json > inline > global",
    "settings.json backed up before activeProviders write"
  ],
  "bugFixes": [],
  "breakingChanges": "None",
  "migrationRequired": "No",
  "testingSummary": "17/17 (V2.1) + 12/12 (V2.5) tests passed, exit code 0",
  "knownIssues": "None",
  "docsUpdated": ["BUILDER_SPEC.md", "JSON_SCHEMAS.md", "FOLDER_STRUCTURE.md", "ADAPTER.md", "ARCHITECTURE.md", "TESTING.md", "README.md", "PROJECT_STATE.md", "CHANGELOG.md", "CURRENT_RELEASE.md", "bdf/VERSION.md", "_agent/JOURNEY_TO_V3.md"]
}
```

Also flip existing 2.3.0 entry `status` to `"Previous"`.

- [ ] **Step 3: Show user the registry entry for review** before running the release
  manager (permission rule: user reviews registry edits).
- [ ] **Step 4: Run release manager**

```powershell
powershell -NoProfile -File scripts\release-manager.ps1
```

Verify `CURRENT_RELEASE.md`, `CHANGELOG.md` markers, `bdf/VERSION.md` rows,
`PROJECT_STATE.md` history table regenerated correctly.

- [ ] **Step 5: Full test sweep** — both harnesses green (17/17 + 12/12).
- [ ] **Step 6: Update `_agent/JOURNEY_TO_V3.md`** — tick the side-goal checkbox
  (Active-Provider Selector Builder, registry 2.4.0), update `Updated:` line + `Next:`
  line; Journey Map and Destination untouched.
- [ ] **Step 7: Session log** — append entry to `_agent/SESSION_LOG.md`
  (`Done:`/`Broken:`/`Journey:`/`Next:`/`Learned:`).
- [ ] **Step 8: Commit**

```bash
git add docs profiles
git commit -m "release: Builder V2.5 Active-Provider Selector (registry 2.4.0)"
```

---

## Self-Review Notes

- Spec coverage: Tasks 1-5 = builder features; Task 6 = acceptance oracle incl.
  regeneration sync test; Task 7 = docs (regeneration source); Task 8 = release +
  tracking. No roadmap/journey main-goal edits beyond the side-goal block.
- Type consistency: function names `Discover-Providers`, `Select-ActiveProviders`,
  `Resolve-ActiveProviders`, `Persist-ActiveProviders`, `Get-ProfileProviderModels`
  identical across Tasks 2-7.
- Placeholders: none — every step has concrete content or an explicit copy source
  (V2.1 file, already in repo).

---

# Resume Prompt

Paste this into the next session to continue the build:

```
Read C:\Users\loveb\.config\opencode\docs\AI\BUILD_BUILDER_V2.5_SELECTOR.md

Follow AGENT.md and _agent/SESSION_WORKFLOW.md.
Do NOT restart or redo completed work — trust the plan and its checkboxes.
Run the Verify step first, then continue the build from the unchecked tasks.

Build scripts/build-opencode-v2.5.ps1 (V2.5 Active-Provider Selector builder) and
scripts/test-opencode-v2.5.ps1 (12 tests) completely, per the plan: provider
discovery, interactive selection with settings.json persistence, profile-level
<provider>-models.json with highest precedence, -Provider/-NonInteractive flags,
verification additions, spec sync in BUILDER_SPEC.md and the other listed docs
(regeneration guarantee), then release as registry 2.4.0 via release-manager.ps1.

Keep build-opencode-v2.ps1 and test-opencode-v2.ps1 untouched; both harnesses must
pass (17/17 + 12/12). Update JOURNEY_TO_V3.md side goals and SESSION_LOG.md when
done. If the context budget runs low, write AI/CONTINUE_BUILD_V25_SELECTOR_<STEP>.md
(checkpoint) and give me the new resume prompt.
```
