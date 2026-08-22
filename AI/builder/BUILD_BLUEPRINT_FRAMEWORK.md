# Build Blueprint Framework

> Goal:
>
> Transform the current OpenCode Builder documentation into a reusable Blueprint Framework without changing the working Builder V2 implementation.
>
> The result should allow future builders (OpenCode, Claude Code, Kilo Code, CLIProxy, etc.) to reuse the same engineering process instead of rewriting documentation from scratch.

---

# Context

This repository currently contains:

- OpenCode Builder V2
- Complete documentation
- Builder specification
- AI workflow
- Architecture documentation
- Engineering history

The Builder V2 implementation is working correctly.

**Do NOT redesign Builder V2.**

Instead, redesign the documentation architecture so it becomes reusable for future builder projects.

---

# Before Doing Anything

Read the repository in this order.

1. AGENT.md
2. README.md
3. ARCHITECTURE.md
4. BUILDER_SPEC.md
5. DESIGN_PRINCIPLES.md
6. FOLDER_STRUCTURE.md
7. JSON_SCHEMAS.md
8. CONTRIBUTING_FOR_AI.md
9. ROADMAP.md
10. CHANGELOG.md
11. TESTING.md
12. TROUBLESHOOTING.md

After reading:

- Summarize your understanding.
- Identify generic engineering knowledge.
- Identify OpenCode-specific knowledge.
- Explain your refactoring plan.

Do not modify anything until the architecture is understood.

---

# Objective

Separate the repository into two conceptual layers.

Layer 1

Blueprint Framework

Reusable engineering knowledge.

Layer 2

OpenCode Builder

Project-specific implementation.

The OpenCode Builder should become the first implementation built using the Blueprint Framework.

---

# Refactoring Goals

## Goal 1

Identify documentation that is generic.

Examples:

- Development workflow
- AI collaboration
- Documentation philosophy
- Testing philosophy
- Builder lifecycle
- Validation philosophy
- Version management

These should become Blueprint documentation.

---

## Goal 2

Identify documentation that is OpenCode-specific.

Examples:

- opencode.json
- OmniRoute
- Provider implementation
- OpenCode runtime
- OpenCode schemas

These remain inside the OpenCode Builder project.

---

## Goal 3

Create a reusable Blueprint Framework.

The Blueprint Framework should not mention OpenCode unless used as an example.

It should describe:

How to build builders.

Not:

How OpenCode works.

---

# Blueprint Folder

Design a new folder similar to:

```
blueprint/

README.md

FRAMEWORK.md

VERSION.md

MIGRATION.md

PROJECT_GENERATOR.md

templates/

README.template.md

ARCHITECTURE.template.md

BUILDER_SPEC.template.md

DESIGN_PRINCIPLES.template.md

TESTING.template.md

TROUBLESHOOTING.template.md

CHANGELOG.template.md

CONTRIBUTING_FOR_AI.template.md

AGENT.template.md
```

You may improve this structure if you find a better organization.

---

# VERSION.md

Blueprint itself must become versioned.

It should include information similar to:

- Blueprint Version
- Supported Builder Versions
- Compatible Projects
- Last Updated
- Breaking Changes
- Migration Required

Blueprint evolution should be tracked independently from Builder evolution.

---

# PROJECT_GENERATOR.md

Create a document explaining how a completely new builder project is created.

Example workflow:

Idea

↓

Create Repository

↓

Copy Blueprint Templates

↓

Rename Templates

↓

Customize Schemas

↓

Implement Builder

↓

Testing

↓

Release

The workflow should be generic.

---

# Documentation Templates

Convert project-specific documentation into reusable templates.

Examples:

Current

Builder generates opencode.json.

Template

Builder generates the project's final configuration artifact.

OpenCode Builder later specifies:

opencode.json

Claude Builder specifies:

Claude configuration.

The templates should avoid hardcoded project names whenever possible.

---

# AI Workflow

Improve the AI workflow.

The Blueprint should become reusable by any AI coding assistant.

The documentation should guide AI agents to:

- Understand architecture first.
- Preserve project philosophy.
- Extend existing systems.
- Avoid unnecessary redesign.

---

# Builder Philosophy

Extract builder philosophy from Builder V2.

Generalize concepts such as:

- Validation
- Merge
- Backup
- Generation
- Testing
- Release

These become reusable engineering concepts.

---

# Project Independence

The Blueprint Framework should be capable of generating documentation for:

- OpenCode Builder
- Claude Code Builder
- Kilo Code Builder
- CLIProxy Builder
- Future builders

without rewriting the framework itself.

---

# Lessons Learned

Create a reusable lessons document.

Example:

LESSONS_LEARNED.md

Store engineering principles rather than project history.

Examples:

- Never hardcode configuration.
- Generated files are not source files.
- Documentation is architecture.
- Small changes reduce risk.
- Testing protects future development.

These lessons should apply to every builder project.

---

# Architecture Rules

Do not redesign Builder V2.

Do not modify working implementation.

Do not remove documentation.

Refactor documentation architecture only.

If improvements require moving files, explain why.

Preserve backwards compatibility whenever possible.

---

# Deliverables

Produce:

- Updated documentation architecture.
- Blueprint Framework.
- Documentation templates.
- Blueprint versioning.
- Project generation workflow.
- Lessons learned document.
- Updated folder structure.
- Migration guidance (if required).

---

# Final Report

When finished:

1. Explain the new architecture.
2. Explain why it is better.
3. Explain how future builders will use it.
4. List every file added.
5. List every file moved.
6. List every file modified.
7. Explain any trade-offs.

Do not implement Builder V2.1.

Do not implement Claude Builder.

The goal is to build the reusable Blueprint Framework that future builder projects will use.