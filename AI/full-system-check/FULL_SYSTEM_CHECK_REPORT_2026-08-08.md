# FULL SYSTEM CHECK — Final Pre-Public Gate (session 33, 2026-08-08)

> Executed per `AI/CONTINUE_FULL_SYSTEM_CHECK_SESSION_33.md`. Baseline:
> `AI/FULL_SYSTEM_CHECK.md` v1.1 (Parts 1-7). Everything below was run on the
> CURRENT repo state; every FAIL was fixed and re-run until green.

## Results table

| Part | Result | Detail |
|------|--------|--------|
| 1 Document graph | PASS (fixed) | Broken refs found + fixed: README/CHANGELOG app paths (app/X → app/app/X), FOLDER_STRUCTURE (phantom `opencode.jsonc` removed; `test-opencode.ps1`, `tokenrouter.json`, `requirements.txt`, `superpowers/`, `.claude/`, `.gitignore` added), BUILD_KILOCODE_V1 kilo-doc refs. Remaining refs are historical session artifacts (SESSION_LOG/JOURNEY/AI checkpoints — read-only history by workflow) documented below. |
| 2 Version consistency | PASS (fixed) | CHANGELOG had a hand-written 2.5.1 entry inside the AUTO-GENERATED region while the registry said 2.5.0 Current. DECISION: promoted 2.5.1 into `release_registry.json` (Current, 2026-08-08, builder V2.7); 2.5.0 → Previous. `release-manager.ps1 -Update` run twice: run 1 regenerated CHANGELOG/CURRENT_RELEASE/PROJECT_STATE/bdf-VERSION (rich 2.5.1 entry intact, all 12 sections); run 2 = byte-identical no-op (determinism PASS). README badge/footer/current-release, ROADMAP, CHANGELOG history table, templates README example value synced. Kilo harness count 30/30 → 31/31 in PROJECT_STATE, ROADMAP, bdf/VERSION.md history. |
| 3 Harness + spec sync | PASS | kilo 31/31, opencode 31/31, legacy 17/17 (V2.1) + 13/13 (V2.5) — all exit 0. Re-run after every builder change; still green. |
| 4 Regeneration guarantee | PASS | Real builds on the real configs (snapshot + hash-verified restore): kilo build green + idempotent ("No changes detected" on rerun), dual-key mirroring verified in output JSON, provenance stamped. opencode.json on disk was STALE (18→16 models + missing tokenrouter) — rebuilt to match sources; rerun = no changes. |
| 5 Session snapshots | PASS (fixed) | snapshot-22 was the pin; app + builders changed since → NEW pin `snapshot-33` created (9 building-block docs + app README + rule.md, 11 files). |
| 6 Session artifacts | PASS | SESSION_LOG 5-entry rotation (new session 33 entry), JOURNEY Current Position updated. No stale generated files (release-manager determinism verified). |
| 7 Template ↔ reference sync | PASS (fixed) | 10 drifted pairs synced (ARCHITECTURE, BUILDER_SPEC, CONTRIBUTING_FOR_AI, DEVELOPER_GUIDE, FOLDER_STRUCTURE, JSON_SCHEMAS, PROJECT_STATE, ROADMAP, TESTING; CHANGELOG resolved by the 2.5.1 regeneration). Placeholder audit 66/66 clean. Framework bumped 2.2.9 → 2.2.10 (recorded in bdf/VERSION.md). |
| A.2 Dual-key contract | PASS (fixed) | JSON_SCHEMAS.md provider.omniroute table now resolves `options.apiKey` (+ new `provider.omniroute.options` table). provider.schema.json verified to permit `options.apiKey` (inner object unconstrained). All provider-file examples carry both keys. |
| A.3 jsonc-shadow warning | PASS (fixed) | Added to DEVELOPER_GUIDE, BUILDER_EXTENSION_GUIDE, TROUBLESHOOTING, ADAPTER, ARCHITECTURE, BUILDER_SPEC, PROFILE_CREATION_GUIDE, app/rule.md, FOLDER_STRUCTURE (+ template), AGENT.md + 4 templates. |
| A.4 App-docs truth | PASS (fixed) | README "Try again" button claim corrected (Run re-enables); CLI Proxy placeholder standardized (`http://localhost:PORT/v1` in gui.html + config.py); preset/SDK/feature claims verified against gui.html. |
| B Builder testing | PASS | All harnesses + real builds + -WhatIf (writes nothing) + -Doctor + scaffold sandbox (`-List` registry; `-Bootstrap` for throwaway agent → generated builder carries dual-key normalization, generated harness 31/31). Hash-compare: build-kilo/test-kilo/build-opencode aliases byte-identical; test-opencode.ps1 was stale → synced from v2.7. |
| C App code review | PASS (fixed) | See "Found & fixed" below. 48/48 unit tests green (34 + 14 new security regression tests), node --check clean, zero secrets in system artifacts. |
| D GUI click-through | PASS | Full battery on the REAL kilo config with snapshot + hash-verified restore (39/39 files byte-identical incl. state.json). Every preset, every card, error paths, proxy chat, wizard in a temp dir. |
| E Final gate | PASS | All checklist items green; docs updated in the same changes; report written; SESSION_LOG + JOURNEY updated; committed. |

## Found & fixed (session 33)

**App (docs/app):**
1. **Path traversal in provider ids** (C1, HIGH): `PUT/DELETE /api/providers/{id}`, `/api/switch`, `/api/test` took the id VERBATIM (`../../` could escape `providers/`). Fixed: `^[a-z0-9][a-z0-9-]*$` validation in agentstore (read/write/delete provider, models_file) + routes; regression tests.
2. **Theme injection** (C1, MEDIUM): rule.md `font` value was unvalidated and injected raw into `<style>` — `</style>` breakout possible. Fixed: font regex + breakout-char rejection in rules.py; serve.py sanitizes all values (defense in depth); regression tests.
3. **Proxy SSRF-via-redirect** (C1, MEDIUM): urllib followed upstream redirects, which could re-point the bearer token at an arbitrary host. Fixed: no-redirect opener (3xx passed through); regression test with a live redirecting server.
4. **gui.html XSS** (C1, LOW): provider name interpolated via `innerHTML` into an `<option>` (line 1021). Fixed: `textContent`.
5. **Preset SDK/name auto-fill broken** (found by click-through, D): `Providers.setSdk` was defined but not exported → `f.preset.onchange` threw, SDK + name auto-fill never ran. Fixed: exported `setSdk`.
6. **Build wrote to the wrong config** (found by click-through, D, HIGH): `/api/build` never passed `-ConfigRoot`; builders default to the real opencode/kilo dir, so building any other agent (e.g. a wizard agent in a temp dir) overwrote the REAL opencode.json. Fixed: engine passes `-ConfigRoot <agent dir>`; regression test.
7. **Builder verification false-fail on empty sections** (found by click-through, D): opencode V2.7 `Verify-Plugins`/`Verify-Mcp` threw when plugins.json/mcp.json existed but were empty (fresh scaffold). Fixed: guards require ≥1 item; harness re-run 31/31.
8. **K1 + V2.7 `-Doctor` crash on missing default profile** (found by Part B): `-Doctor` with no `-Profile` threw before the Doctor branch when `profiles/default` didn't exist (kilo). Fixed: Doctor falls back to the first available profile with a notice; harness re-run 31/31.
9. Agent-name guard (`^[A-Za-z0-9][A-Za-z0-9._-]*$`) + build-profile traversal guard added; regression tests.
10. Dead `#bldRes` reference removed from gui.html.

**Docs:** version 2.5.1 promotion (see Part 2), kilo 31/31 counts, app module paths, FOLDER_STRUCTURE tree, 10 template pairs, jsonc-shadow everywhere, dual-key tables, framework 2.2.10, snapshot-33, README sync rule honored in the same changes.

**Live configs (outside the repo):** aliases synced (build-kilo.ps1, build-opencode.ps1, test-opencode.ps1 byte-identical to their versioned masters); stale opencode.json rebuilt.

## Documented historical references (not errors, listed for transparency)

- SESSION_LOG.md / JOURNEY_TO_V3.md session entries reference `app/agentstore.py` / `app/rules.py` (pre-relocation shorthand) — session entries are read-only per `_agent/SESSION_WORKFLOW.md`.
- AI/*.md checkpoint docs reference planned/never-created files (`providers/modal.json`, `AGENTS.md`, `docs/BUILDER_SPEC_KILO.md`, `profiles/experimental|minimal/*`, `docs/RELEASE_NOTES_V2.1.md`, `docs/RELEASE_MANAGER.md`) — historical build plans; kilo adapter refs resolve to `~/.config/kilo/docs/BUILDER_SPEC_KILO_ADAPTER.md` (kilo project, outside this repo).
- `.superpowers/snapshot-19/22` are frozen historical pins by design.
- `bdf_dashboard.png` (untracked, repo root) is an orphan file — not referenced by any doc; NOT deleted (user decision requested).

## Testimony of discipline

- No-Secrets: keys never echoed; secrets scan (sk-/wk-/ws-/nvapi/gsk_/AIza/ghp_/github_pat/AKIA/Bearer patterns) over tracked files = zero hits (only false positives like `mask-`, `task-`, `sdd`).
- Backups/state.json/env/venv git-ignored (verified); `.claude/settings.local.json` ignored via global gitignore.
- Collateral note: the kilo builder's designed keep-10 backup rotation pruned two pre-existing backups during the real-build tests; one additional pre-existing backup (`kilo_2026-08-08_21-01-19.json`) was removed in the cleanup window by mistake — backup dir content otherwise restored; user-visible config files were byte-identical.

## Open questions

1. **`bdf_dashboard.png`** (untracked orphan at repo root, ~245 KB): delete, add to the repo, or keep untracked? (Recommended: delete before making the repo public, unless you want it as a doc asset.)
2. **Kilo harness vs opencode harness parity**: kilo has a dedicated "Dual-key options mirror" test (#31); the opencode harness's #31 is "No literal keys in output" (dual-key behavior verified via kilo harness + real-build checks). Adding an explicit dual-key test to the opencode harness would push it to 32/32 and require updating the documented counts everywhere — left as-is deliberately.
3. **K1 in the release registry**: the registry tracks docs releases (Current = 2.5.1, builder V2.7); KiloCode K1 is a separate project's builder, listed under bdf/VERSION.md "Compatible Projects" only. Promoting K1 into the registry would be a schema decision — deferred.

## Acceptance checklist (all green)

- [x] FSC v1.1 Parts 1-7 PASS on the current state (fixed + re-passed)
- [x] Dual-key + jsonc-shadow documented consistently across ALL docs/templates
- [x] Kilo harness 31/31, opencode 31/31, legacy 17/17 + 13/13
- [x] Real builds (kilo + opencode) green, idempotent, provenance stamped
- [x] Scaffold sandbox bootstrap inherits normalization + K1 harness
- [x] No stale duplicate builder/harness copies (hash-compared)
- [x] Zero keys/PII in app code, docs, templates, logs, git
- [x] Path traversal fixed + regression-tested; CORS/proxy/theme/XSS audited + fixed
- [x] Every GUI button clicked on real kilo config; restore hash-verified
- [x] Unit tests 48 green; node --check clean
- [x] Docs updated for every fix; session log + journey current
- [x] Committed; report handed to user; repo ready to go public

**Verdict: the repo is READY to go public** (after the `bdf_dashboard.png` decision).
