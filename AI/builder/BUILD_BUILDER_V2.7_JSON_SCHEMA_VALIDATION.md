# BUILD_BUILDER_V2.7_JSON_SCHEMA_VALIDATION — Implementation Plan

> Next builder version: **V2.7** (`scripts\build-opencode-v2.7.ps1`).
> This is the JSON Schema Validation + hardening build (ROADMAP Phase 10.6 + user-approved feature set).
> Gate before Step 2 (Claude Code Builder V1). Run harness + docs off this file and the
> testing/doc sources it names.

---

## Global Constraints

- Source of truth: profiles/, providers/, schemas/, scripts/, docs/. Generated files
  (`opencode.json`) are never hand-edited. V2.7 input must stay byte-identical for the
  same sources.
- Windows PowerShell **5.1** only (no `ConvertFrom-Json -AsHashtable`, no `Test-Json -Schema`).
  JSON Schema validation is implemented inside the builder (a compact PS validator).
- Tests run headlessly and deterministically; same input → same result + exit 0.
- No commits, no `git push`, no force operations, until the user explicitly asks.
- Follow `_agent/SESSION_WORKFLOW.md`: if the build passes ~80% of the 200k context window
  or the daily request quota, STOP at a clean checkpoint, write `AI/CONTINUE_<TOPIC>_<STEP>.md`,
  only then hand a resume prompt (see `AI/CONTINUE_PROJECT_BUILD.md`).
- `AI/FULL_SYSTEM_CHECK.md` Part 7 is now binding: any template change pairs with the
  reference doc in the same change, and triggers the framework version bump in `bdf/VERSION.md`.

---

## Builder Regeneration Guarantee (read first)

This build can be recreated from docs alone. An agent that has never seen the scripts must be
able to regenerate `scripts/build-opencode-v2.7.ps1` + `scripts/test-opencode-v2.7.ps1`
with EVERY feature below by reading:

```
docs/BUILDER_SPEC.md           <- stage/function contracts, CLI, verbatim messages
docs/AI/BUILD_BUILDER_V2.7_JSON_SCHEMA_VALIDATION.md  <- this plan, task-by-task
bdf/TESTING.md                 <- test-harness pattern
docs/TESTING.md                <- project test-groups + definition of complete
docs/JSON_SCHEMAS.md           <- schema-file definitions
docs/ARCHITECTURE.md, docs/FOLDER_STRUCTURE.md
```

Proof task (Task 10): a clean room — no `scripts/` — regenerates both scripts from the docs,
runs the harness green, and its output is identical to the real `opencode.json`.

---

## Version + Feature Summary

| Item | Value |
|------|-------|
| Builder version | V2.7 (odd pattern: V2.1 → V2.3 → V2.5 → V2.7) |
| Scripts | `scripts\build-opencode-v2.7.ps1`, `scripts\test-opencode-v2.7.ps1` |
| Registry | next release `2.5.0`, `builderVersion: "V2.7"`, date = build day |
| V2.1 / V2.5 scripts | left byte-for-byte untouched (their harnesses stay 17/17 and 13/13) |
| Framework bump | `bdf/VERSION.md` — minor `2.2.0` (additive stage + templates) OR patch `2.1.2` if only sync; decide in Task 8 |

User-approved feature set for this build:

| # | Feature | Behavior |
|---|---------|----------|
| F1 | JSON Schema Validation (Phase 10.6) | Validate config sources against `schemas/*.schema.json` BEFORE builder validation. New Stage 3. Non-breaking: missing `schemas/` → warn + skip. |
| F2 | Pre-flight dependency check | Before merge, verify every active-provider/provider ref + profile files + schema files exist; report ALL missing, then abort with clear error. Catches the `modal.json` bug class. |
| F3 | `-WhatIf` dry-run | Validate + merge only; write nothing, create no backup; print planned changes + exit 0. |
| F4 | Backup retention | Prune `backup/` to newest N after a successful write (per prefix `opencode_*` / `settings_*`). Param `-KeepBackups`, default 10. |
| F5 | Provenance stamp | Sidecar `opencode.provenance.json` (builder version, profile, timestamp, active providers, SHA of generated output). Never writes INTO opencode.json (consumer-schema safety). |
| F6 | `-Doctor` diagnose mode | Read the REAL config at `-ConfigRoot`, validate every source against schemas + dependency refs, print a report; no writes, no backups; exit 0 clean / 1 issues found. |
| F7 | Merge diff summary | After a successful build, print Added/Removed/Updated (providers, model counts, mcp servers, plugins) compared with the previous backup artifact. |

Regeneration guarantee holds for all of F1-F7.

---

## File Structure (target after build)

```
scripts/
  build-opencode-v2.7.ps1     <- NEW  (V2.5 copy + 9-stage pipeline + V2.7 features)
  test-opencode-v2.7.ps1      <- NEW  (V2.5 harness copy + V2.7 test groups)
  build-opencode-v2.5.ps1     <- untouched
  test-opencode-v2.5.ps1      <- untouched
  build-opencode-v2.ps1       <- untouched (V2.1)
  test-opencode-v2.ps1        <- untouched
  release-manager.ps1         <- untouched

schemas/                        <- NEW live schema sources (hand-edited, like profiles/)
  schema.json
  settings.schema.json
  provider.schema.json
  models.schema.json            <- covers models.json AND <provider>-models.json
  plugins.schema.json
  mcp.schema.json
  README.md                     <- update: Planned -> Active flow + usage

profiles/, providers/           <- unchanged sources
opencode.json                   <- generated (unchanged shape)
opencode.provenance.json        <- generated sidecar (F5)
backup/                          <- rotated per F4
```

Schema pipeline order becomes:

```
config sources
   -> (F2) Pre-flight dependency check
   -> (F1) JSON Schema validation       [Stage 3]
   -> (Stage) builder Validation        [existing; shifted down]
   -> Backup (F4 retention) -> Merge -> Generate -> Verify (F5 stamp, F7 diff) -> Write
```

---

## Stage renumbering (new canonical, mirrored in BUILDER_SPEC)

V2.5 stages were Stage 0 Discover, 1 Load Profile, 2 Load Provider, 3 Validation,
4 Backup, 5 Merge, 6 Generation, 7 Verification. V2.7 inserts schema validation + pre-flight:

| Stage | Name | Notes |
|-------|------|-------|
| 0 | Discover-Providers | unchanged (V2.5) |
| 1 | Load Profile | unchanged |
| 2 | Load Provider | unchanged |
| 3 | Schema Validation | NEW — F1, also runs pre-flight F2 as its entry gate |
| 4 | Validation | was 3 |
| 5 | Backup | was 4 — honors F4 retention |
| 6 | Merge | was 5 |
| 7 | Generation | was 6 (writes F5 provenance sidecar) |
| 8 | Verification | was 7 (runs F7 diff summary) |

CLI additions: `-SchemaDir` (default `<ConfigRoot>\schemas`), `-WhatIf`, `-KeepBackups <n>`,
`-Doctor`, and `-ProvenancePath` (default `<ConfigRoot>\opencode.provenance.json`).
Existing `-Profile`, `-ConfigRoot`, `-Provider`, `-NonInteractive` unchanged.

---

## Task 1: Scaffold V2.7 from V2.5

- Copy `build-opencode-v2.5.ps1` → `build-opencode-v2.7.ps1`; bump `$BuilderVersion = "2.7"`.
- Copy `test-opencode-v2.5.ps1` → `test-opencode-v2.7.ps1`; bump banner + script path.
- Add the new `param()` entries listed above.
- Renumber stage comments to the 9-stage table.
- Do NOT change V2.5/V2.1 scripts.

## Task 2: Schema-validation engine (F1)

- Implement `$ErrorActionPreference`-safe JSON Schema **subset w/DPS 5.1**:
  - `$schema` (informational), `type` (string/number/object/array/boolean/null),
    `required`, `properties`, `additionalProperties: false`, `items`, `enum`, `$ref` (local same-file only).
  - Exit rule every V2.5 validate-first contract: fail with `Schema '<name>': <file> failed: <property> <message>.`
    verbatim text recorded in BUILDER_SPEC.
- `Test-SchemaCompliance` function: `param(Path, Schema)` → `$true/$false + error list`.
- Stage 3 runs it over every loaded config source (settings, provider, models incl.
  `<provider>-models.json`, plugins, mcp).
- `schemas/README.md`: flip the *Current Status* block from Planned to the implemented
  flow + artifact list.
- Behavior: `schemas/` missing → `[w] No schema directory ... skipping schema validation.` and build continues (compat with real V2.5-era opencode.json).
- harness tests (see Task 6): settings missing required → fail; wrong type → fail;
  additionalProperties → fail; models/provider/mcp violation → fail; no schemas dir → warn + continue.

## Task 3: Pre-flight dependency check (F2)

- `Assert-InputFilesExist`: scan activeProviders + provider config refs + profile files;
  return grouped `[missing provider][]...`.
- Runs as Stage 3 entry point, before schema validation.
- On any missing: `[!] Pre-flight failed: N missing input(s)` then per file
  `Missing: profiles/default/nonexistent.json` → exit 1 (no backup, no output, no partial file writes).
- `-Doctor` reuses same resolver to report counters.

## Task 4: `-WhatIf` (F3) + `-Doctor` (F6)

- `-WhatIf`: run Stages 0-8 with writes off (no backups, no generation write, no sidecar)
  — emit `[WhatIf] Would write opencode.json` + planned changed summary; exit 0 only when validation passes.
- `-Doctor`: `-ConfigRoot`, reads the CURRENT real sources, runs pre-flight + Stage 3 schema
  checks + duplicate-key checks, prints a `File | Status | Detail` table; sets `$LASTEXITCODE`
  0=clean, 1=issues; never touches backup/write.
- Both fully non-interactive (safe for this repo.)

## Task 5: Retention, provenance, diff (F4, F5, F7)

- Backup: normalize name `opencode_<timestamp>.json`; after successful write prune oldest
  `backup/opencode_*` and `backup/settings_*` beyond the last N where N = `-KeepBackups` (default 10).
- Provenance: after generation write `opencode.provenance.json` with
  `{ builderVersion, profile, providers[], generatedUtc, outputSha256 }`. OutputSha computed
  on generated JSON text, seen in verification.
- Diff summary: compare generated arrays (providers, model counts per provider, mcp server
  names, plugin ids) vs the provenance/output of the recent prior backup; print
  `[+] Added 1 provider ... [-] Removed ... ` lines.

## Task 6: V2.7 test harness

- See `test-opencode-v2.5.ps1` layout; Add new groups (each shows PASS/FAIL + exit code 0):
  - Schema Validation: valid pass / each violation fails / missing schema dir → warn+continue
  - Pre-flight: missing file → abort exit≠0 / all present → pass
  - Dry-run: no output file created, no backup created, exit 0
  - Doctor: clean → 0, corrupt → 1 (with diagnostics)
  - Backup retention: N builds produce ≤ `-KeepBackups` files; newest preserved
  - Provenance: sidecar exists, fields + sha correct
  - Diff summary: text contains Added/Removed lines; identical input → no diff lines
  - (kept) 17 V2.1 + 13 V2.5 test results unchanged
- Add a V2.7 regeneration token test (like Test 12): grep `BUILDER_SPEC.md` for the F1-F7
  feature tokens (schema validation, pre-flight, doctor, what-if, provenance, retention, diff).

## Task 7: Docs + templates + framework sync (Part 7)

Docs (regeneration source, list sync in `_agent/SESSION_LOG.md`):
- `BUILDER_SPEC.md`: 9-stage pipeline table, CLI table (+5 params), function contracts for
  `Test-SchemaCompliance`, `Resolve-InputFilesExist`, `Write-ProvenanceFile`+ `Compare-CurrentDiff`,
  verbatim error messages, Regeneration Guarantee expanded to V2.7.
- `ARCHITECTURE.md`: pipeline diagram (schema stage), provenance sidecar.
- `FOLDER_STRUCTURE.md`: schemas/ real files + `opencode.provenance.json` + root update.
- `JSON_SCHEMAS.md`: document each schema file, required/`additionalProperties` rules,
  `<provider>-models.json` coverage.
- `TESTING.md` + `bdf/TESTING.md`: add a `## JSON Schema` test group + define-of-complete.
- `README.md`: usage for new flags; `ADAPTER.md` if a new field (`schemaDir`) fits the table.
- `schemas/README.md`: flip Planned → implemented.
- Templates (session-19 Part-7 remainder MUST be closed in this build):
  - `BUILDER_SPEC.template.md` (new stage list), `ARCHITECTURE.template.md` (pipeline),
    `FOLDER_STRUCTURE.template.md` (schemas/), `JSON_SCHEMAS.template.md` (schema files),
    `CHANGELOG.template.md` (new subheads), `ROADMAP.template.md` (destination + phases),
    `AGENT.template.md` / `TESTING.template.md` / `README.template.md` (minor drift)
  - `bdf/templates/README.md` template list + placeholder audit must stay 1:1.
- Framework: `bdf/VERSION.md` bump (remember: *additive new stage = 2.2.0; sync-only = 2.1.2*,
  pick during Task 7); record the bump + change entries; release-manager still no-op on these
  manual sections.

## Task 8: Real-world validation

- Run `-WhatIf` on the real config (as coding profile) — expect merge-PASS, no write.
- Run `-Doctor` on the real config — expect exit 0 and report loop all Clean.
- Run the full real build for coding; diff opcode vs commit baseline → whitespace `RESULT:
  IDENTICAL` (or `SEMANTICALLY IDENTICAL` only) + prove provenance file + retention works.
- Re-run all harnesses: `test-opencode-v2.ps1` 17/17, `test-opencode-v2.5.ps1` 13/13,
  `v2.7` new harness N/N.

## Task 9: Release 2.5.0

1. `release_registry.json`: new entry version `2.5.0`, `builderVersion "V2.7"`, status
   `Current`, prior → Previous, highlights = F1-F7, `testingSummary` = 17/17 + 13/13 + N/N.
2. User reviews the registry facts (no merge, no push).
3. After review: `release-manager.ps1 -Update` (twice for determinism), verify
   CHANGELOG top = 2.5.0, CURRENT_RELEASE = V2.7/2.5.0, PROJECT_STATE version table,
   `bdf/VERSION.md` Supported Builder Versions row (=V2.7, V2.5, V2.3, V2.1).
4. `ROADMAP.md` Phase 10.6 → Completed; update `JOURNEY_TO_V3.md` Current Position + side-goal tick.

## Task 10: Clean-room recreation proof (user's core requirement)

1. Copy current `scripts/` to a temp backup outside the repo.
2. `Delete every file in `scripts/` (in a temp copy; the real repo keeps scripts until the
   user asks) — or run in a fresh temp root with `scripts` absent-`.
3. Regenerate `build-opencode-v2.7.ps1` + `test-opencode-v2.7.ps1` from docs ONLY
   (BUILDER_SPEC + TESTING + this plan). Never from the script copies.
4. Run the regenerated harness: expect the same test counts and exit 0.
5. Clean-room build on the sources → output `SEMANTICALLY IDENTICAL` to real opencode.json.
6. Optionally extend `AI/FULL_SYSTEM_CHECK.md` Part 4 to also assert the scripts-recreation
   step for V2.7; snapshot this session (`docs/.superpowers/snapshot-20/`, 9 files).

---

## Resume Prompt

Paste this at the start of the next session:

```
Resume BUILDER V2.7.

Read C:\Users\loveb\.config\opencode\docs\AI\BUILD_BUILDER_V2.7_JSON_SCHEMA_VALIDATION.md

Execute Task 1 -> Task 10 in order: scaffold v2.7, schema-engine + pre-flight + whatif/doctor
+ retention + provenance + diff, v2.7 test harness, docs/templates/framework sync (close the
session-19 Part 7 template remainder), real-world validation, release 2.5.0, clean-room
regeneration. Verify visibly-not-touched: real scripts only scaffold task-id. No commits, no
push, no delete, no force; ask before any destructive step. Hand me this resume prompt again if
you stop early.

Self-review each task before moving on.
```

---

## Self-Review Notes (fill during build)

- [ ] V2.1 + V2.5 scripts/harness byte-identical after build (hash check).
- [ ] 17/17 + 13/13 + v2.7 all exit 0; deterministic (2 runs same).
- [ ] `opencode.json` input→output identical vs committed baseline.
- [ ] provenance/retention/doctor/diff verified by harness + real run.
- [ ] Templates Part-7 sync closed; `<version>` bump recorded; release-manager no-op ×2.
- [ ] Clean-room Task 10 done; snapshot-20 present.
- [ ] All FAILs from `AI/FULL_SYSTEM_CHECK.md` logged with Next lines.

**Document Version:** 1.0

**Status:** Active Implementation Plan (V2.7)