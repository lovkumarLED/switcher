# Build Builder V2.1

> Objective
>
> Use the Builder Development Framework (BDF) to evolve Builder V2.0 into Builder V2.1.
>
> This is the first real validation of the Blueprint/BDF architecture.
>
> The framework—not the user—should determine which documentation, templates, builder components, testing, versioning, and migration documents require updates.

---

# Before Starting

Read the project in the documented order.

Read:

- AGENT.md
- PROJECT_STATE.md
- Blueprint Framework
- Blueprint Engine
- Project Adapter
- Builder Evolution
- Framework Lifecycle
- Templates
- Current Builder V2.0 source
- Existing documentation

Understand the architecture before modifying anything.

---

# Goal

Builder V2.1 is **not** a redesign.

The architecture must remain compatible with Builder V2.

Focus on improving quality, maintainability, extensibility, and future scalability.

---

# Requested Features

## 1. Improved Validation

Current validation only verifies basic configuration.

Extend validation to detect:

- duplicate provider IDs
- duplicate model IDs
- duplicate model names
- duplicate plugin IDs
- duplicate MCP IDs
- malformed provider definitions
- malformed profile definitions
- missing required fields
- invalid configuration structure

Validation should produce clear error messages.

---

## 2. Modular Merge Pipeline

Current merge logic is centralized.

Refactor into smaller merge stages.

Suggested pipeline:

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

Generate Final Configuration

Each stage should be independently maintainable.

---

## 3. Provider-Specific Models

Current state:

models.json

↓

Injected into every provider

New architecture:

providers/

provider/

models.json

Each provider should be capable of owning its own models.

Global models should remain supported for backwards compatibility.

---

## 4. Better Logging

Improve console output.

Show:

- validation stage
- provider loading
- model loading
- plugin loading
- merge stages
- generation stages

Improve readability.

Avoid excessive verbosity.

---

## 5. Automated Testing

Create an automated verification process.

The framework should be capable of testing:

- valid profile
- invalid JSON
- missing providers
- duplicate models
- duplicate plugins
- malformed provider definitions
- provider-specific models

Tests should become reusable.

---

## 6. Configuration Verification

After generating:

opencode.json

Perform a verification pass.

Verify:

- generated JSON is valid
- providers exist
- models correctly attached
- plugins present
- MCP configuration present

Fail before writing invalid output.

---

## 7. Cleaner Internal Structure

Review Builder V2 source.

Identify opportunities to:

- simplify functions
- improve naming
- reduce duplication
- isolate responsibilities

Do not redesign the builder.

Improve maintainability only.

---

## 8. Coding Profile Validation

Use the existing coding profile.

The coding profile becomes the primary Builder V2.1 test profile.

The builder should correctly generate opencode.json using:

settings.json

models.json

plugins.json

mcp.json

provider configuration

without manual editing.

---

# Backwards Compatibility

Builder V2.1 must remain compatible with:

default profile

existing provider configuration

existing output

No breaking changes unless absolutely required.

If breaking changes are introduced:

Generate migration documentation automatically.

---

# Documentation

Use the Builder Development Framework.

Determine which documents require updates.

Examples:

Architecture

Builder Specification

Testing

Roadmap

Version

Changelog

Migration

Templates

Lessons Learned

PROJECT_STATE.md

Do not ask the user which files to edit.

The framework should determine affected documentation automatically.

---

# Builder Evolution

Treat this as a complete Builder Version upgrade.

The Builder Evolution workflow should be followed automatically.

Feature Request

↓

Impact Analysis

↓

Architecture Update

↓

Builder Update

↓

Testing Update

↓

Documentation Update

↓

Version Update

↓

Migration Update

↓

Release

---

# Release

Produce:

Builder V2.1

Updated documentation

Updated PROJECT_STATE.md

Updated VERSION.md

Updated CHANGELOG.md

Updated ROADMAP.md

Migration notes (if required)

Testing results

Release summary

---

# Success Criteria

The Builder Development Framework should successfully evolve Builder V2 into Builder V2.1 without requiring the user to manually identify affected documentation.

The framework—not the user—should determine:

- what changes
- why it changes
- where it changes

This task serves as the first full validation of the Builder Development Framework.