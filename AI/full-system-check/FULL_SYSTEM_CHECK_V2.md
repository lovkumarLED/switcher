# FULL SYSTEM CHECK V2 — exhaustive pre-README, pre-commit release gate

> **Purpose:** perform a complete, evidence-backed check of the repository,
> Switcher app, BDF builder framework, OpenCode, KiloCode, and Claude Code
> integration before the README is rewritten, anything is committed, or
> anything is pushed.
>
> **Core formula:** **TEST → FIND → FIX → REPEAT**. A check is not complete
> because it ran once. Every failure must be understood, fixed at its root,
> regression-tested, and re-run until the affected surface and the full
> regression suite are green.
>
> **Execution status:** this is a runbook for the next model. It is not a
> claim that the system currently passes.

---

## 1. Mission and release decision

Treat this document as a release-blocking engineering assignment. Inspect the
actual current repository; do not trust old pass counts, old reports, or stale
feature lists. The objective is to find real defects and vulnerabilities,
repair them, and prove the repairs without damaging the user's real agent
configuration.

The final verdict may be `PASS` only when all applicable checks in this file
have fresh evidence. `NOT TESTED`, `ASSUMED`, an unexplained skip, an accepted
old baseline failure, or a missing control inventory blocks `PASS`.

Do **not** write the new root `README.md`, commit, push, publish, create a PR,
or make the repository public during this assignment. Those are later,
owner-authorized steps.

### Terminology

- **BDF** means **Builder Development Framework**. The owner's spoken
  reference to a “PDF framework” is understood as BDF unless an actual PDF
  artifact or PDF feature is discovered. If a real PDF subsystem exists,
  inventory and test it as an additional surface; do not silently ignore it.
- **Claude Code** is the intended meaning of “Clotcode/Plot code” in the
  request and repository history.
- **LSP check** has two meanings here, and both are required:
  1. use available language-server/static diagnostics to inspect source code;
  2. test the app's user-facing LSP configuration feature for OpenCode and
     KiloCode.

---

## 2. Required reading and sources of truth

Read these before changing code. Read the files completely, not only headings
or excerpts:

1. `AGENT.md`
2. `_agent/SESSION_WORKFLOW.md`
3. `_agent/SESSION_LOG.md`
4. `_agent/JOURNEY_TO_V3.md`
5. `app/rule.md`
6. `README.md`
7. `PROJECT_STATE.md`
8. `ADAPTER.md`
9. `ARCHITECTURE.md`
10. `BUILDER_SPEC.md`
11. `DESIGN_PRINCIPLES.md`
12. `FOLDER_STRUCTURE.md`
13. `JSON_SCHEMAS.md`
14. `CONTRIBUTING_FOR_AI.md`
15. `TESTING.md`
16. `bdf/FRAMEWORK.md`
17. `bdf/AI_WORKFLOW.md`
18. `bdf/TESTING.md`
19. `bdf/FRAMEWORK_LIFECYCLE.md`
20. `app/README.md`

Use these earlier full-check documents as historical reference, never as
fresh evidence:

- `AI/FULL_SYSTEM_CHECK.md`
- `AI/APP_FULL_CHECK.md`
- `AI/CONTINUE_FULL_SYSTEM_CHECK_SESSION_33.md`
- `AI/FULL_SYSTEM_CHECK_REPORT_2026-08-08.md`
- `AI/FULL_SYSTEM_CHECK_REPORT_2026-08-09.md`
- `AI/APP_FULL_CHECK_REPORT_2026-08-12.md`

Read the current Claude Code and LSP design, handoff, implementation, and gate
reports under `AI/`, `planning/`, and `superpowers/`. Resolve contradictions
in favor of current code plus the newest owner-approved decision. Preserve
historical records; do not rewrite history to make it look consistent.

---

## 3. Non-negotiable safety contract

### 3.1 Preserve the current working tree

The repository may already contain important uncommitted owner changes.

1. Record `git status --short`, branch, HEAD, staged diff, unstaged diff, and
   untracked paths before testing.
2. Save a baseline manifest in the final report. Do not expose secrets in it.
3. Never run `git reset --hard`, `git checkout -- <path>`, `git restore .`,
   `git clean`, an indiscriminate stash, or any bulk rollback command.
4. Never overwrite an owner-modified file with a historical copy merely to
   make a test pass.
5. Work around unrelated changes and preserve them.

### 3.2 Temporary testing versus valid fixes

**Test in temporary directories whenever technically possible.** Use a unique
system temp directory for every destructive scenario and resolve its absolute
path before writing, moving, or deleting anything.

There are two different kinds of changes, and they must not be confused:

| Change type | End-of-test action |
|---|---|
| Temporary fixtures, seeded models, fake providers, fake agents, test activity, copied raw configs, temporary state | Delete from the verified temp root or restore the real user data from its snapshot |
| Valid source-code fixes, regression tests, security hardening, and documentation corrections made because the check found a defect | **Keep them in the working tree. Do not revert them after testing** |

The model must **not revert everything after the tests complete**. Restore
user configuration and remove test pollution, but retain verified fixes.
Before cleanup, compare against the original Git and SHA-256 baselines so the
cleanup cannot erase owner work.

### 3.3 Raw OpenCode, KiloCode, and Claude Code files

The model may use the user's raw OpenCode, KiloCode, and Claude Code files as
read-only reference input and may copy sanitized/necessary samples to the
verified temp root for realistic tests.

- Never print API keys, tokens, environment-variable values, prompts,
  responses, personal paths, or unrelated personal data.
- Prefer structural summaries and hashes over raw content in reports.
- Do not modify a real raw file merely to create a test case.
- A real-target write requires the exact owner authorization and safety gate
  defined by that integration. Read/copy permission is not blanket write
  permission.
- Claude Code's real-target locks must remain closed unless the owner has
  explicitly authorized that exact live-validation gate. Never weaken or
  remove a lock just to obtain a green result.

### 3.4 Backup and restoration rule

Before any authorized test that can touch real app or agent state:

1. Stop the relevant app process cleanly.
2. Copy every in-scope file to a unique temp snapshot.
3. Create a SHA-256 manifest including relative paths and file lengths.
4. Verify the snapshot can be read before testing.
5. Run the smallest possible real-state test.
6. Restore the real state after the scenario.
7. Recompute and compare hashes; the diff count must be zero unless the owner
   explicitly requested a persistent real-state change.
8. Report backup rotation or metadata side effects; do not hide collateral
   changes.

Do not use broad process termination such as stopping every Python or Node
process. Identify the specific server PID and command line.

### 3.5 No-secrets rule

- Mask all secret-like values in terminal and report output.
- Never include real credentials in fixtures, screenshots, command lines,
  browser storage dumps, Git diffs, logs, or the report.
- API responses must expose only safe metadata such as `hasKey` or a secret
  reference, never plaintext.
- If a tool unexpectedly emits a secret, stop, redact the evidence, rotate or
  remediate as appropriate, and record the incident without repeating it.

---

## 4. The mandatory TEST → FIND → FIX → REPEAT formula

Apply this loop to every phase and every defect:

### TEST

- Reproduce the behavior with the smallest deterministic test.
- Capture the command, environment, exit code, relevant logs, screenshots or
  DOM evidence, and expected versus actual result.
- For UI defects, record browser console errors and network response status.
- For security defects, use a harmless proof in temp fixtures; do not exploit
  real data.

### FIND

- Trace the failure to its root cause. Inspect callers, data flow, validation,
  state transitions, generated files, and related contracts.
- Search for the same defect pattern elsewhere.
- Classify severity and affected agents/surfaces.
- Do not confuse symptoms with causes and do not guess at fixes.

### FIX

- Add or strengthen a regression test first where practical.
- Make the smallest complete root-cause fix that follows existing patterns.
- Preserve unknown user JSON fields and maintain backup-first writes.
- Update `app/BUGFIXES.md` for app bugs and synchronize every document or
  template whose behavior changed.
- Do not introduce unrelated redesigns or features.

### REPEAT

1. Re-run the exact reproduction.
2. Prove the regression test detects the old behavior when feasible
   (red/green evidence).
3. Re-run the focused suite.
4. Re-run the affected agent's builder/harness.
5. Re-run all app/backend/frontend/security suites.
6. Re-click the affected UI workflow.
7. Repeat until the failure is gone without regression.

Record every cycle as:

```text
DEFECT-ID: FSC2-###
Test: <command/control and evidence>
Found: <root cause>
Fix: <files and behavior changed>
Repeat: <focused result + full regression result>
Final: FAIL → FIXED → RE-PASS, or BLOCKED with exact reason
```

Do not delete or conceal failed attempts from the report.

---

## 5. Phase 0 — preflight, environment, and inventory

- [ ] Record date/time/timezone, OS, PowerShell, Python, Node, browser, Git,
      and relevant tool versions.
- [ ] Record repository root, branch, HEAD, and dirty-tree baseline.
- [ ] Confirm expected runtimes are available. Use the repository's intended
      virtual environment when present.
- [ ] Enumerate every source, schema, builder, harness, backend route,
      frontend page/module, test file, template, adapter, and generated-file
      type. Save the inventory in the final report.
- [ ] Discover current test counts from fresh output. Do not copy counts from
      an old report.
- [ ] Identify real agent roots without printing sensitive contents.
- [ ] Verify `.gitignore` excludes runtime state, credentials, virtual
      environments, backups, browser artifacts, and generated secrets.
- [ ] Confirm the app binds only to loopback and identify its exact PID after
      launch.
- [ ] Establish a unique temp root such as
      `%TEMP%\bdf-full-system-check-<timestamp>-<random>`; resolve and record
      the absolute path.
- [ ] Create sanitized temp agents for OpenCode and KiloCode and a fixture
      root for Claude Code.
- [ ] Record all unavailable tools or environmental limitations immediately.
      Install nothing globally and change no machine-wide setting without
      owner authorization.

---

## 6. Phase 1 — documentation, graph, version, and truth audit

### 6.1 Document graph

- [ ] Scan every repository Markdown file for relative links, code paths,
      “read first,” “see,” script, schema, image, template, and report
      references. Verify every non-historical target and referenced heading.
- [ ] Classify frozen history separately; do not “fix” historical paths unless
      the historical document falsely presents itself as current.
- [ ] Verify `FOLDER_STRUCTURE.md` against the actual tree: no phantom,
      missing, or mislocated current files.
- [ ] Verify all local images, GIFs, fonts, and SVG references resolve.
- [ ] Check encoding, mojibake, malformed Markdown tables, broken fences,
      duplicate headings, and stale absolute paths.

### 6.2 Version and generated-document consistency

- [ ] Exactly one release is current in `release_registry.json`.
- [ ] Current version, date, builder version, feature list, and test summary
      agree across the registry, CHANGELOG, CURRENT_RELEASE, PROJECT_STATE,
      ROADMAP, README, and `bdf/VERSION.md`.
- [ ] Run the release generator twice. The second run must be byte-identical
      and exit zero.
- [ ] Generated regions are generator-owned and are not hand-edited.
- [ ] Test counts in docs match newly observed counts, not historical counts.

### 6.3 Template/reference synchronization

- [ ] Every template maps to its reference document and is inventoried in
      `bdf/templates/README.md`.
- [ ] Headings, required fields, ownership rules, security rules, and feature
      contracts match between every reference/template pair.
- [ ] Every `{{TOKEN}}` is documented and used; no orphan or undocumented
      placeholder exists.
- [ ] Framework version/change history follows the template-change rule.
- [ ] OpenCode, KiloCode, and Claude Code capability claims are accurate and
      do not pretend the three agents use an identical architecture.

### 6.4 App documentation truth

- [ ] Every visible page, control, dialog, agent capability, limitation, and
      safety lock in the current app is accurately documented.
- [ ] No documented button or page is absent from the UI; no important
      current behavior is undocumented.
- [ ] Provider dual-key, reasoning-format, `.json`/`.jsonc`, LSP, backup,
      credential-store, proxy privacy, and Claude route-lock rules agree
      across code, schemas, examples, and docs.
- [ ] Do not rewrite the root README in this phase. Record required README
      corrections for the later README task.

---

## 7. Phase 2 — static analysis, language-server diagnostics, and code quality

### 7.1 LSP/static diagnostic pass

Use the available language servers or editor diagnostics over the whole
workspace for Python, JavaScript, JSON/JSON Schema, HTML, CSS, Markdown, and
PowerShell. Record the server/tool name, version, files analyzed, and every
diagnostic.

If a language server is unavailable, use the closest repository-compatible
parser/linter/compiler and report the substitution. Minimum fallbacks:

- Python: compile/import checks plus the project's unittest suite; type/lint
  diagnostics if configured.
- JavaScript: `node --check` for every `.js` file and extracted inline script,
  plus `node --test` contracts.
- JSON: parse every `.json`; validate schema files and validate fixtures
  against their intended schemas.
- HTML/CSS: parser/validator or browser diagnostics; inspect duplicate IDs,
  invalid selectors, missing labels, and inaccessible markup.
- PowerShell: parser diagnostics for every `.ps1` and `.psm1`, followed by
  execution through the harnesses.
- Markdown: links, fences, tables, encoding, and referenced paths.

Zero unexplained errors are allowed. Warnings must be fixed or explicitly
proven benign in the report.

### 7.2 Manual architecture and quality review

- [ ] Inspect every backend module, frontend module, engine script, schema,
      test, launcher, batch file, and configuration loader.
- [ ] Find dead code, duplicate implementations, stale aliases, unused
      exports, unreachable branches, swallowed exceptions, broad exception
      handlers, missing timeouts, unsafe defaults, and inconsistent
      validation.
- [ ] Verify API/frontend contract names and payload shapes match.
- [ ] Verify async UI handlers always restore button state in `finally` and
      cannot double-submit accidentally.
- [ ] Verify concurrent writes use unique temp files, atomic replacement,
      cleanup, and appropriate locking/version checks.
- [ ] Verify every file writer preserves unknown fields and creates the
      promised backup.

---

## 8. Phase 3 — automated test suites and syntax gates

Run focused tests first, then full suites. Use exact current paths discovered
in Phase 0. The following commands describe the known suites; correct paths
only when repository discovery proves they changed:

```powershell
# From docs/app
& .\env\Scripts\python.exe -W error::DeprecationWarning -m unittest discover -s tests -p "test_*.py"
node --test ".\tests\*.test.mjs"

# From docs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\kilo\test-kilo-v1.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-claude-code.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\app\engine\claude-code\test-provider-model.ps1 -PythonExe <absolute-path-to-app-python>
```

Also run every retained legacy/current harness discovered under the actual
engine/scripts roots, schema tests, security tests, focused LSP tests,
credential tests, frontend visual contracts, and route/capability contracts.

Acceptance rules:

- Exit code zero.
- Zero failing tests.
- Zero crashes, hangs, unhandled rejections, deprecation errors, or leaked
  processes.
- Zero unexplained skips or xfails.
- Old “accepted baseline failures” are not accepted for this release gate:
  fix them or obtain a new explicit owner waiver and mark the overall verdict
  `BLOCKED/WAIVED`, not clean `PASS`.
- A higher or lower count than an old report is investigated and documented.
- Run each full suite again after the final fix.

---

## 9. Phase 4 — adversarial security and privacy audit

Think like a hostile local webpage, malicious provider definition, malformed
agent config, compromised upstream, and accidental operator. Add harmless
regression cases for every vulnerability found.

### 9.1 Filesystem and input boundaries

- [ ] Provider, model, profile, route, agent, backup, and artifact names reject
      traversal, absolute paths, alternate separators, device names, reserved
      names, Unicode confusion, control characters, trailing dots/spaces, and
      unsafe extensions.
- [ ] Symlink/junction/reparse-point escapes are rejected before descendant
      reads or writes.
- [ ] Temp roots and restore targets are canonicalized and constrained.
- [ ] Archive/backup extraction cannot zip-slip or overwrite arbitrary files.
- [ ] File existence checks and replacements resist TOCTOU where practical.
- [ ] No user-controlled string is interpolated into a shell command.

### 9.2 Web and API security

- [ ] CORS and Origin checks permit only intended loopback origins; no wildcard
      with credentials.
- [ ] Consider DNS rebinding and hostile sites targeting the local API.
- [ ] State-changing endpoints use appropriate origin/content-type/request
      protections for the local threat model.
- [ ] Proxy forwarding is restricted to the configured active route; prevent
      request-controlled destination changes, unsafe redirects, credential
      forwarding across origins, header smuggling, unsupported schemes, and
      missing timeouts/size limits.
- [ ] All dynamic HTML is escaped or assigned with safe DOM APIs. Test stored
      and reflected XSS through provider/model/plugin/MCP/LSP/route/agent names,
      errors, URLs, and upstream responses.
- [ ] Theme/front-matter values cannot break out of CSS or HTML.
- [ ] Error responses do not disclose filesystem paths, stack traces,
      credentials, or raw configuration.
- [ ] Malformed, oversized, duplicate-key, wrong-type, and unknown-property
      JSON produce controlled errors without partial writes.

### 9.3 Secrets and privacy

- [ ] Scan tracked and untracked system artifacts for likely secret patterns,
      private keys, authorization headers, and real personal data. Inspect
      findings manually to distinguish false positives without printing the
      secret.
- [ ] Verify Git history/diff does not newly contain secrets.
- [ ] Verify API keys remain only in approved user-owned or encrypted storage.
- [ ] Test Claude DPAPI credential create/list/use/delete semantics without
      exposing plaintext; verify migration atomicity and cleanup behavior.
- [ ] Activity logs contain allowlisted metadata only—never prompts,
      responses, message content, headers, or raw bodies.
- [ ] Browser console, server logs, subprocess commands, toast messages, and
      screenshots are secret-safe.

### 9.4 Dependencies and supply chain

- [ ] Inventory Python, JavaScript, vendored browser libraries, PowerShell
      modules, fonts, images, and licenses.
- [ ] Check current advisories using authoritative ecosystem tools/sources
      when network access is available.
- [ ] Verify pinned/declared dependencies match what the app imports.
- [ ] Verify no runtime CDN, telemetry, phone-home, unapproved auto-update, or
      remote asset dependency exists.
- [ ] Verify install/start scripts do not execute untrusted input or weaken
      machine policy.

### 9.5 Claude Code safety invariants

- [ ] Real-target lock state is visible and truthful.
- [ ] Lock-free discovery/connect/inventory paths perform only their documented
      read/app-state behavior.
- [ ] Route CRUD, apply, restore, credential resolution, and production builder
      honor their exact lock and authorization contracts.
- [ ] Apply/restore are transactional, revision/hash checked, backup verified,
      recovery-safe, and leave no staging files.
- [ ] A locked operation fails safely and does not partially mutate app-owned
      or real Claude state.

Severity policy:

- Critical/High: stop normal progression, fix immediately, add regression
  coverage, re-run all security and full suites.
- Medium: fix before release unless the owner explicitly accepts the risk.
- Low: fix when safe or document with a precise owner decision; an unresolved
  functional defect still blocks the “everything passed” verdict.

---

## 10. Phase 5 — builder and BDF framework verification

### 10.1 Framework coherence

- [ ] Trace the complete lifecycle: developer request → adapter/spec/template
      inputs → scaffold/generator → builder → harness → generated artifact →
      release documentation.
- [ ] Verify BDF can generate the builder behavior described by the developer
      without undocumented machine-local dependencies.
- [ ] Verify generic framework rules remain generic and agent-specific rules
      stay in the relevant adapter/spec.
- [ ] Verify every template produces usable project documentation with all
      required placeholders resolved.
- [ ] Verify framework/version/migration/release-manager flows are
      deterministic and documented.

### 10.2 Clean-room generation

With `BDF_SCRIPTS_DIR` unset and no borrowed scripts outside the repository:

1. Bootstrap a temp OpenCode agent.
2. Bootstrap a temp KiloCode agent.
3. Generate each builder, harness, schemas, profiles, and support scripts.
4. Run the generated harnesses.
5. Build the main JSON twice.
6. Confirm second build is idempotent.
7. Confirm provenance/hash data is correct.
8. Compare source modules to generated JSON for exact semantic parity.

Test `-WhatIf`, `-Doctor`, missing optional files, invalid schemas, malformed
JSON, empty sections, multiple providers, no active provider, stale output,
backup retention, and failed-write recovery.

### 10.3 Source-to-generated parity

For OpenCode and KiloCode separately:

- [ ] Every selected provider exists in generated output.
- [ ] Every model survives with its name and exact variants.
- [ ] Reasoning formats emit only valid shapes/levels for
      `opencode`, `openai`, `claude`, `gemini`, and `none`.
- [ ] Provider dual keys are preserved/mirrored per contract without leaking
      them to API responses.
- [ ] Plugins, MCP, settings, and enabled LSP content survive exactly.
- [ ] Disabled LSP is omitted while its stored value remains available for a
      later re-enable.
- [ ] Unknown user-owned fields are preserved.
- [ ] No `.jsonc` file is created, scanned, merged, or modified.
- [ ] No section is silently dropped; warnings are investigated.
- [ ] Backup and provenance sidecars target the correct agent root.

### 10.4 Alias and copy drift

Hash-compare canonical builders/harnesses with all active aliases or bundled
copies. Determine which are frozen historical versions and which must match.
Fix current-copy drift; do not rewrite intentionally frozen history.

### 10.5 Claude Code's distinct builder contract

Claude Code is capability-distinct from OpenCode/KiloCode. Do not force the
multi-provider BDF profile model onto it merely for symmetry.

- [ ] Run the dedicated Claude routing core, production builder/wrapper, Gate
      2 harness, and provider/model evidence harness entirely on temp fixtures.
- [ ] Verify API-key and auth-token modes, model mapping, preservation,
      malformed/duplicate keys, invalid URL/model/secret reference, policy
      bounds, failure injection, rollback, cleanup, schema authority, and
      wrapper/core version identity.
- [ ] Verify the app truthfully reports Claude's builder/capability status.
- [ ] If current docs explicitly promise generic BDF generation of a Claude
      builder, test that promise. If they do not, do not invent it; test the
      dedicated Claude route builder/adapter that the current architecture
      actually supports and flag inaccurate product expectations for owner
      decision.

---

## 11. Phase 6 — exhaustive UI control inventory

“Every button” must be proved by inventory, not memory.

### 11.1 Build the inventory

For every reachable app state and agent mode, enumerate:

- buttons, links, tabs, segmented controls, toggles, checkboxes, radios;
- selects, custom selects, inputs, textareas, datalists;
- cards with click/keyboard actions, deck arrows, range selectors;
- dialog open/close/cancel/confirm actions;
- add/edit/remove/test/save/build/retry/copy/reveal controls;
- keyboard shortcuts, hover/scroll gestures, drag or pointer interactions;
- toast actions, empty-state calls to action, disabled states;
- responsive-only or capability-gated controls.

Derive the list from rendered DOM, source event bindings, router/navigation
definitions, backend routes, and screenshots. Search for event listeners and
inline handlers to catch controls hidden from the initial DOM.

Create a control ledger in the report:

| Control ID | Agent/mode | Page/state | Label/selector | Action | Expected UI | Expected file/API effect | Keyboard | Negative path | Result/evidence |
|---|---|---|---|---|---|---|---|---|---|

Every discovered control gets one row. Reconcile source-bound controls against
rendered controls; orphan handlers and dead controls are defects.

### 11.2 Execution rule for every control

For each control:

1. Verify initial enabled/disabled/pressed/checked state.
2. Activate with pointer.
3. Activate with keyboard when the element is interactive.
4. Verify visible result, focus destination, ARIA state, API request, and disk
   effect.
5. Test invalid input, server error, double click, and retry where applicable.
6. Reload/restart when persistence is promised.
7. Undo only the test data, not source fixes.
8. Check browser console and failed network requests.

No dead click, silent failure, stuck spinner, permanently disabled button,
duplicate write, misleading toast, or unhandled rejection is acceptable.

---

## 12. Phase 7 — full app functional click-through

Run the following first against temp agents/fixtures. Use real raw configs only
as read-only seeds. Run a minimal real-state confirmation only when authorized
and necessary.

### 12.1 Startup and onboarding

- [ ] Fresh app startup, server banner, health indicator, startup screen.
- [ ] Set-up button and every onboarding Back/Continue/Skip/Approve/Open
      Dashboard action.
- [ ] OpenCode, KiloCode, Claude Code, and manual-folder options.
- [ ] Selection gating and disabled Continue behavior.
- [ ] Discovery, scan summary, review counts, empty results, malformed config,
      missing folder, permission error, and retry.
- [ ] OpenCode/Kilo clean scaffold generation from copied raw main JSON.
- [ ] Claude onboarding lands on its correct capability-specific page and
      does not pretend to be a normal provider grid.
- [ ] No real file mutation before the explicit approval step.

### 12.2 Global shell and navigation

- [ ] Every sidebar entry, agent chip/switcher, theme, help/about, collapse,
      back/forward navigation, reload, deep link, and error retry.
- [ ] Correct navigation changes by capability (for example Providers versus
      Routes and hidden unsupported integrations).
- [ ] Active page, active agent, theme, and intended preferences persist.
- [ ] Unknown route and offline server states recover cleanly.

### 12.3 Overview and provider relay

- [ ] Provider deck cards, arrows, wheel/hover, keyboard cycling, selection,
      primary state, details, add/remove activation, and empty state.
- [ ] “Build my config” open/run/close/retry and terminal output.
- [ ] Summary KPIs, recent calls, range selector, provider usage, requests
      graph, legends, and `View all` routing.
- [ ] Zero traffic renders honest zeros/empty state, never fabricated data.

### 12.4 Providers, models, and reasoning

- [ ] Add Provider entry points on every page.
- [ ] Every provider preset plus Custom: name, slug, URL, SDK, reasoning
      format, key field, eye toggle, model rows, Back/Next/Test/Save.
- [ ] Required, malformed, duplicate, unsafe ID, unreachable endpoint, server
      error, and retry paths.
- [ ] Details, Edit, Test, Switch/Primary, Activate/Deactivate, Delete/Cancel/
      Confirm, deck controls, and agent tabs.
- [ ] Add/remove/save models on every surface: overview, provider workflow,
      settings editor/manager, and onboarding.
- [ ] Reasoning-format selector and every valid level/variant shape; invalid
      combinations must be rejected or normalized without silent data loss.
- [ ] Multi-select count, delete-selected disabled state, confirm, backup, and
      rebuild persistence.
- [ ] Secret fields never rehydrate plaintext into responses or DOM.

### 12.5 Activity recording and graphs

- [ ] Generate controlled successful and failed proxy events without spamming
      a paid/live provider; prefer a local fake upstream.
- [ ] Verify each allowlisted activity field and confirm forbidden content is
      absent.
- [ ] Verify overview and Activity request charts, latency chart, provider
      usage, recent-call table, legends, tooltips, axes, ranges, provider and
      status filters.
- [ ] Verify boundary timestamps, malformed log lines, retention limit,
      redaction toggle, concurrent events, empty filter result, and server
      restart.
- [ ] Confirm chart values exactly match independently calculated fixture
      totals; visual rendering alone is insufficient.

### 12.6 Integrations: plugins, MCP, and LSP

Plugins:

- [ ] Add, empty/invalid/duplicate, save, cancel, remove, confirm, backup,
      persistence, and rebuild survival.
- [ ] UI says configured identifier only; it must not falsely claim installed,
      running, healthy, or versioned.

MCP:

- [ ] Local/Remote/Expert mode toggles and ARIA state.
- [ ] Valid local command, valid HTTPS remote, valid expert JSON.
- [ ] Empty name, duplicate, non-HTTPS URL, wrong type, malformed/duplicate-key
      JSON, cancel, retry, remove, backup, and rebuild survival.
- [ ] Configuring MCP must not execute it automatically.

LSP:

- [ ] LSP card appears only for supported OpenCode/KiloCode modes and in the
      correct page order.
- [ ] On/off toggle, loading, failure rollback, toast, keyboard, ARIA, and
      persistence.
- [ ] Boolean and object value forms; expert JSON edit, malformed/wrong-type
      input, cancel/save, displayed server chips.
- [ ] Enable → build → exact `lsp` output; disable → build → key omitted while
      source value is preserved; re-enable → original value returns.
- [ ] Agent switching never leaks one agent's LSP state to another.
- [ ] Claude Code receives no unsupported BDF LSP control.

### 12.7 Settings

- [ ] Every settings module, selector, toggle, overflow/action menu, save,
      reset/cancel, provider/model control, credential action, retention,
      redaction, motion, build action, and agent-management action.
- [ ] Preferences persist correctly and rejected values do not write.
- [ ] Agent add/switch/remove preserves files on remove and maintains complete
      cross-page isolation.
- [ ] Claude settings/route inventory accurately reflects saved/applied route,
      lock, backup, MCP/plugin read-only counts, and credential metadata.

### 12.8 Claude Code routes page

- [ ] Onboarding entry, navigation entry, and three-agent switching.
- [ ] Empty state, saved-route list, selected/applied state, details, model and
      provider display, backup/status indicators.
- [ ] Add/Edit/Delete route inputs, key/token credential mode, credential
      reference, URL/model validation, duplicate handling, cancel/confirm,
      error/retry, and secret-safe rendering.
- [ ] Apply and restore locked behavior is clear and mutation-free.
- [ ] Temp-fixture unlocked apply/restore proves transaction, hash, backup,
      activity, and cleanup behavior.
- [ ] Any real live apply/restore is a separate explicit authorization gate;
      if not authorized, report it as `BLOCKED — authorization required`, not
      as passed or silently skipped.

### 12.9 Error, concurrency, and recovery paths

- [ ] Server killed/restarted during reads and writes.
- [ ] Upstream timeout, DNS failure, refusal, malformed response, redirect,
      rate limit, auth failure, and oversized response.
- [ ] Rapid double-click and concurrent add/activate/save/delete/build.
- [ ] Disk full or simulated write failure, read-only file, locked file,
      corrupt state, stale revision, interrupted replacement.
- [ ] Buttons re-enable, dialogs remain recoverable, partial files are absent,
      backups are usable, and errors are human-readable and secret-safe.

---

## 13. Phase 8 — agent isolation matrix

Run every applicable operation in the matrix. `N/A` requires a documented
capability reason, not convenience.

| Operation | OpenCode | KiloCode | Claude Code | Isolation proof |
|---|---:|---:|---:|---|
| Discover/scan/connect | Required | Required | Required | Counts and paths remain agent-specific |
| Add/edit/delete provider | Required | Required | N/A: route architecture | No cross-agent provider visibility |
| Add/remove model and reasoning | Required | Required | Route model field | Correct agent-specific persistence |
| Plugins/MCP/LSP app CRUD | Required | Required | Capability-specific read-only/hidden behavior | No cross-agent state leakage |
| Build/scaffold | Required | Required | Dedicated route builder only | Correct target artifact/root |
| Route add/edit/delete/apply/restore | N/A | N/A | Required per lock/authorization | Open/Kilo files unchanged |
| Activity/graphs | Required | Required | Required where supported | Correct agent/route attribution |
| Backup/restore | Required | Required | Required | Hash and manifest match |

Switch agents repeatedly after writes and reloads. Verify providers, models,
plugins, MCP, LSP, routes, activity, build output, capability navigation, and
settings never bleed across roots.

---

## 14. Phase 9 — visual, motion, responsive, and accessibility audit

Test at wide desktop, common laptop, narrow Windows window, and high zoom.
Test light/dark theme, reduced motion, forced colors/high contrast, keyboard
only, and screen-reader semantics where tooling permits.

- [ ] No clipping, overlap, horizontal-scroll accident, invisible text,
      off-screen dialog, truncated action, or unusable chart.
- [ ] Controls meet the documented minimum target size and have visible focus.
- [ ] Every form control has an accessible name and error association.
- [ ] Dialog focus is trapped, initial focus is sensible, Escape/Cancel works,
      and focus returns to the opener.
- [ ] Tab order follows visual/logical order; no keyboard trap.
- [ ] ARIA pressed/selected/expanded/checked/current/live states update.
- [ ] Status is not conveyed by color alone; contrast is adequate.
- [ ] Provider-deck/page/dialog/chart/Counterphase animations start and end
      correctly, do not leave stale transforms, and do not block controls.
- [ ] Rapid navigation and repeated animation triggers do not queue forever,
      jitter, duplicate nodes, or leak listeners.
- [ ] `prefers-reduced-motion` disables nonessential motion, pointer tracking,
      bubbles/flips, and chart entrance effects.
- [ ] Browser console has zero unexpected errors/warnings throughout.

Capture screenshots for every page in each agent mode and for important
dialogs, errors, narrow layout, dark theme, reduced motion, and graph state.
Inspect them visually; screenshots are evidence, not decoration.

---

## 15. Phase 10 — final regression, restoration, and hygiene

After the last fix:

1. Run every automated suite from Phase 3 again with fresh output.
2. Run all current/legacy builder and Claude harnesses again.
3. Re-run security regression tests and secret/privacy scans.
4. Re-run language-server/static diagnostics.
5. Re-click every control affected by a fix and a representative complete
   journey for each agent.
6. Re-run clean-room OpenCode/Kilo bootstrap/build twice and Claude temp
   apply/restore.
7. Confirm zero browser-console errors and zero unexpected failed requests.
8. Restore every authorized real-state snapshot and hash-verify diff count
   zero.
9. Remove only verified temporary test artifacts. Do not delete unknown
   untracked files and do not revert source fixes.
10. Compare final Git state to the baseline:
    - owner pre-existing changes preserved;
    - intentional checkup fixes and tests remain;
    - no secrets, temp fixtures, browser traces, runtime state, backups, or
      generated personal data are accidentally staged/tracked.
11. Run `git diff --check`.
12. Update `app/BUGFIXES.md`, affected docs/templates, session log, journey,
    and the final check report. Do not update the root README yet.

---

## 16. Required final report

Write a new dated report in `AI/`, for example:

```text
AI/FULL_SYSTEM_CHECK_V2_REPORT_YYYY-MM-DD.md
```

The report must contain:

1. Scope, environment, branch/HEAD, and starting dirty-tree baseline.
2. Exact commands, exit codes, current test counts, and durations.
3. Documentation/version/template audit results.
4. Static/LSP diagnostics by language.
5. Security threat checklist and findings by severity.
6. BDF and clean-room generation evidence.
7. OpenCode, KiloCode, and Claude Code capability/isolation matrix.
8. Complete UI control ledger with no missing result rows.
9. Graph data-versus-render evidence.
10. Visual/accessibility/motion evidence.
11. Every `TEST → FIND → FIX → REPEAT` defect record.
12. Real-state snapshot/restore hashes and collateral-change disclosure,
    without secret values.
13. Files changed by fixes, files intentionally untouched, and temp cleanup.
14. Open blockers, untested items, owner waivers, and exact `Next:` actions.
15. Final verdict.

Use these result values consistently:

- `PASS`
- `FAIL → FIXED → RE-PASS`
- `FAIL — OPEN`
- `BLOCKED — AUTHORIZATION REQUIRED`
- `N/A — <capability reason>`

An overall `PASS` requires:

- every applicable automated test green with zero unexplained skips;
- every current builder/harness and clean-room build green;
- zero unresolved Critical/High/Medium vulnerabilities;
- zero unresolved functional defects in required controls;
- complete control-ledger coverage;
- zero unexpected console errors;
- exact graph-data honesty;
- accessibility and reduced-motion gates passed;
- docs/templates/current code consistent;
- real user state restored byte-identically;
- valid fixes retained in the working tree;
- no secret or test artifact introduced into Git.

If any requirement is not met, say so plainly. Never convert “not tested” into
“passed.”

---

## 17. Stop and checkpoint rules

If the work approaches context/tool limits, stop at a safe boundary and write
`AI/CONTINUE_FULL_SYSTEM_CHECK_V2_<PHASE>.md` containing:

- completed checks and evidence paths;
- current temp roots/process IDs/snapshot manifests;
- defects and exact test/fix/repeat state;
- files changed and owner changes preserved;
- remaining control-ledger rows;
- exact next commands;
- safety/authorization blockers.

Do not rush, mark unchecked items as passed, or discard valid fixes to make the
tree look clean.

---

## 18. Resume prompt embedded in this runbook

```text
Read and execute:
C:\Users\loveb\.config\opencode\docs\AI\FULL_SYSTEM_CHECK_V2.md

Perform the exhaustive pre-README, pre-commit full-system check exactly as
written. Use TEST → FIND → FIX → REPEAT until every applicable gate has fresh
passing evidence. Test destructive scenarios in verified temporary roots.
You may read and copy the raw OpenCode, KiloCode, and Claude Code files for
realistic temp fixtures, but protect secrets and do not write real targets
without the document's explicit authorization gate.

Important cleanup distinction: restore/hash-verify real user configuration
and remove test-only temp data, but DO NOT revert valid source-code fixes,
regression tests, security hardening, or documentation corrections found
during the check. Preserve all pre-existing owner changes. Never use broad Git
rollback/clean commands.

Inventory and exercise every button, toggle, add/edit/remove/delete/test/save/
build/retry/copy action, dialog, input, keyboard path, animation, graph, and
error state. Test OpenCode, KiloCode, and Claude Code according to their actual
capabilities; test the BDF clean-room builder lifecycle; run language-server or
equivalent diagnostics; perform an adversarial vulnerability/privacy audit;
fix root causes and add regression tests.

Write AI/FULL_SYSTEM_CHECK_V2_REPORT_<today>.md with exact commands, test
counts, exit codes, complete control ledger, defect loops, security findings,
agent-isolation evidence, restoration hashes, and an honest final verdict.
Do not rewrite README.md, commit, push, publish, or open a PR. Stop and ask for
owner authorization at any real Claude write gate or other action that exceeds
this runbook.
```

---

**Document version:** 2.0  
**Created:** 2026-08-22  
**Status:** Active exhaustive verification runbook
