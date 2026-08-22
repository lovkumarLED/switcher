# Claude Code Adapter

> The unique bounded routing adapter inside [Switcher](../../README.md) —
> start with the main README for install and demos, or see the
> [app guide](../../app/README.md) for day-to-day use.

Lifecycle status: **Live validated**

Evidence date: 2026-08-17

## Purpose and audience

This document set describes the Claude Code adapter inside the Switcher app:
a narrow, scalar routing adapter that manages exactly one Claude Code route at
a time through a shared routing core. It is written for app developers, Claude
Code users, and AI agents extending the adapter.

Claude Code is fundamentally different from OpenCode and KiloCode. It is NOT a
provider registry, a plugin manager, an MCP manager, or a full Claude settings
generator. This adapter manages only the approved routing fields and preserves
every unsupported semantic value.

## Current lifecycle status

**Live validated** (2026-08-17, Gate 5B corrected live validation PASS + Gate 5C
approved). The adapter is integrated into the app, its production-path logic is
proven on temporary fixture copies (Gates 2-4A), and an approved live validation
run against the real user-scope `.claude/settings.json` passed: one saved
loopback route applied and surgically restored, `/status` evidence collected,
and one no-session-persistence routing request returned the fixed marker with
the applied route's model verified from structured response metadata.

The real-target lock was subsequently **opened by owner decision** (session 48),
so Apply/Restore work from the UI. A second owner-authorized live gate
(2026-08-22) re-executed apply + restore end-to-end with a SHA-256 byte-verified
restoration of `settings.json` and all app state files. The lock remains a
deliberate control, not a technical limitation — it can be closed again by owner
decision.

## Reading order

1. `ADAPTER.md` - authoritative target contract (managed sources, exclusions,
   configuration model, transaction contract).
2. `BUILDER_SPEC.md` - executable behavior contract for the shared routing core
   and both entry points.
3. `TESTING.md` - verification guide and authorized test groups per gate.
4. `COMPATIBILITY.md` - versioned evidence ledger.
5. `README.md` (this file) - entry point.

## Scope at this status

Managed by this adapter:

- Only the top-level `env` object of the user-scope Claude settings target
  (`settings.json`) is surgically patched, and only for exactly one scalar
  routing profile: endpoint base URL, exactly one auth strategy by
  environment-variable reference, `ANTHROPIC_MODEL`, the four curated
  compatibility options, and the four role aliases (`opus`/`sonnet`/`haiku`/
  `fable` via `ANTHROPIC_DEFAULT_*_MODEL`, each set only when the route assigns
  a model to that role and removed when it does not). Two managed top-level
  keys are also patched: `availableModels` (the route's model set) and
  `enforceAvailableModels` (true) whenever the route restricts the `/model`
  picker. Top-level `model` and every unrelated byte are preserved exactly; the
  document is never regenerated.
- Saved routing profiles (multiple saved, exactly one applied) in the app-owned
  route store, with backup/restore status and redacted routing activity.

Explicitly NOT managed (Claude-owned, read-only or unsupported; zero access):

- Marketplaces, plugin installation, MCP servers, skills, permissions, hooks,
  memory, sessions, credentials, prompts, and transcripts.
- The Claude state file, `.claude/plugins`, project/local settings, `.mcp.json`,
  FCC executables, and anything under `.local\bin`.

## Model roles (opus / sonnet / haiku / fable)

A route can assign additional model IDs to Claude Code's four role aliases.
Each role holds at most one model ID; on apply the adapter writes the matching
`ANTHROPIC_DEFAULT_<ROLE>_MODEL` env value and, when the route restricts the
picker, top-level `availableModels` + `enforceAvailableModels` so `/model`
shows only the route's models. A blank role is never written, and any stale
value is removed on apply - leftover models cannot survive a route switch.
`enforceAvailableModels` enforcement requires Claude Code 2.1.175+ (ignored
before that; the allowlist itself works now). Role values are read at startup,
so the restart notice applies.

## Credential storage

Route key values pasted in the route form are stored in the app's own
**Windows DPAPI-encrypted** credential store (`app/state/claude-credentials.bin`,
git-ignored) — encrypted with the current Windows user's key, so keys never
exist in plaintext in the registry, environment, route store, logs, or
reports. The route store holds only the reference name. Apply resolves the
credential from the store into the builder's process. Legacy app-created
environment variables are migrated into the store automatically on next apply
and the plaintext variable is deleted; pre-existing user environment variables
(e.g. `OMNIROUTE_API_KEY`) are left untouched and reused as references. A
Credentials card on the Routes page lists app-managed credentials (names and
usage only) with delete blocked while any route references them.

## Implementation and schema locations

- Shared routing core: `app/engine/claude-code/claude-routing-core.psm1`
  (adapter implementation version 0.3.0).
- Fixture entry point: `app/engine/claude-code/build-claude-code.ps1`.
- Production entry point: `app/engine/claude-code/build-claude-code-production.ps1`.
- Routing schema: `app/engine/schemas/claude-code-routing.schema.json`.
- App-owned runtime state (Git-ignored): `app/state/claude-routes.json`,
  `app/state/claude-backup-manifest.json`, `app/state/claude-activity.jsonl`.
- Adapter backend: `app/app/claude_adapter.py`; capabilities:
  `app/app/capabilities.py`.

## Evidence gates reached and not reached

- Gate 1 (read-only research): reached - `planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md`.
- Gate 2 (fixture-only builder): reached - 65/65 harness (51 prior + 14
  env-only surgical tests), `planning/claude-code/CLAUDE_CODE_GATE_2_FIXTURE_BUILDER_REPORT.md`.
- Gate 3 (provider/model behavior): reached - overall pass,
  `planning/claude-code/CLAUDE_CODE_GATE_3_PROVIDER_MODEL_REPORT.md`.
- Gate 4A (app integration and production-path logic): reached -
  `planning/claude-code/CLAUDE_CODE_GATE_4A_IMPLEMENTATION_REPORT.md` and its three repair
  rounds.
- Gate 4 (integration documentation): this document set and
  `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`.
- Gate 5 (approved live validation): REACHED (2026-08-17, corrected env-only
  contract). Session 46 proved every transaction mechanic; session 48 secured
  the routing evidence (fixed marker `GATE5B_ROUTE_OK` returned, applied model
  verified from structured metadata) - see
  `planning/claude-code/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_PASS_REPORT.md` and
  `planning/claude-code/CLAUDE_CODE_GATE_5C_DOCUMENTATION_RELEASE_SYNC_REPORT.md`. The
  historical Gate 5B.4 `HARD_FAILURE` report remains valid context under the
  superseded broad ownership contract and does not justify restoring or
  deleting Claude-owned state; the corrected env-only scope is documented in
  `planning/claude-code/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md`.

## Governing decisions

- Historical drop decision (2026-08-08): Claude Code was excluded from the
  universal OpenCode/Kilo architecture; that decision remains historical and is
  not rewritten.
- Narrow reversal (2026-08-14): a unique bounded routing adapter is approved;
  see `planning/DECISIONS.md`.
- Approved documentation architecture:
  `planning/UNIQUE_AGENT_ADAPTER_DOCUMENTATION_DESIGN.md`.
- Authoritative Claude research plan:
  `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`.

## Warning

The adapter is **Live validated** only for the corrected env-only routing
scope and the loopback gateway exercised by the gate. Fixture, integration,
and production-path evidence must never be interpreted as a broader support
claim: Claude-owned state outside `settings.json`'s managed `env` fields
remains entirely outside BDF access, and the real-target lock remains a
deliberate owner control over when live applies may run.

---

## Documentation network

- [Main README](../../README.md) — product overview, install, demos
- [App guide](../../app/README.md) — using the Routes page and credentials UI
- [Framework](../../bdf/README.md) — BDF process, adapter categories, templates
- [Contributing](../../CONTRIBUTING.md) · [Security](../../SECURITY.md) · [Code of conduct](../../CODE_OF_CONDUCT.md)

## Document versions

| Document | Version |
|---|---|
| README.md | 1.1 |
| ADAPTER.md | 1.1 |
| BUILDER_SPEC.md | 1.1 |
| TESTING.md | 1.1 |
| COMPATIBILITY.md | 1.1 |

---

**Document Version:** 1.1

**Status:** Live validated
