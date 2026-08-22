# Release Manager V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automated release pipeline so every version release generates consistent release documentation from one machine-readable registry, verified by the test harness.

**Architecture:** `docs/release_registry.json` (human/AI-maintained facts) → `scripts/release-manager.ps1` (generator, all-or-nothing) → generated artifacts: `CHANGELOG.md` marker section, `CURRENT_RELEASE.md`, `bdf/VERSION.md` compatibility table, `PROJECT_STATE.md` version-history table. `scripts/test-opencode-v2.ps1` gains a Release Docs test group that cross-checks registry vs docs.

**Tech Stack:** PowerShell 5.1 (same constraints as the builder: `ConvertFrom-Json` silently drops duplicate keys — raw-text scan required), JSON, Markdown.

## Global Constraints

- PowerShell 5.1 only — no PS 7 syntax (`??`, `?.`, ternary).
- Duplicate JSON keys MUST be detected on raw text (Get-DuplicateJsonKeys pattern from `build-opencode-v2.ps1:171`), never via `ConvertFrom-Json`.
- All-or-nothing failure policy: on any validation failure, exit non-zero, write NOTHING to the real docs repo.
- `release_registry.json` is the ONLY hand-edited release artifact. CHANGELOG marker sections, CURRENT_RELEASE.md, bdf/VERSION.md table, PROJECT_STATE.md table are machine-generated and must never be hand-edited.
- Changelog markers `<!-- AUTO-GENERATED START -->` / `<!-- AUTO-GENERATED END -->` are non-negotiable: if missing, abort.
- History is read-only: legacy CHANGELOG entries (project versions 2.1.0 and older, i.e. pre-Builder-V2.1) are NOT rewritten; rich format starts at project version 2.2.0 (Builder V2.1).
- Scripts live in `C:\Users\loveb\.config\opencode\scripts\` (outside the git repo). Docs live in `C:\Users\loveb\.config\opencode\docs\` (the git repo).
- No versioned script filenames (user instruction): `release-manager.ps1` stays that name forever.
- Tests must run against temp copies (`-ConfigRoot`), never against the real docs repo — except one explicit read-only consistency test on the real docs.
- Build/test commands run with `powershell.exe -NoProfile -ExecutionPolicy Bypass`.

---

### Task 1: Create `docs/release_registry.json` with the V2.1 (project 2.2.0) entry

**Files:**
- Create: `C:\Users\loveb\.config\opencode\docs\release_registry.json`

**Interfaces:**
- Consumes: facts from `docs/CHANGELOG.md` "Version 2.2.0" entry (lines 51-102) and `docs/_agent/SESSION_LOG.md` session 7 entry.
- Produces: `releases[]` array consumed by every later task. Entry object shape:
  `version, builderVersion, date, status, summary, highlights[], newFeatures[], improvements[], bugFixes[], breakingChanges, migrationRequired, testingSummary, knownIssues, docsUpdated[]`

- [ ] **Step 1: Create the registry file**

Content (exact, one entry, newest first — the only "Current"):

```json
{
  "releases": [
    {
      "version": "2.2.0",
      "builderVersion": "V2.1",
      "date": "2026-08-04",
      "status": "Current",
      "summary": "Builder V2.1: extended validation, modular merge pipeline, provider-specific models, output verification, and automated testing.",
      "highlights": [
        "Provider-specific models",
        "Modular merge pipeline",
        "Extended validation",
        "Pre-write output verification",
        "Automated test harness"
      ],
      "newFeatures": [
        "scripts/test-opencode-v2.ps1 - automated test harness (9 tests: valid profile, invalid JSON, missing provider, duplicate model IDs, duplicate model names, duplicate plugins, malformed provider, provider-specific models, backup failure safety)",
        "Provider-specific models: providers/<provider>/models.json takes precedence over inline provider models and global models.json",
        "-ConfigRoot parameter on the builder for isolated test builds",
        "Output verification stage (JSON round-trip, providers, models, plugins, MCP) before writing"
      ],
      "improvements": [
        "Validation extended: duplicate provider/model/plugin/MCP identifiers, duplicate model names, malformed provider and profile definitions, missing required fields, invalid configuration structure",
        "Duplicate-key detection scans raw JSON text (PowerShell 5.1 ConvertFrom-Json silently drops duplicates)",
        "Merge logic split into independent stages: settings, providers, models, plugins, MCP, final",
        "Concise count-based logging (e.g. Provider 'omniroute': 58 model(s))"
      ],
      "bugFixes": [
        "Fixed $Section: here-string parse errors",
        "Fixed unreliable PSObject.Properties.Count checks (wrapped with @())",
        "Fixed plugin single-element array unrolling in output (return ,$Plugins.plugin)",
        "Removed 2 corrupted backups created during intermediate buggy runs"
      ],
      "breakingChanges": "None",
      "migrationRequired": "No",
      "testingSummary": "9/9 tests passed, exit code 0",
      "knownIssues": "None",
      "docsUpdated": [
        "BUILDER_SPEC.md",
        "CHANGELOG.md",
        "PROJECT_STATE.md",
        "TESTING.md",
        "ROADMAP.md",
        "FOLDER_STRUCTURE.md",
        "ARCHITECTURE.md",
        "ADAPTER.md",
        "README.md",
        "bdf/VERSION.md"
      ]
    }
  ]
}
```

- [ ] **Step 2: Validate the file parses and has no duplicate keys**

Run:
```powershell
$j = Get-Content "C:\Users\loveb\.config\opencode\docs\release_registry.json" -Raw | ConvertFrom-Json
$j.releases.Count  # expect 1
$j.releases[0].version  # expect 2.2.0
$j.releases[0].status   # expect Current
```
Then verify no duplicate keys via the raw-text scan (test harness will assert this too).

- [ ] **Step 3: Commit**

```bash
git add docs/release_registry.json
git commit -m "feat: add release registry with Builder V2.1 entry"
```

---

### Task 2: Implement `scripts/release-manager.ps1`

**Files:**
- Create: `C:\Users\loveb\.config\opencode\scripts\release-manager.ps1`
- Reference (do not copy): `C:\Users\loveb\.config\opencode\scripts\build-opencode-v2.ps1:171-248` for `Get-DuplicateJsonKeys`

**Interfaces:**
- Consumes: `docs/release_registry.json` (shape from Task 1), existing `docs/CHANGELOG.md`, `docs/CURRENT_RELEASE.md` (absent at first run → created), `docs/bdf/VERSION.md`, `docs/PROJECT_STATE.md`.
- Produces: regenerated CHANGELOG marker section, CURRENT_RELEASE.md, bdf/VERSION.md compatibility rows, PROJECT_STATE.md marker-wrapped table. Public entry point: script top-level with `param([string]$ConfigRoot = <real docs root>)`. Helper functions (testable): `Load-Registry`, `Validate-Registry`, `Format-RichEntry`, `Format-CurrentRelease`, `Generate-ChangelogSection`, `Generate-VersionTable`, `Update-VersionFile`, `Update-ProjectState`, `Write-IfChanged`, `Verify-Generated`.

- [ ] **Step 1: Write the script skeleton with params and console helpers**

Same header/logging style as the builder (`Write-Header`, `Write-Step`, `Write-Success`, `Write-Failure`). Version header: `OpenCode Release Manager V1`.

```powershell
param(
    [string]$ConfigRoot = (Join-Path $HOME ".config\opencode\docs")
)

$ReleaseManagerVersion = "1.0"

$RegistryPath     = Join-Path $ConfigRoot "release_registry.json"
$ChangelogPath    = Join-Path $ConfigRoot "CHANGELOG.md"
$CurrentRelPath   = Join-Path $ConfigRoot "CURRENT_RELEASE.md"
$VersionFilePath  = Join-Path $ConfigRoot "bdf\VERSION.md"
$ProjectStatePath = Join-Path $ConfigRoot "PROJECT_STATE.md"

$MarkerStart = "<!-- AUTO-GENERATED START -->"
$MarkerEnd   = "<!-- AUTO-GENERATED END -->"
```

- [ ] **Step 2: Implement `Load-Registry` (with duplicate-key scan)**

Copy `Get-DuplicateJsonKeys` verbatim from `build-opencode-v2.ps1:171`. Then:

```powershell
function Load-Registry {

    param([string]$Path)

    if (-not (Test-Path $Path)) { throw "Registry not found: $Path" }

    $Raw = Get-Content $Path -Raw

    $dups = Get-DuplicateJsonKeys $Raw

    if ($dups.Count -gt 0) {

        throw "Duplicate key(s) in release_registry.json: $($dups -join ', ')"
    }

    $Registry = $Raw | ConvertFrom-Json

    if ($null -eq $Registry.releases -or @($Registry.releases).Count -eq 0) {

        throw "release_registry.json has no releases."
    }

    return $Registry
}
```

- [ ] **Step 3: Implement `Validate-Registry`**

```powershell
function Validate-Registry {

    param([object]$Registry)

    $Releases = @($Registry.releases)

    $Required = @(
        "version", "builderVersion", "date", "status", "summary",
        "highlights", "newFeatures", "improvements", "bugFixes",
        "breakingChanges", "migrationRequired", "testingSummary",
        "knownIssues", "docsUpdated"
    )

    $CurrentCount = 0
    $SeenVersions = @{}

    foreach ($R in $Releases) {

        foreach ($Field in $Required) {

            $Prop = $R.PSObject.Properties[$Field]

            if ($null -eq $Prop -or $null -eq $Prop.Value -or "$($Prop.Value)" -eq "") {

                throw "Registry entry $($R.version) is missing required field: $Field"
            }
        }

        if ($SeenVersions.ContainsKey($R.version)) {

            throw "Duplicate version in registry: $($R.version)"
        }

        $SeenVersions[$R.version] = $true

        if ($R.status -eq "Current") { $CurrentCount++ }

        if ($R.status -notin @("Current", "Previous", "Legacy")) {

            throw "Invalid status '$($R.status)' for version $($R.version)"
        }
    }

    if ($CurrentCount -ne 1) {

        throw "Registry must have exactly one Current release (found $CurrentCount)."
    }
}
```

- [ ] **Step 4: Implement `Format-RichEntry`**

Produces the rich CHANGELOG entry. Follow the EXACT existing CHANGELOG style (h1 `# Version X.Y.Z`, `## Status` etc., code-fenced values, `---` separators):

```powershell
function Format-RichEntry {

    param([object]$R)

    $Lines = @()

    $Lines += "# Version $($R.version)"
    $Lines += ""
    $Lines += "## Status"
    $Lines += ""
    $Lines += $R.status
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Date"
    $Lines += ""
    $Lines += "```"
    $Lines += $R.date
    $Lines += "```"
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Summary"
    $Lines += ""
    $Lines += $R.summary
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Highlights"
    $Lines += ""
    foreach ($Item in @($R.highlights)) { $Lines += "- $Item" }
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## New Features"
    $Lines += ""
    foreach ($Item in @($R.newFeatures)) { $Lines += "- $Item" }
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Improvements"
    $Lines += ""
    foreach ($Item in @($R.improvements)) { $Lines += "- $Item" }
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Bug Fixes"
    $Lines += ""
    foreach ($Item in @($R.bugFixes)) { $Lines += "- $Item" }
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Breaking Changes"
    $Lines += ""
    $Lines += $R.breakingChanges
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Migration Required"
    $Lines += ""
    $Lines += $R.migrationRequired
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Testing Summary"
    $Lines += ""
    $Lines += $R.testingSummary
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Known Issues"
    $Lines += ""
    $Lines += $R.knownIssues
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "## Documentation"
    $Lines += ""
    $Lines += "Updated"
    $Lines += ""
    foreach ($Item in @($R.docsUpdated)) { $Lines += "- $Item" }

    return $Lines -join "`r`n"
}
```

- [ ] **Step 5: Implement `Format-CurrentRelease`**

```powershell
function Format-CurrentRelease {

    param([object]$R)

    $Lines = @()

    $Lines += "# Current Release"
    $Lines += ""
    $Lines += "> Quick reference for the current release of the OpenCode Configuration Manager."
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "Builder Version"
    $Lines += ""
    $Lines += "```"
    $Lines += $R.builderVersion
    $Lines += "```"
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "Project Version"
    $Lines += ""
    $Lines += "```"
    $Lines += $R.version
    $Lines += "```"
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "Release Date"
    $Lines += ""
    $Lines += "```"
    $Lines += $R.date
    $Lines += "```"
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "Current Status"
    $Lines += ""
    $Lines += "```"
    $Lines += $R.status
    $Lines += "```"
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "Migration Required"
    $Lines += ""
    $Lines += "```"
    $Lines += $R.migrationRequired
    $Lines += "```"
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "Testing"
    $Lines += ""
    $Lines += "```"
    $Lines += $R.testingSummary
    $Lines += "```"
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "Known Issues"
    $Lines += ""
    $Lines += "```"
    $Lines += $R.knownIssues
    $Lines += "```"
    $Lines += ""
    $Lines += "---"
    $Lines += ""
    $Lines += "**Document Version:** 1.0"
    $Lines += ""
    $Lines += "**Status:** Generated by Release Manager - do not edit manually"

    return $Lines -join "`r`n"
}
```

- [ ] **Step 6: Implement `Generate-ChangelogSection`**

Replaces only the marker section. Preserves everything above `<!-- AUTO-GENERATED START -->` and below `<!-- AUTO-GENERATED END -->`. Aborts if markers are missing.

```powershell
function Generate-ChangelogSection {

    param(
        [string]$Content,
        [object[]]$Releases
    )

    $StartIdx = $Content.IndexOf($MarkerStart)
    $EndIdx   = $Content.IndexOf($MarkerEnd)

    if ($StartIdx -lt 0 -or $EndIdx -lt 0) {

        throw "CHANGELOG.md is missing AUTO-GENERATED markers. Add '$MarkerStart' and '$MarkerEnd' first."
    }

    $Entries = @()

    foreach ($R in $Releases) { $Entries += Format-RichEntry $R }

    $Section = @(
        $MarkerStart
        ""
        ($Entries -join "`r`n`r`n---`r`n`r`n")
        $MarkerEnd
    ) -join "`r`n"

    $Before = $Content.Substring(0, $StartIdx)
    $After  = $Content.Substring($EndIdx + $MarkerEnd.Length)

    return $Before + $Section + $After
}
```

- [ ] **Step 7: Implement `Generate-VersionTable`**

Markdown table rows from registry (used in PROJECT_STATE.md):

```powershell
function Generate-VersionTable {

    param([object[]]$Releases)

    $Lines = @(
        "| Version | Status | Description |"
        "|----------|--------|-------------|"
    )

    foreach ($R in $Releases) {

        $Lines += "| $($R.version) | $($R.status) | $($R.summary) |"
    }

    return $Lines -join "`r`n"
}
```

- [ ] **Step 8: Implement `Update-ProjectState`**

Replaces the marker-wrapped table inside PROJECT_STATE.md (the table under `## Version History`). Same replace logic as `Generate-ChangelogSection`: find markers, rebuild section as `marker + table + marker`, preserve before/after. Abort if markers missing.

```powershell
function Update-ProjectState {

    param(
        [string]$Content,
        [object[]]$Releases
    )

    $StartIdx = $Content.IndexOf($MarkerStart)
    $EndIdx   = $Content.IndexOf($MarkerEnd)

    if ($StartIdx -lt 0 -or $EndIdx -lt 0) {

        throw "PROJECT_STATE.md is missing AUTO-GENERATED markers. Add '$MarkerStart' and '$MarkerEnd' first."
    }

    $Table = Generate-VersionTable -Releases $Releases

    $Section = @(
        $MarkerStart
        $Table
        $MarkerEnd
    ) -join "`r`n"

    $Before = $Content.Substring(0, $StartIdx)
    $After  = $Content.Substring($EndIdx + $MarkerEnd.Length)

    return $Before + $Section + $After
}
```

- [ ] **Step 9: Implement `Update-VersionFile`**

Updates ONLY the compatibility table rows in `bdf/VERSION.md`:

1. `Supported Builder Versions` row → `Builder V2, Builder V2.1` etc., from registry `builderVersion` values in release order (e.g. `Builder V2, Builder V2.1`). Regenerate as comma-joined list of unique `builderVersion` values.
2. `Last Updated` row → the `date` of the Current release.
3. Rows: Framework Version, Compatible Projects, Breaking Changes, Migration Required → left untouched.
4. Use `[regex]::Replace` on the specific row line: `(?m)^\| Supported Builder Versions \|.*$` and `(?m)^\| Last Updated \|.*$`. If a row pattern is not found, throw (abort — never guess).

```powershell
function Update-VersionFile {

    param(
        [string]$Content,
        [object[]]$Releases
    )

    $CurrentEntry = $Releases | Where-Object { $_.status -eq "Current" }

    if ($null -eq $CurrentEntry) { throw "No Current release found for VERSION.md update." }

    $BuilderVersions = @()

    foreach ($R in $Releases) {

        if ($BuilderVersions -notcontains $R.builderVersion) {

            $BuilderVersions += $R.builderVersion
        }
    }

    $SupportedRow = "| Supported Builder Versions | $($BuilderVersions -join ', ') |"
    $UpdatedRow   = "| Last Updated | $($CurrentEntry.date) |"

    # Verify both rows exist BEFORE touching content (abort rather than guess)
    if (-not [regex]::IsMatch($Content, "(?m)^\| Supported Builder Versions \|.*$")) {

        throw "bdf/VERSION.md is missing the Supported Builder Versions row."
    }

    if (-not [regex]::IsMatch($Content, "(?m)^\| Last Updated \|.*$")) {

        throw "bdf/VERSION.md is missing the Last Updated row."
    }

    $NewContent = [regex]::Replace($Content, "(?m)^\| Supported Builder Versions \|.*$", $SupportedRow)
    $NewContent = [regex]::Replace($NewContent, "(?m)^\| Last Updated \|.*$", $UpdatedRow)

    return $NewContent
}
```

- [ ] **Step 10: Implement `Write-IfChanged`**

Only writes a file when its content actually differs, to keep output deterministic and avoid pointless mtime churn. Returns `$true` if written, `$false` if unchanged.

```powershell
function Write-IfChanged {

    param(
        [string]$Path,
        [string]$Content
    )

    if (Test-Path $Path) {

        $Existing = Get-Content $Path -Raw

        if ($Existing -eq $Content) { return $false }
    }

    $Dir = Split-Path $Path

    if (-not (Test-Path $Dir)) { New-Item -ItemType Directory -Path $Dir -Force | Out-Null }

    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))

    return $true
}
```

Note: PowerShell 5.1 `Set-Content -Encoding UTF8` writes a BOM — the existing docs files use no BOM. `[System.IO.File]::WriteAllText` with `UTF8Encoding($false)` is required to match existing file encoding byte-for-byte.

- [ ] **Step 11: Implement `Verify-Generated` (post-write validation)**

Re-read each written file and assert:

```powershell
function Verify-Generated {

    param(
        [string]$ChangelogContent,
        [object]$Registry
    )

    $Releases = @($Registry.releases)

    foreach ($R in $Releases) {

        if (-not $ChangelogContent.Contains("# Version $($R.version)")) {

            throw "Post-write verification failed: CHANGELOG missing version $($R.version)"
        }
    }

    $CurrentCount = ([regex]::Matches($ChangelogContent, "(?m)^## Status`r?`n`r?`nCurrent$")).Count

    if ($CurrentCount -ne 1) {

        throw "Post-write verification failed: CHANGELOG must have exactly one Current entry (found $CurrentCount)."
    }
}
```

- [ ] **Step 12: Wire the top-level pipeline (all-or-nothing)**

```powershell
$ErrorActionPreference = "Stop"

Write-Header

try {

    Write-Step "Load registry"
    $Registry = Load-Registry -Path $RegistryPath

    Write-Step "Validate registry"
    Validate-Registry -Registry $Registry

    $Releases = @($Registry.releases)

    Write-Step "Generate CHANGELOG section"
    $ChangelogContent = Get-Content $ChangelogPath -Raw
    $NewChangelog     = Generate-ChangelogSection -Content $ChangelogContent -Releases $Releases

    Write-Step "Generate CURRENT_RELEASE.md"
    $CurrentEntry = $Releases | Where-Object { $_.status -eq "Current" }
    $CurrentDoc   = Format-CurrentRelease $CurrentEntry

    Write-Step "Generate PROJECT_STATE version table"
    $ProjectStateContent = Get-Content $ProjectStatePath -Raw
    $NewProjectState     = Update-ProjectState -Content $ProjectStateContent -Releases $Releases

    Write-Step "Update bdf/VERSION.md compatibility rows"
    $VersionFileContent = Get-Content $VersionFilePath -Raw
    $NewVersionFile     = Update-VersionFile -Content $VersionFileContent -Releases $Releases

    Write-Step "Verify generated output before writing"
    Verify-Generated -ChangelogContent $NewChangelog -Registry $Registry

    Write-Step "Write files (all-or-nothing)"
    $Written = @()

    if (Write-IfChanged -Path $ChangelogPath -Content $NewChangelog)   { $Written += "CHANGELOG.md" }
    if (Write-IfChanged -Path $CurrentRelPath -Content $CurrentDoc)    { $Written += "CURRENT_RELEASE.md" }
    if (Write-IfChanged -Path $ProjectStatePath -Content $NewProjectState) { $Written += "PROJECT_STATE.md" }
    if (Write-IfChanged -Path $VersionFilePath -Content $NewVersionFile)   { $Written += "bdf/VERSION.md" }

    Write-Success "Release generated."

    if ($Written.Count -eq 0) {

        Write-Detail "All outputs already up to date - nothing written."
    }
    else {

        Write-Detail "Written: $($Written -join ', ')"
    }

    exit 0
}
catch {

    Write-Failure $_.Exception.Message

    exit 1
}
```

Note on atomicity: all generation and post-write verification happens BEFORE any file write. The only residual risk is a mid-write IO failure across 4 files, which `Write-IfChanged` cannot make fully atomic; document this in the header comment. Backup of generated files is NOT created (they are regenerable artifacts; `release_registry.json` is the source of truth).

- [ ] **Step 13: Smoke test against a temp docs copy**

Create a temp dir, copy the real docs tree into it, add markers to the temp CHANGELOG/PROJECT_STATE (real marker insertion happens in Task 3), then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\loveb\.config\opencode\scripts\release-manager.ps1" -ConfigRoot <tempdir>
```

Expected: exit 0, "Release generated.", written file list. Run a second time: exit 0, "already up to date - nothing written" (deterministic check). Inspect temp CHANGELOG: marker section contains the rich V2.2.0 entry; content above/below markers untouched.

- [ ] **Step 14: Commit**

```powershell
# scripts/ is outside the git repo; nothing to commit here.
# Note in the next task's commit that release-manager.ps1 was created.
```

---

### Task 3: Migrate `docs/CHANGELOG.md` to marker format (rich 2.2.0 entry, legacy history preserved)

> USER RULING 2026-08-04: PROJECT_STATE.md markers are inserted in THIS task, not Task 5. Reason: the release manager's pipeline also regenerates PROJECT_STATE.md's marker-wrapped table and aborts when its markers are absent — Task 3's manager run cannot succeed otherwise. End state identical; Task 4 becomes verification-only; Task 5 re-verifies.

**Files:**
- Modify: `C:\Users\loveb\.config\opencode\docs\CHANGELOG.md`
- Modify: `C:\Users\loveb\.config\opencode\docs\PROJECT_STATE.md` (markers only, per original Task 5 Step 1 spec)

**Interfaces:**
- Consumes: marker section format from Task 2 Step 6, registry entry from Task 1.
- Produces: marker-wrapped CHANGELOG + PROJECT_STATE that Task 2's `Generate-ChangelogSection` / `Update-ProjectState` can regenerate safely.

- [ ] **Step 1: Add the AUTO-GENERATED markers to CHANGELOG.md**

Insert `<!-- AUTO-GENERATED START -->` immediately before the `# Version 2.2.0` heading (currently line 51), and `<!-- AUTO-GENERATED END -->` immediately after the `## Documentation / Updated / - bdf/VERSION.md` block that closes the 2.2.0 entry (before line 104's `# Version 2.1.0`).

Layout result:

```markdown
# CHANGELOG

> Chronological history of the OpenCode Configuration Manager.

--- (Purpose, Versioning Policy - UNTOUCHED manual prose)

<!-- AUTO-GENERATED START -->
(generated rich entries - replaced on every release run)
<!-- AUTO-GENERATED END -->

# Version 2.1.0
... (legacy entries 2.1.0, 2.0.3, 2.0.2, 2.0.1, 2.0.0, 1.0.0 stay EXACTLY as they are - history is read-only)
```

- [ ] **Step 1b: Add the AUTO-GENERATED markers to PROJECT_STATE.md** (pulled forward per USER RULING)

Insert `<!-- AUTO-GENERATED START -->` right after the `## Version History` heading (line 54) and `<!-- AUTO-GENERATED END -->` right after the final table row `| 1.0.0 | Legacy | Initial project implementation |` (line 64). The generated section becomes `marker + table + marker`; the `---` separator after the table stays outside the markers.

- [ ] **Step 2: Run the release manager against the real docs repo**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\loveb\.config\opencode\scripts\release-manager.ps1"
```

Expected: exit 0; the hand-written `# Version 2.2.0` entry (lines 51-102) is replaced by the rich entry (Status/Date/Summary/Highlights/New Features/Improvements/Bug Fixes/Breaking Changes/Migration Required/Testing Summary/Known Issues/Documentation), everything else preserved. Also generated by this same run (consequence of the ruling): `docs/CURRENT_RELEASE.md` is created (Task 4 verifies it), PROJECT_STATE.md's table is regenerated (1 row: 2.2.0/Current), bdf/VERSION.md `Supported Builder Versions` row becomes `V2.1` and `Last Updated` stays `2026-08-04`.

- [ ] **Step 3: Verify legacy entries untouched**

The git working tree already carries unrelated uncommitted changes from earlier sessions, so `git diff` vs HEAD cannot isolate this task's changes. Instead: compare pre-run byte snapshots against post-run content (controller stores pre-run copies under `.superpowers/sdd/PLAN_RELEASE_MANAGER/snapshots/`). Expected: the ONLY differences are the marker insertions, the 2.2.0 entry replacement in CHANGELOG, and the marker-wrapped table replacement in PROJECT_STATE. The legacy CHANGELOG entries 2.1.0 → 1.0.0 and the Version History table must be byte-identical. If they differ, revert and re-run (the generator must not touch them).

- [ ] **Step 4: Commit**

```bash
git add docs/CHANGELOG.md
git commit -m "docs: convert CHANGELOG to release-manager marker format (rich entry for V2.1)"
```

NOTE (user standing instruction): no per-task commits — SKIPPED; user commits at end.

---

### Task 4: Create `docs/CURRENT_RELEASE.md`

> USER RULING 2026-08-04: CURRENT_RELEASE.md is already created by Task 3's release-manager run (markers pulled forward). This task is verification-only.

**Files:**
- Verify: `C:\Users\loveb\.config\opencode\docs\CURRENT_RELEASE.md`

**Interfaces:**
- Consumes: `Format-CurrentRelease` output from Task 2 Step 5.

- [ ] **Step 1: Verify the file generated by Task 3's run**

```powershell
Get-Content "C:\Users\loveb\.config\opencode\docs\CURRENT_RELEASE.md"
```

Expected: Current Release doc with Builder Version `V2.1`, Project Version `2.2.0`, Release Date `2026-08-04`, Status `Current`, Migration Required `No`, Testing `9/9 tests passed, exit code 0`, Known Issues `None`, and the "Generated by Release Manager - do not edit manually" footer.

- [ ] **Step 2: Commit**

```bash
git add docs/CURRENT_RELEASE.md
git commit -m "docs: add CURRENT_RELEASE.md quick reference"
```

---

### Task 5: Add markers to `docs/PROJECT_STATE.md` and update `docs/bdf/VERSION.md`

**Files:**
- Modify: `C:\Users\loveb\.config\opencode\docs\PROJECT_STATE.md` (section 2, `## Version History` table, lines 54-64)
- Modify: `C:\Users\loveb\.config\opencode\docs\bdf\VERSION.md` (compatibility table rows)

**Interfaces:**
- Consumes: `Update-ProjectState` (Task 2 Step 8) and `Update-VersionFile` (Task 2 Step 9).

- [ ] **Step 1: Add markers around the PROJECT_STATE version history table**

> USER RULING 2026-08-04: ALREADY DONE in Task 3 Step 1b. Verify placement instead: `<!-- AUTO-GENERATED START -->` sits right after the `## Version History` heading (line 54) and `<!-- AUTO-GENERATED END -->` right after the final table row `| 1.0.0 | Legacy | Initial project implementation |` (line 64). The generated section is `marker + table + marker`; the `---` separator after the table stays outside the markers.

- [ ] **Step 2: Run the release manager**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\loveb\.config\opencode\scripts\release-manager.ps1"
```

Expected: exit 0; since Task 3 already ran it, this run typically reports "All outputs already up to date - nothing written." PROJECT_STATE table is the 1-row registry table (`| 2.2.0 | Current | Builder V2.1: extended validation, modular merge pipeline, provider-specific models, output verification, and automated testing. |`); bdf/VERSION.md `Supported Builder Versions` row is `V2.1` (USER RULING 2026-08-04: registry is the sequence authority; the legacy "Builder V2" support fact stays in the manual Compatibility Notes prose, which is untouched), `Last Updated` row `2026-08-04`.

- [ ] **Step 3: Verify only intended changes**

The git working tree already carries unrelated uncommitted changes, so compare against the pre-task snapshots under `.superpowers/sdd/PLAN_RELEASE_MANAGER/snapshots/` (see Task 3 Step 3). Expected: PROJECT_STATE change vs snapshot = markers + table replacement only. VERSION.md change vs snapshot = `Supported Builder Versions` row replaced (`Builder V2, Builder V2.1` → `V2.1`, per USER RULING 2026-08-04) and `Last Updated` row unchanged (already `2026-08-04`). Nothing else.

- [ ] **Step 4: Commit**

```bash
git add docs/PROJECT_STATE.md docs/bdf/VERSION.md
git commit -m "docs: wire PROJECT_STATE and VERSION.md to release manager"
```

---

### Task 6: Delete `docs/RELEASE_NOTES_V2.1.md`

**Files:**
- Delete: `C:\Users\loveb\.config\opencode\docs\RELEASE_NOTES_V2.1.md`

**Interfaces:**
- Consumes: decision from brainstorming — single rich CHANGELOG replaces separate release notes files.

- [ ] **Step 1: Delete the file**

```powershell
Remove-Item "C:\Users\loveb\.config\opencode\docs\RELEASE_NOTES_V2.1.md"
```

- [ ] **Step 2: Commit**

```bash
git add -A docs/RELEASE_NOTES_V2.1.md
git commit -m "docs: remove RELEASE_NOTES_V2.1.md (rich CHANGELOG replaces it)"
```

---

### Task 7: Add the Release Docs test group to `scripts/test-opencode-v2.ps1`

**Files:**
- Modify: `C:\Users\loveb\.config\opencode\scripts\test-opencode-v2.ps1` (append new tests + runner lines; keep existing 9 tests untouched)

**Interfaces:**
- Consumes: `scripts/release-manager.ps1` (Task 2), registry (Task 1), docs layout (Tasks 3-5).
- Produces: tests 10-17 (named below), runnable via the same `Run-Test` helper. New helper `Invoke-ReleaseManager` (mirrors `Invoke-Builder`) and `Copy-DocsToTemp`.

- [ ] **Step 1: Add helper `Copy-DocsToTemp`**

Copies the real docs tree into a temp root so release tests never touch the real repo (except test 17):

```powershell
function Copy-DocsToTemp {

    param(
        [string]$Root
    )

    $RealDocs = Join-Path $RealConfigRoot "docs"

    Copy-Item `
        -Path (Join-Path $RealDocs "*") `
        -Destination $Root `
        -Recurse -Force

    return $Root
}
```

- [ ] **Step 2: Add helper `Invoke-ReleaseManager`**

```powershell
function Invoke-ReleaseManager {

    param(
        [string]$Root
    )

    $ManagerPath = Join-Path $PSScriptRoot "release-manager.ps1"

    $Output = & powershell.exe `
        -NoProfile `
        -ExecutionPolicy Bypass `
        -File $ManagerPath `
        -ConfigRoot $Root 2>&1 | Out-String

    return [pscustomobject]@{
        ExitCode = $LASTEXITCODE
        Output   = $Output
    }
}
```

- [ ] **Step 3: Test 10 - "Registry has valid shape"**

```powershell
function Test-RegistryShape {

    $Root = New-TestRoot
    try {

        Copy-DocsToTemp $Root

        $RegistryPath = Join-Path $Root "release_registry.json"

        Assert-True (Test-Path $RegistryPath) "release_registry.json missing"

        $Registry = Get-Content $RegistryPath -Raw | ConvertFrom-Json

        $Releases = @($Registry.releases)

        Assert-True ($Releases.Count -ge 1) "No releases in registry"

        $Current = @($Releases | Where-Object { $_.status -eq "Current" })

        Assert-True ($Current.Count -eq 1) "Registry must have exactly one Current (found $($Current.Count))"

        foreach ($R in $Releases) {

            Assert-True ($R.PSObject.Properties["version"].Value -match "^\d+\.\d+\.\d+$") "Bad version format: $($R.version)"
            Assert-True ($R.PSObject.Properties["summary"].Value) "Missing summary for $($R.version)"
        }

        # Version numbering must be strictly descending (newest first) - no gaps or reversals
        for ($i = 1; $i -lt $Releases.Count; $i++) {

            $Newer = $Releases[$i - 1].version -split "\." | ForEach-Object { [int]$_ }
            $Older = $Releases[$i].version     -split "\." | ForEach-Object { [int]$_ }

            $NewerDesc = $Newer -join "."
            $OlderDesc = $Older -join "."

            # compare part by part numerically
            for ($p = 0; $p -lt 3; $p++) {

                if ($Newer[$p] -gt $Older[$p]) { break }
                if ($Newer[$p] -lt $Older[$p]) {

                    throw "Version order broken: $NewerDesc appears after $OlderDesc"
                }
            }

            if ($NewerDesc -eq $OlderDesc) {

                throw "Duplicate version in registry: $NewerDesc"
            }
        }

        $Dups = Get-DuplicateJsonKeys -Json (Get-Content $RegistryPath -Raw)

        Assert-True ($Dups.Count -eq 0) "Duplicate JSON keys in registry: $($Dups -join ', ')"
    }
    finally {

        Remove-TestRoot $Root
    }
}
```

Note: `Get-DuplicateJsonKeys` must be copied into the test script (it is a builder function; tests cannot invoke the builder's private functions).

- [ ] **Step 4: Test 11 - "Release manager generates all outputs"**

```powershell
function Test-ReleaseManagerOutputs {

    $Root = New-TestRoot
    try {

        Copy-DocsToTemp $Root

        $Result = Invoke-ReleaseManager $Root

        Assert-True ($Result.ExitCode -eq 0) "release-manager failed: $($Result.Output)"

        Assert-True (Test-Path (Join-Path $Root "CURRENT_RELEASE.md")) "CURRENT_RELEASE.md not generated"

        $Changelog = Get-Content (Join-Path $Root "CHANGELOG.md") -Raw

        Assert-True ($Changelog.Contains("<!-- AUTO-GENERATED START -->")) "CHANGELOG missing START marker"
        Assert-True ($Changelog.Contains("<!-- AUTO-GENERATED END -->")) "CHANGELOG missing END marker"

        $Registry = Get-Content (Join-Path $Root "release_registry.json") -Raw | ConvertFrom-Json

        foreach ($R in @($Registry.releases)) {

            Assert-True ($Changelog.Contains("# Version $($R.version)")) "CHANGELOG missing entry for $($R.version)"
        }
    }
    finally {

        Remove-TestRoot $Root
    }
}
```

- [ ] **Step 5: Test 12 - "Release manager is deterministic"**

```powershell
function Test-ReleaseManagerDeterministic {

    $Root = New-TestRoot
    try {

        Copy-DocsToTemp $Root

        $First  = Invoke-ReleaseManager $Root
        $Second = Invoke-ReleaseManager $Root

        Assert-True ($First.ExitCode -eq 0) "First run failed: $($First.Output)"
        Assert-True ($Second.ExitCode -eq 0) "Second run failed: $($Second.Output)"

        $Hash1 = (Get-FileHash (Join-Path $Root "CHANGELOG.md")).Hash
        $Hash2 = (Get-FileHash (Join-Path $Root "CHANGELOG.md")).Hash

        Assert-True ($Hash1 -eq $Hash2) "CHANGELOG not deterministic across runs"

        $Cur1 = Get-Content (Join-Path $Root "CURRENT_RELEASE.md") -Raw
        $Cur2 = Get-Content (Join-Path $Root "CURRENT_RELEASE.md") -Raw

        Assert-True ($Cur1 -eq $Cur2) "CURRENT_RELEASE.md not deterministic"
    }
    finally {

        Remove-TestRoot $Root
    }
}
```

- [ ] **Step 6: Test 13 - "CURRENT_RELEASE matches registry Current entry"**

```powershell
function Test-CurrentReleaseMatchesRegistry {

    $Root = New-TestRoot
    try {

        Copy-DocsToTemp $Root

        $Result = Invoke-ReleaseManager $Root
        Assert-True ($Result.ExitCode -eq 0) "release-manager failed: $($Result.Output)"

        $Registry = Get-Content (Join-Path $Root "release_registry.json") -Raw | ConvertFrom-Json
        $Current  = @($Registry.releases | Where-Object { $_.status -eq "Current" })[0]

        $Doc = Get-Content (Join-Path $Root "CURRENT_RELEASE.md") -Raw

        Assert-True ($Doc.Contains($Current.builderVersion)) "CURRENT_RELEASE missing builderVersion $($Current.builderVersion)"
        Assert-True ($Doc.Contains($Current.version))         "CURRENT_RELEASE missing project version $($Current.version)"
        Assert-True ($Doc.Contains($Current.date))            "CURRENT_RELEASE missing date $($Current.date)"
        Assert-True ($Doc.Contains($Current.testingSummary))  "CURRENT_RELEASE missing testing summary"
    }
    finally {

        Remove-TestRoot $Root
    }
}
```

- [ ] **Step 7: Test 14 - "Registry and CHANGELOG are consistent (legacy preserved)"**

```powershell
function Test-RegistryChangelogConsistent {

    $Root = New-TestRoot
    try {

        Copy-DocsToTemp $Root

        $Result = Invoke-ReleaseManager $Root
        Assert-True ($Result.ExitCode -eq 0) "release-manager failed: $($Result.Output)"

        $Registry  = Get-Content (Join-Path $Root "release_registry.json") -Raw | ConvertFrom-Json
        $Changelog = Get-Content (Join-Path $Root "CHANGELOG.md") -Raw

        foreach ($R in @($Registry.releases)) {

            Assert-True ($Changelog.Contains("# Version $($R.version)")) "CHANGELOG missing registry version $($R.version)"
            Assert-True ($Changelog.Contains($R.summary)) "CHANGELOG missing summary for $($R.version)"
        }

        # Legacy entries (pre-V2.1 project versions) must still exist and be untouched
        foreach ($Legacy in @("2.1.0", "2.0.3", "2.0.2", "2.0.1", "2.0.0", "1.0.0")) {

            Assert-True ($Changelog.Contains("# Version $Legacy")) "Legacy entry $Legacy was lost"
        }

        # Generated section count: exactly one Current status line in the marker region
        $StartIdx = $Changelog.IndexOf("<!-- AUTO-GENERATED START -->")
        $EndIdx   = $Changelog.IndexOf("<!-- AUTO-GENERATED END -->")

        Assert-True ($StartIdx -ge 0 -and $EndIdx -gt $StartIdx) "Markers missing or misordered"

        $GenSection = $Changelog.Substring($StartIdx, $EndIdx - $StartIdx)

        # NOTE: generated sections are CRLF-joined; `$` must allow the trailing \r (USER RULING 2026-08-04)
        $CurrentCount = ([regex]::Matches($GenSection, "(?m)^Current`r?$")).Count

        Assert-True ($CurrentCount -eq 1) "Generated section must have exactly one Current entry (found $CurrentCount)"
    }
    finally {

        Remove-TestRoot $Root
    }
}
```

- [ ] **Step 8: Test 15 - "VERSION.md compatibility rows updated"**

```powershell
function Test-VersionFileRows {

    $Root = New-TestRoot
    try {

        Copy-DocsToTemp $Root

        $Result = Invoke-ReleaseManager $Root
        Assert-True ($Result.ExitCode -eq 0) "release-manager failed: $($Result.Output)"

        $VersionDoc = Get-Content (Join-Path $Root "bdf\VERSION.md") -Raw

        $Registry = Get-Content (Join-Path $Root "release_registry.json") -Raw | ConvertFrom-Json
        $Current  = @($Registry.releases | Where-Object { $_.status -eq "Current" })[0]

        Assert-True ($VersionDoc.Contains($Current.date)) "VERSION.md Last Updated row missing date $($Current.date)"

        # Last Updated must be the Current release date
        $Row = ([regex]::Match($VersionDoc, "(?m)^\| Last Updated \| .*$")).Value
        Assert-True ($Row.Contains($Current.date)) "VERSION.md Last Updated row wrong: $Row"
    }
    finally {

        Remove-TestRoot $Root
    }
}
```

- [ ] **Step 9: Test 16 - "Failure policy: missing markers abort without writing"**

```powershell
function Test-MissingMarkersAbort {

    $Root = New-TestRoot
    try {

        Copy-DocsToTemp $Root

        $ChangelogPath = Join-Path $Root "CHANGELOG.md"

        # Remove the START marker to simulate a corrupted/misconfigured file
        $Content = Get-Content $ChangelogPath -Raw
        $Content = $Content.Replace("<!-- AUTO-GENERATED START -->", "<!-- LOST -->")
        Set-Content -Path $ChangelogPath -Value $Content -Encoding UTF8

        $BeforeHash = (Get-FileHash $ChangelogPath).Hash

        $Result = Invoke-ReleaseManager $Root

        Assert-True ($Result.ExitCode -ne 0) "release-manager should fail when markers are missing"

        $AfterHash = (Get-FileHash $ChangelogPath).Hash

        Assert-True ($BeforeHash -eq $AfterHash) "CHANGELOG was modified despite failure"
    }
    finally {

        Remove-TestRoot $Root
    }
}
```

- [ ] **Step 10: Test 17 - "Real docs are consistent (read-only)"**

This is the ONLY test that inspects the real docs repo — it never writes to it:

```powershell
function Test-RealDocsConsistent {

    $RealDocs = Join-Path $RealConfigRoot "docs"

    Assert-True (Test-Path (Join-Path $RealDocs "release_registry.json")) "Real release_registry.json missing"

    $Registry  = Get-Content (Join-Path $RealDocs "release_registry.json") -Raw | ConvertFrom-Json
    $Changelog = Get-Content (Join-Path $RealDocs "CHANGELOG.md") -Raw
    $Current   = Get-Content (Join-Path $RealDocs "CURRENT_RELEASE.md") -Raw

    foreach ($R in @($Registry.releases)) {

        Assert-True ($Changelog.Contains("# Version $($R.version)")) "Real CHANGELOG missing registry version $($R.version)"
    }

    $CurrentEntry = @($Registry.releases | Where-Object { $_.status -eq "Current" })[0]

    Assert-True ($Current.Contains($CurrentEntry.version)) "Real CURRENT_RELEASE.md out of date"
}
```

- [ ] **Step 11: Register the new tests in the runner**

Add before the summary block (after the existing 9 `Run-Test` lines):

```powershell
Run-Test "Registry has valid shape"             { Test-RegistryShape }
Run-Test "Release manager generates outputs"    { Test-ReleaseManagerOutputs }
Run-Test "Release manager deterministic"        { Test-ReleaseManagerDeterministic }
Run-Test "CURRENT_RELEASE matches registry"     { Test-CurrentReleaseMatchesRegistry }
Run-Test "Registry and CHANGELOG consistent"    { Test-RegistryChangelogConsistent }
Run-Test "VERSION.md rows updated"              { Test-VersionFileRows }
Run-Test "Missing markers abort safely"         { Test-MissingMarkersAbort }
Run-Test "Real docs consistent (read-only)"     { Test-RealDocsConsistent }
```

Also update the test harness header comment (Tests list at the top) to reflect 17 tests.

- [ ] **Step 12: Run the full harness**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\loveb\.config\opencode\scripts\test-opencode-v2.ps1"
```

Expected: 17/17 PASSED, exit 0. If a Release Docs test fails, fix the script (never weaken the test). Real docs test (17) is read-only and must pass with the migrated docs from Tasks 3-5.

- [ ] **Step 13: Commit**

```powershell
# scripts/ is outside the git repo; the harness change is not committed via git.
# Record the harness result in the session log (Task 10).
```

---

### Task 8: Update the docs that reference the release pipeline

**Files:**
- Modify (all in `C:\Users\loveb\.config\opencode\docs\`): `BUILDER_SPEC.md`, `FOLDER_STRUCTURE.md`, `ARCHITECTURE.md`, `TESTING.md`, `README.md`, `ROADMAP.md`, `ADAPTER.md`, `PROJECT_STATE.md` (section 7 AI Workflow + section 8 Documentation Structure), `bdf/VERSION.md`, `bdf/BUILDER_EVOLUTION.md` (optional note), `bdf/AI_WORKFLOW.md` (optional note), `AI/BUILD_RELEASE_MANAGER.md` (mark the evolution checklist items done)

**Interfaces:**
- Consumes: final state from Tasks 1-7.

- [ ] **Step 1: BUILDER_SPEC.md** — add a "Release" subsection under the build pipeline documenting: registry → release-manager → generated artifacts; marker policy; all-or-nothing failure policy; the one-command release workflow. Reference `docs/release_registry.json` and `scripts/release-manager.ps1`.

- [ ] **Step 2: FOLDER_STRUCTURE.md** — add `docs/release_registry.json` (registry section), `docs/CURRENT_RELEASE.md`, and a `## release-manager.ps1` section mirroring the `## build-opencode-v2.ps1` / `## test-opencode-v2.ps1` style (purpose, usage, ownership: "do not edit generated files").

- [ ] **Step 3: ARCHITECTURE.md** — extend the build pipeline diagram with the release stage (registry → release manager → CHANGELOG/CURRENT_RELEASE/VERSION/PROJECT_STATE). Document the data flow and ownership rules.

- [ ] **Step 4: TESTING.md** — document the Release Docs test group (tests 10-17) under the Regression Tests section: names, what they assert, that test 17 is the only read-only real-docs test. Update the test-count mentions from "9 tests" to "17 tests".

- [ ] **Step 5: README.md** — add the release workflow (facts → review → release-manager → commit) to the overview or a short "Releases" section.

- [ ] **Step 6: ROADMAP.md** — move any "release automation"/"release notes" planned items to Completed; add the Release Manager as a completed phase with date.

- [ ] **Step 7: ADAPTER.md** — add `release_registry.json`, `CURRENT_RELEASE.md`, `scripts/release-manager.ps1` to the adapter's file lists (mirror how build-opencode-v2.ps1 is listed today).

- [ ] **Step 8: PROJECT_STATE.md** — update section 2 (Current Version stays 2.2.0), section 3 (folder structure: registry + CURRENT_RELEASE), section 6 (scripts/ list), section 8 (documentation structure), section 10 (versioning: registry is the sequence authority). Run the release manager once more at the end to re-sync any table the manual edits disturbed.

- [ ] **Step 9: bdf/VERSION.md** — the compatibility table is already updated by the manager (Task 5); add a sentence in Compatibility Notes about the release manager supporting the registry workflow (manual prose outside the generated rows).

- [ ] **Step 10: AI/BUILD_RELEASE_MANAGER.md** — check off the evolution checklist items at the bottom of the spec.

- [ ] **Step 11: Run the full harness again**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\loveb\.config\opencode\scripts\test-opencode-v2.ps1"
```

Expected: 17/17 PASSED, exit 0 — including the read-only real-docs test against the fully updated docs.

- [ ] **Step 12: Commit**

```bash
git add docs/
git commit -m "docs: document Release Manager V1 pipeline (registry, marker policy, release workflow)"
```

---

### Task 9: End-to-end release drill (simulate the next release)

**Files:**
- Modify: `C:\Users\loveb\.config\opencode\docs\release_registry.json` (add a DRAFT entry — reverted at the end)

**Interfaces:**
- Consumes: everything from Tasks 1-8.

- [ ] **Step 1: Simulate Builder V2.2 entry in a temp docs copy (NOT the real repo)**

Copy the real docs to a temp dir, add a draft `2.3.0` entry (version `2.3.0`, builderVersion `V2.2`, date `2026-08-05`, status `Current`; flip the real 2.2.0 entry to `Previous`), then run the release manager against the temp copy.

```powershell
# temp copy + draft registry edit + run manager with -ConfigRoot <temp>
```

Expected: exit 0; temp CHANGELOG has rich entries for 2.3.0 (Current) and 2.2.0 (Previous) in order; CURRENT_RELEASE.md shows V2.2/2.3.0; PROJECT_STATE table has 2 rows; VERSION.md Last Updated = 2026-08-05 and Supported Builder Versions = `Builder V2, Builder V2.1, Builder V2.2`. The REAL docs are untouched (verify `git status` clean).

- [ ] **Step 2: Verify the real docs are byte-identical to pre-drill state**

```powershell
git status --short
```

Expected: clean (no real-doc modifications from the drill).

- [ ] **Step 3: Record drill result**

Note in session log: end-to-end release drill succeeded on temp copy; real docs untouched.

---

### Task 10: Session wrap-up

**Files:**
- Modify: `C:\Users\loveb\.config\opencode\docs\_agent\SESSION_LOG.md` (new session entry, rotate to 5 max)
- Modify: `C:\Users\loveb\.config\opencode\docs\CHANGELOG.md` (marker section only — via release manager, NOT by hand)

**Interfaces:**
- Consumes: session rules from `_agent/SESSION_WORKFLOW.md`.

- [ ] **Step 1: Run the release manager once more**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\loveb\.config\opencode\scripts\release-manager.ps1"
```

Expected: exit 0. If "already up to date", no files written — fine.

- [ ] **Step 2: Run the full harness one final time**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\loveb\.config\opencode\scripts\test-opencode-v2.ps1"
```

Expected: 17/17 PASSED, exit 0.

- [ ] **Step 3: Write the session log entry** (format per SESSION_WORKFLOW.md) covering: Release Manager V1 built, registry created, CHANGELOG converted, CURRENT_RELEASE.md added, harness extended to 17 tests, docs updated, drill passed, next steps (commit docs repo, user review).

- [ ] **Step 4: Final commit**

```bash
git add docs/
git commit -m "docs: Release Manager V1 - automated release pipeline with registry and verification"
```
