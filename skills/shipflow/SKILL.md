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
| "I'm done with #42" / "release issue 42" | `renaiss-shipflow issue done 42` |
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

## First run

If `renaiss-shipflow login` has never been run on this machine, any other command will exit non-zero with "Not signed in." Run `renaiss-shipflow login` first; it will:
1. Check `gh auth status`. If not signed in, run `gh auth login` interactively.
2. Read `gh auth token`.
3. Exchange it for a ShipFlow JWT.
4. Cache the JWT in `~/.config/renaissshipflow/credentials.json`.
