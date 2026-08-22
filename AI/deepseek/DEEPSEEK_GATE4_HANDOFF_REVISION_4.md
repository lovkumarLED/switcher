# DeepSeek Gate 4 Handoff Revision 4

You are DeepSeek V4 Flash Max performing a final consistency correction of the
Gate 4 implementation handoff after Sol reviewed revision 3 against the actual
repository.

## Workspace

`C:\Users\loveb\.config\opencode\docs`

## Security Override

Do not read global `opencode.json`, credentials, credential-bearing backups,
environment-secret values, generated configuration containing real keys, or
real Claude configuration/state.

Never read, enumerate, search, copy, hash, parse, modify, or delete real Claude
files, any `.jsonc` file, plugin/marketplace contents, MCP credentials,
OAuth/session data, prompts, or transcripts. Use fixed fake markers only. Stop
with `BLOCKED` if a protected value is encountered. Never quote protected data.

## Task

Revise exactly:

`planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`

Do not implement Gate 4. Do not edit any other project file. Do not commit,
stage, push, merge, reset, clean, move, or delete files.

Preserve all correct revision-3 decisions. Resolve every issue below.

## 1. Resolve Locked-Endpoint Contradiction

Revision 3 says every endpoint returns 503 when the real target is locked, but
also says `GET /api/claude/status` returns a static locked status object. Both
cannot be true. Tests repeat the contradiction.

Define exact behavior:

- `GET /api/claude/status`: HTTP 200 with a static no-probe locked response.
- `GET /api/claude/route`: HTTP 503 while real target is locked because no safe
  target revision can be computed.
- `POST /api/claude/route`: HTTP 503 while locked.
- `POST /api/claude/restore`: HTTP 503 while locked.

The status response currently says all status flags are booleans but assigns
`settingsPresent: null`. Choose one coherent schema. Preferred:

```text
settingsPresent: null
inspectionState: "locked"
realTargetLocked: true
```

Then explicitly define `settingsPresent` as `boolean|null`, add
`inspectionState` to the exact status response, frontend rendering, strict
response tests, and locked-state tests. No locked endpoint may probe the real
profile.

## 2. Use Full SHA-256 Revision Tokens

Revision 3 truncates revision tokens to 16 hex characters. Use the full
lowercase 64-character SHA-256 value to avoid unnecessary collision risk.

Update:

- GET route response;
- save/restore request models;
- response models;
- frontend state;
- regex from 16 to 64 lowercase hex characters;
- all tests and examples.

The revision remains opaque and contains no path or settings content.

## 3. Fix Restore Output and Version-Observability Contradiction

Revision 3 says Python receives `coreVersion` and `schemaIdentity` from every
Apply and Restore output, but Restore output contains only `coreVersion`.

Choose one exact contract. Preferred:

- Restore accepts `-SchemaPath` as a required trusted adapter-selected input.
- Restore validates schema-file containment/identity without applying routing
  schema to the backed-up settings document.
- Restore success JSON includes both `coreVersion` and `schemaIdentity`.
- `-SchemaPath` is no longer forbidden for Restore.
- Python validates returned identity against the packaged schema hash.

Update parameter matrix, forbidden combinations, JSON output, manifest
eligibility, adapter behavior, docs, and tests consistently.

## 4. Define Previous-Route Backup Contract

Revision 3 records `previousRouteBackupName` but does not define its filename,
directory, containment, hash verification, or cleanup.

Define exactly:

- Route backups live only under ignored `app/state/`.
- Filename contract, for example:
  `claude-route.backup.<UTC yyyyMMddHHmmssfff>.<32-hex-guid>.json`.
- Manifest stores name and SHA-256 only, never an absolute path.
- Backup is written atomically before target apply when a previous route exists.
- Restore validates filename, containment, no reparse components, actual hash,
  JSON, duplicate keys, and routing schema before using it.
- A null previous route creates no route-backup file.
- Failed save removes only route backups created by that failed transaction.
- Successful restore consumes the manifest entry and handles its route backup
  deterministically.

Add exact rejection and failure-injection tests.

## 5. Define Manifest Pop and Backup Retention

The manifest is capped at 10 entries, but revision 3 does not define what
happens to discarded target and route backups. This can create orphan files or
unsafe deletion.

Define:

- Successful restore removes or marks the consumed newest entry. Prefer popping
  it so the next restore walks backward one adapter transaction.
- When adding entry 11, prune only the oldest manifest-owned target backup and
  route backup after validating filename, target binding, containment, and hash.
- Never delete a file not named by an eligible manifest entry.
- Never use recursive deletion.
- If safe pruning cannot be verified, retain the entry and fail the save rather
  than orphan or delete unknown files.
- Manifest and backup pruning occur under the same lock and transaction.

Add tests for entry 11, foreign similarly named files, tampered old backups,
consumed restore entries, and no orphaned adapter-owned files.

## 6. Clarify Target/Route/Manifest Rollback Ordering

Define exact rollback order when target Apply succeeded but route-source or
manifest commit fails:

1. Keep the newly created target backup and metadata from Apply.
2. Restore target through the production Restore operation, not ad hoc Python
   file replacement.
3. Restore previous route source atomically or remove the newly created route
   when previous route was absent.
4. Restore previous manifest bytes atomically.
5. Verify target revision, route state, manifest state, and directory inventory.
6. Remove only transaction-created route backup/temp files after verification.

If rollback fails, return a generic hard failure and preserve evidence files;
never claim success or continue mutation. Add failure injection for route write,
manifest write, target rollback, route rollback, and manifest rollback.

## 7. Add Write-Endpoint Host and Origin Protection

Current global CORS allows localhost on arbitrary ports. Claude save/restore are
high-impact local write endpoints.

Define endpoint-specific protection:

- Validate `Host` against the configured loopback app host/port.
- For browser requests with `Origin`, allow only the exact same-origin app URLs
  (`127.0.0.1:<configured port>` and, only if the app serves it, matching
  `localhost:<configured port>`).
- Reject other localhost ports and non-loopback origins before request-body
  processing.
- Permit absent Origin for in-process tests/approved local non-browser clients
  only when Host is valid.
- Apply strict checks to POST save and POST restore. Define whether GET route is
  also protected and test the chosen policy.
- Do not weaken global security or unrelated routes.

Add tests for malicious origin, wrong localhost port, bad Host, missing Origin
with valid Host, and valid same-origin requests. No external network calls.

## 8. Replace Impossible Documentation Status Scan

Revision 3 requires every adapter document to contain:

`Integrated, not live validated`

but its documentation scan flags occurrences of `live validated` unless the
document also contains one exact unrelated quotation. Therefore required docs
would fail.

Replace this with line-based status validation:

- Explicitly allow the exact lifecycle phrase
  `Integrated, not live validated`.
- Reject affirmative lifecycle lines equal to `Supported`, `Production ready`,
  or `Live validated`.
- Permit those words in clearly marked negative/prohibited/historical
  explanations.
- Do not use a global substring count.
- Keep the five adapter-document exact-status check.

Also ensure `production-ready` negative statements do not fail merely because
the phrase appears. Provide executable PowerShell checks and test them against
one permitted negative sentence and one forbidden affirmative status line.

## 9. Include Final Report in the Actual Allowlist Variable

Stage 3 currently says to add the report but does not provide the exact command.
Specify:

```powershell
$finalDocAllowlist = $docAllowlist + @(
  'planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md'
)
```

Stage 3 must run the documentation scan over `$finalDocAllowlist`, then run
report-contract, scope, ASCII, and `git diff --check` checks. Stage 1 continues
to use `$docAllowlist` before the report exists.

## 10. Make PROJECT_STATE Path Check Executable and Safe

Revision 3 says every referenced path is checked but gives no extraction rule.
Define an exact safe method limited to repository-relative backticked paths in
the regenerated `PROJECT_STATE.md`:

- Ignore URLs, examples, glob notation, placeholders, commands, and historical
  paths explicitly marked absent.
- Reject absolute user paths.
- Normalize only repository-relative literal paths.
- Test each selected path with `Test-Path` inside the repository.
- Include exact PowerShell or a deterministic documented helper.

Do not inspect paths outside the repository.

## 11. Resolve Gate 2 Count Language

Revision 3 adds wrapper tests while saying the final count remains 43 unless
new tests are added. Since wrapper tests are explicitly required, the count will
normally increase.

Require:

- preserve all 43 existing test intents;
- record a before list of all 43 names;
- after adaptation, prove all original names/intents remain represented;
- add separately named wrapper/core tests;
- final expected count is `43 + N` where N is the exact number of named new
  tests chosen in the handoff, not worker discretion;
- update the handoff with exact new test names and resulting fixed count.

Do not allow `43/43 or explained new count`. Determine exact N now and use one
fixed expected total throughout Gate 4 verification and report contracts.

## 12. Verify Production Restore Does Not Apply Routing Contract to Old State

A valid backup may represent settings from before the currently selected route.
Restore verification must check:

- valid JSON and no duplicate keys;
- successful atomic target replacement;
- byte equality to the validated backup after restore;
- parseable semantic state;
- target/backup hash expectations;

It must not require the restored settings to match the current route profile.
State this explicitly in shared-core and production-entry contracts and tests.

## 13. Preserve Existing Correct Revision-3 Requirements

Keep all correct requirements, including:

- exact file scope and no alternatives;
- `app/.gitignore` runtime-state rule;
- shared routing core;
- reviewed Gate 2 harness adaptation;
- dual real-target locks;
- secret environment-reference names only;
- full semantic preservation and formatting limitation;
- separate Claude panel, never provider registry;
- exact five adapter docs;
- generic BDF/templates with no Claude specifics;
- framework 2.3.0 minor bump;
- honest manual PROJECT_STATE regeneration;
- fixture/temp-only Gate 4 execution;
- no real Claude state access;
- no external network or Claude invocation;
- no release claim;
- lifecycle `Integrated, not live validated`;
- Gate 5 unauthorized.

## Required Self-Review

Before returning, verify:

- locked status behavior has one HTTP contract;
- all boolean/null field types are explicit;
- revision tokens are full SHA-256;
- Restore output and version observability agree;
- route backup lifecycle is complete;
- manifest cap creates no orphan or unsafe deletion;
- rollback uses production Restore and has exact ordering;
- endpoint Host/Origin checks are tested;
- required lifecycle wording passes scans;
- forbidden affirmative status wording fails scans;
- final report is actually scanned;
- PROJECT_STATE path verification is executable and repository-bounded;
- Gate 2 final count is fixed, not conditional;
- Restore verifies old state without current-route equivalence;
- every file count is recalculated if scope changes;
- no implementation occurred;
- no protected configuration was read;
- ASCII, no unresolved TODO/TBD placeholders, and `git diff --check` pass.

## Return Contract

Return only:

```text
Status: PASS or BLOCKED
Modified file:
Findings resolved:
Final Gate 2 expected count:
Exact implementation file count:
Exact test file count:
Exact documentation/framework/template file count:
Exact report file count:
Exact total file count:
Checks performed:
Concerns:
Remaining work:
```

Put full handoff content in the handoff file, not chat.
