# Design — GUI App: Self-Contained Python Environment + rule.md Theme Engine

Date: 2026-08-08
Status: Approved by user (2026-08-08)
Applies to: `docs/app/` (Switcher app)

---

## 1. Problem

1. The app currently depends on **global Python packages** (`fastapi`, `uvicorn`
   installed via a global `pip install`). A normal user copying the app folder to
   another PC would hit "module not found" with no obvious fix.
2. The app's **look is hardcoded** in `gui.html`'s `:root` CSS variables. There is
   no single file that defines what the app should look like and what it should
   do — neither for the app itself nor for AI agents working on it.

## 2. Goal

- The app folder becomes **self-contained**: it owns a Python virtual
  environment, installs its own dependencies, and runs from that environment.
  No global pip packages required.
- A single `rule.md` file inside the app is **both**:
  - a **theme** the app actually applies (edit it, refresh the browser, colors
    change), and
  - a **rulebook** for AI agents and humans (colors, features, architecture
    rules).

## 3. Design

### 3.1 Self-contained Python environment

```
docs/app/
├── env/                 ← venv, created automatically on first run (machine-specific)
├── requirements.txt     ← fastapi, uvicorn (grows as pip functions are added)
├── start.bat            ← bootstrap: ensure env → run server from env
├── server.py            ← unchanged entry point
└── app/                 ← Python package (unchanged modules + new rules.py)
```

**`start.bat` flow (first run):**

```
1. Check `env\Scripts\python.exe` exists.
2. If missing:
   a. Check global `python` exists (else: existing friendly "install Python"
      message + pause).
   b. `python -m venv env`
   c. `env\Scripts\python -m pip install --upgrade pip`
   d. `env\Scripts\python -m pip install -r requirements.txt`
   e. If any step fails: print the error, pause, exit — retry on next launch.
      The server never starts from a half-broken environment.
3. `env\Scripts\python server.py` (auto-opens browser as today).
```

**Second run onward:** step 2 is skipped; server starts instantly from `env`.

**Portability:** `env/` is machine-specific and may be deleted freely (the
venv is recreated on next launch). `providers.json`, `state.json`, backups,
and `rule.md` are the user's data and must never be recreated/reset.

**Growing the environment ("pip functions"):** new Python dependencies are
added to `requirements.txt`; `start.bat` re-runs `pip install -r
requirements.txt` whenever the env exists but the requirements file changed.
Detection: a file `env\.requirements.hash` stores the SHA256 of the current
`requirements.txt`; if the hash differs (or the marker is missing), reinstall
and rewrite the marker. This makes installs once-per-change, never per-launch.

### 3.2 rule.md — one file, two jobs

`docs/app/rule.md` with a YAML front-matter block (machine-readable theme) and
a Markdown body (the rulebook).

**Front-matter (theme):**

```yaml
---
theme:
  colors:
    bg: "#0d1117"
    card: "#161b22"
    border: "#30363d"
    border-hi: "#4a5261"
    text: "#e6edf3"
    muted: "#8b949e"
    accent: "#6366f1"
    accent-hi: "#818cf8"
    green: "#3fb950"
    red: "#f85149"
    amber: "#d29922"
  radius: "14px"
  radius-sm: "10px"
---
```

All keys map 1:1 to the CSS variables already defined in `gui.html`'s `:root`.
Optional keys (shadow, soft colors) may be added later; unknown/missing keys
fall back to the current hardcoded values.

> NOTE (final review, 2026-08-08): gui.html has NO `--font` variable — the body
> font is hardcoded. `--font` therefore does NOT appear in rule.md (it would
> promise a behavior the app cannot deliver). The parser's `DEFAULT_THEME`
> keeps an inert `--font` for forward compatibility, but rule.md must not
> advertise it until gui.html consumes `var(--font)`.
>
> ENCODING TRAP (final review, 2026-08-08): PowerShell 5.1 `Get-Content`
> without `-Encoding UTF8` decodes files as the machine's ANSI codepage.
> On this machine (GBK), reading and re-writing rule.md that way
> double-encodes every non-ASCII character (the rulebook body was corrupted
> exactly this way during Task 4 verification). All rule.md reads in
> verification MUST use `-Encoding UTF8`; all writes MUST be BOM-free.

**Body (rulebook, Markdown):** written for humans and AI agents:
- Design rules: dark theme, one accent color, status colors green/red/amber
  reserved for status, plain words (never jargon/endpoint names), large click
  targets (≥44px), rounded corners, `prefers-reduced-motion` respected.
- Feature rules: what the app does (wizard, providers, test/switch, build,
  proxy) and what it must never do (no telemetry, no cloud, no account,
  no AI-agent requirement).
- Architecture rules: modular `app/` package, No-Secrets rule (keys only in
  user's providers.json), backup-first writes, local-first 127.0.0.1.
- Note for agents: read this file before changing the app.

### 3.3 How the app applies the theme

**New module `app/rules.py`:**
- Parses `rule.md` front-matter (safe, dependency-free YAML subset parser —
  no new pip dependency required; the front-matter is flat key-value so a
  small custom parser suffices).
- Validates: unknown keys ignored, missing keys → defaults, non-hex color
  values → defaults. Never crashes the app.
- Exposes `get_theme()` (dict of CSS variable → value) and
  `get_rules_summary()` (markdown body text).
- Caches parse results; re-reads when the file's mtime changes.

**`app/serve.py` change:** when serving `gui.html`, inject before `</head>`:

```html
<style>:root{--bg:#0d1117;--card:#161b22;...}</style>
```

A later `:root` block overrides the earlier one, so the app's look comes from
`rule.md`. If rule.md is missing/corrupt → serve with no injection (defaults
apply) + one console warning.

**New endpoint `GET /api/rules`:** returns
`{"theme": {...}, "rulebook": "..."}` — theme dict + rulebook text. Future
screens (e.g. a "Themes" or "About" panel) can read it.

### 3.4 Docs wiring

- `docs/app/README.md`: new "How the app's Python works" section (env/,
  auto-setup, why env/ gets recreated on another PC, how to add pip packages)
  + "How to change the look" section (edit rule.md, refresh).
- `rule.md` itself contains the agent-facing note (read me first).
- No changes to the frontend (`gui.html` stays Qwen's file — theme injection
  is server-side, no JS changes required).

## 4. Data flow

```
start.bat → ensure venv → python server.py
                                   │
                                   ▼
serve.py ──GET /──► rule.md ──rules.py──► injected <style> into gui.html
                                   │
                                   └──► GET /api/rules {theme, rulebook}
```

## 5. Error handling

| Failure | Behavior |
|---------|----------|
| Python not installed | start.bat shows the existing friendly message + pause |
| `python -m venv` fails | error printed, pause, exit; retry next launch |
| `pip install` fails | error printed, pause, exit; retry next launch |
| rule.md missing/corrupt | no injection (hardcoded defaults), console warning |
| rule.md has unknown/missing keys | defaults for those keys, rest applied |

## 6. Testing / acceptance

1. Delete `docs/app/env/` → run `start.bat` → venv created, requirements
   installed, server starts, browser opens, GUI loads with theme applied.
2. Second launch: instant start, no re-install.
3. Change `accent` in rule.md → refresh → color changes; invalid value →
   default color, no crash.
4. `GET /api/rules` returns theme + rulebook.
5. All existing smoke tests still green (status, providers CRUD, test,
   switch, scaffold, build, /v1 proxy) with the venv Python.
6. `providers.json` / `state.json` untouched by the environment bootstrap.

## 7. Out of scope (this round)

- No GUI "Packages"/"Themes" screens (API + rule.md only; screens come later
  per user direction).
- No bundling Python itself (still requires Python installed once).
- No changes to `gui.html`'s JS.
