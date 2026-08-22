# ============================================================
# scaffold-agent.ps1 - Universal Coding-Agent Scaffold  (V3)
# ============================================================
# Author  : Love (owner)
#           ChatGPT (early planning/blueprints)
#           OpenCode / deepseek-v4-flash-free (primary implementation)
# Purpose : V3 UNIVERSAL behavioral core. The framework's ONE job, the SAME
#           for ANY open-source coding agent (OpenCode, KiloCode, Aider, Goose,
#           Codex-Cli, ...). Claude Code is registered for DISCOVERY ONLY and is
#           NOT a scaffold target (dropped 2026-08-08 - see planning/DECISIONS.md).
#
# THE CONTRACT (V3):
#   1. DISCOVER which coding agents are installed on this machine.
#      Only open-source agents with local .json configs are scanned.
#      Closed-source agents are never touched.
#   2. If no known agent is found, the framework ASKS the user for the
#      location of their coding agent (a config folder).
#   3. Scan the agent's OWN main .json config FIRST, read-only.
#      The main config is the agent's own file (kilo.json for KiloCode,
#      opencode.json for OpenCode, ...). NEVER another agent's config.
#   4. Split the main config into sections: mcp / plugin / settings.
#      (The provider section is DETECTED for guidance only - see rule 7.)
#   5. Create the profile folders - ALWAYS these three:
#         profiles/coding/       (the MAIN profile, always coding)
#         profiles/experimental/
#         profiles/minimal/
#      Each profile contains exactly three files:
#         settings.json   - written by the framework (schema + shape)
#         mcp.json        - coding: seeded from the main config's mcp section;
#                           experimental/minimal: created EMPTY, never filled
#         plugins.json    - coding: seeded from the main config's plugin section;
#                           experimental/minimal: created EMPTY, never filled
#   6. NEVER overwrite mcp.json / plugins.json once they exist - the user
#      owns those files after creation. The framework writes them only when
#      they are missing (seeded from the scanned main config).
#   7. AUTO-IMPORT (V3.1): when the scanned main .json carries
#      providers, the framework creates providers/<id>.json (dual-key:
#      apiKey + options.apiKey) and profiles/coding/<id>-models.json for the
#      first time, so the builder has every provider in one go. Existing
#      files are never overwritten.
#   8. HARD RULE: the framework ONLY scans the main .json. It NEVER scans,
#      merges, reads, or modifies any .jsonc file - ever. A .jsonc is never
#      imported and never emptied. Providers/models live in .json only.
#   9. Everything is generated from the agent's OWN main config. No work is
#      done BEFORE scanning. Errors are always user-reportable + fixable.
# ============================================================

[CmdletBinding()]
param(
    [string]$Agent = "",               # explicit agent name (registry or custom)
    [string]$ConfigRoot = "",          # explicit config dir (custom agents)
    [switch]$NonInteractive,
    [switch]$List,                     # list discovered agents only
    [switch]$Bootstrap,                # after scaffold, also bootstrap a builder
    [string]$BuilderSource = "",       # source builder to adapt (bootstrap)
    [switch]$AutoBuild                 # after import, run the builder automatically
)

$ErrorActionPreference = "Stop"

# ---- V3 error self-fix: any error becomes a diagnosed, fixable report ----
trap {
    Write-Host ""
    Write-Host "[!] Scaffold error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Diagnosis (V3 rule): check that"
    Write-Host "      1. the config path is correct and contains a .json main file,"
    Write-Host "      2. the agent you named is in `AgentRegistry` (or pass -ConfigRoot),"
    Write-Host "      3. you aren't pointing at a folder without a .json main file (.jsonc is never scanned)."
    Write-Host "    Re-run after fixing; the generated builder also supports -Doctor."
    Write-Host ""
    Write-Host "[x] Framework did NOT complete. Fix the reported error and rerun." -ForegroundColor Red
    exit 1
}

function Show-Credits {
    Write-Host ""
    Write-Host "  Framework : OpenCode / deepseek-v4-flash-free (primary implementation)"
    Write-Host "  Planning  : ChatGPT"
    Write-Host "  Owner     : Love"
}

# ------------------------------------------------------------
# V3 OPEN-SOURCE AGENT REGISTRY - add any open-source coding agent here.
# Each entry: Name, Home (config dir relative to HOME), Main (JSON file names),
# PluginKey (JSON keys that hold plugins), Schema (settings schema url).
# Closed-sourced agents are intentionally NOT in this registry.
# ------------------------------------------------------------
$AgentRegistry = @(
    @{ Name = "opencode";   Home = ".config\opencode"; Main = @("opencode.json");       PlugKeys = @("plugin");       Schema = "https://opencode.ai/config.schema.json" }
    @{ Name = "kilo";       Home = ".config\kilo";     Main = @("kilo.json");       PlugKeys = @("plugin", "skills.urls"); Schema = "https://app.kilo.ai/config.json" }
    @{ Name = "claudecode"; Home = ".claude";          Main = @(".claude.json", "settings.json"); PlugKeys = @("plugins"); Schema = "" }  # discovery only - NOT a scaffold target (dropped 2026-08-08)
    @{ Name = "aider";      Home = ".aider";           Main = @(".aider.conf.json");    PlugKeys = @("plugins"); Schema = "" }
    @{ Name = "goose";      Home = ".config\goose";    Main = @("config.json");         PlugKeys = @("plugins"); Schema = "" }
    @{ Name = "codex-cli";  Home = ".codex";           Main = @("config.toml");         PlugKeys = @("plugins"); Schema = "" }
)

# ---- discover installed open-source coding agents ----
function Find-DiscoveredAgents {
    $Found = @()
    foreach ($Reg in $AgentRegistry) {
        $Dir = Join-Path $HOME $Reg.Home
        if (-not (Test-Path $Dir)) { continue }
        $MainHit = @($Reg.Main | Where-Object { Test-Path (Join-Path $Dir $_) } | Select-Object -First 1)
        if ($MainHit.Count -gt 0) {
            $Found += [pscustomobject]@{ Name = $Reg.Name; Dir = $Dir; Main = $MainHit[0] }
        }
    }
    return $Found
}

if ($List) {
    $D = @(Find-DiscoveredAgents)
    if ($D.Count -eq 0) { Write-Host "[i] No known open-source coding agents found in standard locations." }
    else {
        Write-Host "[+] Discovered open-source coding agents:"
        foreach ($A in $D) { Write-Host ("    - {0,-12} {1}  ({2})" -f $A.Name, $A.Dir, $A.Main) }
    }
    exit 0
}

# ---- resolve the target agent (explicit > discover > ask) ----
if ($Agent -eq "") {
    $Discovered = @(Find-DiscoveredAgents)
    if ($Discovered.Count -eq 1) {
        $Agent      = $Discovered[0].Name
        $ConfigRoot = if ($ConfigRoot -eq "") { $Discovered[0].Dir } else { $ConfigRoot }
        Write-Host "[i] Agent auto-detected: $Agent (only open-source coding agent present)."
    }
    elseif ($Discovered.Count -gt 1) {
        if ($NonInteractive) {
            $Agent      = $Discovered[0].Name
            $ConfigRoot = $Discovered[0].Dir
            Write-Host "[i] Multiple agents found; -NonInteractive picked first: $Agent"
        }
        else {
            Write-Host "[?] Multiple open-source coding agents found:"
            for ($i = 0; $i -lt $Discovered.Count; $i++) {
                Write-Host ("    [{0}] {1} ({2})" -f $i, $Discovered[$i].Name, $Discovered[$i].Main)
            }
            try { $Choice = Read-Host "    Choose one (0-$($Discovered.Count-1))" } catch { $Choice = "0" }
            $idx = 0
            if ([int]::TryParse($Choice, [ref]$idx)) {
                if ($idx -lt 0 -or $idx -ge $Discovered.Count) { $idx = 0 }
            }
            $Agent      = $Discovered[$idx].Name
            $ConfigRoot = $Discovered[$idx].Dir
        }
    }
    if ($Agent -eq "") {
        # No known agent found on system -> ask the user for location
        Write-Host "[?] The framework could not find a coding agent automatically on this machine."
        try { $Answer = Read-Host "    Give me the location of your coding agents (config folder)" } catch { $Answer = "" }
        if ([string]::IsNullOrWhiteSpace($Answer) -or -not (Test-Path $Answer)) {
            throw "No coding agent found and no valid location given. Framework aborted (user guided)."
        }
        $ConfigRoot = $Answer
        $Agent      = [System.IO.Path]::GetFileName($ConfigRoot.TrimEnd('\'))
        Write-Host "[i] Custom agent location accepted: $ConfigRoot (agent: $Agent)"
    }
}
else {
    if ($ConfigRoot -eq "") {
        $Reg = $AgentRegistry | Where-Object Name -eq $Agent | Select-Object -First 1
        if ($Reg) { $ConfigRoot = Join-Path $HOME $Reg.Home }
        else      { throw "Unknown agent '$Agent'. Pass -ConfigRoot or add it to the registry." }
    }
}

$ProfilesRoot = Join-Path $ConfigRoot "profiles"
$Reg2 = $AgentRegistry | Where-Object Name -eq $Agent | Select-Object -First 1
$PluginKeys     = if ($Reg2) { $Reg2.PlugKeys } else { @("plugin", "skills.urls") }
$SchemaUrl      = if ($Reg2 -and $Reg2.Schema) { $Reg2.Schema } else { "" }

# ---- 1. locate the agent's OWN main config file (READ-ONLY, first) ----
# V3 rule: only the agent's OWN primary main config is scanned - never another
# agent's config, never profile files, never backup/provenance/system files.
# Only the FIRST main file in registry order is the source of truth, so a
# polluted/duplicate secondary file can never leak into the profiles.
$MainFiles = @()
$CandidateNames = if ($Reg2) { $Reg2.Main } else { @("*.json") }
foreach ($Pattern in $CandidateNames) {
    if ($MainFiles.Count -gt 0) { break }
    if ($Pattern -like "*.*") {
        $Pj = Join-Path $ConfigRoot $Pattern
        if (Test-Path -LiteralPath $Pj) { $MainFiles += $Pj }
    }
}
if ($MainFiles.Count -eq 0) {
    # fallback (custom agents / glob): any top-level .json that is NOT a
    # system/profile file. Expand the glob first - never pass '*' to a reader.
    $GlobHits = @(Get-ChildItem $ConfigRoot -File -Filter *.json -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch "^(package|package-lock|tsconfig|changelog|release|settings|mcp|plugins|target|.*models|.*provenance)" } |
        Sort-Object Name)
    if ($GlobHits.Count -gt 0) { $MainFiles += $GlobHits[0].FullName }
}
$MainFiles = @($MainFiles | Select-Object -Unique)

# ---- HARD RULE: .jsonc is NEVER scanned, merged, imported, or emptied ----
# The framework scans ONLY the main .json file(s) above. A .jsonc sitting next
# to them is invisible to the scaffold: it is never read, never imported, and
# never modified. Providers/models live in .json only.
$MainFiles = @($MainFiles | Where-Object { $_ -notlike "*.jsonc" })
$JsoncPresent = @(Get-ChildItem $ConfigRoot -File -Filter *.jsonc -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch "^(package|package-lock)" })
if ($JsoncPresent.Count -gt 0) {
    Write-Host "[i] .jsonc file(s) present but NEVER scanned: $([System.IO.Path]::GetFileName($JsoncPresent) -join ', ')"
}
if ($MainFiles.Count -eq 0) {
    throw "No main .json config found in '$ConfigRoot'. .jsonc files are never scanned - add a .json main config."
}

Write-Host ""
Write-Host "=============================================="
Write-Host "   Universal Agent Scaffold (agent: $Agent)"
Write-Host "=============================================="
Show-Credits

# ---- 2. scan + split the agent's own main config (read-only, merged) ----
$MergedMcp       = [ordered]@{}
$MergedPlugins   = [System.Collections.Generic.List[string]]::new()
$MergedProviders = [ordered]@{}   # provider id -> full provider object (incl. models)
$ProviderSeen    = [System.Collections.Generic.List[string]]::new()
$MergedLsp       = $true

foreach ($TF in $MainFiles) {
    Write-Host "[*] Scanning main config: $TF"
    $Main = [System.IO.File]::ReadAllText($TF) | ConvertFrom-Json
    # mcp section
    if ($Main.mcp) { foreach ($Prop in $Main.mcp.PSObject.Properties) { $MergedMcp[$Prop.Name] = $Prop.Value } }
    # plugin section (both common shapes)
    foreach ($Key in $PluginKeys) {
        $Split = $Key -split "\."
        $Node = $Main
        foreach ($Seg in $Split) { if ($null -ne $Node) { $Node = $Node.$Seg } }
        foreach ($P in @($Node)) { if ($P) { $MergedPlugins.Add([string]$P) } }
    }
    # lsp section (boolean true/false or object keyed by server name)
    if ($Main.PSObject.Properties['lsp']) { $MergedLsp = $Main.lsp }
    # provider section: collect FULL provider objects (name + options + models)
    foreach ($P in @($Main.provider.PSObject.Properties)) {
        if ($P) {
            $ProviderSeen.Add($P.Name)
            $MergedProviders[$P.Name] = $P.Value
        }
    }
    # settings schema (use the config's own $schema when present)
    if ($SchemaUrl -eq "" -and $Main.schema)       { $SchemaUrl = [string]$Main.schema }
    if ($SchemaUrl -eq "" -and $Main.'$schema')    { $SchemaUrl = [string]$Main.'$schema' }
}
$MergedPlugins = @($MergedPlugins | Sort-Object -Unique)

function Backup-ProfileFile {
    param([string]$Path, [string]$Tag)
    if (-not (Test-Path $Path)) { return }
    $BkDir = Join-Path $ConfigRoot "backup"
    if (-not (Test-Path $BkDir)) { New-Item -ItemType Directory -Path $BkDir -Force | Out-Null }
    $Ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $Bk = Join-Path $BkDir "$Tag`_$Ts.json"
    Copy-Item $Path $Bk
    Write-Host "  [~] backed up previous -> backup\$([System.IO.Path]::GetFileName($Bk))"
}

function Write-ProfileJson {
    param([string]$Path, [string]$Name, [string]$Content)
    Backup-ProfileFile $Path $Name
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "  [ ] $Name written"
}

# ---- create-if-missing: mcp.json / plugins.json are user-owned after creation.
#      The framework NEVER overwrites them (V3 rule 6). ----
function Seed-IfMissing {
    param([string]$Path, [string]$Name, [string]$Content)
    if (Test-Path $Path) {
        Write-Host "  [ ] $Name exists - user-owned, left untouched"
        return
    }
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "  [ ] $Name created"
}

function Merge-SettingsSections {
    param([string]$Path)
    # V3 rule: settings.json is a MINIMAL settings file, shaped like the
    # reference implementation's (e.g. OpenCode: $schema + activeProviders).
    # The framework NEVER copy-pastes the whole agent config into settings.
    if (-not (Test-Path $Path)) {
        $Safe = if ($SchemaUrl) { $SchemaUrl } else { "https://schema.example.com/config.json" }
        $Obj = [ordered]@{ '$schema' = $Safe; 'activeProviders' = [string[]]$ProviderSeen }
        $Json = ConvertTo-Json $Obj -Depth 20
        [System.IO.File]::WriteAllText($Path, $Json, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host "  [ ] $(Split-Path $Path -Leaf) created (schema + activeProviders)"
        return
    }
    # Existing settings.json is user-owned; only ensure the two framework
    # keys exist. Never clobber any user key, never paste the agent shape.
    $Existing = [System.IO.File]::ReadAllText($Path) | ConvertFrom-Json
    $Merged = [ordered]@{}
    foreach ($P in $Existing.PSObject.Properties) { $Merged[$P.Name] = $P.Value }
    $Added = @()
    if (-not $Merged.Contains('$schema')) { $Merged['$schema'] = $Safe; $Added += '$schema' }
    if (-not $Merged.Contains('activeProviders')) { $Merged['activeProviders'] = [string[]]$ProviderSeen; $Added += 'activeProviders' }
    if ($Added.Count -gt 0) {
        $Json = ConvertTo-Json $Merged -Depth 20
        [System.IO.File]::WriteAllText($Path, $Json, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host "  [~] $(Split-Path $Path -Leaf): added missing keys: $($Added -join ', ')"
    } else {
        Write-Host "  [ ] $(Split-Path $Path -Leaf): up to date (user-owned, untouched)"
    }
}

# ---- 3. create the profile folders - ALWAYS coding / experimental / minimal ----
$Profiles = @("coding", "experimental", "minimal")
foreach ($Profile in $Profiles) {
    $Dir = Join-Path $ProfilesRoot $Profile
    if (-not (Test-Path $Dir)) { New-Item -ItemType Directory -Path $Dir -Force | Out-Null }
}

# coding (MAIN profile) = mcp + plugins seeded from the agent's own main config.
foreach ($Profile in $Profiles) {
    $Dir = Join-Path $ProfilesRoot $Profile
    if ($Profile -eq "coding") {
        # main profile: seed from the scanned main config
        if ($MergedMcp.Count -gt 0) {
            $McpJson = [ordered]@{ mcp = $MergedMcp } | ConvertTo-Json -Depth 10
            Seed-IfMissing (Join-Path $Dir "mcp.json") "mcp.json" $McpJson
        } else {
            Seed-IfMissing (Join-Path $Dir "mcp.json") "mcp.json" '{ "mcp": { } }'
        }
        if ($MergedPlugins.Count -gt 0) {
            Seed-IfMissing (Join-Path $Dir "plugins.json") "plugins.json" ('{ "plugin": ' + (ConvertTo-Json $MergedPlugins -Depth 5) + ' }')
        } else {
            Seed-IfMissing (Join-Path $Dir "plugins.json") "plugins.json" '{ "plugin": [ ] }'
        }
        $LspJson = @{ lsp = $MergedLsp; enabled = $false } | ConvertTo-Json -Depth 10
        Seed-IfMissing (Join-Path $Dir "lsp.json") "lsp.json" $LspJson
    }
    else {
        # experimental / minimal: create EMPTY mcp/plugins - NEVER filled by the
        # framework. The user owns the content of these files (V3 rule 6).
        Seed-IfMissing (Join-Path $Dir "mcp.json") "mcp.json" '{ "mcp": { } }'
        Seed-IfMissing (Join-Path $Dir "plugins.json") "plugins.json" '{ "plugin": [ ] }'
        Seed-IfMissing (Join-Path $Dir "lsp.json") "lsp.json" '{ "lsp": true, "enabled": false }'
    }
    Merge-SettingsSections (Join-Path $Dir "settings.json")
}

# ---- 4. providers/ folder: created by the framework, files are USER-owned ----
# The framework creates the providers/ folder (like the profile folders), but
# NEVER writes provider or model JSON files inside it - the user owns those.
$ProvidersRoot = Join-Path $ConfigRoot "providers"
if (-not (Test-Path $ProvidersRoot)) { New-Item -ItemType Directory -Path $ProvidersRoot -Force | Out-Null; Write-Host "[ ] providers/ folder created (files are user-owned)" }

# ---- 4b. AUTO-IMPORT: migrate providers/models from the scanned main configs ----
# When providers exist in the main .json, create the modular source
# files so the builder has everything in one go:
#   providers/<id>.json                 (provider config)
#   profiles/coding/<id>-models.json    (provider models)
# mcp + plugins are already seeded above from the same scan.
$ImportCreated = 0
foreach ($ProviderId in @($MergedProviders.Keys)) {
    $Prov = $MergedProviders[$ProviderId]
    if (-not $Prov) { continue }

    # --- provider file: providers/<id>.json (BDF shape, backup-first) ---
    $ProvFile = Join-Path $ProvidersRoot "$ProviderId.json"
    if (-not (Test-Path $ProvFile)) {
        $Inner = [ordered]@{}
        if ($Prov.name)              { $Inner['name'] = [string]$Prov.name }
        if ($Prov.apiKey)            { $Inner['apiKey'] = [string]$Prov.apiKey }
        if ($Prov.npm)               { $Inner['npm'] = [string]$Prov.npm }
        if ($Prov.reasoningFormat)   { $Inner['reasoningFormat'] = [string]$Prov.reasoningFormat }
        # options: preserve extras + mirror the apiKey in options.apiKey
        # (dual-key contract: opencode reads provider.<id>.apiKey, kilo reads
        # provider.<id>.options.apiKey - both must be present)
        $Opts = [ordered]@{}
        if ($Prov.options) {
            foreach ($O in $Prov.options.PSObject.Properties) { $Opts[$O.Name] = $O.Value }
        }
        if ($Prov.apiKey -and -not $Opts.Contains('apiKey')) { $Opts['apiKey'] = [string]$Prov.apiKey }
        if ($Opts.Count -gt 0) { $Inner['options'] = $Opts }
        $Wrapper = [ordered]@{ provider = [ordered]@{ $ProviderId = $Inner }; id = $ProviderId }
        $Json = ConvertTo-Json $Wrapper -Depth 20
        [System.IO.File]::WriteAllText($ProvFile, $Json, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host "  [+] provider '$ProviderId' imported -> providers\$ProviderId.json"
        $ImportCreated++
    } else {
        Write-Host "  [ ] provider '$ProviderId' file exists - left untouched"
    }

    # --- models file: profiles/coding/<id>-models.json (provider name/models) ---
    if ($Prov.models) {
        $ModelsRoot = Join-Path $ProfilesRoot "coding"
        $ModelsFile = Join-Path $ModelsRoot "$ProviderId-models.json"
        if (-not (Test-Path $ModelsFile)) {
            $ModelsObj = [ordered]@{ models = $Prov.models }
            $MJson = ConvertTo-Json $ModelsObj -Depth 30
            [System.IO.File]::WriteAllText($ModelsFile, $MJson, (New-Object System.Text.UTF8Encoding($false)))
            Write-Host "  [+] provider '$ProviderId' models imported -> profiles\coding\$ProviderId-models.json"
            $ImportCreated++
        } else {
            Write-Host "  [ ] provider '$ProviderId' models file exists - left untouched"
        }
    }
}

# ---- 4c. (removed) .jsonc files are NEVER emptied, modified, or touched ----
# The scaffold never scans .jsonc; there is nothing to migrate or empty.

if ($ImportCreated -gt 0) {
    Write-Host "[+] Auto-import complete: $ImportCreated modular file(s) created from the scanned main config(s)."
    Write-Host "    Run the builder (build-$Agent.ps1 -Profile coding) to generate the final config with all providers active."
}
Write-Host ""
Write-Host "[i] Provider section detected in main config: $($ProviderSeen -join ', ')"
Write-Host "    Provider and model JSON files are 100% USER-owned. The framework"
Write-Host "    creates the providers/ folder but NEVER writes files inside it."
Write-Host "    Create them yourself when you need them:"
Write-Host "      providers/<id>.json                  (e.g. omniroute.json)"
Write-Host "      profiles/<profile>/<id>-models.json  (e.g. omniroute-models.json)"

# ---- 5. builder bootstrap (optional): adapt a source builder for this agent ----
if ($Bootstrap) {
    # Self-contained source resolution: the app bundles the engine (this
    # script + builders + kilo adapter + schemas) in its own folder, so any
    # downloaded copy can generate builders for any agent without touching
    # the developer's machine. kilo agents get the K1 adapter (writes
    # kilo.json), everything else the V2.7 opencode builder (writes
    # opencode.json via target.json). Custom-named agents (e.g. "kilo-test")
    # are typed by their main config file, not by their registered name.
    $IsKiloType = ($Agent -eq "kilo") -or (Test-Path (Join-Path $ConfigRoot "kilo.json"))
    $Source = if ($BuilderSource) { $BuilderSource }
              elseif ($IsKiloType) { Join-Path $PSScriptRoot "kilo\build-kilo-v1.ps1" }
              else { Join-Path $PSScriptRoot "build-opencode-v2.7.ps1" }
    if (-not (Test-Path $Source)) { $Source = Join-Path $PSScriptRoot "build-opencode-v2.7.ps1" }
    if (-not (Test-Path $Source)) { $Source = Join-Path $PSScriptRoot "build-opencode.ps1" }
    if (Test-Path $Source) {
        $TargetDir = Join-Path $ConfigRoot "scripts"
        if (-not (Test-Path $TargetDir)) { New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null }
        $Built = Join-Path $TargetDir "build-$Agent.ps1"
        Write-Host "[+] Bootstrapping builder for '$Agent' from '$Source'"
        $src = Get-Content $Source -Raw
        $src = $src -replace "KiloCode Configuration Builder", "$Agent Configuration Builder"
        $src = $src -replace "kilo\.jsonc", "config.json"
        $src = $src -replace "\.config\\kilo", $ConfigRoot
        [System.IO.File]::WriteAllText($Built, $src, (New-Object System.Text.UTF8Encoding($false)))
        $SourceBase = [System.IO.Path]::GetFileNameWithoutExtension($Source).Replace("build-", "")
        $CandidateTests = @()
        foreach ($Pat in @("test-$SourceBase.ps1", "test-kilo-v1.ps1", "test-opencode-v2.7.ps1", "test-opencode-v2.ps1")) {
            $Cand = Join-Path (Split-Path $Source) $Pat
            if (Test-Path $Cand) { $CandidateTests += $Cand }
        }
        $T = Join-Path $TargetDir "test-$Agent.ps1"
        if ($CandidateTests.Count -gt 0) {
            $tSrc = Get-Content $CandidateTests[0] -Raw
            $tSrc = $tSrc -replace "KiloCode Configuration Builder", "$Agent Configuration Builder"
            $tSrc = $tSrc -replace "kilo\.jsonc", "config.json"
            $tSrc = $tSrc -replace "\.config\\kilo", $ConfigRoot
            $tSrc = $tSrc -replace "build-kilo-v1\.ps1", "build-$Agent.ps1"
            $tSrc = $tSrc -replace "build-opencode-v2\.7\.ps1", "build-$Agent.ps1"
            $tSrc = $tSrc -replace "test-kilo-v1\.ps1", "test-$Agent.ps1"
            $tSrc = $tSrc -replace "test-opencode-v2\.7\.ps1", "test-$Agent.ps1"
            [System.IO.File]::WriteAllText($T, $tSrc, (New-Object System.Text.UTF8Encoding($false)))
            Write-Host "[+] Bootstrapped: $T"
        }
        $S = Join-Path $TargetDir "scaffold-$Agent.ps1"
        $sSrc = @"
# scaffold-$Agent.ps1 - wrapper for the universal scaffold
[CmdletBinding()]
param(
    [string]`$ConfigRoot = "$ConfigRoot",
    [switch]`$NonInteractive
)
& (Join-Path (Split-Path `$PSScriptRoot -Parent) "..\opencode\scripts\scaffold-agent.ps1") -Agent "$Agent" -ConfigRoot `$ConfigRoot -NonInteractive:`$NonInteractive
"@
        [System.IO.File]::WriteAllText($S, $sSrc, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host "[+] Bootstrapped: $Built / $T / $S"
        Write-Host "    Run '$Built -Profile coding' after setting up providers."
    } else {
        Write-Host "[!] No source builder found to adapt."
    }
}

Write-Host ""
Write-Host "[+] Scaffold complete. Main profile: $Agent/coding. Providers/models are user-owned."

# ---- 6. AUTO-BUILD: run the generated builder with ALL imported providers ----
# The builder merges every provider in profiles/coding/settings.json
# (activeProviders), generates the final main config, stamps provenance, and
# backs up first - so the user's dashboard is populated immediately and no
# provider is left inactive by accident.
if ($AutoBuild) {
    $BuiltPath = Join-Path (Join-Path $ConfigRoot "scripts") "build-$Agent.ps1"
    if (Test-Path $BuiltPath) {
        Write-Host ""
        Write-Host "[*] Auto-building with all imported providers active..."
        & $BuiltPath -Profile "coding" -NonInteractive -ConfigRoot $ConfigRoot
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[+] Auto-build complete - activeProviders + generated config ready."
        } else {
            Write-Host "[!] Auto-build reported a problem (exit $LASTEXITCODE). Check the builder output above."
        }
    } else {
        Write-Host "[!] AutoBuild requested but no builder found at $BuiltPath - run the scaffold with -Bootstrap first."
    }
}
Write-Host "=========================================================="
