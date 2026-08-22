# VERSION_STRATEGY

> How BDF versions are numbered, judged, and released.

---

# Core Belief

Software never truly has a "final" version.

V3 is not the end. It is the **first stable public milestone** — the point where the
framework is mature enough to generate builders for OpenCode, KiloCode, and any
open-source coding agent sharing their architecture. (Claude Code is excluded —
see `DECISIONS.md` 2026-08-08.)

After V3: V3.1, V4, and so on.

---

# The Road

```
Current (Builder V2.7 JSON Schema Validation, project 2.5.0)
↓
BDF V2.5 — framework generalization (prepare for V3) ✅
↓
Builder V2.7 — JSON Schema Validation gate ✅
↓
KiloCode Builder V1 — first real validation ✅
↓
Universal Agent Framework core (scaffold-agent.ps1) — in progress
↓
Framework improvements (learned from universal)
↓
BDF V3 — Universal Builder Generator (destination)
```

Real projects shape the framework. Never assumptions.

---

# Versioning Rules

1. Every version builds on the previous version. Evolution, not rewrite.
2. A version's scope is defined in `ROADMAP.md` phases and the build prompt
   (`AI/builder/CONTINUE_PROJECT_BUILD.md` checkpoint files).
3. Versions that only strengthen the framework (like V2.5) still get a registry entry
   and a release.
4. The release pipeline is the version's entry into history:
   `release_registry.json` → `release-manager.ps1` → CHANGELOG / CURRENT_RELEASE /
   PROJECT_STATE / bdf/VERSION.md.

---

# When a Version Counts as Complete

A version is complete only when ALL of these are true:

- **Built** — all planned features exist and are documented.
- **Tested** — the test harness passes.
- **Validated** — a real end-to-end run confirms the builder works.
- **Released** — registry updated, release manager run, release docs generated.
- **Tracked** — CHANGELOG, ROADMAP, PROJECT_STATE, and JOURNEY_TO_V3 updated.

Skipping any of these means the version is not done. The journey does not advance.

---

# Relationship to Other Documents

| Document | Role |
|----------|------|
| `planning/BDF_ROAD_TO_V3.md` | Vision + version philosophy |
| `ROADMAP.md` | Concrete phases and statuses |
| `_agent/JOURNEY_TO_V3.md` | Live position on the road |
| `AI/builder/CONTINUE_PROJECT_BUILD.md` | How a version gets built across sessions |

---

**Document Version:** 1.0

**Status:** Active Version Policy
