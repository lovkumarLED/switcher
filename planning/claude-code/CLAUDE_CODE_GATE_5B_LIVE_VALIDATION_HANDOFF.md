# Claude Code Gate 5B Live Validation Handoff

> **Assigned worker:** DeepSeek V4 Flash Max  
> **Effort:** Max  
> **Date:** 2026-08-14  
> **Authority:** After two explicit human checkpoints, perform one bounded live
> validation of the single saved loopback Claude route, then restore every
> owned target/app-state byte and stop. Gate 5C remains unauthorized.

## 1. Goal

Exercise the integrated production apply/restore path against the real
user-scope Claude settings target, run one disposable no-tools Claude routing
request through the selected loopback gateway, verify status/model evidence,
and restore the exact pre-test target and app state.

This gate produces evidence only. Lifecycle remains exactly
`Integrated, not live validated` until Sol reviews the report and separately
authorizes Gate 5C.

## 2. Governing sources and fixed hashes

Read before any command:

1. `AGENT.md`
2. `planning/SOL_ORCHESTRATION_POLICY.md`
3. `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`
4. `planning/claude-code/CLAUDE_CODE_GATE_5A_READ_ONLY_READINESS_HANDOFF.md`
5. `planning/claude-code/CLAUDE_CODE_GATE_5A_READINESS_REPORT.md`
6. `planning/claude-code/CLAUDE_CODE_GATE_5A2_ROUTE_PROVISIONING_RETRY_HANDOFF.md`
7. `planning/claude-code/CLAUDE_CODE_GATE_5A2_ROUTE_PROVISIONING_RETRY_REPORT.md`
8. `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_HANDOFF.md`, Revision 7
9. `planning/claude-code/CLAUDE_CODE_GATE_4_APP_INTEGRATION_REPORT.md`
10. `adapters/claude-code/ADAPTER.md`
11. `adapters/claude-code/BUILDER_SPEC.md`
12. `adapters/claude-code/TESTING.md`
13. `app/app/claude_adapter.py`
14. `app/engine/claude-code/build-claude-code-production.ps1`
15. `app/engine/claude-code/claude-routing-core.psm1`

Verify before asking for approval:

- Gate 5A.2 handoff SHA-256:
  `22B12F5AF1F5D3D75BA37E3DD8FB3AA5D048BFEA6403F5C9996F6042FA4864F8`
- Gate 5A.2 report SHA-256:
  `091D3E0B3A57865C2A3418B4B39F9D2F19AD0CA9E0A6664FC4E588018A10D6AD`
- Initial route-store SHA-256:
  `927EE1D5B5684ED2F48FC1CF9095662A80DFDF1A8C25733F4309D7B86582ADFA`
- Initial activity SHA-256:
  `7A48F6B0A9D51B96C35EADCCC44821A3B9863CB51DAD4A0429E311FC6CA0B186`

If any hash differs, stop `BLOCKED` before real-state access.

## 3. Known planning-boundary incident

During Sol's Gate 5B command-contract research, `claude --help` was invoked
once before this handoff existed. It exited normally and did not start an
interactive or print session. Treat this as a disclosed planning-boundary
violation, not Gate 5B evidence. Record it in the report. Do not run another
Claude command before checkpoint 1 approval.

## 4. Exact authorized effects

After both checkpoints, this handoff authorizes only:

1. Private byte snapshots under one GUID directory inside
   `%LOCALAPPDATA%\Temp\opencode`, outside the repository and outside the
   Claude target tree.
2. Read/hash/copy of these fixed labels only:
   - `USER_SETTINGS`: user `.claude/settings.json`;
   - `OPAQUE_STATE`: user `.claude.json`;
   - `PROFILE_LOCAL`: user `.claude/settings.local.json`;
   - `WORKSPACE_PROJECT`: repository `.claude/settings.json`;
   - `WORKSPACE_LOCAL`: repository `.claude/settings.local.json`;
   - `WORKSPACE_MCP`: repository `.mcp.json`;
   - `ROUTE_STORE`, `BACKUP_MANIFEST`, and `ACTIVITY_LOG` under `app/state`.
3. Metadata/hash-only inventory of the user `.claude/plugins` tree without
   following reparse points or emitting relative names.
4. A process-local credential copy from Windows `User` scope to the exact
   referenced process environment entry, cleared/restored in `finally`.
5. One in-memory adapter unlock in an isolated Python process. The on-disk
   `ALLOW_REAL_CLAUDE_TARGET = False` line must never change.
6. `-AllowRealTarget` only on production apply/restore subprocesses launched by
   that isolated process.
7. One route apply, one local `/status` print-mode check, one live print-mode
   routing request to the selected literal-loopback gateway, and one restore.
8. Deletion of only artifacts proven to have been created by this transaction,
   after successful restoration and hash verification.
9. Creation of exactly
   `planning/claude-code/CLAUDE_CODE_GATE_5B_LIVE_VALIDATION_REPORT.md`.

No other real file, process, endpoint, command, source, documentation, release,
Git state, or credential store is authorized.

## 5. Absolute prohibitions

1. Do not print or report any route value, endpoint, model ID, route ID,
   environment-reference name, secret value, target path, username, settings
   content, Claude output, prompt/session identifier, token count, cost, plugin
   name, MCP value, or private snapshot path.
2. Do not parse `OPAQUE_STATE`, `PROFILE_LOCAL`, project/local settings, MCP,
   plugin files, sessions, transcripts, credentials, OAuth state, prompts,
   memory, hooks, skills, agents, marketplaces, caches, or logs. Snapshot fixed
   files as opaque bytes only.
3. Do not enumerate or copy session, transcript, memory, cache, log, skill,
   hook, agent, marketplace, or plugin contents. Plugin verification is an
   aggregate metadata/hash manifest only.
4. Do not contact a non-loopback host, follow a redirect, use a proxy, resolve
   an arbitrary hostname, or invoke a separate discovery probe. The saved route
   must classify as literal `127.0.0.1`, `[::1]`, or `localhost`; when it is
   `localhost`, require OS resolution to return only loopback addresses before
   contact. Only the selected loopback authority is authorized. Claude's own
   route-enabled gateway discovery may occur within the two bounded CLI
   invocations and only against that authority.
5. Do not allow Claude tools, edits, browser/IDE integration, MCP, plugins,
   hooks, skills, commands, project/local settings, session persistence,
   fallback models, continuation, resume, worktrees, or dangerous permissions.
6. Do not automatically kill any process. The user closes applications; the
   worker verifies fixed-name counts only.
7. Do not modify source to unlock either lock. No source edit, temporary source
   copy, environment-controlled permanent unlock, or server start is allowed.
8. Do not invoke the app HTTP API. Use the in-process adapter functions under
   the exact one-shot unlock wrapper in section 10.
9. Do not retry apply, `/status`, live routing, restore, credential resolution,
   or a failed backup. One attempt per stage.
10. Do not commit, stage, reset, clean, checkout, restore, revert, push, amend,
    or create a worktree.
11. Do not use subagents, Graphify, screenshots, transcripts, shell history
    containing a secret, or output redirection containing private output.
12. Do not implement the deferred credential UX fix in this gate.

## 6. Checkpoint 1: explicit live-test approval

After hash-only repository/app-state preflight and before any real-state read,
copy, process action, credential access, network contact, or Claude command,
ask exactly:

```text
Gate 5B will privately snapshot the selected real Claude files and app state,
temporarily apply the one saved route, contact only its loopback gateway, run
one no-tools/no-persistence Claude request with a maximum $0.10 budget, restore
the exact pre-test state, and delete the successful snapshot. It will not print
route details, credentials, settings, or Claude output.

Reply exactly: I APPROVE GATE 5B LIVE APPLY AND RESTORE
```

Any other reply stops `BLOCKED`. Approval does not authorize Gate 5C.

## 7. Pre-snapshot validation

After checkpoint 1 approval:

1. Capture branch, HEAD, and full Git status without changing them.
2. Require `git diff --check` exit 0.
3. Require the four fixed hashes in section 2 still match.
4. Validate app state in memory without emitting values:
   - route store version 1;
   - exactly one route;
   - no applied route/fingerprint;
   - one `route_created` activity event;
   - manifest absent;
   - selected auth kind exactly one of `apiKey|authToken`;
   - selected endpoint is literal loopback;
   - model and secret-reference name are structurally valid;
   - the referenced value is present at `Process` or Windows `User` scope.
5. Require the on-disk adapter line to remain exactly
   `ALLOW_REAL_CLAUDE_TARGET = False`.
6. Require production PowerShell and schema parser checks to pass.

If any condition fails, stop before snapshot.

## 8. Private snapshot

Create one GUID snapshot root below the fixed temporary parent. Require the
parent and new root to be directories with no reparse component. Restrict work
to this exact root.

For every fixed file label in section 4:

- record existence, regular-file/reparse status, byte size, and SHA-256 in a
  private manifest;
- if present, copy exact bytes to a label-named snapshot file;
- verify copied size and SHA-256 equal the source;
- never include the source path or contents in the report.

For absent labels, record `ABSENT`; later require absence again.

Snapshot all existing `app/state` fixed files, including route and activity.
Record manifest absence. Copy no other app-state file.

Create a private plugin aggregate manifest containing only deterministic
relative-path hashes, types, sizes, and file SHA-256 values. Do not follow
reparse points. Do not emit or report its entries; report only aggregate count
and aggregate manifest SHA-256.

Record a fixed-name process count baseline for `claude`, `Code`, `Cursor`,
`Windsurf`, `idea64`, and `pycharm64`; no PIDs, paths, owners, titles, command
lines, or arguments.

## 9. Checkpoint 2: process stop

Ask exactly:

```text
The private snapshot is verified. Close every Claude Code session and every
VS Code, Cursor, Windsurf, IntelliJ, and PyCharm window now. Do not reopen them
until I report that restoration is complete.

Reply exactly: PROCESSES CLOSED FOR GATE 5B
```

After the exact reply, poll fixed executable-name counts every 500 ms for at
most 15 seconds. Require all six counts to become zero. Do not signal or kill
anything. If any remains positive, stop `BLOCKED`, delete the untouched private
snapshot after hash verification, and perform no apply.

Recompute all fixed real/app source label hashes after counts reach zero.
Require equality with the private pre-stop manifest. If any changed, stop
`BLOCKED`; preserve the snapshot only when needed for recovery, otherwise
delete it after verification.

## 10. Bounded credential and unlock wrapper

Use one PowerShell 5.1 parent process for apply, Claude checks, and restore.
Derive the secret-reference name from the one saved route in memory without
printing it. Save its current process-scope value. Resolve the value from
process scope first, otherwise Windows user scope. Require non-empty.

Set only that exact reference in the parent process for child inheritance.
Never put the value in a command line, file, report, log, or output. In an outer
`finally`, restore the original process value exactly and clear all local
variables holding the resolved value.

The isolated Python adapter process must perform exactly these in-memory
changes after importing the unchanged source:

```python
adapter.ALLOW_REAL_CLAUDE_TARGET = True
adapter.get_profile_root = lambda: Path.home()
production_run = adapter._run_production

def gate5_production_run(args, timeout=120):
    return production_run([*args, "-AllowRealTarget"], timeout=timeout)

adapter._run_production = gate5_production_run
```

Before and after each isolated process, verify the source file hash and exact
on-disk `False` line are unchanged. No imported in-memory unlock may survive
process exit.

## 11. Apply stage

The isolated apply process must:

1. Load the route store under the adapter lock.
2. Require exactly one route and no applied route.
3. Derive current full lowercase `revision` from the real target and
   `routesRevision` from the store.
4. Call `claude_status()` and validate only its exact structural field set,
   unlocked inspection state, present settings, and no pre-applied route.
5. Call `claude_route_apply(route_id,
   RouteApplyBody(expectedRevision=revision,
   expectedRoutesRevision=routesRevision))` exactly once.
6. Require success, changed target revision, changed routes revision, matching
   applied route/fingerprint, exactly one manifest entry, and one new redacted
   `route_applied` event.
7. Require the production output-created backup and app route-store backup to
   satisfy their filename, containment, no-reparse, and hash contracts.
8. Emit only `GATE5B_APPLY_OK`; do not emit returned objects or values.

On any failure, allow the adapter's existing rollback to run exactly once. If
the adapter cannot prove restoration, use section 14 emergency recovery and do
not continue to Claude invocation.

## 12. Disposable Claude checks

Use an empty GUID working directory inside the private snapshot root. Clear all
proxy variables for each child and restore them in `finally`. Reject any
selected endpoint that is no longer literal loopback immediately before each
invocation. Do not follow redirects.

Resolve the existing Claude executable once without searching fallback names.
Run `--version` once after approval and require exact installed version
`2.1.153 (Claude Code)`.

### 12.1 Status check

Run once with logical argument-array invocation equivalent to:

```text
claude --print /status --output-format json --no-session-persistence --bare
  --setting-sources user --tools "" --permission-mode dontAsk --no-chrome
  --max-budget-usd 0.10
```

Capture stdout/stderr in memory only with a 120-second timeout. Require exit 0,
one parseable JSON object, successful result subtype when present, and status
text that confirms the selected loopback gateway/provider configuration
without emitting it. If `/status` is unsupported in print mode or evidence is
ambiguous, mark the live criterion `BLOCKED` and proceed immediately to restore;
do not retry or substitute another status mechanism.

### 12.2 Routing request

Only after status passes, run exactly one request with logical argument-array
invocation equivalent to:

```text
claude --print "Reply exactly GATE5B_ROUTE_OK" --output-format json
  --no-session-persistence --bare --setting-sources user
  --disable-slash-commands --tools "" --permission-mode dontAsk --no-chrome
  --max-budget-usd 0.10
```

Require exit 0, one parseable JSON object, success subtype when present, result
text exactly `GATE5B_ROUTE_OK`, no tool-use records, and exact selected-model
evidence from output metadata. Do not accept a fallback model or infer routing
only from a successful response. Do not print or persist the JSON.

Immediately require the owned Claude child to exit and fixed process counts to
return to zero. Emit only aggregate markers:

```text
GATE5B_STATUS_OK
GATE5B_ROUTE_OK
GATE5B_MODEL_OK
GATE5B_SESSION_NOT_PERSISTED
```

## 13. Mandatory restore in `finally`

Whether status/routing passes, fails, blocks, times out, or throws, restore
before producing a report.

The isolated restore process must:

1. Apply the same in-memory unlock and `-AllowRealTarget` wrapper.
2. Recompute current target and route-store revision tokens.
3. Require exactly one eligible newest manifest entry and validate every
   manifest/backup/schema/binding/hash invariant.
4. Call `claude_restore(RestoreBody(expectedRevision=revision,
   expectedRoutesRevision=routesRevision))` exactly once.
5. Require success and target SHA-256 equal the private pre-test
   `USER_SETTINGS` snapshot.
6. Require route store restored to its pre-apply applied-id/fingerprint state
   and manifest empty/absent.
7. Emit only `GATE5B_ADAPTER_RESTORE_OK`.

After adapter restore succeeds:

- restore `ROUTE_STORE` and `ACTIVITY_LOG` byte-for-byte from the private
  snapshot using same-directory create-new temporary files and atomic replace;
- restore/verify absence for `BACKUP_MANIFEST`;
- remove only the exact target backup created by this Gate 5B apply after its
  filename, containment, ownership, and hash are revalidated;
- remove only transaction-owned app backup/temp artifacts after hash and
  ownership validation;
- never remove a pre-existing backup or unrelated file.

Then require all fixed file labels to match the private snapshot by existence,
size, and SHA-256. Require the plugin aggregate manifest unchanged. Require no
new transaction temporary file, no manifest, and no positive fixed process
count.

## 14. Emergency recovery

If adapter apply rollback or adapter restore cannot prove complete recovery:

1. Keep all fixed applications closed.
2. Restore only fixed present labels from their private byte snapshots using
   same-directory create-new temporary files plus atomic replacement.
3. Re-delete only labels recorded absent before the test and created by this
   transaction, after ownership proof.
4. Remove only exact transaction-owned target/app backup/temp artifacts after
   hash and containment proof.
5. Verify every fixed label against the private manifest and plugin aggregate.
6. If verification passes, report `FAIL_RECOVERED`; do not retry.
7. If any verification fails, retain the private snapshot, report
   `HARD_FAILURE_SNAPSHOT_RETAINED`, disclose only its opaque recovery ID, and
   stop. Do not reopen applications or attempt another mutation.

Never recursively replace or delete the Claude directory, plugin directory, or
repository state.

## 15. Snapshot disposal

Delete the private snapshot only after:

- all fixed labels equal pre-test existence/size/hash;
- plugin aggregate is unchanged;
- process-scope credential value is restored/cleared;
- both source locks are back to their original state, with the on-disk lock
  never changed;
- no transaction-owned temporary/backup remains;
- the report contains sufficient redacted aggregate evidence.

Delete only the exact GUID snapshot root after proving it is below the fixed
temporary parent, is not a reparse point, and its private manifest contains
only transaction-owned snapshot artifacts. Verify the root is absent.

## 16. Acceptance criteria

Gate 5B is `PASS` only when:

1. Both exact human checkpoints were received.
2. The fixed baseline hashes and pre-stop snapshot were verified.
3. All fixed process counts reached zero without worker signalling/killing.
4. The credential existed and was available only through bounded local process
   inheritance; no value was emitted or persisted outside the temporary real
   settings transaction.
5. Both locks opened only in the isolated process; source remained unchanged.
6. Exactly one production adapter apply passed.
7. `/status` confirmed the selected loopback route.
8. Exactly one no-tools/no-persistence routing request passed with exact model
   evidence and no fallback.
9. Exactly one production adapter restore passed, or emergency recovery fully
   restored all fixed bytes and the gate is `FAIL_RECOVERED`, not `PASS`.
10. Every fixed file/app-state label equals the private pre-test snapshot by
    existence, size, and SHA-256.
11. Plugin aggregate and all never-managed state are unchanged.
12. No process, session persistence, transaction artifact, manifest, applied
    route, process credential copy, or private snapshot remains.
13. No prohibited action occurred.

Any ambiguous model/status evidence, cleanup issue, unexpected state change,
or boundary violation forbids `PASS`.

## 17. Required report

Create `planning/claude-code/CLAUDE_CODE_GATE_5B_LIVE_VALIDATION_REPORT.md` as ASCII
Markdown only after restoration/recovery verification. Include exactly:

1. `Status`: `PASS`, `FAIL_RECOVERED`, `BLOCKED`, or
   `HARD_FAILURE_SNAPSHOT_RETAINED`.
2. `Authorization and checkpoints`: Boolean receipt only.
3. `Baseline hashes`: Gate 5A.2 handoff/report and app-state hashes.
4. `Planning-boundary incident`: the pre-handoff `claude --help` disclosure.
5. `Private snapshot`: fixed labels, existence/size/hash equality only; no
   paths; plugin aggregate count/hash; disposal or opaque retained ID.
6. `Process checkpoint`: fixed labels and aggregate zero/nonzero results only.
7. `Credential handling`: source class and cleanup Boolean only.
8. `Lock handling`: in-memory-only unlock and unchanged-source evidence.
9. `Apply evidence`: marker, exit, structural/transaction Booleans only.
10. `Status evidence`: pass/fail/blocked only; no status text.
11. `Routing/model evidence`: pass/fail only; no output, model, endpoint,
    session, tokens, or cost.
12. `Restore/recovery evidence`: marker and fixed-label equality only.
13. `Owned-artifact cleanup`.
14. `Git/source integrity`.
15. `Failures and risks`.
16. `Gate 5C recommendation`: `READY FOR SOL GATE 5C PLANNING` or `BLOCKED`;
    explicitly no authorization.

Worker response must remain redacted and include report path/SHA-256, status,
aggregate markers, restore equality, snapshot disposal, process cleanup, Git
integrity, and recommendation only.

## 18. Final boundary

Gate 5B authorizes one live transaction only after both human checkpoints. It
does not authorize Gate 5C, lifecycle/status changes, documentation updates,
release, support claims, commits, or the deferred credential UX fix.
