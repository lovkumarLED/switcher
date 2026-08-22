# TESTING

> Verification guide for the OpenCode Configuration Manager.

---

# Purpose

This document defines the testing process used to verify that the OpenCode Configuration Manager is functioning correctly.

The generic testing pattern is defined in:

```
bdf/TESTING.md
```

This document is the project-specific mirror of the framework pattern.

Testing ensures that:

- Configuration files are valid.
- Builder behavior is correct.
- Generated configuration is valid.
- Existing functionality has not been broken by recent changes.

This document describes the manual testing process.

Automated testing is provided by the current harnesses bundled at `docs/app/engine/`:

```
app/engine/test-opencode-v2.7.ps1         (OpenCode gate: 40 tests incl. 5-test LSP group)
app/engine/kilo/test-kilo-v1.ps1          (Kilo gate: 37 tests incl. LSP group)
app/engine/claude-code/test-claude-code.ps1       (Claude Code Gate 2: 73 checks)
app/engine/claude-code/test-provider-model.ps1    (Claude Code Gate 3 evidence harness: OVERALL PASS)
```

| Harness | Gate | Coverage |
|---------|------|----------|
| `app/engine/kilo/test-kilo-v1.ps1` | Kilo builder gate | 37 tests incl. LSP group |
| `app/engine/claude-code/test-claude-code.ps1` | Claude Code Gate 2 | 73 checks |
| `app/engine/claude-code/test-provider-model.ps1` | Claude Code Gate 3 | Evidence harness (OVERALL PASS) |

The legacy `test-opencode-v2.ps1` / `test-opencode-v2.5.ps1` scripts exist only in the deployed `~/.config/opencode/scripts` as frozen history.

## App test suites

Run from `docs/app`:

```
env\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"   # Python unittest: 270 green
node --test tests/*.test.mjs                                           # Node contracts: 192 green
```

Zero accepted baseline failures policy: every suite must finish fully green before release.

Frozen history — retained in deployed scripts only: the V2.1 harness runs the builder against isolated temporary fixtures and verifies both success and failure behavior.

It also runs the release manager against a temp copy of the docs and verifies the generated release documentation.

Frozen history — retained in deployed scripts only: the V2.5 harness (Active-Provider Selector) verifies the V2.5 builder against isolated temporary fixtures in the same style.

The V2.7 harness (JSON Schema Validation) verifies the V2.7 builder against isolated temporary fixtures: schema validation, pre-flight checks, dry-run, retention, provenance, diagnostics, diff summary, P1/P2 policy.

V2.1 harness coverage (17 tests: 9 builder + 8 Release Docs):

Builder tests:

- Valid profile (real coding profile, no manual editing).
- Invalid JSON.
- Missing provider.
- Duplicate model IDs.
- Duplicate model names.
- Duplicate plugins.
- Malformed provider definition.
- Provider-specific models.
- Backup failure safety (output remains untouched).

Release Docs tests:

- Registry shape (valid versions, one Current, no duplicates).
- Release manager generates all outputs.
- Release manager is deterministic.
- CURRENT_RELEASE.md matches the registry Current entry.
- Registry and CHANGELOG consistency (legacy entries preserved).
- bdf/VERSION.md compatibility rows updated.
- Missing markers abort without writing.
- Real docs consistency (read-only).

Run it with:

```
powershell -File scripts/test-opencode-v2.ps1
```

The harness exits non-zero when any test fails.

The full release gate is: opencode 40/40 + kilo 37/37 + Gate 2 73 checks + Gate 3 PASS + app suites (Python unittest 270 green from docs/app/tests, Node contracts 192 green).

---

# Testing Philosophy

Testing follows four principles.

1. Validate before generating.
2. Never trust generated output without verification.
3. Every successful build should be reproducible.
4. Changes should never break previously working functionality.

Testing is considered part of development rather than an optional step.

The harness and its test results are part of a version's definition of complete: a version
whose tests fail is not released.

The documented test groups mirror the framework pattern (valid build, failure modes,
release docs), applied to this project as the manual and automated tests below.

---

# Test Environment

Current environment

Operating System

```
Windows 11
```

Shell

```
Windows PowerShell 5.1 (or PowerShell 7+)
```

Application

```
OpenCode
```

Configuration Builder

```
build-opencode-v2.ps1 (Builder V2.1)
build-opencode-v2.5.ps1 (Builder V2.5, Active-Provider Selector)
build-opencode-v2.7.ps1 (Builder V2.7, JSON Schema Validation)
```

Test Harness

```
test-opencode-v2.ps1
test-opencode-v2.5.ps1
test-opencode-v2.7.ps1
```

Provider

```
OmniRoute
```

Profile

```
default
```

Profile Selection

```
-Profile default
```

---

# Pre-Test Checklist

Before testing begins verify:

□ JSON files exist.

□ Provider configuration exists.

□ Builder script exists.

□ Backup directory exists.

□ OpenCode is installed.

□ OmniRoute is running.

□ Required environment variables are configured.

Testing should not begin until every item is complete.

---

# Test Categories

The current implementation is verified using the following categories.

| Category | Purpose |
|----------|---------|
| Folder Structure | Verify project layout |
| JSON Validation | Verify configuration syntax |
| Builder | Verify builder execution |
| Generated Configuration | Verify generated output |
| Backup | Verify backup creation |
| Regression | Verify existing functionality remains operational |

---

# Folder Structure Tests

## Test ID

```
FS-001
```

### Purpose

Verify that the required project structure exists.

### Procedure

Confirm the following directories exist.

```
profiles/

providers/

scripts/

backup/
```

Confirm the following files exist.

```
profiles/default/settings.json

profiles/default/omniroute-models.json

profiles/default/plugins.json

profiles/default/mcp.json

profiles/default/lsp.json

providers/omniroute.json

scripts/build-opencode-v2.ps1
```

### Expected Result

Every required directory and file exists.

### Failure Result

Missing files prevent the builder from running correctly.

---

## Test ID

```
FS-002
```

### Purpose

Verify that generated files are not stored inside the source directories.

### Procedure

Confirm that

```
opencode.json
```

exists only in the expected output location.

### Expected Result

Only one generated configuration exists.

### Failure Result

Multiple generated configurations may cause confusion or outdated configurations to be used.

---

# JSON Validation Tests

## Test ID

```
JS-001
```

### Purpose

Verify that every configuration file contains valid JSON.

### Procedure

Open each configuration file and confirm that it parses successfully.

Files to verify:

```
settings.json

models.json

plugins.json

mcp.json

lsp.json

omniroute.json
```

### Expected Result

Every file contains valid JSON.

### Failure Result

The builder must stop before generation begins.

---

## Test ID

```
JS-002
```

### Purpose

Verify that all required keys exist.

### Procedure

Check each configuration file against the definitions in

```
JSON_SCHEMAS.md
```

### Expected Result

Every required key is present.

### Failure Result

Validation fails and configuration generation is aborted.

---

# Builder Tests

## Test ID

```
BLD-001
```

### Purpose

Verify that the builder starts successfully.

### Procedure

Run the builder.

```powershell
.\build-opencode-v2.ps1
```

or

```powershell
.\build-opencode-v2.ps1 -Profile default
```

### Expected Result

The builder starts without PowerShell syntax errors.

The build process begins.

### Failure Result

The builder cannot execute.

No configuration is generated.

---

## Test ID

```
BLD-002
```

### Purpose

Verify that the builder loads the selected profile correctly.

### Procedure

Execute the builder.

```powershell
.\build-opencode-v2.ps1 -Profile default
```

Observe the console output.

Verify that the builder loads:

```
profiles/default/
```

### Expected Result

The profile is loaded successfully.

No missing file errors are reported.

### Failure Result

The builder reports a missing profile or missing configuration file.

Generation stops immediately.

---

## Test ID

```
BLD-003
```

### Purpose

Verify that provider configuration is loaded correctly.

### Procedure

Execute the builder.

Confirm that the provider configuration is read from:

```
providers/omniroute.json
```

### Expected Result

Provider configuration loads successfully.

The provider object is available for merging.

### Failure Result

The builder reports:

- Missing provider
- Invalid provider
- Invalid provider schema

Generation stops.

---

## Test ID

```
BLD-004
```

### Purpose

Verify that configuration validation executes before generation.

### Procedure

Introduce an intentional configuration error.

Examples:

- Remove a required key.
- Break JSON syntax.

Run the builder.

### Expected Result

The builder detects the error.

Configuration generation does not begin.

### Failure Result

The builder generates an invalid configuration.

This is considered a critical defect.

---

## Test ID

```
BLD-005
```

### Purpose

Verify configuration merging.

### Procedure

Run the builder using valid configuration.

Verify that the following sections appear in the generated configuration.

- Provider
- Models
- Plugins
- MCP

### Expected Result

All configuration sections are merged successfully.

### Failure Result

Missing sections indicate an incomplete merge process.

---

## Test ID

```
BLD-006
```

### Purpose

Verify configuration generation.

### Procedure

Run the builder.

Open:

```
opencode.json
```

### Expected Result

The file exists.

The JSON is valid.

The configuration contains all expected sections.

### Failure Result

Missing file.

Invalid JSON.

Incomplete configuration.

---

## Test ID

```
BLD-007
```

### Purpose

Verify deterministic output.

### Procedure

Run the builder twice without modifying any source files.

Compare both generated configurations.

### Expected Result

The generated configuration is identical.

### Failure Result

Different output indicates non-deterministic builder behavior.

---

## Test ID

```
BLD-008
```

### Purpose

Verify that a partial profile builds successfully.

### Procedure

Execute the builder with a profile that contains only settings.json.

```powershell
.\build-opencode-v2.ps1 -Profile minimal
```

### Expected Result

The build completes successfully.

Optional sections are reported as skipped.

The generated configuration contains the provider section.

### Failure Result

The builder fails because optional profile files are missing.

---

# Generated Configuration Tests

## Test ID

```
GEN-001
```

### Purpose

Verify that the generated configuration file exists.

### Procedure

Run the builder.

Verify that the following file exists.

```
opencode.json
```

### Expected Result

The file is created successfully.

### Failure Result

No configuration file is generated.

---

## Test ID

```
GEN-002
```

### Purpose

Verify that the generated configuration contains valid JSON.

### Procedure

Open

```
opencode.json
```

Parse the file using:

- OpenCode
- VS Code
- JSON Validator

### Expected Result

The file parses successfully.

### Failure Result

Invalid JSON syntax.

OpenCode cannot load the configuration.

---

## Test ID

```
GEN-003
```

### Purpose

Verify that every required configuration section exists.

### Procedure

Inspect the generated configuration.

Verify the presence of:

```
provider

models

plugin

mcp
```

### Expected Result

Every required section exists.

### Failure Result

One or more sections are missing.

---

## Test ID

```
GEN-004
```

### Purpose

Verify model injection.

### Procedure

Compare:

```
profiles/default/omniroute-models.json
```

with

```
opencode.json
```

Verify that every configured model appears inside the provider configuration.

### Expected Result

All configured models are present.

### Failure Result

Missing or duplicated model definitions.

---

# Backup Tests

## Test ID

```
BKP-001
```

### Purpose

Verify automatic backup creation.

### Procedure

Generate a configuration twice.

Inspect:

```
backup/
```

### Expected Result

A new timestamped backup is created before the previous configuration is overwritten.

Example

```
backup/

opencode_2026-08-03_10-15-42.json
```

### Failure Result

No backup is created.

---

## Test ID

```
BKP-002
```

### Purpose

Verify backup integrity.

### Procedure

Open the most recent backup.

Verify that it contains a complete configuration.

### Expected Result

The backup is readable and complete.

### Failure Result

The backup is corrupted, incomplete, or unreadable.

---

# Regression Tests

## Test ID

```
REG-001
```

### Purpose

Verify that recent changes do not break existing functionality.

### Procedure

After any modification to the builder:

1. Run the builder.
2. Verify successful generation.
3. Verify OpenCode starts successfully.
4. Verify the configured models are available.

### Expected Result

Previously working functionality continues to operate correctly.

### Failure Result

Existing functionality is broken by a recent change.

---

## Test ID

```
REG-002
```

### Purpose

Verify reproducibility.

### Procedure

Without changing any source configuration:

1. Run the builder.
2. Delete `opencode.json`.
3. Run the builder again.

Compare the generated configurations.

### Expected Result

Both generated files are identical.

### Failure Result

Different outputs indicate a regression or non-deterministic behavior.

---

# Release Docs Test Group (Tests 10-17)

(Frozen history — retained in deployed scripts only.)

The Release Docs group verifies the release pipeline (registry → release manager → generated documentation).

All tests except test 17 run against an isolated temp copy of the docs.

| Test | Name | Asserts |
|------|------|---------|
| 10 | Registry shape | Registry exists, one Current entry, valid version format, strictly descending order, no duplicate JSON keys |
| 11 | Release manager generates all outputs | Exit 0, CURRENT_RELEASE.md created, markers intact, every registry version present in CHANGELOG |
| 12 | Release manager deterministic | Two runs produce identical CHANGELOG and CURRENT_RELEASE.md |
| 13 | CURRENT_RELEASE matches registry | Quick reference contains the Current entry's builder version, project version, date, and testing summary |
| 14 | Registry and CHANGELOG consistent | Every registry entry present in CHANGELOG with its summary; legacy entries (2.1.0 → 1.0.0) preserved; exactly one Current in the generated section |
| 15 | VERSION.md rows updated | Last Updated row matches the Current release date |
| 16 | Missing markers abort safely | Removing a marker makes the manager fail with exit non-zero and leaves CHANGELOG untouched |
| 17 | Real docs consistent (read-only) | Real `release_registry.json`, `CHANGELOG.md`, and `CURRENT_RELEASE.md` are consistent |

Test 17 is the only test in the harness that reads the real docs, and it is strictly read-only — it never writes or modifies the real documentation.

Run the harness with:

```
powershell -File scripts/test-opencode-v2.ps1
```

Expected: 17/17 PASSED, exit 0.

---

# V2.5 Builder Test Group

(Frozen history — retained in deployed scripts only.)

The V2.5 group verifies the Active-Provider Selector builder (`scripts/build-opencode-v2.5.ps1`) against isolated temporary fixtures.

| Test | Name | Asserts |
|------|------|---------|
| 1 | All providers discovered | `-Provider` with both ids emits both provider sections |
| 2 | Malformed provider fails | Non-zero exit, error names the bad file, no output written |
| 3 | Non-interactive uses stored | Stored `activeProviders` reused, settings.json byte-identical |
| 4 | Provider arg skips prompt | `-Provider` selection persists order to settings.json |
| 5 | Provider arg unknown fails | Clear "Provider not found" error |
| 6 | Profile models highest precedence | Profile-level `<provider>-models.json` wins over the provider-folder file |
| 7 | Non-active profile models ignored | Inactive provider models never leak into the output |
| 8 | Settings persist round-trip | `activeProviders` and `$schema` preserved exactly |
| 9 | Settings backup created | `backup\` holds the original settings.json content |
| 10 | Empty selection fails | Empty stored list fails with an activeProviders error |
| 11 | Profile models dup key fails | Duplicate model key in `<provider>-models.json` fails, no output written |
| 12 | Builder spec covers V2.5 | Docs-spec sync test: BUILDER_SPEC.md contains the V2.5 feature tokens |
| 13 | Active provider no models dropped | Provider without a models source is dropped from output + settings.json with a warning |

Test 12 (`Test-BuilderSpecCoversV25`) is a docs-spec sync test: it greps `BUILDER_SPEC.md` for the V2.5 feature tokens (`Discover-Providers`, `Select-ActiveProviders`, `Persist-ActiveProviders`, `Get-ProfileProviderModels`, `-NonInteractive`, `<provider>-models.json`), so the spec must be updated in lockstep with the builder.

Run the V2.5 harness with:

```
powershell -File scripts/test-opencode-v2.5.ps1
```

Expected: 13/13 PASSED, exit 0.

The definition of complete is the current release gate: opencode 40/40 + kilo 37/37 + Gate 2 73 checks + Gate 3 PASS + app suites (Python unittest 270 green from docs/app/tests, Node contracts 192 green).

---

## JSON Schema (V2.7) test group

The V2.7 group verifies the JSON Schema builder (`scripts/build-opencode-v2.7.ps1`) against isolated temporary fixtures, in the same style as the V2.1 and V2.5 harnesses.

| Group | Coverage |
|-------|----------|
| Schema Validation | Valid sources pass; settings missing `required` fails; wrong `type` fails; `additionalProperties` fails; real settings accepted; provider violation fails; models violation fails; missing `schemas/` directory warns and continues |
| Pre-flight | Missing provider file aborts with "Pre-flight failed" |
| WhatIf | Nothing written, exit 0 |
| Doctor | Clean exits 0, corrupt exits 1 |
| Backup retention | `-KeepBackups` honored |
| Provenance | Sidecar fields and SHA correct |
| Diff summary | Added/Removed lines; identical input silent |
| Reasoning formats | OpenAI (`reasoningEffort`), Claude (`thinking.budgetTokens`) and Gemini (`thinkingConfig.thinkingBudget`) variant shapes pass schema validation and merge into the generated config; provider `reasoningFormat` field accepted |
| LSP | Five tests: enabled-object round-trip; disabled emits false; absent lsp.json omits the key; false emits false; enabled true |

Run the V2.7 harness with:

```
powershell -File scripts/test-opencode-v2.7.ps1
```

Expected: 40/40 PASSED, exit 0.

---

# Manual Testing Procedure

Perform the following steps in order.

1. Verify project structure.
2. Verify JSON syntax.
3. Execute the builder.
4. Verify backup creation.
5. Verify generated configuration.
6. Launch OpenCode.
7. Confirm configured models are available.
8. Confirm no unexpected errors occur.

---

# Expected Results

A successful test session satisfies all of the following.

✓ Project structure is correct.

✓ Configuration files are valid.

✓ Builder executes successfully.

✓ Backup is created.

✓ Generated configuration is valid.

✓ OpenCode starts successfully.

✓ Configured models are available.

---

# Failure Indicators

Testing should be considered unsuccessful if any of the following occur.

- Builder fails to start.
- Invalid JSON is generated.
- Backup is missing.
- Required configuration sections are missing.
- OpenCode fails to load the generated configuration.
- Configured models are unavailable.

Any failure should be investigated before continuing development.

---

# Testing Checklist

Before considering a build complete:

□ Folder structure verified.

□ Configuration validated.

□ Builder executed successfully.

□ Backup created.

□ Generated configuration verified.

□ OpenCode launched.

□ Models available.

□ No unexpected errors observed.

---

# Future Testing Expansion

Future versions may extend automated testing with:

- Builder unit tests.
- Builder unit tests.
- Integration testing.
- Configuration comparison.
- Regression testing.

---

## Adapter Test Groups

Unique bounded adapters add fixture, compatibility, integration, and
live-validation test groups (see `adapters/<agent>/TESTING.md` for the
target's own procedures). A passing group proves behavior at its gate and
never converts to a support claim.

---

**Document Version:** 1.0

**Status:** Manual Testing Guide