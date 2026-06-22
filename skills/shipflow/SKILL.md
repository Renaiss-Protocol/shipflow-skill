---
name: shipflow
description: Drive ShipFlow from Claude Code via the `renaiss-shipflow` CLI, which signals ShipFlow (Discord, the dashboard, teammates) and uses gh for GitHub writes. Use when the user mentions ShipFlow, or wants to check project status / what to work on, list or file issues, pick up / claim / release an issue, attach test evidence (screenshot or video) to an issue, autonomously loop through and fix issues, open or merge a PR, run tests or regression, cut a release, or sign in. Also use proactively when the user starts feature/change work that has no issue (to relate it to an open issue or open one).
---

# ShipFlow

## Preamble (run first)

Self-update check + ensure the bundled CLI is runnable (cached; ~no overhead):

```bash
PLUGIN_DIR=$(ls -d ~/.claude/plugins/cache/renaissshipflow/shipflow/*/ 2>/dev/null | sort -V | tail -1)
# The CLI ships inside the plugin — link it onto PATH (next to node, which is
# already on PATH) so no separate `npm i -g` is needed. Skips if a global
# renaiss-shipflow already exists.
if [ -n "$PLUGIN_DIR" ] && ! command -v renaiss-shipflow >/dev/null 2>&1; then
  _ND=$(dirname "$(command -v node 2>/dev/null)" 2>/dev/null)
  [ -n "$_ND" ] && ln -sf "$PLUGIN_DIR/bin/renaiss-shipflow" "$_ND/renaiss-shipflow" 2>/dev/null || true
fi
[ -n "$PLUGIN_DIR" ] && "$PLUGIN_DIR/bin/shipflow-update-check" 2>/dev/null || true
```

- If the check prints `UPGRADE_AVAILABLE <old> <new>` and `SHIPFLOW_AUTO_UPDATE`
  is not `false`: follow `references/auto-update.md` to update now, then continue
  with the user's request.
- Otherwise (no output): proceed normally.

ShipFlow is a human-in-the-loop communication layer. Each command's value is the
side-effect signaled to ShipFlow — and through it to Discord, the dashboard, and
teammates — not the local action itself. Run commands via the `renaiss-shipflow`
CLI (bundled with this plugin — no separate install required).

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
| "I'm building X" / feature work with no issue / before a PR with no `Fixes #N` | Detect a related open issue — read `references/feature-issue-detection.md` |
| "auto-create issues" / "enable auto issue" | `renaiss-shipflow config set auto-issue true` |
| "let me work on issue 42" / "pick up #42" | `renaiss-shipflow issue work 42 --json` |
| "pick the next issue" / "what should I work on" | `renaiss-shipflow issue next --json` |
| "what needs follow-up" / "any PR comments" / "check my open PRs" | `renaiss-shipflow inbox --json` (classifies PRs by state) |
| "loop through issues and fix them" / "auto-fix issues" / `/shipflow-loop` | Loop mode — read `references/loop-mode.md` |
| "this issue needs a human" / "block / escalate #42" | `renaiss-shipflow issue escalate 42 --reason "..."` |
| "I'm done with #42" / "release issue 42" | `renaiss-shipflow issue done 42` |
| "attach a screenshot to #42" / "post test evidence" | `renaiss-shipflow issue evidence 42 --pr <pr> --file shot.png --caption "..."` |
| "open a PR" / "send for review" | `renaiss-shipflow pr create --json` (after committing) |
| "is PR 87 mergeable" / "can this auto-merge" | `renaiss-shipflow pr ready 87 --json` |
| "auto-merge if ready" (loop) | `renaiss-shipflow pr automerge 87 --json` (self-gates on `merge-policy`) |
| "rebase PR 87 onto its base" / "fix the conflict" | `renaiss-shipflow pr sync 87` (on the PR's branch) |
| "merge PR 87" (explicit, human-confirmed) | `renaiss-shipflow pr merge 87` |
| "set the loop's merge/CI/WIP policy" | `renaiss-shipflow config set merge-policy auto-on-green` (see `config list`) |
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
`references/loop-mode.md` and follow it: a **reconciler** that each tick (A) drives
every PR/issue you own toward `merged` — fixing CI, addressing review, gated
`pr automerge`, escalating dead-ends — then (B) admits new work under the
`wip-limit`. When the queue empties, (C) a **bug sweep** runs the tests + a QA
browser pass and files issues for reproduced bugs (`bug-hunt`, default on), so the
loop is self-sustaining. Behaviour is governed by the policy knobs in `config list`
(`merge-policy` defaults to `manual`, so PRs park for a human).

## First run

Any command exits non-zero with "Not signed in." until `renaiss-shipflow login`
has run on the machine. `login` checks `gh auth status` (running `gh auth login`
interactively if needed), reads `gh auth token`, exchanges it for a ShipFlow JWT,
and caches it in `~/.config/renaissshipflow/credentials.json`.
