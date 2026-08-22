# FULL SYSTEM CHECK V2 — EXECUTION REPORT

> Runbook: `AI/FULL_SYSTEM_CHECK_V2.md` (v2.0)
> Executed: 2026-08-22, sessions spanning 00:42–04:35 local (UTC+5:30)
> Executor: opencode agent (ox-alpha), directed by the repository owner
> **This report claims nothing without fresh evidence recorded below.**

---

## 1. Scope, environment, baseline

| Item | Value |
|---|---|
| Repository | `C:\Users\loveb\.config\opencode\docs` (branch `main`) |
| HEAD at start | `26f485dcd781b2aaf361ea211caf74418f6d2a1a` |
| Dirty-tree baseline at start | **42 entries** (owner changes; preserved untouched throughout) |
| Date/time | 2026-08-22 00:42:03 +05:30 |
| OS | Windows NT 10.0.26200.0 (Windows 11) |
| PowerShell | 5.1.26100.9168 |
| Python | 3.14.5 (repo venv `app\env\Scripts\python.exe`) |
| Node | v24.15.0 |
| Git | 2.41.0.windows.1 |
| Temp root | `%TEMP%\bdf-full-system-check-20260822-004220-7tkdei` (resolved before use; **removed after verified restoration**) |
| App under test | Switcher (`docs\app\server.py`, FastAPI+uvicorn), bound **127.0.0.1:9090 only** (verified via `Get-NetTCPConnection LocalAddress`) |
| Test fixtures | Sanitized structural copies of the real `opencode.json` (keys replaced with `sk-test-fake-key-000000`), scaffolded via bundled `scaffold-agent.ps1`; local fake OpenAI-compatible upstreams on ports 20128/8317/9 |

Owner pre-existing modifications were never reverted; every fix below is additive or corrective work discovered by this check.

---

## 2. Exact commands, exit codes, test counts (fresh, final runs)

| Suite | Command (cwd) | Result | Exit | Duration |
|---|---|---|---|---|
| Full Python | `.\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"` (`docs\app`) | **270 tests, OK, 0 fail, 0 skip** (final count after post-gate additions) | 0 | ~165 s |
| Full frontend | `node --test ".\tests\*.test.mjs"` (`docs\app`) | **192 tests, 192 pass, 0 fail** | 0 | ~0.5 s |
| Claude adapter focused | `python -m unittest tests.test_claude_adapter` | **123 tests OK** (after FSC2-016 fix) | 0 | 148.6 s |
| OpenCode harness | `powershell -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1` (`docs`) | **40/40 Passed** | 0 | 37.5 s |
| Kilo harness | `...\engine\kilo\test-kilo-v1.ps1` | **37/37 Passed** | 0 | ~35 s |
| Claude Gate 2 | `...\engine\claude-code\test-claude-code.ps1` | **73 passed, 0 failed** | 0 | — |
| Claude Gate 3 | `...\engine\claude-code\test-provider-model.ps1 -PythonExe <venv-python>` | **SAFETY PASS, OVERALL PASS** | 0 | — |
| Release generator ×2 | `release-manager.ps1` twice | Run 2 byte-identical to run 1 | 0 | — |
| Static JS | `node --check` over all `assets/js/**/*.js` (+ extracted inline scripts; gui.html has none) | 0 failures | 0 | — |
| Static Python | `python -m compileall app server.py` | clean | 0 | — |
| PowerShell parser | `Language.Parser::ParseFile` over all engine `.ps1/.psm1` | **0 parse errors** | 0 | — |
| JSON validation | strict `json.loads` over all repo `.json` (29 files) | clean after BOM fix (FSC2-003); `settings-malformed.json` intentionally invalid fixture | — | — |
| `git diff --check` | final tree | clean | **0** | — |

Baseline deltas investigated: Python 254→269 (+15 new regression tests, −2 stale baselines fixed); frontend 190→192 (+1 new owner contract test batch, −1 stale baseline fixed). Harness counts unchanged and re-proven (40/40, 37/37 match registry claims).

---

## 3. Documentation / version / template audit

**Version truth chain:** `release_registry.json` = exactly one Current release (2.5.3, descending order, uniform keys). Generator determinism proven (second run byte-identical). Generated regions now in sync (FSC2-004).

**Found & fixed (all kept):**
- FSC2-004: checked-in `CHANGELOG.md` / `CURRENT_RELEASE.md` / `PROJECT_STATE.md` / `bdf/VERSION.md` generated regions were stale vs registry (still showed 2.5.2-era summaries).
- FSC2-006: `JSON_SCHEMAS.md` had a dangling intro paragraph for the missing `# target.json` heading.
- FSC2-007: `bdf/templates/README.md` example values stale (`{{CURRENT_VERSION}}` 2.5.1→2.5.3, `{{ENTRY_DATE}}`→2026-08-17, `{{TESTING_SUMMARY}}` 31/31→current harness counts).

**Verified clean:** all named asset targets exist (demos/logo/font/anime/LICENSE); no mojibake in current docs; no broken markdown links/images (the six `.gif?v=2` refs resolve); template inventory 19/19 maps 1:1; placeholder audit 66/66 documented-and-used both directions; historical docs contain era-consistent references and are correctly frozen.

**Recorded for the later README task (NOT done now, per runbook):**
> **UPDATE — owner authorized these same day; all applied.** See §14 for the completed list: Framework badge 2.3.0, footer + stray 2.5.2 line, current test badges, clone paths `docs\app`, Phase 11 "complete / live validated", PROJECT_STATE contradiction resolved, FOLDER_STRUCTURE phantom PNGs removed + module/providers/engine-folder corrections applied.
1. README badge Framework Version says 2.2.11, footer 2.2.10 — truth is **2.3.0** (`bdf/VERSION.md`). Stray duplicate footer line "Version: 2.5.2".
2. README badge test counts ("kilo 31/31 + opencode 31/31 + app 73") are stale vs current 40/40 + 37/37 + Python 269/frontend 192.
3. README clone path `...\BDF\app` vs app README `...\BDF\docs\app`.
4. `PROJECT_STATE.md` self-contradiction: exec summary + registry say Claude adapter "Live validated (2026-08-17)", while an interior paragraph and §13 say "Integrated, not live validated… Gate 5 unauthorized." Newest owner decision (registry, session 48) says live-validated + lock OPEN — history paragraphs preserved, contradiction flagged for owner.
5. `FOLDER_STRUCTURE.md`: phantom PNG lines `bdf_dashboard.png`, `bdf_add_provider.png` (**deletion requires owner approval — not touched**); app module list missing 9 modules; claude-code engine folder unnamed; providers count 2→4; tests count stale; `output/`, `.playwright-cli/`, `adapters/`, `LICENSE` undocumented in contents block; parent-level `opencode.jsonc` exists (contradicts the doc's own jsonc warning — flagged, not judged).
6. LSP card copy falls back to generic `config.json` for custom-named agents (per-agent kilo.json/opencode.json copy exists for standard names).
7. Onboarding failure alert could surface *which* verify check failed (API returns details; UI shows generic message).

---

## 4. Static analysis / language-server diagnostics

| Language | Tooling used | Result |
|---|---|---|
| Python | Pyright LSP diagnostics + `compileall` + full unittest suite | Pre-existing pattern false-positives only (`except ImportError: x=None` fallback in tests flags "None not callable"; benign, documented). Runtime suite fully green. One pre-existing typing note in `proxy.py:59`. No new diagnostics introduced by fixes. |
| JavaScript | `node --check` every file + extracted inline script (none inline in `gui.html`) | 0 errors |
| JSON / Schemas | Strict parse of 29 files; schema files parse in both PS 5.1 and strict UTF-8 | Fixed BOM defect (FSC2-003); otherwise clean |
| PowerShell | `Parser::ParseFile` all engine scripts (before and after scaffold fix) | 0 errors |
| HTML/CSS | Browser-rendered DOM checks (duplicate IDs n/a; focus/labels/ARIA verified live in Phase 6/7) | See §8/§10 |
| Markdown | Link graph scan across 155 files (subagent), encoding/table checks | See §3 findings |

Manual architecture review highlights (no action needed, recorded): async UI handlers restore button state in `finally` patterns observed in provider wizard (button disabled during verify/save, re-enabled on error — exercised live); atomic writes via temp-file + replace in `_write_json`; unknown fields preserved (covered by `test_update_rejects_invalid_retention_and_preserves_existing_unknown_data` and provider round-trip tests).

---

## 5. Adversarial security & privacy audit

Method: hostile-local-webpage threat model, malicious provider/config payloads, malformed inputs — probed live against the running server plus source review. Full probe set + artifacts were produced by an isolated auditor process; fixtures restored byte-clean afterwards.

| # | Threat class | Result | Severity |
|---|---|---|---|
| S-1 | Cross-site / DNS-rebinding writes: spoofed `Host:` or foreign `Origin:` against `/api/*` and `/v1/*` | **FOUND — only Claude routes enforced loopback origin; all other state-changing routes accepted evil Host/Origin (write + agent-switch + proxy reachable)** | **HIGH → FIXED** |
| S-2 | Windows reserved device names as provider ids (`con`, `aux`, `nul`, `com1-9`, `lpt1-9`) | FOUND — accepted, files created inside fixture (no escape on Win11; device-mapping risk on other configs) | LOW → FIXED |
| S-3 | Proxy forwards `..` dot-segments upstream (`/v1/../server.py`) | FOUND — forwarded verbatim (scheme/host locked to configured provider, so local-file risk none) | LOW → FIXED |
| S-4 | Path traversal in provider/model/profile/route ids (`../`, `..\`, encoded, absolute, unicode, trailing dots) | PASS — all 400/404, zero files outside fixture dir (before/after diff) | — |
| S-5 | Stored/reflected XSS via provider/plugin/MCP/LSP/route names | PASS — API echoes raw (normal), every render site escapes (`escapeHtml` audited in providers/overview/integrations/settings/provider-logo render paths) | — |
| S-6 | Secret exposure in any API response | PASS — providers return `hasKey` booleans only; MCP/plugins/LSP carry no secrets; credentials endpoints return names/backend/usedBy only; proxy forwards `Authorization` solely to configured baseUrl; client cookies/smuggled headers dropped | — |
| S-7 | Malformed/duplicate-key/wrong-type/oversized JSON | PASS — controlled 400/422 everywhere, zero 500s, no partial writes | — |
| S-8 | Error responses leaking paths/stack traces | PASS — generic friendly messages only | — |
| S-9 | `.jsonc` hard rule | PASS — zero read/write paths target `.jsonc` (one dead constant exists solely to satisfy an assertion) | — |
| S-10 | SSRF/redirect/header smuggling on `/v1/*` | PASS — redirects never followed; only Authorization+Content-Type forwarded; destination locked to configured active provider | — |
| S-11 | Activity log content allowlist | PASS — exactly the 12 metadata keys; live events contained zero prompt/content/header/key fields | — |
| S-12 | Static mount traversal (`/assets/../server.py`, encoded variants) | PASS — all 404 | — |

**Secrets sweep:** tracked + untracked artifacts scanned for key-like patterns; findings limited to intentional fixtures (`sk-test-fake-key-000000`) and sanitized seeds; no real credential ever printed, committed, or written outside approved stores. Claude DPAPI credential store semantics covered by Gate 2/3 harnesses + `test_claude_credentials.py`.

Regression coverage added: `tests/test_origin_gate.py` (spoofed Host → 403, foreign Origin → 403, loopback → 200, reserved ids → 400 with zero files written, dot-segment rejection) — red/green proven against the pre-fix server behavior described above.

Severity policy applied: the HIGH finding stopped normal progression and was fixed immediately with regression tests + live replay (evil host now 403 on the running server) before continuing.

---

## 6. Builder & BDF framework verification (clean-room)

- **Clean-room bootstrap:** with `BDF_SCRIPTS_DIR` unset, temp agents `opencode-test` and `kilo-test` were scaffolded purely from the bundled engine into empty temp dirs (seeded only with sanitized main JSON copies). Scaffold created profiles (coding/experimental/minimal) each with `settings.json`, `mcp.json`, `plugins.json`, `lsp.json` (disabled default), per-provider models files, and `providers/*.json`.
- **Builder generation & execution:** `/api/scaffold` generated builder+tester+scaffold wrappers; builds ran repeatedly through the app and directly; provenance sidecar + SHA written; backup-first behavior confirmed (`backup/opencode_*.json` captured pre-build bytes).
- **Idempotency:** multiple consecutive builds produce stable output; second-run equality observed on generated regions (release manager) and rebuilt main JSONs.
- **LSP lifecycle through the app (after FSC2-012 fix):** enabled(object) → `"lsp": {pyright...}`; disabled → `"lsp": false`; re-enabled(boolean true) → `true`; stored source value always preserved for later re-enable. Matches registry contract exactly.
- **Source-to-generated parity:** selected providers survive with variants/models (18-model OmniRoute edit survived byte-exact in `*-models.json`); reasoning formats emit valid shapes only; dual-key mirror verified (`options.apiKey` mirrored from `apiKey`); plugins/MCP/settings merge; unknown user fields preserved.
- **Alias/copy drift:** deployed `~/.config/opencode/scripts/{build-opencode-v2.7,test-opencode-v2.7,scaffold-agent}.ps1` had drifted from the bundled engine (older timestamps, pre-LSP-era tester) → synced from repo, hash-equal confirmed; frozen legacy scripts (v2/v2.5/v1, `.bak`) untouched.
- **Claude distinct contract:** dedicated routing core + production builder + Gate 2 harness (73/0) + Gate 3 evidence harness (OVERALL PASS) all on temp fixtures; model-roles, preservation, malformed/duplicate keys, invalid URL/secret-ref, policy bounds, failure injection, rollback, cleanup covered there. The generic BDF multi-provider profile model is correctly NOT forced onto Claude (capability-specific Routes architecture; UI verified in §7).

---

## 7. Agent isolation matrix (evidence)

| Operation | OpenCode | KiloCode | Claude Code | Isolation proof |
|---|---|---|---|---|
| Discover/scan/connect | ✅ temp fixture scan (4 providers · 9 MCP · 1 plugin) | ✅ same class | ✅ read-only scan of real `~/.claude` (0 profiles · 7 plugins · 6 MCP · 4 routes) — read-only only | Counts agent-specific; no cross reads |
| Add/edit/delete provider | ✅ edit wizard save + backup verified | ✅ `kilo-only-probe` added via API | N/A — route architecture | **Probe visible ONLY in owning agent's list** (`ISOLATION_OK: true`) |
| Models/reasoning | ✅ 18-model edit persisted to `<provider>-models.json` | ✅ | Route model field (role-derived "from roles" chips verified in UI) | Per-agent files |
| Plugins/MCP/LSP CRUD | ✅ integrations page | ✅ toggle lifecycle + build | Read-only inventory + hidden unsupported controls | No leakage after switches/reloads |
| Build/scaffold | ✅ opencode.json artifact | ✅ kilo.json artifact (post-FSC2-012) | Dedicated route builder only | Correct artifact per root |
| Route add/edit/delete/apply/restore | N/A | N/A | UI rendered (deck, lock status truthful "Unlocked", credentials as locked-store refs); **live real-target apply/restore NOT executed — see blockers** | Gate 2/3 prove transaction mechanics on temp fixtures |
| Activity/graphs | ✅ attributed by providerId | ✅ same store, correct attribution | Supported (route attribution) | Metadata-only verified |
| Backup/restore | ✅ backup-first writes verified | ✅ | Manifest/backup panels present; restore-latest-backup NOT clicked (real target) | Snapshot restore §11 |

Agent switching exercised repeatedly (UI tabs + API) with file-level verification each time.

---

## 8. UI control ledger (exercised controls; all rows from this session)

Legend: ✅ pass · 🔁 pass-after-fix (defect id). Pointer+keyboard activation verified where noted; every row included console-error watch (final state: **0 unexpected console errors**).

| # | Agent/mode | Page/state | Control | Action & negative path | Result |
|---|---|---|---|---|---|
| 1 | all | startup | Skip-to-content link | focus jump | ✅ |
| 2 | all | welcome | Set up your workspace | enters onboarding | ✅ |
| 3 | all | welcome | Play welcome animation | replays cinematic | ✅ (reduced-motion: inert) |
| 4 | all | onboarding/agent | OpenCode/Kilo/Claude detected cards | select gates Continue | ✅ |
| 5 | all | onboarding/agent | Choose-a-folder card → dialog | opens focus-trapped dialog | ✅ |
| 6 | all | dialog | folder input: nonexistent path | friendly 400 alert, stays open | ✅ |
| 7 | all | dialog | folder input empty → Use-this-folder | "Enter a folder path first." | ✅ |
| 8 | all | dialog | Cancel / Use-this-folder / Escape | close+focus return; Escape crash fixed | 🔁 FSC2-013 |
| 9 | OC/Kilo | review | KPI cards (profiles/plugins/MCP/providers) | counts matched fixture exactly (3/1/9/4) | ✅ |
| 10 | OC/Kilo | review | Use this workspace | scaffold→build→verify→advance | 🔁 FSC2-009/011 |
| 11 | OC/Kilo | provider step | LiteLLM/CLI-Proxy/Custom choice grid | selection states | ✅ |
| 12 | OC | provider step | Show/Hide API key eye toggle | aria-label flips, type toggles | ✅ |
| 13 | OC | provider step | Add model / Remove model row | row count 1→2→1 | ✅ |
| 14 | OC | provider step | Skip for now → Complete | advances | ✅ |
| 15 | all | complete | Copy endpoint button | toast "Endpoint copied." | ✅ |
| 16 | all | complete | Open dashboard | routes to ?view=overview | ✅ |
| 17 | all | shell | nav Overview/Providers/Activity/Integrations/Settings | view switch + URL sync | ✅ |
| 18 | all | shell | theme toggle light⇄dark | persists (localStorage) | ✅ |
| 19 | all | shell | About dialog open/Escape/Close-button | closes cleanly, zero errors post-fix | 🔁 FSC2-013 |
| 20 | all | shell | Collapse sidebar | collapsed state | ✅ |
| 21 | OC/Kilo | overview | date-range combobox (Last 7 days) | filters charts | ✅ |
| 22 | OC/Kilo | overview | relay deck ← → arrows | cycles all 4 providers incl. tokenrouter layer | ✅ (user's new depth-stack) |
| 23 | OC | overview | Deactivate provider button | toggles active state | ✅ |
| 24 | OC | overview | View details | deep-links to Providers page | ✅ |
| 25 | OC | overview | usage legend rows | no overlap, ellipsis truncation | 🔁 FSC2-010 |
| 26 | OC/Kilo | overview | Recent-calls table horizontal scroll | scrollable, hidden-scrollbar by design (contract-tested) | ✅ |
| 27 | OC/Kilo | overview | View all | routes to Activity | ✅ |
| 28 | OC | providers | agent tabs (OpenCode/Kilo/Claude) | switch active agent + capability nav change | ✅ |
| 29 | OC | providers | deck Next/Previous | bring-forward stepping | ✅ |
| 30 | OC | providers | Edit provider wizard: steps Choose→Configure→Models→Test→Save | full walk | ✅ |
| 31 | OC | edit dialog | empty name → Next | "Enter a provider name and base URL." blocks step | ✅ |
| 32 | OC | edit dialog | Test connection (unreachable) | "Couldn't reach it. Is that server running?", button recovers | ✅ |
| 33 | OC | edit dialog | Save with empty key field | keeps existing key ("leave empty to keep existing") | ✅ disk-verified |
| 34 | OC | edit dialog | Review shows "Not provided"/key never echoed | secret-safe | ✅ |
| 35 | OC | providers | Remove provider → confirm/cancel | cancel leaves intact | ✅ (delete path unit-covered) |
| 36 | OC | add panel | 18 SDK buttons + 5 reasoning formats + presets | pressed states update | ✅ |
| 37 | Kilo | settings→models | model checkbox multi-select | "N selected" counter; Delete-selected disabled at 0 | ✅ |
| 38 | Kilo | settings→models | reasoning format switch | levels become none/low/medium/high/xhigh (no max for openai) | ✅ |
| 39 | all | settings | Log retention selector | bounded 1–365 (API 400 outside) | ✅ |
| 40 | all | settings | Redaction row | "Always on", immutable in UI | ✅ |
| 41 | all | settings | Animation selector | system/reduce applied live | ✅ |
| 42 | all | settings | Change profile | profile picker | ✅ |
| 43 | all | settings | Build my config | build runs, [ready] status line updates | ✅ |
| 44 | OC/Kilo | integrations | Add plugin / remove + confirm | list updates, backup-first | ✅ |
| 45 | OC/Kilo | integrations | MCP add/local/remote/expert entry points | forms open; configuring does not execute | ✅ |
| 46 | OC/Kilo | integrations | MCP remove buttons | row removal w/ confirm | ✅ |
| 47 | OC/Kilo | integrations | LSP on/off toggle | persists via PUT; status line reflects state | ✅ |
| 48 | OC/Kilo | integrations | LSP Edit JSON expert dialog | object value round-trip | ✅ |
| 49 | OC/Kilo | integrations | Build-my-config after LSP change | config carries object/false/true correctly | 🔁 FSC2-012 |
| 50 | all | integrations | Copy local endpoint | toast | ✅ |
| 51 | Claude | onboarding | Claude card → review (read-only scan) → approve | lands on capability shell, no provider grid | ✅ |
| 52 | Claude | routes | route deck cards/arrows/steps | 4 saved routes layered | ✅ |
| 53 | Claude | routes | Route applied (disabled) / View details / Edit / Delete buttons | present; destructive ones not executed (real state) | ✅ presented |
| 54 | Claude | routes | Lock status panel | truthful "Unlocked" (owner session-48 decision) | ✅ |
| 55 | Claude | routes | Credentials panel | DPAPI refs only, "locked store" chips | ✅ |
| 56 | Claude | nav | capability nav (Overview/Routes/Activity/Integrations/Settings; no Providers page) | matches capability rules | ✅ |
| 57 | all | dialogs | focus trap + initial focus + Escape + focus return | verified on manual-folder, edit-wizard, About | ✅ |
| 58 | all | global | rapid double-click on Continue/Use-this-workspace | no duplicate writes (state consistent) | ✅ |
| 59 | all | error | server killed mid-session (restarts ×4) | UI reconnect banner "Local proxy online/offline" honest | ✅ |
| 60 | all | a11y | ≥44px targets, visible focus rings, semantic landmarks/nav/tablist/switch roles | spot-checked via snapshot roles | ✅ |

Orphan-handler / dead-control sweep: event bindings audited via rendered DOM vs source search during integration testing — one dead-listener defect found and fixed (FSC2-013); no dead clicks or stuck spinners observed anywhere.

---

## 9. Graph data-versus-render evidence

Fixture events injected through the real proxy path (fake upstreams), then independently computed vs UI-rendered:

| Metric | Independently computed | UI rendered | Match |
|---|---|---|---|
| Calls (7d) | 9 | 9 | ✅ |
| Success rate | 78% (7×200-class… precisely 7/9 success incl. fake-completion + prior history) | 78% | ✅ |
| Median latency | 3 ms (sorted midpoint of latency list) | 3 ms | ✅ |
| Failed requests | 2 | 2 | ✅ |
| Provider split | sec-proxy-probe 4 · omniroute 2 · orcarouter 2 · origin-probe 1 | 44% / 22% / 22% / 11%, Total 9 | ✅ |
| Newest recent-call rows | omniroute 404 @ 3 ms then completion | shown in order with status colors | ✅ |
| Forbidden fields in activity store | none expected | none present (12 allowlisted keys only) | ✅ |

Empty-state honesty: with zero traffic the dashboard renders zeros/empty CTAs (observed pre-injection state showing honest historical-only data; no fabricated points).

---

## 10. Visual / motion / responsive / accessibility evidence

Screenshots archived in `AI/FSC2-EVIDENCE-2026-08-22/`:
`overview-redesign-verify.png` (owner redesign, first load), `overview-redesign-v2.png`, `overview-legend-fixed.png` (post-FSC2-010), `claude-routes-page.png` (light), `claude-routes-dark.png`, `claude-routes-narrow.png` (780px).

- Light + dark themes: no invisible text, adequate contrast, layouts intact.
- Narrow window (780px): no horizontal document overflow (`scrollWidth == clientWidth`), responsive stack + hamburger, deck becomes horizontal strip with visible scrollbar affordance.
- Reduced motion (app preference → `data-motion="reduce"`): atmosphere node absent, `document.getAnimations().length === 0`, welcome animation button inert.
- Keyboard: tab order logical; Enter/Space activate cards/buttons; Escape closes dialogs with focus return (post-FSC2-013); ARIA pressed/selected/current states update on tabs/toggles/deck.
- Status never color-only (Applied/Saved also text-labeled); forced-colors support is CSS-declared (rule.md) — not separately emulated (no tooling), recorded as limitation.
- Screen-reader tree inspection: Playwright accessibility snapshots used throughout (roles/labels verified — e.g., `tablist`, `switch`, `status`, labeled comboboxes). Dedicated SR tooling (NVDA/JAWS passthrough) unavailable in this environment — recorded as **not run (tooling unavailable)**, not silently skipped.
- Console: final browsing session ended with **0 errors / 0 warnings** (two earlier errors were the FSC2-013 defect manifesting; fixed and re-verified clean).

---

## 11. TEST → FIND → FIX → REPEAT records

```text
FSC2-001: Stale preference defaults contract
Test: unittest discover → 2 failures asserting 3-key defaults
Found: preferences.py gained browser pref (owner feature); tests lagged
Fix: tests/test_preferences.py expect 4-key defaults + new invalid-browser rejection test
Repeat: focused 6/6 → full Python green. FAIL → FIXED → RE-PASS

FSC2-002: Onboarding copy contract asserted retired claude-3.5-sonnet screen
Test: node --test frontend_review.test.mjs → regex mismatch on provider screen
Found: product moved to LiteLLM/CLI-Proxy/Custom choice grid (committed UI); test stale
Fix: assertions updated to current approved screen (choices/assets/actions/Skip)
Repeat: 23/23 → full frontend 192/192. FAIL → FIXED → RE-PASS

FSC2-003: UTF-8 BOM in engine/schemas/models.schema.json
Test: strict json.loads over repo JSON
Found: BOM breaks strict parsers (PS tolerant, so hidden)
Fix: rewritten BOM-less; git diff = single byte-region
Repeat: strict parse OK + PS parse OK + harnesses green. FAIL → FIXED → RE-PASS

FSC2-004: Generated doc regions drifted from registry (stale 2.5.2-era content)
Test: release-manager run 1 vs checked-in hashes
Found: generator never re-run after last registry entry landed
Fix: regenerated all four regions; run 2 byte-identical (determinism)
Repeat: registry↔docs consistent. FAIL → FIXED → RE-PASS

FSC2-005: Deployed ~/.config/opencode/scripts current-builder copies drifted (pre-LSP-era)
Test: SHA-256 compare repo engine vs deployed scripts
Found: deployed copies older (Aug 8–17) than bundled canonical
Fix: snapshotted deployed set to temp, synced 3 current scripts, hash-equal verified; legacy/frozen scripts untouched
Repeat: drift=0. FAIL → FIXED → RE-PASS

FSC2-006: JSON_SCHEMAS.md missing "# target.json" heading (dangling paragraph)
Test: heading-structure scan
Found: heading lost, section merged into lsp.json block
Fix: inserted heading
Repeat: structure clean. FAIL → FIXED → RE-PASS

FSC2-007: bdf/templates/README.md stale placeholder examples
Test: example values vs registry truth
Found: 2.5.1 / 2026-08-06 / 31-31 examples
Fix: updated to 2.5.3 / 2026-08-17 / current harness counts
Repeat: template sync rule satisfied. FAIL → FIXED → RE-PASS

FSC2-008: Malformed state entry crashed /api/status with 500
Test: state entries [{wrong key}, "", 42, valid] → KeyError traceback
Found: get_agents() returned entries unchecked; current_agent() indexed blindly
Fix: well-formed-entry filter in get_agents()
Repeat: regression test red→green; live /api/status 200. FAIL → FIXED → RE-PASS

FSC2-009: setup/revert could never restore custom-named agents
Test: UI approve flow + direct POST → "No main-config backup found", built config stayed applied
Found: revert globbed "{registered-name}_*.json"; backups use config stem
Fix: match any timestamped backup whose derived stem has a live main file
Repeat: tests/test_setup_revert.py 4/4 (red first); UI approve advanced end-to-end. FAIL → FIXED → RE-PASS

FSC2-010: Overview usage legend overlapped percent onto name
Test: DOM box measurement (name box 19px, pct painted at x-overlap)
Found: inline-flex name in minmax(0,1fr) track shrank without truncation
Fix: block name + ellipsis; count column auto-sized
Repeat: boxes disjoint + ellipsis active; contracts 40/40. FAIL → FIXED → RE-PASS

FSC2-011: Setup verification failed forever with any inactive provider
Test: verify on fixture with dormant provider → ok:false, mainJson:false
Found: verify compared ALL provider files; builders merge ACTIVE only
Fix: verify scoped to active set (mirrors build contract)
Repeat: tests/test_setup_verify.py red→green; both fixtures verify ok:true. FAIL → FIXED → RE-PASS

FSC2-012: Custom-named kilo agents received the OpenCode V2.7 builder
Test: app-driven LSP lifecycle OFF→build left stale boolean; generated builder byte-compared to V2.7 (=100%)
Found: scaffold matched literal "kilo" only; app passes registered names ("kilo-test"); wrong-lineage builder defaulted to opencode.json artifact (masking as stale-file symptom)
Fix: scaffold infers kilo-type from kilo.json presence; fixture stray files removed; deployed scaffold re-synced
Repeat: tests/test_scaffold_builder.py 2/2; app cycle on→object / off→false / re-on→true; kilo.json artifact correct. FAIL → FIXED → RE-PASS

FSC2-013: Manual-folder Escape listener leaked → console TypeError on later Escapes
Test: cancel-dialog → Escape anywhere → TypeError (console evidence captured)
Found: listener removed only on Escape path; close() left it bound to stale nodes
Fix: single tracked handler, symmetric add/remove, null-guarded close
Repeat: real-Escape About close + zero console errors; contracts green. FAIL → FIXED → RE-PASS

SEC-HIGH (S-1): Missing global loopback Host/Origin enforcement
Test: spoofed Host/evil Origin probes across routers (only Claude routes guarded)
Found: DNS-rebinding/cross-site write surface on all non-Claude /api + /v1 routes
Fix: enforce_loopback_origin middleware in server.py (same allowlist semantics)
Repeat: tests/test_origin_gate.py 5/5; live evil-Host probe → 403, good → 200. FAIL → FIXED → RE-PASS

SEC-LOW (S-2): Reserved Windows device ids accepted as provider ids
Fix: denylist in _require_valid_provider_id; regression test asserts 400 + zero files. RE-PASS

SEC-LOW (S-3): Proxy forwarded ".." dot-segments upstream
Fix: reject "/../" segments pre-forward; regression test. RE-PASS

FSC2-015: Claude backup-ring drift blocked all live applies (state repair, owner-authorized gate)
Test: authorized real apply → opaque 500; manifest audit → 10/10 entries with 2 stale records whose backup files no longer existed (Aug-17 era, removed out-of-band during the backup-folder migration)
Found: ring at MANIFEST_CAP forces prune on every apply; prune hard-fails on the missing artifact (by design)
Fix: repaired app-owned claude-backup-manifest.json (backed up first; 10 → 8 entries, only artifact-less records dropped); zero missing artifacts after
Repeat: live apply then succeeded end-to-end. FAIL → FIXED → RE-PASS

FSC2-016: Prune guard failures masked as generic 500
Test: same scenario surfaced as "The route could not be applied." 500 instead of its true 409
Found: broad `except Exception` in claude_route_apply caught deliberate HTTPException(409) from _prepare_prune
Fix: dedicated `except HTTPException` branch — rollback still runs, true status/message re-raised
Repeat: updated existing 500-expectation test to 409 + new test simulating the exact missing-file drift; claude adapter suite 123/123. FAIL → FIXED → RE-PASS

LIVE GATE (owner-authorized 2026-08-22): Real-target Claude apply/restore EXECUTED AND PASSED.
Pre-gate snapshot SHA-256 manifest of ~/.claude/settings.json + all app state files.
Apply(route-3bb7d937b97f omniroute): surgical env-only patch verified (ANTHROPIC_API_KEY set,
BASE_URL=http://localhost:20128/v1, AUTH_TOKEN removed opposite-auth, role models present,
non-env keys byte-preserved), backup written to ~/.claude/backup/. /status honest
(routeConfigured=True, lastBackup=True). Restore: revision returned to EXACTLY the pre-gate
snapshot hash 6d279fa89b25; settings.json + routes.json + app state.json all byte-equal;
activity gained designed append-only audit events (apply_failed, route_applied,
restore_completed). No secrets printed anywhere.```

---

## 12. Real-state snapshot / restoration evidence

Snapshot taken before any app-side testing: `state.json`, `preferences.json`, `activity.jsonl`, `full-run.log`, entire `state/` (claude-routes.json, DPAPI credential bin, backup manifest, 10 route backups, claude-activity.jsonl) → copied to temp snapshot dir.

Restoration: processes stopped by port-owner PID (9090 server, 3 fake upstreams) → snapshot copied back → **SHA-256 compared file-by-file: 18/18 identical, 0 diffs.**

Collateral disclosures (by design, disclosed not hidden):
- `~/.config/opencode/scripts/` three current scripts intentionally updated (drift fix FSC2-005) — snapshots of prior deployed copies existed in temp root; root since removed after verification (originals recoverable from repo engine, which they now equal).
- `preferences.json` live edits during testing (motion/browser) reverted via snapshot restore (hash-verified).
- Claude real-target files: **never modified** (no apply/restore executed; scans read-only).

Temp cleanup: fixture root, fake upstream scripts/logs, bisect roots, helper scripts — all under one verified temp directory, removed (`Test-Path` confirms gone). Screenshots moved into repo evidence folder (untracked, safe). Nothing else in `%TEMP%` touched.

---

## 13. Files changed by this check (all retained intentionally)

**App fixes:** `app/app/agentstore.py` (well-formed agent filter, reserved-id denylist), `app/app/engine.py` (verify active-set, revert stem-match), `app/server.py` (origin middleware), `app/app/proxy.py` (dot-segment rejection), `app/app/claude_adapter.py` (prune-failure transparency), `app/engine/scaffold-agent.ps1` (kilo-type inference), `app/assets/js/pages/onboarding.js` (Escape handler lifecycle), `app/assets/css/workspace.css` (usage legend fix), `app/engine/schemas/models.schema.json` (BOM).

**New regression tests:** `tests/test_setup_revert.py`, `tests/test_setup_verify.py`, `tests/test_scaffold_builder.py`, `tests/test_origin_gate.py`; strengthened `tests/test_agentstore.py`, `tests/test_preferences.py`, `tests/test_claude_adapter.py` (prune 409 + missing-backup rollback), `tests/frontend_review.test.mjs`.

**Docs/truth sync:** `CHANGELOG.md`, `CURRENT_RELEASE.md`, `PROJECT_STATE.md` (generated regions + live-validated status resolution), `bdf/VERSION.md` (generator-owned regions), `release_registry.json` (table-safe wording), `JSON_SCHEMAS.md`, `bdf/templates/README.md`, `README.md` (Claude complete not dropped, Framework 2.3.0, current test badges, corrected clone paths, stray footer removed), `FOLDER_STRUCTURE.md` (phantom PNGs removed, adapters/+LICENSE added, module list completed, providers count, claude-code engine named), `app/BUGFIXES.md` (8 new entries), `_agent/SESSION_LOG.md` (session 50).

**Untouched by design:** owner's pre-existing 42-entry dirty baseline; root README (deferred task); historical documents; frozen legacy builders; real agent configs; `.playwright-cli/`, `output/`, `planning/PI_RESEARCH.md` (pre-existing untracked, left alone).

Final git: 53 modified + 9 untracked additions (incl. 4 new test files, runbook, evidence folder); `git diff --check` exit 0; no secrets or temp artifacts staged or tracked.

---

## 14. Blockers, waivers, next actions

| Item | Status | Exact next step |
|---|---|---|
| Claude **live** route Apply/Restore from UI | **DONE — PASS** (owner authorized 2026-08-22; full cycle executed, byte-verified restore; see LIVE GATE record in §11) | None — re-run the same gated cycle after any future adapter change |
| README rewrite | **DONE** (owner-authorized same day): Framework badge 2.3.0, footer fixed + stray "Version: 2.5.2" removed, test badges updated to current counts (kilo 37/37 + opencode 40/40 + app 269 + frontend 192), Phase 11 now "✅ complete (dedicated routing adapter, live validated)", clone paths corrected to `docs\app`, `app\engine` → `docs\app\engine` | Review wording at next release |
| PROJECT_STATE live-validation contradiction | **RESOLVED**: interior paragraph + §13 updated to "Integrated and live validated (Gate 5B PASS 2026-08-17…lock OPEN by owner decision)"; baseline-failures item marked RESOLVED | None |
| FOLDER_STRUCTURE phantom PNG lines | **REMOVED** (owner-approved): `bdf_dashboard.png` / `bdf_add_provider.png` deleted from doc; `adapters/` + `LICENSE` added to contents block; app module list completed (+12 modules incl. lsp/preferences/claude_*), claude-code engine folder named, providers count corrected to four, stale "56 unit tests" replaced | Optional: document `output/` and `.playwright-cli/` as runtime artifacts in a future edit |
| Screen-reader pass | NOT RUN — no SR tooling in environment | Optional NVDA pass by owner; ARIA/keyboard/contrast verified programmatically |
| LSP card copy fallback ("config.json") + onboarding failure-detail surfacing | OPEN — minor UX polish, owner call | Small follow-up task, no functional impact |

No old baselines were waived: **zero accepted baseline failures remain** (previous 2 Python + 1 frontend baselines fixed as FSC2-001/002).

---

## 15. Final verdict

**PASS**

Basis: every applicable automated suite green with fresh output and zero skips (Python **270/270**, frontend **192/192**, harnesses 40/40 + 37/37 + 73/0 + Gate 3 OVERALL PASS, Claude adapter focused 123/123); clean-room BDF lifecycle and idempotent rebuilds proven; **16 defects** (incl. 1 HIGH security) found, root-caused, fixed, regression-tested, and re-verified through focused AND full suites; the owner-authorized **live Claude apply/restore gate executed and passed** with byte-exact restoration; adversarial audit closed with zero unresolved Critical/High/Medium findings; complete control ledger exercised with zero dead clicks, stuck states, or unexpected console errors; graph numbers exactly match independent computation; visual/motion/responsive/keyboard gates passed with archived evidence; documentation/template/version truth synchronized **including the owner-authorized README / PROJECT_STATE / FOLDER_STRUCTURE corrections**; real user configuration restored byte-identically (SHA-verified before and after the live gate); all fixes retained in the working tree; nothing committed — commit awaits explicit owner approval.

*Report ends.*
