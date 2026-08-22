# Build Release Manager V1

> Objective
>
> Use the Builder Development Framework (BDF) to add an automated release pipeline so version documentation can never drift.
>
> Every version release follows one workflow: facts -> release-manager script -> harness verification.

---

# Before Starting

Read the project in the documented order.

Read:

- AGENT.md
- PROJECT_STATE.md
- bdf/ (AI_WORKFLOW.md, BUILDER_EVOLUTION.md, VERSION.md)
- Current builder V2.1 source
- Existing documentation

Understand the architecture before modifying anything.

---

# Design Philosophy

The release system follows one principle:

```
Facts are written once.
Documentation is generated.
Generated artifacts are never edited manually.
```

This guarantees deterministic version documentation.

---

# Problem

Today release documentation (CHANGELOG.md, bdf/VERSION.md, PROJECT_STATE.md version tables) is hand-written by the AI at session end.

Symptoms:

- 10 docs hard-code version facts; every builder change requires hand-syncing all of them.
- Drift is only caught when the user points it out.
- No machine-readable record of what shipped in each version.

---

# Goal

Make release documentation a generated artifact with a single machine-readable source of truth, so CHANGELOG can never become irrelevant or inconsistent again.

Success criteria:

- Running the release manager regenerates all version documentation from one facts file.
- The test harness verifies registry <-> docs consistency and FAILS the run when they drift.
- Releasing the next version (V2.2, V2.3, ...) is one command, not a 10-file manual edit.

---

# Architecture

```
docs/release_registry.json
            |
            v
scripts/release-manager.ps1
            |
            +---> CHANGELOG.md        (auto-generated marker section only)
            +---> CURRENT_RELEASE.md  (quick current-release reference)
            +---> bdf/VERSION.md      (compatibility table)
            +---> PROJECT_STATE.md    (version history table)
            +---> release validation  (built-in pre/post checks)
```

## Components

### 1. `docs/release_registry.json` — the permanent release database

Machine-readable history of every release. Named "registry" because it will later hold release dates, compatibility, milestones, support status, and release channels.

Ownership:

```
release_registry.json

Primary source of release facts.

Normally updated by the AI after implementation and testing.

The user reviews the generated release facts before running the Release Manager.

Once approved, the Release Manager generates all release documentation.

The registry should never be edited manually unless correcting historical data.
```

The AI already knows the version facts (version number, features, improvements, tests, docs updated) at the end of a version's work — so the AI writes them into the registry, the user reviews them, and only then does the Release Manager run. Manual registry edits are reserved for correcting historical data, never for routine release work.

Schema (one entry per release, newest first):

```json
{
  "releases": [
    {
      "version": "2.2.0",
      "builderVersion": "V2.1",
      "date": "2026-08-04",
      "status": "Current",
      "summary": "Builder V2.1: extended validation, modular merge pipeline, provider-specific models, output verification, and automated testing.",
      "highlights": [
        "Provider-specific models",
        "Modular merge pipeline",
        "Extended validation",
        "Pre-write output verification",
        "Automated test harness"
      ],
      "newFeatures": [
        "scripts/test-opencode-v2.ps1 - automated test harness (17 tests: 9 builder + 8 Release Docs)",
        "Provider-specific models: providers/<p>/models.json precedence",
        "-ConfigRoot parameter for isolated test builds",
        "Output verification stage before writing"
      ],
      "improvements": [
        "Extended validation (duplicates, malformed definitions, missing fields)",
        "Merge logic split into independent stages",
        "Concise count-based logging"
      ],
      "bugFixes": [
        "Here-string parse errors",
        "PSObject.Properties.Count reliability",
        "Plugin single-element array unrolling",
        "Removed 2 corrupted backups"
      ],
      "breakingChanges": "None",
      "migrationRequired": "No",
      "testingSummary": "17/17 tests passed, exit code 0",
      "knownIssues": "None",
      "docsUpdated": [
        "BUILDER_SPEC.md",
        "CHANGELOG.md",
        "PROJECT_STATE.md",
        "TESTING.md",
        "ROADMAP.md",
        "FOLDER_STRUCTURE.md",
        "ARCHITECTURE.md",
        "ADAPTER.md",
        "README.md",
        "bdf/VERSION.md"
      ]
    }
  ]
}
```

Rules:

- Newest release first.
- Exactly one `"status": "Current"` entry; all others `"Previous"`.
- The AI updates this file with facts at the end of a version's work. The release manager does the rest.

### 2. `scripts/release-manager.ps1` — the generator

Framework-agnostic by design (not "release-opencode" — tomorrow a Claude builder project can reuse it unchanged).

Parameters:

- `-ConfigRoot` — docs repository root (defaults to the real docs repo; tests pass a temp copy).

Stages:

1. **Read** `release_registry.json` (raw-text scan for duplicate keys like the builder does).
2. **Validate registry** — unique versions, no numbering gaps, exactly one Current, required fields present.
3. **Generate CHANGELOG section** — only between markers:
   ```
   <!-- AUTO-GENERATED START -->

   (rich entries for all versions, newest first)

   <!-- AUTO-GENERATED END -->
   ```
   Hand-written prose above/below the markers is preserved verbatim. Rich entry format:
   ```
   ## Version X.Y.Z
   Status / Date / Summary
   Highlights
   New Features
   Improvements
   Bug Fixes
   Breaking Changes
   Migration Required
   Testing Summary
   Known Issues
   ```
4. **Generate CURRENT_RELEASE.md** — quick reference for humans and AI: Builder Version, Project Version, Release Date, Status, Migration Required, Testing Summary.
5. **Update bdf/VERSION.md** — compatibility table (supported builder versions, last updated, breaking changes, migration required) and its change history.
6. **Update PROJECT_STATE.md** — version history table between its own markers (only the table; the rest of the 15-section doc is untouched).
7. **Post-write validation** — re-read generated files, confirm markers intact, confirm single Current.

### 3. Test harness additions (`scripts/test-opencode-v2.ps1`)

New "Release Docs" test group (tests 10+):

- Registry <-> CHANGELOG: every registry entry has a CHANGELOG entry and vice versa.
- Version numbering is continuous (2.1 -> 2.2 -> 2.3, no gaps).
- Exactly one Current status in registry and CHANGELOG.
- CHANGELOG entry content matches registry facts.
- Migration/breaking fields consistent across registry, CHANGELOG, CURRENT_RELEASE.md.
- CURRENT_RELEASE.md matches the Current entry.
- Marker boundaries intact in CHANGELOG/PROJECT_STATE.
- Deterministic: two runs produce byte-identical output.

### 4. Current-state migration

- `docs/release_registry.json` — created with the V2.1 entry (facts from CHANGELOG 2.2.0 + session 7 log).
- `CHANGELOG.md` — V2.1 entry converted to rich format inside markers. **V1.0/V2.0 entries are NOT rewritten** (history is read-only; V2.1 is the start of the rich release system).
- `CURRENT_RELEASE.md` — created (V2.1 / 2.2.0).
- `docs/RELEASE_NOTES_V2.1.md` — deleted (replaced by the rich CHANGELOG entry; avoids duplicate info).
- Docs updated: BUILDER_SPEC.md, CHANGELOG.md, PROJECT_STATE.md, TESTING.md, ROADMAP.md, FOLDER_STRUCTURE.md, ARCHITECTURE.md, ADAPTER.md, README.md, bdf/VERSION.md, AI/BUILD_<this spec>.md.

---

# Changelog Marker Policy

- `CHANGELOG.md` and `PROJECT_STATE.md` carry:
  ```
  <!-- AUTO-GENERATED START -->
  ...
  <!-- AUTO-GENERATED END -->
  ```
- The release manager rewrites ONLY the content between markers.
- Manual prose above/below markers is never touched.
- Markers are non-negotiable: if missing, the script aborts rather than guessing.

---

# Failure Policy

If release generation fails:

```
Do not modify CHANGELOG.
Do not modify VERSION.
Do not modify PROJECT_STATE.
Do not modify CURRENT_RELEASE.md.
Exit with failure.
Leave repository untouched.
```

Generation is all-or-nothing. Validation happens first; nothing is written until every input passes. If any write fails mid-run, the run aborts with a failure exit code and the repository state is exactly as it was before the run.

---

# Release Workflow

The registry is the sequence authority.

Every release follows the same workflow:

```
Finish Builder

    v

Run Tests

    v

AI updates release_registry.json

    v

User reviews the release facts

    v

Run release-manager.ps1

    v

Generated Docs (CHANGELOG, CURRENT_RELEASE, VERSION, PROJECT_STATE)

    v

Commit
```

Next release (Builder V2.2) example:

1. Implement + test the feature (existing V2.1 pipeline).
2. AI updates `release_registry.json` with the V2.2 facts entry.
3. User reviews the release facts.
4. Run `release-manager.ps1 -ConfigRoot <docs>`.
5. Run `test-opencode-v2.ps1` — Release Docs group must pass.
6. Session ends; SESSION_LOG records the facts.

---

# Evolution Checklist (BUILDER_EVOLUTION.md conformance)

- [x] Requested improvements recorded (this spec).
- [x] Impact analysis completed.
- [x] Architecture changes documented (this spec).
- [x] Documentation updated (all affected docs).
- [x] Templates updated (when affected — none for V1).
- [x] release-manager.ps1 implemented.
- [x] release_registry.json created.
- [x] Tests updated and passing (Release Docs group).
- [x] Migration notes written (when required — none for V1).
- [x] Version records updated.
- [x] Release generated.
