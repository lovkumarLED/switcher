# SESSION_WORKFLOW

> Session start, end, and log rules for this documentation repository.

---

# Purpose

Work in this repository spans multiple sessions.

Every session starts with a fresh context window.

The session files preserve knowledge between sessions:

- `SESSION_LOG.md` stores the history of completed sessions.
- `SESSION_WORKFLOW.md` (this document) defines how sessions start, end, and write to the log.
- `JOURNEY_TO_V3.md` tracks our position on the road to BDF V3.

An agent must follow this document at the start and end of every session.

---

# File Locations

```
_agent/

SESSION_LOG.md

SESSION_WORKFLOW.md

JOURNEY_TO_V3.md
```

These files live inside the documentation repository.

---

# Session Start Rules

At the start of every session:

1. Read `_agent/SESSION_WORKFLOW.md`.
2. Read `_agent/SESSION_LOG.md`.
3. Read the most recent session entry.
4. Check its `Next:` line to determine where work should continue.
5. Read `_agent/JOURNEY_TO_V3.md` and note the `Current Position` section —
   where we are on the road to V3.
6. Read `PROJECT_STATE.md` to load the current repository state.
7. Follow the `AGENT.md` reading order before modifying any files.

Do not begin work without reading the most recent session entry.

---

# Session End Rules

A session ends when EITHER:

- The user says "end session", "wrap up", or "done for today", OR
- The context window reaches 65-70% (see Context Window Budget below).

On session end:

1. Write the session summary directly into `_agent/SESSION_LOG.md`.
2. Do not ask for confirmation.
3. Confirm the update with: Session log updated.
4. Update the `Current Position` section of `_agent/JOURNEY_TO_V3.md`
   (step, status, progress) — see the update rules in that file.
   Confirm with: Journey position updated.
5. If a major refactor occurred this session, regenerate `PROJECT_STATE.md` (see AGENT.md, Project State section).
6. Do not update any other session file unless its rules changed.

Every session must end with a session log entry — no exception. Even short or partial
sessions get an entry, so the next session can resume from the `Next:` line.

---

# Context Window Budget

The user's context window is **200,000 tokens**. The hard ceiling for task work is
**80% (≈160,000 tokens)**; wrap-up starts at **75% (≈150,000 tokens)**. The workflow
protects this budget so work is never lost to a full context window. (AGENT.md and
`AI/builder/CONTINUE_PROJECT_BUILD.md` state the same 70-80% range; this document is the
canonical table.)

## Budget allocation

- **Base overhead (fixed):** system prompt, skills, session history ≈ 15-30k tokens.
- **Reading:** always delegated to reader sub-agents. Bulk reading must never enter the
  main context (docs total ≈ 560 KB ≈ 140k tokens — reading them all alone would hit 70%).
- **Work:** edits, command outputs, sub-agent summaries share the remaining budget.

## Triggers

| Context level | Action |
|---------------|--------|
| < 60% | Normal operation. |
| 60-75% | Avoid new bulk reads. Delegate everything possible. |
| 75% | **WRAP UP.** Finish the current subtask, write the session log entry, and tell the user to start a fresh session. |
| 80% | Stop all work immediately. Write the session log entry. Do not start new tasks. |

## Handoff

1. Session log entry must contain a precise `Next:` line (file paths + next action).
2. The next session reads SESSION_LOG.md's latest entry and continues from `Next:`.
3. Never attempt to "push through" past 80% — a full window loses all work.

---

# Entry Format

Every session entry follows this format.

```
### (date) (session N) — (short description) ← recent session
Done:
- (completed items, one per bullet)

Broken:
- (unresolved issues, one per bullet, or "None — clean session.")

Journey: (position on the road to V3 — step name + status + progress, e.g. "Step 1 BDF V2.5 — IN PROGRESS, 40%")

Next: (what to start next, one line)

Learned: (one key takeaway)
```

Example

```
### Aug 3, 2026 (session 1) — Built the Builder Development Framework ← recent session
Done:
- Created the reusable framework documentation.
- Created documentation templates.

Broken:
- None — clean session.

Journey: Step 1 BDF V2.5 — NOT STARTED, 0%

Next: Review the framework with the user.

Learned: Externalizing session context into a log preserves work across context resets.
```

---

# Critical Rules

## Never Delete or Overwrite Sessions

Existing session entries are read-only.

Never edit or delete the `Done:`, `Broken:`, `Next:`, or `Learned:` content of an existing entry.

If an edit would modify existing session content, stop: it destroys history.

## Only Allowed Edits

The only permitted edits to existing entries are:

1. Remove the `← recent session` tag from the previous session's header line.
2. Insert the new session entry at the top of the Session History.
3. Trim the oldest entries when the count exceeds five.

`JOURNEY_TO_V3.md` is NOT part of the session history. Its `Current Position` section is a
living status that must be updated at every session end (see Session End Rules).

---

# Session Log Rotation

The log keeps a maximum of five session entries.

Before inserting a new entry:

1. Count the existing entries.
2. If five or more exist, delete the oldest entries until only the most recent five remain.
3. Insert the new entry at the top of the Session History, directly below the `## Session History` heading.

---

# Recent Session Tagging

The newest session entry carries the tag at the end of its header line:

```
← recent session
```

When inserting a new entry:

1. Add the tag to the new entry's header.
2. Remove the tag from the previous entry's header.

Exactly one entry has the tag at any time.

---

# Consistency Rules

- Entries record facts only: what was done, what broke, what is next.
- `Broken: None — clean session.` is written only when no unresolved issues remain.
- Session numbers increase by one for every new entry.
- Dates use the format: MMM D, YYYY.
- The most recent session entry is always the first entry below the heading.

---

# Integration

`AGENT.md` contains the session continuity section.

It points to this document.

This document and `AGENT.md` must remain consistent with each other.

`JOURNEY_TO_V3.md` is the journey tracker this workflow updates at every session end.

`AI/builder/CONTINUE_PROJECT_BUILD.md` defines the checkpoint + resume rule for large version
builds that exceed the context budget; checkpoint files point back here.

`AGENT.md` also contains the project state rules.

They point to this document for the session-end regeneration checkpoint.

---

**Document Version:** 1.3

**Status:** Active Session Rules
