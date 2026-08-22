# Claude Code Settings-Only Scope Correction Design

Status: **Approved design, implemented and live validated**
Approved by user: 2026-08-14  
Lifecycle: **Live validated**

> **LIVE VALIDATED (2026-08-17, session 48, owner-approved):** the corrected
> Gate 5B live validation PASSED against the real user-scope
> `.claude/settings.json` (mechanics proven in session 46, routing evidence
> secured in session 48: the fixed marker `GATE5B_ROUTE_OK` was returned and
> the applied route's model verified from structured response metadata;
> see `planning/claude-code/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_PASS_REPORT.md`)
> and Gate 5C documentation/release synchronization was approved and completed
> (`planning/claude-code/CLAUDE_CODE_GATE_5C_DOCUMENTATION_RELEASE_SYNC_REPORT.md`). The
> design's completion sequence (§13) steps 3-4 are satisfied; the real-target
> lock stays closed until the owner opens it.

> **SUPERSEDED IN PART (2026-08-16, session 43, owner directive):** Section 2's
> "Claude-owned state — BDF must never read … user `.claude.json`" is narrowed
> for one read-only purpose. Per the owner, the app ALWAYS scans the
> user-scope `.claude.json` file to inventory MCP servers (names, scopes,
> types) and installed plugins (names). It never edits, copies, hashes,
> snapshots, or restores that file, and never surfaces secrets from it. See
> `planning/claude-code/CLAUDE_CODE_README_SCAN_AND_UI_POLISH_DESIGN.md`. All mutation
> prohibitions in this document are unchanged.

## 1. Purpose

Correct the Claude Code adapter so BDF performs one narrow job: switch the
selected Claude routing endpoint, authentication strategy, model, and four
explicitly selected compatibility options by surgically patching only the
top-level `env` object in the supported user-scope `.claude/settings.json`
file.

BDF is not a Claude installation manager, plugin manager, MCP manager, session
manager, or general Claude state manager.

## 2. Ownership boundary

### BDF-managed target

Only the user-scope `.claude/settings.json` file is a BDF mutation target.

Within that file's top-level `env` object, BDF manages exactly:

1. `env.ANTHROPIC_BASE_URL`.
2. Exactly one selected auth field:
   - `env.ANTHROPIC_API_KEY`, or
   - `env.ANTHROPIC_AUTH_TOKEN`.
3. `env.ANTHROPIC_MODEL`.
4. `env.CLAUDE_CODE_AUTO_COMPACT_WINDOW` (optional: absent when the route does
   not configure it).
5. `env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`.
6. `env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`.
7. `env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`.

**Extended (2026-08-17, session 48, owner-approved - model roles):** BDF also
manages the four role aliases `env.ANTHROPIC_DEFAULT_OPUS_MODEL`,
`env.ANTHROPIC_DEFAULT_SONNET_MODEL`, `env.ANTHROPIC_DEFAULT_HAIKU_MODEL`,
`env.ANTHROPIC_DEFAULT_FABLE_MODEL` (set only when the route assigns that role,
removed otherwise), and the two top-level keys `availableModels` (the route's
model set) + `enforceAvailableModels` (true) whenever the route restricts the
`/model` picker. The surgical byte-preserving patch philosophy is unchanged;
see `planning/designs/2026-08-17-claude-model-roles-design.md`.

When applying one auth strategy, BDF removes only the opposite auth field. It
does not remove or alter any other environment entry.

Top-level `model` is never changed. Every other root key, environment key,
value, type, array order, and nested structure in `settings.json` is
unsupported-but-preserved state.

The builder must not deserialize and regenerate the complete document. It must
preserve every byte outside the exact token ranges required to insert, replace,
or remove managed `env` properties.

### Claude-owned state

BDF must never read, parse, hash, enumerate, snapshot, compare, copy, restore,
generate, edit, delete, or use as an acceptance condition:

- user `.claude.json`;
- `.claude/plugins` or marketplace state;
- MCP configuration or credentials;
- project/local Claude settings;
- sessions, transcripts, prompts, memory, hooks, skills, agents, caches, logs,
  OAuth state, authentication databases, or IDE state;
- FCC executables or anything under `.local\bin`.

Claude Code may update its own state during normal execution. Those updates are
outside BDF ownership and neither pass nor fail BDF restoration.

## 3. Curated compatibility options

The app supports exactly four advanced options. It does not expose an arbitrary
environment-variable editor.

### Auto-compact window

- Variable: `CLAUDE_CODE_AUTO_COMPACT_WINDOW`.
- Value: plain decimal integer from 100000 through 1000000.
- Benefit: aligns proactive compaction with a gateway model's context limit.
- Constraint: takes precedence over `/autocompact`, CLI flags, and settings.
- App behavior: recommend a value only when the user/provider metadata supplies
  a context limit; otherwise display 190000 as an editable starting value, not
  a verified provider capability.

### Gateway model discovery

- Variable: `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`.
- Enabled value: string `1`; disabled means the key is absent.
- Benefit: populates `/model` from the gateway's `/v1/models` endpoint.
- Constraints: Claude Code 2.1.129 or later, Anthropic-compatible gateway, and
  a directly served non-redirecting `/v1/models` endpoint.
- Risk: may expose every model available to a shared gateway credential and
  causes Claude to maintain its own model-discovery cache.

### Disable experimental betas

- Variable: `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`.
- Enabled value: string `1`; disabled means the key is absent.
- Benefit: compatibility with gateways that reject Anthropic beta headers or
  associated request body fields.
- Tradeoff: disables MCP tool search and can force MCP tools to load upfront;
  it does not disable model-dependent adaptive reasoning.

### Disable nonessential traffic

- Variable: `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` (two `f` characters in
  `TRAFFIC`; the misspelled `TRAFIC` form is invalid).
- Enabled value: string `1`; disabled means the key is absent.
- Benefit: suppresses auto-updates, telemetry, error reporting, feedback,
  release notes, availability checks, discovery refreshes, and background runs
  of plugin command sources.
- Constraint: any non-empty value enables it. Never write `0` or `false`.
- Conflict: it disables gateway model discovery. The API, schema, UI, and
  builder reject routes that enable both options.

The app explains these benefits and tradeoffs and requires explicit user
confirmation. Recommendations never silently enable an option and never claim
the provider was tested.

## 4. Corrected saved-route model

Each saved route contains only:

- generated route ID;
- display name;
- base URL;
- auth kind: exactly `apiKey` or `authToken`;
- credential reference;
- model ID;
- gateway discovery Boolean;
- disable-experimental-betas Boolean;
- auto-compact-window integer;
- disable-nonessential-traffic Boolean;
- creation and update timestamps.

Route fingerprints include only base URL, auth kind, credential reference, and
model ID plus the four compatibility-option values. Display name, ID, and
timestamps remain outside the fingerprint.

Exactly zero or one route may be applied.

## 5. Existing app-state compatibility

The real Git-ignored version-1 route store already contains exactly the route
fields required by this design. Keep route-store version 1 and preserve the
existing route, IDs, timestamps, revision rules, activity, and null applied
state. No migration is required.

Changing the destination of the route's model from top-level `model` to
`env.ANTHROPIC_MODEL` changes only builder output semantics, not route-store
shape or fingerprint input.

## 6. Builder behavior

The fixture and production builders share one corrected core contract:

1. Validate the route schema, URL, auth-kind exclusivity, credential reference,
   non-empty model, compact-window bounds, Boolean option types, and the
   discovery/nonessential conflict.
2. Resolve the selected credential reference from process scope without
   printing it.
3. Decode strict UTF-8 while preserving BOM presence, line endings, indentation,
   trailing newline, and all original bytes.
4. Tokenize strict JSON with duplicate-key rejection and record byte spans for
   the top-level `env` object and its direct properties.
5. If `env` is absent, insert one top-level object property using the document's
   existing indentation and line-ending style without rewriting another
   property.
6. Replace only existing managed-value token spans.
7. Insert missing managed properties immediately before the `env` closing brace
   using matching indentation and comma style.
8. Remove only the opposite auth property and disabled optional properties,
   including only the comma/adjacent whitespace required to keep valid JSON.
9. Set `ANTHROPIC_BASE_URL`, selected auth value, and `ANTHROPIC_MODEL`.
10. Set compact window as a decimal string. Set enabled Boolean options as
    string `1`; remove their keys when disabled.
11. Reparse and verify managed values, auth exclusivity, option conflict, and
    strict JSON validity.
12. Verify every byte outside the precomputed managed edit ranges and required
    insertion/removal delimiters is unchanged.
13. Create the existing timestamped backup, atomically replace, and verify.
14. On failure, restore and verify the target backup byte-for-byte.

The builders must not probe or alter any other Claude file or directory.

## 7. App and UI behavior

The Claude route form contains only:

- route name;
- base URL;
- auth strategy;
- environment-variable credential reference name (`secretEnvRef`);
- model ID;
- four curated compatibility controls and their recommendation explanations.

This scope correction retains the existing environment-reference developer
workaround and does not add direct API-key/token input or a credential store.
The final normal-user flow remains specified by
`planning/claude-code/CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md` and is not part of this
scope-correction implementation.

When adding or editing a provider, the app asks:

1. whether the gateway exposes `/v1/models`;
2. whether it accepts Anthropic beta headers/body fields;
3. the model context-window size when known;
4. whether all nonessential traffic should be suppressed.

Known provider presets may supply versioned recommendation metadata. Custom
providers use the user's answers. The app does not probe a gateway merely to
make a recommendation.

The route details view shows endpoint, auth strategy/reference status, model,
the four selected option states, their tradeoffs, and applied/saved state.

## 8. Backup, restore, and concurrency

Retain the existing backup-first, atomic-replace, revision-token, manifest,
rollback, and restore architecture for `settings.json` and app-owned state.

Live-test snapshots include only:

- user `.claude/settings.json`;
- app-owned route store;
- app-owned backup manifest when present;
- app-owned activity log.

No other Claude path appears in snapshot logic or equality criteria.

Successful restore requires byte equality for `settings.json` and the intended
pre-test app-owned state. Claude-owned runtime files are not observed.

## 9. Corrected live-validation semantics

After implementation and fixture/integration verification, a separately
approved live gate may:

1. Qualify only the default Claude Code 2.1.153 PowerShell-resolved command.
2. Keep FCC and `.local\bin` entirely untouched.
3. Snapshot only the managed target and app-owned state.
4. Apply exactly one saved route.
5. Run one bounded `/status` check to verify gateway/provider routing evidence.
   `/status` is not required to report the selected model.
6. Run one no-session-persistence routing request and verify the selected model
   from structured response metadata.
7. Determine tool use semantically from parsed structured events/fields. A raw
   substring such as `tool_use` in schema or metadata is not a tool invocation.
8. Restore in `finally` and verify only managed target/app-state equality.

The live request must still disable tools, use no fallback model, use a fixed
minimal prompt, cap budget, avoid session persistence, and contact only the
selected loopback gateway.

## 10. Testing requirements

### Builder tests

- Apply API-key and auth-token routes.
- Remove only the opposite auth key.
- Set base URL and `env.ANTHROPIC_MODEL`; never change top-level `model`.
- Set/remove each curated option with exact string semantics.
- Reject discovery plus disabled nonessential traffic.
- Preserve every unmanaged property and byte range outside surgical edits.
- Preserve BOM, line endings, indentation, trailing newline, property order,
  number/string spelling, and nested formatting outside managed edit spans.
- Insert `env` without regenerating the document when it is absent.
- Reject malformed JSON, duplicate keys, invalid URLs, invalid auth kinds,
  invalid references, and empty models.
- Verify backup, atomic replacement, failure recovery, and exact redaction.

### Adapter tests

- Existing version-1 route-store compatibility without migration.
- Version-1 route CRUD, revisions, fingerprints, apply, and restore.
- Applied-route matching based only on corrected fingerprint fields.
- Zero access to `.claude.json`, plugins, MCP, project/local settings, FCC, and
  `.local\bin` in all production and test code.

### Frontend tests

- Core route inputs and exactly four curated controls are present.
- Recommendation questions, benefits, tradeoffs, explicit confirmation, and
  conflict handling are covered.
- No arbitrary environment-variable editor exists.
- OpenCode and Kilo behavior remains unchanged.

### Live evidence tests

- `/status` checks route/provider evidence only.
- Model evidence comes from the routing response.
- Tool use is a semantic parsed assertion, not substring matching.
- Restoration equality covers only `settings.json` and app-owned state.

## 11. Documentation correction

Update Claude adapter documentation and planning evidence to state:

- only `settings.json` is managed;
- only the top-level `env` object is surgically patched;
- managed values are base URL, one auth field, `ANTHROPIC_MODEL`, and four
  curated compatibility options;
- top-level `model` and all bytes outside managed edit spans are preserved;
- all other settings are preserved;
- all other Claude files and directories are completely outside BDF access and
  verification scope;
- prior Gate 5B.4 is historical `HARD_FAILURE` under an over-broad acceptance
  contract and does not justify restoring or deleting Claude-owned state;
- lifecycle remains `Integrated, not live validated` until a corrected live
  gate passes and Gate 5C is separately approved — that condition is now met
  (corrected Gate 5B PASS + Gate 5C approved, 2026-08-17); lifecycle moved to
  **Live validated**.

Do not rewrite or conceal prior reports. Add superseding design/implementation
evidence while preserving the historical record.

## 12. Non-goals

- Generating a complete Claude settings file.
- Managing multiple active providers simultaneously inside Claude.
- Managing Claude plugins, marketplaces, MCP, sessions, or credentials beyond
  the selected routing credential.
- Cleaning up Claude-created runtime files.
- Modifying FCC.
- Implementing the final normal-user credential store in this correction.
- Assigning live-validated, supported, or production-ready status.

## 13. Completion sequence

1. DeepSeek implements this settings-only correction under a separate handoff. ✅ (session 42)
2. Sol reviews implementation and test evidence. ✅ (session 42)
3. A corrected, separately approved Gate 5B live validation runs. ✅ PASS
   (sessions 46 + 48, 2026-08-17)
4. Gate 5C documentation/release synchronization runs only after Gate 5B
   passes. ✅ (session 48, 2026-08-17)
5. DeepSeek implements the deferred normal-user credential UX afterward.
   ⬜ pending — future work, not yet started.

## 14. Official sources

- Environment variables:
  `https://code.claude.com/docs/en/env-vars`
- Connect Claude Code to an LLM gateway:
  `https://code.claude.com/docs/en/llm-gateway-connect`
- Gateway protocol and model discovery:
  `https://code.claude.com/docs/en/llm-gateway-protocol`
- Model configuration and auto-compaction:
  `https://code.claude.com/docs/en/model-config`
