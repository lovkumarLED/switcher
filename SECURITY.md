# Security Policy

## Supported versions

Switcher is a fast-moving single-maintainer project. Only the latest commit on
`main` receives security fixes — please update before reporting.

| Version | Supported |
| --- | --- |
| latest `main` | ✅ |
| older commits / tags | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's **"Report a vulnerability"** flow on this
repository: **Security tab → Advisories → *Report a vulnerability***. Your
report stays private between you and the maintainer — no email is required.

Please include:

- What you found and how you exploited it (steps or proof-of-concept)
- Which component is affected (app backend, proxy `/v1`, builders, adapter)
- Your Windows / Python versions
- Any relevant log excerpts with **keys, tokens, and personal paths redacted**

You will not receive an automated acknowledgement window promise from this
file; reports are reviewed as quickly as the maintainer can. Until a fix is
released, please keep details private.

## Scope notes specific to Switcher

The project's threat model assumes a **local, single-user machine**:

- The app server binds `127.0.0.1:9090` only and enforces loopback
  Host/Origin checks on state-changing routes.
- API keys are stored only in the user's own provider files and in a Windows
  DPAPI-encrypted credential store (`app/state/claude-credentials.bin`,
  git-ignored). They must never appear in code, logs, examples, screenshots,
  issues, or API responses.
- Activity logging stores sanitized metadata only (no prompts, responses,
  headers, or raw bodies) and content redaction cannot be disabled.
- Builders run local PowerShell scripts generated into the user's own agent
  config folder.

Reports about cross-origin/DNS-rebinding exposure of local servers, secret
leakage, path traversal, injection into builder inputs, or `.jsonc` bypasses
are especially valuable.

## Out of scope

- Vulnerabilities requiring a malicious local process already running as the
  same user (it could read the same files directly).
- Reports about the demo GIFs' fixture data ("Demo Relay",
  `api.example.test`, fake `sk-test-fake-key-*` values) — these are
  intentionally fake.

## Safe harbor

Good-faith research and disclosure following this policy is welcome and will
not be met with legal action from the project maintainer.
