- Session 45 (2026-08-16): Claude route credential UX implemented + live verified + COMMITTED (owner-authorized; first commits since session 41 — the whole Claude Code integration program sessions 42–45 now in git). Owner-directed: the user enters the environment variable name AND the API key value in the route form - the app creates the user-scope Windows environment variable itself (registry persist + immediate process apply via SetEnvironmentVariableW, so the builder inherits it with NO restart - the gotcha is gone). Route stores only the variable name + an app-managed flag; the key value is never stored or returned. Deleting an app-managed route removes the variable (only when no other route references it; pre-existing variables are reused, never deleted). Route CRUD is now lock-free (app-owned store + env vars only; apply/restore stay gated); fixed a real integration gap where locked GET /routes omitted routesRevision and silently broke edit/delete. Giant-checkbox CSS bug fixed and logged in BUGFIXES.md. Verified: focused Python 125/125, full Python 209 (2 accepted), focused frontend 44/44, full frontend 131 (1 accepted), Gate 2 65/65, Gate 3 OVERALL PASS, OpenCode 35/35, Kilo 32/32, live UI loop (add route with key -> env var created -> details "managed by Switcher" -> delete -> env var removed) green. Resume prompt for the corrected Gate 5B written to AI/claude-code/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_RESUME_PROMPT.md. Next: owner pastes it in a fresh session to run the corrected Gate 5B live validation (temporary owner-approved lock flip, snapshot + byte-verified restore), then Gate 5C after approval.
- Session 44 (2026-08-16): Claude Code read-only inventory scan + Claude-mode UI polish implemented + live verified (no commit). New app/claude_inventory.py always scans the user-scope Claude state file (owner-authorized READ-ONLY; design planning/claude-code/CLAUDE_CODE_README_SCAN_AND_UI_POLISH_DESIGN.md supersedes in part the session-42 "never read .claude.json" rule - mutations still fully prohibited): MCPs user + project scoped, grouped, deduped, typed (stdio/http/sse/sdk/unknown), only name/scope/project/type returned (secrets never); plugins merged from the managed settings.json enabledPlugins. /api/claude/scan extended; onboarding summary now shows real counts ("1 providers · 6 MCP servers · 7 plugins" on the owner's machine). OVERVIEW FIXED (root cause: Claude cards had no grid-placement rules in the 24-col masonry, rendering as merged slivers - now explicit spans + inventory card with type chips + activity card); Routes two-column + chip bar + redesigned route cards; Activity chip bar; Settings two-column with full read-only inventory. Verified: focused Python 115/115, full Python 199 (2 accepted), focused frontend 37/37, full frontend 129 (1 accepted), Gate 2 65/65, Gate 3 OVERALL PASS, OpenCode 35/35, Kilo 32/32, live click-through green, locks closed. Next: corrected Gate 5B live validation + Gate 5C.
- Session 43 (2026-08-16): Claude Code UI entry points IMPLEMENTED + live click-through PASSED (no commit). Onboarding "Connect your agent" now always shows the Claude Code tile; selecting it scans via a new lock-free GET /api/claude/scan and shows the real summary line ("Scanned Claude Code: 1 providers · 0 MCP servers · 0 plugins" - the providers slot carries the app's own saved routing profiles). The agent-switcher toggle gained the Claude Code tab; clicking it switches the whole app to Claude mode. Claude stays a separate page (sidebar Routes, never a provider tile). Backend: /api/claude/connect is now lock-free (registers claude-code in app-owned state.json only, zero Claude-file access); ALLOW_REAL_CLAUDE_TARGET stays False with apply/restore/route-CRUD still gated. Verified: focused frontend 37/37, full frontend 122 (1 accepted baseline), focused Python 97/97, full Python 181 (2 accepted baselines), Gate 2 65/65, Gate 3 OVERALL PASS, OpenCode 35/35, Kilo 32/32, live click-through on 127.0.0.1:9090 green. Next: corrected Gate 5B live validation + Gate 5C.
- Session 42 (2026-08-15): Claude Code env-only scope correction IMPLEMENTED and verified green on fixtures (Gate 2 65/65, Gate 3 OVERALL PASS, focused Python 94/94, focused frontend 35/35, OpenCode 34/34, Kilo 32/32; full suites only accepted baselines). Live app started and clicked through with the owner: OpenCode/Kilo unchanged, but Claude Code has NO UI entry point (no onboarding tile, no sidebar entry, no agent toggle) because discovery is lock-gated and the registry excludes claude-code by design. Owner decisions: nothing commits until the full app + Claude integration is verified live; owner orchestrates directly (Sol retired); Claude Code = separate page; next = add UI entry points (onboarding tile + agent toggle + summary line) without changing UI/UX style. Continuation: AI/claude-code/CLAUDE_CODE_UI_ENTRY_POINTS_CONTINUATION.md + resume prompt.
- Session 40 (2026-08-12): setup verify + auto-revert + setup guide shipped. Post-setup health check tests every provider connection + generated main config + profile mcp/plugins; on failure the app auto-restores the main config from the newest pre-build backup and shows a plain-language guide. Returning users no longer hit verify/revert on every open (only first-time setup), and the ready screen no longer fakes 'LiteLLM active'. Verified on real kilo as a first-time user: json+jsonc merged import, auto-build, verify fail -> auto-revert, config restored. Next: first-time startup test in the next session to confirm zero bugs.
- Session 39 (2026-08-12): 2.5.2 release finalized + licensing + fresh-clone verification. Three install commands written and TESTED (full clone, app-only sparse, bdf-only sparse - all boot). MIT License + brand-protection notice added (name/logo/demo images excluded from the MIT grant; trademark registration is the stronger option if ever needed). Fresh-clone gate re-verified: provenance files generate for new installs. Root cause found and fixed: the modern app was never committed - now everything is pushed; clones get the real UI. Animated startup banner added in brand colors. Repo currently private. Next: Phase 15 - Claude Code + more agents.
- Session 38 (2026-08-12): FULL-SYSTEM HEALTH CHECK + SECURITY HARDENING + 2.5.2 release. App tested end-to-end on a temp clone agent (onboarding, overview graphs with 49 real proxy calls, providers wizard, activity analytics, integrations with all 3 MCP types, settings reasoning panel, builders). Found and fixed 6 issues: SSRF-via-redirect in /api/test, proxy userinfo-injection path regex, profile-switch path traversal, scaffold agent-name validation before PS1, storage.py lock deadlock, stale build-kilo.ps1 copy. Builders now preserve per-model reasoning formats. Settings gained per-model reasoning editing, delete-model, and active-profile switcher. 79 app unit tests, 75 frontend tests, kilo 31/31 + opencode 31/31. Repo junk cleaned (AI/image, stale CONTINUE_* handoffs, old logo images). Demo GIFs added to README. Next: Phase 15 - Claude Code + more agents.
# JOURNEY_TO_V3

> The live tracker of our position on the road to BDF V3.
- Session 35 (2026-08-09): reasoning formats shipped (app + framework + kilo); FSC rerun green (report AI/full-system-check/FULL_SYSTEM_CHECK_REPORT_2026-08-09.md); MAJOR FLAW FIXED - app is now self-contained (app/engine/ bundles the generator + builders + testers + schemas; fresh downloads generate builders for opencode/kilo with zero external scripts); FSC fresh-clone gate added; repo healthy and public. Next: Phase 15 - Claude Code + more agents (app/engine/ grows a claude adapter).


---

# Purpose

This document answers one question at any moment:

> "Where are we right now on the road to V3, and what is the next step?"

It is the single source of truth for journey progress. It is NOT documentation of the
current implementation (that is `PROJECT_STATE.md`) and NOT the vision (that is
`planning/BDF_ROAD_TO_V3.md`). This file is the map + the compass.

Every session reads it at start and updates it at end.

---

# The Destination

> **BDF V3 — the first stable public version of the Builder Development Framework.**

V3 is complete when the same engineering framework can successfully create and maintain
builders for:

- OpenCode
- KiloCode
- Any open-source coding agent sharing their architecture

without redesigning the framework. Only Project Adapters should differ.

Claude Code is NOT supported (entropic `~/.claude.json`, no provider support —
decision 2026-08-08, `planning/DECISIONS.md`).

V3 turns the framework into a **Builder Generator**:

```
Create New Builder Project
↓
Discover installed open-source coding agents (OpenCode / KiloCode / same-architecture)
↓
Choose agent
↓
Read project schema
↓
Generate adapter
↓
Generate docs
↓
Generate folder structure
↓
Generate builder
↓
Generate tests
↓
Done
```

---

# The Journey Map

```
Step 0 — Current (Builder V2.2.0, Release Manager V1)          ✅ complete
↓
Step 1 — BDF V2.5: Framework Generalization                    ✅ complete
↓
Step 2 — KiloCode Builder V1 (first validation)                ✅ complete
       Claude Code V1 DROPPED (2026-08-08, entropic config)
↓
Step 3 — Universal Agent Framework core (scaffold-agent.ps1)   ← we are here
↓
Step 4 — Framework Improvements (learned from universal)
↓
Step 5 — BDF V3: Universal Builder Generator                    ← destination
```

Each step is built, tested, and validated before the next begins.
Real projects shape the framework — never assumptions.

---

# Current Position

Updated: Aug 22, 2026 (session 50 - FULL SYSTEM CHECK V2 executed end-to-end and PASSED: 16 defects found + fixed with regression tests incl. a HIGH security hardening (global loopback origin gate), zero accepted test baselines remain (Python 270 / frontend 192 / harnesses 40+37+73+Gate3 all green); owner-authorized LIVE Claude apply/restore gate re-executed on real ~/.claude and PASSED with byte-exact restore (also repaired backup-ring drift + made prune failures report their true cause); README/PROJECT_STATE/FOLDER_STRUCTURE synchronized (Claude complete + live validated, Framework 2.3.0, current test badges); nothing committed - owner approval pending. Prior context: session 48 — OFFICIALLY CLOSED by the owner: Gate 5B PASS + Gate 5C sync (Claude adapter **Live validated**, real-target lock open), **model-roles** multi-model routes shipped + live, **DPAPI credential store UX** shipped + live-verified (keys encrypted with the user's Windows key; ORCA + TOKEN migrated, env vars deleted; FREE_CLAUDE migrates on freecc's next apply), Pi noted as the next agent in ROADMAP/README/PROJECT_STATE/JOURNEY; session fully committed (d8ece8d, 1c376db, f91eaf8, be3398c, f74da11); next: Pi integration whenever the owner starts it, then Step 4/5 to V3)

```
Step 3 — Universal Agent Framework core
Status: IN PROGRESS (core built; bootstrap fix session 27; Claude dropped 2026-08-08 and narrowly reversed 2026-08-14 as a unique routing adapter; GUI app = BDF made autonomous, session 29; real-provider fix + presets + builder parity, sessions 31-32; env-only surgical scope correction implemented, session 42; Claude Code UI entry points implemented, session 43; read-only inventory scan + Claude-mode UI polish, session 44; app-managed credential env vars + lock-free route CRUD, session 45; corrected Gate 5B live validation RUN session 46 - mechanics pass, routing evidence blocked by upstream 429; LSP feature for OpenCode + KiloCode built + reviewed + committed by owner, session 47; Gate 5B routing-evidence RETRY PASS session 48 - corrected Gate 5B live validation COMPLETE; routes page provider-deck redesign session 49; full-system check V2 PASS + live gate re-run + doc truth sync session 50)
Progress: ~98%
```

Phase map (roadmap): Phase 14 GUI App COMPLETE; Phase 15 More Coding Agents PLANNED — the app + universal scaffold are expected to work with additional open-source coding agents, but only OpenCode + KiloCode are verified so far; the rest is untested until tried. Claude Code adapter is implemented and fixture-green but has no app UI entry point yet (next session).

What was completed:

- [x] Step 1 — BDF V2.5: Framework Generalization (COMPLETE 100%).
- [x] Side goal: JSON Schema Validation (`schemas/`) — Builder V2.7 (F1-F7), P1 env-key
      policy + P2 dynamic target artifact. Battery 17/13/31 green, snapshot-22 pinned
      (FULL_SYSTEM_CHECK v1.1 all 7 parts PASS, sessions 22 + 26).
- [x] Step 2 — KiloCode Builder V1 (replaces dropped Claude V1): Kilo directory,
      `build-kilo-v1.ps1` / `test-kilo-v1.ps1` / `scaffold-kilo-v1.ps1`, harness 30/30,
      real `~/.config/kilo` verified (sessions 24-24b).
- [x] Step 3 core — `scaffold-agent.ps1` rebuilt as the V3 UNIVERSAL core:
      agent registry (opencode, kilo, claudecode, aider, goose, codex-cli; any
      open-source agent), discovery, -List, -Bootstrap (generates build-/test-/scaffold-
      per agent), scan-first contract, never writes provider/model files, never touches
      .jsonc without consent (session 24b).
- [x] Bootstrap fix (session 27): scaffold's generated `test-<agent>.ps1` copied raw
      (stale `build-opencode-v2.7.ps1`/kilo refs) → now token-replaced like the builder;
      sandbox `custom` agent bootstrap verified 30/30 harness.
- [x] Real-config scaffolds verified: kilo + opencode refreshed with backup, settings
      merged full-shape, harness 30/30 both, AGENTS.md relocation reverted (no AGENTS.md
      anywhere; session 26b claim corrected in session 28).
- [x] Session 28: FULL_SYSTEM_CHECK v1.1 rerun — all 7 parts PASS; V2.7 harness count
      corrected to 31/31 everywhere; framework 2.2.3 (template sync round 2); experimental/
      minimal omniroute-models.json restored (recurring async-deletion fix).
- [x] Session 28b: SCAFFOLD CONTRACT FINALIZED (per user ruling):
      - The framework creates the `providers/` folder (like the profile folders) but
        NEVER writes provider or model JSON files inside it — the JSON files are
        100% user-owned.
      - ONE job: scan the agent's OWN main JSON (kilo.json for kilo, never another
        agent's config), split mcp / plugin sections, seed `profiles/coding/mcp.json` +
        `plugins.json` (user-owned after creation), create `profiles/{coding,experimental,
        minimal}` with exactly settings/mcp/plugins three files each.
      - experimental/minimal mcp.json + plugins.json created EMPTY, never filled.
      - settings.json = `$schema` + `activeProviders` only (never copy-paste the config).
      - Removed framework-created model files: kilo coding omniroute-models.json,
        opencode experimental + minimal omniroute-models.json. User's own
        kilo/providers/omniroute.json restored (user-owned).
      - Kilo test re-run: backup made first, test-kilo-v1.ps1 30/30, main kilo.json
        byte-identical (backup policy verified). Real build correctly fails pre-flight
        without user-created providers (by design).
- [x] Session 28c: NO-SECRETS RULE (ULTIMATE) codified — the SYSTEM's own artifacts
      (scripts, templates, docs, examples) never contain literal API keys ({env:VAR}
      only); USER-owned files (main config, profiles, providers) may contain literal
      keys and the user protects them; the system copies user content verbatim
      (scan → copy → paste) so generated output carries whatever the user's files
      contain, keys included. Verified: system artifacts 0 leaks, user files restored,
      both builds green.
- [x] Session 28d: PHASE 8 COMPLETE — Documentation Expansion: 4 onboarding guides
      (DEVELOPER_GUIDE, PROVIDER_DEVELOPMENT_GUIDE, PROFILE_CREATION_GUIDE,
      BUILDER_EXTENSION_GUIDE) + 4 mirrored templates (15 → 19). ALL 13 roadmap
      phases now complete except the final V3 release steps.
- [x] Session 29: PHASE 14 COMPLETE — GUI App "Switcher" (docs/app/): the BDF made
      autonomous. Modular FastAPI backend (app/ package) + Qwen-built gui.html +
      start.bat; calls the REAL scaffold-agent.ps1 -Bootstrap engine (one engine, two
      surfaces) and the generated builders; local OpenAI-compatible /v1 proxy on
      127.0.0.1:9090 to the ACTIVE provider; No-Secrets + backup-first providers.json.
      Smoke-tested end-to-end green on the real opencode agent: discover → scan →
      scaffold (real engine) → build PASS → test harness 31/31 → switch → chat.
- [x] Session 29 (continued): BDF-EXACT data model — the app reads/writes the AGENT's own
      files (providers/, <provider>-models.json, plugins.json, mcp.json, settings.json
      activeProviders list), backup-first; models with thinking levels; plugins + MCP
      cards; SDK type selector (15 npm packages verified); MULTI-AGENT management
      (Agents card, instant switch, ready detection skips the wizard for set-up agents);
      active hero shows every active provider; flame startup banner; self-contained
      Python env; rule.md live theme + rulebook; kilo live (omniroute + tokenrouter,
      19 models in kilo.json); full E2E click-through battery with hash-verified
      restore; commits 459d407 + b3a0bdb.
- [x] SESSION 30 RESEARCH: real-provider root cause found (web-verified) — Kilo reads
      provider.<id>.options.apiKey, the app wrote only top-level apiKey → Kilo sent no
      token → TokenRouter 401; plan written (AI/CONTINUE_REAL_PROVIDERS.md). Also fixed:
      build-kilo.ps1 stale-copy trap (finder prefers highest versioned builder) and
      semantic builder-version selection.
- [x] SESSION 31: REAL-PROVIDER FIX IMPLEMENTED — app/agentstore.py write_provider now
      writes the key to BOTH top-level apiKey and options.apiKey (options preserved);
      3 new tests (34/34 green); real tokenrouter provider re-created via the app's own
      write_provider (key from the app's backup, never echoed) + models restored +
      activeProviders=[omniroute, tokenrouter]; kilo rebuilt via /api/build; built
      kilo.json tokenrouter verified to carry options.apiKey; hash-verified snapshot
      (only intended files changed); app server restarted with the fix. USER-SCOPED
      feature: real providers (TokenRouter, Modal, OpenAI, Google Gemini, OpenRouter,
      NVIDIA NIM) added via the app and used through agents — real-provider presets with
      SDK auto-fill added to the Add-provider form (gui.html + config.py synced);
      Modal researched (OpenAI-compatible; combined proxy token wk-<id>.ws-<secret>);
      app README updated.
- [x] SESSION 32: ACCEPTANCE PASSED (Kilo chat with TokenRouter answers, no 401) +
      OpenCode /models fixed (stray opencode.jsonc with disabled_providers shadowed the
      built opencode.json — removed, backed up; user rule documented) + BUILDER PARITY:
      builders mirror the dual key at merge time (K1 + V2.7 + wizard copies; scaffold
      bootstraps from K1) — hand-written provider files now converge with app-written
      ones; kilo harness fixed to per-provider models fixtures + new 'Dual-key options
      mirror' test (31/31), opencode harness 31/31; stale test-kilo.ps1 (OpenCode copy)
      replaced with the real K1 harness; real kilo rebuild dual-keys omniroute too;
      docs overhaul (root README, app README rules, PROVIDER_DEVELOPMENT_GUIDE +
      template, DEVELOPER_GUIDE, CHANGELOG 2.5.1, PROJECT_STATE, FOLDER_STRUCTURE,
      ROADMAP); committed.
- [x] SESSION 33 (COMPLETE, 2026-08-08): FINAL FULL SYSTEM CHECK (pre-public gate) per
      AI/full-system-check/CONTINUE_FULL_SYSTEM_CHECK_SESSION_33.md — docs coherence audit
      (FSC v1.1 parts 1-7 + dual-key/jsonc/app-docs truth), builder testing
      (kilo 31/31, opencode 31/31, legacy, real builds, sandbox bootstrap),
      adversarial app code review (path traversal, CORS, proxy SSRF, XSS,
      theme injection, secrets/PII leak scan), full GUI click-through on the
      real kilo config with snapshot + hash-verified restore, fix loop until
      green, report + commit — then the repo goes public.
- [ ] FUTURE: app update to generate BOTH opencode.json and opencode.jsonc (planned,
      not yet — documented); add Modal/other real providers via the app when wanted.
- [ ] FUTURE (Phase 15): extend the app + universal scaffold to MORE coding agents
      (OpenCode + KiloCode verified; others expected to work — untested yet).

Dropped: Claude Code Builder V1 — 2026-08-08 decision (entropic `~/.claude.json`, no
provider support). See `planning/DECISIONS.md`.

Next: **Pi agent integration** (Phase 15) — verify Pi end-to-end (discover → scan → scaffold → build → manage providers/models/plugins) through the framework and the app, the next agent after Claude Code (roadmap recorded 2026-08-17); then Step 4 (framework improvements learned from the universal agent) and Step 5 (V3 Universal Builder Generator).
after the gate: BUILDER_PHASES Alpha→Beta→General + Step 4 / Step 5.

Detailed plan: `planning/NEXT_PHASE_IMPLEMENTATION_PLAN.md` (Phase 3 = KiloCode Builder,
Phases 5-7 = universal V3).

Phase gates: every builder build on the road to V3 must pass the Alpha → Beta →
General Release gates in `bdf/BUILDER_PHASES.md` before it becomes the main builder
and the journey advances to the next step.

---

# How to Update This File

## On session start

Read the `Current Position` section. It tells you the step, the progress, and the
remaining work. The session then continues from the most recent `Next:` line in
`SESSION_LOG.md`.

## On session end (every session — including "end session")

1. Read `planning/BDF_ROAD_TO_V3.md` (destination rules).
2. Compare where the session left the project against the Journey Map.
3. Update the `Current Position` section:
   - Step name and status (NOT STARTED / IN PROGRESS / COMPLETE).
   - Progress percentage.
   - Tick or add checkboxes in the remaining-work list.
   - Update the "Updated:" line.
4. Write the `Journey:` line in the new `SESSION_LOG.md` entry (format in
   `SESSION_WORKFLOW.md`) so the log and this tracker never disagree.

## Rules

- Keep it short — this is a compass, not a journal.
- Never rewrite history here: move forward only. If a step regresses, describe the
  regression in the session log, not by erasing this file.
- Never delete the Journey Map or the Destination sections.
- `SESSION_WORKFLOW.md` defines when and how this file is updated. Keep them consistent.

---

# Version Continuation

If a version build is too large to finish inside the context budget, the agent stops at a
clean checkpoint, writes `AI/builder/CONTINUE_BUILD_<VERSION>_<STEP>.md`, and hands you a resume
prompt. That checkpoint file + this Current Position section are how the next session
continues exactly where the build stopped. Rules: `AI/builder/CONTINUE_PROJECT_BUILD.md`.

---

**Document Version:** 1.0

**Status:** Active Journey Tracker
- PART F: FULL SYSTEM CHECK 2026-08-09 (pre-public gate) - all harnesses green (17/17 + 13/13 + 33/33 + 31/31), 56/56 app tests, full GUI click-through PASS; fixed scaffold-bootstrap harness spec paths (relative + skip-if-absent), stale exact-name builder/harness copies re-synced, dead config.PRESETS removed, release-doc counts updated to reasoning-formats state; report: AI/full-system-check/FULL_SYSTEM_CHECK_REPORT_2026-08-09.md



