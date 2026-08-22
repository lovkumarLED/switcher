# DeepSeek Gate 4 Handoff Revision 2

You are DeepSeek V4 Flash Max revising the Gate 4 implementation handoff after
Sol's second repository review.

## Workspace

`C:\Users\loveb\.config\opencode\docs`

## Security Override

Do not read global `opencode.json`, provider credentials, MCP credentials,
environment-secret values, credential-bearing backups, generated configuration
containing real keys, or real Claude configuration/state.

Never read, enumerate, search, copy, hash, parse, modify, or delete:

- `C:\Users\loveb\.claude.json`
- real `C:\Users\loveb\.claude` contents
- any `.jsonc` file
- plugin or marketplace contents
- MCP credentials
- OAuth/session data
- prompts or transcripts

Use fake secret markers only. If a protected value is encountered, stop and
return `BLOCKED`. Never quote protected values.

## Task

Revise exactly one implementation handoff:

`planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`

Do not implement Gate 4. Do not edit any other project file. Do not commit,
stage, push, merge, reset, clean, move, or delete files.

Resolve every finding below. Keep all correct material from revision 2 unless a
finding requires changing it.

## Finding 1: Gate 2 Harness Cannot Remain Unchanged

The proposed shared-core extraction changes the source structure tested by:

- `app/engine/claude-code/test-claude-code.ps1:84`
- `app/engine/claude-code/test-claude-code.ps1:85`

Those tests inspect and mutate exact source text currently located in
`build-claude-code.ps1`. Moving transaction logic into
`claude-routing-core.psm1` makes the claimed unchanged 43/43 run impossible.

Revise the exact file scope to allow modifying
`app/engine/claude-code/test-claude-code.ps1`.

Require TDD/refactor evidence that:

1. Existing behavioral tests remain unchanged in intent.
2. Source-structure tests move to the shared core.
3. The fixture wrapper itself gains tests proving it imports the expected core
   and preserves its CLI contract and temp-boundary policy.
4. The synthetic replacement-cleanup mutant copies or references the core
   safely from the temporary test root.
5. Final Gate 2 count remains 43/43 unless genuinely new Gate 2 tests are added;
   if count changes, require the report to explain every added test and never
   hide a removed test behind the same total.

Do not describe this as an unchanged harness. Describe it as a reviewed harness
adaptation with unchanged behavioral guarantees.

## Finding 2: Runtime State Directory Must Be Ignored

The handoff creates runtime files under:

- `app/state/claude-route.json`
- `app/state/claude-backup-manifest.json`

`app/state/` is not ignored. Add exact modification of `app/.gitignore` to the
file scope. Require an exact ignore rule for runtime adapter state and a test
that generated route/manifest files never appear in Git status.

Correct `CLAUDE_SETTINGS_REL` to the exact structural tuple:

`(".claude", "settings.json")`

Remove the leading empty segment.

## Finding 3: Production Entry Needs Its Own Real-Target Lock

The Python constant alone does not prevent direct invocation of
`build-claude-code-production.ps1` against the real profile.

Require defense in depth:

- Production entry rejects a profile root equal to the process user profile by
  default.
- Real-target execution requires an explicit Gate 5-only switch or equivalent
  positive authorization parameter.
- Gate 4 never passes that authorization.
- Fixture tests use temporary profile roots and prove direct real-profile
  invocation is rejected before file probing, backup, or mutation.
- Gate 5 handoff is the only authority that may pass the real-target switch.

The HTTP safety lock and PowerShell safety lock must both exist.

## Finding 4: Production Entry Must Support Apply and Restore Explicitly

The current production entry contract describes only an apply operation, while
the API exposes restore. Define one exact executable contract.

Preferred minimal contract:

- `build-claude-code-production.ps1` accepts `-Operation Apply|Restore`.
- Apply accepts route/schema/target inputs and returns machine-readable,
  redacted metadata.
- Restore accepts only adapter-selected backup identity and expected hashes; no
  client path reaches it.
- Shared core exports explicit apply and verified-restore functions.
- Fixture wrapper keeps its existing CLI/output contract for Gate 2.

Define exact PowerShell parameters, required/forbidden combinations, exit codes,
and output JSON fields. Python must not scrape human prose or infer backups from
ambiguous directory ordering.

Production output may contain only non-secret metadata such as:

- `ok`
- `backupName`
- `backupSha256`
- `preWriteTargetSha256`
- `postWriteTargetSha256`
- `coreVersion`
- `schemaIdentity`

It must never emit absolute paths, usernames, resolved secret values, or target
contents.

## Finding 5: Manifest Hash Model Is Incorrect

Replace ambiguous `targetSha256` with distinct fields:

- `backupSha256`: hash of the adapter-created backup file.
- `preWriteTargetSha256`: hash of target before apply.
- `postWriteTargetSha256`: hash of target after successful apply.
- `targetBindingSha256`: hash of the normalized canonical target identity,
  stored internally and never returned by the API.

Restore eligibility must recompute and compare the actual backup file hash to
`backupSha256`. Remove tautological wording such as comparing a recorded value
to itself.

Stale-write detection must compare the current target hash against a client
revision or the last known post-write revision, as specified in Finding 7.

## Finding 6: Restore Recovery Must Restore the Pre-Restore Target

Do not retry restoration from the same potentially bad backup.

Define safe restore transaction:

1. Validate manifest, target binding, schema identity, backup name, containment,
   reparse policy, backup hash, JSON, and duplicate keys before mutation.
2. Create a same-directory recovery copy of the current target.
3. Atomically replace target with validated backup content.
4. Parse and verify restored target.
5. If post-restore verification fails, atomically restore the recovery copy and
   verify it.
6. Delete transaction temporaries only after verification.
7. If recovery-copy restoration fails, return a redacted hard failure and stop;
   never retry the same backup.

Add synthetic failure tests for every restore boundary.

## Finding 7: Add Opaque Revision Tokens for Stale-Write Safety

Current API cannot prevent first-save stale writes because POST carries no
expected revision.

Define exact revision contract:

- `GET /api/claude/route` returns an opaque `revision` derived from the current
  settings-target SHA-256. It is not a path and contains no settings values.
- `POST /api/claude/route` requires `expectedRevision`.
- `POST /api/claude/restore` requires `expectedRevision`.
- Server recomputes current target revision under the same lock immediately
  before mutation.
- Mismatch returns HTTP 409 with no backup, route-source write, manifest write,
  or target mutation.
- Frontend stores the loaded revision and submits it with save/restore.
- Successful save/restore returns the new revision.

Update strict request/response schemas, frontend IDs/state, and tests.

## Finding 8: Route Source and Target Must Commit Consistently

The handoff does not define transaction ordering between:

- settings target
- `app/state/claude-route.json`
- backup manifest

Define one consistency contract.

Required behavior:

1. Lock acquired.
2. Validate request and expected revision.
3. Capture previous route-source state (including absence).
4. Apply target transaction through production entry.
5. Atomically write new route source.
6. Atomically append manifest entry.
7. If route-source or manifest commit fails, restore target from the newly
   created backup and restore previous route-source/manifest state.
8. Verify all three artifacts before success response.

Each manifest entry must preserve enough non-secret previous-route metadata to
restore route-source consistency. Define exact fields. A first save may record a
null previous route.

On successful restore:

- target returns to backup state;
- route source returns to the corresponding previous route state or is removed
  when previous route was absent;
- manifest updates atomically;
- response returns the new revision.

Add failure-injection tests at every commit boundary.

## Finding 9: Test Profile-Root Injection Must Be Exact

Gate 4 must never start the real server and accidentally resolve the real home.

Define an exact injectable dependency in `claude_adapter.py`, for example a
`get_profile_root()` function overridden by FastAPI tests. Production default
may resolve `Path.home()` for capability, but every Gate 4 endpoint test must
override it with a GUID temporary root.

Do not use a general environment variable that could accidentally redirect the
production server unless it has a strict test-only guard and temp-root boundary.

Replace the vague live server smoke test with FastAPI `TestClient` or the
repository's exact in-process test pattern using the dependency override.

No Gate 4 verification command may start a server that can inspect the real
profile.

## Finding 10: Framework Version Must Be Minor, Not Patch

`bdf/VERSION.md` defines:

- Minor: additive changes, new templates, new workflow stages, new concepts.
- Patch: fixes and clarifications with no structural change.

Unique bounded adapters and new framework concepts are additive. `2.2.11` to
`2.2.12` is a patch bump and contradicts the stated reason.

Change the planned framework version to `2.3.0`, unless repository evidence
proves a breaking change requiring a major bump. Update every scope item,
verification rule, documentation requirement, and report field consistently.

Do not create a project/app release.

## Finding 11: PROJECT_STATE Regeneration Procedure Is Still Vague

The repository has a 15-section template but no proven automatic generator in
the handoff. Define the exact available process after inspecting repository
scripts without leaving the repository or reading protected configuration.

If no generator exists, say explicitly:

- regenerate `PROJECT_STATE.md` manually from current repository facts while
  preserving the exact 15-section template structure;
- do not copy unresolved template placeholders;
- do not manually alter generated release/version regions governed elsewhere;
- run exact heading, placeholder, path, version, and consistency checks.

Do not claim an unavailable generation command.

## Finding 12: Report Must Be in the Security Allowlist

Add:

`planning/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`

to the documentation scan allowlist after report creation. Define staged scans:

1. implementation/docs checks before report;
2. create report;
3. final report-inclusive scans and scope checks.

## Finding 13: Scan Rules Must Handle Intentional Test Literals

Tests may need fake secret markers and negative protected-name assertions.
Source scans must distinguish:

- forbidden real credential-shaped values;
- allowed fixed fake markers;
- allowed split/concatenated protected filename guards;
- documentation negative safety statements.

Do not weaken scans. Define exact allowed fake-marker values and reject any
other credential-shaped value. Never search global configuration, backups,
real Claude directories, or files outside the exact allowlist.

## Finding 14: Manifest Target Binding Must Be Precise

Replace `boolean-ish fingerprint` with an exact field and algorithm:

- Normalize the canonical target path using the same case/path policy as the
  production entry.
- Compute SHA-256 over UTF-8 normalized identity text.
- Store only `targetBindingSha256` in the internal manifest.
- Never return it through API or include the normalized path in reports.
- Tests prove different roots produce different bindings and case-equivalent
  Windows paths produce the same binding.

## Finding 15: Version Ownership Must Be Observable Without Source Scraping

Define how the Python adapter receives `coreVersion` and `schemaIdentity` from
the production entry's machine-readable output. Do not require Python to parse
PowerShell source text.

Fixture entry output remains compatible with Gate 2. Production entry output is
strict JSON on stdout; errors are redacted and use nonzero exit codes.

## Finding 16: Correct File Counts and Scope

At minimum add these exact modified files to scope:

- `app/.gitignore`
- `app/engine/claude-code/test-claude-code.ps1`

Recalculate implementation, test, documentation, report, and total counts after
all corrections. Counts must include every file actually created or modified.

No alternatives, wildcards, `as needed`, `and/or`, or worker-selected scope.

## Finding 17: Preserve Existing Correct Requirements

Keep these revision-2 requirements unless changed above:

- exact five adapter documents;
- separate Claude panel, never provider registry;
- generic BDF/template changes contain no Claude specifics;
- secret environment reference names only;
- semantic preservation and formatting-normalization disclosure;
- no private paths in API responses;
- strict request schemas and no client paths;
- concurrency lock;
- Gate 2, Gate 3, OpenCode, Kilo, app, and frontend regressions;
- fixture/temp-only Gate 4 execution;
- no real Claude state access;
- no external network;
- no Claude invocation;
- no release claim;
- lifecycle status `Integrated, not live validated`;
- Gate 5 unauthorized.

## Required Self-Review

Before returning, verify:

- shared-core refactor is compatible with an adapted Gate 2 harness;
- production Apply and Restore contracts are complete;
- manifest hashes are non-tautological;
- stale-write revision works on first and later saves;
- target, route source, and manifest commit consistently;
- runtime state is Git-ignored;
- PowerShell entry and HTTP layer both lock real targets;
- every test uses an injected temporary profile root;
- framework bump matches the documented version policy;
- PROJECT_STATE process is honest and executable;
- report-inclusive scans are staged;
- exact file scope and counts are consistent;
- no protected configuration was read;
- no implementation occurred;
- ASCII and no unresolved TODO/TBD placeholders;
- `git diff --check` passes for the handoff.

## Return Contract

Return only:

```text
Status: PASS or BLOCKED
Modified file:
Findings resolved:
Exact implementation file count:
Exact test file count:
Exact documentation/framework/template file count:
Exact report file count:
Exact total file count:
Checks performed:
Concerns:
Remaining work:
```

Put full revised handoff content in the handoff file, not chat.
