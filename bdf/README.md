# Builder Development Framework

> The reusable engineering platform for building configuration builders.
>
> Part of [Switcher](../README.md) — a local switchboard for OpenCode,
> KiloCode, and Claude Code. The Switcher app is one consumer of this
> framework; see also the [Claude Code adapter](../adapters/claude-code/README.md).

---

# Purpose

The Builder Development Framework (BDF) is a collection of reusable engineering knowledge for designing, building, documenting, evolving, and maintaining configuration builders.

A configuration builder is a small automation system that:

- Reads configuration from modular source files.
- Validates the configuration.
- Creates backups.
- Merges the configuration.
- Generates a single final configuration artifact consumed by an application.

The framework does not contain implementation code.

It contains the process, the principles, the documentation architecture, the templates, and the intelligence layer that make builder projects predictable and maintainable — for humans and for AI coding agents.

---

# Framework Architecture

```
Builder Development Framework (BDF)

│

├── Blueprint Engine
├── Project Adapter
├── Builder Evolution
├── Builder Phases
├── Framework Lifecycle
├── Templates
├── AI Workflow
├── Lessons Learned
└── Version System

        │

        ├── OpenCode Builder
        ├── Kilo Builder
        └── Future Builders (same architecture)
```

The framework is generic.

Each builder project below it is created by combining the framework with a project adapter.

---

# Components

| Component | Document | Purpose |
|-----------|----------|---------|
| Blueprint Engine | `BLUEPRINT_ENGINE.md` | The intelligence layer: determines what must change and in what order. |
| Project Adapter | `PROJECT_ADAPTER.md` | Makes the generic framework project-specific. |
| Builder Evolution | `BUILDER_EVOLUTION.md` | Creates future builder versions predictably. |
| Framework Lifecycle | `FRAMEWORK_LIFECYCLE.md` | The master lifecycle reference for every project. |
| Templates | `templates/` | Reusable documentation templates for new projects. |
| AI Workflow | `AI_WORKFLOW.md` | The workflow every AI coding agent follows. |
| Lessons Learned | `LESSONS_LEARNED.md` | Reusable engineering principles. |
| Version System | `VERSION.md` | Framework versioning and compatibility. |
| New Project Guide | `NEW_PROJECT_GUIDE.md` | The onboarding process for starting a new project with the framework. |
| Release Manager | `RELEASE_MANAGER.md` | The generic release process: registry, generator, and generated release documents. |
| Testing Framework | `TESTING.md` | The generic test-harness pattern every builder project follows. |
| Builder Phases | `BUILDER_PHASES.md` | The quality gates (Alpha → Beta → General Release) every builder build must pass. |

Supporting documents:

| Document | Purpose |
|----------|---------|
| `FRAMEWORK.md` | The complete engineering process. |
| `MIGRATION.md` | Adopting the framework in an existing project. |
| `PROJECT_GENERATOR.md` | Creating a new builder project. |
| `README.md` | This document: framework entry point. |

---

# Two Layers

The framework separates all knowledge into two layers.

## Layer 1 — Builder Development Framework

Reusable engineering knowledge.

This folder.

## Layer 2 — Project Documentation

Project-specific implementation.

Example: the OpenCode Configuration Manager documentation, which lives in this same documentation repository.

The OpenCode Configuration Manager is the first implementation built using this framework.

---

# The Four Questions

The framework is complete when its documentation answers four questions.

## Question 1

How is this builder built?

## Question 2

How should this builder evolve?

## Question 3

How do I create another builder?

## Question 4

How do I adapt this framework to another project?

Every framework component contributes to at least one answer.

---

# How To Use

Understand the framework:

```
Read FRAMEWORK.md
```

New project:

```
Read PROJECT_GENERATOR.md
```

Existing project:

```
Read MIGRATION.md
```

Evolve a builder:

```
Read BUILDER_EVOLUTION.md
```

Qualify a builder build:

```
Read BUILDER_PHASES.md
```

Change a feature:

```
Read BLUEPRINT_ENGINE.md
```

---

# Rules

The framework contains no project-specific knowledge.

Project names appear only as examples.

Project-specific facts live in each project's adapter.

Templates are changed only through the framework change process, never to satisfy a single project.

---

## Unique Agent Adapters

A project may combine the universal scaffold with one or more unique bounded
adapters. Unique adapters live under `adapters/<agent>/` with a fixed five-file
documentation contract, and their implementation and schema locations are
approved per adapter. Generic framework contracts describe the categories; the
adapter documents carry all target-specific detail.

The generic contracts summarized here are defined in:

- `bdf/FRAMEWORK.md` - adapter categories (same-architecture and unique bounded
  patch) and the capability-driven unique-adapter layer.
- `bdf/PROJECT_ADAPTER.md` - project adapter plus reusable unique-agent adapter
  contract.
- `bdf/AI_WORKFLOW.md` - unique-adapter read order and gate-aware status checks.
- `bdf/TESTING.md` - generic fixture, compatibility, integration, and
  live-validation test groups.
- `bdf/BUILDER_EVOLUTION.md` - adapter documentation and compatibility evidence
  evolution rules.
- `bdf/VERSION.md` - framework version 2.3.0 change history for the
  unique-adapter layer.

---

## Where this fits in the repository

| Layer | Location | Purpose |
|---|---|---|
| Product landing page | [`README.md`](../README.md) | What Switcher is, install, demos |
| App guide (Layer 2 consumer) | [`app/README.md`](../app/README.md) | Using the GUI that calls generated builders |
| Framework (this folder, Layer 1) | `bdf/` | Reusable engineering knowledge + templates |
| Unique agent adapters | [`adapters/`](../adapters/claude-code/README.md) | Bounded adapters for agents whose contracts differ |

---

**Document Version:** 1.1

**Status:** Active Builder Development Framework
