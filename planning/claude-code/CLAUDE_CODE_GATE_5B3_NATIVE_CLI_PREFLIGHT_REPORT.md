# Claude Code Gate 5B.3 Native CLI Preflight Report

Worker: DeepSeek V4 Flash Max (Effort: Max)
Date: 2026-08-14
Lifecycle status: **Integrated, not live validated**

## 1. Status

BLOCKED. Native executable qualification passed, the serializer capability
test passed, but the mandatory native version preflight failed before any
real-state access: one captured `--version` attempt against the single
trusted native `claude.exe` exited 0 with empty stderr, yet its trimmed
stdout did not equal the exact required string `2.1.153 (Claude Code)`.
Per handoff section 6, any preflight failure stops BLOCKED with zero
real-state access: no snapshot, no credential resolution, no unlock, no
apply, no gateway contact, no retry, and no alternate command form was
used. This report carries the explicit zero-real-state attestation.

## 2. Authorization and checkpoints

- Checkpoint 1 received verbatim: `I APPROVE GATE 5B.3 NATIVE PREFLIGHT AND LIVE RESTORE`.
- Checkpoint 2 not reached (preflight failed before snapshot; not asked).
- Gate 5B.3 authorization only; Gate 5C unauthorized and not performed.

## 3. Baseline hashes

- Gate 5B handoff: `37B9771013AC6D2143180782B865B406F57010EC3D6686C3020847615F4339C3` - verified exact.
- Gate 5B.1 handoff: `A39F917EE5256263744868BB6E18A5AB0AC8419550D7F64D71E1DDD57C36807C` - verified exact.
- Gate 5B.2 handoff: `DD631144A33CECF0B2A37F3C58634C87333177CA2B23226A438B85359ACDB48F` - verified exact.
- Gate 5B.2 FAIL_RECOVERED report: `C86E929EE35BFFBE78C9A342459CC6B4549C956F6ABF6502B462876226568C61` - verified exact.
- Route store: `927EE1D5B5684ED2F48FC1CF9095662A80DFDF1A8C25733F4309D7B86582ADFA` - verified exact.
- Activity: `7A48F6B0A9D51B96C35EADCCC44821A3B9863CB51DAD4A0429E311FC6CA0B186` - verified exact.
- Manifest absent; Gate 5B.3 report path absent at start.

## 4. Planning-boundary incident

The pre-handoff `claude --help` invocation disclosed in the Gate 5B handoff
remains recorded as a planning-boundary violation, not Gate 5B evidence.

## 5. Native executable resolution (section 4)

- `NATIVE_CLAUDE_CANDIDATE_COUNT=1` (exactly one Application with a `.exe`
  leaf).
- `NATIVE_CLAUDE_LEAF_TRUSTED=True` (leaf filename equals `claude.exe`
  case-insensitively; absolute canonical existing regular-file leaf; no
  reparse point at the leaf or in any component below the stable existing
  parent boundary).
- The canonical path was stored in memory only and never emitted. The
  PowerShell, CMD, extensionless, and other application forms were not
  inspected or invoked.

## 6. Serializer capability test (section 5)

- Non-Claude Python `-I -S` capability test with the exact Gate 3
  serializer through `ProcessStartInfo.Arguments`: empty string, `a b`,
  `q"r`, and `trail\` all round-tripped with exact ordinal equality; exit
  0; empty stderr; parseable JSON.
- `POWERSHELL51_SERIALIZED_LAUNCHER_OK=True`.
- `.ArgumentList` static count: 0.

## 7. Native version preflight (section 6)

- Attempt count: exactly one launched attempt.
- `Start()` returned true; exit 0; stderr empty; trimmed stdout did NOT
  equal the exact required string `2.1.153 (Claude Code)`.
- The version string itself was not emitted, retained, or reported.
- Every transient `claude` process belonged to the privately captured owned
  child tree; the aggregate `claude` count returned to zero after exit.
- stdout/stderr/process variables were disposed and cleared without
  emission. Proxy variables were cleared for the child and restored in
  `finally`.
- Preflight working directory: empty GUID directory below the fixed
  temporary parent, no reparse point, verified empty after the child,
  deleted after containment/ownership/emptiness proof.
- Result: `GATE5B3_NATIVE_VERSION_OK=False` -> BLOCKED.

## 8. Real-state access attestation

ZERO real-state access occurred: no Claude file was read, hashed, parsed,
copied, or written; no private snapshot was created; no credential was
resolved from any scope; no in-memory unlock was applied; no adapter apply
or restore ran; no gateway, DNS, or network contact occurred; no process
was signalled, suspended, or killed by the worker beyond the exact owned
preflight child cleanup (which completed within its timeout; no `taskkill`
was needed).

## 9. Process checkpoint

- `claude` count: zero before and after preflight.
- Other IDE-family counts (Cursor, Windsurf, idea64, pycharm64): zero.
- Code host tree: one root tree (unchanged; the single VS Code host
  remained open).

## 10. Lock handling

- On-disk line remains exactly `ALLOW_REAL_CLAUDE_TARGET = False`;
  unchanged (verified before the gate).
- No in-memory unlock was performed.

## 11. Git/source integrity

- Branch main, HEAD `0d69cc7b6ad20822d0fe0bc7f63fea2ddc59d7f1` unchanged.
- `git diff --check`: exit 0.
- `git status --short -- app/state`: empty.
- No commit, stage, reset, clean, checkout, restore, revert, push, amend,
  or worktree. No file was created except this report.

## 12. Failures and risks

- Blocker (redacted): the single trusted native `claude.exe` returned a
  version string that does not exactly match the required `2.1.153 (Claude
  Code)`. The preflight could be mismatched with the Gate 1 observed
  version, the machine's native CLI may have been updated, or the `.exe`
  form may be a stub/wrapper whose version output differs from the
  PowerShell form observed in Gate 1 and Gate 5A. The exact output is not
  reproduced.
- Risk: if the machine's native `claude.exe` version genuinely differs,
  the required exact-version acceptance cannot pass with this binary; Sol
  must decide whether to qualify a different native binary under a new
  handoff or accept a different observed version with updated evidence.
- No other failures observed. No rollback was needed (nothing was created
  or mutated).

## 13. Gate 5C recommendation

BLOCKED. No live status or routing evidence exists; Gate 5C
(documentation/status/release synchronization) remains unauthorized and must
not be planned or drafted until a successful Gate 5B.3 PASS report exists.
Lifecycle status remains exactly `Integrated, not live validated`.

---

Required additions (handoff section 10):

- Gate 5B.2 report hash/status: `C86E929EE35BFFBE78C9A342459CC6B4549C956F6ABF6502B462876226568C61` (`FAIL_RECOVERED`).
- Native candidate/trusted-leaf Booleans: `NATIVE_CLAUDE_CANDIDATE_COUNT=1`, `NATIVE_CLAUDE_LEAF_TRUSTED=True`.
- Serializer capability and `.ArgumentList` count: `POWERSHELL51_SERIALIZED_LAUNCHER_OK=True`, count 0.
- Version preflight attempt count/result: 1 attempt, mismatch with required exact string; preceded all real-state access.
- Status/routing attempt counts: 0 / 0 (not reached).
- Owned-child and timeout cleanup aggregate evidence: owned preflight child exited within timeout; `claude` count returned to zero; no owned timeout cleanup needed.
- Complete restore/snapshot disposal evidence: not applicable (no snapshot or apply occurred).
- Gate 5C recommendation: BLOCKED, explicitly not authorization.
