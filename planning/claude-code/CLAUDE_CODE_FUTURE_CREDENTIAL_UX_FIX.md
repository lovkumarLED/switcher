# Claude Code Future Credential UX Fix

## Status

**SUPERSEDED — implemented 2026-08-17 (session 48).** This backlog note's
body remains the historical record of the product gap. The implemented design
is `planning/designs/2026-08-17-claude-credential-store-design.md` (Windows
DPAPI-encrypted app-owned store, reference-only routes, automatic migration of
app-created env vars, reference-counted cleanup, full redaction).

This file records a product gap only. It does not authorize implementation,
change the current Gate 5 handoffs, unlock real-target access, or permit a live
operation.

## Problem

The current Claude route editor accepts only an environment-variable reference
name. The user must arrange for the corresponding secret value to exist in the
app process environment before a route can be applied.

That is acceptable for controlled developer validation, but it is not suitable
for normal application users. A normal user expects to paste an API key or
auth token into the local app and have the app handle the local credential
lifecycle.

OpenCode and Kilo already accept provider credentials through the local app.
Claude Code currently exposes a different and less accessible workflow.

The reference-only workflow can also create credential-management sprawl. A
user may need several environment variables for several providers, including
providers that are inactive. Deleting a saved route does not currently delete
the referenced operating-system environment variable because that variable is
external, user-owned state. It remains until the user removes it manually.

## Required future behavior

1. The local Claude route form accepts an API key or auth token value.
2. The value is submitted only to the local application.
3. The app stores or delegates the credential through an explicitly designed
   local credential-storage mechanism appropriate for the supported platform.
4. Route metadata stores only a stable credential reference, never the secret
   value.
5. Apply resolves the credential reference locally and supplies the selected
   Claude auth field without requiring the user to configure an environment
   variable manually.
6. Edit behavior preserves an existing credential when the secret input is
   left blank and replaces it only after explicit user input.
7. Delete behavior removes an unreferenced app-managed credential safely.
8. UI responses, logs, activity, manifests, reports, tests, exceptions, and
   subprocess output never expose the credential value.
9. The UI clearly distinguishes `apiKey` from `authToken` and never treats a
   credential value as an auth-kind or reference-name field.
10. Migration behavior for any existing environment-variable-reference route
    is designed explicitly rather than inferred during implementation.
11. Multiple routes may share one app-managed credential. Deleting one route
    must not remove a credential still referenced by another route.
12. Deleting the last route that references an app-managed credential must
    offer an explicit local credential-removal choice and must not leave an
    unexplained orphan.
13. Inactive providers must not require separate permanent environment
    variables merely to remain saved in the app.

## Design decision required

Before implementation, choose and document one credential backend. Candidate
approaches include the Windows Credential Manager, an operating-system keyring,
or another app-owned encrypted local store with a defined key-management model.
Do not silently fall back to plaintext route JSON or source-controlled files.

The design must also decide whether environment-variable references remain an
advanced option or are migrated to app-managed credentials.

The credential backend must define reference counting or an equivalent
ownership check, orphan discovery, explicit deletion behavior, and handling for
credentials shared by multiple routes or providers.

## Required future verification

- Add redaction tests covering create, edit, list, apply, restore, delete,
  failures, reports, and subprocess output.
- Add tests proving the route store contains references only.
- Add tests proving credential replacement and deletion semantics.
- Add tests proving shared credentials survive deletion of only one consumer
  and become eligible for removal only after the final reference is deleted.
- Add tests for orphan discovery and user-confirmed cleanup.
- Add tests for missing, inaccessible, and corrupted credential entries.
- Add Windows end-to-end coverage for the selected credential backend.
- Preserve the real-target lock and the existing snapshot/apply/restore safety
  contract.
- Re-run the focused and full Python/frontend suites and classify only known
  unrelated baseline failures.

## Future worker boundary

DeepSeek may implement this only under a new, separately reviewed handoff after
the current Gate 5 work. The handoff must include an approved design, exact
files, tests, rollback behavior, secret-redaction rules, and lifecycle/status
updates. This backlog note alone is not implementation authority.
