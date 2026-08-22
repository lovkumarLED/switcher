# Claude Code Env-Only Scope Correction Implementation Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** Implement and test the approved env-only Claude routing scope
> on temporary fixtures only. No real Claude access, live validation, Gate 5C,
> release, or credential-store work is authorized.

## 1. Goal

Implement
`planning/claude-code/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md` exactly:

- surgically edit only approved properties inside the top-level `env` object
  of `.claude/settings.json`;
- never change top-level `model`;
- preserve every unrelated byte rather than regenerating the JSON document;
- retain the four curated compatibility controls;
- reject gateway discovery plus disabled nonessential traffic;
- add an advisory, explicit-confirmation compatibility assistant to the app;
- remove all access/verification assumptions for every other Claude/FCC path.

Lifecycle remains exactly `Integrated, not live validated`.

## 2. Authoritative design and evidence

Read before editing:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_5B4_DEFAULT_2153_HOSTED_CLI_REPORT.md`
5. `planning/claude-code/CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md`
6. `adapters/claude-code/ADAPTER.md`
7. `adapters/claude-code/BUILDER_SPEC.md`
8. `adapters/claude-code/TESTING.md`
9. `adapters/claude-code/COMPATIBILITY.md`
10. `app/engine/claude-code/claude-routing-core.psm1`
11. `app/engine/claude-code/build-claude-code.ps1`
12. `app/engine/claude-code/build-claude-code-production.ps1`
13. `app/engine/claude-code/test-claude-code.ps1`
14. `app/engine/claude-code/test-provider-model.ps1`
15. `app/engine/claude-code/inspect-provider-model.ps1`
16. `app/app/claude_adapter.py`
17. `app/tests/test_claude_adapter.py`
18. `app/assets/js/pages/claude-routes.js`
19. `app/tests/claude_routes_contract.test.mjs`

Verify the approved design SHA-256 before work:

`4B4F2BD46153C8F229479A4B785C14728586DA49EF36BDE94E71412C326E66AF`

If it differs, stop `BLOCKED`.

## 3. Absolute safety and scope boundaries

1. Do not read, hash, enumerate, snapshot, compare, copy, restore, edit, or
   delete any real Claude file or directory.
2. Do not access user `.claude.json`, `.claude/plugins`, marketplace state,
   MCP, project/local Claude settings, sessions, transcripts, prompts, memory,
   hooks, skills, agents, caches, logs, OAuth/auth databases, or IDE state.
3. Do not enumerate, inspect, invoke, hash, update, rename, move, delete, or
   otherwise access FCC executables or anything under `.local\bin`.
4. Do not run `Get-Command claude`, `claude`, FCC, a gateway, DNS, HTTP, a
   server, the app UI server, or any live provider test.
5. Do not read or modify real Git-ignored `app/state` files. All adapter tests
   must inject GUID temporary files as they do today.
6. Keep `ALLOW_REAL_CLAUDE_TARGET = False`; never pass `-AllowRealTarget`.
7. Do not commit, stage, reset, clean, checkout, restore, revert, push, amend,
   or create a worktree.
8. Do not use subagents, Graphify, screenshots, transcripts, or secrets.
9. Use fake secret markers only and prove they never enter output/reports.
10. Preserve unrelated dirty/untracked work exactly.

Gate 5B.4 remains immutable historical evidence. Do not rewrite or delete prior
handoffs/reports.

## 4. Exact file scope

### Core implementation and fixtures

- Modify `app/engine/claude-code/claude-routing-core.psm1`.
- Modify `app/engine/schemas/claude-code-routing.schema.json`.
- Modify `app/engine/claude-code/fixtures/routing-api-key.json`.
- Modify `app/engine/claude-code/fixtures/routing-auth-token.json`.
- Modify `app/engine/claude-code/test-claude-code.ps1`.
- Modify `app/engine/claude-code/test-provider-model.ps1` only where route
  fixture source semantics change from `settings` to `environment`.

### App implementation and tests

- Modify `app/app/claude_adapter.py`.
- Modify `app/tests/test_claude_adapter.py`.
- Modify `app/assets/js/pages/claude-routes.js`.
- Modify `app/assets/css/provider-workspace.css`.
- Modify `app/tests/claude_routes_contract.test.mjs`.

### Adapter documentation

- Modify `adapters/claude-code/README.md`.
- Modify `adapters/claude-code/ADAPTER.md`.
- Modify `adapters/claude-code/BUILDER_SPEC.md`.
- Modify `adapters/claude-code/TESTING.md`.
- Modify `adapters/claude-code/COMPATIBILITY.md`.

### Evidence

- Create exactly
  `planning/claude-code/CLAUDE_CODE_ENV_ONLY_SCOPE_CORRECTION_IMPLEMENTATION_REPORT.md`.

Do not modify any other path. If another file is truly required, stop and
request a revised handoff rather than expanding scope.

## 5. Managed-field contract

The builder may edit only these direct properties of the top-level `env`
object:

```text
ANTHROPIC_BASE_URL
ANTHROPIC_API_KEY
ANTHROPIC_AUTH_TOKEN
ANTHROPIC_MODEL
CLAUDE_CODE_AUTO_COMPACT_WINDOW
CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY
CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
```

Exactly one auth property is present after apply. Top-level `model` and every
other byte/value are preserved.

Route-model profile source changes from `settings` to `environment`; update
both routing fixtures and require schema enum `environment` for `model.source`.

Change schema `envPolicy.autoCompactWindow` from `number` to `integer`. Add a
Draft-07 `allOf`/`not` constraint that rejects an `envPolicy` object where both
`gatewayDiscovery` and `disableNonessentialTraffic` are `const: true`; retain
runtime validation in Python and PowerShell because schema validation is not
the only entry boundary.

Option output:

- compact window: decimal string `100000` through `1000000`;
- enabled Boolean: string `1`;
- disabled Boolean: property absent;
- never write `0` or `false` for nonessential traffic;
- reject `gatewayDiscovery == true` together with
  `disableNonessentialTraffic == true`.

Keep route-store version 1 and current route shape/fingerprint fields. No state
migration exists in this task.

## 6. Task 1 - RED: core and schema contract

Add named failing tests to `test-claude-code.ps1` before implementation. Generate
format variants under each test's GUID temporary root; do not add persistent
settings fixtures unless this handoff is revised.

Required RED cases:

1. `Env-only model precedence`: apply writes `env.ANTHROPIC_MODEL` and leaves
   top-level `model` byte/value unchanged.
2. `Root bytes preserved`: unusual root spacing, property order, numeric token
   spelling, escaped string spelling, and nested formatting remain byte-exact.
3. `Unmanaged env bytes preserved`: an unmanaged direct env property with
   unusual whitespace/escaping remains byte-exact.
4. `Existing managed replacements surgical`: changing existing managed string
   values changes only their value-token ranges.
5. `Missing managed insertions surgical`: insert missing keys without reordering
   existing env members.
6. `Missing env insertion surgical`: add one env object while every existing
   root-property byte remains unchanged.
7. `Disabled-option removal surgical`: remove only the disabled managed member
   plus the minimum delimiter/adjacent whitespace required for valid JSON.
8. `Opposite auth removal surgical`: preserve every unrelated env member.
9. `UTF-8 BOM preserved`.
10. `LF, CRLF, indentation, and trailing-newline forms preserved` as separate
    subcases.
11. `Conflict rejected before backup`: discovery plus nonessential traffic
    produces nonzero exit, unchanged target hash, and no backup/temp.
12. `Top-level model corruption detected`: a mutant that changes root `model`
    is rejected and recovered.
13. `Unmanaged-byte corruption detected`: a mutant changing one unsupported
    raw token is rejected and recovered.
14. `No full-document serializer`: static source rejects the settings-object
    pipeline to `ConvertTo-Json` and requires the surgical patch entry point.

Run the focused RED harness and record the expected named failures. Do not
weaken tests to obtain GREEN.

## 7. Task 2 - GREEN: PowerShell 5.1 surgical env patcher

Implement inside `claude-routing-core.psm1`; do not add another module.

### Required interfaces

```powershell
Read-SettingsDocument -Path <string>
Get-SettingsJsonLayout -Raw <string>
ConvertTo-JsonStringLiteral -Value <string>
New-SettingsEnvEdits -Document <object> -Route <object> -Auth <object>
Apply-SettingsTextEdits -Raw <string> -Edits <array>
Assert-SettingsTextPreserved -Before <string> -After <string> -Edits <array>
Write-NewBytes -Path <string> -Bytes <byte[]>
```

`Read-SettingsDocument` returns an object containing:

```text
RawText
ParsedObject
HasUtf8Bom
LineEnding (LF, CRLF, or NONE)
HasTrailingNewline
OriginalBytes
```

Requirements:

1. Read bytes once, accept strict UTF-8 with or without BOM, and reject invalid
   UTF-8 before backup/mutation.
2. Keep duplicate-key rejection, including escaped-equivalent names.
3. Extend the current scanner into a recursive lexical layout parser that
   records character spans for root members, the top-level `env` object, its
   direct members, string/value tokens, commas, and closing braces. Strings,
   escapes, nested objects, and arrays must be skipped correctly.
4. Validate syntax with `ConvertFrom-Json`, but never serialize the settings
   object with `ConvertTo-Json`.
5. `ConvertTo-JsonStringLiteral` may serialize only an individual string scalar
   and must return exactly one JSON string token.
6. Every edit object contains `Start`, `Length`, `Replacement`, and
   `ManagedName`. Validate bounds, unique names, and non-overlap.
7. Apply edits in descending `Start` order.
8. Existing managed values replace only their value-token spans.
9. Property removal chooses one deterministic minimal member/comma span:
   remove the member and following separator when a following member exists;
   otherwise remove the preceding separator and member; for the sole member,
   remove only the member body while retaining braces.
10. Insertions preserve detected line ending and indentation. For empty objects,
    infer one indentation level from the root; for compact JSON, remain compact.
11. If root `env` is absent, insert it using root member/comma rules without
    rewriting an existing root member.
12. Preserve BOM and write UTF-8 using the original BOM choice.
13. `Assert-SettingsTextPreserved` reconstructs the expected text exclusively
    from the original text plus validated edits and requires exact ordinal
    equality with output. It also requires every unchanged segment between
    edits to match exactly.
14. Reparse output, verify managed values and conflict rules, and compare a
    semantic snapshot that now treats top-level `model` as unsupported and
    `env.ANTHROPIC_MODEL` as managed.
15. Bump `$script:CLAUDE_ROUTING_CORE_VERSION` from `0.1.0` to `0.2.0` and
    update documentation/tests expecting the implementation version.
16. Keep backup, atomic replace, output JSON, restore, failure injection, and
    redaction contracts unchanged.
17. Remove the current `Validate-Inputs` behavior that adds an empty `env`
    object to the parsed settings object. Validation may inspect an existing
    env object or accept absence; only the surgical text patcher may create it.

Replace the current full-document line:

```powershell
$settingsDoc.Object | ConvertTo-Json -Depth 100
```

with output bytes produced only by the surgical edit pipeline.

Run the full Gate 2 harness to GREEN. Every pre-existing test remains green and
all named Task 1 cases pass.

## 8. Task 3 - RED/GREEN: adapter validation and profile semantics

### RED tests

Add focused tests in `test_claude_adapter.py`:

1. Route create rejects discovery plus nonessential traffic with HTTP 400.
2. Route edit rejects the same conflict before revision/store/activity changes.
3. `_routing_profile` emits `model.source == "environment"`.
4. Apply writes fake model to `env.ANTHROPIC_MODEL` and preserves root `model`.
5. Apply preserves exact target bytes outside managed spans using a deliberately
   formatted temporary settings file.
6. Existing version-1 route-store bytes/shape load without migration.
7. Fingerprint remains sensitive to all four curated options.
8. Locked and temporary-root tests make zero calls toward forbidden Claude/FCC
   paths; use mocks that raise on any attempted forbidden access.

### GREEN implementation

In `_validate_route`, after Boolean and compact checks, add exact HTTP 400 copy:

```text
Gateway model discovery cannot be combined with disabled nonessential traffic.
```

Change `_routing_profile(route)["model"]["source"]` to `environment`.

Do not alter route-store version, route fields, fingerprint inputs, IDs,
timestamps, manifest shape, activity shape, revision semantics, or locks.

Update apply assertions from `target["model"] == route["model"]` to:

- original top-level model unchanged;
- `target["env"]["ANTHROPIC_MODEL"] == route["model"]`.

Run focused Python tests to GREEN.

## 9. Task 4 - RED/GREEN: compatibility recommendation UI

### Required pure interface

Export from `claude-routes.js`:

```javascript
export function recommendClaudeCompatibility({
  hasModelsEndpoint,
  supportsBetaFields,
  contextWindow,
  suppressNonessentialTraffic,
})
```

Inputs:

- `hasModelsEndpoint`: `"yes" | "no" | "unknown"`;
- `supportsBetaFields`: `"yes" | "no" | "unknown"`;
- `contextWindow`: empty string or a decimal integer supplied by the user;
- `suppressNonessentialTraffic`: Boolean.

Return exact shape:

```javascript
{
  values: {
    gatewayDiscovery: Boolean,
    disableExperimentalBetas: Boolean,
    autoCompactWindow: Number,
    disableNonessentialTraffic: Boolean,
  },
  notes: Array<{ code: String, tone: "info" | "warning", text: String }>,
}
```

Recommendation rules:

1. Discovery true only for `hasModelsEndpoint == "yes"` and suppressed traffic
   false.
2. Disable betas true only for `supportsBetaFields == "no"`.
3. Suppressed traffic mirrors its Boolean input.
4. Known context 100000-1000000 becomes compact window exactly.
5. Known context below 100000 returns 100000 plus warning code
   `CONTEXT_BELOW_SUPPORTED_MINIMUM` stating `/compact` may be required.
6. Known context above 1000000 returns 1000000 plus info code
   `CONTEXT_CAPPED_AT_SUPPORTED_MAXIMUM`.
7. Empty/unknown context returns 190000 plus info code
   `CONTEXT_NOT_VERIFIED`.
8. Models endpoint yes plus suppressed traffic returns discovery false plus
   warning code `DISCOVERY_BLOCKED_BY_NONESSENTIAL_TRAFFIC`.
9. Unknown beta support returns betas false plus warning code
   `BETA_COMPATIBILITY_NOT_VERIFIED`.
10. Recommendations never mutate form controls until the user clicks
    `Apply recommendations`.

### Dialog behavior

Keep the five core route inputs and four existing option controls. Add a
`Gateway compatibility assistant` fieldset containing:

- models endpoint select: Unknown/Yes/No;
- beta fields select: Unknown/Yes/No;
- optional context-window input;
- suppress-nonessential-traffic checkbox;
- `Show recommendations` button;
- recommendation summary with benefits/tradeoffs;
- `Apply recommendations` button;
- required confirmation checkbox:
  `I reviewed these compatibility settings and their tradeoffs.`

Saving is blocked until confirmation is checked. Editing an existing route
requires fresh confirmation; do not pre-check it.

When nonessential traffic is checked in actual route controls, disable actual
discovery control and uncheck it. When discovery is checked, disable/uncheck
nonessential traffic. Backend validation remains authoritative.

Copy must state:

- discovery queries `/v1/models`, is optional, and may expose all models
  available to a shared key;
- disabling betas improves compatibility but disables MCP tool search;
- compact range is 100000-1000000 and a recommendation is not verification;
- disabling nonessential traffic also disables discovery refreshes and must be
  unset, not `0`, to turn it off;
- no gateway is contacted to generate recommendations.

Use existing dialog/components and add only scoped Claude CSS. Ensure desktop
and mobile layouts remain usable.

### Frontend RED/GREEN tests

Add tests for every pure recommendation rule, non-mutation before apply,
required confirmation copy/guard, conflict UI, exact four controls, no raw env
editor, escaped rendering, and mobile-scoped class presence.

Run focused frontend tests to GREEN.

## 10. Task 5 - Gate 3 compatibility and documentation

Update `test-provider-model.ps1` route profile source values to `environment`
where the corrected schema requires it. Preserve inspector precedence behavior:

- `env.ANTHROPIC_MODEL` is effective when present;
- top-level settings model is fallback only;
- alias pins remain opaque pins, not provider rows;
- discovery/nonessential conflict remains explicit.

Run Gate 3 harness and require all existing 25 criteria tests pass. Add no live
gateway and do not change the inspector's fake-loopback-only boundary.

Update the five adapter docs:

- implementation version `0.2.0`;
- env-only managed-field allowlist;
- surgical byte-preserving behavior and no full-document regeneration;
- top-level model preservation and `env.ANTHROPIC_MODEL` precedence;
- four curated options, official constraints, and conflict;
- app recommendation assistant is advisory and requires confirmation;
- zero-access boundary for every other Claude/FCC path;
- corrected future live-test semantics;
- Gate 5B.4 remains historical hard-failure evidence under the superseded broad
  contract;
- lifecycle remains `Integrated, not live validated`.

Include the four official sources from the approved design. Do not update root
support/release/shared status documents in this implementation gate.

## 11. Required verification

Run from repository root unless noted:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1
```

```powershell
$python = (Resolve-Path '.\app\env\Scripts\python.exe').Path
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe $python
```

Run from `app`:

```powershell
& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest tests.test_claude_adapter tests.test_capabilities
node --test tests/claude_routes_contract.test.mjs tests/capability_ui_contract.test.mjs
& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"
node --test ".\tests\*.test.mjs"
```

Run OpenCode/Kilo harnesses from repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1
```

Also require:

- PowerShell parser checks for all modified `.ps1`/`.psm1` files;
- JSON parsing for modified schema/fixtures;
- `git diff --check` exit 0;
- all scoped source/docs/report files ASCII;
- `git status --short -- app/state` remains empty;
- executable production-code scan has zero APIs/paths for `.claude.json`,
  plugins, MCP, project/local settings, FCC, or `.local\bin`; boundary docs and
  tests may name those exclusions but must never access them;
- source scan has zero `-AllowRealTarget` additions or lock changes;
- core static scan confirms no full settings-object `ConvertTo-Json` pipeline;
- exact scoped Git diff contains only section 4 paths.

Full-suite failures may be accepted only when they exactly match the existing
unrelated baseline (two Python preference failures and one frontend onboarding
copy failure). Any new/lower pass count is failure. If those baseline failures
are no longer present, report the fresh passing result rather than recreating
them.

## 12. Acceptance criteria

Implementation is `PASS` only when:

1. Approved design hash matched before edits.
2. RED evidence exists for every named core/adapter/frontend requirement.
3. All GREEN focused and harness verification passes.
4. Only top-level `env` managed properties change in fixture applies.
5. Top-level `model` and every unrelated byte remain exact.
6. Existing route-store version 1 remains compatible and untouched outside
   temporary tests.
7. Conflict is rejected in schema/API/core/UI before mutation.
8. Recommendations are advisory, explicit-confirmation, non-probing, and cover
   official benefits/tradeoffs.
9. OpenCode/Kilo behavior and tests remain unchanged.
10. No real Claude/app-state/FCC access or live operation occurred.
11. Both real-target locks remain closed.
12. Documentation accurately supersedes the broad ownership assumption without
    rewriting historical reports.
13. No commit or staging occurred.

## 13. Required report

Create
`planning/claude-code/CLAUDE_CODE_ENV_ONLY_SCOPE_CORRECTION_IMPLEMENTATION_REPORT.md` as
ASCII Markdown containing:

1. `Status`: `PASS`, `FAIL`, or `BLOCKED`.
2. `Authorization and exclusions`.
3. `Approved design hash`.
4. `Files created/modified`.
5. `RED evidence` with named failures and commands.
6. `Surgical patch implementation` and required interface evidence.
7. `Byte-preservation matrix` for all formatting cases.
8. `Managed-field and conflict matrix`.
9. `Existing route-store compatibility`.
10. `Recommendation assistant behavior` and pure-function matrix.
11. `Tests run` with exact commands, exits, and counts.
12. `OpenCode/Kilo regression evidence`.
13. `Zero-access/FCC/real-state/lock attestation`.
14. `Git and scope integrity`.
15. `Failures, risks, and accepted unrelated baselines`.
16. `Corrected Gate 5B recommendation`: `READY FOR SOL PLANNING` or
    `BLOCKED`; explicitly not authorization.

Do not include secrets, route values, private paths/state, or full settings
fixtures in the report.

## 14. Final boundary

This handoff authorizes implementation, fixture tests, app tests, and scoped
adapter documentation only. It does not authorize real state, app-state
migration, live Claude execution, Gate 5B, Gate 5C, release/status promotion,
commits, or the deferred normal-user credential UX fix.
