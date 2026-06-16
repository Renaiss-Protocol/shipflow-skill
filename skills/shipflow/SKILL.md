---
name: shipflow
description: Use when the user mentions ShipFlow, an issue/PR they want to work on, opening a PR, merging a PR, cutting a release, running regression tests, or asks about their project status — invokes the `renaiss-shipflow` CLI which signals ShipFlow and uses gh for GitHub writes.
---

# ShipFlow

This skill lets you talk to ShipFlow from Claude Code via the `renaiss-shipflow` CLI. ShipFlow is a human-in-the-loop communication layer: every command's value is the side-effect signaled to ShipFlow (and through it to Discord, the dashboard, and teammates), not the local action itself.

## When to invoke

Map the user's intent → CLI command:

| If the user says... | Run |
|---|---|
| "what's my status" / "what's on my plate" | `renaiss-shipflow status --json` |
| "list issues" / "show open issues" | `renaiss-shipflow issues list --json` |
| "open an issue about X" / "file an issue" | `renaiss-shipflow issue create --title "X" --body "..."` |
| "let me work on issue 42" / "pick up #42" | `renaiss-shipflow issue work 42 --json` |
| "pick the next issue" / "what should I work on" | `renaiss-shipflow issue next --json` |
| "loop through issues and fix them" / "auto-fix issues" | **Loop mode** (see below) |
| "I'm done with #42" / "release issue 42" | `renaiss-shipflow issue done 42` |
| "attach a screenshot to #42" / "post test evidence" | `renaiss-shipflow issue evidence 42 --image shot.png --caption "..."` |
| "open a PR" / "send for review" | `renaiss-shipflow pr create --json` (after committing) |
| "merge PR 87" | `renaiss-shipflow pr merge 87` |
| "run tests" | `renaiss-shipflow test` |
| "run regression" / "trigger ShipFlow tests" | `renaiss-shipflow regression --json` |
| "cut a release" / "release vX.Y.Z" | `renaiss-shipflow release --tag vX.Y.Z --json` |
| "I need to sign in" | `renaiss-shipflow login` |

## Output handling

- Always pass `--json` when the command supports it. Parse the JSON result; do NOT regex-scrape prose.
- Show ShipFlow context (`triage` payload from `issue work`) to the user verbatim. It's the unique value of using ShipFlow over plain `gh`.
- If a signal POST fails (warning printed to stderr), the GitHub-side action still succeeded. Mention the warning, don't retry.

## What NOT to do

- Do NOT auto-create a branch when the user runs `issue work`. The user (or another skill the user invokes) decides branching.
- Do NOT auto-write plan files, commit messages, or any local files based on `issue work` output. Show the context and ask the user how they want to proceed.
- Do NOT call `renaiss-shipflow release` without explicit user confirmation. Releases trigger downstream workflows visible to the whole team.
- Do NOT call `renaiss-shipflow pr merge` without explicit user confirmation.

## Loop mode (autonomous issue-fixing)

Invoke **only** when the user explicitly asks to loop/auto-fix issues (e.g. "loop
through the issues and fix them"). In this mode the "Do NOT auto-branch / auto-fix"
rules above are overridden — auto-branching and fixing *is* the requested intent.

Run this cycle, one issue per iteration:

1. **Pick** — `renaiss-shipflow issue next --json` (optionally `--label bug` or
   `--assignee <me>`). It claims the issue exclusively and returns `{issue, triage}`.
   - **Exit code 4** (or `issue: null`) → no actionable issues remain. **Stop the loop** and summarize what you shipped.
   - Use `triage.relatedFiles` / `relatedCommits` to orient before reading code.
2. **Branch** — `git checkout -b fix/issue-<n>-<short-slug>` off the default branch. One branch per issue; never pile fixes onto one branch.
3. **Fix** — investigate and make the change. If it turns out too risky, ambiguous, or you can't reproduce it: `renaiss-shipflow issue done <n> --reason "blocked: <why>"` to release the claim, then continue to the next issue (do not open a PR).
4. **Test** — run the project's tests. For UI/behavior changes, drive the app in the browser (the `/browse` headed browser) and capture a **screenshot** (or short video) of the fix working. Only proceed if it actually verifies.
5. **Evidence** — post the proof to the issue: `renaiss-shipflow issue evidence <n> --image <screenshot> --caption "Verified: <what you tested>"`. This lands as a GitHub issue comment + the reporter's chat thread.
6. **PR** — commit, push the branch, then `renaiss-shipflow pr create --json`. Reference the issue in the body (`Fixes #<n>`).
7. **Release** — `renaiss-shipflow issue done <n> --reason "PR #<pr> opened"` so the claim frees up and the loop can advance.
8. **Repeat** from step 1.

Loop guardrails:
- **Never** `pr merge` or `release` (a version release) inside the loop — those need explicit human confirmation each time.
- Cap iterations: default to a reasonable batch (e.g. 5) or until `issue next` exits 4, whichever comes first. Ask the user before going beyond.
- Each iteration is independent: a failed/blocked issue releases its claim and the loop moves on — it never blocks the whole run.
- If tests or the browser check fail and you can't fix them, do not open a PR for that issue; release it as blocked and continue.

## First run

If `renaiss-shipflow login` has never been run on this machine, any other command will exit non-zero with "Not signed in." Run `renaiss-shipflow login` first; it will:
1. Check `gh auth status`. If not signed in, run `gh auth login` interactively.
2. Read `gh auth token`.
3. Exchange it for a ShipFlow JWT.
4. Cache the JWT in `~/.config/renaissshipflow/credentials.json`.
