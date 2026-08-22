# Design Principles

> Core engineering principles followed by the OpenCode Configuration Manager.

---

# Purpose

This document explains the reasoning behind the architectural decisions used throughout the project.

Unlike the architecture document, which describes **how the project is organized**, this document explains **why it is organized that way**.

Every future change to the project should respect these principles.

---

# Principle 1 — Single Responsibility

Every component should have one clearly defined responsibility.

Examples:

| Component | Responsibility |
|-----------|----------------|
| Provider | API connection |
| Profile | User configuration |
| Builder | Configuration generation |
| Backup | Configuration recovery |
| Documentation | Project knowledge |

No component should perform the responsibility of another.

---

# Principle 2 — Configuration Over Hardcoding

Configuration belongs inside JSON files.

Implementation spans the PowerShell engine/builders AND the Python FastAPI
app + vanilla JS frontend; follow each layer's conventions.

The builder should never contain provider-specific configuration.

Instead, it should read configuration from the source files.

This makes the builder reusable and easier to maintain.

---

# Principle 3 — Source of Truth

Only source files are considered authoritative.

Source files include:

- Provider definitions
- Profile configuration
- Builder scripts
- Documentation

Generated files are disposable.

If a generated file is deleted, it should be recreated by the builder.

---

# Principle 4 — Generated Files Are Never Edited

Generated files must never be modified manually.

Generated artifacts:

```
opencode.json (V2.7) / kilo.json (K1) + provenance sidecars
```

If changes are required:

1. Modify the source configuration.
2. Execute the builder.
3. Generate a new configuration.

---

# Principle 5 — Separation of Configuration and Implementation

Configuration answers:

> What should be built?

Implementation answers:

> How should it be built?

The builder should never define configuration.

Configuration files should never contain implementation logic.

---

# Principle 6 — Fail Fast

Configuration errors should be detected before generation.

The builder should stop immediately when:

- Required files are missing.
- JSON is invalid.
- Validation fails.

Partial output should never be produced.

---

# Principle 7 — Automation First

Manual work should be minimized whenever possible.

Examples:

- Automatic backup creation.
- Automatic configuration generation.
- Automatic validation.

The developer should edit source files, not generated files.

---

# Principle 8 — Modular Architecture

Every major responsibility belongs in its own module.

Current top-level layout:

- app/                     self-contained Switcher app + bundled engine
- adapters/                unique-adapter docs
- bdf/                     framework docs + templates
- planning/
- AI/
- root guides              README.md, ADAPTER.md, ...
- release_registry.json

Future functionality should be introduced by adding modules rather than modifying existing ones.

---

# Principle 9 — Backward Compatibility

New features should not break existing functionality.

Whenever possible:

- Extend.
- Do not replace.

Existing configuration should continue working after new functionality is introduced.

---

# Principle 10 — Documentation First

Every completed feature should be documented.

Documentation should describe only implemented functionality.

Future ideas belong exclusively in `ROADMAP.md`.

Documentation should never pretend that unfinished features already exist.

---

# Decision Checklist

Before introducing a new feature, ask:

- Does it follow the Single Responsibility Principle?
- Does it avoid hardcoding?
- Does it preserve the source of truth?
- Does it require manual editing of generated files?
- Can it be documented clearly?
- Does it preserve backward compatibility?

If the answer to any of these questions is "No", reconsider the design.

---

# Summary

The OpenCode Configuration Manager is designed to be:

- Modular
- Maintainable
- Predictable
- Extensible
- Automation-driven

These principles are considered the foundation of the project and should guide all future development.

---

**Document Version:** 1.0

**Status:** Active Design Principles