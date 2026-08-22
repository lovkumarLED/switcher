# Unique Agent Adapter Documentation Design

Date: 2026-08-14
Status: Approved documentation architecture; implementation gates remain separate
Scope: Documentation ownership and synchronization for unique-agent adapters

## 1. Goal

Define a reusable documentation architecture for coding agents whose configuration
contract cannot safely use the OpenCode/Kilo universal scaffold contract unchanged.
The architecture must keep generic BDF knowledge reusable, isolate each target's
paths and behavior, keep implementation beside its schema and fixtures, and prevent
documentation from claiming support before evidence justifies it.

Claude Code is the first unique-agent adapter. Its initial documentation namespace
will be:

```text
adapters/
`-- claude-code/
    |-- README.md
    |-- ADAPTER.md
    |-- BUILDER_SPEC.md
    |-- TESTING.md
    `-- COMPATIBILITY.md
```

The Gate 2 handoff places its isolated fixture proof artifacts in:

```text
app/engine/claude-code/
|-- build-claude-code.ps1
|-- test-claude-code.ps1
`-- fixtures/

app/engine/schemas/
`-- claude-code-routing.schema.json
```

Those paths are evidence-build locations, not an approved silent replacement for
the canonical source model in
`planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`. That plan proposes final
canonical project sources at `providers/claude-code.json`,
`profiles/<profile>/claude-settings.json`, `schemas/claude-code-routing.schema.json`,
`scripts/build-claude-code.ps1`, and `scripts/test-claude-code.ps1`. Section 2.6
defines the required mapping and unresolved final-placement decision.

This design does not create those adapter documents, alter generic documents, alter
implementation, or change any public support statement. Gate 3 is not authorized by
this design file alone. Current public support remains unchanged.

For Claude-specific gates, managed scope, safety, and implementation criteria,
`planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md` is the governing authority.
This document governs documentation architecture only. If the two documents appear
to conflict, implementation stops until a handoff follows the research plan or an
explicit approved amendment changes it.

## 2. Approved Hybrid Architecture

The approved architecture has four documentation layers and one implementation
layer.

```text
Generic BDF contracts
        |
        v
Project-wide root summaries and policy
        |
        v
Unique adapter namespace: adapters/<agent>/
        |
        v
Gate evidence and compatibility records

Implementation owner: resolved per-agent canonical source plus packaged engine copy
```

### 2.1 Generic BDF layer

Generic BDF documents and templates define only reusable adapter categories,
lifecycle rules, evidence gates, documentation contracts, and synchronization
requirements. They may define concepts such as a same-architecture adapter and a
unique bounded adapter. They must not contain Claude-specific paths, setting names,
environment variables, scope precedence, compatibility findings, or live-test
instructions.

### 2.2 Root project layer

Root documents summarize which targets are supported, experimental, or planned;
describe the existence of unique adapters; and link readers to the detailed adapter
namespace. Root documents must not duplicate the complete Claude contract. Their
purpose is discoverability, current-state truth, and project-wide policy.

### 2.3 Unique adapter layer

`adapters/<agent>/` owns all durable target-specific documentation that is too
detailed or too volatile for generic BDF documents. Each agent receives the same
five-file documentation contract even when its implementation differs.

### 2.4 Evidence layer

Research reports, gate handoffs, and gate reports remain under `planning/`. They are
historical evidence and authorization records, not the maintained user or developer
manual. Adapter documents cite the evidence they depend on without copying sensitive
or temporary evidence.

### 2.5 Implementation layer

Each unique adapter requires an explicitly approved canonical source location and,
when the Switcher ships a self-contained engine, an explicitly derived packaged
location. Documentation never becomes an executable source of settings, and generic
templates never become a place to store target-specific implementation knowledge.

For Claude Code, the current research plan defines the proposed final canonical
source model under root `providers/`, `profiles/`, `schemas/`, and `scripts/`. The
Gate 2 handoff separately defines fixture-only proof artifacts under
`app/engine/claude-code/` and `app/engine/schemas/`. A fixture proof artifact is not
automatically the final canonical implementation and must not be described as one.

### 2.6 Claude path mapping and source-of-truth rule

| Concern | Research-plan canonical source | Gate 2 fixture proof or packaged engine path | Rule |
|---|---|---|---|
| Route/provider metadata | `providers/claude-code.json` | No final equivalent approved | Canonical source proposal; secrets remain references only |
| Profile routing patch | `profiles/<profile>/claude-settings.json` | Gate 2 route fixtures under `app/engine/claude-code/fixtures/` | Fixtures are test inputs, not maintained profile sources |
| Routing schema | `schemas/claude-code-routing.schema.json` | `app/engine/schemas/claude-code-routing.schema.json` | Root schema is the research-plan canonical proposal; packaged schema must be generated or synchronized from the approved canonical source |
| Builder | `scripts/build-claude-code.ps1` | `app/engine/claude-code/build-claude-code.ps1` | Gate 2 file is fixture-only proof; final canonical and packaging relationship is unresolved |
| Test harness | `scripts/test-claude-code.ps1` | `app/engine/claude-code/test-claude-code.ps1` | Gate 2 file proves isolated behavior; final canonical and packaging relationship is unresolved |
| Test fixtures | No final root location specified | `app/engine/claude-code/fixtures/` | Gate 2 evidence assets; future canonical fixture ownership requires an approved handoff |

No worker may copy both trees and treat both as hand-edited authorities. The final
path choice requires an implementation handoff that either follows the research
plan's canonical source model or cites an explicit, approved amendment to that plan.
That handoff must define one hand-edited canonical source, the derivation or sync
direction for any self-contained `app/engine/` copy, drift checks, and release
packaging. Until then, adapter documents must label `app/engine/claude-code/` as the
Gate 2 fixture-proof location, not the final canonical source.

## 3. Adapter Categories

Generic BDF documentation will define these reusable categories.

### 3.1 Same-architecture adapter

A target that safely conforms to the universal scaffold and builder assumptions,
including compatible source folders, provider/model collections, generated artifact
ownership, and scaffold behavior. OpenCode and KiloCode are current examples.

### 3.2 Unique bounded adapter

A target whose native configuration ownership, routing model, precedence, state
files, or write safety differs materially from the universal contract. It uses a
dedicated `adapters/<agent>/` documentation set and an approved target-specific
implementation mapping. It may reuse generic BDF lifecycle and safety contracts, but
it does not pretend to satisfy the same provider registry or generated-artifact
model.

Claude Code is assigned to this category with a narrow routing scope. Its user
settings patch target, Claude-owned state exclusions, scalar route model, and
version-dependent behavior belong only in `adapters/claude-code/`, approved Claude
canonical sources, and derived packaged artifacts, not in generic BDF templates.

## 4. Responsibilities Per Adapter File

### 4.1 `adapters/<agent>/README.md`

The entry point for one unique adapter. It must state:

- purpose and audience;
- current lifecycle status using the vocabulary in Section 9;
- supported and explicitly unsupported scope at that status;
- required reading order for the other four adapter documents;
- implementation and schema locations;
- evidence gates reached and not reached;
- links to the governing decision and gate reports;
- a warning that stronger status must not be inferred from fixture or integration
  evidence.

For Claude Code, this file will explain that the adapter is a narrow routing adapter,
not a general manager for Claude-owned state, plugins, marketplaces, MCP, skills,
permissions, hooks, memory, sessions, or credentials.

### 4.2 `adapters/<agent>/ADAPTER.md`

The authoritative target-specific contract. It must define:

- target name and adapter category;
- managed source and target files;
- excluded files and ownership boundaries;
- supported scopes and precedence limitations;
- configuration model and managed fields;
- secret-reference policy;
- preservation, backup, atomic write, verification, and rollback contract;
- implementation, schema, fixture, and entry-point paths;
- version detection and compatibility obligations;
- restart or reload expectations when known;
- release and support boundary.

For Claude Code, all exact settings paths, setting keys, environment-variable names,
and Claude-owned exclusions live here or in the more detailed builder and
compatibility files. None are copied into `bdf/templates/ADAPTER.template.md`.

### 4.3 `adapters/<agent>/BUILDER_SPEC.md`

The target-specific executable behavior contract. It must define:

- command interface and allowed invocation modes;
- validation stages and fail-fast rules;
- exact managed patch surface;
- path and scope guards;
- duplicate-key and malformed-input handling;
- semantic preservation requirements;
- transaction order, backup, atomic replacement, post-write verification, and
  recovery;
- output redaction and secret-handling requirements;
- status-specific restrictions, including fixture-only or integrated-not-live-
  validated limitations;
- implementation traceability to functions or stages without making prose the
  executable source of truth.

### 4.4 `adapters/<agent>/TESTING.md`

The adapter verification guide. It must define:

- fixture, schema, unit, regression, integration, and live-validation test groups;
- which test groups are authorized at each gate;
- isolation and privacy constraints;
- required negative and recovery cases;
- expected evidence and redaction rules;
- documentation consistency tests;
- commands that operate only on approved fixtures before live validation;
- explicit separation between passing tests and a support claim.

### 4.5 `adapters/<agent>/COMPATIBILITY.md`

The versioned evidence ledger for target behavior. It must define:

- adapter schema and implementation versions;
- target application versions tested;
- operating systems and shells tested;
- route or gateway classes tested without publishing credentials;
- feature-by-feature results and limitations;
- fixture, integration, and live-validation evidence level for each result;
- known precedence, reload, and interoperability caveats;
- last verification date and evidence source;
- unsupported combinations and unresolved questions.

Compatibility entries must report what was observed, not extrapolate timeless
support from one version. Gate 3 can draft this file from compatibility evidence,
but a draft result is not a public support claim.

## 5. Source-of-Truth Hierarchy

Truth is resolved by subject, not by treating one document as universally dominant.

| Subject | Authority, highest first |
|---|---|
| Human authorization and scope | User approval, current Sol handoff, current gate decision |
| Architectural decisions | `planning/DECISIONS.md`, then this approved design and later approved designs |
| Claude gate criteria and safety | `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`, then an approved gate handoff consistent with it or an explicit approved amendment |
| Current public support | `README.md`, `PROJECT_STATE.md`, `ROADMAP.md`, and release records, kept synchronized |
| Generic adapter contracts | `bdf/` framework documents and `bdf/templates/` |
| One unique agent's durable contract | `adapters/<agent>/ADAPTER.md` |
| One unique agent's builder behavior | The canonical implementation and schema paths approved by its governing plan/handoff; packaged copies are derived, with `adapters/<agent>/BUILDER_SPEC.md` required to match |
| Verified compatibility facts | Approved gate reports and `adapters/<agent>/COMPATIBILITY.md` |
| Test procedure | Executable harness, then `adapters/<agent>/TESTING.md` as its maintained explanation |
| Historical evidence | Dated files under `planning/` |
| Generated release documentation | `release_registry.json` through `release-manager.ps1`; generated files are never hand-edited |

If implementation and maintained adapter documentation disagree, work stops until
the discrepancy is resolved. A worker must not silently choose whichever source
permits broader behavior. Historical reports are not edited to make them appear
current; maintained documents link to the newer decision or evidence.

## 6. Exact Likely Shared and Template Files

The following files are the likely synchronization set when the architecture is
implemented. Inclusion here identifies expected impact; it does not authorize edits.
Each gate handoff must select the exact subset justified by that gate.

### 6.1 Unpaired generic BDF framework documents

These files define framework process and do not have same-name project templates.
An authorized framework change updates only the affected files, then uses their
cross-reference rules to identify any project-template impact.

- `bdf/FRAMEWORK.md`: add adapter categories and the unique-adapter layer.
- `bdf/PROJECT_ADAPTER.md`: replace the one-adapter-per-project assumption with a
  project adapter plus reusable unique-agent adapter contract; remove current-only
  statements that Claude can never be a target while retaining history.
- `bdf/AI_WORKFLOW.md`: add unique-adapter read order and gate-aware status checks.
- `bdf/BLUEPRINT_ENGINE.md`: add impact analysis for adapter namespaces and
  compatibility evidence.
- `bdf/PROJECT_GENERATOR.md`: define optional generation of the five-file namespace
  for a selected unique adapter category.
- `bdf/NEW_PROJECT_GUIDE.md`: explain how to choose same-architecture versus unique
  bounded adaptation.
- `bdf/TESTING.md`: add generic fixture, compatibility, integration, and live-
  validation categories without target-specific commands.
- `bdf/BUILDER_EVOLUTION.md`: require adapter docs and compatibility evidence to
  evolve with target-specific implementation.
- `bdf/MIGRATION.md`: define migration from a single project adapter to the hybrid
  layout.
- `bdf/README.md`: summarize the hybrid architecture and link its generic contracts.
- `bdf/VERSION.md`: record the framework change through the release manager's
  governed path, not by hand-editing generated compatibility rows.

### 6.2 Exact project-document to template pairing matrix

The following pairs exist in this repository. A reusable structural change to one
side requires the pair to be checked and, when affected, updated together.

| Project document | Exact template |
|---|---|
| `ADAPTER.md` | `bdf/templates/ADAPTER.template.md` |
| `AGENT.md` | `bdf/templates/AGENT.template.md` |
| `ARCHITECTURE.md` | `bdf/templates/ARCHITECTURE.template.md` |
| `BUILDER_EXTENSION_GUIDE.md` | `bdf/templates/BUILDER_EXTENSION_GUIDE.template.md` |
| `BUILDER_SPEC.md` | `bdf/templates/BUILDER_SPEC.template.md` |
| `CHANGELOG.md` manual structure | `bdf/templates/CHANGELOG.template.md` |
| `CONTRIBUTING_FOR_AI.md` | `bdf/templates/CONTRIBUTING_FOR_AI.template.md` |
| `DESIGN_PRINCIPLES.md` | `bdf/templates/DESIGN_PRINCIPLES.template.md` |
| `DEVELOPER_GUIDE.md` | `bdf/templates/DEVELOPER_GUIDE.template.md` |
| `FOLDER_STRUCTURE.md` | `bdf/templates/FOLDER_STRUCTURE.template.md` |
| `JSON_SCHEMAS.md` | `bdf/templates/JSON_SCHEMAS.template.md` |
| `LESSONS_LEARNED.md` when present in a generated project | `bdf/templates/LESSONS_LEARNED.template.md` |
| `PROFILE_CREATION_GUIDE.md` | `bdf/templates/PROFILE_CREATION_GUIDE.template.md` |
| `PROJECT_STATE.md` manual structure | `bdf/templates/PROJECT_STATE.template.md` |
| `PROVIDER_DEVELOPMENT_GUIDE.md` | `bdf/templates/PROVIDER_DEVELOPMENT_GUIDE.template.md` |
| `README.md` | `bdf/templates/README.template.md` |
| `ROADMAP.md` | `bdf/templates/ROADMAP.template.md` |
| `TESTING.md` | `bdf/templates/TESTING.template.md` |
| `TROUBLESHOOTING.md` | `bdf/templates/TROUBLESHOOTING.template.md` |

`bdf/templates/README.md` is the unpaired template-set guide and pairing registry;
it is not a template for a project file. It must be updated when template inventory,
placeholder requirements, or the cross-reference matrix changes.

These templates define categories, folder conventions, required sections, status
vocabulary, evidence levels, and synchronization rules only. They must not mention
Claude file locations, Claude setting keys, Claude environment variables, or a
Claude-specific support claim. A future generator may instantiate a neutral
five-file adapter document set, but target facts are filled in only in the resulting
`adapters/<agent>/` files.

### 6.3 Root project documents

- `README.md`: public support summary and links to unique-adapter documentation.
- `ADAPTER.md`: OpenCode project facts plus the project's use of unique adapter
  namespaces; it does not absorb Claude details.
- `ARCHITECTURE.md`: add the hybrid documentation and engine ownership layers.
- `BUILDER_SPEC.md`: define routing from the universal path to dedicated engine
  adapters, while linking detailed behavior out.
- `FOLDER_STRUCTURE.md`: document `adapters/`, canonical unique-adapter sources, and
  derived `app/engine/<agent>/` packaging ownership after paths are approved.
- `JSON_SCHEMAS.md`: summarize adapter-owned schemas and link target details.
- `TESTING.md`: summarize adapter test groups and link target procedures.
- `CONTRIBUTING_FOR_AI.md`: add status and gate checks before adapter edits.
- `PROJECT_STATE.md`: reflect actual integrated state only after the architecture is
  implemented; regenerate after the major refactor.
- `ROADMAP.md`: preserve historical phase resolution and state the new narrow effort
  as a later approved direction rather than rewriting history.
- `planning/DECISIONS.md`: add a new dated decision that explicitly reverses the
  broad 2026-08-08 exclusion only for a narrow unique routing adapter.
- `app/README.md`: describe Claude Code only at the evidence-appropriate status and
  link to adapter docs after integration.
- `app/engine/schemas/README.md`: list the Claude routing schema after it is part of
  the integrated engine.

### 6.4 Release-owned files

Support or release changes use `release_registry.json` as the hand-edited release
source and `release-manager.ps1` for generated outputs. `CHANGELOG.md` marker
sections, `CURRENT_RELEASE.md`, generated `bdf/VERSION.md` rows, and the generated
`PROJECT_STATE.md` version table must not be hand-edited.

## 7. Update Matrix by Gate

| Stage | Adapter namespace | Generic BDF and templates | Root/app shared docs | Release docs | Allowed strongest claim |
|---|---|---|---|---|---|
| This design only | Design file only | No change | No change | No change | Architecture approved; current support unchanged |
| Gate 3 compatibility evidence | Draft `COMPATIBILITY.md` and other adapter drafts may be created only by a separate approved handoff; mark draft/evidence level | Normally no change; a separate architecture handoff may prepare neutral contracts without Claude facts | No public support change; planning evidence may link drafts | No change | `Fixture Validated` may be cited only if an approved Gate 2 report is present in the current worktree and cited; otherwise state Gate 2 evidence is pending integration. Gate 3 results may use `Compatibility Evaluated` only after approval |
| Gate 4 app integration | Create or finalize all five files; status `Integrated - Not Live Validated` | Update generic categories and reusable contracts; update paired templates and framework version process | Update architecture, folder, schema, testing, contributor, project-state, app, and README summaries; public wording must say not supported for normal use and not live validated | No supported-release entry | Integrated - Not Live Validated |
| Gate 5 approved live validation | Update test and compatibility evidence; change status only after approval and successful restore/integrity checks | Change only if live evidence reveals a reusable contract correction | Update root and app support summaries consistently | Add release facts to registry and run release manager only after approval | Supported, with exact validated scope and compatibility limits |

Gate 3 work requires its own Sol handoff with exact files, safety constraints,
verification, rollback, assigned worker, and user approval. Nothing in this design
starts a gateway, probes a provider, invokes Claude Code, edits Claude settings, or
authorizes Gate 3.

At the time of this revision,
`planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md` is not present in this
worktree. It is reported to live in an isolated worktree and is not integrated here.
Therefore this design does not assign `Fixture Validated` status, does not claim Gate
2 passed for the current worktree, and does not provide the evidence prerequisite for
Gate 3. A future handoff must integrate or otherwise approve and cite the Gate 2
report before using fixture-validated wording.

## 8. Sync and Version Rules

1. A generic contract change requires the relevant `bdf/` document and every paired
   template to be updated together.
2. A template change is a framework change. Re-check the cross-reference matrix in
   `bdf/templates/README.md` and record the framework version through the approved
   version/release process.
3. A target-specific behavior change updates the approved canonical implementation
   or schema, any derived packaged copy required by the handoff, and the matching
   files under `adapters/<agent>/` in the same change.
4. A compatibility-only finding updates `COMPATIBILITY.md` and, when procedure or
   guarantees change, `TESTING.md` or `BUILDER_SPEC.md`. It does not automatically
   require a framework version.
5. Root documents summarize; adapter documents specify. Repeated target-specific
   tables in root documents are prohibited because they drift.
6. The version fields in Section 8.1 are proposed design requirements. They do not
   assert that version metadata files or implementation constants already exist.
7. `COMPATIBILITY.md` records the versions required by Section 8.1. A target upgrade
   does not retain compatibility status by assumption.
8. A lifecycle status change must be atomic across all five adapter documents:
   `README.md`, `ADAPTER.md`, `BUILDER_SPEC.md`, `TESTING.md`, and `COMPATIBILITY.md`.
   The same change synchronizes root `README.md`, `PROJECT_STATE.md`, `ROADMAP.md`,
   `app/README.md`, and release sources/generated docs when applicable to that status.
9. Generated release artifacts are updated only through the release registry and
   release manager. If a task requires direct overwrite of a generated file, stop.
10. Historical gate reports and decision entries are append-only evidence. New
    maintained documents supersede their conclusions by explicit citation, not by
    rewriting old text.

### 8.1 Proposed authoritative version mechanics

These fields are requirements for the future adapter documentation and
implementation handoff. They are not claims about files or constants that currently
exist.

| Version | Authoritative location required by this design | Mirror locations | Bump trigger and coupling |
|---|---|---|---|
| Adapter document version | Footer or metadata block in each of the five `adapters/<agent>/` files, independently versioned | `adapters/<agent>/README.md` lists the five current document versions | Bump the changed document for any normative prose, responsibility, path, status, or evidence-contract change; editorial-only corrections may use a patch increment under the handoff's chosen scheme |
| Adapter implementation version | One explicit constant or metadata field in the approved canonical builder source selected by the implementation handoff | Builder reports, `README.md`, `BUILDER_SPEC.md`, and `COMPATIBILITY.md` | Bump when executable behavior, managed surface, transaction logic, validation, or CLI contract changes; update builder spec and compatibility ledger in the same change |
| Adapter schema version | A required top-level schema metadata field chosen by the implementation handoff inside the approved canonical routing schema | Derived packaged schema, `ADAPTER.md`, `BUILDER_SPEC.md`, and `COMPATIBILITY.md` | Bump when accepted source shape or validation semantics change; bump implementation version too when builder behavior must change to consume it |
| Tested Claude Code version | Per-result row in `adapters/claude-code/COMPATIBILITY.md`, sourced from an approved gate report | Adapter `README.md` may summarize the currently verified range without broadening it | Add or update only after version-specific evidence; a new Claude version requires revalidation and does not itself bump adapter implementation or schema versions unless adaptation changes |

The implementation handoff must choose the concrete version syntax and exact
constant/field names before code changes. It must not create a separate version file
unless explicitly approved. Packaged `app/engine/` copies mirror canonical
implementation and schema versions and may not carry independently edited versions.

Coupling rules:

1. A lifecycle status change bumps every adapter document whose normative status or
   scope text changes and updates all five documents atomically.
2. An implementation-version bump requires `BUILDER_SPEC.md`, `TESTING.md`, and
   `COMPATIBILITY.md` review; update their document versions when content changes.
3. A schema-version bump requires `ADAPTER.md`, `BUILDER_SPEC.md`, `TESTING.md`, and
   `COMPATIBILITY.md` review; update their document versions when content changes.
4. A compatibility-only row for a newly tested Claude version normally bumps only
   `COMPATIBILITY.md` and any summary document whose tested range changes.
5. A packaged-copy drift check must prove its embedded implementation and schema
   versions equal the canonical source versions before integration or release.

## 9. Status Vocabulary

Only these lifecycle terms may describe a unique adapter.

| Status | Meaning | Public-use implication |
|---|---|---|
| `Proposed` | Architecture or scope is under discussion; no implementation authority | Not supported |
| `Researching` | Read-only research is authorized and underway | Not supported |
| `Fixture Validated` | An approved Gate 2 report is present in the authoritative worktree and cited; isolated fixture contract passed, but no provider behavior or app integration is proven | Not supported |
| `Compatibility Evaluated` | Gate 3 evidence exists for named versions and scenarios; no app integration or live settings validation implied | Not supported |
| `Integrated - Not Live Validated` | Gate 4 app/engine integration and isolated tests passed, but approved live validation has not passed | Not supported for normal use |
| `Supported` | Gate 5 approved live validation passed and release documentation names the exact supported scope | Supported only within documented compatibility limits |
| `Deprecated` | Previously supported but scheduled for removal or replacement | Existing use only under stated limits |
| `Unsupported` | Not offered as a supported target | No support claim |
| `Blocked` | Progress cannot continue until a named safety, evidence, or authorization issue is resolved | Not supported |

Do not use `ready`, `production-ready`, `compatible`, `complete`, or `working` as a
standalone status. Such words require a named evidence level, target version, scope,
and date.

## 10. Contradiction Migration Policy

The 2026-08-08 decision that dropped Claude Code remains a valid historical record.
It correctly rejected treating Claude Code as a same-architecture universal target
and rejected management of its entropic state as if it were generated configuration.
The newer approved direction reverses only the blanket conclusion that no Claude
adapter may exist.

The migration policy is:

1. Append a newer decision to `planning/DECISIONS.md`; never delete or rewrite the
   2026-08-08 entry.
2. The new entry states that Claude Code remains excluded from the universal
   OpenCode/Kilo architecture but may use a unique bounded adapter for narrow routing.
3. The new entry names the preserved prohibitions: no generation or replacement of
   Claude-owned state, no fake multi-provider registry, and no implied management of
   plugins, marketplaces, MCP, skills, permissions, hooks, memory, sessions, or
   credentials.
4. Current docs that say `Claude Code is not supported` remain correct until Gate 5.
   During Gate 4 they are revised to distinguish `Integrated - Not Live Validated`
   from `Supported`, not replaced with an unqualified support claim.
5. Historical roadmap rows such as `Claude Code Builder V1 - resolved (dropped)` stay
   historical. A new narrow adapter effort is recorded as a later decision or phase;
   the old phase is not retroactively marked successful.
6. Any document that uses the old decision to claim Claude can never be adapted is
   revised at the gate that implements the hybrid architecture. It must link both the
   historical rejection and the newer narrow reversal.
7. If a contradiction cannot be resolved with this narrow distinction, stop and ask
   for a new decision rather than broadening the adapter.

## 11. Documentation Testing and Validation

Each authorized documentation change must run checks appropriate to its gate.

### 11.1 Structural checks

- Exactly five files exist for every released unique adapter namespace.
- Every referenced implementation, schema, fixture directory, and shared document
  exists at the status where it is claimed to exist.
- Root links resolve to the adapter namespace.
- No unique adapter path is presented as part of the universal scaffold contract.

### 11.2 Content checks

- No unfinished markers, template tokens, or placeholder language remains in a
  released adapter document.
- All adapter files use the same lifecycle status and evidence dates.
- Managed and excluded scope is consistent across `ADAPTER.md`, `BUILDER_SPEC.md`,
  `TESTING.md`, and `COMPATIBILITY.md`.
- Compatibility claims name the tested target version, adapter version, platform,
  evidence level, and limitations.
- Root summaries do not claim a stronger status than the adapter entry point.
- Generic BDF documents and templates contain no Claude-specific paths, setting
  names, environment-variable names, or compatibility claims.

### 11.3 Safety and privacy checks

- Documentation is ASCII and UTF-8 without BOM unless the repository later adopts a
  different explicit rule.
- No API key, bearer token, OAuth value, prompt, transcript, private setting value,
  or machine-derived secret appears.
- Examples use fictional values and secret references only.
- No documentation instructs a user or worker to edit generated release artifacts.
- No fixture-only command points to a real user Claude path.

### 11.4 Consistency and diff checks

- Search all maintained docs for old absolute statements about the target and verify
  each is either historical or migrated under Section 10.
- Compare shared docs against their templates after any generic change.
- Run the repository's documentation synchronization tests and adapter harness named
  by the active gate handoff.
- Run `git diff --check`, inspect `git status --short --branch`, and verify only the
  authorized paths changed.
- Confirm no generated file was manually edited and no commit was created unless the
  user explicitly requested one.

### 11.5 Claim validation

For every sentence containing a support or compatibility claim, reviewers must be
able to point to an approved gate report. Missing evidence lowers the wording to the
last proven status. Fixture success cannot justify integration wording, integration
success cannot justify live-validation wording, and one live route cannot justify
all gateways or versions.

## 12. Future-Agent Onboarding Pattern

A future unique agent follows this sequence:

1. Classify the target. If the universal assumptions all hold, use the existing
   same-architecture path. Otherwise propose a unique bounded adapter.
2. Record the architectural decision and narrow managed scope before implementation.
3. Create a gate plan that identifies native state ownership, safe patch targets,
   precedence, secrets, backup/restore requirements, and prohibited surfaces.
4. Establish read-only baseline evidence without copying private values.
5. Build fixture-only implementation only at paths authorized by the governing gate
   handoff. Treat those files as proof artifacts until an implementation handoff
   approves canonical source paths and packaging derivation.
6. Draft the standard five-file `adapters/<agent>/` namespace at the gate authorized
   by the project's update matrix.
7. Collect versioned compatibility evidence without converting one target's details
   into generic BDF rules.
8. Integrate through a dedicated adapter route. Do not mutate universal registry
   contracts merely to make a unique target appear universal.
9. Publish `Supported` status only after approved live validation, restore checks,
   root-doc synchronization, and the release process.
10. Revalidate compatibility when the target, adapter schema, implementation, or
    relevant platform version changes.

The five filenames and lifecycle vocabulary are reusable. The contents remain
agent-specific. A future agent must not copy Claude paths or Claude semantics merely
because Claude Code was the first implementation.

## 13. Non-Goals

- Authorizing Gate 3, Gate 4, Gate 5, network access, app integration, or a live test.
- Changing current public support for Claude Code.
- Creating the `adapters/claude-code/` files in this task.
- Editing any BDF document, template, root document, app document, implementation,
  schema, fixture, release source, or generated release artifact in this task.
- Making Claude Code a same-architecture universal target.
- Managing Claude-owned state, OAuth/session data, plugins, marketplaces, MCP,
  skills, permissions, hooks, memory, transcripts, caches, or credentials.
- Promising simultaneous native multi-provider activation in Claude settings.
- Moving generic implementation into documentation or target-specific facts into
  generic templates.
- Rewriting historical decisions or roadmap outcomes.

## 14. Acceptance Criteria

This design is acceptable only if all statements below are true.

- It defines `adapters/<agent>/` as the reusable namespace for unique-agent docs.
- It defines the five initial Claude Code files and a distinct responsibility for
  each.
- It keeps generic BDF docs and templates limited to categories and reusable
  contracts.
- It keeps Claude-specific paths, settings, and compatibility facts outside generic
  templates.
- It distinguishes Gate 2 fixture proof paths under `app/engine/` from the research
  plan's proposed final canonical root sources and requires an approved final mapping.
- It limits root docs to support summaries, architecture, and links.
- It preserves the historical drop decision while defining a narrow explicit
  reversal policy.
- It stages documentation claims through Gate 3 evidence/drafts, Gate 4 integrated-
  not-live-validated docs, and Gate 5 supported/release docs after approved live
  validation.
- It defines source-of-truth, synchronization, version, status, migration, testing,
  onboarding, and non-goal rules without an unfinished marker.
- It explicitly states that this file does not authorize Gate 3 and that current
  public support remains unchanged.
- It changes no file other than this design document and creates no commit.

## 15. Design Decision

Adopt the hybrid documentation architecture. Use generic BDF contracts for adapter
categories and lifecycle rules, `adapters/<agent>/` for durable target-specific
documentation, an explicitly approved canonical-to-packaged implementation mapping,
and root docs for concise support summaries and links. For Claude Code, preserve the
research plan's canonical source proposal unless an explicit approved amendment
changes it; do not promote Gate 2 `app/engine/` fixture proof files silently. Apply
the architecture only through separately authorized gates. Until Gate 5 live
validation is approved, completed, and released, Claude Code is not a publicly
supported target.

Document Version: 1.0
Status: Approved documentation architecture; Gate 3 not authorized
