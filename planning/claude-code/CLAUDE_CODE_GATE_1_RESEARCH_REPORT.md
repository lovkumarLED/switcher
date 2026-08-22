# Claude Code Gate 1 Research Report

Date: 2026-08-13
Worker: DeepSeek V4 Flash Max
Scope: Gate 1 read-only investigation only

## Executive Result

This report provides redacted evidence for Sol to make the Gate 1 decision.
The worker recommendation is PASS for all four Gate 1 criteria. Sol retains the
final decision.
The selected patch target is the user-scope file
`C:\Users\loveb\.claude\settings.json`. Selection of that target does not prove
that it is the effective source for every setting: higher-precedence managed,
command-line, local, or project sources can override or merge with it.

No Claude-owned file was modified. The only file created by this investigation
is this report.

## Criterion Matrix

| Criterion | Worker result | Evidence |
|---|---|---|
| G1-1 - Structural manifests | PASS | Manifest table M1; command ledger C1-C5 |
| G1-2 - Version and config-dir status | PASS | Runtime table R1; command ledger C6-C7 |
| G1-3 - Selected user scope and precedence | PASS | Scope table S1; official source D1; command ledger C1-C2 |
| G1-4 - Opaque-state collision preservation | PASS | Opaque-state section O1; command ledger C4 |

Each result is independent. A PASS for one criterion does not imply a PASS for
another. Sol retains the final gate decision.

## Evidence Sources

The following governing documents were required reads and were read:

- `AGENT.md`
- `planning/SOL_ORCHESTRATION_POLICY.md`
- `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`
- `planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_HANDOFF.md`

Two handoff drafting conflicts were identified. First, the procedure requires
the three governing documents to be read even though the Exact Scope authorized
read bullets do not list them. The explicit governing-document and procedure
requirements control that omission; reading those documents introduced no
privacy issue. Second, the G1-4 stop condition suggests BLOCKED whenever safe
scanner evidence is unavailable, while the authoritative plan and the specific
G1-4 acceptance rule at handoff lines 220-226 allow PASS based on a byte-level
never-touch guarantee plus baseline size and SHA-256. The authoritative plan
and criterion-specific acceptance rule govern: scanner evidence is necessary
only to claim that collisions were observed, which this report does not claim.

Official documentation used for scope and precedence:

- D1: <https://code.claude.com/docs/en/settings>, accessed 2026-08-13.

## M1 - Redacted Structural Manifest

SHA-256 values below cover complete named files, not individual values. No JSON
value, source excerpt, value hash, value length, or value type is included.

| Target | Existence/type | Bytes | Whole-file SHA-256 | Permitted structural metadata |
|---|---|---:|---|---|
| `C:\Users\loveb\.claude\settings.json` | FILE | 1405 | `5E1925C72D5A3B783A9413CF32AC5412FE28115FBE4E1A0A45928369AAC7C501` | 6 top-level keys: `effortLevel`, `enabledPlugins`, `env`, `extraKnownMarketplaces`, `model`, `theme`; collision status not assessed |
| `C:\Users\loveb\.claude.json` | FILE, treated as opaque | 51994 | `9DD81D4307C1DEECC5BEED5D83B2B8B68821659BA81C9084F0B1DF827411B0C1` | No parsing or lexical key scan performed |
| `C:\Users\loveb\.config\opencode\docs\.mcp.json` | NOT PRESENT | N/A | N/A | N/A |
| `C:\Users\loveb\.claude` | DIRECTORY | N/A | N/A | Immediate children only: 6 files, 14 directories, 0 other entries; names not enumerated |

The user settings structural inspection was in memory and emitted only the
allowlisted top-level key metadata. Nested content and all values were omitted.
No reproducible lexical collision method was used for this file, so no exact-
duplicate or case-collision conclusion is retained. G1-1 PASS relies on the
required manifest metadata, not collision findings. The absent project MCP path
was not created.

## R1 - Version And Config Directory

| Item | Redacted result |
|---|---|
| Version command | `claude --version` |
| Exit status | 0 |
| Version | `2.1.153 (Claude Code)` |
| `CLAUDE_CONFIG_DIR` | UNSET |
| Resolved-path classification | N/A because the variable is unset |

The version command was non-interactive. No Claude session was started and no
model, authentication flow, MCP server, or gateway was invoked.

## S1 - Scope And Precedence

| Scope/evidence | Candidate or documented location | Result |
|---|---|---|
| Selected user scope | `C:\Users\loveb\.claude\settings.json` | FILE; selected Gate 1 target |
| Project scope at workspace | `C:\Users\loveb\.config\opencode\docs\.claude\settings.json` | NOT PRESENT |
| Local scope at workspace | `C:\Users\loveb\.config\opencode\docs\.claude\settings.local.json` | NOT PRESENT |
| Project scope at parent `opencode` | Exact candidate inspected | NOT PRESENT |
| Local scope at parent `opencode` | Exact candidate inspected | NOT PRESENT |
| Project scope at parent `.config` | Exact candidate inspected | NOT PRESENT |
| Local scope at parent `.config` | Exact candidate inspected | NOT PRESENT |
| Local candidate at profile root | `C:\Users\loveb\.claude\settings.local.json` | FILE; 27 bytes; values not read |
| User-scope redirection | `CLAUDE_CONFIG_DIR` | UNSET |
| Managed scope | Officially documented external policy sources | Not inspected; existence and effective values remain unknown |

D1 documents Windows `~/.claude` as `%USERPROFILE%\.claude`, with settings at
user `~/.claude/settings.json`, shared project `.claude/settings.json`, and
local project `.claude/settings.local.json`. D1 gives the general priority from
highest to lowest as managed, command-line arguments, local, project, and user,
with documented merge and security-sensitive exceptions.

The selected target is therefore unambiguously the normal user-scope file, and
`CLAUDE_CONFIG_DIR` does not redirect this process. This is a target-selection
finding, not proof of effective runtime precedence. In particular, the
profile-root local candidate exists, managed policy was intentionally not
probed, command-line settings are session-dependent, and official documentation
notes setting-specific merge/precedence exceptions. Absence of checked project
files does not prove that no policy or host-provided configuration exists
outside the authorized paths.

## O1 - Opaque-State Preservation

`C:\Users\loveb\.claude.json` was never parsed, deserialized, normalized,
pretty-printed, copied, generated, rewritten, or edited. Investigation was
limited to existence/type, whole-file byte size, and whole-file SHA-256. The
opaque-state strategy excludes this file from generation and every write. A
future authorized verification can compare the baseline size and SHA-256 above
to establish byte-for-byte non-interference.

This strategy preserves every byte, including any duplicate or case-colliding
keys that may exist, because it never touches the file. Collision presence was
not observed, no scanner evidence exists, and this report makes no exact
collision claim. No pre-existing scanner was available with a demonstrated
guarantee that values, excerpts, paths, input-bearing errors, or temporary
artifacts could not escape. The unsafe path was not attempted.

The handoff's general stop condition points toward BLOCKED when scanner evidence
is unavailable, but its specific G1-4 acceptance rule at lines 220-226 expressly
permits a clear byte-level preservation guarantee because the file is never
touched. Together with the authoritative plan's opaque-state boundary and the
recorded baseline size and SHA-256, that rule establishes preservation without
asserting collision presence. G1-4 is therefore recommended PASS.

## Redacted Command Ledger

Commands are shown as safe shapes or redacted pseudocommands. Expanded private
values are not included.

| ID | Command shape | Target label | Exit | Allowed-output summary |
|---|---|---|---:|---|
| C1 | `Test-Path` plus `Get-Item ... Length` over the authorized exact candidates | Named files and exact parent-scope candidates | 1 | First attempt had a PowerShell pipeline syntax error before accessing targets; no source data emitted |
| C2 | Corrected in-memory loop using `Test-Path` and `Get-Item ... Length` | Named files and exact parent-scope candidates | 0 | Emitted only target labels, FILE/NOT PRESENT, and byte sizes shown in M1/S1 |
| C3 | Non-recursive `[System.IO.Directory]::EnumerateFileSystemEntries(...)` with aggregate counters | User Claude directory | 0 | 6 immediate files, 14 immediate directories, 0 other; no names or recursion |
| C4 | `Get-FileHash -Algorithm SHA256` for authorized existing named files | User settings and opaque state | 0 | Whole-file hashes shown in M1; absent MCP file was not hashed |
| C5 | In-memory JSON inspection with fixed metadata-only output; parser errors suppressed | User settings | 0 | Six allowlisted top-level key names/counts; no values or nested content; collision status not assessed |
| C6 | In-memory single-variable presence/classification predicate | `CLAUDE_CONFIG_DIR` | 0 | UNSET; raw environment value was not emitted |
| C7 | `claude --version` | Claude executable | 0 | `2.1.153 (Claude Code)`; non-interactive |
| C8 | Official-domain web search restricted to settings/scope documentation | D1 | 0 | Official excerpt supplied Windows location and scope precedence; no local data transmitted |

No output redirection, transcript, temporary script, screenshot, environment
dump, installation, interactive Claude invocation, or state-writing command was
used during evidence collection.

## Failures And Risks

- C1 failed with a PowerShell syntax error and was replaced by C2. It made no
  state change and emitted no protected source data.
- The handoff contains the two drafting conflicts documented under Evidence
  Sources. They were resolved using its explicit required-read instruction and
  its criterion-specific G1-4 acceptance rule together with the authoritative
  plan.
- Collision presence was not observed in either JSON file, and no scanner
  evidence exists. PASS does not depend on a claim that collisions exist.
- The profile-root local candidate exists. Its values were not read, so its
  effective impact is unknown.
- Managed, host-provided, command-line, and setting-specific merge/override
  effects remain possible. Managed values and locations were not probed.
- The opaque-state size/hash proves a baseline and supports future unchanged
  verification; it does not describe the file's semantic contents.
- Runtime status was not checked interactively because doing so was forbidden.

## Remaining Gate 1 Work

- Sol must independently decide G1-1 through G1-4 from this report; the worker
  recommendation is PASS for all four criteria.
- No additional machine research is required for the worker recommendations.
- No Gate 2 work is included or authorized.

## Privacy Attestation

No API key, bearer token, OAuth/session value, prompt, transcript, plugin data,
MCP credential, JSON value, nested JSON content, private environment value, or
source excerpt was printed, copied, persisted, or included in this report. No
plugin, cache, credential, session, transcript, debug, snapshot, skill, agent,
hook, or memory directory was entered or enumerated. No `.jsonc` file was read
or changed. The only persisted artifact is this ASCII Markdown report.
