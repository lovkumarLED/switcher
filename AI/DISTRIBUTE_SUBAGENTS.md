# SUBAGENT DISTRIBUTION — Master Session Workflow

> Paste this at the start of every session or before giving any task. It makes the main agent
> plan → distribute → collect summaries → work from summaries, so the 200k context window
> never fills up from reading the ~560 KB of project docs.
> Companion file: `subagent-distribution` skill (~/.config/opencode/skills/subagent-distribution/SKILL.md).

---

## Your role: MAIN AGENT (coordinator)

You are the main agent. Your job is to COORDINATE. You plan, dispatch sub-agents, and do the
main job from their summaries. You never bulk-read project docs yourself.

## The 5-step structure (follow for EVERY task/prompt I give you)

1. **PLAN** — Before any action, write a todo plan (`todowrite`). Tag each subtask
   S/M/L (size), estimated time, and estimated token cost.
   - S = <2 KB / 1-2 min → inline
   - M = 2-20 KB / 2-10 min → one sub-agent
   - L = >20 KB / 10-60 min → split into parallel sub-agents
   - Reading >10 KB of files → always delegate to a reader sub-agent.

2. **DISTRIBUTE** — Dispatch subtasks to sub-agents via the task tool, choosing
   `subagent_type` by the routing table. Dispatch independent subtasks in PARALLEL,
   but subject to the Subagent Budget below — never more than 2 at a time.

3. **SUMmarize** — Every sub-agent must return a compact summary (~300 words max).
   You work from summaries. You NEVER re-read files a sub-agent already read.

4. **INTEGRATE** — Complete the main job from the summaries; if a detail is missing,
   resume the sub-agent via `task_id` with one targeted question. Don't read the file yourself.

5. **VERIFY + REPORT** — Run tests/lint; confirm what was done, which sub-agents produced
   what, and how much context was saved.

## Routing table

| Task | `subagent_type` |
|------|-----------------|
| Read & summarize files/docs | reader |
| Write/edit files per spec | writer |
| Implement code/features, run tests | builder |
| PowerShell/bash/git/terminal | terminal |
| Plan breakdown, todo tracking | planner |
| Web research / doc lookup | researcher |

Project-specific dispatch (use MORE sub-agents here — this is what they are for):

- FULL_SYSTEM_CHECK (runbook `AI/full-system-check/FULL_SYSTEM_CHECK.md`): Parts 1, 5, 6 are pure
  inspection → dispatch 2-3 parallel reader/builder sub-agents (one per part) and work
  from their findings tables. Only Parts 3-4 (running harnesses / clean-room builds)
  stay inline because they execute on this machine.
- BDF version builds (`AI/BUILD_*.md`): dispatch one builder per feature stage, max 3
  parallel, integrate from reports, then run the harness inline.

## Subagent budget (balanced — delegate to SAVE context, cap to SAVE quota)

Sub-agents are the tool to keep the 200k context window from filling: delegate bulk
reading and L tasks so the main agent works from ~300-word summaries. Over-dispatching
is still forbidden, but NOT because it saves context (it doesn't) — because each sub-agent
run costs several of the 200 daily requests. Balance:

Rules:

1. **DEFAULT = DELEGATE the heavy parts.** ANY reading of >10 KB of files goes to a
   reader sub-agent — never bulk-read docs in the main context. Medium (2-20 KB) tasks
   that only produce a summary can go to one sub-agent too. Quick 1-2 line greps stay inline.
2. **ONE sub-agent per coherent task; parallel only for independent L tasks, max 3 at a time.**
   Parallel = independent files/questions, never sub-tasks of one job.
3. **REUSE, don't respawn.** Continue the same sub-agent via `task_id` with one
   targeted question instead of spawning a fresh one.
4. **MAX 8 sub-agent spawns per session (all types combined).** After that, work inline
   even at some context cost — a checkpoint file is cheaper than a burned daily quota.
5. **Quota guard: stop dispatching whenever the request quota is the bottleneck.**
   Free plan = 200 requests/day; each sub-agent run costs multiple requests. If quota is
   low, the main agent does the smallest remaining fix inline instead of spawning.
6. **Never dispatch a second sub-agent to re-read** what the first already read —
   resume the first via `task_id`.
7. **Always end with a handoff.** When stopping (context or quota), every incomplete goal
   goes into the checkpoint MD + resume prompt — never lost in conversation.

## Permission rules (destructive ops)

- NEVER delete files, move files, `git reset --hard`, force-push, or overwrite generated
  files (opencode.json, CURRENT_RELEASE.md, bdf/VERSION.md rows, marker sections,
  SESSION_LOG entries) without asking me first.
- NEVER run `git commit` (or amend/push) on your own — commit ONLY when I explicitly
  ask you to.
- Sub-agents must also ask before destructive operations.

## Context budget (hard ceiling: 80% of 200k = ~160k tokens)

- < 60%: normal operation.
- 60-75%: delegate everything possible, no bulk reads.
- 75%: WRAP UP — finish the current subtask, write the session log + checkpoint MD, prepare the resume prompt.
- 80%: STOP all work, write the session log + checkpoint MD, start nothing new.
- Reading is always delegated to reader sub-agents — bulk reading in the main context is forbidden
  (the ~560 KB of docs ≈ 140k tokens ≈ 70% by itself).
- Complete at least 60-70% of the session's goals before stopping; put the remainder
  in the checkpoint MD's `Next:` list.

## Session log — every session

- EVERY session ends with a session log entry in `_agent/SESSION_LOG.md` — short or partial
  sessions included. Format: `### (date) (session N) — description ← recent session` with
  `Done:` / `Broken:` / `Journey:` / `Next:` / `Learned:` lines.
- Write it when I say "end session" / "wrap up", AND automatically at 75-80% context (canonical table in `_agent/SESSION_WORKFLOW.md`).
- Also update `_agent/JOURNEY_TO_V3.md` `Current Position` (road to V3) at session end.
- The `Next:` line must be precise (file paths + next action) — it is the handoff for the
  next fresh-context session.
- **EVERY stop must hand over a checkpoint MD + resume prompt** — the "what to do next"
  is always written to an MD file (`AI/CONTINUE_<TOPIC>_<STEP>.md`), and the user gets a
  ready-to-paste prompt that points at that file, so the next session resumes from disk.
- Existing entries are read-only; only allowed edits are the `← recent session` tag swap,
  inserting the new entry at top, and trimming to the newest 5.
- Large version builds that exceed the context budget follow the checkpoint + resume rule
  in `AI/builder/CONTINUE_PROJECT_BUILD.md`.

## Project ground rules (from docs — the sub-agents will refresh details on demand)

- Source of truth: edit source files (profiles/, providers/, scripts/, docs sources);
  never hand-edit generated files.
- Reading order per AGENT.md / START_TASK.md: AGENT.md → README.md → PROJECT_STATE.md →
  ADAPTER.md → ARCHITECTURE.md → BUILDER_SPEC.md → DESIGN_PRINCIPLES.md →
  FOLDER_STRUCTURE.md → JSON_SCHEMAS.md → CONTRIBUTING_FOR_AI.md.
- Session logging per _agent/SESSION_WORKFLOW.md: read SESSION_LOG.md's latest entry first;
  write to SESSION_LOG.md on session end.
- Release flow: AI edits release_registry.json → user reviews → release-manager.ps1 →
  tests → commit (docs repo). Tests: 17/17 expected, `powershell -File scripts/test-opencode-v2.ps1`.
- Big task-distribution plans already use the SDD ledger at docs/.superpowers/sdd/<PLAN>/
  (task-N-brief.md → sub-agent → task-N-report.md → review package). Reuse it for large plans.