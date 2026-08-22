# CONTINUE — FULL SYSTEM CHECK v2 (final gate before going public on GitHub)

> Resume file for the next session. Read this first, then execute.
> This is the LAST check: docs coherence + builder testing + app code review
> + full app click-through — everything must be green before the repo goes
> public on GitHub.
> Baseline: `AI/FULL_SYSTEM_CHECK.md` (v1.1, sessions 22+26, all 7 parts PASS)
> is the builder/docs runbook. THIS file extends it with the app (built in
> session 29, extended in 31-32 and never FSC'd) and makes it the public gate.

---

## Why

The user is about to make `lovkumarLED/opencode-builder` **public**. Before
that: (1) the docs must form one coherent story that produces the intended
build, (2) the builders must be bug-free, (3) the app must have no
vulnerabilities, no leaked keys/PII, no broken buttons. The user explicitly
approved testing **on the real kilo config folder** (snapshot + hash-verify
restore, backup-first) and a **check → fix → check** loop until clean.

## Current baseline (sessions 29-33, verified)

- App: docs/app/ — FastAPI + gui.html, 56/56 unit tests, dual-key
  write_provider (apiKey + options.apiKey), real-provider presets
  (TokenRouter, Modal, OpenAI, Google Gemini, OpenRouter, NVIDIA NIM) with
  SDK auto-fill, reasoning formats per provider (opencode/openai/claude/
  gemini/none with per-format variant JSON), SDK selector (15 packages),
  models/plugins/MCP cards, multi-agent registry, /v1 proxy on 127.0.0.1:9090.
- Builders: kilo K1 + opencode V2.7 — dual-key merge normalization present,
  reasoning formats present (interactive prompt + output filtering), kilo
  harness 31/31, opencode harness 33/33, legacy 17/17 + 13/13.
- Docs: README v2.5 (dual-key contract, presets, user rules, reasoning
  formats), guides v1.1, CHANGELOG 2.5.1 (reasoning formats entry),
  templates synced (reasoning formats in all builder templates).
- FSC session 2026-08-09 completed: report in
  `AI/FULL_SYSTEM_CHECK_REPORT_2026-08-09.md` — all gates PASS; fixes:
  scaffold-bootstrap harness paths (relative + skip-if-absent), stale
  exact-name builder/harness copies re-synced, dead config.PRESETS removed,
  release-doc counts updated.
- Repo is PRIVATE. Changes from the reasoning-formats + FSC work are NOT yet
  committed.

## Out of scope

- Making the repo public (user action, after this check passes).
- New features. This is verification + fixes only.
- Cursor integration, auth.json integration (not needed — Kilo works).

---

## Part A — Document coherence audit (every MD + template + optional PDF)

Read EVERY file and answer: do they complement each other and produce the
intended build? Run the existing runbook first:

1. Execute `AI/FULL_SYSTEM_CHECK.md` v1.1 (Parts 1-7) against the CURRENT
   repo state (sessions 29-32 added the app + presets — expect new findings):
   - Part 1 Document graph — every MD link resolves; no phantoms; no orphan
     files. NEW: app README + rule.md + gui.html must be in the graph.
   - Part 2 Version consistency — release_registry vs CHANGELOG (2.5.1!)
     vs CURRENT_RELEASE vs PROJECT_STATE vs bdf/VERSION.md vs ROADMAP vs
     README footer (Version 2.5.0 vs CHANGELOG 2.5.1 — check + decide).
   - Part 3 Harness + spec sync — spec-named functions/stages exist in the
     builders; harness counts match docs (kilo 31/31, opencode 31/31 — the
     README badge + CHANGELOG + JOURNEY must ALL say this).
   - Part 4 Regeneration guarantee — clean-room rebuild. snapshot-22 is the
     pin; decide whether a snapshot-33 pin is warranted (app + builders
     changed since).
   - Part 5 Per-session snapshot rule. Part 6 Session artifacts (5-entry
     rotation, Journey truth). Part 7 Template ↔ reference sync.
2. NEW Part A.2 — **dual-key contract everywhere**: every doc/template that
   shows a provider file must show BOTH `apiKey` and `options.apiKey`
   (PROVIDER_DEVELOPMENT_GUIDE + template done; check BUILDER_SPEC,
   BUILDER_SPEC_KILO_ADAPTER, ADAPTER, bdf/templates/BUILDER_SPEC.template.md,
   ARCHITECTURE, JSON_SCHEMAS + schemas/*.schema.json — does provider.schema
   allow options.apiKey?).
3. NEW Part A.3 — **jsonc-shadow warning** in every doc that mentions
   opencode configs (done: README, app README, PROVIDER_DEVELOPMENT_GUIDE;
   check DEVELOPER_GUIDE, BUILDER_EXTENSION_GUIDE, TROUBLESHOOTING).
4. NEW Part A.4 — **app docs truth**: app/README vs gui.html features vs
   app/rule.md rulebook vs root README app section — no feature claims that
   don't exist, no features missing from docs (presets, dual key, agents,
   cards, proxy, wizard).
5. Optional PDF: if the user provides one, audit it the same way.

## Part B — Builder testing (kilo + opencode, fix loop)

1. `scripts/test-kilo-v1.ps1 -NonInteractive` → expect 31/31.
2. `scripts/test-opencode-v2.7.ps1 -NonInteractive` → expect 31/31.
3. Legacy harnesses (opencode v2.1 17/17, v2.5 13/13) — still pass?
4. Real builds: `/api/build` for kilo (active agent) + `build-opencode-v2.7.ps1`
   → output JSON parses, providers carry dual keys, models merge, provenance
   stamped, rerun = "No changes detected".
5. `-WhatIf` and `-Doctor` on both.
6. scaffold-agent.ps1: `-List` (registry), and a sandbox `-Bootstrap` for a
   throwaway agent (temp dir) — generated builder+harness inherit the
   dual-key normalization + K1 fixtures (verify, don't assume).
7. **FRESH-CLONE GATE (mandatory):** the app must generate working builders
   with ZERO external scripts. Test: with `BDF_SCRIPTS_DIR` unset and no
   engine outside the repo, scaffold a temp opencode agent AND a temp kilo
   agent via `/api/scaffold` → build both → `opencode.json` + `kilo.json`
   generated. This catches any regression where the app borrows scripts from
   the author's machine (the self-contained engine in `app/engine/` is the
   requirement).
7. Check for **duplicates/staleness**: build-kilo.ps1 == build-kilo-v1.ps1,
   test-kilo.ps1 == test-kilo-v1.ps1, build-opencode.ps1 ==
   build-opencode-v2.7.ps1 (hash-compare); older builders (v2.5/v2.1) are
   historical — leave unless a test breaks.
8. Any FAIL → fix → re-run the affected harness(es) → repeat until all green.

## Part C — App code review (code-reviewer mindset, vulnerability hunt)

Read `docs/app/app/*.py` + `server.py` + `gui.html` + `start.bat` +
`requirements.txt` + `state.json` + `rule.md` like an adversarial reviewer:

1. **Secrets/PII leaks:**
   - grep the whole app for key patterns: `sk-`, `wk-`, `ws-`, `nvapi`,
     `gsk_`, `AIza`, `ghp_` in app code, tests, gui.html, READMEs, templates,
     backups, `.playwright-mcp/`, `env/` (venv is fine), logs. System
     artifacts must be ZERO; user files (kilo/opencode configs) keep theirs.
   - API responses must never contain the key (only `hasKey`) — audit every
     route. Server logs must not log Authorization headers/bodies.
   - state.json / backup/ contents: paths + keys? (backups hold user keys —
     fine on disk, but they must NOT be inside the git repo).
   - No `.env` file exists (app config is state.json + rule.md) — confirm
     start.bat doesn't echo/leak anything, and the env/ venv is git-ignored
     or outside the repo (it IS inside docs/app/env — verify .gitignore!).

2. **Known vulnerability suspects to verify + fix:**
   - **Path traversal in provider id**: `delete_provider`/`read_provider`/
     `write_provider`/`models_file` build paths as `f"{provider_id}.json"`
     with the id taken VERBATIM from the URL (`/api/providers/{provider_id}`)
     — `../../` in the id could touch files outside `providers/`. POST
     slugifies (safe), PUT/DELETE do NOT. Fix: validate `^[a-z0-9-]+$` (or
     reuse slugify) in the routes before touching the filesystem.
   - **CORS**: `allow_origin_regex` localhost-only — confirm no wildcard.
   - **Proxy** (`proxy.py`): only forwards to the ACTIVE provider's baseURL?
     Can a crafted request redirect it to an arbitrary host (SSRF)? Host
     header / path handling? Confirm the key is attached only to the
     configured provider URL.
   - **Theme injection** (`serve.py`/`rules.py`): rule.md front-matter is
     injected into `<style>` — is it validated (no `</style>` breakout)?
   - **gui.html XSS**: any `innerHTML` with unescaped provider/model/plugin/
     MCP names (user-typed strings)? Audit every template literal.
   - **Path handling in agents/discovery/scan**: arbitrary directory reads —
     local-only, but check for traversal beyond intent + symlink concerns.
   - **MCP config**: `write_mcp` stores arbitrary JSON — validated? Any
     command execution surface is user-local by design (local MCP), confirm
     nothing auto-executes.
   - **Zip/atomic-write**: `_write_json` uses tmp+replace — good; check the
     tmp file never carries secrets to a world-readable location.
   - **Wizard/scaffold**: engine.py passes user strings into PowerShell
     args — check for injection (quoting).

3. Fix everything found, add regression unit tests for each fix (esp. the
   path-traversal one), keep the suite at ≥34 and green.

## Part D — Full app click-through (real kilo config, every button)

Use the session-29 battery pattern: **snapshot → click → hash-verify restore**:

1. Snapshot kilo (`~/.config/kilo`) + app `state.json` to temp; capture a
   SHA256 manifest of every file.
2. Start the app (`start.bat` or `env\Scripts\python server.py`), open the
   GUI (playwright browser).
3. Click through EVERYTHING on the REAL kilo config:
   - Dashboard: agents card (add/remove/switch), active hero, provider cards
     (test/edit/delete+re-add), plugins add/remove, MCP add (incl. invalid
     JSON error path) + remove, models add/remove, build panel, advanced.
   - Add-provider modal: EVERY preset (incl. the 6 real providers — URL +
     SDK auto-fill + name auto-fill), Custom, eye toggle, dup rejection,
     empty-name/empty-url errors, test connection (against localhost
     omniroute — green; tokenrouter — live but do NOT spam), SDK "Other".
   - Switch provider → proxy chat: POST a tiny `/v1/chat/completions` through
     127.0.0.1:9090 with the active provider.
   - Wizard flow with a throwaway agent dir (temp) — full discover→scan→
     scaffold→build cycle (generates real builders in temp).
4. Restore the snapshot; hash-verify every file byte-identical. Anything the
   click-through broke gets fixed + re-tested.
5. Every button must work; any dead button / JS error (console) = bug → fix →
   re-run node --check + unit tests → re-click.

## Part E — Fix loop + final gate

1. Cycle: any FAIL in A-D → fix → re-run that part → repeat until all green.
2. Final sweep: unit tests 34+ green, kilo 31/31, opencode 31/31 + legacy
   harnesses green, `node --check` on gui.html JS, no secrets in system
   artifacts, git status clean of stray files (.playwright-mcp ignored).
3. Update docs to match every fix (README sync rule — same change!).
4. Write the report (see format below), update SESSION_LOG + JOURNEY,
   commit everything (docs + fixes) — then the user makes the repo public.

## Verification checklist (acceptance)

- [ ] FSC v1.1 Parts 1-7 PASS on the current state (or fixed + re-passed)
- [ ] Dual-key + jsonc-shadow documented consistently across ALL docs/templates
- [ ] Kilo harness 31/31, opencode 31/31, legacy 17/17 + 13/13
- [ ] Real builds (kilo + opencode) green, idempotent, provenance stamped
- [ ] Scaffold sandbox bootstrap inherits normalization + K1 harness
- [ ] No stale duplicate builder/harness copies (hash-compared)
- [ ] Zero keys/PII in app code, docs, templates, logs, git
- [ ] Path traversal fixed + regression-tested; CORS/proxy/theme/XSS audited + fixed
- [ ] Every GUI button clicked on real kilo config; restore hash-verified
- [ ] Unit tests ≥34 green; node --check clean
- [ ] Docs updated for every fix; session log + journey current
- [ ] Committed; report handed to user; repo ready to go public

## Report format

`AI/FULL_SYSTEM_CHECK.md` style, one line per check: `PASS` / `FAIL → fixed →
re-PASS`, plus a "Found & fixed" list and an "Open questions" list (e.g.,
version header 2.5.0 vs CHANGELOG 2.5.1 decision).

---

## Resume prompt

```
Read C:\Users\loveb\.config\opencode\docs\AI\CONTINUE_FULL_SYSTEM_CHECK_SESSION_33.md

Follow AGENT.md + _agent/SESSION_WORKFLOW.md.
ROLE: execute the FINAL full system check (pre-public gate).

1. Part A: re-run AI/FULL_SYSTEM_CHECK.md v1.1 (Parts 1-7) on the current
   state, then audit every MD + template for the dual-key contract, the
   opencode.jsonc shadow warning, and app-docs truth. Fix inconsistencies.
2. Part B: run ALL harnesses (kilo 31/31, opencode 31/31, legacy 17/17 +
   13/13), real builds, -WhatIf/-Doctor, a sandbox scaffold -Bootstrap, and
   hash-compare builder/harness copies for staleness. Fix + re-run until
   green.
3. Part C: adversarial code review of docs/app (secrets/PII leaks, path
   traversal in provider ids, CORS, proxy SSRF, theme injection, XSS in
   gui.html, PS arg injection). Fix everything, add regression tests.
4. Part D: full GUI click-through on the REAL kilo config (every preset,
   every card, every error path, proxy chat, wizard in a temp dir) with
   snapshot + hash-verified restore.
5. Part E: fix loop until ALL checklist items pass; update docs in the same
   changes; write the report; update SESSION_LOG + JOURNEY; commit; report
   readiness for making the repo public.
Discipline: snapshot/hash before destructive tests, No-Secrets (mask keys,
never echo), backup-first, commit only per user, README sync rule.
```
