# CLAUDE CODE GATE 5B RETRY — RESUME PROMPT (next session)

Paste this verbatim as your opening prompt in the next session. You are
continuing work on the BDF/Switcher repository at
C:\Users\loveb\.config\opencode\docs (branch main).

NEVER commit unless the owner says so. Read first, in order:
1. AGENT.md
2. _agent/SESSION_LOG.md (latest)
3. _agent/JOURNEY_TO_V3.md (Current Position)
4. planning/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md (§9 corrected
   live-validation semantics + §13 completion sequence — the governing contract)
5. AI/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_RESUME_PROMPT.md (the original
   Gate 5B handoff — still the governing procedure)
6. planning/CLAUDE_CODE_GATE_5B* historical reports (context only — HARD_FAILURE /
   FAIL under the superseded contract; do not revive them)

Task (owner-approved): retry the corrected Gate 5B live validation's ROUTING-EVIDENCE
stage against the omniroute loopback gateway (http://localhost:20128/v1). The first
run (session 46) PASSED every transaction mechanic but the fixed-marker routing
request was rejected by the gateway with 429 "All credentials for model
deepseek-v4-flash-free are cooling down" — an upstream OmniRoute free-tier credential
cooldown, environmental, NOT a BDF/adapter failure. The gateway has since been up for
many hours, so the cooldown has almost certainly cleared. After 5B passes AND the
owner approves, proceed to Gate 5C documentation/release sync.

Corrected 5B semantics (design §9) — same as the first run:
(1) qualify only the default Claude Code 2.1.153 PowerShell-resolved command;
(2) FCC and .local\bin entirely untouched;
(3) snapshot before: settings.json + app-owned state (app/state/claude-routes.json,
    manifest, activity, app/state.json), hash-verified restore after;
(4) apply exactly ONE saved route targeting the local loopback gateway
    ("omniroute", http://localhost:20128/v1 — NOT orcarouter or any remote endpoint);
(5) one bounded /status check (routing evidence; not required to report the model);
(6) one no-session-persistence routing request (tools disabled, no fallback model,
    fixed minimal prompt "Reply exactly GATE5B_ROUTE_OK", capped budget
    --max-budget-usd 0.10) verifying the selected model from structured response
    metadata;
(7) tool use = semantic parse of structured events, never a raw tool_use substring;
(8) restore in finally, verify only managed-target + app-owned byte equality.

How (same procedure as session 46 — see the session log for the exact sequence):
1. Preflight: confirm the gateway is up (netstat :20128 + /v1/models with
   OMNIROUTE_API_KEY → 200 + structured JSON with the route model present); confirm
   OMNIROUTE_API_KEY resolves in process+user scope (name only, never the value);
   re-run Gate 2 65/65, Gate 3 OVERALL PASS, OpenCode harness, Kilo harness, focused
   Python, full Python, frontend suites, git diff --check, secrets scan, locks closed.
2. Temporarily set ALLOW_REAL_CLAUDE_TARGET = True in app/app/claude_adapter.py AND
   add the conditional -AllowRealTarget pass-through in _run_production (both were
   reverted to HEAD after session 46 — re-apply them for this gated run, then restore
   BOTH to exactly HEAD afterward and verify git diff clean).
3. Restart the server, snapshot, drive POST /api/claude/routes/{route_id}/apply for
   omniroute with real revision tokens, run the bounded /status evidence, run the
   one routing request, restore in finally via POST /api/claude/restore, verify
   byte-equality, then IMMEDIATELY restore the flag + -AllowRealTarget, restart,
   verify apply → 503 + status → realTargetLocked: true.
4. If the routing request still 429s, wait ~5 min and retry ONCE (owner authorized
   retries in session 46); if it still fails, report the upstream blocker and STOP
   for the owner — do NOT touch orcarouter without explicit authorization.
5. After 5B PASSES, STOP and get the owner's approval before Gate 5C. Gate 5C is the
   documentation/release/status sync (lifecycle "Integrated, not live validated" →
   "Live validated" per design §11) — do not run it unprompted.

Constraints: no commits/staging/subagents/Graphify; both locks closed except the
temporary 5B flip (restored + verified); zero access to FCC/.local\bin/plugins/
sessions/OAuth/state-file contents; no OpenCode/Kilo changes; if anything needs a
permanent lock change or a live step beyond §9, STOP and ask. Remember: orcarouter
gets applied from the UI only after 5B + 5C open the lock.

State to carry in (verified at handoff): gateway up (PID 24904, 0.0.0.0:20128),
locks closed (ALLOW_REAL_CLAUDE_TARGET = False, realTargetLocked: true), working
tree has the LSP feature (session 46, uncommitted, git diff --check 0) — do NOT
commit or disturb it; settings.json is byte-equal to its pre-gate state.

Verify: Gate 2 65/65, Gate 3 OVERALL PASS, OpenCode 40/40, Kilo 37/37, focused
Python 125/125, full Python 217 (2 accepted preference baselines), focused frontend
5/5 integrations + 46/46 claude/capability, full frontend 133 (1 accepted
onboarding-copy baseline); settings.json byte-identical to the pre-run snapshot;
app-owned state restored; lock closed; /api/claude/scan still shows the real
inventory; git diff --check 0; secrets scan clean.

Report back: 5B pass/fail with evidence (backup name + hashes, pre/post target
hashes, /status output, routing response model, tool-use semantic determination),
restore verification, lock re-verification, anything needing the owner's decision.
Update _agent/SESSION_LOG.md and _agent/JOURNEY_TO_V3.md.

---

# Context for the owner (not for the agent prompt)

## Session 46 recap — Gate 5B first run
- ALL preflight suites passed (Gate 2 65/65, Gate 3 OVERALL PASS, OpenCode 35/35,
  Kilo 32/32 — counts were pre-LSP), command qualified (claude.ps1, 2.1.153),
  snapshot taken.
- Apply of omniroute through the production endpoint: PASS — surgical env-only
  patch byte-verified (auth AUTH_TOKEN→API_KEY swap, MODEL + options set,
  NONESSENTIAL removed, unmanaged bytes + top-level model preserved), backup =
  pre-run sha, manifest entry complete.
- /status evidence: PASS (gateway /status HTTP 200 + /v1/models structured JSON,
  2659 models, route credential accepted).
- Routing request: FAILED ×3 (1 + 2 authorized retries) with gateway 429 "All
  credentials for model deepseek-v4-flash-free are cooling down" — upstream
  OmniRoute free-tier cooldown, environmental, NOT a BDF/adapter failure. The
  structured response still proved correct routing (request reached the loopback
  gateway, resolved exactly the route's model, zero tokens, no fallback, no tools).
- Restore: PASS — settings.json + claude-routes.json byte-equal to snapshot; two
  owned settings.backup files retained (both = pre-run sha, by design); manifest []
  (designed); activity gained 4 designed audit events; app/state.json restored to
  snapshot bytes (browser UI had flipped activeAgent mid-run).
- Lock re-verified: apply → 503 "locked until Gate 5 approval", realTargetLocked:
  true, scan intact. All reverted to HEAD byte-for-byte.

## LSP feature (session 46, uncommitted working tree)
A full LSP feature was built + reviewed (all tasks MERGE-READY): lsp.json source in
all profiles (default disabled), builders + harnesses (OpenCode 40/40, Kilo 37/37),
app /api/lsp + Integrations LSP card with toggle (emits lsp:true when on, lsp:false
when off), BUGFIXES entries. This is NOT part of the Gate 5B retry — leave it
untouched and uncommitted unless the owner asks.
