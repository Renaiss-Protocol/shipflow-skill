---
description: Check if your current (issue-less) feature work relates to an open issue; open one if not (respects auto-issue)
---

The user is doing feature/change work without an issue. Detect a related open
issue, and otherwise open one:

1. Summarize the work from $ARGUMENTS, the current branch, and `git diff`.
2. `renaiss-shipflow issues list --json` and semantically check whether an open
   issue already covers it.
   - If one clearly covers it → surface "#N — <title>" and offer `renaiss-shipflow issue work N` (no duplicate).
3. If none covers it → read `renaiss-shipflow config get auto-issue --json`:
   - `true` → auto-create with `renaiss-shipflow issue create --title "…" --body "…"`, report it, continue.
   - `false` → ask the user first; create only on a yes.
4. Reference the issue in the PR (`Fixes #N`).

Enable auto mode with `renaiss-shipflow config set auto-issue true`.
