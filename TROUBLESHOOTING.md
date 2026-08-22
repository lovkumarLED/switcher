# TROUBLESHOOTING

> Known issues, diagnostics, and recovery procedures for the OpenCode Configuration Manager.

---

# Purpose

This document records problems encountered during the development of the OpenCode Configuration Manager.

Unlike the testing guide, which verifies expected behavior, this document focuses on diagnosing and resolving unexpected failures.

Only issues that have actually been encountered and investigated should be documented here.

Future issues should be appended to this document after they have been fully understood.

---

# Troubleshooting Workflow

Whenever an issue occurs, follow this workflow.

```
Observe Problem

↓

Read Error Message

↓

Identify Failed Stage

↓

Determine Root Cause

↓

Apply Fix

↓

Re-run Builder

↓

Verify Resolution
```

Do not apply random fixes without first identifying the root cause.

---

# Problem Categories

| Category | Description |
|----------|-------------|
| PowerShell | Script execution errors |
| JSON | Configuration syntax errors |
| Builder | Generation failures |
| Provider | Provider configuration errors |
| Environment | Operating system or environment issues |
| OpenCode | Runtime configuration errors |
| App | Setup verification failed when active providers are unreachable (auto-revert restores from the backup matched by config stem) |
| Server | 403 on requests not from loopback origin; prune failures return 409 with reason; malformed app state entries are filtered safely; friendly JSON errors never leak stack traces |

---

# PowerShell Issues

## Issue ID

```
PS-001
```

### Problem

Unexpected token errors during builder execution.

Example

```
Unexpected token ':' in expression or statement.
```

### Cause

PowerShell syntax errors.

Typical causes include:

- Missing braces.
- Missing quotation marks.
- Invalid hashtable syntax.
- Incorrect array declarations.

### Resolution

Review the reported line.

Correct the syntax before running the builder again.

### Prevention

Validate each modification before continuing development.

Avoid editing multiple unrelated sections simultaneously.

---

# JSON Issues

## Issue ID

```
JSON-001
```

### Problem

Invalid JSON configuration.

### Symptoms

Builder fails during validation.

OpenCode refuses to load the generated configuration.

### Cause

Malformed JSON.

Examples include:

- Missing comma.
- Extra comma.
- Missing closing brace.
- Invalid string formatting.

### Resolution

Validate every configuration file before generation.

Use a JSON validator or editor with syntax highlighting.

### Prevention

Keep configuration files small and focused.

> **Agent config warning:** the builders generate `opencode.json` (OpenCode) /
> `kilo.json` (Kilo). Do NOT create `opencode.jsonc` next to `opencode.json` —
> OpenCode reads the `.jsonc` *instead of* the `.json` when both exist, and your
> built config silently disappears from `/models`. Generating both formats is
> planned for a future update — not right now.

---

# Provider Issues

## Issue ID

```
PROV-001
```

### Problem

Provider configuration cannot be loaded.

### Symptoms

Builder reports missing or invalid provider.

### Cause

Incorrect provider filename.

Incorrect provider identifier.

Missing provider definition.

### Resolution

Verify:

```
providers/

omniroute.json
```

Confirm that

```
"id": "omniroute"
```

matches the filename and the provider referenced by

```
settings.json
```

---

## Issue ID

```
PROV-002
```

### Problem

Models are not available after generation.

### Cause

Model injection failed.

### Resolution

Verify that

```
models.json
```

contains valid model definitions.

Verify that the builder correctly injects the models into the provider object.

---

# Environment Issues

## Issue ID

```
ENV-001
```

### Problem

Environment variable changes are not detected.

### Symptoms

The builder or OpenCode continues using an old API key.

### Cause

Windows does not update the current terminal session after using

```
setx
```

### Resolution

Close the terminal.

Open a new PowerShell session.

Run the builder again.

### Prevention

Restart the terminal after modifying environment variables.

---

# Builder Issues

## Issue ID

```
BLD-001
```

### Problem

Builder stops before generation.

### Cause

Validation failure.

### Resolution

Read the reported validation error.

Correct the configuration.

Run the builder again.

Do not bypass validation.

---

## Issue ID

```
BLD-002
```

### Problem

Generated configuration is incomplete.

### Cause

One or more configuration sections were not merged.

### Resolution

Verify that the builder successfully loads:

- settings.json
- provider
- models.json
- plugins.json
- mcp.json

Confirm that every section participates in the merge stage.

---

# Backup Issues

## Issue ID

```
BKP-001
```

### Problem

No backup is created.

### Cause

Backup stage did not execute.

### Resolution

Verify that the builder performs backup creation before overwriting

```
opencode.json
```

The build should not continue if backup creation fails.

---

# OpenCode Issues

## Issue ID

```
OC-001
```

### Problem

OpenCode starts but configured models are missing.

### Cause

The generated configuration does not contain the expected model definitions.

### Resolution

Verify:

- models.json
- provider configuration
- generated opencode.json

Ensure model injection completed successfully.

---

# General Recovery Procedure

If the cause of an issue is unknown:

1. Verify the folder structure.
2. Validate every JSON file.
3. Verify provider configuration.
4. Execute the builder.
5. Read the first reported error.
6. Resolve the root cause.
7. Execute the builder again.
8. Verify the generated configuration.
9. Launch OpenCode.

App users recover via the Settings and backup panels instead of these manual
builder steps.

Do not attempt multiple unrelated fixes simultaneously.

---

# Lessons Learned

During development the following practices consistently reduced debugging time.

- Validate before generating.
- Make one change at a time.
- Read the first reported error.
- Keep configuration modular.
- Preserve backups.
- Never modify generated files manually.

These practices should be followed during future development.

---

# Future Issues

New troubleshooting entries should include:

- Issue ID
- Problem
- Symptoms
- Root Cause
- Resolution
- Prevention

This keeps the troubleshooting guide consistent as the project evolves.

---

**Document Version:** 1.0

**Status:** Current Troubleshooting Guide