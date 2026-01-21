# Social Features - Master Plan

**Tell the agent:** "Work on social features. Read features/MASTER.md for instructions."

---

## Agent Instructions

### CRITICAL: ONE TASK ONLY

You MUST complete exactly ONE task then STOP. Do not continue to the next task even if you have context remaining. The human will start a fresh agent for the next task to avoid context degradation.

### Workflow

1. Read the execution order below
2. Check each tasks JSON file in order
3. Find the FIRST task where `passes: false`
4. Complete ONLY that task
5. Verify it works
6. Set `passes: true` in the JSON
7. Close any running servers/processes (especially Chrome DevTools MCP)
8. **STOP IMMEDIATELY** - report completion and exit

### Rules

- **ONE task per session** - no exceptions
- Do NOT read ahead to future tasks
- Do NOT "quickly do" the next task
- Do NOT batch multiple small tasks together
- After setting `passes: true`, your job is DONE

### Validation (Chrome DevTools MCP)

In case the task requires visual validation, if Chrome DevTools MCP fails: restart it. If still failing: ask human to restart, then retry. **Never skip visual validation or use inferior alternatives if it's the best kind of validation for the task.**

### Task Comments

Add a comment to the task JSON if your implementation:
- Required changes outside the task scope
- Modified/created something a later task was supposed to handle
- Has dependencies future agents need to know

Example: Task 22 needs a modal that task 26 creates → you create a temp modal → comment so task 26 knows to replace it.

Note: Previous agents may not have left comments.

---

## Execution Order

Work through these plans sequentially. A plan is "complete" when all its tasks have `passes: true`.

| Order | Plan | Tasks File | Prereq |
|-------|------|------------|--------|
| 1 | Testing Infrastructure (foundation) | `testing-infrastructure-tasks.json` tasks 1-9 | None |
| 2 | Wall of the Day | `wall-of-the-day-tasks.json` | Testing foundation complete |
| 3 | Friends Feature | `friends-feature-tasks.json` | Wall of the Day complete |
| 4 | Testing Infrastructure (feature-specific) | `testing-infrastructure-tasks.json` tasks 10-14 | Friends complete |

---

## How to Find Next Task

```
1. Check testing-infrastructure-tasks.json tasks 1-9
   → If any has passes: false, do that task (read testing-infrastructure-plan.md)

2. Check wall-of-the-day-tasks.json
   → If any has passes: false, do that task (read wall-of-the-day-plan.md)

3. Check friends-feature-tasks.json
   → If any has passes: false, do that task (read friends-feature-plan.md)

4. Check testing-infrastructure-tasks.json tasks 10-14
   → If any has passes: false, do that task (read testing-infrastructure-plan.md)

5. If all tasks pass → ALL DONE! Report completion.
```

---

## Completion Report

After completing ONE task, output this then STOP:

```
TASK COMPLETE
- Plan: [plan name]
- Task ID: [id]
- Description: [what was done]
- Verification: [how it was verified]
- Next task: [plan + task ID for next agent]
```

**Then stop. Do not continue.**

---

## Reference Files

- [social-features-meta-plan.md](./social-features-meta-plan.md) - Shared context, privacy rules, architecture decisions
- [testing-infrastructure-plan.md](./testing-infrastructure-plan.md) - Mock data, test utilities, SocialTestPage
- [wall-of-the-day-plan.md](./wall-of-the-day-plan.md) - Wall feature implementation details
- [friends-feature-plan.md](./friends-feature-plan.md) - Friends/follow system implementation details
