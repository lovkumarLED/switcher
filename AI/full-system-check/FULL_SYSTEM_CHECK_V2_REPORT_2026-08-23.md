# FULL SYSTEM CHECK V2 — EXECUTION REPORT (2026-08-23)

> Runbook: `AI/FULL_SYSTEM_CHECK_V2.md` (v2.0)
> Executed: 2026-08-23, 04:52–08:00 local (UTC+5:30)
> Executor: opencode agent (ox-alpha), directed by the repository owner
> Predecessor report: `AI/FULL_SYSTEM_CHECK_V2_REPORT_2026-08-22.md` (kept intact; that
> filename was also named in the owner's instruction, but it already existed as a
> historical record, so this fresh run writes a new dated file per §2 "preserve history").
>
> **Every claim below has fresh evidence from this run. Nothing is carried over.**

---

## 1. Scope, environment, baseline

| Item | Value |
|---|---|
| Date/time | 2026-08-23 04:52:50 +05:30 (start) |
| OS | Windows (win32), PowerShell 5.1.26100.9168 |
| Python (app venv) | 3.14.5 — `app\env\Scripts\python.exe` |
| Node | v24.15.0 |
| Git | 2.41.0.windows.1 |
| Repo root | `C:\Users\loveb\.config\opencode\docs` |
| Branch / HEAD at start | `main` @ `6c86870` ("docs: session log - record working-tree recovery incident + rotation") |
| Dirty-tree baseline | **Clean** — no staged, unstaged, or untracked files |
| Temp root | `%TEMP%\bdf-full-system-check-20260823-045336-nucoat` |
| Real-state snapshot | `<temp>\real-snapshot` (29 files + SHA-256 manifest) taken before UI phase |

Inventory discovered (fresh): 17 Python test files + 19 `.test.mjs` contract files in
`app/tests/`; engine harnesses `test-opencode-v2.7.ps1`, `kilo/test-kilo-v1.ps1`,
`claude-code/test-claude-code.ps1`, `claude-code/test-provider-model.ps1`; 9 JSON schemas;
165 Markdown files.

`.gitignore` audit: `app/.gitignore` covers `env/`, `state.json`, `activity.jsonl`,
`full-run.log`, `__pycache__/`; root covers `.playwright-mcp/`, `.playwright-cli/`,
`output/`, `superpowers/`. No runtime state tracked. ✓

---

## 2. Phase 1 — documentation, version, truth audit

- Version consistency across `release_registry.json` (2.5.3 / V2.7 / 2026-08-17,
  status Current), `CURRENT_RELEASE.md`, and README lines 267/296: **consistent**.
- `bdf/VERSION.md` framework version 2.3.0 is framework-local versioning (documented,
  separate from project version). No contradiction found.
- Doc graph scan: 165 `.md` files scanned for relative links; 4 flagged targets were
  verified manually — all are inside fenced code blocks (example markup), i.e. false
  positives. **0 real broken links.**
- Release generator double-run determinism was covered by the harness suites'
  generated-docs groups plus the clean-room double-build in §6.

## 3. Phase 2 — static analysis / language-server equivalents

| Language | Tool | Files | Result |
|---|---|---|---|
| JavaScript | `node --check` every `.js`/`.mjs` (excl. env) | all | 0 syntax errors |
| JSON | parse every `.json` via `[IO.File]::ReadAllText + ConvertFrom-Json` | 33 | 1 error = `engine/claude-code/fixtures/settings-malformed.json` which is **intentionally malformed** (test fixture) → benign |
| PowerShell | `[Language.Parser]::ParseFile` on all engine `.ps1`/`.psm1` | all | 0 parse errors |
| Python | `py_compile` over `app/**/*.py` (venv 3.14.5) | all | 0 errors |

## 4. Phase 3 — automated suites (first pass)

| Suite | Command (cwd) | Result |
|---|---|---|
| Python app suite | `.\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"` (docs/app) | **272/272 OK**, exit 0, ~185 s |
| Frontend contracts | `node --test .\tests\*.test.mjs` (docs/app) | **195/195 pass** (pre-fix count) |
| OpenCode builder harness | `powershell -File app\engine\test-opencode-v2.7.ps1` | **40/40** |
| Kilo builder harness | `powershell -File app\engine\kilo\test-kilo-v1.ps1` | **37/37** |
| Claude Gate 2 | `powershell -File app\engine\claude-code\test-claude-code.ps1` | **73 passed, 0 failed** |
| Claude Gate 3 | `test-provider-model.ps1 -PythonExe <app python>` | **OVERALL PASS** |

Count deltas vs registry (217 py / 133 fe): new test files added since the release notes
were written; counts investigated and explained, not copied. ✓

## 5. Phase 4 — security & privacy audit

- Secret scan (`git grep -E`) for `sk-…`, `ghp_…`, AKIA…, PEM keys, long key/value
  assignments: **0 hits** in tracked files.
- Bind address: `config.HOST="127.0.0.1"`, PORT 9090 — loopback only ✓
- Origin gate: allowlist of loopback origins + Host check (DNS-rebinding guard) in
  `server.py` + `claude_adapter.py::_check_origin`; automated coverage in
  `tests/test_origin_gate.py` (passing).
- Path traversal / zip-slip / symlink / TOCTOU regression suites: `tests/test_security.py`
  passing; Claude route apply/restore safety covered by Gate 2/3 (temp fixtures only).
- Credentials surfaced in UI as env-var references only (e.g. `OMNIROUTE_API_KEY`,
  "locked store"); no plaintext observed anywhere in DOM or API payloads during the UI
  journey.
- Dependencies: `fastapi`, `uvicorn`, `httpx2` (declared). `httpx2` verified legitimate —
  starlette's TestClient prefers it (`import httpx2 as httpx`); installed `httpx` 0.28.1
  is an unused venv leftover (not declared, not imported by code). No CDN, telemetry, or
  remote assets in frontend assets (19 URL hits reviewed — all localhost presets /
  clipboard copy of local endpoint).

## 6. Phase 5 — clean-room BDF generation

Performed entirely inside the temp root:

1. Scaffolded temp OpenCode agent (`scaffold-agent.ps1 -ConfigRoot <tmp>`): profiles
   coding/experimental/minimal each seeded with `lsp.json`, `mcp.json`, `plugins.json`,
   `settings.json` ✓
2. Bootstrapped generated builder/harness/scaffold trio into `<tmp>\scripts\`.
3. Seeded a sanitized provider fixture + models; ran generated `build-opencode.ps1`
   **with explicit `-ConfigRoot`** twice:
   - Build 1 PASS, build 2 PASS, outputs **byte-identical**
     (SHA-256 `974799DA…D96BFE0`) → idempotent ✓
   - Output stayed inside the temp root ✓ provenance sidecar targeted temp root ✓
4. LSP matrix: disabled → `"lsp": false` emitted; enabled+object → exact object survives
   round-trip ✓ `-WhatIf` skips write ✓
5. Kilo parity: scaffolded + bootstrapped `build-kilo.ps1`, isolated double-build
   **idempotent** (SHA `95139EB6…52506B`), `"lsp": false` emitted ✓
6. Claude used its dedicated architecture (Gate 2/3 harnesses above) per §10.5 — not
   forced through BDF profiles.

### FSC2-002 incident (my test error, fully remediated)

The first double-build omitted `-ConfigRoot`, so the generated builder used its designed
default `$HOME\.config\opencode` and rebuilt the **real** `opencode.json` (deterministic
rebuild from the user's own untouched sources — provenance listed exactly the user's four
real providers; zero fixture contamination). Remediation per §3.4:

- The builder's own backup-first persist had captured pre-run state:
  `backup/opencode_2026-08-23_05-15-23.json` (19,498 B).
- Restored real `opencode.json` from that backup → **byte-identical** to pre-run
  (SHA-256 `D0C673CC…E534528` verified both sides).
- Post-test evidence retained in `<temp>\real-state-evidence\`.
- The two backup-ring entries created by the incident run were removed at cleanup so the
  backup directory matches its pre-run content.
- Residual disclosure: `opencode.provenance.json` still reflects the incident-time build
  (its pre-run content was never captured). It is a regenerated-on-every-build artifact;
  the next real build rewrites it consistently. Reported here rather than hidden.

## 7. Phases 6–9 — UI journey, isolation, visual/motion

App served at `http://127.0.0.1:9090` (owner-started PID 34956, started 04:35, before any
code change; source changes verified live after cache-bypass reload).

Covered controls/journeys (all with pointer activation where applicable, keyboard where
wired, console watched throughout):

- **Onboarding**: welcome screen, live-SVG animation button, agent selection gating
  (Continue disabled until selection), Claude-specific path landing on its capability page
  ("Your providers stay as configured"), read-only scan review, approval gating ("Nothing
  will be changed until you approve"), completion copy, copy-endpoint toast, dashboard entry.
- **Claude overview**: saved-route deck, system-health panel (truthful Target-lock state),
  read-only MCP/plugin inventory labeled "read-only", routing-history table.
- **Claude routes page**: agent tablist, summary chips, bring-forward deck arrows (front
  marker moved on click), Add-route dialog (required-field validation blocks empty save;
  compatibility confirm-gate message shown when unchecked; save succeeds after confirm),
  Edit dialog pre-fill + Cancel, Delete confirmation flow (throwaway route created and
  deleted; owner routes untouched; activity recorded the delete).
- **Activity (Claude)**: KPI/event-mix numbers match `/api/claude/activity` ground truth
  exactly (87 total; applied 40, edited 14, failed 11, created 10, deleted 6, restored 6);
  pulse-chart aria-label totals equal API totals (87/11); privacy-boundary note present.
- **Settings (Claude)**: capability-truthful managed-surface copy; theme toggle light→dark→light;
  About dialog opens/closes (app-local version 1.0.0 consistent across
  `app/app/__init__.py` and `assets/js/core/about.js` — noted as LOW duplication risk only).
- **OpenCode/KiloCode**: nav adapts by capability (Providers+Integrations appear, Routes
  hidden); provider decks render agent-specific cards (OpenCode 5, Kilo 2 — no bleed);
  Integrations block order Plugins → LSP → MCP matches the documented design.
- **LSP toggle real-state round trip** (minimal authorized touch, snapshot first):
  ON → OFF wrote `{"lsp": true, "enabled": false}` (source value preserved, only
  `enabled` flipped) with honest status copy naming `opencode.json`; kilo's `lsp.json`
  hash unchanged (no cross-agent leak); toggled back ON → file restored **byte-identical**
  (SHA `7D34531F…89FA8`). Expert "Edit JSON" dialog opens/cancels.
- **Isolation matrix**: repeated agent switching after writes/reloads showed no provider,
  LSP, route, or inventory bleed between roots. N/A rows follow capability reasons
  (Claude has no provider grid; Open/Kilo have no routes).

Browser console across the entire session: **zero unexpected errors/warnings**. One
explained entry was self-inflicted by synthetic test events (`setPointerCapture` with a
fake pointerId during my scripted drag test) — not reachable by real input.

## 8. Defect records (TEST → FIND → FIX → REPEAT)

```text
FSC2-001: requirements.txt declares httpx2 with no direct import
Test: pip metadata + grep imports + starlette/testclient source
Found: httpx2 IS the client starlette TestClient prefers in this version
Fix: none required — declaration is correct and necessary for the test suite
Final: N/A — working as intended (documented)

FSC2-002: clean-room build without -ConfigRoot rebuilt the real opencode.json
Test: provenance sidecar vs real providers dir + hash chain
Found: my harness omission; builder default target is by-design canonical root
Fix: procedure fix (always pass -ConfigRoot in tests) + full §3.4 restoration
Repeat: post-fix isolated builds stayed in temp; real file byte-restored
Final: FAIL → FIXED → RE-PASS (no product defect)

FSC2-003: Claude route-deck footer arrows invisible / pointer-dead
Test: elementsFromPoint vertical scan + geometry dump + screenshot
Found: sr-only treatment on .claude-route-deck__footer is INTENTIONAL (commit
      7468b25 comment: arrows kept for keyboard/screen-reader; card is the visual
      surface). Wheel, ArrowLeft/Right, drag, and AT buttons all step the deck.
Fix: reverted my initial removal; documented intent in CSS comment; new contract
     test locks "sr-only but present + wheel/key/drag wired"
Repeat: live wheel/key/drag stepping verified; frontend suite green
Final: WORKING AS DESIGNED (owner decision 7468b25) + regression lock
Evidence: AI/full-system-check/evidence-fsc2-003-deck-footer-sr-only.png,
          AI/full-system-check/evidence-deck-footer-visible-after-revert.png

FSC2-004: OpenCode onboarding dead-ended at Review with raw TypeError
Test: scripted click-through reproduced; instrumentation captured stack
Found: presets[0].id — presets[0] is a [key,value] entry, .id is undefined; fires
      whenever existing providers filter out litellm/cli-proxy presets (true on
      this machine)
Fix: assets/js/pages/onboarding.js — fallback now reads presets[0][0]
Repeat: full onboarding click-through reaches "Add your first provider", choices
        correctly reduce to [custom], no alert; frontend_review.test.mjs adds a
        source-contract regression test; suite 25/25
Final: FAIL → FIXED → RE-PASS

Collateral cleanup (disclosed): earlier scripted clicks submitted the provider
wizard once, creating providers/litellm.json (empty-key stub) +
profiles/coding/litellm-models.json ({}) and adding "litellm" to activeProviders.
All three removed/restored from snapshot; final manifest diff = 0.
```

## 9. Phase 10 — final regression (fresh, post-fix)

| Suite | Result |
|---|---|
| Python app suite | **272/272 OK** (~162 s) |
| Frontend contracts | **197/197 pass** (195 + 2 new regression tests) |
| OpenCode harness | **40/40** |
| Kilo harness | **37/37** |
| Claude Gate 2 | **73/73** |
| Claude Gate 3 | **OVERALL PASS** |
| `git diff --check` | exit 0 (line-warning noise only, no whitespace errors) |

## 10. Restoration & hygiene

- Snapshot manifest (profiles/, providers/, kilo.json): **diff count 0** after cleanup.
- Real `opencode.json`: byte-identical to pre-run (`D0C673CC…`).
- Test pollution removed: `providers/litellm.json`, `profiles/coding/litellm-models.json`,
  settings.json restored, two incident-window backup-ring files removed.
- Temp root retained until commit, then removed: `%TEMP%\bdf-full-system-check-20260823-045336-nucoat`.
- Working tree contains ONLY intentional checkup outputs:
  - `app/assets/js/pages/onboarding.js` (FSC2-004 fix, 1 line)
  - `app/tests/frontend_review.test.mjs` (regression test)
  - `app/tests/overview_visual_contract.test.mjs` (deck-contract regression test)
  - `app/assets/css/provider-workspace.css` (owner-intent comment, no style change)
  - `app/BUGFIXES.md` (FSC2-004 entry)
  - this report + two evidence PNGs
- README deliberately untouched (per runbook; separate owner task).

## 11. Blockers / owner decisions

1. `opencode.provenance.json` reflects the incident-time rebuild (see §6); next normal
   build rewrites it — or delete it if preferred.
2. FSC2-003 wording: visible hint still says "Scroll **or use the arrows**…" while arrows
   are intentionally sr-only; sighted-only users may find the mention confusing. Owner may
   want copy like "Scroll or drag to browse" (left untouched — fresh owner decision).
3. `APP_VERSION` duplicated in two files (backend/frontend) — LOW; consider single source.
4. Unused `httpx` 0.28.1 in the app venv — optional `pip uninstall`.

## 12. Final verdict

**PASS**

All applicable gates have fresh passing evidence: static gates clean; 272 Python +
197 frontend + 40 + 37 + 73 + Gate 3 PASS; clean-room double-build idempotent on both
builders; security/privacy checks clean; isolation proven; real user state restored with
hash-verified diff count 0; valid fixes and regression tests retained; no secrets or test
artifacts staged.
