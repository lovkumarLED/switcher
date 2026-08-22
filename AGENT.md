# AGENT

> Entry point for all AI agents working on the OpenCode Configuration Manager.

---

# Purpose

This document defines how AI agents should interact with this repository.

It acts as the primary entry point before reading or modifying any project files.

The goal is to ensure that all AI assistants work consistently, preserve the project architecture, and avoid introducing unnecessary changes.

Every AI agent should read this document first.

---

# Project Overview

The OpenCode Configuration Manager is a modular configuration generation system.

Its purpose is to generate a valid `opencode.json` from a set of smaller configuration files.

The architecture separates:

- Source configuration
- Builder implementation
- Generated configuration
- Documentation

The generated configuration should never become the source of truth.

---

# Builder Development Framework

Generic engineering knowledge shared by every builder project lives in:

```
bdf/
```

Start with:

```
bdf/FRAMEWORK.md
```

The framework describes the reusable engineering process.

The AI workflow is defined in:

```
bdf/AI_WORKFLOW.md
```

This documentation describes the OpenCode-specific implementation.

The project-specific facts are defined in:

```
ADAPTER.md
```

When a concept appears in both, the project document defines the OpenCode-specific behavior and the framework defines the generic principle.

---

# Session Continuity

Work spans multiple sessions.

Context windows reset between sessions; the session files preserve memory.

At session start:

- Read `_agent/SESSION_WORKFLOW.md`.
- Read `_agent/SESSION_LOG.md`.
- Check the `Next:` line of the most recent entry.
- Read `_agent/JOURNEY_TO_V3.md` — note the `Current Position` on the road to V3.

At session end:

- Follow `_agent/SESSION_WORKFLOW.md`.
- Write the session summary to `_agent/SESSION_LOG.md`, including the `Journey:` line.
- Update the `Current Position` section of `_agent/JOURNEY_TO_V3.md`.
- Never delete or overwrite existing entries.

---

# Build Continuation

Every version (V2.5, V2.7, KiloCode Builder V1, Universal V3) must be built, tested,
and validated completely before the next begins.

If a version build is too large to finish within 70-80% of the 200,000-token context
window, the agent must NOT push through. Instead:

1. Stop at a clean checkpoint.
2. Write `AI/builder/CONTINUE_BUILD_<VERSION>_<STEP>.md` with what was done, what is next,
   how to verify, and the resume prompt.
3. Update `_agent/SESSION_LOG.md` and `_agent/JOURNEY_TO_V3.md`.
4. Hand the user the resume prompt for the next session.

The full rule and the resume prompt template are in:

```
AI/builder/CONTINUE_PROJECT_BUILD.md
```

Resume from the latest checkpoint file — never restart a version from scratch.

---

# Project State

`PROJECT_STATE.md` is the living snapshot of the repository.

It must always reflect the current repository state.

## Major Refactor Definition

A major refactor is any change that:

- Adds, removes, moves, or renames files or folders.
- Changes the architecture or documentation structure.
- Changes how components connect to one another.
- Introduces or removes an entire system.

Minor documentation fixes and small updates do not count as major refactors.

## Regeneration Rule

After every major refactor:

1. Regenerate `PROJECT_STATE.md` from the current repository state.
2. Keep the 15-section structure exactly as defined in the template.
3. Do not ask for confirmation before regenerating.
4. Confirm the update with: Project state updated.
5. Never leave `PROJECT_STATE.md` stale.

## Template

The generic template lives in:

```
bdf/templates/PROJECT_STATE.template.md
```

When the template changes, the framework version must be updated.

---

# Read Order

Before making any modification, read the documentation in the following order.

```
README.md

↓

PROJECT_STATE.md

↓

ADAPTER.md

↓

ARCHITECTURE.md

↓

BUILDER_SPEC.md

↓

DESIGN_PRINCIPLES.md

↓

FOLDER_STRUCTURE.md

↓

JSON_SCHEMAS.md

↓

CONTRIBUTING_FOR_AI.md
```

Only after understanding these documents should an AI modify code or configuration.

---

# Source of Truth

The following files are the authoritative project sources.

```
profiles/

providers/

scripts/

docs/
```

The following file is generated automatically.

> **Agent config warning:** do NOT create `opencode.jsonc` next to the generated
> `opencode.json` - OpenCode reads the `.jsonc` instead of the `.json` when
> both exist, and your built config silently disappears from `/models`.

```
opencode.json
```

Never edit generated files manually.

---

# AI Responsibilities

An AI agent SHOULD:

- Preserve the documented architecture.
- Follow the builder specification.
- Keep configuration modular.
- Prefer extending existing components instead of replacing them.
- Keep documentation synchronized with implementation.
- Explain architectural decisions before making significant changes.

---

# AI Must NOT

An AI agent MUST NOT:

- Edit `opencode.json` manually.
- Introduce undocumented architecture.
- Hardcode configuration values that belong in JSON.
- Modify unrelated files.
- Remove documentation without justification.
- Implement features that are only listed in `ROADMAP.md`.

---

# Development Philosophy

The project follows several principles.

- Documentation First
- Configuration over Hardcoding
- Modular Design
- Single Responsibility
- Predictable Automation
- Fail Fast
- Preserve Existing Behavior

Every change should support these principles.

---

# Collaboration Preference

The repository owner prefers iterative development.

When implementing changes:

- Work one step at a time.
- Explain the reasoning before major architectural changes.
- Avoid large code dumps unless explicitly requested.
- Preserve existing project style and documentation.
- Treat completed documentation as authoritative unless instructed otherwise.

The goal is collaborative learning rather than autonomous implementation.

---

# Builder Rules

The builder is responsible only for automation.

It should:

- Read configuration.
- Validate configuration.
- Create backups.
- Merge configuration.
- Generate output.

It should never become responsible for maintaining configuration data.

---

# Documentation Rules

Documentation is considered part of the project.

Whenever implementation changes:

- Update documentation if necessary.
- Update the changelog for completed work.
- Remove completed items from the roadmap.
- Keep documents consistent with one another.
- Regenerate `PROJECT_STATE.md` after every major refactor.

## README Synchronization Rule (public README network)

**`README.md` is the public face of the project. It must never go stale.**

Whenever something is added, changed, or fixed:

1. Check whether `README.md` mentions the affected area (features, scripts,
   architecture, rules, roadmap status, versions, docs map, badges).
2. If it does, update the corresponding README section in the SAME change —
   never in a later commit.
3. If the change is user-visible (new feature, new script, new rule, status
   change), it MUST be reflected in `README.md` before the work is considered
   done.
4. Keep the README footer versions in sync (`Version`, `Builder Version`,
   `Framework Version`) whenever any of them change.
5. Never claim a status the project has not reached (e.g. do not mark a phase
   complete or a release done before it actually is).

This rule applies to every README that describes a changed area:
`README.md`, `bdf/README.md`, and `bdf/templates/README.md` (placeholder
examples must stay current).

## Opt-In Public README Network Sync

The public-facing README files that an internet visitor can reach on GitHub
form a connected documentation network: the root `README.md`, `app/README.md`,
`bdf/README.md`, `adapters/claude-code/README.md`, and any future public
component or adapter `README.md` linked from them.

When the maintainer explicitly says a feature was added or behavior changed
**and asks to "update the README files" / "update the public GitHub
documentation"**, that single request authorizes the agent to:

1. discover every public-facing `README.md` affected by the change — always
   including an impact check of the root `README.md`;
2. update all affected public READMEs together, without requiring the
   maintainer to name each file;
3. keep shared facts, commands, compatibility information, capability tables,
   links, screenshots, and GIFs consistent across the network;
4. preserve each README's responsibility: the root README summarizes the
   product; component READMEs own their depth;
5. add a new public component README to the network when GitHub visitors need
   it;
6. verify the connected set (links, media paths, case sensitivity) and report
   which files changed and why.

This contract is **opt-in only**. A normal code or feature request does not by
itself authorize public README updates — it activates only when the maintainer
explicitly asks for the README files or public documentation to be updated.
Internal AI plans, session logs, implementation specifications, test reports,
private working notes, and unrelated Markdown files are NOT part of this
network and must not be swept into such updates.

## Generated Artifacts Rule

Never commit Playwright session output or Superpowers working artifacts
(`.playwright-cli/`, `.playwright-mcp/`, `output/`, `.superpowers/`, or
`superpowers/`). They are generated implementation evidence, not application
dependencies. Keep only curated public media in `app/assets/demos/`, and move
durable design decisions into `planning/designs/` before committing.

---

# Working Style

When implementing a new feature:

1. Understand the architecture.
2. Explain the proposed approach.
3. Make the smallest reasonable change.
4. Verify the result.
5. Update documentation if required.

Avoid large, unrelated refactors.

---

# Future Features

Planned functionality appears only in:

```
ROADMAP.md
```

Do not implement roadmap items unless explicitly requested.

---

# Repository Goal

The long-term objective is to build a configuration management system that is:

- Modular
- Extensible
- Predictable
- Well documented
- Easy for both humans and AI agents to maintain

Every contribution should move the project closer to that goal.

---

# Session Workflow

For every new task:

1. Read AGENT.md.
2. Follow the required documentation reading order.
3. Summarize your understanding of the project.
4. Explain your implementation plan.
5. Wait for approval before modifying code.
6. Implement in small, reviewable steps unless explicitly asked for a complete implementation.

---

# Final Rule

If documentation and implementation disagree:

1. Do not guess.
2. Identify the inconsistency.
3. Ask for clarification or update the documentation before proceeding.

Consistency is more important than speed.

---

**Document Version:** 1.4

**Status:** Active AI Entry Guide
