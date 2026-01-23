# Main instructions

1. Read the PRD and progress file (if it doesn't exist, create it).
2. Decide which task to work on next. This should be the one YOU decide has the highest priority - not necessarily the first in the list.
3. Check any feedback loops, such as types and tests.
4. Mark the task as done in PRD.json by setting `"passes": true`.
5. Append your progress and any notes to the progress.txt file. Use this to leave a note for whomever comes after you.
6. Make a git commit of that feature.

Only do a single task, and then stop. You're done.

If, while implementing the feature, you notice that all work in the PRD is complete, output <promise>COMPLETE</promise>.

# Progress tracking

After completing each task (i.e. it passes), mark the task as passing in the PRD, then append to progress.txt (create if it doesn't exist):
- Task completed and PRD item reference
- Key decisions made and reasoning
- Files changed
- Any blockers or notes for next iteration
Keep entries concise. Sacrifice grammar for the sake of concision. This file helps future iterations skip exploration.

# Feedback loops

Before committing, run ALL feedback loops:
1. TypeScript: npm run typecheck (must pass with no errors)
2. Tests: npm run test (must pass)
3. Lint: npm run lint (must pass)
Do NOT commit if any feedback loop fails. Fix issues first.

# Step size

Keep changes small and focused:
- One logical change per commit
- If a task feels too large, break it into subtasks
- Prefer multiple small commits over one large commit
- Run feedback loops after each change, not at the end
Quality over speed. Small steps compound into big progress.

# Prioritization Guidelines

When choosing the next task, prioritize in this order:
1. Architectural decisions and core abstractions
2. Integration points between modules
3. Unknown unknowns and spike work
4. Standard features and implementation
5. Polish, cleanup, and quick wins
Fail fast on risky work. Save easy wins for later.

# Software quality

This codebase will outlive you. Every shortcut you take becomes
someone else's burden. Every hack compounds into technical debt
that slows the whole team down.

You are not just writing code. You are shaping the future of this
project. The patterns you establish will be copied. The corners
you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.