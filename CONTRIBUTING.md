# Contributing to Switcher

First off — thank you. This project started as one person's toolbox, and every
contribution makes it more useful for everyone. ❤️

## What's welcome

- Bug reports and bug fixes (OpenCode + KiloCode flows are verified targets;
  please say which agent you were managing)
- Documentation improvements — if something confused you, it confuses others
- New provider presets, SDK entries, or reasoning-format fixes
- Careful, scoped features that fit the existing architecture

## Ground rules

The project follows a few non-negotiable invariants. Any change that breaks
them will be asked to change:

1. **No secrets, ever.** Keys live only in the user's own provider files or
   the DPAPI credential store. Never commit, log, screenshot, or echo keys.
2. **Backup-first writes.** Anything that modifies a generated target backs
   up first.
3. **Generated files are outputs.** Never hand-edit `opencode.json` /
   `kilo.json` in fixtures or tests.
4. **Local-only.** The server binds `127.0.0.1`; nothing may phone home.
5. **Never touch `.jsonc`.** The framework scans main `.json` files only.
6. **Demo media must be sanitized.** Screenshots/GIFs show fixture data only
   (`Demo Relay`, `api.example.test`, fake keys) — never real accounts,
   paths, or activity.

## Setting up your development environment

```powershell
git clone https://github.com/lovkumarLED/switcher.git
cd switcher\app
python -m venv env
env\Scripts\python -m pip install -r requirements.txt
env\Scripts\python server.py        # http://127.0.0.1:9090
```

## Running the tests

From `app/`:

```powershell
# Python unit tests
env\Scripts\python -m unittest discover -s tests -p "test_*.py"

# Frontend contract tests (needs Node.js)
node --test ".\tests\*.test.mjs"
```

Builder harnesses (from the repo root):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\app\engine\test-opencode-v2.7.ps1
```

Full verification procedures live in [TESTING.md](TESTING.md). Please run at
least the Python and frontend suites before opening a PR.

## Pull requests

1. Fork → feature branch → small, focused diffs.
2. Follow the existing code style (one responsibility per module; vanilla JS;
   no new frameworks).
3. Update documentation in the same change when behavior changes — see the
   README synchronization rule below.
4. Describe what you changed and how you verified it.

## The public README network (documentation sync)

The public-facing READMEs form a connected network an internet visitor can
walk: the root [`README.md`](README.md), [`app/README.md`](app/README.md),
[`bdf/README.md`](bdf/README.md),
[`adapters/claude-code/README.md`](adapters/claude-code/README.md), and any
future public component README linked from them.

When a change alters something these documents describe (features, commands,
compatibility, status, media), update **every affected README together** —
always checking whether the root README is affected — instead of waiting to
be told which file. Ordinary internal notes, session logs, plans, and test
reports are not part of this network and stay untouched.

## AI agents

AI coding agents have their own entry point: [AGENT.md](AGENT.md) and
[CONTRIBUTING_FOR_AI.md](CONTRIBUTING_FOR_AI.md). Read them before making
changes.

## Reporting bugs

Open a GitHub issue with: what you did, what you expected, what happened,
your Windows + Python versions, and the relevant build output. Redact API
keys and personal paths — issues are public.

---

*By participating in this project you agree to abide by the
[Code of Conduct](CODE_OF_CONDUCT.md).*
