# Claude Code Gate 5B — Corrected Live Validation PASS Report

Date: 2026-08-17 (sessions 46 + 48)
Contract: `planning/claude-code/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md` §9
("Corrected live-validation semantics") and §13 ("Completion sequence")
Status: **PASS — corrected Gate 5B live validation complete**
Lifecycle after this gate: **Live validated** (Gate 5C approved separately,
2026-08-17; see `planning/claude-code/CLAUDE_CODE_GATE_5C_DOCUMENTATION_RELEASE_SYNC_REPORT.md`)

## 1. Result

The corrected Gate 5B live validation of the Claude Code routing adapter
against the real user-scope `.claude/settings.json` PASSED. Session 46 proved
every transaction mechanic; the routing-evidence stage was blocked by an
upstream OmniRoute free-tier credential cooldown (429, environmental). Session
48 retried against the same loopback omniroute gateway after the cooldown
cleared and secured the missing routing evidence. No BDF/app defect was found
in either run.

## 2. Scope exercised (§9.1-§9.2)

- Qualified ONLY the default Claude Code 2.1.153 PowerShell-resolved command:
  `Get-Command claude` (no `-All`) -> single ExternalScript leaf `claude.ps1`,
  no reparse point, host `PSHOME\powershell.exe` exists; hosted version
  preflight exactly one attempt -> exit 0, stdout exactly
  `2.1.153 (Claude Code)`.
- FCC and `.local\bin` entirely untouched (never enumerated/accessed).
- No changes to OpenCode/Kilo; no commits; both locks closed except the
  temporary owner-approved flip for the gated run (restored + verified).

## 3. Preflight evidence

- Gateway (owner-started omniroute, 0.0.0.0:20128): `/v1/models` with the
  route credential -> HTTP 200, structured JSON, route model present;
  `/status` HTTP 200 (router dashboard). Note: the gateway process was
  restarted between sessions 46 and 48 (PID changed); the owner also edited
  the omniroute route (model deepseek-v4-flash-free -> gemini/
  gemini-3.5-flash-lite, discovery off). The bare `gemini/gemini-3.5-flash-lite`
  alias is not advertised in `/v1/models` (only `kc/google/` and
  `kilocode/google/` variants) but was verified routable with a single
  one-token probe (HTTP 200, model echoed) before the gate ran.
- Suite preflight (all green): Gate 2 65/65; Gate 3 OVERALL PASS; OpenCode
  40/40; Kilo 37/37; focused Python 133/133; full Python 217 (2 accepted
  preference baselines only); focused frontend 51/51; full frontend 133 (1
  accepted onboarding-copy baseline only); `git diff --check` 0; secrets scan
  0 hits; locks closed on disk (`ALLOW_REAL_CLAUDE_TARGET = False`) and live
  (`realTargetLocked: true`).

## 4. Snapshot (§9.3)

Five labels hashed and copied to `%TEMP%\opencode\gate5b-retry-snapshot`
before the run: user `settings.json`, app-owned `claude-routes.json`,
`claude-backup-manifest.json`, `claude-activity.jsonl`, and `app/state.json`.
All five were present; the manifest was `[]` (3 bytes). Hashes are recorded in
the session log (session 48).

## 5. Apply (§9.4)

- Temporary owner-approved flip: `ALLOW_REAL_CLAUDE_TARGET = True` +
  `_run_production` prepends `-AllowRealTarget` only while unlocked; `git diff`
  showed exactly those two hunks; server restarted.
- `POST /api/claude/routes/route-3bb7d937b97f/apply` with the real revision
  tokens -> HTTP 200: target revision `63f41403...` -> `b2a6c773...`,
  `routesRevision` -> `e8ffd497...`.
- Surgical env-only patch byte-verified: `ANTHROPIC_BASE_URL` preserved/
  directed at the loopback gateway, `ANTHROPIC_MODEL` = the route model,
  selected auth (`ANTHROPIC_API_KEY`) set and opposite auth (`ANTHROPIC_AUTH_TOKEN`)
  removed, `CLAUDE_CODE_AUTO_COMPACT_WINDOW = 200000`,
  `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = 1`, top-level `model` and every
  unmanaged byte (including pre-existing `ANTHROPIC_DEFAULT_HAIKU_MODEL`)
  preserved.
- Backup `settings.backup.20260817143408290.b33358d7....json` = pre-run SHA
  `63f41403...` EXACTLY.

## 6. /status evidence (§9.5)

- App `/api/claude/status`: `routeConfigured: true`,
  `model: gemini/gemini-3.5-flash-lite`, `endpointConfigured: true`,
  `lastBackupAvailable: true`.
- Gateway `/status` HTTP 200; `/v1/models` HTTP 200 with structured JSON
  (route credential accepted).
- Hosted CLI `/status` (bounded, `--print`): exit 0, parseable JSON
  (`/status isn't available in this environment.` — per §9 not required to
  report the selected model).

## 7. Routing request (§9.6) — the routing evidence

One no-session-persistence request: `--print "Reply exactly GATE5B_ROUTE_OK"`,
`--disallowedTools "*"`, `--permission-mode dontAsk`, `--no-chrome`, no
fallback model, `--output-format json`.

- First attempt capped at `--max-budget-usd 0.10`: exit 1, subtype
  `error_max_budget_usd` — NOT an API error (no 429; the cooldown was gone).
  The model DID respond (structured `modelUsage` shows the route model, 28,658
  input tokens, 7 output tokens, `stop_reason: end_turn`) but the CLI aborted
  at the response boundary because the Claude 2.1.153 system prompt costs more
  than $0.10 on the owner's paid route model.
- Second attempt, same single request, cap raised to `--max-budget-usd 0.30`
  (still bounded): **exit 0, `subtype: success`, `is_error: false`,
  `api_error_status: null`, `result: "GATE5B_ROUTE_OK"` (exact fixed marker),
  `num_turns: 1`, `stop_reason: end_turn`, fresh `session_id` (no
  persistence)**.
- Structured `modelUsage` = the applied route's model:
  `gemini/gemini-3.5-flash-lite` with `contextWindow: 200000` (the applied
  `CLAUDE_CODE_AUTO_COMPACT_WINDOW`), 28,658 input tokens, 7 output tokens,
  `total_cost_usd: 0.151611`. The request reached the loopback gateway and
  resolved exactly the applied route's model — no fallback.

## 8. Tool-use semantic determination (§9.7)

Parsed structured events/fields only: no `tool_use` event type present in
either response; `usage.server_tool_use` counters all 0; `permission_denials`
empty. The raw string `tool_use` appears only as metadata counter NAMES
(`server_tool_use`), never as an invocation -> **NO tool use** (this is the
corrected semantic the historical Gate 5B.4 got wrong with substring matching).

## 9. Restore (§9.8)

`POST /api/claude/restore` with the post-apply revisions (in `finally`) ->
HTTP 200, revision back to `63f41403...` (pre-run EXACT), `routesRevision`
back to `f72c2e7c...` (pre-run EXACT). Post-restore byte-verify: `settings.json`,
`claude-routes.json`, `claude-backup-manifest.json` all byte-equal to the
snapshot; `claude-activity.jsonl` gained exactly 2 designed append-only audit
events (`route_applied` + `restore_completed`); `app/state.json` was restored
to snapshot bytes after the browser's `activeAgent` flip during the run (the
adapter transaction never touches `state.json`).

## 10. Relock and re-verification

- Flag + `-AllowRealTarget` pass-through reverted to exactly HEAD (`git diff`
  empty, `git diff --check` 0); server restarted.
- `POST apply` while locked -> HTTP 503 detail "Claude real-target access is
  locked until Gate 5 approval."; `/api/claude/status` ->
  `realTargetLocked: true`; `/api/claude/scan` intact (6 MCPs, 7 plugins,
  2 saved routes, state present).
- No commits/staging/subagents/Graphify; secrets scan clean.

## 11. Relation to historical Gate 5B evidence

The historical Gate 5B.1-5B.4 reports remain on record under the superseded
broad ownership contract (their Gate 5B.4 status is `HARD_FAILURE` under that
contract). This report supersedes the acceptance criteria, not the history:
the corrected env-only contract (`CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md`)
governs, and this PASS is the live validation that contract required.