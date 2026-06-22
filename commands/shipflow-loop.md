---
description: Run the ShipFlow autonomous issue→PR reconciler (reconcile in-flight → admit new work → repeat)
---

Enter ShipFlow **Loop mode**: a reconciler that drives every issue/PR you own
toward `merged`. The usual "don't auto-branch / auto-fix" guardrails are lifted.
Full details: `references/loop-mode.md`. Honour the policy knobs (`renaiss-shipflow
config list`): `merge-policy` (default `manual`), `require-ci`, `max-fix-attempts`,
`wip-limit`, `stale-pr-hours`, `require-review`.

**You are the orchestrator.** Stay thin — read only compact JSON, and **dispatch
each issue/PR to a fresh subagent** (Task tool) so context never bloats across
items. Two roles: a **worker** fixes one item (`references/loop-worker.md`); the
**reviewer** is a mandatory gate that pulls `renaiss-shipflow features --json` (the
feature map) and reviews **every issue at intake and every PR before merge**
(`references/loop-reviewer.md`).

**Arguments** (`$ARGUMENTS`): a `cap=N` token = how many PRs to open before pausing
(`cap=all` drains the queue); anything else is an `issue next` filter (e.g.
`--label bug`). No `cap=` → `$SHIPFLOW_LOOP_CAP`, else **5**.

**Setup — one reusable worktree** (never the live checkout): prefer the
`EnterWorktree` tool named `shipflow-loop`, else `git worktree add
.worktrees/shipflow-loop -b shipflow-loop/base origin/<default>` and `cd` in. Reuse
if it exists; all work happens inside it.

Each tick:

**A. Reconcile in-flight first** — `renaiss-shipflow inbox --json` classifies each
open PR into a `state`. Act, then re-run A until nothing `needsAttention`:
- `ci_failing` → fix on its branch, push; after `max-fix-attempts` still red →
  `renaiss-shipflow issue escalate <issue> --reason "…"`.
- `changes_requested` / `review_comments` → `references/pr-feedback.md` (fix every
  general + inline comment, push, **reply on the PR**; note the issue if scope shifts).
- `approved_ready` → `renaiss-shipflow pr automerge <n> --json` (merges only if
  `merge-policy` + CI + approval allow; exits 5 and parks otherwise — on `manual`
  it always parks, which is correct).
- conflict reported → `renaiss-shipflow pr sync <n>` on its branch (rebase); exit 6
  (unresolved) → escalate.
- `stale` → nudge once / escalate if blocked. `ci_pending` / `awaiting_review` →
  park, no action.
- in-progress issue with a `newComment` → read (`gh issue view <n> --comments`) + act.

**B. Admit new work only under the WIP limit** — if (open PRs you own) ≥
`wip-limit`, skip B. Else while PRs-this-run < `cap`, admit ONE issue (each step a
subagent):
1. **Pick** — `renaiss-shipflow issue next --json` (priority→severity→newest; skips
   `needs-human`/claimed). Exit 4 / `issue: null` → nothing to admit. Dependency:
   blocked-by an unmerged `#X` → `issue escalate` + next.
2. **Reviewer — intake** (mandatory): dispatch the reviewer; it pulls `features
   --json`, validates + maps the issue to features, returns an acceptance brief.
   Reject (invalid/dup/needs-human) → `issue escalate` + next.
3. **Worker — fix**: dispatch the worker with issue + triage + brief → branch, fix,
   tests + **E2E browser** with before/after screenshots, `pr create --json` (pulls
   the full issue into the PR body), `issue evidence <n> --pr <pr> --file …`. Returns
   `{pr, verified, blocked}`. Unverified/blocked → `issue escalate`, no PR.
4. **Reviewer — PR review** (mandatory): dispatch the reviewer on the new PR; it
   pulls `features --json` + the diff for a whole-system review, posts it, then
   **approve** → `renaiss-shipflow pr approve <pr> --comment "…"`, or **request
   changes** → re-dispatch a worker, re-review. Do **not** `issue done` — the claim
   stays until the PR merges.

**C. Bug sweep — when the queue is empty** (B's `issue next` exits 4 **and** A is
clean): if `bug-hunt` is on (default), run `renaiss-shipflow test` + `regression
--json` + a real-browser QA sweep (`references/browser-testing.md`). For each bug
you **reproduce** that isn't already an open issue (dedupe via `issues list
--json`), file it: `renaiss-shipflow issue create --title "…" --body "<repro>"
--label bug --label auto-qa --json` (+ attach evidence). Filed ≥1 new issue → back
to **A**; nothing new → real stop. Cap: `bug-hunt-cap` (default 5); reproduced bugs
only, never duplicates.

**D. Repeat** A→B→C until PRs-this-run hits `cap`, **or** the queue is empty and the
bug sweep found nothing new (or `bug-hunt` is off).

**Guardrails:** the reviewer gate is mandatory — no PR is `approved_ready`/merged
without the reviewer's `pr approve`. Orchestrator stays thin: dispatch subagents,
never read source/diffs/logs yourself. `pr automerge` self-gates on `merge-policy` —
it's the only merge path; **never** bare `pr merge` or `release` without explicit
confirmation. Escalate, don't spin or pause mid-run. Act only on your own PRs/issues.
At the cap or empty queue: summarize (opened / merged / parked / escalated with
reasons) and ask whether to continue, raise the policy, or merge by hand.
