# Upgrade Blueprint Framework

> Objective:
>
> Upgrade the current Blueprint documentation into a reusable Builder Development Framework.
>
> The framework should not only document builders, but also understand how builders evolve over time, how new builders are created, and how future versions should be generated.
>
> The final result should allow future AI agents to build Builder V2.1, V3, Claude Builder, Kilo Builder, or entirely new builder projects with minimal human guidance.

---

# Before Starting

Read the entire project documentation.

Understand:

- Architecture
- Documentation philosophy
- Templates
- AI workflow
- Builder specification
- Roadmap
- Versioning
- Engineering history

Do not modify anything until the complete project has been understood.

---

# Overall Goal

Transform the current Blueprint into a reusable engineering framework.

Current state

Blueprint

↓

Documents Builder

Target state

Blueprint Framework

↓

Designs Builders

↓

Maintains Builders

↓

Creates Future Builders

↓

Creates Builders For Other Projects

---

# Architectural Goal

The framework should become capable of answering four questions.

Question 1

How is this builder built?

Question 2

How should this builder evolve?

Question 3

How do I create another builder?

Question 4

How do I adapt this framework to another project?

If these four questions are answered by the documentation, the Blueprint Framework is considered complete.

---

# New Framework Components

The following documents should be added.

---

## 1. BLUEPRINT_ENGINE.md

Purpose

This document becomes the intelligence layer of the Blueprint.

It should define:

- How builders evolve.
- What happens when a feature changes.
- Which documentation must be updated.
- Which templates must be updated.
- Which version files must be updated.

The Blueprint Engine should explain:

Feature Request

↓

Impact Analysis

↓

Architecture Update

↓

Documentation Update

↓

Template Update

↓

Builder Update

↓

Testing Update

↓

Version Update

↓

Release

The engine should prevent AI agents from updating only the code while forgetting the documentation.

---

## 2. PROJECT_ADAPTER.md

Purpose

The Blueprint should never assume OpenCode.

Instead, every new builder project should begin by defining its adapter.

Examples

OpenCode

Claude Code

Kilo Code

Cursor

Continue

Codex

The adapter should describe:

Project Name

Configuration File

Folder Structure

Supported Providers

Supported Models

Supported Plugins

Supported MCP

Output Artifact

Builder Entry Point

The Blueprint Framework remains generic.

The adapter makes it project-specific.

---

## 3. BUILDER_EVOLUTION.md

Purpose

Describe how future builder versions are created.

Builder evolution should become predictable.

The workflow should be similar to:

Current Builder

↓

Requested Features

↓

Impact Analysis

↓

Architecture Changes

↓

Builder Changes

↓

Documentation Changes

↓

Testing Changes

↓

Migration Notes

↓

Version Release

The AI should understand that creating Builder V2.2 means updating the entire ecosystem rather than only modifying the builder script.

---

## 4. FRAMEWORK_LIFECYCLE.md

Purpose

Describe the complete lifecycle of every builder project.

Idea

↓

Blueprint

↓

Builder

↓

Testing

↓

Release

↓

Maintenance

↓

Next Version

↓

Archive

This document should become the master lifecycle reference.

---

# Improve Existing Documents

The following documents should be reviewed.

README

FRAMEWORK

VERSION

MIGRATION

PROJECT_GENERATOR

Templates

Determine whether improvements are required.

Do not rewrite documents unnecessarily.

Improve only when architecture benefits.

---

# Template Improvements

Current templates should become version-independent.

Avoid references that are specific to OpenCode.

Instead of

Builder generates opencode.json

Use

Builder generates the project's final configuration artifact.

Project adapters should define the actual filename.

---

# AI Workflow Improvements

The framework should support future AI agents.

Example workflow

Read Blueprint

↓

Read Project Adapter

↓

Read Current Version

↓

Read Requested Improvements

↓

Determine Impact

↓

Update Documentation

↓

Update Templates

↓

Update Builder

↓

Update Tests

↓

Update Version

↓

Generate Release

The AI should understand this workflow automatically.

---

# Future Builder Generation

The framework should support creating completely new builder projects.

Examples

OpenCode Builder

Claude Builder

Kilo Builder

Future Builder

The Blueprint should not require rewriting itself.

Only a new Project Adapter should be needed.

---

# Future Version Generation

The framework should support creating future versions.

Example

Builder V2

↓

Builder V2.1

↓

Builder V2.2

↓

Builder V3

The AI should determine:

- What changed.
- Which documentation changes.
- Which templates change.
- Which migration notes are required.

The user should only describe the requested improvements.

The framework should determine the remaining work.

---

# Lessons Learned

Review the current Lessons Learned.

Determine whether they should remain project-specific or become framework-wide.

Lessons should represent engineering principles rather than project history.

---

# Deliverables

When finished provide:

Updated folder structure.

New Blueprint Framework architecture.

Description of every new document.

Relationships between documents.

Updated AI workflow.

Updated version workflow.

Updated project generation workflow.

Updated builder evolution workflow.

Explanation of how future builders will be created.

Explanation of how future builder versions will be created.

---

# Final Objective

After this upgrade the Blueprint Framework should support two independent workflows.

Workflow A

Create Builder V2.2

Input

Current Builder

+

Requested Improvements

↓

Framework determines

Architecture

Documentation

Templates

Builder

Testing

Version

Migration

↓

Release New Builder

---

Workflow B

Create Claude Builder

Input

Blueprint Framework

+

Claude Project Adapter

↓

Framework generates

Architecture

Documentation

Templates

Builder

Testing

Version

↓

Claude Builder V1

---

# Success Criteria

The Blueprint Framework should become reusable.

It should no longer be tied to OpenCode.

OpenCode Builder becomes the first implementation built using the framework.

Future builder projects should require only a Project Adapter rather than rewriting the Blueprint.

The framework should document not only how builders are built, but also how they evolve over time.