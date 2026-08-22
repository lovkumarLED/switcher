# Resume Prompt — Claude Code UI Entry Points

Copy the entire block below into the new OpenCode session:

---

You are continuing work on the BDF/Switcher repository at
`C:\Users\loveb\.config\opencode\docs` (branch `main`, NOTHING is committed —
never commit unless the owner says so).

**FIRST, read these files in order:**
1. `AI/CLAUDE_CODE_UI_ENTRY_POINTS_CONTINUATION.md` — the exact continuation
   handoff with the owner's requirements, architecture facts, and test
   expectations. Follow it exactly.
2. `AGENT.md`
3. `_agent/SESSION_LOG.md` (latest entries)
4. `_agent/JOURNEY_TO_V3.md` (Current Position)
5. `planning/CLAUDE_CODE_SETTINGS_ONLY_SCOPE_CORRECTION_DESIGN.md` and its
   implementation report (the adapter itself is DONE and green — do not
   redo it).

**Your task (owner-approved direction, unchanged UI/UX style):**
Give Claude Code real entry points in the existing app UI, without changing
the overall UI/UX (same colors, same patterns, same components):

1. Add a **Claude Code** tile to the onboarding "Connect your agent" screen
   (same style as OpenCode/KiloCode). Selecting it and continuing must land
   on the Claude Code page.
2. When Claude Code is selected there, show a summary line in the same
   pattern as the others ("Scanned Claude Code: N providers · N MCP servers
   · N plugins") with real counts, without touching real Claude state.
3. Add **Claude Code** to the agent switcher toggle on the provider page
   (the same toggle that switches OpenCode ↔ Kilo). Selecting it switches
   the whole app to the Claude Code page.
4. Claude Code stays a separate page (routing profiles + compatibility
   assistant), never a provider in the universal grid.

**Hard constraints:**
- Do NOT touch OpenCode/Kilo behavior, registry, or tests.
- Do NOT read/hash/copy/scan any real Claude file; keep both real-target
  locks closed (`ALLOW_REAL_CLAUDE_TARGET = False`); no `-AllowRealTarget`;
  no server/gateway/Claude invocation.
- Do NOT change the overall UI/UX — edit the current patterns only.
- Keep lifecycle status exactly `Integrated, not live validated`.
- No commits, no staging, no subagents, no Graphify.
- If a real change to the real lock or a live test becomes necessary, stop
  and ask the owner; do not do it.

**Verify before finishing:**
- Frontend contract suites green and extended for the new entry points;
  focused Python 94/94; full Python 178 (2 accepted baselines); full
  frontend 114 (1 accepted baseline); Gate 2 65/65; Gate 3 OVERALL PASS;
  OpenCode 34/34; Kilo 32/32.
- Manual click-through on `http://127.0.0.1:9090`: Claude tile on
  onboarding → lands on Claude page; toggle switches to Claude page;
  summary line shows counts; OpenCode/Kilo pages unchanged.
- `git diff --check` exit 0; `app/state` untouched; locks closed.

**Report back:** what you changed (files), test counts, click-through
results, and anything that required the owner's decision. Update
`_agent/SESSION_LOG.md` and `_agent/JOURNEY_TO_V3.md` when done.

---
