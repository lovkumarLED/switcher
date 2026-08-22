# ============================================================
# KiloCode Configuration Builder V1 (K1) Adapter
# ============================================================
# Author  : Love (owner)
#           ChatGPT (early planning/blueprints)
#           OpenCode / deepseek-v4-flash-free (primary implementation)
# Purpose: Generate kilo.json from modular profile files. (Builder V1 K1 - KiloCode Adapter)
#
# Features
# --------
# - Profile based configuration
# - Dynamic provider loading
# - Extended validation (duplicates, malformed definitions)
# - Modular merge pipeline (settings, providers, models, plugins, MCP)
# - Provider-specific models (profile-level > folder > inline > global)
# - Active-provider selection (interactive / -Provider / -NonInteractive) with settings.json persistence
# - JSON Schema validation (F1): schemas/*.schema.json checked BEFORE builder validation
# - Pre-flight dependency check (F2): ALL input files verified before any merge
# - -WhatIf dry run (F3): validate + merge only, never writes
# - Backup retention (F4): backups pruned to -KeepBackups (default 10)
# - Provenance sidecar (F5): <artifact>.provenance.json stamped at generation (artifact from profiles/<profile>/target.json, default kilo.json)
# - -Doctor diagnose mode (F6): read-only report of the real config
# - Merge diff summary (F7): Added/Removed/Updated vs previous backup artifact
# - Pre-write output verification
# - Automatic backups
# - Concise count-based logging
# ============================================================

param(
    [string]$Profile = "default",
    [string]$ConfigRoot = (Join-Path $HOME ".config\kilo"),
    [string]$Provider = "",
    [switch]$NonInteractive,
    [string]$SchemaDir = (Join-Path $ConfigRoot "schemas"),
    [Alias("DryRun")]
    [switch]$WhatIf,
    [int]$KeepBackups = 10,
    [switch]$Doctor,
    [string]$ProvenancePath = "",
    [switch]$AllowJsonc
)

$BuilderVersion = "1.0 (K1)"

# ------------------------------------------------------------
# Paths
# ------------------------------------------------------------

$ProfilesRoot  = Join-Path $ConfigRoot "profiles"
$ProvidersRoot = Join-Path $ConfigRoot "providers"
$ProfilePath   = Join-Path $ProfilesRoot $Profile
$ProfileProvidersRoot = Join-Path $ProfilePath "providers"
if (Test-Path $ProfileProvidersRoot) { $ProvidersRoot = $ProfileProvidersRoot }
$BackupDir     = Join-Path $ConfigRoot "backup"

# Target artifact resolution (P2): optional profiles/<profile>/target.json
# -> { "artifact": "kilo.json" }. Missing, unreadable or invalid
# target.json falls back to "kilo.json" (backward compatible).
# RULE: kilo.json is the canonical artifact. .jsonc is CONSUMED read-only; if you
# need to write .jsonc, add "-AllowJsoncArtifact" and pass -TargetArtifact
# explicitly. Default path NEVER writes .jsonc.
$TargetArtifact = "kilo.json"
$TargetFile     = Join-Path $ProfilePath "target.json"

if (Test-Path $TargetFile) {

    try {

        $TargetCfg = Get-Content $TargetFile -Raw | ConvertFrom-Json

        if (-not [string]::IsNullOrWhiteSpace($TargetCfg.artifact)) {

            $TargetArtifact = [string]$TargetCfg.artifact
        }
    }
    catch {

        Write-Host "[!] target.json unreadable or invalid - using default artifact 'kilo.json'." -ForegroundColor DarkYellow
    }
}

if (-not $TargetArtifact.EndsWith(".json") -and -not $TargetArtifact.EndsWith(".jsonc")) { $TargetArtifact = "$TargetArtifact.json" }

# GUARD: NEVER write .jsonc without explicit consent. .jsonc is consumed by the
# tool itself (user's runtime config), not a build artifact. We only write it
# when the user explicitly opted in via profiles/<profile>/target.json AND
# confirmed at the prompt (interactive), or passed -AllowJsonc (non-interactive).
if ($TargetArtifact.EndsWith(".jsonc")) {
    if ($WhatIf -or $Doctor) {
        # Dry-run/diagnose are read-only on .jsonc; allow without consent.
    } elseif ($AllowJsonc) {
        Write-Host "[i] .jsonc write enabled via -AllowJsonc." -ForegroundColor DarkYellow
    } elseif ($NonInteractive) {
        throw "Refusing to write .jsonc in -NonInteractive mode without -AllowJsonc."
    } else {
        $Consent = Read-Host "Target artifact is .jsonc (tool runtime config). Overwrite? [y/N]"
        if ($Consent -notin @('y', 'yes')) { throw "User declined .jsonc write. Aborting." }
        Write-Host "[i] .jsonc write consented. Provenance + backup still apply." -ForegroundColor DarkYellow
    }
}

$TargetBase     = [System.IO.Path]::GetFileNameWithoutExtension($TargetArtifact)
$OutputFile     = Join-Path $ConfigRoot $TargetArtifact

if ([string]::IsNullOrWhiteSpace($SchemaDir))      { $SchemaDir = Join-Path $ConfigRoot "schemas" }
if ([string]::IsNullOrWhiteSpace($ProvenancePath)) { $ProvenancePath = Join-Path $ConfigRoot "$TargetBase.provenance.json" }

# ------------------------------------------------------------
# Console helpers
# ------------------------------------------------------------

function Write-Header {

    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "      KiloCode Config Builder v$BuilderVersion" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {

    param(
        [string]$Message
    )

    Write-Host "[*] $Message" -ForegroundColor Yellow
}

function Write-Detail {

    param(
        [string]$Message
    )

    Write-Host "      $Message" -ForegroundColor Gray
}

function Write-Success {

    param(
        [string]$Message
    )

    Write-Host "[+] $Message" -ForegroundColor Green
}

function Write-Warning {

    param(
        [string]$Message
    )

    Write-Host "[!] $Message" -ForegroundColor DarkYellow
}

function Write-Failure {

    param(
        [string]$Message
    )

    Write-Host "[x] $Message" -ForegroundColor Red
}

# ------------------------------------------------------------
# Utility functions
# ------------------------------------------------------------

function Test-JsonFile {

    param(
        [string]$Path
    )

    if (!(Test-Path $Path)) {
        throw "Missing file:`n$Path"
    }
}

function Load-Json {

    param(
        [string]$Path
    )

    Test-JsonFile $Path

    try {

        return Get-Content $Path -Raw | ConvertFrom-Json

    }
    catch {

        throw "Invalid JSON:`n$Path`n$_"
    }
}

function Load-OptionalJson {

    param(
        [string]$Path
    )

    if (!(Test-Path $Path)) {
        return $null
    }

    try {

        return Get-Content $Path -Raw | ConvertFrom-Json

    }
    catch {

        throw "Invalid JSON:`n$Path`n$_"
    }
}

function Set-ObjectProperty {

    param(
        [object]$Object,
        [string]$Name,
        $Value
    )

    if ($null -eq $Object.PSObject.Properties[$Name]) {

        $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
    }
    else {

        $Object.$Name = $Value
    }
}

# ------------------------------------------------------------
# JSON Schema subset validator (F1)
# ------------------------------------------------------------
# Supported subset (Windows PowerShell 5.1, no Test-Json -Schema):
#   $schema (informational), type, required, properties,
#   additionalProperties: false, items, enum, $ref (local same-file only).

function Get-ValueType {

    param($Value)

    if ($null -eq $Value) { return "null" }
    if ($Value -is [bool]) { return "boolean" }
    if ($Value -is [string]) { return "string" }
    if ($Value -is [int] -or $Value -is [long] -or $Value -is [decimal] -or $Value -is [double] -or $Value -is [single]) { return "number" }
    if ($Value -is [System.Management.Automation.PSCustomObject]) { return "object" }
    if ($Value -is [System.Collections.IEnumerable]) { return "array" }
    return "object"
}

function Resolve-SchemaRef {

    param(
        [object]$Schema,
        [string]$Ref
    )

    if ($Ref -notmatch '^#/') {
        throw "Unsupported schema reference '$Ref' (only same-file references like #/definitions/name are supported)."
    }

    $Node = $Schema

    foreach ($Segment in ($Ref.Substring(2) -split '/')) {

        $Node = $Node.PSObject.Properties[$Segment].Value

        if ($null -eq $Node) {
            throw "Schema reference not found: $Ref"
        }
    }

    return $Node
}

function Test-JsonValue {

    param(
        [object]$SchemaRoot,
        [object]$SchemaNode,
        $Value,
        [string]$Path,
        [System.Collections.ArrayList]$Errors
    )

    if ($null -eq $SchemaNode) { return }

    $Node = $SchemaNode

    if ($Node.PSObject.Properties['$ref']) {

        $Node = Resolve-SchemaRef $SchemaRoot $Node.'$ref'.ToString()
    }

    # --- type ----------------------------------------------------
    if ($Node.PSObject.Properties['type']) {

        $Allowed = @($Node.type)
        $Actual  = Get-ValueType $Value

        if ($Allowed -notcontains $Actual) {

            [void]$Errors.Add("$Path type mismatch: expected '$($Allowed -join "' or '")', got '$Actual'.")
            return
        }
    }

    # --- enum -----------------------------------------------------
    if ($Node.PSObject.Properties['enum']) {

        $Matches = $false

        foreach ($EnumValue in @($Node.enum)) {

            if ("$EnumValue" -eq "$Value") { $Matches = $true; break }
        }

        if (-not $Matches) {

            [void]$Errors.Add("$Path is not one of the allowed enum values ($(@($Node.enum) -join ', ')).")
        }
    }

    # --- object: required / properties / additionalProperties ----
    if ($Value -is [System.Management.Automation.PSCustomObject] -and $Node.PSObject.Properties['properties']) {

        $Props = $Node.properties

        if ($Node.PSObject.Properties['required']) {

            foreach ($RequiredName in @($Node.required)) {

                if ($null -eq $Value.PSObject.Properties[$RequiredName]) {

                    [void]$Errors.Add("$Path.$RequiredName is required.")
                }
            }
        }

        foreach ($Prop in $Value.PSObject.Properties) {

            $PropSchema = $Props.PSObject.Properties[$Prop.Name]

            if ($null -eq $PropSchema) {

                if ($Node.PSObject.Properties['additionalProperties'] -and $Node.additionalProperties -eq $false) {

                    [void]$Errors.Add("$Path.$($Prop.Name) is not defined (additionalProperties is false).")
                }
            }
            else {

                Test-JsonValue $SchemaRoot $PropSchema.Value $Prop.Value "$Path.$($Prop.Name)" $Errors
            }
        }
    }

    # --- array: items ----------------------------------------------
    if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string]) -and $Node.PSObject.Properties['items']) {

        $ItemsNode = $Node.items
        $Index     = 0

        foreach ($Item in $Value) {

            Test-JsonValue $SchemaRoot $ItemsNode $Item "$Path[$Index]" $Errors
            $Index++
        }
    }
}

function Test-SchemaCompliance {

    # Validates a JSON file against a schema object (the subset above).
    # Returns [pscustomobject]@{ Valid = [bool]; Errors = [string[]] }.

    param(
        [string]$Path,
        [object]$Schema
    )

    $Errors = New-Object System.Collections.ArrayList

    $Instance = Get-Content $Path -Raw | ConvertFrom-Json

    Test-JsonValue $Schema $Schema $Instance "(root)" $Errors

    return [pscustomobject]@{ Valid = $Errors.Count -eq 0; Errors = @($Errors) }
}

function Get-SchemaForSource {

    # Maps a config source file name to the schema file that covers it.
    # <provider>-models.json and models.json share models.schema.json.
    # Returns $null when no schema applies.

    param(
        [string]$FileName
    )

    if ($FileName -eq "settings.json")             { return "settings.schema.json" }
    if ($FileName -eq "models.json")               { return "models.schema.json" }
    if ($FileName -like "*-models.json")           { return "models.schema.json" }
    if ($FileName -eq "plugins.json")              { return "plugins.schema.json" }
    if ($FileName -eq "mcp.json")                  { return "mcp.schema.json" }
    if ($FileName -eq "target.json")               { return "targets.schema.json" }
    if ($FileName -like "*.json")                  { return "provider.schema.json" }

    return $null
}

function Invoke-SourceSchemaCheck {

    # Validates one source file against its schema (when the schema exists).
    # Throws with the verbatim contract message on violation.

    param(
        [string]$File,
        [string]$SchemaName
    )

    $SchemaFile = Join-Path $SchemaDir $SchemaName

    if (!(Test-Path $SchemaFile)) {
        throw "Schema '$SchemaName': $File failed: schema file not found at $SchemaFile"
    }

    $Schema = Get-Content $SchemaFile -Raw | ConvertFrom-Json

    $Result = Test-SchemaCompliance $File $Schema

    if (-not $Result.Valid) {

        $Lines = $Result.Errors | ForEach-Object { "Schema '$SchemaName': $File failed: $_" }

        throw ($Lines -join "`n")
    }
}

# ------------------------------------------------------------
# Pre-flight dependency check (F2)
# ------------------------------------------------------------

function Assert-InputFilesExist {

    # Returns every missing input path (provider files for the active
    # providers, the profile settings file, referenced schema files).
    # Never throws; the caller decides how to report.

    $Missing = [string[]]@()

    foreach ($ProviderName in $ActiveProviders) {

        if ([string]::IsNullOrWhiteSpace($ProviderName)) { continue }

        $ProviderFile = Join-Path $ProvidersRoot "$ProviderName.json"

        if (!(Test-Path $ProviderFile)) { $Missing += $ProviderFile }
    }

    if (!(Test-Path $SettingsFile)) { $Missing += $SettingsFile }

    if (Test-Path $SchemaDir) {

        $RequiredSchemas = @()

        $RequiredSchemas += (Join-Path $SchemaDir "settings.schema.json")

        foreach ($ProviderName in $ActiveProviders) {

            $RequiredSchemas += (Join-Path $SchemaDir "provider.schema.json")
        }

        if (Test-Path $ModelsFile)  { $RequiredSchemas += (Join-Path $SchemaDir "models.schema.json") }
        if (Test-Path $PluginsFile) { $RequiredSchemas += (Join-Path $SchemaDir "plugins.schema.json") }
        if (Test-Path $McpFile)     { $RequiredSchemas += (Join-Path $SchemaDir "mcp.schema.json") }
        if (Test-Path $LspFile)     { $RequiredSchemas += (Join-Path $SchemaDir "lsp.schema.json") }
        if (Test-Path $TargetFile)  { $RequiredSchemas += (Join-Path $SchemaDir "targets.schema.json") }

        foreach ($SchemaFile in $RequiredSchemas) {

            if (!(Test-Path $SchemaFile)) { $Missing += $SchemaFile }
        }
    }

    return ,$Missing
}

function Get-CurrentSources {

    # Builds the list of source files relevant to the current profile.
    # Used by the Schema Validation stage and by -Doctor.

    $Sources = New-Object System.Collections.ArrayList

    [void]$Sources.Add(@{ File = $SettingsFile; Schema = "settings.schema.json"; Required = $true })

    if (Test-Path $ModelsFile)  { [void]$Sources.Add(@{ File = $ModelsFile;  Schema = "models.schema.json";  Required = $false }) }
    if (Test-Path $PluginsFile) { [void]$Sources.Add(@{ File = $PluginsFile; Schema = "plugins.schema.json"; Required = $false }) }
    if (Test-Path $McpFile)     { [void]$Sources.Add(@{ File = $McpFile;     Schema = "mcp.schema.json";     Required = $false }) }
    if (Test-Path $LspFile)     { [void]$Sources.Add(@{ File = $LspFile;     Schema = "lsp.schema.json";     Required = $false }) }
    if (Test-Path $TargetFile)  { [void]$Sources.Add(@{ File = $TargetFile;  Schema = "targets.schema.json"; Required = $false }) }

    foreach ($ProviderName in $ActiveProviders) {

        $ProviderFile = Join-Path $ProvidersRoot "$ProviderName.json"

        if (Test-Path $ProviderFile) {

            [void]$Sources.Add(@{ File = $ProviderFile; Schema = "provider.schema.json"; Required = $true })

            $ProfileModelsFile = Join-Path $ProfilePath "$ProviderName-models.json"

            if (Test-Path $ProfileModelsFile) {

                [void]$Sources.Add(@{ File = $ProfileModelsFile; Schema = "models.schema.json"; Required = $false })
            }
        }
    }

    return @($Sources)
}

# ------------------------------------------------------------
# Validation
# ------------------------------------------------------------

function Get-DuplicateJsonKeys {

    # Scans raw JSON text for duplicate keys inside any object.
    # ConvertFrom-Json silently drops duplicates, so raw text must be checked.

    param(
        [string]$Json
    )

    $dups  = @()
    $stack = New-Object System.Collections.ArrayList
    $len   = $Json.Length
    $i     = 0

    while ($i -lt $len) {

        $c = $Json[$i]

        if ($c -eq '"') {

            $j = $i + 1

            while ($j -lt $len) {

                if ($Json[$j] -eq '\') { $j += 2; continue }
                if ($Json[$j] -eq '"') { break }
                $j++
            }

            $name = $Json.Substring($i + 1, $j - $i - 1)

            $k = $j + 1

            while ($k -lt $len -and [char]::IsWhiteSpace($Json[$k])) { $k++ }

            if ($k -lt $len -and $Json[$k] -eq ':') {

                if ($stack.Count -gt 0) {

                    $top = $stack[$stack.Count - 1]

                    if ($top.Type -eq '{') {

                        if ($top.Keys.ContainsKey($name)) {

                            if (-not ($dups -contains $name)) { $dups += $name }
                        }
                        else {

                            $top.Keys[$name] = $true
                        }
                    }
                }
            }

            $i = $j + 1
            continue
        }

        if ($c -eq '{' -or $c -eq '[') {

            [void]$stack.Add(@{ Type = $c; Keys = @{} })
            $i++
            continue
        }

        if ($c -eq '}' -or $c -eq ']') {

            if ($stack.Count -gt 0) { $stack.RemoveAt($stack.Count - 1) }
            $i++
            continue
        }

        $i++
    }

    return $dups
}

function Assert-NoDuplicateKeys {

    param(
        [string]$Path,
        [string]$Section
    )

    $dups = Get-DuplicateJsonKeys (Get-Content $Path -Raw)

    if ($dups.Count -gt 0) {

        throw @"
Validation failed in ${Section}:

Duplicate ${Section} identifier(s):

$($dups -join "`n")

Each identifier must be unique.
"@
    }
}

function Assert-NoDuplicateModelNames {

    param(
        [object]$Models,
        [string]$Source
    )

    $names = @()

    foreach ($Prop in $Models.models.PSObject.Properties) {

        $names += $Prop.Value.name
    }

    $dups = $names | Group-Object | Where-Object { $_.Count -gt 1 }

    if ($dups) {

        $list = $dups | ForEach-Object { $_.Name } | Sort-Object

        throw @"
Validation failed in ${Source}:

Duplicate model name(s):

$($list -join "`n")

Each model name must be unique.
"@
    }
}

function Assert-NoDuplicatePluginIds {

    param(
        [object]$Plugins,
        [string]$Source
    )

    $items = @($Plugins.plugin)

    $dups = $items | Group-Object | Where-Object { $_.Count -gt 1 }

    if ($dups) {

        $list = $dups | ForEach-Object { $_.Name } | Sort-Object

        throw @"
Validation failed in ${Source}:

Duplicate plugin id(s):

$($list -join "`n")

Each plugin id must be unique.
"@
    }
}

function Assert-SettingsShape {

    param(
        [object]$Settings
    )

    if (-not $Settings.activeProviders) {

        throw @"
settings.json does not contain:

activeProviders

Example:

{
    "activeProviders": [
        "omniroute"
    ]
}
"@
    }

    if ($Settings.activeProviders -is [string]) {

        throw @"
settings.json validation failed:

activeProviders must be an array of provider identifiers.

Current value:

$($Settings.activeProviders)
"@
    }

    foreach ($Provider in $Settings.activeProviders) {

        if ($Provider -isnot [string] -or [string]::IsNullOrWhiteSpace($Provider)) {

            throw "settings.json validation failed: activeProviders contains an invalid entry: '$Provider'"
        }
    }

    if ($Settings.activeProviders.Count -eq 0) {

        throw "No providers were selected in settings.json."
    }

    $dups = $Settings.activeProviders | Group-Object | Where-Object { $_.Count -gt 1 }

    if ($dups) {

        $list = $dups | ForEach-Object { $_.Name } | Sort-Object

        throw @"
settings.json validation failed:

Duplicate provider id(s) in activeProviders:

$($list -join "`n")
"@
    }
}

function Assert-ConfigurationShape {

    param(
        [object]$Settings,
        [object]$Models,
        [object]$Plugins,
        [object]$MCP
    )

    if ($Models -and -not $Models.PSObject.Properties['models']) {

        throw "models.json validation failed: 'models' section is missing or invalid."
    }

    if ($Plugins -and -not $Plugins.PSObject.Properties['plugin']) {

        throw "plugins.json validation failed: 'plugin' section is missing or invalid."
    }

    if ($MCP -and -not $MCP.PSObject.Properties['mcp']) {

        throw "mcp.json validation failed: 'mcp' section is missing or invalid."
    }
}

function Assert-ProviderDefinition {

    param(
        [string]$ProviderName,
        [object]$ProviderJson,
        [string]$Path
    )

    if (-not $ProviderJson.id) {

        throw "Provider file '$ProviderName.json' has no id field."
    }

    if ($ProviderJson.id -ne $ProviderName) {

        throw @"
Provider mismatch.

Requested:

$ProviderName

Provider file contains:

$($ProviderJson.id)
"@
    }

    if (-not $ProviderJson.provider) {

        throw "Provider '$ProviderName' does not contain a provider section."
    }

    if ($ProviderJson.provider -is [string] -or @($ProviderJson.provider.PSObject.Properties).Count -eq 0) {

        throw "Provider '$ProviderName' contains a malformed provider section."
    }
}

# ------------------------------------------------------------
# Merge pipeline
# ------------------------------------------------------------

function Merge-Settings {

    # Kilo adapter merge rule: settings.json is the ONLY source for
    # $schema plus every other top-level Kilo key (model, permission,
    # agent, ...). activeProviders is consumed by the pipeline and never
    # emitted. Anything else keys through untouched.

    param(
        [object]$Settings
    )

    $Final = [ordered]@{}

    if ($Settings.'$schema') {

        $Final['$schema'] = $Settings.'$schema'
    }

    foreach ($Prop in $Settings.PSObject.Properties) {

        if ($Prop.Name -eq '$schema' -or $Prop.Name -eq 'activeProviders') { continue }

        $Final[$Prop.Name] = $Prop.Value
    }

    return $Final
}

function Merge-Providers {

    param(
        [object]$Settings
    )

    $ProviderRoot = [ordered]@{}
    $Declared    = [ordered]@{}

    foreach ($ProviderName in $Settings.activeProviders) {

        $ProviderFile = Join-Path $ProvidersRoot "$ProviderName.json"

        if (!(Test-Path $ProviderFile)) {

            throw @"
Provider not found:

$ProviderName

Expected file:

$ProviderFile
"@
        }

        Assert-NoDuplicateKeys $ProviderFile "provider"

        Write-Step "Provider: $ProviderName"

        $ProviderJson = Load-Json $ProviderFile

        Assert-ProviderDefinition $ProviderName $ProviderJson $ProviderFile

        foreach ($Entry in $ProviderJson.provider.PSObject.Properties) {

            if ($ProviderRoot.Contains($Entry.Name)) {

                throw @"
Validation failed:

Duplicate provider id:

$($Entry.Name)

Defined by more than one active provider file.

Each provider id must be unique.
"@
            }

            $ProviderRoot[$Entry.Name] = $Entry.Value
            $Declared[$Entry.Name]     = $ProviderName

            # Dual-key normalization: agents read the key from different fields.
            # OpenCode reads provider.<id>.apiKey; Kilo reads
            # provider.<id>.options.apiKey. If the source file carries only
            # one of them, mirror it so every agent works (the app writes
            # both; this fixes hand-written provider files the same way).
            if ($null -ne $Entry.Value.apiKey -and ($null -eq $Entry.Value.options -or $null -eq $Entry.Value.options.apiKey)) {

                if ($null -eq $Entry.Value.options) {

                    $Entry.Value | Add-Member -NotePropertyName "options" -NotePropertyValue ([ordered]@{ apiKey = $Entry.Value.apiKey }) -Force
                }
                else {

                    Set-ObjectProperty $Entry.Value.options "apiKey" $Entry.Value.apiKey
                }

                Write-Detail "Dual-key: options.apiKey mirrored from apiKey."
            }
        }

        Write-Success "$ProviderName loaded."
    }

    return $ProviderRoot
}

# ------------------------------------------------------------
# Reasoning formats (developer parity with the app GUI)
# ------------------------------------------------------------

$ReasoningFormats = @{
    opencode = @{ Label = "OpenCode";         Levels = @("default", "minimal", "high", "max") }
    openai   = @{ Label = "OpenAI / ChatGPT"; Levels = @("none", "low", "medium", "high", "xhigh") }
    claude   = @{ Label = "Claude";           Levels = @("low", "high", "max") }
    gemini   = @{ Label = "Gemini";           Levels = @("minimal", "low", "medium", "high") }
    none     = @{ Label = "No reasoning";     Levels = @() }
}

function Resolve-ReasoningFormat {

    # Declared reasoningFormat on the provider entry, else opencode.

    param([object]$Provider)

    $Declared = $Provider.reasoningFormat

    if ($Declared -and $ReasoningFormats.ContainsKey([string]$Declared)) { return [string]$Declared }

    return "opencode"
}

function Test-NeedsReasoningPrompt {

    # Interactive builds ask when a provider has models but no format is
    # declared, or when its models carry levels invalid for the declared
    # format (e.g. 'max' on an openai provider).

    param(
        [object]$Provider,
        [int]$ModelCount
    )

    if ($ModelCount -le 0) { return $false }

    $Fmt = Resolve-ReasoningFormat $Provider

    if (-not $Provider.reasoningFormat) { return $true }

    $Allowed = $ReasoningFormats[$Fmt].Levels

    foreach ($Model in @($Provider.models.PSObject.Properties)) {

        $Variants = $Model.Value.variants

        if (-not $Variants) { continue }

        foreach ($Variant in @($Variants.PSObject.Properties)) {

            if ($Variant.Name -notin $Allowed) { return $true }
        }
    }

    return $false
}

function Ask-ReasoningFormat {

    # Interactive picker; Enter keeps the current format. Returns the id or $null.

    param(
        [string]$ProviderName,
        [string]$Current
    )

    $Ids = @($ReasoningFormats.Keys | Sort-Object)

    Write-Host ""
    Write-Host "Provider '$ProviderName' has models - which reasoning format do they use?" -ForegroundColor Cyan

    for ($i = 0; $i -lt $Ids.Count; $i++) {

        $Mark = if ($Ids[$i] -eq $Current) { " (current)" } else { "" }

        Write-Host ("  {0}. {1}{2}" -f ($i + 1), $ReasoningFormats[$Ids[$i]].Label, $Mark)
    }

    $Answer = Read-Host "Pick 1-$($Ids.Count), Enter keeps '$Current'"

    $Answer = $Answer.Trim()

    if ($Answer -eq "") { return $null }

    $Index = 0

    if ([int]::TryParse($Answer, [ref]$Index)) {

        if ($Index -ge 1 -and $Index -le $Ids.Count) { return $Ids[$Index - 1] }
    }

    Write-Warning "Ignoring invalid choice '$Answer' - keeping '$Current'."

    return $null
}

function Set-ProviderReasoningFormat {

    # Persists the chosen format into providers\<id>.json, backup-first.
    # Never runs under -WhatIf or -Doctor (nothing may be written).

    param(
        [string]$ProviderFile,
        [string]$ProviderName,
        [string]$Format
    )

    if ($WhatIf -or $Doctor -or !(Test-Path $ProviderFile)) { return }

    $Json = Load-Json $ProviderFile

    Add-Member -InputObject $Json.provider.$ProviderName -NotePropertyName "reasoningFormat" -NotePropertyValue $Format -Force

    if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }

    $Time = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

    Copy-Item $ProviderFile (Join-Path $BackupDir "${ProviderName}_$Time.json")

    $Json | ConvertTo-Json -Depth 100 | Set-Content -Path $ProviderFile -Encoding UTF8

    Write-Success "Provider '$ProviderName': reasoningFormat = '$Format' (backup kept)."
}

function Apply-ReasoningFormatFilter {

    # Drops variant levels invalid for EVERY known reasoning format from the
    # merged OUTPUT only - source files are never touched. Variants valid for
    # any format are preserved: per-model data (e.g. gemini thinking budgets on
    # a gemini model inside an opencode provider) must survive the merge.

    param(
        [object]$Provider,
        [string]$ProviderName,
        [string]$Fmt
    )

    $AllLevels = @($ReasoningFormats.Values | ForEach-Object { $_.Levels } | Select-Object -Unique)

    foreach ($Model in @($Provider.models.PSObject.Properties)) {

        $Variants = $Model.Value.variants

        if (-not $Variants) { continue }

        $Keep = [ordered]@{}

        foreach ($Variant in @($Variants.PSObject.Properties)) {

            if ($Variant.Name -in $AllLevels) {

                $Keep[$Variant.Name] = $Variant.Value
            }
            else {

                Write-Warning "Provider '$ProviderName' model '$($Model.Name)': variant '$($Variant.Name)' dropped - not a valid reasoning level in any known format."
            }
        }

        if ($Keep.Count -ne @($Variants.PSObject.Properties).Count) {

            $Model.Value.variants = [pscustomobject]$Keep
        }
    }
}

function Enforce-ReasoningFormat {

    # Full developer-side flow for one provider: prompt (interactive only),
    # persist (real runs only), then filter the merged output.

    param(
        [object]$Provider,
        [string]$ProviderName,
        [string]$ProviderFile,
        [int]$ModelCount
    )

    if ($ModelCount -le 0) { return }

    $Fmt = Resolve-ReasoningFormat $Provider

    if (-not $NonInteractive -and (Test-NeedsReasoningPrompt $Provider $ModelCount)) {

        $Picked = Ask-ReasoningFormat $ProviderName $Fmt

        if ($Picked) {

            if ($Picked -ne $Fmt) {

                Set-ProviderReasoningFormat $ProviderFile $ProviderName $Picked

                $Fmt = $Picked
            }

            Add-Member -InputObject $Provider -NotePropertyName "reasoningFormat" -NotePropertyValue $Picked -Force
        }
    }

    Apply-ReasoningFormatFilter $Provider $ProviderName $Fmt
}

function Merge-Models {

    param(
        [object]$ProviderRoot,
        [object]$GlobalModels
    )

    $Expected = [ordered]@{}

    foreach ($ProviderName in $ProviderRoot.Keys) {

        $ProfileModels = Get-ProfileProviderModels $ProviderName

        if ($null -ne $ProfileModels) {
            Set-ObjectProperty $ProviderRoot[$ProviderName] "models" $ProfileModels.models
            $Count = @($ProfileModels.models.PSObject.Properties).Count
            Write-Detail "Provider '$ProviderName': $Count model(s) (profile-level)"
            Enforce-ReasoningFormat $ProviderRoot[$ProviderName] $ProviderName (Join-Path $ProvidersRoot "$ProviderName.json") $Count
            $Expected[$ProviderName] = $Count
            continue
        }

        $SpecificPath = Join-Path $ProvidersRoot "$ProviderName\models.json"

        if (Test-Path $SpecificPath) {

            Assert-NoDuplicateKeys $SpecificPath "model"

            $Specific = Load-Json $SpecificPath

            if (-not $Specific.models) {

                throw "Provider models file '$SpecificPath' validation failed: 'models' section is missing or invalid."
            }

            Assert-NoDuplicateModelNames $Specific "providers/$ProviderName/models.json"

            $Count = @($Specific.models.PSObject.Properties).Count

            Set-ObjectProperty $ProviderRoot[$ProviderName] "models" $Specific.models

            Write-Detail "Provider '$ProviderName': $Count model(s) (provider-specific)"

            Enforce-ReasoningFormat $ProviderRoot[$ProviderName] $ProviderName (Join-Path $ProvidersRoot "$ProviderName.json") $Count

            $Expected[$ProviderName] = $Count

            continue
        }

        $Inline = $ProviderRoot[$ProviderName].models

        if ($Inline -and @($Inline.PSObject.Properties).Count -gt 0) {

            Assert-NoDuplicateModelNames $ProviderRoot[$ProviderName] "provider '$ProviderName'"

            $Count = @($Inline.PSObject.Properties).Count

            Write-Detail "Provider '$ProviderName': $Count model(s) (inline)"

            Enforce-ReasoningFormat $ProviderRoot[$ProviderName] $ProviderName (Join-Path $ProvidersRoot "$ProviderName.json") $Count

            $Expected[$ProviderName] = $Count

            continue
        }

        Write-Detail "Provider '$ProviderName': no models configured"

        $Expected[$ProviderName] = 0
    }

    return $Expected
}

function Merge-Plugins {

    param(
        [object]$Plugins
    )

    if ($Plugins -and $Plugins.plugin) {

        Assert-NoDuplicatePluginIds $Plugins "plugins.json"

        return ,$Plugins.plugin
    }

    return $null
}

function Merge-Mcp {

    param(
        [object]$MCP
    )

    if ($MCP -and $MCP.mcp) {

        return $MCP.mcp
    }

    return $null
}

function Merge-Lsp {

    param(
        [object]$Lsp
    )

    if ($null -eq $Lsp) { return $null }

    if ($Lsp.enabled) {

        if ($null -ne $Lsp.lsp) { return $Lsp.lsp }

        return $true
    }

    return $false
}

function Merge-Final {

    param(
        [object]$Settings,
        [object]$ProviderRoot,
        [object]$Plugins,
        [object]$MCP,
        [object]$Lsp
    )

    $Final = Merge-Settings $Settings

    $Final.provider = $ProviderRoot

    if ($Plugins)     { $Final.plugin = $Plugins }
    if ($null -ne $Lsp) { $Final.lsp   = $Lsp }
    if ($MCP)         { $Final.mcp     = $MCP }

    return $Final
}

# ------------------------------------------------------------
# Verification
# ------------------------------------------------------------

function Verify-Json {

    param(
        [object]$Final
    )

    try {

        $Null = $Final | ConvertTo-Json -Depth 100 | ConvertFrom-Json
    }
    catch {

        throw "Verification failed: generated configuration is not valid JSON.`n$_"
    }
}

function Verify-Providers {

    param(
        [object]$Final,
        [object]$Settings
    )

    if (-not $Final.provider -or $Final.provider.Count -eq 0) {

        throw "Verification failed: no providers were generated."
    }

    foreach ($ProviderName in $Settings.activeProviders) {

        if (-not $Final.provider.Contains($ProviderName)) {

            throw "Verification failed: provider '$ProviderName' is missing from the generated configuration."
        }
    }
}

function Verify-Models {

    param(
        [object]$Final,
        [object]$Expected
    )

    foreach ($Entry in $Expected.GetEnumerator()) {

        $Provider = $Final.provider[$Entry.Key]

        $Actual = 0

        if ($Provider.models) { $Actual = @($Provider.models.PSObject.Properties).Count }

        if ($Entry.Value -gt 0 -and $Actual -ne $Entry.Value) {

            throw @"
Verification failed:

Provider '$($Entry.Key)' model mismatch.

Expected: $($Entry.Value)

Actual:   $Actual
"@
        }
    }

    # Active providers without a models source were already dropped
    # after Merge-Models (with a warning) — every provider left here
    # is expected to carry models.
}

function Verify-Plugins {

    param(
        [object]$Final,
        [object]$Plugins
    )

    if ($Plugins -and $Plugins.PSObject.Properties['plugin'] -and @($Plugins.plugin).Count -gt 0 -and -not $Final.Contains('plugin')) {

        throw "Verification failed: plugin section is missing from the generated configuration."
    }
}

function Verify-Mcp {

    param(
        [object]$Final,
        [object]$MCP
    )

    if ($MCP -and $MCP.PSObject.Properties['mcp'] -and $MCP.mcp.PSObject.Properties.Count -gt 0 -and -not $Final.Contains('mcp')) {

        throw "Verification failed: mcp section is missing from the generated configuration."
    }
}

function Verify-FinalOutput {

    param(
        [object]$Final,
        [object]$Settings,
        [object]$ExpectedModels,
        [object]$Plugins,
        [object]$MCP,
        [object]$Lsp
    )

    Verify-Json $Final
    Verify-Providers $Final $Settings
    Verify-Models $Final $ExpectedModels
    Verify-Plugins $Final $Plugins
    Verify-Mcp $Final $MCP

    if ($Lsp -and $Lsp.enabled -and $Lsp.lsp -and -not $Final.lsp) {

        throw "Verification failed: lsp section is missing from the generated configuration."
    }

    Write-Success "Generated configuration verified."
}

# ------------------------------------------------------------
# Backup (F4: retention)
# ------------------------------------------------------------

function Backup-CurrentConfig {

    if (!(Test-Path $OutputFile)) {
        return
    }

    if (!(Test-Path $BackupDir)) {

        try {

            New-Item `
                -ItemType Directory `
                -Path $BackupDir | Out-Null
        }
        catch {

            throw "Backup failed: unable to create backup directory.`n$BackupDir"
        }
    }

    $Time = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

    try {

        Copy-Item `
            $OutputFile `
            (Join-Path $BackupDir "${TargetBase}_$Time.json")

        $BackupFile = Get-Item (Join-Path $BackupDir "${TargetBase}_$Time.json")
        $BackupFile.CreationTime = Get-Date
        $BackupFile.LastWriteTime = Get-Date
    }
    catch {

        throw "Backup failed: unable to copy the current configuration.`n$_"
    }

    Write-Success "Backup created."
}

function Prune-Backups {

    # Keeps only the newest $Keep files per prefix (dynamic artifact prefix <TargetBase>_*, settings_*).

    param(
        [int]$Keep
    )

    if (!(Test-Path $BackupDir)) { return }

    foreach ($Prefix in @("${TargetBase}_", "settings_")) {

        $Files = @(Get-ChildItem -Path $BackupDir -Filter "$Prefix*.json" -File | Sort-Object Name -Descending)

        if ($Files.Count -gt $Keep) {

            foreach ($Old in ($Files | Select-Object -Skip $Keep)) {

                Remove-Item $Old.FullName -Force
                Write-Detail "Pruned backup: $($Old.Name)"
            }
        }
    }
}

# ------------------------------------------------------------
# Provenance (F5)
# ------------------------------------------------------------

function Get-ObjectKeys {

    # Returns the content keys of a JSON object whether it is a
    # PowerShell OrderedDictionary/Hashtable (merge stage) or a
    # PSCustomObject (loaded from a backup file).

    param(
        [object]$Obj
    )

    if ($null -eq $Obj) { return @() }
    if ($Obj -is [System.Collections.IDictionary]) { return @($Obj.Keys) }
    if ($Obj -is [System.Management.Automation.PSCustomObject]) { return @($Obj.PSObject.Properties.Name) }
    return @()
}

function Get-ObjectValue {

    # Indexes an object by property name (works for both dictionary and
    # PSCustomObject content without triggering the host error path).

    param(
        [object]$Obj,
        [string]$Key
    )

    if ($Obj -is [System.Collections.IDictionary]) { return $Obj[$Key] }
    return $Obj.$Key
}

function Get-Sha256Text {

    param(
        [string]$Text
    )

    $Sha    = [System.Security.Cryptography.SHA256]::Create()
    $Bytes  = [System.Text.Encoding]::UTF8.GetBytes($Text)
    $Hash   = $Sha.ComputeHash($Bytes)
    $Hex    = [System.BitConverter]::ToString($Hash).Replace("-", "").ToLower()

    return $Hex
}

function Write-ProvenanceFile {

    # Stamps the sidecar. Never writes INTO the target artifact ($TargetArtifact)
    # (consumer-schema safety).

    param(
        [string]$OutputSha256
    )

    $Prov = [ordered]@{
        builderVersion = "K1"
        profile        = $Profile
        providers      = @($ActiveProviders)
        generatedUtc   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")
        outputSha256   = $OutputSha256
    }

    $Json = $Prov | ConvertTo-Json -Depth 5

    try {

        [System.IO.File]::WriteAllText($ProvenancePath, $Json, (New-Object System.Text.UTF8Encoding $false))
    }
    catch {

        throw "Failed to write provenance file.`n$ProvenancePath`n$_"
    }

    Write-Success "Provenance stamped: $ProvenancePath"
}

# ------------------------------------------------------------
# Merge diff summary (F7)
# ------------------------------------------------------------

function Get-LatestBackupConfig {

    # Returns the parsed content of the newest backup/<TargetBase>_*.json,
    # or $null when no backup exists yet.

    if (!(Test-Path $BackupDir)) { return $null }

    $Latest = @(Get-ChildItem -Path $BackupDir -Filter "${TargetBase}_*.json" -File | Sort-Object Name -Descending | Select-Object -First 1)

    if ($Latest.Count -eq 0) { return $null }

    return Get-Content $Latest[0].FullName -Raw | ConvertFrom-Json
}

function Compare-BackupDiff {

    # Compares the generated configuration with the previous backup artifact.
    # Returns human-readable diff lines (F7): Added/Removed/Updated.

    param(
        [object]$Final
    )

    $Lines = New-Object System.Collections.ArrayList

    $Prior = Get-LatestBackupConfig

    if ($null -eq $Prior) {

        [void]$Lines.Add("No prior backup artifact found; no diff to report.")
        return @($Lines)
    }

    $CurrentProviders = Get-ObjectKeys $Final.provider | Sort-Object
    $PriorProviders   = Get-ObjectKeys $Prior.provider   | Sort-Object

    foreach ($Id in $CurrentProviders) {

        if ($PriorProviders -notcontains $Id) { [void]$Lines.Add("Added provider: $Id") }
    }

    foreach ($Id in $PriorProviders) {

        if ($CurrentProviders -notcontains $Id) { [void]$Lines.Add("Removed provider: $Id") }
    }

    foreach ($Id in $CurrentProviders) {

        if ($PriorProviders -contains $Id) {

            $CurrentCount = 0
            $PriorCount   = 0

            $CurrentModels = Get-ObjectValue $Final.provider $Id
            $PriorModels   = Get-ObjectValue $Prior.provider $Id

            if ($CurrentModels.models) { $CurrentCount = @(Get-ObjectKeys $CurrentModels.models).Count }
            if ($PriorModels.models)   { $PriorCount   = @(Get-ObjectKeys $PriorModels.models).Count }

            if ($CurrentCount -ne $PriorCount) { [void]$Lines.Add("Provider '$Id' model count: $PriorCount -> $CurrentCount") }
        }
    }

    $CurrentMcp = Get-ObjectKeys $Final.mcp
    $PriorMcp   = Get-ObjectKeys $Prior.mcp

    foreach ($Name in ($CurrentMcp | Sort-Object)) {

        if ($PriorMcp -notcontains $Name) { [void]$Lines.Add("Added mcp server: $Name") }
    }

    foreach ($Name in ($PriorMcp | Sort-Object)) {

        if ($CurrentMcp -notcontains $Name) { [void]$Lines.Add("Removed mcp server: $Name") }
    }

    $CurrentPlugins = @($Final.plugin)
    $PriorPlugins   = @($Prior.plugin)

    foreach ($Id in ($CurrentPlugins | Sort-Object)) {

        if ($PriorPlugins -notcontains $Id) { [void]$Lines.Add("Added plugin: $Id") }
    }

    foreach ($Id in ($PriorPlugins | Sort-Object)) {

        if ($CurrentPlugins -notcontains $Id) { [void]$Lines.Add("Removed plugin: $Id") }
    }

    $CurrentLspEnabled = @(Get-ObjectKeys $Final) -contains "lsp"
    $PriorLspEnabled   = @(Get-ObjectKeys $Prior) -contains "lsp"
    if ($CurrentLspEnabled -ne $PriorLspEnabled) {
        [void]$Lines.Add("$(if ($CurrentLspEnabled) { "Added" } else { "Removed" }) LSP servers")
    }

    if ($Lines.Count -eq 0) {

        [void]$Lines.Add("No changes detected vs previous backup.")
    }

    return @($Lines)
}

# ------------------------------------------------------------
# -Doctor mode (F6)
# ------------------------------------------------------------

function Invoke-Doctor {

    # Read-only diagnostics of the real configuration at $ConfigRoot.
    # Prints a File | Status | Detail table. Never writes, never backs up.

    Write-Step "Doctor mode: inspecting configuration at $ConfigRoot"

    $Rows = New-Object System.Collections.ArrayList

    function Add-DoctorRow {

        param(
            [string]$File,
            [string]$Status,
            [string]$Detail
        )

        [void]$Rows.Add(@{ File = $File; Status = $Status; Detail = $Detail })
    }

    # --- structural checks ----------------------------------------

    if (!(Test-Path $ConfigRoot)) {

        Add-DoctorRow $ConfigRoot "Error" "config root does not exist"
    }

    if (!(Test-Path $ProfilesRoot)) {

        Add-DoctorRow "profiles/" "Error" "profiles directory missing"
    }
    else {

        Add-DoctorRow "profiles/" "Clean" ""
    }

    if (!(Test-Path $ProvidersRoot)) {

        Add-DoctorRow "providers/" "Error" "providers directory missing"
    }
    else {

        Add-DoctorRow "providers/" "Clean" ""
    }

    $DoctorActive = [string[]]@()

    if (!(Test-Path $SettingsFile)) {

        Add-DoctorRow "profiles/$Profile/settings.json" "Error" "settings.json missing"
    }
    else {

        try {

            $DoctorSettings = Load-Json $SettingsFile
            Assert-SettingsShape $DoctorSettings
            $DoctorActive = @($DoctorSettings.activeProviders)
            Add-DoctorRow "profiles/$Profile/settings.json" "Clean" "$($DoctorActive.Count) active provider(s)"
        }
        catch {

            Add-DoctorRow "profiles/$Profile/settings.json" "Error" $_.Exception.Message
        }
    }

    $script:ActiveProviders = $DoctorActive

    # --- pre-flight (F2) -------------------------------------------

    $Missing = Assert-InputFilesExist

    foreach ($M in $Missing) {

        $Short = $M.Replace($ConfigRoot + "\", "")

        Add-DoctorRow $Short "Error" "missing input file"
    }

    # --- schema compliance (F1) ------------------------------------

    if (!(Test-Path $SchemaDir)) {

        Add-DoctorRow "schemas/" "Warn" "no schema directory; schema validation skipped"
    }
    else {

        Add-DoctorRow "schemas/" "Clean" ""

        foreach ($Source in (Get-CurrentSources)) {

            $Short = $Source.File.Replace($ConfigRoot + "\", "")

            $SchemaFile = Join-Path $SchemaDir $Source.Schema

            if (!(Test-Path $SchemaFile)) {

                Add-DoctorRow $Short "Error" "schema file missing: $($Source.Schema)"
                continue
            }

            try {

                $Schema   = Get-Content $SchemaFile -Raw | ConvertFrom-Json
                $Result   = Test-SchemaCompliance $Source.File $Schema

                if ($Result.Valid) {

                    Add-DoctorRow $Short "Clean" ""
                }
                else {

                    Add-DoctorRow $Short "Error" ($Result.Errors -join "; ")
                }
            }
            catch {

                Add-DoctorRow $Short "Error" $_.Exception.Message
            }
        }
    }

    # --- duplicate-key checks ---------------------------------------

    foreach ($Source in (Get-CurrentSources)) {

        if (!(Test-Path $Source.File)) { continue }

        $Short = $Source.File.Replace($ConfigRoot + "\", "")

        try {

            $Dups = Get-DuplicateJsonKeys (Get-Content $Source.File -Raw)

            if ($Dups.Count -gt 0) {

                Add-DoctorRow $Short "Error" "duplicate key(s): $($Dups -join ', ')"
            }
        }
        catch {

            Add-DoctorRow $Short "Error" $_.Exception.Message
        }
    }

    # --- report ------------------------------------------------------

    Write-Host ""
    Write-Host "File | Status | Detail" -ForegroundColor Cyan
    Write-Host "-----|--------|-------" -ForegroundColor Cyan

    $Clean = 0

    foreach ($Row in $Rows) {

        $Color = "Gray"

        if ($Row.Status -eq "Clean") { $Color = "Green" }
        if ($Row.Status -eq "Warn")  { $Color = "DarkYellow" }
        if ($Row.Status -eq "Error") { $Color = "Red" }

        Write-Host ("{0,-42} | {1,-6} | {2}" -f $Row.File, $Row.Status, $Row.Detail) -ForegroundColor $Color

        if ($Row.Status -eq "Clean") { $Clean++ }
    }

    $Issues = @($Rows | Where-Object { $_.Status -eq "Error" }).Count

    Write-Host ""
    Write-Host "Doctor: $($Rows.Count) file(s) checked, $Issues issue(s) found." -ForegroundColor Cyan

    if ($Issues -eq 0) {

        Write-Success "Doctor: configuration is clean."
        return $true
    }

    Write-Failure "Doctor: configuration has issues."
    return $false
}

# ------------------------------------------------------------
# Active-provider selection (discovery, resolution, persistence)
# ------------------------------------------------------------

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

function Compare-JsonArrays {

    param([object[]]$A, [object[]]$B)

    if ($A.Count -ne $B.Count) { return $false }
    for ($i = 0; $i -lt $A.Count; $i++) { if ("$($A[$i])" -ne "$($B[$i])") { return $false } }
    return $true
}

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

    if ($NonInteractive) { return ,@($Stored | Where-Object { $_ }) }   # stored settings.json list

    return Select-ActiveProviders $Discovered $Stored
}

function Persist-ActiveProviders {

    param([string[]]$Active)

    if ($Active.Count -eq 0) { throw "No active providers selected; build aborted. settings.json activeProviders is empty." }

    if ($WhatIf) {

        Write-Detail "WhatIf: settings.json persistence skipped."
        return
    }

    $SettingsFile = Join-Path $ProfilePath "settings.json"

    # Backup + rewrite settings.json, but ONLY when the list differs
    # (otherwise a no-op run would still reformat the file).
    $Raw = Get-Content $SettingsFile -Raw
    $Obj = $Raw | ConvertFrom-Json
    if (-not (Compare-JsonArrays $Obj.activeProviders $Active)) {
        if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }
        $ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $BackupFile = Join-Path $BackupDir "settings_$($Profile)_$ts.json"
        Copy-Item $SettingsFile $BackupFile
        Write-Detail "settings.json backed up to $BackupFile"

        $Out = [ordered]@{}
        if ($Obj.PSObject.Properties.Name -contains '$schema') { $Out['$schema'] = $Obj.'$schema' }
        $Out['activeProviders'] = @($Active)
        # Preserve every OTHER settings key (model, small_model, agent, permission,
        # username, hide_prompt_training_models, default_agent, experimental,
        # skills, disabled_providers, ...) so the builder doesn't strip the agent
        # shape when persisting the active-provider list.
        foreach ($Prop in $Obj.PSObject.Properties) {
            if ($Prop.Name -in @('$schema', 'activeProviders')) { continue }
            $Out[$Prop.Name] = $Prop.Value
        }
        $Json = $Out | ConvertTo-Json -Depth 100
        [System.IO.File]::WriteAllText($SettingsFile, $Json, (New-Object System.Text.UTF8Encoding $false))
        Write-Success "settings.json updated (activeProviders: $( $Active -join ', ' )"
    }
}

function Get-ProfileProviderModels {

    param([string]$ProviderId)

    $File = Join-Path $ProfilePath ('{0}-models.json' -f $ProviderId)
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

# ------------------------------------------------------------
# Start
# ------------------------------------------------------------

$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

Write-Header

Write-Step "Selected profile: $Profile"

if (!(Test-Path $ProfilePath)) {
    if ($Doctor) {
        $Fallback = Get-ChildItem $ProfilesRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -First 1
        if ($Fallback) {
            Write-Host "[i] Profile '$Profile' not found - Doctor inspecting first available profile '$($Fallback.Name)' instead." -ForegroundColor DarkYellow
            $ProfilePath = $Fallback.FullName
            $Profile = $Fallback.Name
        } else {
            throw "No profiles found under '$ProfilesRoot'. Create a profile folder first."
        }
    } else {
        throw "Profile '$Profile' does not exist.`n$ProfilePath"
    }
}

$SettingsFile = Join-Path $ProfilePath "settings.json"
$ModelsFile   = Join-Path $ProfilePath "models.json"
$PluginsFile  = Join-Path $ProfilePath "plugins.json"
$McpFile      = Join-Path $ProfilePath "mcp.json"
$LspFile      = Join-Path $ProfilePath "lsp.json"

if ($Doctor) {

    $DoctorClean = Invoke-Doctor

    if ($DoctorClean) { exit 0 } else { exit 1 }
}

# ------------------------------------------------------------
# Stage 0 - Discover-Providers
# ------------------------------------------------------------
Write-Step "Discovering providers..."
$DiscoveredProviders = Discover-Providers
Write-Success "$($DiscoveredProviders.Count) provider(s) discovered."

Write-Step "Resolving active providers..."
$Settings = Load-Json $SettingsFile
$ActiveProviders = Resolve-ActiveProviders $DiscoveredProviders @($Settings.activeProviders)
$Settings.activeProviders = $ActiveProviders

# ------------------------------------------------------------
# Stage 1 - Load Profile
# ------------------------------------------------------------

Write-Step "Loading profile..."

$ModelsFile   = Join-Path $ProfilePath "models.json"
$PluginsFile  = Join-Path $ProfilePath "plugins.json"
$McpFile      = Join-Path $ProfilePath "mcp.json"

$Settings = Load-Json $SettingsFile
$Plugins  = Load-OptionalJson $PluginsFile
$MCP      = Load-OptionalJson $McpFile

$LspFile = Join-Path $ProfilePath "lsp.json"
$Lsp = $null
if (Test-Path $LspFile) {
    Assert-NoDuplicateKeys $LspFile "lsp"
    $Lsp = Load-Json $LspFile
}

Write-Success "settings.json"

if ($Plugins)  { Write-Success "plugins.json"  } else { Write-Warning "plugins.json missing - plugins section will be skipped" }
if ($MCP)      { Write-Success "mcp.json"      } else { Write-Warning "mcp.json missing - mcp section will be skipped" }
if ($Lsp)      { Write-Success "lsp.json"      } else { Write-Warning "lsp.json missing - lsp section will be skipped" }

# ------------------------------------------------------------
# Stage 2 - Load Provider (reference check; merging happens in Stage 6)
# ------------------------------------------------------------

Write-Step "Loading provider refs..."

foreach ($ProviderName in $ActiveProviders) {

    Write-Detail "Provider ref: $ProviderName"
}

Write-Success "$($ActiveProviders.Count) active provider reference(s) loaded."

# ------------------------------------------------------------
# Stage 3 - Schema Validation (F2 pre-flight gate + F1 checks)
# ------------------------------------------------------------

Write-Step "Pre-flight dependency check..."

$MissingInputs = Assert-InputFilesExist

if ($MissingInputs.Count -gt 0) {

    Write-Failure "Pre-flight failed: $($MissingInputs.Count) missing input(s)"

    foreach ($M in $MissingInputs) {

        Write-Failure "Missing: $M"
    }

    exit 1
}

Write-Success "All input dependencies present."

Write-Step "Checking schema compliance..."

if (Test-Path $SchemaDir) {

    foreach ($Source in (Get-CurrentSources)) {

        Invoke-SourceSchemaCheck $Source.File $Source.Schema
    }

    Write-Success "All sources pass schema validation."
}
else {

    Write-Warning "No schema directory found at $SchemaDir - skipping schema validation."
}

# Persist the resolved active-provider list only AFTER pre-flight and
# schema validation have passed, so a clean slate is possible before
# settings.json is touched.

Persist-ActiveProviders $ActiveProviders
$Settings.activeProviders = $ActiveProviders

# ------------------------------------------------------------
# Stage 4 - Validation
# ------------------------------------------------------------

Write-Step "Validating profile..."

Assert-SettingsShape $Settings
Assert-ConfigurationShape $Settings $Models $Plugins $MCP

if ($Models) {
    Assert-NoDuplicateKeys $ModelsFile "model"
    Assert-NoDuplicateModelNames $Models "models.json"
}

if ($MCP) {
    Assert-NoDuplicateKeys $McpFile "mcp"
}

Write-Success "Profile settings validated."

# ------------------------------------------------------------
# Stage 5 - Backup
# ------------------------------------------------------------

Write-Step "Creating backup..."

if ($WhatIf) {

    Write-Detail "WhatIf: backup skipped (no writes in dry-run mode)."
}
else {

    Backup-CurrentConfig
}

# ------------------------------------------------------------
# Stage 6 - Merge
# ------------------------------------------------------------

Write-Step "Merging providers..."

$ProviderRoot = Merge-Providers $Settings

$ProviderCount = $ProviderRoot.Count

Write-Success "$ProviderCount provider(s) merged."

Write-Step "Merging models..."

$ExpectedModels = Merge-Models $ProviderRoot $Models

$ModelCount = ($ExpectedModels.Values | Measure-Object -Sum).Sum

Write-Success "$ModelCount model(s) merged."

# ------------------------------------------------------------
# Active-provider model guard: a provider without any models
# source is NOT considered active. It is dropped (with a
# warning) and removed from settings.json, so the persisted
# active list only contains providers that produced models.
# ------------------------------------------------------------
$DroppedProviders = @($ActiveProviders | Where-Object { -not $ExpectedModels[$_] -or $ExpectedModels[$_] -eq 0 })

if ($DroppedProviders.Count -gt 0) {

    foreach ($P in $DroppedProviders) {

        Write-Warning "Provider '$P': models not found (no <provider>-models.json, providers/$P/models.json, or inline models). Provider will not be considered active and was removed from settings.json."
    }

    $ActiveProviders = @($ActiveProviders | Where-Object { $DroppedProviders -notcontains $_ })

    foreach ($P in $DroppedProviders) {

        $ProviderRoot.Remove($P)
        $ExpectedModels.Remove($P)
    }

    Persist-ActiveProviders $ActiveProviders
    $Settings.activeProviders = $ActiveProviders

    Write-Success "Active providers after model check: $($ActiveProviders -join ', ')"
}

Write-Step "Merging plugins..."

$PluginList = Merge-Plugins $Plugins

if ($PluginList) {

    Write-Success "$($PluginList.Count) plugin(s) merged."
}
else {

    Write-Detail "No plugins to merge."
}

if ($Lsp) {
    Write-Step "LSP..."
    if (-not $NonInteractive) {
        $Prompt = "LSP servers: [1] enabled  [2] disabled  (Enter keeps current)"
        $Answer = Read-Host $Prompt
        if ($Answer -eq "1") { $Lsp.enabled = $true }
        elseif ($Answer -eq "2") { $Lsp.enabled = $false }
        if ($Answer -eq "1" -or $Answer -eq "2") {
            if (-not $WhatIf) {
                if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }
                $Time = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
                Copy-Item $LspFile (Join-Path $BackupDir "lsp_$Time.json")
                $LspJson = @{ lsp = $Lsp.lsp; enabled = $Lsp.enabled } | ConvertTo-Json -Depth 10
                [System.IO.File]::WriteAllText($LspFile, $LspJson, (New-Object System.Text.UTF8Encoding($false)))
                Write-Success "lsp.json updated (enabled: $($Lsp.enabled))"
            }
        }
    }
    Write-Success "lsp $((Merge-Lsp $Lsp))"
} else {
    Write-Detail "No lsp.json - lsp section will be skipped"
}

Write-Step "Merging mcp..."

$McpList = Merge-Mcp $MCP

if ($McpList) {

    Write-Success "$(@($McpList.PSObject.Properties).Count) mcp server(s) merged."
}
else {

    Write-Detail "No mcp servers to merge."
}

Write-Step "Generating final configuration..."

$LspList = Merge-Lsp $Lsp
$Final = Merge-Final $Settings $ProviderRoot $PluginList $McpList $LspList

Write-Success "Configuration merged."

# ------------------------------------------------------------
# Stage 7 - Generation (write output + provenance sidecar F5)
# ------------------------------------------------------------

Write-Step "Verifying generated configuration..."

Verify-FinalOutput $Final $Settings $ExpectedModels $Plugins $MCP $Lsp

if ($WhatIf) {

    Write-Host ""
    Write-Host "[WhatIf] Would write $TargetArtifact" -ForegroundColor Magenta
    Write-Host "[WhatIf] Would write $TargetBase.provenance.json" -ForegroundColor Magenta

    $Changes = Compare-BackupDiff $Final

    Write-Host ""
    Write-Host "[WhatIf] Planned changes:" -ForegroundColor Magenta

    foreach ($Line in $Changes) {

        Write-Host "  $Line" -ForegroundColor Magenta
    }
}
else {

    Write-Step "Writing $TargetArtifact..."

    try {

        $Json = $Final | ConvertTo-Json -Depth 100

        [System.IO.File]::WriteAllText(
            $OutputFile,
            $Json,
            (New-Object System.Text.UTF8Encoding $false)
        )

    }
    catch {

        throw "Failed to generate $TargetArtifact.`n$_"
    }

    Write-Success "Configuration written."

    Write-Step "Stamping provenance sidecar..."

    $OutputSha = Get-Sha256Text $Json

    Write-ProvenanceFile $OutputSha
}

# ------------------------------------------------------------
# Stage 8 - Verification (round-trip + diff summary F7)
# ------------------------------------------------------------

if (-not $WhatIf) {

    $RoundTrip = Load-Json $SettingsFile

    if (-not (Compare-JsonArrays @($RoundTrip.activeProviders) @($ActiveProviders))) {

        throw "Verification failed: settings.json activeProviders ($( $RoundTrip.activeProviders -join ', ' )) does not match the resolved list ($( $ActiveProviders -join ', ' ))."
    }

    Write-Success "settings.json persistence verified."
}

if (-not $WhatIf) {

    Write-Step "Diff summary vs previous backup..."

    foreach ($Line in (Compare-BackupDiff $Final)) {

        if ($Line -match "^Added ") { Write-Success "[+] $Line" }
        elseif ($Line -match "^Removed ") { Write-Failure "[-] $Line" }
        else { Write-Detail "      $Line" }
    }
}

if (-not $WhatIf) {

    Write-Step "Pruning backups (keep newest $KeepBackups)..."
    Prune-Backups $KeepBackups
}

$Stopwatch.Stop()

# ------------------------------------------------------------
# Summary
# ------------------------------------------------------------

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "               BUILD COMPLETE" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

Write-Host "Profile    : " -NoNewline
Write-Host $Profile -ForegroundColor Cyan

Write-Host "Providers  : " -ForegroundColor Cyan

foreach ($Provider in $Settings.activeProviders) {
    Write-Host "             $Provider"
}

if ($WhatIf) {

    Write-Host "Dry run    : PASS (nothing written)" -ForegroundColor Green
    Write-Host "Validation : PASS" -ForegroundColor Green
    Write-Host "Merge      : PASS" -ForegroundColor Green
    Write-Host "Verification: PASS" -ForegroundColor Green
    Write-Host "Generated  : SKIPPED (WhatIf)" -ForegroundColor DarkYellow
    Write-Host "Build Time : " -NoNewline
    Write-Host "$($Stopwatch.ElapsedMilliseconds) ms" -ForegroundColor Cyan

    Write-Host ""

    Write-Success "Builder K1 dry-run finished successfully."

    exit 0
}

Write-Host "Validation : PASS" -ForegroundColor Green
Write-Host "Merge      : PASS" -ForegroundColor Green
Write-Host "Verification: PASS" -ForegroundColor Green
Write-Host "Generated  : PASS" -ForegroundColor Green
Write-Host "Build Time : " -NoNewline
Write-Host "$($Stopwatch.ElapsedMilliseconds) ms" -ForegroundColor Cyan

Write-Host ""

Write-Host "Output     : " -NoNewline
Write-Host $OutputFile -ForegroundColor Green

Write-Host ""

Write-Success "Builder K1 finished successfully."

exit 0
