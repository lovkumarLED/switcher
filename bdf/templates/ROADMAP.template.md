# ROADMAP Template

> Template: planned evolution. Becomes `ROADMAP.md`.

---

# ROADMAP

> Planned evolution of {{PROJECT_NAME}}.

---

# Purpose

This document describes the planned direction of the project.

Only planned or proposed features should appear here.

Completed features belong in:

```
CHANGELOG.md
```

Implementation details belong in:

```
BUILDER_SPEC.md
```

This roadmap is intended to guide future development while keeping the overall project vision clear.

---

# Destination — {{DESTINATION_NAME}}

Every phase below serves one destination:

> **{{DESTINATION_NAME}} — the first stable public version of the Builder Development Framework.**

{{DESTINATION_DESCRIPTION}}

The path is:

```
Current ({{CURRENT_BUILDER_NAME}}) ✅
↓
{{FIRST_VALIDATION_PROJECT}} Builder V1 ✅
↓
{{DESTINATION_NAME}} ({{DESTINATION_TAG}}) — in progress
```

Each step is built, tested, and validated before the next begins.

Real projects shape the framework — never assumptions.

---

# Project Status

Current Version

```
{{CURRENT_VERSION}}
```

Current Status

```
{{PROJECT_STATUS}}
```

The project currently provides:

- Modular configuration
- Provider abstraction
- Profile abstraction
- Configuration builder
- Dynamic profile selection
- Dynamic provider loading
- Backup system
- Documentation framework

The next development phases focus on expanding flexibility while preserving the existing architecture.

---

# Development Phases

## Phase 1 — Foundation ✅

Status

```
Completed
```

Completed work includes:

- Project architecture
- Builder
- Provider abstraction
- Profile abstraction
- Backup system
- Documentation

---

## Phase 2 — Builder Improvements ✅

Status

```
Completed
```

Objectives

- Dynamic provider loading.
- Dynamic profile selection.
- Improved configuration validation.
- Better console output.
- Improved error reporting.
- Cleaner internal builder architecture.

---

## Phase 3 — Multiple Profiles ✅

Status

```
Completed
```

Objectives

Support multiple configuration profiles.

Example

```
{{CONFIG_SOURCE_DIR}}/

default/

minimal/

coding/

testing/
```

Possible Benefits

- Separate development environments.
- Faster startup configurations.
- Experimental configurations.
- Task-specific profiles.

---

## Phase 4 — Additional Providers ✅

Status

```
Completed
```

Objectives

Support additional provider definitions.

Examples

```
{{PROVIDER_DIR}}/

{{CURRENT_PROVIDER}}.json

second-provider.json

future-provider.json
```

Goals

- Builder automatically discovers providers.
- No builder modifications required for new providers.
- Provider configuration remains modular.

---

## Phase 5 — Validation Framework ✅

Status

```
Completed
```

Objectives

Introduce stronger configuration validation.

Possible additions

- Required key validation.
- Unknown key detection.
- Duplicate model detection.
- Duplicate provider detection.
- Schema validation.

Goal

Catch configuration errors before generation begins.

---

## Phase 6 — Automated Testing ✅

Status

```
Completed
```

Objectives

Introduce automated verification.

Possible additions

- Builder unit tests.
- Configuration validation tests.
- Regression testing.
- Integration testing.
- Configuration comparison.

Goal

Reduce manual testing effort.

---

## Phase 7 — Builder Refactoring ✅

Status

```
Completed
```

Objectives

Improve maintainability.

Possible improvements

- Smaller internal functions.
- Better logging.
- Improved diagnostics.
- Cleaner merge pipeline.
- Easier future extension.

Goal

Keep the builder simple even as functionality grows.

---

## Phase 8 — Documentation Expansion ✅

Status

```
Completed
```

Completed work includes:

- Developer Guide.
- Provider Development Guide.
- Profile Creation Guide.
- Builder Extension Guide.
- Release Process.

Goal

Make onboarding easier for future contributors.

---

## Phase 9 - Release Manager V1 ✅

Status

```
Completed
```

Objective

Automate the release process: registry-driven versioning, generated release documents, deterministic re-runs.

Required before

Framework generalization (Phase 10).

---

## Phase 10 - BDF V2.5: Framework Generalization ✅

Status

```
Completed
```

Objective

Generalize the framework so it can be reused across multiple builder targets (OpenCode, KiloCode, any same-architecture open-source agent).

Required before

Target-specific builders (Phases 11-12).

---

## Phase 10.5 - Active-Provider Selector Builder ✅

Status

```
Completed
```

Objective

Builder gains provider discovery, interactive active-provider selection, per-provider model files, and `-Provider`/`-NonInteractive` CLI switches.

---

## Phase 10.6 - JSON Schema Validation ✅

Status

```
Completed
```

Objective

Builder validates config sources against schema files before its own validation; pre-flight dependency check, dry-run, backup retention, provenance sidecar, diagnostics, diff summary.

---

## Phase 11 - Claude Code Builder V1 - DROPPED FROM GENERIC PATH ✅ (unique adapter route)

Status

```
DROPPED from the generic builder path - if Claude Code was planned here, its
entropic single-file config (~/.claude.json) makes a generic BDF profile
builder infeasible. The proven pattern instead: ship it as a unique bounded
adapter under adapters/<agent>/ managing one scalar route at a time (this is
what the reference project did, live validated), and replace this entry with
your actual first validation project (e.g. KiloCode).
```

Objective

Use the generalized framework to build the first real second-project builder. Do not redesign anything; use the framework as-is.

This is the first real validation of the framework against a second project.

---

## Phase 12 - KiloCode (second validation project) Builder V1 ✅

Status

```
Completed
```

Objective

Build a KiloCode builder on the same generalized framework.

---

## Phase 13 - BDF V3: Builder Generator 🔄

Status

```
In Progress
```

Objective

BDF V3 is the destination: a builder-generator framework where a generic framework plus a project adapter produces a project-specific builder.

---

## Phase 14 - GUI App: "Switcher" for Normal Users

Status

```
Planned
```

Objective

A normal user switches the active provider through a GUI, without touching configuration files.

---

## Phase 15 - More Coding Agents

Status

```
Planned
```

Objective

Support additional coding agents end-to-end; each new agent is verified before it is documented.

---

# Long-Term Vision

The long-term objective is to build a configuration management system that is:

- Modular
- Extensible
- Predictable
- Well documented
- Easy for both humans and AI agents to maintain

Future features should extend the existing architecture rather than replacing it.

---

# Out of Scope

The following items are intentionally excluded until explicitly planned.

- GUI applications.
- Cloud synchronization.
- Automatic internet downloads.
- Features unrelated to configuration management.

Keeping the project focused is considered a design goal.

---

# Roadmap Maintenance

The roadmap should be reviewed whenever a major milestone is completed.

When a planned feature is implemented:

1. Remove it from this document.
2. Record it in `CHANGELOG.md`.
3. Update the relevant documentation.

This ensures that the roadmap always reflects future work rather than project history.

---

**Document Version:** {{DOC_VERSION}}

**Status:** Active Development Roadmap
