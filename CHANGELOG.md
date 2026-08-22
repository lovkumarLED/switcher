# CHANGELOG

> Chronological history of the OpenCode Configuration Manager.

---

# Purpose

This document records the history of significant project changes.

Only completed work should appear in this document.

Future plans belong exclusively in:

```
ROADMAP.md
```

The changelog should provide enough information for a developer to understand how the project evolved over time.

---

# Versioning Policy

The project follows a simple versioning strategy.

Major Version

Large architectural changes.

Minor Version

New functionality.

Patch Version

Bug fixes and documentation improvements.

Example

```
1.0.0

1.1.0

1.1.1
```

---

<!-- AUTO-GENERATED START -->

# Version 2.5.3

## Status

Current

---

## Date

```
2026-08-17
```

---

## Summary

LSP support for OpenCode + KiloCode in BOTH the BDF engine and the Switcher app (Claude Code untouched). New profiles/<profile>/lsp.json source { "lsp": <bool or object>, "enabled": <bool> } seeded by the scaffold in EVERY profile (coding + experimental + minimal, disabled by default, user-owned after creation - Seed-IfMissing, never overwritten). Both builders (OpenCode V2.7 + Kilo K1) merge LSP: interactive "LSP servers: [1] enabled [2] disabled (Enter keeps current)" prompt (skipped under -NonInteractive, stored enabled used), backup-first persist, -WhatIf never writes, verification throws if an enabled LSP is missing from the output, diff summary adds/removes "LSP servers", Doctor reports it via the generic sources walk. New lsp.schema.json (Draft-07) pre-flight dependency. App: GET/PUT /api/lsp router + Integrations page LSP block between Plugins and MCP (on/off toggle persisted via PUT, server-name chips, "Edit JSON" expert dialog). Toggle OFF emits "lsp": false in the generated config (was: key removed). Harnesses: opencode 40/40, kilo 37/37 (5 new LSP tests each); full Python 217 (2 accepted preference baselines), full frontend 133 (1 accepted onboarding-copy baseline).

---

## Highlights

- Engine: lsp.json in every profile (disabled by default), seeded like mcp.json/plugins.json (Seed-IfMissing, never overwritten)
- Builders: Merge-Lsp - enabled -> generated config carries "lsp": <value> (true or object); disabled -> "lsp": false; no lsp.json -> no lsp key
- lsp.schema.json (Draft-07) next to mcp.schema.json/plugins.schema.json: lsp (boolean or object) + enabled (boolean), both required
- App: new app/lsp.py GET/PUT /api/lsp (400 on invalid shape); Integrations page LSP servers block between Plugins and MCP
- Per-agent + toggle-aware copy: "kilo.json will carry..." / "opencode.json will carry..." / "LSP is off - <config> will carry lsp: false"

---

## New Features

- app/engine/schemas/lsp.schema.json, app/app/lsp.py, app/tests/test_lsp.py
- Integrations page LSP servers block with on/off toggle (persists immediately via PUT) + server-name chips + "Edit JSON" expert dialog
- Builder interactive prompt for the LSP toggle; -NonInteractive and the app use the stored enabled

---

## Improvements

- Backup-first persist of the LSP toggle; -WhatIf never writes
- 5 new harness tests each (enabled true / object round-trip / disabled / no-file / false value): opencode 40/40, kilo 37/37
- Existing profiles backfilled with lsp.json enabled:false on disk; new scaffolds seed it automatically

---

## Bug Fixes

- LSP toggle OFF now emits "lsp": false (was: key removed entirely from the generated config)
- LSP card copy named the wrong config file (hardcoded "opencode.json" -> per-agent kilo.json/opencode.json)
- LSP card status line now reflects the toggle (OFF -> "LSP is off - <config> will carry lsp: false")

---

## Breaking Changes

None

---

## Migration Required

No (existing profiles were backfilled with lsp.json enabled:false on disk; new scaffolds seed it)

---

## Testing Summary

Gate 2 65/65, Gate 3 OVERALL PASS (Claude untouched); opencode harness 40/40, kilo harness 37/37; full Python 217 (2 accepted preference baselines); full frontend 133 (1 accepted onboarding-copy baseline); git diff --check 0; live toggle ON->build->lsp:true, OFF->build->lsp:false on both agents, all snapshot files restored byte-equal; Gate 5B corrected live validation PASS 2026-08-17 (apply + /status + routing marker + byte-verified restore + relock verified)

---

## Known Issues

Accepted unrelated baselines unchanged (2 preference, 1 onboarding-copy). Gate 5B corrected live validation PASSED 2026-08-17 (sessions 46 + 48): transaction mechanics + routing evidence (fixed marker GATE5B_ROUTE_OK returned, applied model verified from structured metadata) - see planning/claude-code/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_PASS_REPORT.md; Gate 5C documentation/release sync completed (planning/claude-code/CLAUDE_CODE_GATE_5C_DOCUMENTATION_RELEASE_SYNC_REPORT.md). Claude adapter lifecycle is now Live validated; the real-target lock is OPEN (owner decision, session 48) so apply/restore work from the UI. Model-roles feature added (opus/sonnet/haiku/fable + picker allowlist) with two fixes (credential reload after server restart, dangling-comma on trailing-run removals) - see planning/designs/2026-08-17-claude-model-roles-design.md.

---

## Documentation

Updated

- README.md
- app/README.md
- app/BUGFIXES.md
- BUILDER_SPEC.md
- FOLDER_STRUCTURE.md
- JSON_SCHEMAS.md
- PROFILE_CREATION_GUIDE.md
- ARCHITECTURE.md
- ADAPTER.md
- DEVELOPER_GUIDE.md
- TESTING.md
- PROJECT_STATE.md
- CHANGELOG.md
- ROADMAP.md
- bdf/FRAMEWORK.md
- bdf/PROJECT_GENERATOR.md
- bdf/templates/README.md
- bdf/templates/BUILDER_SPEC.template.md
- bdf/templates/FOLDER_STRUCTURE.template.md
- bdf/templates/JSON_SCHEMAS.template.md
- bdf/templates/PROFILE_CREATION_GUIDE.template.md
- bdf/templates/DEVELOPER_GUIDE.template.md
- bdf/templates/ADAPTER.template.md
- bdf/templates/README.template.md
- bdf/templates/ARCHITECTURE.template.md
- release_registry.json
- _agent/JOURNEY_TO_V3.md
- _agent/SESSION_LOG.md
- adapters/claude-code/README.md
- adapters/claude-code/ADAPTER.md
- adapters/claude-code/BUILDER_SPEC.md
- adapters/claude-code/COMPATIBILITY.md
- adapters/claude-code/TESTING.md
- planning/claude-code/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_PASS_REPORT.md
- planning/claude-code/CLAUDE_CODE_GATE_5C_DOCUMENTATION_RELEASE_SYNC_REPORT.md
- planning/claude-code/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md
- planning/claude-code/CLAUDE_CODE_CREDENTIAL_UX_APP_MANAGED_ENV_VARS.md
- planning/designs/2026-08-17-claude-model-roles-design.md
- planning/designs/2026-08-17-claude-credential-store-design.md
- app/app/claude_credentials.py
- app/app/claude_envvars.py
- app/app/claude_adapter.py
- app/engine/claude-code/claude-routing-core.psm1
- app/engine/schemas/claude-code-routing.schema.json
- app/assets/js/pages/claude-routes.js
- app/assets/js/core/api.js
- app/tests/test_claude_credentials.py
- app/BUGFIXES.md
- planning/claude-code/CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md

---

# Version 2.5.2

## Status

Previous

---

## Date

```
2026-08-12
```

---

## Summary

Full-system health check + security hardening + per-model reasoning formats + profile switcher. The Switcher app was tested end-to-end on a temp clone agent (onboarding, overview, providers wizard, activity tracking with 49 real proxy calls, integrations, settings, builders). Security review found and fixed 6 issues: SSRF-via-redirect in /api/test, SSRF userinfo injection in the proxy path, profile-switch path traversal, unvalidated agent name reaching the scaffold script, a storage.py lock deadlock, and a wrong agent-label display. Builders now preserve per-model reasoning formats (the reasoning-format filter accepts levels valid in ANY format, so gemini models keep thinkingConfig inside an opencode provider). The app supports per-model reasoning format on save, model overwrite-by-ID, model deletion, and an active-profile switcher persisted in state.json. 79 app unit tests, 75 frontend contract tests, kilo + opencode harnesses all green. The project is now MIT licensed (LICENSE file + README section).

---

## Highlights

- Security: /api/test now blocks redirects and non-http(s) schemes; proxy path regex blocks userinfo/percent/space injection; /api/profiles/switch only accepts listed profiles; scaffold validates the agent name before running the PS1; storage.py set_state made atomic under one lock (fixed a deadlock that hung the app)
- Builders: Apply-ReasoningFormatFilter now drops only levels invalid in EVERY format, so per-model formats survive the merge (gemini models keep thinkingConfig budgets inside an opencode provider)
- App: Settings has a per-model reasoning panel (change format + levels without re-adding the model), Add-models sends per-row reasoning format, model IDs overwrite in place, Delete-model endpoint (POST with body, slash-safe), active-profile switcher (GET/POST /api/profiles)
- Profile JSONs confirmed as the single source of truth: providers -> providers/, models -> profiles/<profile>/<provider>-models.json, MCP/plugins -> profile JSONs; the agent main JSON is generated output only
- Temp clone agent testing verified every page/button with zero console errors; real kilo config untouched and restored byte-identical
- Repo cleanup: removed junk folders (AI/image, .tmp_sidebar_video, .playwright-mcp, app/.playwright-cli, app/output, nested docs/superpowers) and 10 stale CONTINUE_* session handoffs; build-kilo.ps1 synced to the v1 builder
- MIT License added - the project is officially open source under permissive terms with attribution required

---

## New Features

- Per-model reasoning format editing in Settings (change format + reasoning choices for the selected model, save overwrites in place)
- Delete model button in Settings
- Active profile switcher (coding/experimental/minimal for kilo; + default for opencode) persisted in state.json

---

## Improvements

- Model adds overwrite by model ID (no more 'already configured' rejection)
- Provider page shows the real agent name for custom agents
- Reasoning level shapes are regenerated per chosen format (no leftover thinkingConfig on opencode models)

---

## Bug Fixes

- SSRF-via-redirect in /api/test (Authorization header could be re-pointed at an attacker host)
- Proxy URL userinfo injection (base_url + '/models@evil.com' could reach an arbitrary host)
- Profile switch accepted arbitrary directories (path traversal into any folder on disk)
- Scaffold ran the PowerShell script before validating the agent name
- storage.py deadlock (double-acquire of a non-reentrant lock) hung every test run
- build-kilo.ps1 stale copy did not match build-kilo-v1.ps1
- Provider endpoint (base URL) missing on Overview relay cards: UTF-8 BOM in provider files made JSON reads fail (empty baseUrl); all app JSON reads hardened to utf-8-sig, endpoints restored on kilo + opencode tokenrouter double-slash fixed

---

## Breaking Changes

None

---

## Migration Required

No

---

## Testing Summary

kilo harness 31/31, opencode harness 31/31, -WhatIf dry-run green, 79 app unit tests, 75 frontend contract tests (1 pre-existing onboarding-discovery fail + 1 gui.html cache-param fail, unrelated)

---

## Known Issues

The onboarding gate always shows on a fresh page load (no 'already set up' skip). Pre-existing frontend test failures: onboarding agent screen needs live discovery (node-only test), gui.html main.js has cache-busting ?v= params that the test_serve assertion doesn't expect.

---

## Documentation

Updated

- README.md
- app/README.md
- app/rule.md
- PROVIDER_DEVELOPMENT_GUIDE.md
- CHANGELOG.md
- PROJECT_STATE.md
- CURRENT_RELEASE.md
- release_registry.json
- ROADMAP.md
- bdf/VERSION.md
- _agent/JOURNEY_TO_V3.md
- _agent/SESSION_LOG.md
- LICENSE

---

# Version 2.5.1

## Status

Previous

---

## Date

```
2026-08-08
```

---

## Summary

Real-provider compatibility: the app and the builders now write the API key in both places agents read it (provider.<id>.apiKey for OpenCode, provider.<id>.options.apiKey for Kilo), fixing the TokenRouter 401 in Kilo. The Switcher gains real-provider presets (TokenRouter, Modal, OpenAI, Google Gemini, OpenRouter, NVIDIA NIM) with SDK auto-fill. Builders mirror the dual key automatically at merge time, so builder-only users get the same result as app users. Reasoning formats: per-provider reasoning levels (opencode / openai / claude / gemini / none) with correct variant JSON per format (reasoningEffort, thinking.budgetTokens, thinkingConfig.thinkingBudget); interactive builder runs ask the developer, persist the choice backup-first, and filter invalid levels from the generated config. 56 app unit tests, kilo harness 31/31, opencode harness 33/33.

---

## Highlights

- Dual key placement in app/app/agentstore.py write_provider (top-level apiKey + options.apiKey), options preserved on write
- Builder merge-stage dual-key normalization (K1 + V2.7 builders) ΓÇö fixes hand-written provider files on the next build; kilo harness grows a dedicated test (31/31)
- Real-provider presets in the Add-provider form (URL + SDK auto-filled), presets kept in sync in app/app/config.py
- Kilo harness fixtures updated to per-provider models (the global models.json lookup was removed earlier; the fixtures still used it)
- Stale exact-name harness copy (test-kilo.ps1) replaced with the real K1 harness (backed up)
- User rules documented: never hand-edit the generated main config, never create opencode.jsonc next to opencode.json (it shadows the built config); generating both formats planned for a future update

---

## New Features

- Add-provider presets: TokenRouter, Modal, OpenAI, Google (Gemini), OpenRouter, NVIDIA NIM (SDK auto-fill on preset pick)
- Builder dual-key normalization with a "Dual-key: options.apiKey mirrored" build-log line
- Reasoning formats per provider (opencode/openai/claude/gemini/none) with per-format variant JSON (reasoningEffort, thinking.budgetTokens, thinkingConfig.thinkingBudget); GET /api/formats; Reasoning format dropdown in provider modal + Models card; interactive builder prompt for developers (persist backup-first + filter invalid levels from output)

---

## Improvements

- OpenCode and Kilo both work from one provider file (no more "works in OpenCode, 401 in Kilo")
- Builder-only workflow produces identical output to the app workflow

---

## Bug Fixes

- Kilo 401 "Token not provided": key now lands in options.apiKey for runtime reading
- OpenCode /models not showing a provider: a stray opencode.jsonc (with disabled_providers) was shadowing the built opencode.json
- Kilo harness: 10 tests used the removed global-models fixture and failed after the model guard change ΓÇö fixtures now use per-provider models
- PS 5.1: Add-Member required when creating a missing options object on parsed JSON

---

## Breaking Changes

None

---

## Migration Required

No

---

## Testing Summary

17/17 (V2.1) + 13/13 (V2.5) + 33/33 (V2.7) + 31/31 (Kilo K1) tests passed, exit code 0; 56 app unit tests

---

## Known Issues

None

---

## Documentation

Updated

- README.md
- app/README.md
- app/rule.md
- PROVIDER_DEVELOPMENT_GUIDE.md
- CHANGELOG.md
- PROJECT_STATE.md
- CURRENT_RELEASE.md
- release_registry.json
- ROADMAP.md
- bdf/VERSION.md
- _agent/JOURNEY_TO_V3.md

---

# Version 2.5.0

## Status

Previous

---

## Date

```
2026-08-06
```

---

## Summary

Builder V2.7 JSON Schema Validation: config sources validated against schemas/*.schema.json before builder validation (F1), pre-flight dependency check (F2), -WhatIf dry run (F3), backup retention (F4), provenance sidecar (F5), -Doctor diagnostics (F6), merge diff summary (F7), 9-stage pipeline. P2 dynamic target artifact (profiles/<profile>/target.json) + P1 env-key policy.

---

## Highlights

- F1 JSON Schema validation (seven live schemas under schemas/)
- F2 pre-flight dependency check catches missing provider files before any merge
- F3 -WhatIf dry run (validate + merge, write nothing)
- F4 backup retention via -KeepBackups (default 10), artifact-prefix aware
- F5 provenance sidecar opencode.provenance.json
- F6 -Doctor read-only diagnostics (exit 0 clean / 1 issues)
- F7 merge diff summary vs previous backup
- P2 dynamic target artifact: optional profiles/<profile>/target.json -> {artifact} drives output, backup prefix, provenance, WhatIf; default opencode.json
- P1 env-key policy: builder never carries/restores/invents API keys; providers carry {env:VAR} placeholders only
- 31-test V2.7 harness in addition to 17/17 (V2.1) + 13/13 (V2.5)

---

## New Features

- scripts/build-opencode-v2.7.ps1
- scripts/test-opencode-v2.7.ps1 (31 tests)
- schemas/schema.json, settings.schema.json, provider.schema.json, models.schema.json, plugins.schema.json, mcp.schema.json, targets.schema.json
- -SchemaDir, -WhatIf, -KeepBackups, -Doctor, -ProvenancePath CLI flags
- profiles/<profile>/target.json (P2 dynamic artifact)

---

## Improvements

- Schema validation powers an entry gate before any merge
- Backups pruned to the newest N per prefix
- Provenance stamping without touching opencode.json
- Real-world build reproducibility (identical output + silent diff on rerun)

---

## Bug Fixes

- F7 diff summary correctly enumerates IDictionary backup properties (OrderedDictionary)
- Doctor no longer faults on missing settings file path
- Empty active-provider lists no longer produce a phantom '' provider reference

---

## Breaking Changes

None

---

## Migration Required

No

---

## Testing Summary

17/17 (V2.1) + 13/13 (V2.5) + 31/31 (V2.7) tests passed, exit code 0

---

## Known Issues

None

---

## Documentation

Updated

- BUILDER_SPEC.md
- JSON_SCHEMAS.md
- TESTING.md
- ARCHITECTURE.md
- FOLDER_STRUCTURE.md
- ADAPTER.md
- README.md
- bdf/TESTING.md
- bdf/VERSION.md
- schemas/README.md
- release_registry.json

---

# Version 2.4.0

## Status

Previous

---

## Date

```
2026-08-05
```

---

## Summary

Builder V2.5 Active-Provider Selector: discovers all providers, interactive active-provider selection persisted to settings.json, profile-level <provider>-models.json with highest precedence.

---

## Highlights

- All-provider discovery (providers/*.json)
- Interactive active-provider selection persisted to profile settings.json
- Profile-level per-provider model files (<provider>-models.json)
- -Provider / -NonInteractive CLI switches
- Active providers without a models source are dropped (with a warning) instead of failing the build
- 13-test V2.5 harness + builder-regeneration guarantee in docs

---

## New Features

- scripts/build-opencode-v2.5.ps1
- scripts/test-opencode-v2.5.ps1
- profiles/<profile>/<provider>-models.json

---

## Improvements

- Model precedence: profile <provider>-models.json > providers/<p>/models.json > inline > global
- settings.json backed up before activeProviders write

---

## Bug Fixes

- settings.json no longer rewritten when the active-provider list is unchanged (no-op runs keep the file byte-identical)

---

## Breaking Changes

None

---

## Migration Required

No

---

## Testing Summary

17/17 (V2.1) + 13/13 (V2.5) tests passed, exit code 0

---

## Known Issues

None

---

## Documentation

Updated

- BUILDER_SPEC.md
- JSON_SCHEMAS.md
- FOLDER_STRUCTURE.md
- ADAPTER.md
- ARCHITECTURE.md
- TESTING.md
- README.md
- PROJECT_STATE.md
- CHANGELOG.md
- CURRENT_RELEASE.md
- bdf/VERSION.md
- _agent/JOURNEY_TO_V3.md

---

# Version 2.3.0

## Status

Previous

---

## Date

```
2026-08-04
```

---

## Summary

BDF V2.5 framework generalization: generalized the framework for reuse across OpenCode, Claude Code, and KiloCode targets.

---

## Highlights

- Framework generalization (first step to BDF V3)
- Single source of truth for adapter fields
- Testable adapter validation checklist
- Impact Analysis record for the Blueprint Engine
- Generic release process documented (RELEASE_MANAGER.md)
- Generic test-harness pattern documented (TESTING.md)

---

## New Features

- bdf/NEW_PROJECT_GUIDE.md - the onboarding process for starting a new project with the framework
- bdf/RELEASE_MANAGER.md - the generic release process document (registry, generator, generated documents)
- bdf/TESTING.md - the generic test-harness pattern document
- Adapter field table now lives only in templates/ADAPTER.template.md (single source of truth)
- Adapter validation checklist (executable yes/no criteria) in PROJECT_ADAPTER.md
- Impact Analysis record required output of the Blueprint Engine Impact Analysis stage

---

## Improvements

- Framework boundaries audited: OpenCode-specific file names removed from bdf/ (Layer 1 no longer depends on Layer 2)
- templates/README.md: placeholder audit ({{PLACEHOLDER_NAME}} row added), cross-reference matrix, provider placeholders confirmed generic, template sync rule stated
- FRAMEWORK.md and bdf/README.md register the three new framework documents
- Reference ADAPTER.md passes the new adapter validation checklist
- docs/TESTING.md aligned with bdf/TESTING.md (test groups + definition of complete)

---

## Bug Fixes

- Removed OpenCode-specific file names from bdf/MIGRATION.md and bdf/PROJECT_ADAPTER.md examples
- Generalized a Layer 2 description in bdf/MIGRATION.md from OpenCode-specific to project-specific

---

## Breaking Changes

None

---

## Migration Required

No

---

## Testing Summary

17/17 tests passed, exit code 0

---

## Known Issues

None

---

## Documentation

Updated

- bdf/NEW_PROJECT_GUIDE.md (new)
- bdf/RELEASE_MANAGER.md (new)
- bdf/TESTING.md (new)
- bdf/FRAMEWORK.md
- bdf/PROJECT_ADAPTER.md
- bdf/AI_WORKFLOW.md
- bdf/PROJECT_GENERATOR.md
- bdf/BLUEPRINT_ENGINE.md
- bdf/MIGRATION.md
- bdf/README.md
- bdf/VERSION.md
- bdf/templates/README.md
- bdf/templates/ADAPTER.template.md
- ADAPTER.md
- PROJECT_STATE.md
- ROADMAP.md
- TESTING.md
- CHANGELOG.md
- CURRENT_RELEASE.md
- _agent/JOURNEY_TO_V3.md

---

# Version 2.2.0

## Status

Previous

---

## Date

```
2026-08-04
```

---

## Summary

Builder V2.1: extended validation, modular merge pipeline, provider-specific models, output verification, and automated testing.

---

## Highlights

- Provider-specific models
- Modular merge pipeline
- Extended validation
- Pre-write output verification
- Automated test harness

---

## New Features

- scripts/test-opencode-v2.ps1 - automated test harness (17 tests: 9 builder + 8 Release Docs)
- Provider-specific models: providers/<provider>/models.json takes precedence over inline provider models and global models.json
- -ConfigRoot parameter on the builder for isolated test builds
- Output verification stage (JSON round-trip, providers, models, plugins, MCP) before writing

---

## Improvements

- Validation extended: duplicate provider/model/plugin/MCP identifiers, duplicate model names, malformed provider and profile definitions, missing required fields, invalid configuration structure
- Duplicate-key detection scans raw JSON text (PowerShell 5.1 ConvertFrom-Json silently drops duplicates)
- Merge logic split into independent stages: settings, providers, models, plugins, MCP, final
- Concise count-based logging (e.g. Provider 'omniroute': 58 model(s))

---

## Bug Fixes

- Fixed $Section: here-string parse errors
- Fixed unreliable PSObject.Properties.Count checks (wrapped with @())
- Fixed plugin single-element array unrolling in output (return ,$Plugins.plugin)
- Removed 2 corrupted backups created during intermediate buggy runs

---

## Breaking Changes

None

---

## Migration Required

No

---

## Testing Summary

17/17 tests passed, exit code 0

---

## Known Issues

None

---

## Documentation

Updated

- BUILDER_SPEC.md
- CHANGELOG.md
- PROJECT_STATE.md
- TESTING.md
- ROADMAP.md
- FOLDER_STRUCTURE.md
- ARCHITECTURE.md
- ADAPTER.md
- README.md
- bdf/VERSION.md
<!-- AUTO-GENERATED END -->

# Version 2.1.0

## Status

Previous

## Date

```
2026-08-03
```

## Summary

Documentation architecture: adopted the Builder Development Framework (BDF) upgrade.

---

## Added

- `bdf/BLUEPRINT_ENGINE.md` — the intelligence layer and change pipeline.
- `bdf/PROJECT_ADAPTER.md` — the project adapter concept.
- `bdf/BUILDER_EVOLUTION.md` — predictable builder evolution workflow.
- `bdf/FRAMEWORK_LIFECYCLE.md` — master lifecycle reference.
- `bdf/AI_WORKFLOW.md` — the master AI agent workflow.
- `bdf/templates/ADAPTER.template.md` — project adapter template.
- `ADAPTER.md` — the OpenCode project adapter (first implementation).

---

## Changed

- Framework renamed from Blueprint Framework to Builder Development Framework (BDF).
- Framework folder renamed from `blueprint/` to `bdf/`.
- `AGENT.md` read order now includes `ADAPTER.md`.
- `README.md`, `AGENT.md`, and `FOLDER_STRUCTURE.md` updated to reference `bdf/`.
- Framework version bumped to 2.0.0 (breaking change, migration in `bdf/MIGRATION.md`).

---

## Documentation

Updated

- README.md
- AGENT.md
- FOLDER_STRUCTURE.md
- CHANGELOG.md
- PROJECT_STATE.md
- bdf/README.md
- bdf/FRAMEWORK.md
- bdf/VERSION.md
- bdf/MIGRATION.md
- bdf/PROJECT_GENERATOR.md
- bdf/LESSONS_LEARNED.md
- bdf/templates/README.md
- bdf/templates/PROJECT_STATE.template.md

---

## Breaking Changes

None

---

# Version 2.0.3

## Status

Previous

## Date

```
2026-08-03
```

## Summary

Documentation infrastructure: added the project state system.

---

## Added

- `PROJECT_STATE.md` with the 15-section living state snapshot.
- `blueprint/templates/PROJECT_STATE.template.md` generic template.
- Project state section in AGENT.md.
- Project state regeneration rules.

---

## Changed

- AGENT.md now requires `PROJECT_STATE.md` regeneration after every major refactor.
- AGENT.md read order now includes `PROJECT_STATE.md`.
- `_agent/SESSION_WORKFLOW.md` now reads `PROJECT_STATE.md` at session start and regenerates it at session end after a major refactor.

---

## Documentation

Updated

- AGENT.md
- README.md
- FOLDER_STRUCTURE.md
- ROADMAP.md
- CHANGELOG.md
- _agent/SESSION_WORKFLOW.md
- blueprint/VERSION.md
- blueprint/templates/README.md

---

## Breaking Changes

None

---

# Version 2.0.2

## Status

Previous

## Date

```
2026-08-03
```

## Summary

Documentation infrastructure: added the session continuity system.

---

## Added

- `_agent/SESSION_WORKFLOW.md` with session start, end, and log rules.
- `_agent/SESSION_LOG.md` with the session history.
- Session continuity section in AGENT.md.

---

## Changed

- AGENT.md now guides agents to read session files at session start and write them at session end.

---

## Documentation

Updated

- AGENT.md
- FOLDER_STRUCTURE.md
- CHANGELOG.md

---

## Breaking Changes

None

---

# Version 2.0.1

## Status

Previous

## Date

```
2026-08-03
```

## Summary

Documentation architecture: added the reusable Blueprint Framework.

---

## Added

- `blueprint/` folder containing the reusable engineering process.
- Blueprint documentation templates.
- Blueprint versioning.
- Project generation workflow.
- Migration guide.
- Reusable lessons document.

---

## Changed

- README.md now describes the two-layer documentation architecture.
- AGENT.md points to the Blueprint Framework for generic engineering knowledge.
- FOLDER_STRUCTURE.md documents the `blueprint/` and `AI/` folders.

---

## Documentation

Updated

- README.md
- AGENT.md
- FOLDER_STRUCTURE.md
- CHANGELOG.md

---

## Breaking Changes

None

---

# Version 2.0.0

## Status

Previous

## Date

```
2026-08-03
```

## Summary

Builder V2 implementation.

---

## Added

- Dynamic profile selection.
- Dynamic provider loading.
- Optional profile sections.
- Improved validation.
- Better console output.
- Improved error reporting.

---

## Changed

- The current builder is now `build-opencode-v2.ps1`.
- The previous builder is retained as a legacy script.
- Models are injected into every active provider.
- Optional profile sections are merged only when present.

---

## Documentation

Updated

- BUILDER_SPEC.md
- ARCHITECTURE.md
- FOLDER_STRUCTURE.md
- TESTING.md
- ROADMAP.md
- CHANGELOG.md

---

## Breaking Changes

None

---

# Version 1.0.0

## Status

Legacy

## Summary

Initial implementation of the OpenCode Configuration Manager.

---

## Added

- Modular project structure.
- Provider configuration.
- Profile configuration.
- Builder implementation.
- Backup system.
- Documentation framework.

---

## Documentation

Created

- README.md
- ARCHITECTURE.md
- FOLDER_STRUCTURE.md
- JSON_SCHEMAS.md
- BUILDER_SPEC.md
- DESIGN_PRINCIPLES.md
- CONTRIBUTING_FOR_AI.md
- TESTING.md
- TROUBLESHOOTING.md
- CHANGELOG.md

---

## Architecture

Implemented

- Source configuration.
- Generated configuration.
- Configuration builder.
- Provider abstraction.
- Profile abstraction.

---

## Builder

Implemented

- Configuration loading.
- Validation.
- Configuration merging.
- Backup creation.
- Configuration generation.

---

## Testing

Implemented

- Manual testing guide.
- Verification procedures.
- Regression testing procedures.

---

## Known Limitations

Current implementation supports:

- One provider.
- One active profile.
- Manual testing.

Future enhancements will be tracked separately in

```
ROADMAP.md
```

---

# Version History

| Version | Status | Description |
|----------|--------|-------------|
| 2.5.1 | Current | Real-provider compatibility: dual-key placement (apiKey + options.apiKey), real-provider presets, builder dual-key normalization |
| 2.4.0 | Previous | Builder V2.5 Active-Provider Selector |
| 2.3.0 | Previous | BDF V2.5 framework generalization |
| 2.2.0 | Previous | Builder V2.1 (validation, merge pipeline, provider-specific models, verification, automated tests) |
| 2.1.0 | Previous | Builder Development Framework adoption |
| 2.0.3 | Previous | Project state system |
| 2.0.2 | Previous | Session continuity system |
| 2.0.1 | Previous | Blueprint Framework documentation architecture |
| 2.0.0 | Previous | Builder V2 implementation |
| 1.0.0 | Legacy | Initial project implementation |

---

# Recording Future Changes

Every new version should include:

- Version number
- Date
- Summary
- Added
- Changed
- Fixed
- Removed
- Documentation updates
- Breaking changes (if any)

---

# Example

## Version 1.1.0

Date

```
YYYY-MM-DD
```

### Added

- New feature

### Changed

- Existing behavior

### Fixed

- Bug fixes

### Removed

- Removed functionality

### Documentation

- Updated documentation

### Breaking Changes

None

---

# Guidelines

Do not record:

- Planned features.
- Experimental work.
- Incomplete implementations.

Only completed and verified changes should appear in this document.

---

**Document Version:** 1.0

**Status:** Active Changelog
