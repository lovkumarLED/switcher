# FULL SYSTEM CHECK REPORT — 2026-08-09

> Executed per `AI/CONTINUE_FULL_SYSTEM_CHECK_SESSION_33.md` (final pre-public gate).
> Baseline updated: reasoning formats (opencode/openai/claude/gemini/none) shipped since
> the MD was written; harness counts are now 33/33 (opencode V2.7), 31/31 (kilo K1),
> 17/17 (V2.1), 13/13 (V2.5), 56 app unit tests.

## Part A — Document coherence: PASS (after fixes)

- MD links: no broken links in the repo docs (only vendored venv skill files resolve
  outside, excluded).
- Version consistency: 2.5.1 Current everywhere (registry, CHANGELOG, CURRENT_RELEASE,
  README footer, PROJECT_STATE). PASS.
- Template ↔ reference sync: reasoning-format sections added to all builder docs AND
  their `bdf/templates/` counterparts (BUILDER_SPEC, JSON_SCHEMAS, TESTING, ADAPTER,
  PROVIDER_DEVELOPMENT_GUIDE, FOLDER_STRUCTURE, ARCHITECTURE). PASS.
- App-docs truth: app README/rule.md cover reasoning formats; no feature claims missing.
- FIXED (stale counts): CHANGELOG, release_registry.json (2.5.1 entry), CURRENT_RELEASE,
  PROJECT_STATE (x2), ROADMAP, FOLDER_STRUCTURE said "34 app unit tests" /
  "opencode harness 31/31" / "thinking levels (default/minimal/high/max)" → updated to
  56 / 33/33 / reasoning formats; registry gained reasoning-formats feature entry.
  Release-docs consistency re-verified (V2.1 harness 13-17).

## Part B — Builder testing: PASS (after fixes)

- Harnesses: 17/17 (V2.1) + 13/13 (V2.5) + 33/33 (V2.7) + 31/31 (kilo K1).
- Real builds (temp roots): opencode V2.7 + kilo K1 — success, provenance stamped,
  rerun = "No changes detected" (idempotent, hash-verified).
- -WhatIf (writes nothing, filter still warns) and -Doctor (clean, 0 issues) on both.
- Scaffold sandbox -Bootstrap: generates builder+harness+scaffold; bootstrapped builder
  inherits reasoning formats (6 hits); bootstrapped harness passes.
- FIXED — scaffold bootstrap bug: Test 12 + Test 28 in BOTH harnesses hardcoded
  `C:\Users\loveb\...\docs\BUILDER_SPEC*.md`, which scaffold-agent.ps1's string
  replacement mangled (double path) → bootstrapped harnesses failed 2 tests. Fixed:
  resolve relative to `$PSScriptRoot` + skip gracefully when the project doc is absent.
  Real harnesses still assert (docs present); bootstrapped harness now green.
- FIXED — stale copies: `build-kilo.ps1`, `build-opencode.ps1`, `test-opencode.ps1` were
  older snapshots without the latest fixes → re-synced to current versions (backups
  kept as `*.bak`); hash-verified identical now. `test-kilo.ps1` was already synced.

## Part C — App code review: PASS (after fix)

- Secrets/PII: zero keys in tracked repo files (one `sk-distribution` slug = false
  positive, verified). No `.env` files. `app/env/` venv + `state.json` + `__pycache__`
  git-ignored. API responses return `hasKey` only; no route echoes keys. Server never
  logs Authorization headers/bodies (arg-list subprocess, no shell).
- Path traversal: provider ids validated `^[a-z0-9-]+$` on every route (regression
  tests in test_security.py). PASS.
- CORS: `allow_origin_regex` localhost-only, no wildcard. PASS.
- Proxy SSRF: forwards only to the active provider's baseURL, no redirect following,
  key attached only to the configured URL. PASS (plus 502 clean error path tested).
- Theme injection: `_sanitize_css_value` strips `<>{};` + regex validation. PASS.
- gui.html XSS: every innerHTML with dynamic content uses `Utils.esc` or
  `.value`/`.textContent`; chips/levels come from backend constants. PASS.
- PowerShell arg injection: `engine.py` uses arg lists (no shell); profile validated
  against `../`. PASS.
- FIXED — dead code: `config.PRESETS` was unused (gui.html owns the live preset list)
  and had already drifted → removed. 56/56 tests still green.
- node --check on gui.html JS: CLEAN.

## Part D — Full app click-through (temp agents, every button): PASS

Temp agent `fsc-gui` (real builder + schemas), real config untouched (hash-verified):

- Provider modal: 10 presets auto-fill URL/name/SDK, preset→format auto-pick
  (CLI Proxy/OpenAI→openai, Google→gemini, OpenRouter→opencode), Custom no-fill,
  typed-name preservation, eye toggle, empty-name/empty-url errors, dup rejection
  (400), format dropdown swaps chips (claude vs openai level sets), model save →
  correct file + models file. 40/40 checks.
- Cards: plugins add/remove; MCP invalid-JSON error + valid add/remove; Models card
  format follows provider, chips per format, add/remove rows, save; provider card
  test (fail dot + toast), edit, delete; Advanced panel (theme shown); Build panel
  (open + run → BUILD COMPLETE, provider merged into opencode.json + provenance).
- Proxy: POST /v1/chat/completions against unreachable provider → clean 502 JSON.
- Agents: add/switch/remove (switch to a builder-less agent name correctly drops to
  wizard — expected behavior).
- Wizard: full discover → scan → generate (real scaffold in temp) → wizDone → modal.
- Console: zero unexpected JS errors (single 400 = expected dup rejection).

## Part E — Final gate

| Check | Result |
|---|---|
| FSC v1.1 parts + new audits | PASS (fixes above) |
| Harnesses | 17/17 + 13/13 + 33/33 + 31/31 |
| App unit tests | 56/56 |
| node --check gui.html JS | CLEAN |
| Real builds idempotent + provenance | PASS |
| Scaffold sandbox bootstrap | PASS (fixed) |
| No stale duplicate builder/harness copies | PASS (synced, hash-verified) |
| Zero keys/PII in repo | PASS |
| Path traversal/CORS/proxy/theme/XSS/PS-injection | PASS (audited + regression tests) |
| Every GUI button clicked (temp) | PASS |
| Docs updated in same changes | PASS (counts, registry, CHANGELOG, templates) |

## Found & fixed

1. Scaffold bootstrap: hardcoded spec paths in both test harnesses → relative +
   skip-if-absent (test-kilo-v1.ps1 + test-opencode-v2.7.ps1 + synced copies).
2. Stale exact-name copies (build-kilo.ps1, build-opencode.ps1, test-opencode.ps1)
   → re-synced, backups kept.
3. Dead `config.PRESETS` duplicate → removed.
4. Stale doc counts + missing reasoning-formats entry in release docs → updated
   (registry, CHANGELOG, CURRENT_RELEASE, PROJECT_STATE, ROADMAP, FOLDER_STRUCTURE).

## Open questions

- None blocking. Pending user action: commit the changes (repo is 1 commit behind on the
  spec; ~30 files modified/added), then make the repo public.
