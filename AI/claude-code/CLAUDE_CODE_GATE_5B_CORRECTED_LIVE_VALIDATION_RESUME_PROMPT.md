# Resume Prompt — Corrected Gate 5B Live Validation (+ Gate 5C)

Copy the entire block below into the new OpenCode session:

---

You are continuing work on the BDF/Switcher repository at
`C:\Users\loveb\.config\opencode\docs` (branch `main`). The Claude Code
integration is committed up to the UI entry points, read-only inventory,
Claude-mode UI polish, and app-managed credential env vars (sessions 42–45).
NEVER commit unless the owner says so.

**FIRST, read these files in order:**
1. `AGENT.md`
2. `_agent/SESSION_LOG.md` (latest entries)
3. `_agent/JOURNEY_TO_V3.md` (Current Position)
4. `planning/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md` —
   especially §9 "Corrected live-validation semantics" and §13 "Completion
   sequence". This is the governing contract for the gate. Follow it exactly.
5. `planning/CLAUDE_CODE_CREDENTIAL_UX_APP_MANAGED_ENV_VARS.md` — how keys
   reach the builder (app-managed user-scope environment variables).
6. The historical Gate 5B handoffs/reports in `planning/CLAUDE_CODE_GATE_5B*`
   and `CLAUDE_CODE_GATE_5B4_*` — READ FOR CONTEXT ONLY. They are historical
   HARD_FAILURE under an over-broad acceptance contract, superseded by the
   env-only scope correction. Do not revive their acceptance criteria.

**Your task (owner-approved, the next step):**
Run the CORRECTED Gate 5B live validation of the Claude Code routing adapter
against the real user-scope `.claude/settings.json`, then — only after 5B
passes AND the owner approves — Gate 5C documentation/release sync.

Corrected 5B semantics (from design §9 — the gate is approved for THIS run):
1. Qualify ONLY the default Claude Code 2.1.153 PowerShell-resolved command.
2. Keep FCC and `.local\bin` entirely untouched (zero access).
3. Snapshot BEFORE the run: `.claude/settings.json` + app-owned state
   (`app/state/claude-routes.json`, `claude-backup-manifest.json`,
   `claude-activity.jsonl`, `app/state.json`); hash-verify restore AFTER.
4. Apply exactly ONE saved route — the route MUST target the local loopback
   gateway (`http://localhost:20128/v1`, i.e. the "omniroute" route) because
   the live request may contact only the selected loopback gateway. Do NOT
   apply orcarouter or any remote-endpoint route during the gate.
5. Run ONE bounded `/status` check for gateway/provider routing evidence
   (`/status` is not required to report the selected model).
6. Run ONE no-session-persistence routing request (disable tools, NO
   fallback model, fixed minimal prompt, capped budget, no session
   persistence) and verify the selected model from structured response
   metadata.
7. Tool use is determined semantically from parsed structured events/fields
   — a raw substring such as `tool_use` in schema/metadata is NOT a tool
   invocation.
8. Restore in `finally`; verification covers ONLY managed-target and
   app-owned state byte equality. Claude-owned runtime files are not
   observed and never touch the pass/fail.

How to run it: use the adapter's own production path. Temporarily set
`ALLOW_REAL_CLAUDE_TARGET = True` in `app/app/claude_adapter.py` (owner-
approved for this gated run), restart the server, and drive
`POST /api/claude/routes/{route_id}/apply` with the real revision tokens —
this exercises the production builder (`app/engine/claude-code/
build-claude-code-production.ps1`), the surgical env-only patcher, backup,
and verification end-to-end. Then IMMEDIATELY set the flag back to `False`,
restart, and verify the lock is closed again (apply returns 503; status
shows `realTargetLocked: true`). Preflight: confirm the route's
`secretEnvRef` env var resolves from the server's process environment
(the app-managed flow already created it; if not, set it via the route form
or restart the server).

**Gate 5C (ONLY after 5B passes and the owner explicitly approves):**
Documentation/release sync per scope-correction design §11: adapter docs,
`adapters/claude-code/`, READMEs, PROJECT_STATE, release docs — lifecycle
moves from "Integrated, not live validated" to live-validated only when the
owner says so. Do not rewrite or conceal prior reports; add superseding
evidence.

**Hard constraints:**
- No commits, no staging, no subagents, no Graphify.
- Both locks CLOSED except the owner-approved temporary flip for the 5B run
  (restored + verified afterwards). No permanent lock changes.
- Zero access to FCC / `.local\bin` / plugin state / sessions / OAuth /
  `.claude.json` contents beyond the read-only inventory scan (never edit
  the state file).
- No changes to OpenCode/Kilo behavior, registry, or tests.
- If anything needs a permanent lock change or a live step beyond §9, STOP
  and ask the owner.

**Verify before finishing:**
- Gate 2 65/65, Gate 3 OVERALL PASS, OpenCode 35/35, Kilo 32/32, focused
  Python 125/125, full Python 209 (2 accepted preference baselines), focused
  frontend 44/44, full frontend 131 (1 accepted onboarding-copy baseline).
- Live: settings.json byte-identical to the pre-run snapshot; app-owned
  state restored; lock verified closed; `/api/claude/scan` still reports the
  real inventory; the UI still works (routes page, apply shows the locked
  message again).
- `git diff --check` exit 0; secrets scan clean.

**Report back:** 5B pass/fail with the exact evidence (backup name + hashes,
pre/post target hashes, /status output, routing response model, tool-use
semantic determination), restore verification, lock re-verification, and
anything needing the owner's decision. Update `_agent/SESSION_LOG.md` and
`_agent/JOURNEY_TO_V3.md` when done.

---

## Owner context (why this gate exists)

- The original 5B runs (5B.1–5B.4) were HARD_FAILURE under an over-broad
  acceptance contract (they demanded behavior the env-only scope correction
  deliberately removed). They are historical; the corrected contract in §9
  replaces them.
- Gate 5C (docs/release sync) runs ONLY after corrected 5B passes.
- After the gates: the real-target lock can open so "Apply route" works from
  the UI for any saved route (e.g. orcarouter), and the remaining future
  work is the full credential-store UX (`CLAUDE_CODE_FUTURE_CREDENTIAL_UX_FIX.md`).
