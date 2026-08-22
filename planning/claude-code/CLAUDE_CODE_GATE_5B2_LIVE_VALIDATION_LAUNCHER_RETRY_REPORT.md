# Claude Code Gate 5B.2 Live Validation Launcher Retry Report

Worker: DeepSeek V4 Flash Max (Effort: Max)
Date: 2026-08-14
Lifecycle status: **Integrated, not live validated**

## 1. Status

FAIL_RECOVERED. The complete bounded live transaction executed exactly one
production adapter apply and exactly one production adapter restore in
`finally`, with full byte recovery verified and the private snapshot
disposed. The non-Claude serializer capability test passed
(`POWERSHELL51_SERIALIZED_LAUNCHER_OK=True`), but every Claude CLI evidence
stage received ZERO launched attempts: the PowerShell-resolved `claude`
command is an ExternalScript (`claude.ps1`), which `ProcessStartInfo.FileName`
cannot start as a process, so `Start()` threw before any process was created
(`The specified executable is not a valid application for this OS
platform`). The apply stage already ran once in this gate, and prohibition 9
forbids retrying apply, so the gate cannot reach `PASS`; because complete
byte recovery was proven and verified, it is `FAIL_RECOVERED`.

## 2. Authorization and checkpoints

- Checkpoint 1 received verbatim: `I APPROVE GATE 5B.2 LIVE APPLY AND RESTORE`.
- Checkpoint 2 received verbatim: `HOST IDE ONLY FOR GATE 5B.2`.
- Gate 5B.2 authorization only; Gate 5C unauthorized and not performed.

## 3. Baseline hashes

- Gate 5B handoff: `37B9771013AC6D2143180782B865B406F57010EC3D6686C3020847615F4339C3` - verified exact.
- Gate 5B.1 handoff: `A39F917EE5256263744868BB6E18A5AB0AC8419550D7F64D71E1DDD57C36807C` - verified exact.
- Gate 5B.1 FAIL_RECOVERED report: `4B0CDAB01492F341D06D1946262A4E0DDA7AB30B461CCC0143D8E9D58259935E` - verified exact.
- Route store: `927EE1D5B5684ED2F48FC1CF9095662A80DFDF1A8C25733F4309D7B86582ADFA` - verified exact.
- Activity: `7A48F6B0A9D51B96C35EADCCC44821A3B9863CB51DAD4A0429E311FC6CA0B186` - verified exact.
- Manifest absent; no Gate 5B report; no Gate 5B.2 report at start.

## 4. Planning-boundary incident

The pre-handoff `claude --help` invocation disclosed in the Gate 5B handoff
remains recorded as a planning-boundary violation, not Gate 5B evidence. No
other Claude command ran before checkpoint 1 in any gate attempt.

## 5. Serializer capability test (section 5)

- Non-Claude test with the app Python under `-I -S`; logical array appended
  exactly: empty string, `a b`, `q"r`, `trail\`.
- Launched through `ProcessStartInfo.Arguments` using the exact Gate 3
  serializer functions, `UseShellExecute=false`, `CreateNoWindow=true`,
  in-memory standard output/error capture.
- Result: exit 0, empty stderr, parseable JSON, exact ordinal equality of
  all four values.
- Marker: `POWERSHELL51_SERIALIZED_LAUNCHER_OK=True`.
- Static `.ArgumentList` scan: zero occurrences in the executed parent
  script.

## 6. Process checkpoint

- `claude` pre-apply count: zero.
- Other IDE-family counts (Cursor, Windsurf, idea64, pycharm64): zero.
- Host exception: exactly one Code root tree (`HOST_CODE_TREE_COUNT=1`),
  verified at checkpoint, after probe 1, after probe 2, and post-restore.
- No process was signalled, suspended, or killed by the worker except the
  never-created owned CLI children (no owned timeout cleanup was needed).

## 7. Private snapshot

- Fixed labels (existence/size/SHA-256 verified): USER_SETTINGS present
  (1405 B), OPAQUE_STATE present (51994 B), PROFILE_LOCAL present (27 B),
  WORKSPACE_PROJECT ABSENT, WORKSPACE_LOCAL ABSENT, WORKSPACE_MCP ABSENT,
  ROUTE_STORE present (603 B), BACKUP_MANIFEST ABSENT, ACTIVITY_LOG present
  (101 B). All present copies verified byte-equal.
- Plugin aggregate: count 5046; aggregate SHA-256
  `deda484ebeeab70776d379205f98bf89cce770e748c965a6f9157b531f393529`;
  unchanged after the transaction.
- Disposal: root verified below the fixed temporary parent, not a reparse
  point, containing only transaction-owned artifacts; deleted after full
  equality; verified absent. No opaque retained ID.

## 8. Exclusive-open safety

- Probe 1: pass (FileShare.None read open on USER_SETTINGS; all five
  immediate checks passed).
- Probe 2 (inside the apply parent, immediately before apply): pass; all
  five immediate checks passed with no unrelated command between.
- Revision guard: pass (apply accepted the expected target revision;
  restore accepted it again).

## 9. Credential handling

- Source class: USER (resolved from Windows user scope into the single
  parent process environment for child inheritance only).
- Original process-scope value saved; value never placed in a command line,
  file, report, log, or output; restored exactly and all local variables
  holding the resolved value cleared in the outer `finally`.

## 10. Lock handling

- In-memory-only unlock in isolated Python processes (`ALLOW_REAL_CLAUDE_TARGET
  = True`, `get_profile_root = Path.home()`, `_run_production` wrapped to
  append `-AllowRealTarget` for production subprocesses only).
- On-disk line unchanged: exactly `ALLOW_REAL_CLAUDE_TARGET = False` before
  and after. No in-memory unlock survived process exit.

## 11. Apply evidence

- Marker: `GATE5B_APPLY_OK`; exit 0.
- Exactly one production adapter apply via `claude_route_apply` with
  `RouteApplyBody(expectedRevision, expectedRoutesRevision)`.
- All structural/transaction Booleans true: one route, no applied route
  pre-apply; `claude_status()` exact field set, unlocked inspection state,
  present settings, no pre-applied route; target revision changed; routes
  revision changed; applied route ID/fingerprint match; one manifest entry;
  one `route_applied` event; production and app backups passed filename,
  containment, no-reparse, and hash contracts.

## 12. Status evidence

BLOCKED (no launched attempt). The `/status` print-mode check could not be
launched: the resolved `claude` command is an ExternalScript (`claude.ps1`),
and `ProcessStartInfo.FileName` rejected it at `Start()` before any process
existed. No status text was emitted or recorded. Not retried per prohibition
9; no substitute mechanism used.

## 13. Routing/model evidence

BLOCKED (no launched attempt). The single routing request was not launched
for the same reason. No output, model, endpoint, session, token, or cost
data exists. `GATE5B_STATUS_OK`, `GATE5B_ROUTE_OK`, `GATE5B_MODEL_OK`, and
`GATE5B_SESSION_NOT_PERSISTED` were not emitted.

## 14. Restore/recovery evidence

- Marker: `GATE5B_ADAPTER_RESTORE_OK`; exit 0.
- Exactly one production adapter restore via `claude_restore` with
  `RestoreBody(expectedRevision, expectedRoutesRevision)`; target SHA-256
  equals the private pre-test USER_SETTINGS snapshot
  (`5e1925c72d5a3b783a9413cf32ac5412fe28115fbe4e1a0a45928369aac7c501`).
- Route store and activity byte-restored from the snapshot; both SHA-256
  equal the initial baselines. BACKUP_MANIFEST restored to ABSENT.
- Apply-created target backup removed after filename, containment,
  ownership, and hash revalidation.
- Post-restore fixed-label equality: `ALL_FIXED_LABELS_EQUAL_SNAPSHOT=True`.

## 15. Owned-artifact cleanup

- Apply-created target backup: removed (revalidated).
- Transaction-owned app backup/temp artifacts: none remained after adapter
  restore. App state contains only the two restored files.
- No snapshot, GUID workdir, or transaction temporary file remains.

## 16. Git/source integrity

- Branch main, HEAD `0d69cc7b6ad20822d0fe0bc7f63fea2ddc59d7f1` unchanged.
- `git diff --check`: exit 0. `git status --short -- app/state`: empty.
- Route store `927EE1D5...82ADFA`; activity `7A48F6B0...0B186`; manifest
  absent. No commit/stage/reset/clean/checkout/restore/revert/push/amend or
  worktree.

## 17. Failures and risks

- Blocker: the PowerShell-resolved `claude` command is `claude.ps1`
  (ExternalScript). `ProcessStartInfo.FileName` requires an executable
  image; a `.ps1` script cannot be started that way, so `Start()` threw and
  zero Claude processes were ever created. The Gate 3 serializer itself is
  proven correct (capability test passed, including the empty-tools
  round-trip). A future attempt must launch the resolved Claude command
  through an executable capable of running it (for example, the CLI host
  that executes `claude.ps1`, still via `ProcessStartInfo.Arguments` with
  the exact serializer, or a true executable form of the command), without
  weakening any capture or redaction rule.
- No owned timeout cleanup was needed; no `taskkill` was invoked.
- The live transaction (apply + restore) succeeded and recovery was fully
  verified; no real-state residue remains.

## 18. Gate 5C recommendation

BLOCKED. No status or routing evidence exists; Gate 5C
(documentation/status/release synchronization) remains unauthorized and must
not be planned or drafted until a successful Gate 5B.2 PASS report with
status and routing evidence exists. Lifecycle status remains exactly
`Integrated, not live validated`.

---

Required additions (handoff section 10):

- Gate 5B.1 report baseline: `4B0CDAB01492F341D06D1946262A4E0DDA7AB30B461CCC0143D8E9D58259935E` (`FAIL_RECOVERED`).
- `POWERSHELL51_SERIALIZED_LAUNCHER_OK=True`.
- `.ArgumentList` static count: 0.
- Per-stage launch-attempt counts: version 0 launched, status 0 launched, routing 0 launched (each `Start()` threw before process creation; no retry).
- Empty-tools round-trip Boolean: true (capability test; the routing array's empty `--tools` value was serialized as `""`).
- Owned timeout cleanup Boolean: not needed (no process ever started).
- In-memory stream disposal/redaction Boolean: true (stdout/stderr never printed, written, logged, or reported; process and stream tasks disposed in `finally`).
- Gate 5C recommendation: BLOCKED, explicitly not authorization.
