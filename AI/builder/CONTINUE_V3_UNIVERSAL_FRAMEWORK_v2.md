# CONTINUE — V3 UNIVERSAL AGENT FRAMEWORK (session 26b, all four tasks + docs-sync complete)

Resume point for the next session. User asked "does my framework reach builder v3" →
answered YES per ROADMAP criteria, but with 2 gaps. User said "do 1 and 2" → both done.

## Done this session (26b — do not redo)

### 1. BUILDER_SPEC docs synced (stale per session 25 Next line a)
- `docs/BUILDER_SPEC.md` Contract section (v1.2) rewritten to actual behavior:
  - `.provenance.json` files NEVER scanned as main configs.
  - Policy = refresh-with-backup (decided 2026-08-07, user choice): ALWAYS refresh
    mcp.json/plugins.json from main target; snapshot previous to `backup/<tag>_<ts>.json`.
    Applies to ALL profiles (coding/experimental/minimal).
  - settings.json carries FULL agent shape: create-with-full-shape when missing,
    merge-missing-keys-only when exists; activeProviders never clobbered.
- `~/.config/kilo/docs/BUILDER_SPEC_KILO_ADAPTER.md` Contract section: same sync;
  kilo-specific note added ("reproduce the full kilo.jsonc shape ~13 top-level sections").

### 2. Real-config scaffolds executed (stale per session 25 Next line b)
- **Kilo** (`echo y|` consent, exit 0):
  - Backup+refresh of all 3 profile mcp/plugins (same content → same backup name,
    but overwrite is idempotent-by-Copy-Item).
  - settings.json merged 10 missing keys per profile: model, small_model, agent,
    permission, username, hide_prompt_training_models, default_agent, experimental,
    skills, disabled_providers.
  - Verified: real `~/.config/kilo/kilo.jsonc` SHA-256 = 6BAF7082E40F411... (untouched
    from scaffold side; it was already "~13 sections" from session-25 in-place edit).
  - Verified: `profiles/coding/settings.json` now contains all 12 top-level keys
    ($schema, activeProviders, model, small_model, agent, permission, username,
    hide_prompt_training_models, default_agent, experimental, skills, disabled_providers;
    provider correctly user-owned, scaffold prints guide only).
- **OpenCode** (`-NonInteractive`, exit 0):
  - `.jsonc` files skipped in non-interactive (correct Non-JSON Guard).
  - Backup+refresh of all 3 profile mcp/plugins from real opencode.json.
  - settings.json merged 1 missing key per profile: instructions.
  - Real `~/.config/opencode/opencode.json` untouched.
- Harness battery (run AFTER real scaffolds): kilo 30/30 + oc 2.7 30/30 both PASS exit 0.

### 3. AGENTS.md relocation
- `~/.config/opencode/AGENTS.md` moved → `~/.config/opencode/docs/AGENTS.md` per user
  rule "everything lives in docs". Content unchanged. Opencode resolves AGENTS.md from
  both root and docs/, so behavior is transparent.
- NOTE (session 28 correction): this relocation was later reverted per user decision —
  neither `~/.config/opencode/AGENTS.md` nor `docs/AGENTS.md` exists on disk today, and
  AGENTS.md was never tracked in git. The Verify block below is updated accordingly.

## Next (nothing mandated)
- (Optional) Commit docs (scaffold spec sync + session log + journey + this checkpoint).
  Per AGENT rule: only on explicit user request.
- (Optional) Seed aider/goose if user installs them later — registry seeds remain; nothing
  to validate today.
- Otherwise V3 core is declaration-ready per ROADMAP Definition of complete:
  discovery (registry+prompt) ✓, universal builder generation (opencode+kilo verified) ✓,
  only per-agent adapter differs ✓, errors fixable/re-runnable (byte-identical rebuild) ✓.

## Verify (how to confirm this checkpoint)
- `Get-FileHash ~/.config/kilo/kilo.jsonc` == 6BAF7082E40F411CB4BC2F63D953B369BE236738B06223DCDE05261226A72766
- `(Get-Content ~/.config/kilo/profiles/coding/settings.json -Raw | ConvertFrom-Json).PSObject.Properties.Name.Count -ge 12`
- `Test-Path ~/.config/opencode/AGENTS.md` → False (reverted per user)
- `Test-Path ~/.config/opencode/docs/AGENTS.md` → False (reverted per user)
- Harness: kilo 30/30 + oc 2.7 30/30 (re-ran post-scaffold).

## Decisions
- AGENTS.md moved INTO docs/ per user rule (later reverted per user — see session 28
  correction; no AGENTS.md exists today). System auto-loads it from docs/ when present.
- Real configs (kilo.jsonc, opencode.json) NEVER touched by scaffold — only profile
  files under ~/.config/{kilo,opencode}/profiles/ get refreshed-with-backup.

## Rules preserved (from session 25)
- Real kilo/opencode configs only touched via consent gate or -NonInteractive.
- No commits without explicit user request.
- No full system check next session.

## Resume prompt
"Resume from `docs/AI/CONTINUE_V3_UNIVERSAL_FRAMEWORK_v2.md`. Skip all full-system-check
mentions. Session 26b done: BUILDER_SPEC docs synced (refresh-with-backup, full-shape
seeding, provenance exclusion); real kilo + opencode scaffolds executed with consent
(harness 30/30 both); AGENTS.md relocation reverted per user (no AGENTS.md exists —
see session 28 correction). V3 core is declaration-ready.
Optional next: commit docs on request, seed aider/goose if user installs them later.
Files touched: docs/BUILDER_SPEC.md, ~/.config/kilo/docs/BUILDER_SPEC_KILO_ADAPTER.md,
docs/_agent/SESSION_LOG.md, docs/_agent/JOURNEY_TO_V3.md.
Real kilo/opencode configs untouched (verified by hash)."
