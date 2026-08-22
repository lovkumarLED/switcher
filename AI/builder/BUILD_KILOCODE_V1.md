# BUILD_KILOCODE_V1 - Embedded Prompt

> Hand this file's Resume Prompt (bottom) to the next agent session to build KiloCode Builder V1.
> Root plan: `planning/NEXT_PHASE_IMPLEMENTATION_PLAN.md` / `docs/ROADMAP.md`.

# BUILD_KILOCODE_V1 - Implementation Plan

## Status
Active - planned

## Decision Context

Claude Code Builder V1 is DROPPED. Why:

- Claude Code config is entropic: global `~/.claude.json` + runtime `~/.claude/` directory, specialized JSON shapes.
- Provider attach is single-provider-at-a-time; adding/maintaining providers by hand is hard; automatic generation fragile.
- Rebuilding its config format each time is high-effort, low-reward for a generalized framework.

OpenCode and KiloCode share the SAME architecture (same folder layout, `.json` config, provider files), so KiloCode V1 is the correct second validation: max signal, min friction.

The BDF V3 claim (from `NEXT_PHASE_IMPLEMENTATION_PLAN.md` Phase 7, revised) becomes:

The same framework generates and maintains:

- OpenCode Builder
- KiloCode Builder

without architectural redesign. Only Project Adapters differ.

---

## Global Constraints

1. Do NOT break OpenCode builders. All three harnesses (v2.1 17/17, v2.5 13/13, v2.7 30/30) must stay green when changing shared scripts/docs.
2. No literal API keys anywhere. `{env:...}` placeholders only (P1 key-scan gate).
3. No manual doc copying into the Kilo project. The framework itself generates the new builder project (working rule from plan Phase 5).
4. Every framework improvement must benefit all supported builders.
5. After build, always update PROJECT_STATE / CHANGELOG / VERSION / Registry / docs (working rule).
6. Regeneration guarantee: a clean-room rebuild from frozen builder-version scripts reproduces the same feature set. Snapshots live in `docs/.superpowers/snapshot-<N>/`.
7. No `git commit` unless explicitly asked.

---

## Phase summary (canonical, mirrored in ROADMAP)

- Phase 1 - Complete Builder V2.5 ✅
- Phase 2 - Freeze OpenCode Builder ✅
- Phase 3 - Build KiloCode Builder V1   <-- we are here
- Phase 4 - Improve Framework
- Phase 5 - BDF V3: Release (OpenCode + KiloCode proven)
- (Claude Code Builder: dropped, recorded only)

---

## Research Task 0: discover KiloCode reality

Do NOT assume the config shape. Verify from source (this project has a `network/net` ephemeral channel; else official KiloCode repo / docs):

1. KiloCode's real config home + file names:
   - `~/.kilo/`?  else extension-owned dir (VSCode settings vs standalone)?
   - config file name: `kilo.json` / `settings.json` / `config.json`?
2. How providers are declared (model list per provider, provider manifests, api key env).
3. Where MCP servers / plugins live, if anywhere.
4. Reads recursive? Scriptable from our builder pattern?

Output of Task 0 is a small fixture set modeled exactly on how OpenCode's profile layout works (one adapter, not a redesign).

Reuse: OpenCode V2.7 script pipeline `build-opencode-v2.7.ps1` (9 stages, P1/P2) + `test-opencode-v2.7.ps1` (30 tests) as the template; only adapter parts change.

---

## Task 1: Scaffold KiloCode builder from V2.7

Create new files in `scripts/`:

- `build-kilo-v1.ps1`
- `test-kilo-v1.ps1`

Copied from V2.7 variants, then: everywhere `opencode.json` appears replace with the KiloCode output filename; adapter-specific read from KiloCode shapes (Task 0). Keep everything else: schema preflight, WhatIf, Doctor, backup retention, provenance sidecar, merge-diff summary.

Register: add to `...` release-manager inventory of builders? registry `builderVersion: K1`.

---

## Task 2: KiloCode Project Adapter

Define adapter as the ONLY Kilo-specific place (mirror `bdf/project adapter` pattern):

- output files (name + location)
- merge rules
- validation rules
- schema expectations
- destination paths

This adapter file must be reusable documentation for future "another same-arch agent" projects.

---

## Task 3: Profiles + providers fixtures for Kilo

- `profiles/default/settings.json` (Kilo shape)
- `<provider>-models.json` per provider (or whatever Task 0 says Kilo uses)
- provider base model source

---

## Task 4: Tests

Mirror the 30-test suite structure; with Task 0-specific fixes.

- 30/30 green for Kilo (target)
- Plus: real-build test on the user's real Kilo home (invoke) with backup/recurse verify.

Harness batteries must stay green for OpenCode (17/13/30).

---

## Task 5: Docs + generated

Docs to create/update:
- `BUILDER_SPEC_KILO_ADAPTER.md` (lives in the kilo project: `~/.config/kilo/docs/` - the kilo adapter spec, created in a later session)
- `ADAPTER_KILO.md` (planned name; realized as `BUILDER_SPEC_KILO_ADAPTER.md` in the kilo project)
- Kilo section in templates README placeholder tables
- Project State (a single line so the system knows Kilo exists)

Separate Documentation section later for V3 doc simplification.

---

## Task 6: Release

New registry entry: e.g. `version 3.0.0`, `builderVersion K1`, flagged current? No - do not touch OpenCode release. Review with user: separate pipeline or same registry with builderName field.

---

## Exit gates (all must pass)

- OpenCode harnesses: v2.1 17/17, v2.5 13/13, v2.7 30/30, all exit 0.
- Kilo harness: target 30/30 exit 0.
- Inkiloway: real Kilo home build made its real config + backup + provenance, hash round-trip.
- Key scan: zero literal keys in generated Kilo output.
- Clean-room: freshly recreated Kilo scripts + docs + templates + registry reproduce the same Kilo feature set from a snapshot-<N>.

---

## Version numbering

Plan is: BDF V3 (framework version), Kilo Builder got its own module version (Kilo V2?); will confirm with user at release stage.

---

## Self-Review Notes (fill during build)

- [ ] Confirm KiloCode real paths from source (Task 0)
- [ ] Confirm adapters vs builders split stayed clean
- [ ] Confirm no literal keys

---

## Resume Prompt

Copy/paste to the next session agent to continue:

```text
Resume prompt:

You come right after having completed FULL_SYSTEM_CHECK v1.1 session 22 (7/7 green).
Decision recorded: CLAUDE CODE BUILDER V1 IS DROPPED. Build KiloCode Builder V1 instead.

Read `docs\AI\BUILD_KILOCODE_V1.md` FIRST. That file holds the whole plan:
Task 0 research (Kilo config shapes), Task 1 scaffold from `scripts\build-opencode-v2.7.ps1`
+ `scripts\test-opencode-v2.7.ps1`, Task 2 adapter, Task 3 fixtures, Task 4 Tests
(30/30 like OpenCode), Task 5 Docs, Task 6 release review, Task 7 matches
(release-registry + docs sync, the plan defines tasks 0-6; task 7 = final alignment).

Exit gates under "Decision gates" in that file.

Before anything: check real KiloCode config shape (paths + file names + provider layout). Do not guess.
Create from template only the new `scripts\build-kilo-v1.ps1` + `scripts\test-kilo-v1.ps1`, plus adapter docs.
D O NOT TOUCH existing OpenCode 17/13/30 harnesses. Then run: all three OpenCode harnesses must stay green, then run the Kilo harness until green, then docs + registry review.

No git commit unless I ask.
Report: `planning\NEXT_PHASE_IMPLEMENTATION_PLAN.md` + `docs\ROADMAP.md` state + result table.
```
