# Gate 1 Claude Code Research Handoff

## Authorization

- Assigned worker: DeepSeek V4 Flash Max
- Effort: Max
- Gate: Gate 1 only - confirm Claude installation and scope
- Authoritative plan: `planning/claude-code/CLAUDE_CODE_BDF_ADAPTATION_RESEARCH_PLAN.md`
- Sole authorized output: `planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md`

Gate 2, implementation, fixture creation, adapter work, and live writes to any
Claude Code file or directory are not authorized. This handoff authorizes a
read-only investigation plus creation of the single report named above.

## Goal and user-visible outcome

Collect enough redacted, reproducible evidence for Sol to decide PASS or
BLOCKED independently for every Gate 1 criterion. The user-visible outcome is
one ASCII Markdown report that identifies the installed Claude Code scope and
version, documents only safe structural metadata, and proves why Claude-owned
state can remain opaque. The report must not expose configuration values,
secrets, prompts, transcripts, plugin data, or credentials.

## Exact scope

### Authorized reads

Read only the minimum metadata needed from these exact locations:

- `C:\Users\loveb\.claude\settings.json`
- `C:\Users\loveb\.claude.json`
- `C:\Users\loveb\.claude` at directory level only, without recursively reading
  contents
- `C:\Users\loveb\.config\opencode\docs\.mcp.json`, only if present
- `C:\Users\loveb\.config\opencode\docs\.claude\settings.json`, existence and
  file metadata only, if present
- `C:\Users\loveb\.config\opencode\docs\.claude\settings.local.json`, existence
  and file metadata only, if present
- Parent directories between
  `C:\Users\loveb\.config\opencode\docs` and
  `C:\Users\loveb` only as needed to test for project/local `.claude` scope;
  inspect only the exact `settings.json` and `settings.local.json` candidate
  paths, not unrelated contents
- The process environment entry named `CLAUDE_CONFIG_DIR`, presence and
  redacted resolved-path classification only
- Claude Code executable version output
- Official Claude Code documentation cited by the authoritative research plan,
  only as needed to support the user/project/local/managed precedence statement

For JSON files other than `C:\Users\loveb\.claude.json`, inspection may derive
only top-level key names, normalized key counts, exact-name duplicate counts,
and case-collision metadata. Values must never be emitted or persisted.

Treat `C:\Users\loveb\.claude.json` as opaque. Do not parse, deserialize,
normalize, pretty-print, rewrite, or copy it. Permitted inspection is limited to
existence, type, byte size, SHA-256, and an optional streaming or lexical scan
that emits normalized key names/counts and collision metadata only. Run such a
scan only if it can guarantee that no value, source excerpt, line, context,
token, prompt, path value, or parse error containing source text can reach
stdout, stderr, logs, temporary files, or the report. Otherwise mark the
related evidence BLOCKED.

### Authorized write

- `C:\Users\loveb\.config\opencode\docs\planning\CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md`

Create exactly that one report file. Do not create logs, scripts, snapshots,
temporary files, backups, exports, screenshots, or any other artifact.

### Forbidden paths and actions

- Do not edit, replace, generate, delete, rename, or copy
  `C:\Users\loveb\.claude\settings.json`.
- Do not edit, replace, generate, delete, rename, copy, parse, normalize, or
  rewrite `C:\Users\loveb\.claude.json`.
- Do not edit or read values from any project `.claude` file or `.mcp.json`.
- Do not enter, enumerate, hash, read, or edit plugin directories, marketplace
  clones, caches, credentials, sessions, transcripts, debug logs, snapshots,
  skills, agents, hooks, or memory files.
- Do not read, write, generate, merge, rename, or delete any `.jsonc` file.
- Do not edit any managed settings, project/local settings, `.mcp.json`, plugin
  state, cache, credential store, source configuration, generated configuration,
  code, test, or documentation file other than the sole report.
- Do not run Claude interactively, authenticate, start a session, invoke a
  model, contact an MCP server, install anything, change environment variables,
  stop processes, or probe a gateway.
- Do not use commands with write side effects. The sole exception is writing
  the authorized report after evidence is collected.

## Repository, privacy, and safety constraints

1. Follow `AGENT.md`, `planning/SOL_ORCHESTRATION_POLICY.md`, and the
   authoritative research plan. If they conflict, stop and report the conflict
   to Sol without guessing.
2. Keep the investigation read-only. Record commands in redacted form if their
   expanded arguments could reveal a private path or value.
3. Never print or persist values from API keys, bearer tokens, OAuth/session
   data, environment secrets, prompt text, transcripts, plugin content, MCP
   credentials, or other secret-bearing fields.
4. Do not include JSON source excerpts, value hashes, value lengths, value
   types, line numbers tied to secret-bearing content, or error messages that
   quote input. Key names and aggregate counts are the maximum JSON detail
   allowed.
5. SHA-256 is permitted only for the named files when hashing the complete file
   is safe and the command emits only path classification plus digest. Do not
   hash individual values or forbidden directory contents.
6. Classify `CLAUDE_CONFIG_DIR` without showing its value. Report only
   `UNSET`, or `SET` plus one redacted class such as `default-user-dir`,
   `user-profile-nondefault`, `project-tree`, `other-absolute`, `relative`, or
   `unresolvable`. Do not persist the resolved path.
7. For `C:\Users\loveb\.claude`, report existence/type and aggregate immediate
   child counts only. Do not report child names and do not recurse.
8. A missing path is valid evidence, not permission to create it.
9. If safe evidence cannot be collected without exposing protected data, mark
   the applicable criterion BLOCKED. Do not weaken privacy controls to obtain a
   PASS.

## Read-only investigation procedure

1. Re-read the three governing documents and record their paths under evidence
   sources; do not modify them.
2. Establish a command discipline: no output redirection, no transcript, no
   shell history export, no temporary script, and no command that writes state.
3. Test existence and type for every authorized candidate path. For named files
   that exist, collect byte size and, where safe, whole-file SHA-256. For the
   `.claude` directory, collect only existence/type and immediate aggregate
   file/directory counts without names or recursion.
4. For `settings.json` and `.mcp.json` if present, use an in-memory inspection
   that emits only top-level key names/counts and collision metadata. Suppress
   input-bearing parser errors. Do not emit values or nested content. If the
   available method cannot meet this rule, record structural-key evidence as
   BLOCKED.
5. For `.claude.json`, collect only permitted byte-level metadata. Attempt a
   streaming/lexical duplicate-key and case-collision analysis only if the
   scanner has the guarantees stated in Exact scope. Emit normalized key names,
   occurrence counts, and collision group counts only. Never use
   `ConvertFrom-Json`, `jq`, a DOM parser, or any round-trip serializer on this
   file. If no demonstrably safe scanner is available, mark collision analysis
   BLOCKED.
6. Run the installed Claude executable's non-interactive version command and
   record only its version string and command exit status. Do not launch an
   interactive Claude session.
7. Inspect only the presence of `CLAUDE_CONFIG_DIR`; if present, resolve it in
   memory and emit only its redacted classification. Do not print the raw or
   resolved value.
8. Establish scope precedence evidence from official documentation and local
   metadata. Explicitly identify the selected target as
   `C:\Users\loveb\.claude\settings.json` at user scope. Record whether exact
   project and local candidate files exist, and document managed-scope
   precedence from official sources without reading managed values. Do not
   claim that absence of checked files proves no policy exists outside the
   authorized paths.
9. Compare the opaque-state strategy against the `.claude.json` metadata: the
   strategy must exclude the file from generation and all writes and must use
   its baseline size/SHA-256 for future unchanged-file verification. Collision
   metadata, if safely available, strengthens this evidence but never permits a
   rewrite.
10. Create only the authorized report. Before finishing, scan the report itself
    for accidental values, source excerpts, tokens, prompts, credentials,
    private environment data, or forbidden path disclosures beyond the paths
    explicitly authorized in this handoff.

## Acceptance criteria and Gate 1 mapping

Sol must assign PASS or BLOCKED separately. Do not collapse criteria or infer a
PASS from another criterion.

### G1-1 - Structural manifests

Maps one-to-one to: "Capture redacted structural manifests for
`.claude/settings.json`, `.claude.json`, `.mcp.json` if present, and
`%USERPROFILE%\\.claude`."

PASS requires a table for all four targets showing existence, type, byte size
where meaningful, safe whole-file SHA-256 where applicable, and only permitted
structural metadata. `settings.json` and `.mcp.json` may include top-level key
names/counts and collision metadata without values. `.claude.json` must remain
opaque. The `.claude` directory must have aggregate immediate child counts only.
Missing targets must be explicitly marked `NOT PRESENT`.

BLOCKED is required if a present target cannot be safely inspected to the
required level without disclosing protected data. The report must state exactly
which evidence is unavailable and why, without quoting sensitive output.

### G1-2 - Version and config-dir status

Maps one-to-one to: "Record Claude Code version and whether
`CLAUDE_CONFIG_DIR` is set."

PASS requires the exact non-secret Claude Code version string, command and exit
status, `CLAUDE_CONFIG_DIR` presence as `SET` or `UNSET`, and, when set, only the
redacted resolved-path classification. The raw environment value and resolved
path must not appear.

BLOCKED is required if version discovery would start an interactive session or
if config-dir classification cannot be produced without exposing its value.

### G1-3 - Selected user scope and precedence

Maps one-to-one to: "Confirm the selected target is user scope, not
project/local/managed scope."

PASS requires: the selected target is explicitly identified as the user-scope
`C:\Users\loveb\.claude\settings.json`; local existence/type evidence is shown
for the exact project and local candidate paths; official user, project, local,
and managed precedence is cited; the report distinguishes selection from
effective precedence; and any project/local/managed override uncertainty is
stated. No project/local/managed value may be read or shown.

BLOCKED is required if the selected scope is ambiguous, if the config-dir
classification points elsewhere and cannot be reconciled safely, or if
precedence evidence is insufficient to distinguish selected target from
effective configuration.

### G1-4 - Opaque-state collision preservation

Maps one-to-one to: "Confirm duplicate/case-colliding keys in `.claude.json`
are preserved by the chosen opaque-state strategy."

PASS requires evidence that `.claude.json` is excluded from parsing,
normalization, generation, and writes; a safe baseline byte size and SHA-256;
and either safe lexical/streaming collision metadata containing normalized key
names/counts only, or a clear explanation that the preservation guarantee is
byte-level because the file is never touched. To claim that collisions were
observed, safe scanner evidence is mandatory. Never claim exact collision
findings from the prior plan alone.

BLOCKED is required if Sol cannot determine that the strategy preserves the
file byte-for-byte, or if confirming the criterion would require parsing,
rewriting, or exposing values. Safe scanner unavailability must be reported and
must not be bypassed.

## Verification commands and evidence requirements

All investigation commands must be read-only and must emit only allowed
metadata. Use PowerShell 5.1-compatible equivalents where possible. These are
approved command shapes, not permission to broaden paths:

```powershell
Test-Path -LiteralPath '<authorized exact path>' -PathType Leaf
Test-Path -LiteralPath '<authorized exact path>' -PathType Container
Get-Item -LiteralPath '<authorized exact file>' | Select-Object Length
Get-FileHash -LiteralPath '<authorized exact file>' -Algorithm SHA256
claude --version
```

For directory aggregate counts, use a non-recursive enumeration of
`C:\Users\loveb\.claude` and emit counts only; never emit names or full paths.
For `CLAUDE_CONFIG_DIR`, use an in-memory predicate/classifier that emits only
`SET`/`UNSET` and the allowed classification label. Do not use `Get-ChildItem
Env:` or any command that dumps the environment.

JSON key inspection and `.claude.json` lexical scanning must use a reviewed
in-memory command whose output schema is fixed before execution. The fixed
schema may contain only target label, top-level key name, normalized key name,
occurrence count, exact-duplicate indicator, case-collision indicator, and
aggregate collision count. Do not include the scanner source in the report if
it embeds data. If no such safe command is already available, report BLOCKED;
do not create a script or install a tool.

The report must include:

- A criterion matrix with exactly G1-1 through G1-4, each marked PASS or
  BLOCKED, with evidence references.
- A redacted command ledger containing command shape, target label, exit code,
  and a concise allowed-output summary. Never paste raw secret-bearing output.
- A manifest table meeting G1-1 requirements.
- Claude version and redacted config-dir status/classification.
- A scope/precedence table separating selected scope, candidate scope
  existence, documented precedence, and unresolved effective-scope risks.
- An opaque-state preservation section stating that `.claude.json` is never
  parsed or changed and documenting safe collision evidence or the BLOCKED
  reason.
- Official documentation URLs and access date for precedence claims.
- A final privacy attestation that no protected values or forbidden content
  were printed, persisted, or included.

Sol should decide PASS only from evidence reproduced in the report. A command
listed without exit status and redacted result is insufficient. Prior claims in
the research plan are context, not fresh Gate 1 evidence.

## Rollback and recovery

No Claude file is authorized to change, so no normal rollback should be needed.
If any command unexpectedly writes, creates, modifies, deletes, authenticates,
or starts an interactive session:

1. Stop immediately; do not attempt an unapproved repair or restore.
2. Do not rerun the command.
3. Record the affected path or state category, command shape, observed metadata
   change, and time without exposing values.
4. Mark affected criteria BLOCKED and report the incident to Sol.
5. Leave recovery to a new, explicit human-approved handoff.

If the sole report contains sensitive data, stop and do not distribute its
contents. Report the concern to Sol and request explicit permission before any
deletion or overwrite. Do not create a replacement file on your own.

## Worker report contract

The worker's response to Sol and the report must account for:

- Changed files: exactly
  `planning/claude-code/CLAUDE_CODE_GATE_1_RESEARCH_REPORT.md`, or none if stopped before
  safe report creation.
- Commands/tests: every read-only command shape, target label, exit status, and
  redacted evidence summary; include the final report privacy check.
- Failures: command failures, unavailable tools, unsafe parser/scanner
  behavior, and every BLOCKED criterion.
- Risks: precedence uncertainty, environment redirection, opaque-state limits,
  and any evidence that could not be safely collected.
- Remaining work: unresolved Gate 1 evidence only. Do not propose or begin Gate
  2 implementation.

The worker must not claim completion merely because the report exists. It must
state PASS or BLOCKED for each criterion and leave the gate decision to Sol.

## Stop conditions

Stop immediately and report to Sol if:

- Any requested evidence would expose a secret, value, prompt, transcript,
  plugin content, MCP credential, OAuth/session data, or environment secret.
- Any tool would parse, normalize, rewrite, copy, or quote `.claude.json`.
- A command would read or create a `.jsonc` file.
- A command would write outside the sole report, create a temporary artifact,
  alter Claude state, authenticate, or start a live Claude session.
- The selected scope is ambiguous or `CLAUDE_CONFIG_DIR` cannot be classified
  without revealing its value.
- Safe collision evidence cannot be collected; mark G1-4 BLOCKED rather than
  weakening privacy.
- Governing documents conflict, an authorized path is unclear, or additional
  paths appear necessary.
- The report accidentally contains protected material. Do not overwrite or
  delete it without explicit permission.

No scope expansion is allowed without a new handoff from Sol. Gate 2,
implementation, fixtures, tests that write state, and user-approved live writes
remain explicitly unauthorized.
