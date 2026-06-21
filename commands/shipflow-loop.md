---
description: Run the ShipFlow autonomous issue→PR reconciler (reconcile in-flight → admit new work → repeat)
---

Enter ShipFlow **Loop mode**: a reconciler that drives every issue/PR you own
toward `merged`. The usual "don't auto-branch / auto-fix" guardrails are lifted.
Full details: `references/loop-mode.md`. Honour the policy knobs (`renaiss-shipflow
config list`): `merge-policy` (default `manual`), `require-ci`, `max-fix-attempts`,
`wip-limit`, `stale-pr-hours`.

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
`wip-limit`, skip B. Else while PRs-this-run < `cap`:
1. **Pick** — `renaiss-shipflow issue next --json` (priority→severity→newest; skips
   `needs-human`/claimed). Exit 4 / `issue: null` → nothing to admit. Orient with
   `triage.relatedFiles`/`relatedCommits`.
2. **Branch** — `git fetch origin && git checkout -b fix/issue-<n>-<slug> origin/<default>`.
3. **Fix** — investigate + change. Genuinely try to verify. Truly
   risky/ambiguous/unreproducible → `renaiss-shipflow issue escalate <n> --reason "…"`
   and continue (no PR, never stop).
4. **Test** — project tests + **E2E in a real browser** for any UI/behavior change
   (`bin/shipflow-browser`, `snapshot -D` + no new console errors, before/after
   **screenshots**, Read them). Unverified → escalate, no PR.
5. **PR** — commit, push, `renaiss-shipflow pr create --json` (body `Fixes #<n>`).
6. **Evidence** — `renaiss-shipflow issue evidence <n> --pr <pr> --file <shot>
   --caption "Verified: …"` (PR comment + reporter thread). Do **not** `issue done` —
   the claim stays until the PR merges.

**C. Repeat** A→B until PRs-this-run hits `cap` **and** A is clean.

**Guardrails:** `pr automerge` self-gates on `merge-policy` — it's the only merge
path the loop uses; **never** bare `pr merge` or `release` without explicit
confirmation. Escalate, don't spin or pause mid-run. Act only on your own PRs/issues.
At the cap or empty queue: summarize (opened / merged / parked / escalated with
reasons) and ask whether to continue, raise the policy, or merge by hand.
