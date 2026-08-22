# Claude Code Adapter Compatibility Ledger

Lifecycle status: **Live validated**

Evidence date: 2026-08-17

## Version identities

| Item | Value |
|---|---|
| Adapter implementation version | 0.2.0 (constant in `claude-routing-core.psm1`) |
| Adapter document version | 1.0 (all five documents) |
| Routing schema | Gate 2 fixture-validated revision of `app/engine/schemas/claude-code-routing.schema.json` |
| Tested Claude Code version | 2.1.153 (observed in Gate 1, non-interactive) |
| Platform | Windows, PowerShell 5.1 |

## Evidence levels

Evidence level vocabulary: fixture, integration (app), or live. This ledger
records only what the cited gate reports prove.

## Feature-by-feature results

| Feature | Result | Evidence level | Evidence |
|---|---|---|---|
| User-scope settings patch (base URL, one auth reference, `env.ANTHROPIC_MODEL`, four curated options) | Fixture and production-path logic proven; surgical env-only patching | Fixture + integration | Gate 2 report (51 + 14 env-only tests), Gate 4A report and repair rounds |
| Byte-preserving surgical patch (no full-document regeneration) | Proven on fixtures: BOM, line endings, indentation, property order, number/string spelling, trailing newline, unmanaged bytes all exact | Fixture | Gate 2 env-only surgical tests |
| Top-level `model` preservation and `env.ANTHROPIC_MODEL` precedence | Proven: top-level model never changed; env model written and displayed as higher-precedence | Fixture + integration | Gate 2 tests; Gate 3 precedence criteria; Gate 4A apply tests |
| Four curated compatibility options with official constraints | Proven: `1`/absent semantics, never `0`/`false` for traffic; discovery + disabled traffic rejected | Fixture + integration | Gate 2 conflict test; Gate 4A validation tests |
| Discovery/nonessential conflict rejection (schema, core, API, UI) | Proven before any backup or mutation | Fixture + integration | Gate 2, Gate 4A tests; UI assistant tests |
| Unknown-key semantic preservation | Proven on fixture copies | Fixture + integration | Gate 2 report; Gate 4A apply tests |
| Backup, atomic replace, verified restore | Proven on fixture copies | Fixture + integration | Gate 2 report; Gate 4A restore tests |
| Saved routes, one applied route | Proven via app API on temporary roots | Integration | Gate 4A report |
| Manifest cap, pop, prune | Proven under success and injected failure | Integration | Gate 4A report and repair rounds |
| Redacted routing activity | Proven; exact 200-event retention | Integration | Gate 4A report |
| Discovery (structural settings-target check) | Proven on temporary roots; real-profile reads locked | Integration | Gate 4A report |
| Gateway class tested: fake Anthropic-compatible loopback gateway | Serves exactly one `GET /v1/models` response on a literal loopback authority with an OS-selected ephemeral port; unsupported methods return fixed 404; redirects are not followed; loopback authorities with explicit ports and IPv6 loopback were accepted without contact when discovery was absent | Fixture | Gate 3 report |
| Route classes tested: `apiKey` (X-Api-Key header reference) and `authToken` (Authorization Bearer reference) | Both are stored and applied as environment-variable reference names only; resolved from the process environment at execution time; no credential value was created, stored, emitted, or published | Fixture + integration | Gate 3 report; Gate 4A report (apply tests) |
| Gateway model discovery semantics | Proven against a fake loopback gateway only | Fixture | Gate 3 report |
| `env.ANTHROPIC_MODEL` precedence display | Proven against fixtures/fake gateway | Fixture | Gate 3 report |
| Advisory compatibility recommendation assistant | Proven pure-function rules, confirmation guard, conflict UI; never probes a gateway | Fixture | Frontend contract tests |
| Live Claude runtime acceptance | NOT proven | Not reached | Gate 5 unauthorized |

## Known precedence, reload, and interoperability caveats

- Higher-precedence managed, command-line, local, or project sources can
  override or merge with the user-scope target; runtime precedence is not
  claimed.
- Startup-only values may require a Claude Code restart; live reload is not
  claimed.
- Project `.claude/settings.json`, `.claude/settings.local.json`, and `.mcp.json`
  are future opt-in targets only.
- Recommendations are advisory and are not verification of any provider;
  `autoCompactWindow` recommendations derive from user/provider metadata only.
- Gate 5B.4 remains historical `HARD_FAILURE` evidence under the superseded
  broad ownership contract; the corrected scope manages only
  `settings.json`'s top-level `env` object and observes no other Claude-owned
  path.

## Unsupported combinations and unresolved questions

- Marketplaces, plugin installation, MCP, skills, permissions, hooks, memory,
  sessions, credentials, prompts, and transcripts are unsupported and
  Claude-owned.
- Whether a specific gateway accepts all beta headers and tool-schema fields
  without the beta-disable flag is unresolved until live validation.
- Whether the detected Claude Code version reloads each managed value live or
  only at startup is unresolved until live validation.

## Last verification date and evidence source

2026-08-17. Corrected Gate 5B live validation PASS
(`planning/claude-code/CLAUDE_CODE_GATE_5B_CORRECTED_LIVE_VALIDATION_PASS_REPORT.md`) +
Gate 5C documentation/release sync (`planning/claude-code/CLAUDE_CODE_GATE_5C_DOCUMENTATION_RELEASE_SYNC_REPORT.md`);
Gates 1-4A reports remain the fixture/integration evidence ledger.

## Status

**Live validated** (2026-08-17). Compatibility rows report what was observed
at their evidence level; they do not extrapolate support from one version.
Live validation covers the corrected env-only routing scope and the loopback
gateway exercised by the gate; the real-target lock stays closed until the
owner opens it.

---

**Document Version:** 1.1

**Status:** Live validated
