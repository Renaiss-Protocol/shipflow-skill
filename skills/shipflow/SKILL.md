---
name: shipflow
description: Drive ShipFlow from Claude Code via the `renaiss-shipflow` CLI, which signals ShipFlow (Discord, the dashboard, teammates) and uses gh for GitHub writes. Use when the user mentions ShipFlow, or wants to check project status / what to work on, list or file issues, pick up / claim / release an issue, attach test evidence (screenshot or video) to an issue, autonomously loop through and fix issues, open or merge a PR, run tests or regression, cut a release, or sign in.
---

# ShipFlow

ShipFlow is a human-in-the-loop communication layer. Each command's value is the
side-effect signaled to ShipFlow — and through it to Discord, the dashboard, and
teammates — not the local action itself. Run commands via the `renaiss-shipflow`
CLI.

Each action below also has a dedicated slash command, `/shipflow-<action>` (e.g.
`/shipflow-loop`, `/shipflow-status`, `/shipflow-pr`). Prefer the matching
command when the user types one; use this skill to route natural-language
requests to the same CLI calls.

## Intent → command

| If the user says... | Run |
|---|---|
| "what's my status" / "what's on my plate" | `renaiss-shipflow status --json` |
| "list issues" / "show open issues" | `renaiss-shipflow issues list --json` |
| "open an issue about X" / "file an issue" | `renaiss-shipflow issue create --title "X" --body "..."` |
| "let me work on issue 42" / "pick up #42" | `renaiss-shipflow issue work 42 --json` |
| "pick the next issue" / "what should I work on" | `renaiss-shipflow issue next --json` |
| "loop through issues and fix them" / "auto-fix issues" / `/shipflow-loop` | Loop mode — read `references/loop-mode.md` |
| "I'm done with #42" / "release issue 42" | `renaiss-shipflow issue done 42` |
| "attach a screenshot to #42" / "post test evidence" | `renaiss-shipflow issue evidence 42 --file shot.png --caption "..."` |
| "open a PR" / "send for review" | `renaiss-shipflow pr create --json` (after committing) |
| "merge PR 87" | `renaiss-shipflow pr merge 87` |
| "run tests" | `renaiss-shipflow test` |
| "run regression" / "trigger ShipFlow tests" | `renaiss-shipflow regression --json` |
| "cut a release" / "release vX.Y.Z" | `renaiss-shipflow release --tag vX.Y.Z --json` |
| "I need to sign in" | `renaiss-shipflow login` |

## Output handling

- Pass `--json` whenever the command supports it, and parse the JSON. Never
  regex-scrape prose.
- Show the `triage` payload from `issue work` to the user verbatim — it's the
  unique value of ShipFlow over plain `gh`.
- A failed signal POST (warning on stderr) still means the GitHub-side action
  succeeded. Mention the warning; do not retry.

## Guardrails

- Do NOT auto-create a branch on `issue work` — the user (or a skill they invoke)
  decides branching.
- Do NOT auto-write plan files, commit messages, or other local files from
  `issue work` output. Show the context and ask how to proceed.
- Do NOT run `renaiss-shipflow release` or `renaiss-shipflow pr merge` without
  explicit user confirmation — both trigger team-visible downstream workflows.

These guardrails are deliberately overridden inside Loop mode (see below), which
the user opts into explicitly.

## Loop mode

When the user explicitly asks to loop through and fix issues autonomously, read
`references/loop-mode.md` and follow that cycle (pick → branch → fix → test →
evidence → PR → release → repeat).

## First run

Any command exits non-zero with "Not signed in." until `renaiss-shipflow login`
has run on the machine. `login` checks `gh auth status` (running `gh auth login`
interactively if needed), reads `gh auth token`, exchanges it for a ShipFlow JWT,
and caches it in `~/.config/renaissshipflow/credentials.json`.
