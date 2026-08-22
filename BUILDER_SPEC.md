# Builder Specification

> Functional specification for the OpenCode Configuration Builder.

---

# Purpose

The builder is responsible for generating the final `opencode.json` configuration used by OpenCode.

It acts as the automation layer between the modular source configuration and the final generated configuration.

The builder is the only component that generates `opencode.json`.

It never modifies the source configuration files.

---

# Design Goals

The builder was designed to achieve the following goals.

- Eliminate manual editing of `opencode.json`.
- Keep configuration modular.
- Preserve source configuration.
- Produce deterministic output.
- Fail safely on invalid configuration.
- Support future expansion without redesigning the project.

These goals influence every stage of the build process.

---

# Responsibilities

The builder is responsible for automation only.

It transforms source configuration into generated configuration.

The builder does **not** define configuration.

Configuration is defined exclusively by the source JSON files.

This separation keeps implementation independent from configuration.

---

The builder SHALL

- Read configuration.
- Validate configuration.
- Preserve previous output.
- Merge configuration.
- Generate output.
- Report errors.

The builder SHALL NOT

- Modify source files.
- Modify documentation.
- Modify provider definitions.
- Modify profile configuration.
- Require manual editing of generated files.

---

# Inputs

The builder reads configuration from the selected profile.

The profile is chosen at invocation time.

```
profiles/<profile>/

settings.json

models.json

plugins.json

mcp.json

lsp.json
```

`settings.json` is required.

`models.json`, `plugins.json`, `mcp.json`, and `lsp.json` are optional.

Only the sections that exist are merged into the generated configuration.

and

```
providers/

omniroute.json
```

---

# Output

The builder generates exactly one file.

```
opencode.json
```

This file is consumed by OpenCode.

---

# Build Pipeline

The complete build process follows this sequence.

```
Start

↓

Load Profile

↓

Validate

↓

Merge Configuration
(settings → providers → models → plugins → mcp)

↓

Create Backup

↓

Generate Final Configuration

↓

Verify Output

↓

Write opencode.json

↓

Finish
```

Every build follows this order.

No stage may be skipped.

## Harness contract

Every engine change is gated by its bundled test harnesses:

- `app/engine/test-opencode-v2.7.ps1` — v2.7: 40 tests.
- `app/engine/kilo/test-kilo-v1.ps1` — kilo: 37 tests.

Harnesses exit non-zero on any failure. Determinism is asserted: same inputs produce byte-identical output.

---

# Release Pipeline

Release documentation follows the same automation philosophy as the builder: facts are written once, documentation is generated, and generated artifacts are never edited manually.

The release pipeline has one hand-edited input and one generator.

```
docs/release_registry.json
    |
    v
scripts/release-manager.ps1
    |
    +---> CHANGELOG.md          (generated marker section only)
    +---> CURRENT_RELEASE.md    (generated quick reference)
    +---> bdf/VERSION.md        (generated compatibility rows)
    +---> PROJECT_STATE.md      (generated version history table)
```

The registry (`docs/release_registry.json`) is the only hand-edited release artifact.

It is the sequence authority for version documentation.

The release manager (`scripts/release-manager.ps1`) generates all release documentation from it.

## Marker Policy

`CHANGELOG.md` and `PROJECT_STATE.md` carry

```
<!-- AUTO-GENERATED START -->

...

<!-- AUTO-GENERATED END -->
```

The release manager rewrites only the content between the markers.

Manual prose above and below the markers is never touched.

If the markers are missing, the script aborts rather than guessing.

## Failure Policy

Generation is all-or-nothing.

Validation happens before anything is written.

If any input fails validation, nothing is written and the script exits with failure.

The repository is left exactly as it was before the run.

## Release Workflow

Every release follows the same workflow.

```
AI updates release_registry.json

    v

User reviews the release facts

    v

Run release-manager.ps1

    v

Generated Docs (CHANGELOG, CURRENT_RELEASE, VERSION, PROJECT_STATE)

    v

Commit
```

The generated files are never edited manually.

---

# Stage 1 — Load Profile

The builder begins by loading the profile selected at invocation time.

The profile is passed as a parameter.

```
-Profile <profile-name>
```

The default profile is

```
default
```

Example

```
build-opencode-v2.ps1 -Profile default
```

The builder loads

- settings.json (required)
- models.json (optional)
- plugins.json (optional)
- mcp.json (optional)
- lsp.json (optional)

The build stops immediately if settings.json is missing.

### Why

The profile defines **what** configuration should be used.

Loading the profile first ensures that all subsequent stages operate on the correct configuration set.

---

# Stage 2 — Load Provider

The builder reads

```
activeProviders
```

from

```
settings.json
```

The builder loads every provider listed.

Current implementation

```
omniroute
```

The provider definition is read from

```
providers/omniroute.json
```

### Why

Provider definitions are independent from profiles.

Separating provider configuration allows connection details to change without modifying profile configuration.

---

# Stage 3 — Validation

Before generating the configuration, the builder validates the project.

Validation includes

- The selected profile exists.
- settings.json exists.
- JSON syntax is valid.
- `activeProviders` exists and is an array.
- `activeProviders` contains at least one provider.
- `activeProviders` contains no duplicate provider identifiers.
- Provider files exist.
- Provider identifier matches the provider filename.
- The provider section is present and non-empty.
- No duplicate provider identifiers across active provider files.
- No duplicate model identifiers (raw text, not collapsed by parsing).
- No duplicate model names within a models source.
- No duplicate plugin identifiers.
- No duplicate MCP identifiers.
- Malformed provider definitions are rejected.
- Malformed profile definitions are rejected.
- Missing required fields are rejected.
- Invalid configuration structure is rejected.
- At least one provider was loaded.

The build must stop immediately when validation fails.

Partial output is never generated.

### Why

Validation prevents invalid configurations from reaching OpenCode.

It is significantly easier to detect configuration problems during generation than after OpenCode starts.

---

# Stage 4 — Backup

Before overwriting an existing configuration, the builder creates a backup.

Backups are stored in

```
backup/
```

Each backup uses a timestamp-based filename.

Example

```
opencode_2026-08-02_18-30-45.json
```

Backups are never modified after creation.

### Why

Backups guarantee that a previously working configuration can always be restored.

Configuration generation should never destroy the last known working configuration.

---

# Stage 5 — Merge

The builder combines the source configuration.

Merge is split into independent stages.

```
Merge Settings

↓

Merge Providers

↓

Merge Models

↓

Merge Plugins

↓

Merge MCP

↓

Merge LSP

↓

Generate Final Configuration
```

Each stage is implemented as its own function and can be maintained independently.

Plugins and MCP sections are merged only when the corresponding profile file exists.

The LSP section is merged only when the profile carries `lsp.json`:

- `enabled: true` → the generated configuration carries `"lsp": <value>` (the stored boolean or object).
- `enabled: false` → the generated configuration carries `"lsp": false`.
- no `lsp.json` → no `lsp` key in the generated configuration.

The `enabled` toggle is persisted backup-first; the interactive prompt asks "LSP servers: [1] enabled [2] disabled (Enter keeps current)" when not `-NonInteractive`, while the app and `-NonInteractive` runs use the stored `enabled` value. `-WhatIf` never writes. Pre-flight (F2) treats `lsp.schema.json` as a required schema dependency when `lsp.json` exists, and verification throws if an enabled LSP is missing from the output. The merge diff summary (F7) reports added/removed "LSP servers".

Each section is merged exactly once.

### Model Precedence

Each provider can own its own models.

When resolving models for a provider, the builder uses the first source that exists:

1. Profile-level models file

```
profiles/<profile>/<provider>-models.json
```

2. Folder models file

```
providers/<provider>/models.json
```

3. Inline models inside the provider definition file

```
providers/<provider>.json  ->  provider.<provider>.models
```

4. None — no models configured for the provider (there is NO global `models.json` fallback).

Profile-level models win over folder models, which win over inline models.

### Why

Configuration is intentionally stored in separate files.

The merge stage combines these independent components into a single configuration that OpenCode can consume.

### Merge guarantees

- Dual-key mirror `apiKey` <-> `options.apiKey` is enforced at merge.
- Unknown user JSON fields are preserved through merges.
- The artifact is written atomically as UTF-8 without BOM.

---

# Stage 6 — Generation

The builder converts the merged configuration into formatted JSON.

The generated file is written to

```
opencode.json
```

The previous configuration is replaced only after a successful build.

### Why

OpenCode expects a single configuration file.

Generation converts the modular project structure into the format required by OpenCode.

---

# Stage 7 — Verification

Before writing, the builder verifies the generated configuration in memory.

Verification passes:

- JSON validity (round-trip parse succeeds).
- Providers exist for every active provider.
- Models are correctly attached to each provider.
- Plugins are present when configured.
- MCP configuration is present when configured.

The build fails before writing if any verification step fails.

Partial or invalid output is never written.

### Why

Verification catches generation defects before they can replace a working configuration.

The backup guarantees recovery; verification guarantees the new output is valid.

---

# Logging

The builder should clearly report every major stage of execution.

Example

```
Loading profile

Loading providers

Validating configuration

Creating backup

Generating configuration

Build completed successfully
```

Logging should make it possible to identify the stage where a build failed without inspecting the builder source code.

---

# Error Handling

The builder follows a fail-fast strategy.

If an unrecoverable error occurs, the build process terminates immediately.

The builder never attempts partial generation.

Every reported error should clearly communicate:

- What failed.
- Where it failed.
- Why it failed.
- What should be checked.

This behavior prevents invalid configurations from being generated.

---

# Configuration Ownership

The builder treats files differently depending on ownership.

## Source Files

Editable.

```
settings.json

models.json

plugins.json

mcp.json

lsp.json

omniroute.json
```

---

## Generated File

Not editable.

```
opencode.json
```

The builder always regenerates this file.

---

# Builder Rules

The builder MUST

- Create backups before overwrite.
- Stop on validation failure.
- Produce valid JSON.
- Preserve source configuration.
- Keep build stages independent.

The builder MUST NOT

- Edit profile files.
- Edit provider files.
- Edit documentation.
- Edit generated backups.
- Continue after validation failure.

---

# Current Scope

The current builder intentionally supports only the functionality required by the current project.

Implemented

- Dynamic provider loading
- Dynamic profile selection
- Optional profile sections
- Single generated configuration
- Backup creation
- Configuration validation

Features outside this scope are intentionally excluded until they are designed, implemented, and tested.

Future functionality will be documented after implementation.

---

# Builder Lifecycle

```
Configuration

↓

Builder

↓

Validation

↓

Backup

↓

Merge

↓

Generation

↓

OpenCode
```

---

# Builder Guarantees

When a build completes successfully, the builder guarantees:

- Source configuration remains unchanged.
- A backup exists.
- Generated JSON is valid.
- Configuration was validated before generation.
- OpenCode receives a complete configuration.

---

# Success Criteria

A successful build satisfies all of the following.

✓ All required files loaded.

✓ Validation completed.

✓ Backup created.

✓ Configuration merged.

✓ `opencode.json` generated.

✓ OpenCode can read the generated configuration.

---

# Builder V2.5 (Active-Provider Selector)

Builder V2.5 is the current builder implementation.

The stages described above document the historical V2.1 pipeline.

Builder V2.5 adds active-provider selection to that pipeline.

The user chooses which providers are active at build time.

The selection is persisted in `settings.json`, which is now a builder-writable source file.

---

## Command Line Interface

The builder accepts the following parameters.

```
-Profile        <profile-name>   default: default
-ConfigRoot     <path>           default: $HOME\.config\opencode
-Provider       <ids>            default: (empty)
-NonInteractive                  switch, default: off
```

| Parameter | Default | Effect |
| --- | --- | --- |
| `-Profile` | `default` | Selects the profile directory `profiles/<profile>`. |
| `-ConfigRoot` | `$HOME\.config\opencode` | Root directory containing `profiles/`, `providers/`, `backup/`, and `opencode.json`. |
| `-Provider` | (empty) | Comma or space separated provider ids. Overrides interactive selection and the stored list. The given order is preserved. An unknown id aborts the build. |
| `-NonInteractive` | off | Skips the interactive menu and uses the stored `settings.json` list. |

### Why

Active-provider selection must work in unattended runs.

`-Provider` and `-NonInteractive` make the build reproducible from scripts.

---

## Stage List

The V2.5 build follows this order.

```
Stage 0 — Discover / Select / Persist Providers
Stage 1 — Load Profile
Stage 2 — Validate
Stage 3 — Merge
Stage 4 — Create Backup
Stage 5 — Generate Final Configuration
Stage 6 — Verify Output
Stage 7 — Write Output
Stage 8 — Verify settings.json Persistence Round-trip
```

Stage 0 runs before profile loading.

It discovers ALL providers (not only the active ones), then resolves the active list, and persists the result to `settings.json` when it differs.

Stage 3 runs the active-provider model guard after merging models.

Every active provider must produce a models source (profile `<provider>-models.json`, `providers/<p>/models.json`, or inline — no global fallback). A provider without any models source is NOT considered active: it is dropped with a warning, removed from the generated configuration, and removed from `settings.json` (the reduced list is persisted, backed up first). If no active provider remains, the build aborts.

Stage 8 is new to V2.5.

After writing `opencode.json`, the builder reloads `settings.json` and confirms that the persisted `activeProviders` match the resolved list.

No stage may be skipped.

---

## New Function Contracts

### Discover-Providers

No parameters.

Returns every valid provider id from `providers/*.json`, in filename order.

Every `.json` file in `providers/` is loaded and validated.

A malformed provider file causes a terminating error listing ALL bad files.

Throws when no provider files exist:

```
No provider files found in <providers-root>
```

Throws when any file is malformed:

```
Provider discovery failed for: <file> - <message>; <file> - <message>
```

---

### Select-ActiveProviders

Params

```
[string[]]$Discovered
[string[]]$Current
```

Returns the selected provider id list.

Prints a numbered menu.

Providers already in the current selection are marked `(active)`.

Input grammar:

- Comma or space separated numbers choose the matching providers.
- `a` selects all discovered providers.
- `n` selects none.
- Empty input keeps the current selection.

---

### Resolve-ActiveProviders

Params

```
[string[]]$Discovered
[string[]]$Stored
```

Returns the resolved provider id list.

Resolution order:

1. `-Provider` is non-empty — wins over everything. The given order is preserved. An id that was not discovered throws:

```
Provider not found: <id> (discovered: <comma-separated list>)
```

2. `-NonInteractive` — returns the stored `settings.json` list.
3. Otherwise — calls `Select-ActiveProviders` with the discovered list and the stored list.

---

### Persist-ActiveProviders

Params

```
[string[]]$Active
```

Returns nothing.

Aborts the build when the selection is empty:

```
No active providers selected; build aborted.
```

Rewrites `settings.json` only when the active list differs from the stored list.

Difference is detected with `Compare-JsonArrays`.

Before overwriting, the current `settings.json` is backed up to

```
backup\settings_<profile>_<timestamp>.json
```

`$schema` is preserved.

The rewritten file is UTF-8 without BOM.

---

### Compare-JsonArrays

Params

```
[object[]]$A
[object[]]$B
```

Returns `$true` when the counts are equal and every element matches as a string.

Returns `$false` otherwise.

Used to decide whether `settings.json` must be rewritten.

---

### Get-ProfileProviderModels

Params

```
[string]$ProviderId
```

Returns the parsed profile models file for the provider.

Returns `$null` when the file does not exist.

File

```
profiles/<profile>/<provider>-models.json
```

Checks duplicate keys via `Assert-NoDuplicateKeys` (section `model`).

Checks duplicate model names via `Assert-NoDuplicateModelNames`.

Throws when the `models` section is missing or invalid:

```
Profile models file '<file>' validation failed: 'models' section is missing or invalid.
```

---

## Selection Rules

- The interactive menu accepts comma/space separated numbers, `a` for all, `n` for none, and empty input to keep the current selection.
- `-Provider` takes precedence over the stored list and the menu. The given order is preserved. An unknown id aborts the build.
- `-NonInteractive` skips the menu and uses the stored `settings.json` list.
- `Persist-ActiveProviders` aborts the build when the selection is empty.
- The stored list is written back to `settings.json` only when it differs from the previous list.

---

## Model Precedence

Models for an active provider resolve from the first source that exists.

1. Profile-level models file

```
profiles/<profile>/<provider>-models.json
```

2. Provider-specific models file

```
providers/<provider>/models.json
```

3. Inline models inside the provider definition file

```
providers/<provider>.json  ->  provider.<provider>.models
```

4. None — no models configured for the provider (there is NO global `models.json` fallback).

Profile-level models win over folder models, which win over inline models.

Non-active providers are never considered for any source.

### Why

Models are owned at the profile level first.

A profile can override the models of any provider without editing provider files.

---

## <provider>-models.json Shape

Profile-level models are stored per provider.

```
profiles/<profile>/<provider>-models.json

{
    "models": {
        "<model-id>": {
            ...model definition...
        }
    }
}
```

The `models` object maps model identifiers to model definitions.

Keys must be unique.

`Assert-NoDuplicateKeys` scans the raw text with section `model`.

Model names must be unique.

`Assert-NoDuplicateModelNames` reads the `name` of every model.

Non-active providers' model files are ignored.

Only the models of providers in the active list are ever read or merged.

---

## settings.json Write Policy

`settings.json` is a builder-writable source file.

The builder writes it:

- Only when the active list differs from the stored list.
- With a backup at

```
backup\settings_<profile>_<timestamp>.json
```

before overwrite.

- With `$schema` preserved.
- As UTF-8 without BOM.

---

## Verification Additions

Active providers without a models source are dropped after merge, before generation.

The drop is announced with a warning and the reduced list is persisted to `settings.json`:

```
Provider '<name>': models not found (no <provider>-models.json, providers/<name>/models.json, or inline). Provider will not be considered active and was removed from settings.json.
```

The provider is absent from `opencode.json` and from `settings.json`.

Stage 8 round-trip check.

After writing, `settings.json` `activeProviders` must match the resolved list:

```
Verification failed: settings.json activeProviders (<stored list>) does not match the resolved list (<resolved list>).
```

The build fails before finishing if the round-trip check fails.

---

## Regeneration Guarantee

This specification fully describes the current builder and its predecessors.

An agent can regenerate the current builder `app\engine\build-opencode-v2.7.ps1` (Kilo twin: `app\engine\kilo\build-kilo-v1.ps1`) from this document alone; root `scripts\` copies are deployed mirrors.

The retained V2.5 sections above also allow regenerating the previous builder `scripts\build-opencode-v2.5.ps1`, and the historical pipeline section documents V2.1 (`scripts\build-opencode-v2.ps1`) for reference.

Every function name, parameter, stage label, and error message above matches the respective script verbatim, including the V2.7 function contracts and verbatim messages below.

Regeneration order:

```
AGENT.md -> ... -> BUILDER_SPEC.md -> plan
```

---

# Builder V2.7 (JSON Schema Validation)

Builder V2.7 is the current builder implementation.

It is built on the V2.5 pipeline (documented above) and adds a schema-validation stage plus the hardening feature set F1-F7.

Every V2.5 stage and function remains intact; the historical V2.5 and V2.1 sections above are retained for regeneration.

---

## V2.7 Pipeline (canonical 9 stages)

The V2.7 build follows this canonical nine-stage order.

| Stage | Name | Notes |
|-------|------|-------|
| 0 | Discover-Providers | unchanged (V2.5) |
| 1 | Load Profile | unchanged |
| 2 | Load Provider | provider reference check; merging happens in Stage 6 |
| 3 | Schema Validation | NEW - F1 (JSON Schema) + F2 (pre-flight) entry gate |
| 4 | Validation | was V2.5 Stage 2 |
| 5 | Backup | was V2.5 Stage 4 - honors F4 retention |
| 6 | Merge | providers + models + plugins + mcp + final merge |
| 7 | Generation | writes opencode.json + F5 provenance sidecar |
| 8 | Verification | round-trip + F7 diff summary + F4 prune |

No stage may be skipped.

---

## V2.7 Feature Set (F1-F7)

| # | Feature | Behavior |
| --- | --- | --- |
| F1 | JSON Schema Validation | Validate config sources against schemas/*.schema.json BEFORE builder validation (Stage 3). Non-breaking: missing schemas -> warn + skip. |
| F2 | Pre-flight dependency check | Before merge, verify every active-provider provider ref + profile files + schema files exist; report ALL missing, then abort with clear error. Catches the modal.json bug class. |
| F3 | -WhatIf dry-run | Validate + merge only; write nothing, no backups; print planned changes + exit 0. |
| F4 | Backup retention | Prune backup/ to newest N per prefix (`<artifactBase>_*`, `settings_*`). Param -KeepBackups, default 10. |
| F5 | Provenance stamp | Sidecar `<artifactBase>.provenance.json` (builderVersion, profile, providers, generatedUtc, outputSha256). Never writes INTO the target artifact. |
| F6 | -Doctor diagnose | Read the REAL config at -ConfigRoot, validate sources against schemas + dependency refs, print File \| Status \| Detail table; exit 0 clean / 1 issues. No writes. |
| F7 | Merge diff summary | After a successful build, print Added/Removed/Updated (providers, model counts, mcp servers, plugins) vs previous backup artifact. |

---

## Reasoning formats (pass-through)

Model `variants` entries are settings overlays that the builder merges verbatim
into the generated config — it never interprets their contents. Providers may
therefore use any reasoning dialect the target agent understands:

- `opencode` / `openai` — `reasoningEffort: "<level>"`
- `claude` — `thinking: { "type": "enabled", "budgetTokens": <n> }`
- `gemini` — `thinkingConfig: { "thinkingBudget": <n> }`

Provider files may carry an optional `reasoningFormat` field
(`opencode` | `openai` | `claude` | `gemini` | `none`, default `opencode`);
the builder treats it as a validated-but-merged field. `models.schema.json`
keeps `variants` permissive so new shapes never fail older builders. The app
writes per-format levels and drops levels that are invalid for the format
(e.g. `max` is invalid for OpenAI GPT-5.x and is never written for `openai`
format providers).

### Interactive builds ask the developer

When the builder runs interactively (no `-NonInteractive`) and an active
provider has models but either (a) no `reasoningFormat` declared, or (b)
variant levels invalid for its declared format, the builder:

1. **Asks** the developer to pick the reasoning format for that provider
   (numbered menu, Enter keeps the current/default).
2. **Persists** the choice into `providers/<id>.json` (`reasoningFormat`),
   backup-first — the same place the app stores it, so GUI and CLI stay in
   sync. Never under `-WhatIf` / `-Doctor`; never in `-NonInteractive` mode
   (the app drives format selection itself).
3. **Filters the merged output**: variant levels invalid for the resolved
   format are dropped from the generated config with a `[!]` warning per
   dropped level. Source files are never modified by the filter.

Non-interactive builds use the declared format (or `opencode`) and apply only
step 3 — invalid levels never reach the generated config.

---

## Target artifact resolution (P2, config-driven)

The generated artifact name is **dynamic and resolved when a profile runs**, never fixed in
builder code. An optional `profiles/<profile>/target.json` names the output artifact:

```json
{
    "artifact": "opencode.json"
}
```

Resolution rules (Stage 1 / Load Profile):

- File present and valid (`artifact` non-empty string) -> `$TargetArtifact = artifact`.
- File missing, unreadable, or invalid -> `$TargetArtifact = "opencode.json"` (backward compatible).
- `artifact` without `.json` suffix gets it appended.

`$TargetArtifact` drives every hardcoded string in the builder:

- Output write path: `<ConfigRoot>\<artifact>`
- Backup prefix: `<artifactBase>_*.json` (base name = artifact minus extension)
- Provenance sidecar: `<ConfigRoot>\<artifactBase>.provenance.json`
- WhatIf messages, F7 diff scan, and F4 retention prune on the artifact prefix

The KiloCode adapter already ships: it sets its own artifact name (`"artifact": "kilo.json"`; default artifact `kilo.json`)
name (e.g. `"artifact": "kilo.json"`) in its `target.json` — code stays untouched. The target
file is validated against `schemas/targets.schema.json` during Stage 3 (optional source;
skipped if absent). Claude Code is not a supported target (DECISIONS.md 2026-08-08).

## API key policy (P1, mandatory — THE ULTIMATE RULE)

**The SYSTEM's own artifacts NEVER contain a literal API key or any secret. Ever.**

Two separate worlds:

1. **User-owned files** (the agent's main config, `profiles/*.json`,
   `providers/<id>.json`, `<provider>-models.json`): may contain literal API
   keys — they are the user's files and the user protects them. The framework
   treats them as-is.
2. **System artifacts** (builder scripts, scaffold scripts, test harnesses,
   templates, framework docs, examples): NEVER contain a literal key, token, or
   secret — only `{env:VAR_NAME}` placeholders or fictional example values.

The system's ONLY job is scan → copy → paste:

- It scans the agent's main JSON and copies sections verbatim into profiles.
- It copies whatever the user's source files contain — including API keys —
  into the generated artifact. That is REQUIRED: many MCPs and providers need
  their API keys to work.
- The builder NEVER carries, invents, or restores keys on its own; it only
  passes through what the user's files already contain.
- Missing provider files are reported by the pre-flight F2 check; they are never "restored"
  from backups.
- Example (system artifact): `bdf/templates/ADAPTER.template.md` uses
  `{env:EXAMPLE_API_KEY}` placeholders, never a real key.

---

## Command Line Interface (V2.7)

The V2.7 builder accepts all V2.5 parameters (unchanged) plus five new ones.

```
-SchemaDir      <path>           default: <ConfigRoot>\schemas
-WhatIf                         switch, dry run
-KeepBackups    <int>           default: 10
-Doctor                        switch, read-only diagnose
-ProvenancePath <path>          default: <ConfigRoot>\<artifactBase>.provenance.json
```

| Parameter | Default | Effect |
| --- | --- | --- |
| `-SchemaDir` | `<ConfigRoot>\schemas` | Directory containing the `*.schema.json` files used at Stage 3. |
| `-WhatIf` | switch | Dry run. Validates and merges only; writes nothing; prints planned changes; exits 0. |
| `-KeepBackups` | 10 | Keeps the newest N files per prefix (`opencode_*`, `settings_*`) in `backup/`. |
| `-Doctor` | switch | Read-only mode that diagnoses the real config at `-ConfigRoot`; no writes. |
| `-ProvenancePath` | `<ConfigRoot>\<artifactBase>.provenance.json` | Path of the provenance sidecar written by F5 (default derives from the target artifact). |

---

## V2.7 Function Contracts

### Test-SchemaCompliance

Params

```
[string]$Path
[object]$Schema
```

Returns

```
[pscustomobject]@{
    Valid   = [bool]
    Errors  = [string[]]
}
```

Validates a JSON file against a schema object.

Supported subset:

- `$schema` (informational)
- `type`
- `required`
- `properties`
- `additionalProperties: false`
- `items`
- `enum`
- `$ref` (local same-file only, e.g. `#/definitions/name`)

---

### Invoke-SourceSchemaCheck

Params

```
[string]$File
[string]$SchemaName
```

Throws the verbatim schema failure contract.

---

### Get-SchemaForSource

Params

```
[string]$FileName
```

Returns the schema file name for a source file.

Covers run

```
<provider>-models.json  ->  models.schema.json
models.json             ->  models.schema.json
```

Schemas cover provider/models/plugins/mcp/lsp/settings/targets/claude-code-routing.

Returns `$null` when no schema applies to the file.

---

### Assert-InputFilesExist

No parameters.

Returns `[string[]]` of every missing input file (provider files for active providers, profile files, referenced schema files). Never throws.

Called at the Stage 3 entry gate.

---

### Get-CurrentSources

No parameters.

Returns the source files for the current profile:

- settings.json (required)
- models.json (optional)
- plugins.json (optional)
- mcp.json (optional)
- lsp.json (optional)
- active provider files
- profile-level `<provider>-models.json`

---

### Prune-Backups

Params

```
[int]$Keep
```

Keeps the newest N files per artifact prefix (`<TargetBase>_*`, `settings_*`) in `backup/` (the prefix derives from the resolved target artifact, P2; `opencode_*` when the target is `opencode.json`).

---

### Write-ProvenanceFile

Params

```
[string]$OutputSha256
```

Writes the `<TargetBase>.provenance.json` sidecar (`opencode.provenance.json` when the target artifact is `opencode.json`).

---

### Get-LatestBackupConfig

No parameters.

Returns the parsed content of the newest `backup/<TargetBase>_*.json`.

Returns `$null` when no backup artifact exists.

---

### Compare-BackupDiff

Params

```
[object]$Final
```

Returns diff lines (Added / Removed / Updated) compared with the previous backup artifact.

---

### Invoke-Doctor

No parameters.

Read-only diagnostics.

Prints a `File | Status | Detail` table. Returns `$true` when clean, `$false` when issues are found.

---

## V2 Verbatim Messages V2.7

- Schema failure: `Schema '<schema-name>': <file> failed: <property> <message>.`
- Schema skip: `[!] No schema directory found at <SchemaDir> - skipping schema validation.`
- Pre-flight fail: `Pre-flight failed: N missing input(s)` then per file `Missing: <path>`
- Pre-flight pass: `[+] All input dependencies present.`
- Schema pass: `[+] All sources pass schema validation.`
- Pre-flight-File pass: `[+] All input files present.`
- WhatIf: `[WhatIf] Would write <TargetArtifact>` / `[WhatIf] Would write <TargetBase>.provenance.json` / `[WhatIf] Planned changes:` (both paths derive from the resolved target artifact)
- Doctor summary: `Doctor: N file(s) checked, M issue(s) found.` then `Doctor: configuration is clean.` / `Doctor: configuration has issues.`
- Diff line: `Added provider: <id>` / `Removed provider: <id>` / `Provider '<id>' model count: <n> -> <n>` / `Added mcp server: <name>` / `Removed mcp server: <name>` / `Added plugin: <id>` / `Removed plugin: <id>`
- No diff: `No changes detected vs previous backup.` / `No prior backup artifact found: no diff to report.`
- Success: `[+] Builder V2.7 finished successfully.`

PowerShell 5.1 has no `Test-Json -Schema`, so the validator runs inside the builder.

---

## V2.7 Supported JSON Schema Subset

The builder implements a compact JSON Schema validator (PowerShell 5.1 has no `Test-Json -Schema`).

Supported:

- `type` — string / number / object / array / boolean / null
- `required`
- `properties`
- `additionalProperties: false`
- `items`
- `enum`
- `$ref` — local same-file only, e.g. `#/definitions`

`$schema` is informational only; no `additionalProperties` enforcement is applied unless `additionalProperties: false` is present and no `$schema`-driven enforcement exists.

`$schema` is not enforced.

Validation is implemented inside the builder.

---

# Builder Status

Current Builder

Version

```
V2.7
```

Script

```
app/engine/build-opencode-v2.7.ps1   (root scripts/ copy is a deployed mirror)
```

Status

```
Stable
```

Previous Version

```
V2.5 (build-opencode-v2.5.ps1)
```

Previous

was V2.1 (build-opencode-v2.ps1).

Immersion builder is archived under the version here:

Prior builders remain documented for historical regeneration:

```
V2.5 (build-opencode-v2.5.ps1)   documented above
V2.1 (build-opencode-v2.ps1)    documented in the pipeline section
```

Future versions of the builder will update this document after implementation.

---

# Scaffold Mode (Universal, V3)

The framework ships a UNIVERSAL scaffold that works the SAME way for EVERY
open-source coding agent (OpenCode, KiloCode, Aider, Goose, Codex-Cli, ...)
in the registry — not only OpenCode and KiloCode. (Claude Code is in the
registry for discovery only; it is NOT a scaffold target — dropped 2026-08-08.)

Script

```
app/engine/scaffold-agent.ps1   (universal core)
```

Canonical location: `docs/app/engine/scaffold-agent.ps1`. It generates `<agent>/scripts/build-<agent>.ps1`, typed by main-config presence (`kilo.json` -> K1 template, otherwise the V2.7 template). No separate kilo scaffold wrapper exists.

Arguments: `-Agent <name>`, `-ConfigRoot` (defaults to the agent's
`~/.config/<agent>`), `-NonInteractive`, `-List`, `-Bootstrap`.

## User-Run vs System-Run (rule)

The scaffolds are SYSTEM-RUN ONLY. The user never runs them. The only scripts the
user runs are the BUILDERS (`build-opencode-v2.7.ps1`, `build-kilo-v1.ps1`).
The system (AI) runs the scaffold once per agent to create the profile structure
and seed `mcp.json`/`plugins.json`/`lsp.json` from the agent's own main JSON. After
seeding, the user edits profiles/providers and runs only the builder.

## Discovery (V3 rule)

Before anything else the framework discovers which coding agents are installed:

1. Probes the open-source agent registry (opencode, kilo, claudecode, aider,
   goose, codex-cli) in standard locations.
2. One found -> uses it. Multiple found -> user picks. None found -> the
   framework ASKS: "Give me the location of your coding agents" (a config
   folder) and scaffolds whatever the user points at.
3. `-List` prints discovered open-source coding agents only.
   Closed-source agents are never scanned or written.

## Contract

The framework's ONE job is scanning + splitting + seeding the profiles. It never
invents content and never writes into user-owned files.

1. Scan the agent's OWN MAIN `.json` config file FIRST, read-only. Only the
   agent's own primary main file (registry order) is the source of truth — the
   framework never scans another agent's config.
   - `.provenance.json` files are NEVER scanned as main configs (excluded from
     discovery; they are builder-generated sidecars, not agent input).
2. Split the scanned sections: provider (guidance only) / mcp / plugin / lsp.
3. Paste into `profiles/<profile>/` (coding is ALWAYS the default / main profile):
   - `mcp` section    -> `profiles/coding/mcp.json` (seeded if missing)
   - plugin section   -> `profiles/coding/plugins.json` (seeded if missing)
   - `lsp` section    -> `profiles/coding/lsp.json` (seeded if missing, from the
     main config's `lsp` value)
   - experimental/minimal -> mcp.json + plugins.json created EMPTY, never filled;
     lsp.json created with the default `{ "lsp": true, "enabled": false }`.
   - **mcp.json / plugins.json / lsp.json are USER-OWNED after creation.** The
     framework NEVER overwrites them on later runs. The user edits MCPs, plugins,
     and LSP servers by hand; the framework's job is to create the files once.
4. The framework creates the `providers/` folder (like the profile folders), but
   NEVER writes `providers/<id>.json` or `<id>-models.json` — provider and model
   files are 100% user-owned. The framework prints guidance about the detected
   provider section only.
5. Ensure profiles always exist: `coding` (main) + `experimental` + `minimal`.
   Each profile carries exactly four files: `settings.json`, `mcp.json`,
   `plugins.json`, `lsp.json`.
6. `settings.json` is the ONLY file the framework writes freely (like the
   reference implementation):
   - File missing  -> create with `$schema` + `activeProviders` (detected from
     the main config's provider section). NEVER copy-paste the whole config.
   - File exists   -> merge ONLY `$schema` + `activeProviders` when missing;
     NEVER clobber any user key, never paste the agent shape.
7. The user may add more profiles or edit any file at any time. The framework
   only ever ensures the three profile folders + the four files per profile.
8. `-Bootstrap` generates `build-<agent>.ps1`, `test-<agent>.ps1`,
   `scaffold-<agent>.ps1` for that agent from a source builder (verified on a
   sandbox custom agent). Template type is inferred from main-config presence:
   a `kilo.json` main config yields the K1 builder template, otherwise the
   V2.7 template.

## No-Secrets Rule (ULTIMATE)

The SYSTEM's own artifacts — scripts, templates, docs, examples — NEVER contain
a literal API key or secret; only `{env:VAR}` placeholders or fictional examples.
User-owned files (main config, profiles, providers) may contain literal keys —
the user protects them. The scaffold and builder COPY user content verbatim
(scan → copy → paste), so generated output reflects whatever the user's source
files contain, keys included. See "API key policy (P1, mandatory)" above.

## Non-JSON Guard

The framework NEVER touches `.jsonc` or any non-`.json` file on its own. If a
non-`.json` config candidate exists at the config root, the scaffold ASKS the
user `[y/N]` before reading it. In `-NonInteractive` mode it silently skips
them.

> **Agent config warning:** the builders generate `opencode.json` (OpenCode) /
> `kilo.json` (Kilo). Do NOT create `opencode.jsonc` next to `opencode.json` —
> OpenCode reads the `.jsonc` *instead of* the `.json` when both exist, and your
> built config silently disappears from `/models`. Generating both formats is
> planned for a future update — not right now.

## Agent Registry (extensible)

Add any open-source coding agent here so the framework can discover it:

```
scaffold-agent.ps1 -> $AgentRegistry
  Name, Home (config dir), Main (.json file names), PlugKeys, Schema
```

## Agent Map (inference)

| Agent    | Main JSON     | Settings schema                          |
|----------|---------------|------------------------------------------|
| opencode | opencode.json | https://opencode.ai/config.schema.json   |
| kilo     | kilo.json     | https://app.kilo.ai/config.json          |

For kilo, `kilo.json` is the primary main file and the builder's canonical
artifact; `kilo.jsonc` is only read if the user explicitly grants the prompt.

Claude Code is NOT a supported target (extra entropic global `~/.claude.json`,
no provider support — see planning/DECISIONS.md 2026-08-08).

---

## Dedicated Engine Adapters

Build routing: targets that satisfy the universal scaffold contract use the
universal path. Unique bounded targets route to dedicated engine adapters
under `app/engine/<agent>/`, whose detailed behavior contracts live in
`adapters/<agent>/BUILDER_SPEC.md`. The generic path never absorbs
target-specific facts.

---

**Document Version:** 1.0

**Status:** Current Builder Specification