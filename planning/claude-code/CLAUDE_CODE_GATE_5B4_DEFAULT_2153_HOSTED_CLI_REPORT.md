# Claude Code Gate 5B.4 Default 2.1.153 Hosted CLI Report

Worker: DeepSeek V4 Flash Max (Effort: Max)
Date: 2026-08-14
Lifecycle status: **Integrated, not live validated**

## 1. Status

HARD_FAILURE. The complete bounded transaction executed (one apply, one
hosted `/status`, one hosted routing request, one restore in `finally`), but
post-restore verification failed on two never-managed labels, and the
private snapshot was deleted before equality verification passed (worker
error), so the pre-test bytes of those labels are not restorable from this
gate's artifacts:

- `OPAQUE_STATE` changed: 51994 -> 53152 bytes; SHA-256
  `9dd81d4307c1deecc5beed5d83b2b8b68821659ba81c9084f0b1df827411b0c1` ->
  `9a58c1f59d766e8f163725a846b45f90f5d7bd827f111bd4dcec8cbeb8691d1b`
  (stable across two reads). This is the user's `.claude.json`, mutated by
  Claude Code itself during the hosted live invocations; it is a
  hash-only never-parse boundary, and this gate holds no copy of its
  pre-test bytes.
- Plugin tree changed: 5046 -> 5053 files (aggregate manifest SHA-256 of
  the snapshot's own manifest unchanged because it was captured at
  snapshot time). The seven added files were not enumerated or inspected
  (plugin contents are off-limits); their removal is not authorized.
- `USER_SETTINGS`, `ROUTE_STORE`, `ACTIVITY_LOG`, `BACKUP_MANIFEST`, and
  the apply-created target backup all restored and verified equal to the
  private snapshot.
- Additionally, the live evidence stages did not pass acceptance:
  `/status` JSON parsed but showed no selected-model evidence;
  the routing request returned exit 0, parseable JSON, exact
  `GATE5B_ROUTE_OK` text, and model evidence, but contained a tool-use
  record substring, which the handoff forbids.

The gate is not `PASS` and not `FAIL_RECOVERED` (recovery is not complete
for `OPAQUE_STATE` and the plugin tree). The snapshot is not retained
(worker error), so `HARD_FAILURE_SNAPSHOT_RETAINED` is also false as
defined. This report discloses the facts; no further mutation is attempted.

## 2. Authorization and checkpoints

- Checkpoint 1 received verbatim: `I APPROVE GATE 5B.4 DEFAULT 2.1.153 LIVE RESTORE`.
- Checkpoint 2 received verbatim: `HOST IDE ONLY FOR GATE 5B.4`.
- Gate 5B.4 authorization only; Gate 5C unauthorized and not performed.

## 3. Baseline hashes

- Gate 5B handoff `37B9771013AC6D2143180782B865B406F57010EC3D6686C3020847615F4339C3` - exact.
- Gate 5B.1 handoff `A39F917EE5256263744868BB6E18A5AB0AC8419550D7F64D71E1DDD57C36807C` - exact.
- Gate 5B.2 handoff `DD631144A33CECF0B2A37F3C58634C87333177CA2B23226A438B85359ACDB48F` - exact.
- Gate 5B.3 handoff `BD6CA0DCE357160D30AC95DA779638EAFDEF1DD5AB5D72CABBD4C3D2011D2EB1` - exact.
- Gate 5B.3 BLOCKED report `F964BCAE23FA6AF73354102F903E0BEA74AEE8C841C6D103046FA559F68199B3` - exact.
- Route store `927EE1D5B5684ED2F48FC1CF9095662A80DFDF1A8C25733F4309D7B86582ADFA` - exact.
- Activity `7A48F6B0A9D51B96C35EADCCC44821A3B9863CB51DAD4A0429E311FC6CA0B186` - exact.
- Manifest absent; Gate 5B.4 report path absent at start.

## 4. Planning-boundary incident

The pre-handoff `claude --help` invocation disclosed in the Gate 5B handoff
remains a recorded planning-boundary violation, not Gate 5B evidence.

## 5. FCC protection attestation

ZERO access or mutation of the FCC toolchain: no enumeration, inspection,
hash, invocation, update, rename, move, delete, quarantine, repair, or
comparison of the native `claude.exe` form, the extensionless or CMD forms,
`free-claude-code.exe`, `fcc-claude.exe`, `fcc-codex.exe`, `fcc-init.exe`,
`fcc-server.exe`, or any file under the user's `.local\bin` directory.
`Get-Command claude -All` was never run; only `Get-Command claude` was used.

## 6. Default script and host trust

- `DEFAULT_CLAUDE_EXTERNAL_SCRIPT=True` (single ExternalScript result, leaf
  `claude.ps1` with `.ps1` extension, canonical existing regular-file leaf,
  no reparse point at the leaf or below the stable existing parent
  boundary; path kept in memory only, contents never read).
- `POWERSHELL_HOST_TRUSTED=True` (host resolved only as
  `[IO.Path]::Combine($PSHOME, 'powershell.exe')`; canonical existing
  regular `.exe` leaf, no reparse point).
- No other host or command form was searched or used.

## 7. Serializer capability

- `POWERSHELL51_SERIALIZED_LAUNCHER_OK=True` (non-Claude app-Python `-I -S`
  test: empty string, `a b`, `q"r`, `trail\` round-tripped with exact
  ordinal equality; exit 0; empty stderr; parseable JSON).
- `.ArgumentList` static count: 0. No `Start-Process`, native `&`
  invocation, `cmd.exe`, or shell command string was used for Claude stages.

## 8. Hosted version preflight

- Attempt count: exactly one.
- Child started, exit 0 within 30 s, stderr empty, trimmed stdout exactly
  `2.1.153 (Claude Code)`.
- Marker: `GATE5B4_DEFAULT_VERSION_OK=True`.
- All transient processes belonged to the privately captured
  PowerShell-rooted child tree; aggregate `claude` count returned to zero.
- Streams/process objects cleared without emission; preflight working
  directory verified empty and deleted.
- Ordering: preflight completed before any real-state access, snapshot,
  credential resolution, unlock, apply, or network contact.

## 9. Process checkpoint

- `claude` 0; Cursor/Windsurf/idea64/pycharm64 0; exactly one Code root
  tree (verified at checkpoint, after probe 1, after probe 2, and
  post-restore). No process was signalled, suspended, or killed by the
  worker beyond the exact owned hosted-child trees (no timeout cleanup
  was needed; no `taskkill` was invoked).

## 10. Private snapshot

- Fixed labels captured with existence/size/SHA-256 and byte-verified
  copies: USER_SETTINGS present (1405 B), OPAQUE_STATE present (51994 B),
  PROFILE_LOCAL present (27 B), WORKSPACE_PROJECT ABSENT, WORKSPACE_LOCAL
  ABSENT, WORKSPACE_MCP ABSENT, ROUTE_STORE present (603 B),
  BACKUP_MANIFEST ABSENT, ACTIVITY_LOG present (101 B).
- Plugin aggregate at snapshot time: count 5046; aggregate manifest
  SHA-256 `deda484ebeeab70776d379205f98bf89cce770e748c965a6f9157b531f393529`.
- Snapshot root: GUID directory below the fixed temporary parent, no
  reparse component, transaction-owned contents only.

## 11. Exclusive-open safety

- Probe 1: pass; all five immediate checks passed (USER_SETTINGS, route
  store, activity hashes; manifest absent; claude 0; one Code tree).
- Probe 2 (immediately before apply): pass; same checks passed again with
  no unrelated command between.
- Revision guard: pass (apply and restore each accepted the expected
  target revision).

## 12. Credential handling

- Source class: USER (resolved from Windows user scope into bounded
  process scope for child inheritance only).
- Verified after the transaction: process-scope value empty; user-scope
  value still present. No name or value was printed or persisted.

## 13. Lock handling

- In-memory-only unlock in isolated Python processes with
  `-AllowRealTarget` on production subprocesses only.
- On-disk line unchanged: exactly `ALLOW_REAL_CLAUDE_TARGET = False`.
- No in-memory unlock survived process exit.

## 14. Apply evidence

- Marker: `GATE5B_APPLY_OK`; exit 0; exactly one production adapter apply.
- All structural/transaction Booleans true (route store invariants,
  status field set, revision changes, applied ID/fingerprint, one manifest
  entry, `route_applied` event, backup contracts).

## 15. Status evidence

- Attempts: exactly one launched.
- Exit 0; stdout parseable JSON; selected-model evidence: FALSE. Per the
  handoff, `/status` must confirm the selected loopback route; ambiguous
  evidence forbids PASS. No status content was emitted.

## 16. Routing/model evidence

- Attempts: exactly one launched (after status ran).
- Exit 0; parseable JSON; exact `GATE5B_ROUTE_OK` text: true;
  selected-model evidence: true; no-tool-use requirement: FALSE (a
  tool-use record substring was present in the captured output). The
  handoff states any attempted tool use fails the gate.
- `--disallowedTools *` was present as the literal two-element
  option/value pair in both live arrays. No output content was emitted or
  persisted.

## 17. Restore/recovery evidence

- Marker: `GATE5B_ADAPTER_RESTORE_OK`; exit 0; exactly one production
  adapter restore; USER_SETTINGS SHA-256 equals the pre-test snapshot.
- Route store and activity byte-restored to initial hashes.
- BACKUP_MANIFEST restored to ABSENT; apply-created target backup removed
  after revalidation.
- Post-restore verification: `USER_SETTINGS`, `ROUTE_STORE`,
  `ACTIVITY_LOG`, `BACKUP_MANIFEST` equal; `OPAQUE_STATE` NOT equal
  (changed); plugin tree count NOT equal (5046 -> 5053).

## 18. Owned-artifact cleanup

- Apply-created target backup: removed (revalidated).
- Transaction-owned app backups/temps: none remained after adapter
  restore; app state contains only the two restored files.
- No snapshot, GUID workdir, or transaction temporary file remains
  (snapshot deleted - see section 19).

## 19. Failures, risks, and worker error disclosure

- Blocker 1 (live evidence): `/status` showed no selected-model evidence,
  and the routing output contained a tool-use record substring. The gate
  forbids both conditions.
- Blocker 2 (never-managed state): the hosted Claude CLI invocations
  mutated `OPAQUE_STATE` (51994 -> 53152 bytes; hash changed and stable)
  and added seven plugin-tree files (5046 -> 5053). These are Claude-owned
  and were only hash-observed; this gate holds no pre-test bytes for them.
- Worker error: the private snapshot was deleted before full equality
  verification passed. The handoff (section 14) requires retaining the
  snapshot when any verification fails; I did not. Therefore
  `HARD_FAILURE_SNAPSHOT_RETAINED` cannot be truthfully claimed, and the
  pre-test bytes of `OPAQUE_STATE` and the plugin tree are not available
  from this gate.
- No further mutation is attempted. The user should assess whether their
  own backups can restore `.claude.json` and the plugin tree, and whether
  the seven added plugin files are acceptable.
- Risk: Claude Code 2.1.153 mutates `.claude.json` (and plugin state)
  during even `--print --no-session-persistence --bare` invocations; any
  future live gate must treat these labels as writable-by-Claude and plan
  recovery accordingly, or add explicit protection checks before/after
  each CLI invocation.

## 20. Gate 5C recommendation

BLOCKED. Live evidence failed and never-managed state changed; Gate 5C
(documentation/status/release synchronization) remains unauthorized and must
not be planned or drafted until a successful Gate 5B.4 PASS report exists.
Lifecycle status remains exactly `Integrated, not live validated`.

---

Required additions (handoff section 11):

- Gate 5B.3 report hash/status: `F964BCAE23FA6AF73354102F903E0BEA74AEE8C841C6D103046FA559F68199B3` (`BLOCKED`).
- FCC protection attestation: zero access/mutation (section 5).
- Default-script and PowerShell-host trust Booleans: both true (section 6).
- Serializer capability and `.ArgumentList` count: true / 0 (section 7).
- Hosted version preflight result/attempt count and pre-real-state ordering: `GATE5B4_DEFAULT_VERSION_OK=True`, 1 attempt, before all real-state access (section 8).
- Status/routing attempt counts and pass/fail only: status 1 attempt FAIL; routing 1 attempt FAIL (tool-use record) (sections 15-16).
- Wildcard tool-denial presence and no-tool-use result: `--disallowedTools *` present in both arrays; no-tool-use FAILED.
- Owned hosted-child cleanup and timeout aggregate evidence: no timeout; owned children exited; `claude` count zero; no `taskkill` needed.
- Restore/equality/snapshot disposal evidence when apply occurred: restore OK; equality FAILED on OPAQUE_STATE and plugin tree; snapshot disposed (section 19).
- Gate 5C recommendation: BLOCKED, explicitly not authorization.
