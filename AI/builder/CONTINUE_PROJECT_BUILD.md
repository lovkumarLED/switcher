# CONTINUE_PROJECT_BUILD — Build, Stop, Resume (token-safe version building)

> Rule for building BDF versions (V2.5, Claude Code Builder, KiloCode Builder, V3)
> when a single version is too large to finish inside the context budget.
> Read `AGENT.md`, `_agent/SESSION_WORKFLOW.md`, and `planning/BDF_ROAD_TO_V3.md` first.

---

# The Rule (mandatory)

When building a version of the BDF, watch the context window.

If the version **cannot be completed within 80% of the 200,000-token context window**
(≈160k tokens), the build is too big for one session. Do NOT try to force it.

Also stop when the daily request quota is near exhaustion (free plan = 200 requests/day;
each task call and each sub-agent run costs several). A checkpoint is cheaper than a
burned quota.

Instead:

1. **STOP at a clean checkpoint.** Finish the current subtask first if it is 90%+ done.
   Prefer stopping at a boundary where the work left behind is verifiable (a completed
   file, a passing test group) — never in the middle of a broken edit.
   Aim to have completed **60-70% of the session's goals before stopping**; stop work on
   the rest (not on the whole plan) and hand it off via the checkpoint file.

2. **Write a checkpoint file (MANDATORY, before EVERY stop):** `AI/CONTINUE_<TOPIC>_<STEP>.md`
   (`<TOPIC>` = what was being worked on, e.g. `FULL_SYSTEM_CHECK`, `BUILD_V2.5`) containing:
   - What was being done and the step/phase within it.
   - `Done:` — a precise list of what was completed (files created/edited, tests run).
   - `Next:` — exactly what remains, with file paths and the next concrete action.
   - `Verify:` — how the next session confirms the checkpoint state (e.g. run the test
     harness, check a file exists).
   - `Rules:` — the resume prompt (below) that points to this file.
   - Any decisions made and any unresolved questions.
   - This applies to EVERY session stop (version builds, checks, research, reviews) — an
     MD with "what was done + what is left" plus a prompt pointing to it is produced
     BEFORE stopping, never skipped.

3. **Update the tracking files:**
   - `_agent/SESSION_LOG.md` — session entry with the `Journey:` line.
   - `_agent/JOURNEY_TO_V3.md` — `Current Position` (step, status, progress).

4. **Give the user the resume prompt** (below) so the next session continues
   exactly where the build stopped. This is MANDATORY at every stop — always hand over
   a checkpoint file + a ready-to-paste prompt pointing at that MD file, never just a
   verbal summary. The prompt lives in the checkpoint MD's `Rules:`/`Resume` section,
   and you paste it into chat for the user.

5. **Repeat** — every build session ends with either a fully built + tested version
   or a checkpoint file. Continue this loop until the version is complete, then move to
   the next version on the road to V3. Never restart a version from scratch; always
   resume from the latest checkpoint file.

---

# Request Quota (200/day)

- Free plan = 200 requests/day. Each sub-agent run, edit, and tool call consumes several.
- Budget: do not spend more than ~150 requests in one session; if the day quota is
  already mostly gone, do only the highest-priority subtask, then checkpoint.
- When the quota is low, prefer the main agent doing 1-2 line fixes over sub-agent spawns.
- A session that ends with a checkpoint file + resume prompt never wastes quota: the
  next session resumes from disk, not from memory.

---

# Why

- A full context window loses all work. A checkpoint file preserves it.
- The BDF V3 journey is a long chain of versions — each one must be built, tested,
  and validated completely before the next starts.
- Checkpoint files let any agent (OpenCode, Claude Code, KiloCode) continue the same
  build without re-reading the whole project.

---

# Checkpoint File Template

Save as: `AI/CONTINUE_<TOPIC>_<STEP>.md`

```
# CONTINUE — <TOPIC> (step <STEP> of <TOTAL>)

> Resume file. Read this first, then continue exactly where the work stopped.

## Topic
<TOPIC> — <short description of what was being worked on>

## Done
- <file/action completed>
- <tests run + result>

## Next
- <next concrete action, with file path>
- <following actions>

## Verify
- <how to confirm the checkpoint is valid before continuing>

## Decisions
- <decisions made, if any>

## Questions
- <unresolved questions, or "None">

## Resume
Paste this to continue: (see template below)
```

---

# Resume Prompt Template

Paste this into the next session (fill the placeholders):

```
Read C:\Users\loveb\.config\opencode\docs\AI\CONTINUE_<TOPIC>_<STEP>.md

Follow AGENT.md and _agent/SESSION_WORKFLOW.md.
Do NOT restart or redo completed work — trust the checkpoint file.
Run the Verify step first, then continue from the Next list.
Finish <TOPIC> completely, run the test harness, and update
JOURNEY_TO_V3.md when done. If the context budget runs low again, write a new
checkpoint file and give me the new resume prompt.
```

---

# Context Budget Summary (from SESSION_WORKFLOW.md)

| Context level | Action |
|---------------|--------|
| < 60% | Normal operation. |
| 60-75% | Avoid new bulk reads. Delegate everything possible. |
| 75% | WRAP UP. Finish the current subtask, write the checkpoint file (Done + Next + Verify + resume prompt), update the tracking files, give the resume prompt. |
| 80% (≈160k) | HARD STOP. Write the checkpoint file immediately. Never start new work. |

Bulk reading is always delegated to reader sub-agents — never load the full docs into
the main context (docs ≈ 560 KB ≈ 140k tokens ≈ 70% of the window by itself).

---

# Definition of "Version Complete"

A version counts as complete only when ALL of these are true:

- Built: all planned features exist and are documented.
- Tested: all three OpenCode test harnesses pass (17/17 V2.1 + 13/13 V2.5 + 31/31 V2.7).
- Validated: a real end-to-end run confirms the builder works.
- Released: registry updated + release manager run + release docs generated.
- Tracked: CHANGELOG, ROADMAP, PROJECT_STATE, and JOURNEY_TO_V3 updated.

Only then does the journey move to the next version.

---

**Document Version:** 1.0

**Status:** Active Build Continuation Rule
