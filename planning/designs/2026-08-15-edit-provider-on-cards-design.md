# Edit Provider on Provider Cards — Design

Date: 2026-08-15
Status: Approved
Scope: app/ (AI Switcher) — Providers & agents page

## Problem

There is no discoverable way to edit an existing provider (change base URL, SDK package, reasoning format, or API key). The capability exists today but is buried: card → Details dialog → "Edit provider" button → 5-step modal. Users never find it. The workaround is deleting the provider and re-adding it, or hand-editing JSON files.

## Approach

Surface editing directly on the provider cards. Keep the existing edit wizard unchanged (UI/UX is approved and must not change). No backend changes — `PUT /api/providers/{id}` already merges blank fields with stored values (blank API key keeps the existing key).

## Decisions

- **No new header button** next to "Add provider" — user changed direction; the edit entry point goes on the cards.
- **Provider ID stays locked** — the ID is the file name and the `activeProviders` reference in `settings.json`; renaming it is risky. The existing wizard never exposes the ID, so no change needed.
- **Models** — the existing wizard includes a Models step; since the wizard is reused unchanged, models remain editable there (overlapping the settings model manager is acceptable; user said "why not", keep UI unchanged).
- **Details dialog** becomes read-only (info + Close); its "Edit provider" button is removed. One edit entry point: the card.
- **Edit action on card** opens the existing `openProviderDialog(provider, trigger)` wizard, pre-filled, titled "Edit {name}".

## Changes

### 1. `app/assets/js/pages/provider-workspace.js` — `card()`

Add an "Edit provider" button to the card actions row, after "Test connection", before "Remove provider", using the existing style and wiring:

```
<button class="button button--quiet button--small" type="button" data-provider-action="edit">Edit provider</button>
```

Order per user: Activate/Deactivate, Details, Test connection, **Edit provider**, Remove provider.

### 2. `app/assets/js/pages/providers.js` — `handleAction()`

Handle the new action:

```
if (action === "edit") { openProviderDialog(provider, trigger); return; }
```

### 3. `app/assets/js/pages/providers.js` — `details()`

Remove the "Edit provider" button from the Details dialog actions and its `onOpen` wiring. Details dialog keeps Close only.

### 4. Tests — `app/tests/providers_visual_contract.test.mjs`

Add/extend assertions:
- Card markup includes `data-provider-action="edit"` with label "Edit provider".
- `handleAction` path opens the wizard (`openProviderDialog`).
- Details dialog no longer contains `data-edit-provider`.
- Existing tests must still pass.

## Verification

1. Run the JS contract tests (`node --test app/tests/*.test.mjs`) and Python tests (`pytest app/tests`).
2. Run the app against a **temp agent config**; confirm the Edit provider button appears on every provider card (front, middle, back deck positions).
3. End-to-end edit in the temp env: change base URL, SDK package, reasoning format, API key; save; confirm persisted values and that a blank API key keeps the existing key.
4. Confirm the Details dialog no longer offers editing.
5. After verification: **revert only test data / temp artifacts** — remove temp agent config, temp providers created during testing. **Keep the code changes.**

## Out of scope

- No backend/API changes.
- No CSS/design changes — the card grid already fits 4 action buttons (2×2 + full-width Remove).
- No changes to the edit wizard itself.
- Claude Code (scalar-route) page — `claude-routes.js` is untouched; the change only affects the OpenCode/Kilo multi-provider workspace.
