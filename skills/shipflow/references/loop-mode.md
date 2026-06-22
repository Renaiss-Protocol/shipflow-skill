# Loop mode — autonomous issue → PR reconciler

Enter this mode **only** when the user explicitly asks to loop through and fix
issues (e.g. "loop through the issues and fix them", "auto-fix issues"). In this
mode the skill's "Do NOT auto-branch / auto-fix" guardrails are overridden —
auto-branching and fixing *is* the requested intent.

**The model is a reconciler, not a pipeline.** Each tick you first drive *every*
PR/issue you already own one step toward `merged`, and only *then* admit new work
— and only while you're under the WIP limit. State lives in GitHub + ShipFlow
(labels, claims, PR/CI/review status), not in your head, so a stopped loop just
re-reads `inbox --json` and resumes.

**You are an orchestrator; the work runs in subagents.** You (the main session)
stay thin — read compact JSON, dispatch, collect a one-paragraph structured
return. Each issue/PR is handled by a **fresh-context subagent** (the Task tool),
so context never bloats across many items and issues can't cross-contaminate. And
**every issue and every PR passes through the reviewer first** — a subagent that
pulls ShipFlow's feature map for a whole-system view before any fix ships. See the
Roles section.

## Setup — run in a worktree (once, before the cycle)

The loop **always** works in a git worktree, never in the user's live checkout.
Use a **single** worktree, reused for every iteration (not one per issue):

- Prefer the `EnterWorktree` tool with a fixed name (`shipflow-loop`); it creates
  the worktree off the default branch and switches into it. Fall back to
  `git worktree add .worktrees/shipflow-loop -b shipflow-loop/base origin/<default>`
  (ensure `.worktrees/` is gitignored) and `cd` into it.
- If already in that worktree (resuming), reuse it — don't create another.
- All branching, fixing, testing, committing, pushing happen inside this one
  worktree. At the end, surface its path + branch; clean it up only after merge.

## Policies — the three knobs (set once, then trust them)

How far the loop drives a PR without a human is configured, not hard-coded.
Read them with `renaiss-shipflow config list`; set with `config set <key> <v>`
(env vars `SHIPFLOW_*` override):

| Knob | Default | Meaning |
|---|---|---|
| `merge-policy` | `manual` | `manual` = never auto-merge (park for a human) · `auto-on-green` = merge when CI green **and** approved · `auto-timeout` = green + no objection past `stale-pr-hours` |
| `require-ci` | `true` | CI must be green before a PR is "advanced" / merged |
| `max-fix-attempts` | `3` | CI-fix tries on one PR before escalating to a human |
| `wip-limit` | `3` | max open PRs you own before you stop admitting new work |
| `stale-pr-hours` | `48` | a green, unreviewed PR older than this is `stale` → ping/escalate |
| `bug-hunt` | `true` | when the queue is empty, run a test+QA sweep and file issues for bugs found (Phase C) |
| `bug-hunt-cap` | `5` | max NEW issues the bug sweep may file per run |
| `require-review` | `true` | route every issue (intake) and PR (pre-merge) through the reviewer subagent first |

The real merge guard is the repo's **GitHub branch protection** — even `auto-on-green`
can't merge what GitHub blocks. Approval = a GitHub review approval **or** the
`shipflow-approved` label — which is exactly what the **reviewer** adds via
`renaiss-shipflow pr approve <n>`. So the reviewer's verdict *is* the merge gate.

## Roles — three subagents the orchestrator dispatches

Dispatch each via the **Task tool**. Each gets a fresh context and returns a
compact payload; their heavy work (reading code, diffs, test output) never enters
your context.

- **orchestrator** = you, the main session. Read compact JSON (`inbox`,
  `issue next`, `features`, subagent returns), decide, dispatch, count vs `cap`.
  **Never read source files or diffs yourself** — that keeps your context flat
  across the whole run.
- **reviewer** — the mandatory gate (`require-review`, default on). Pulls
  `renaiss-shipflow features --json` (ShipFlow's feature map) for a whole-system
  view, then reviews an **issue at intake** (validate, map to features, write an
  acceptance brief) and a **PR before merge** (cross-feature impact, regressions,
  meets the brief; approves with `pr approve`). Contract + schema:
  `references/loop-reviewer.md`.
- **worker** — fixes ONE issue end-to-end (branch → fix → test → PR → evidence) in
  its own context, returns `{pr, verified, blocked}`. Also runs reconcile fixes
  (CI, review feedback, rebase). Contract: `references/loop-worker.md`.

## The cycle — each tick

### A. Reconcile in-flight work — dispatch a worker per item

Run `renaiss-shipflow inbox --json` (compact — this is all *you* read). For each PR
whose `state` needs action, **dispatch a worker subagent** (Task tool) scoped to
that one PR and collect its return. Loop A until nothing in-flight `needsAttention`:

- `ci_failing` → worker fixes the failing checks (`gh pr checks <n>`) on the branch
  and pushes. Track attempts across ticks; after `max-fix-attempts` still red →
  `renaiss-shipflow issue escalate <issue> --reason "CI red after N attempts: …"`.
- `changes_requested` / `review_comments` → worker addresses every comment
  (`references/pr-feedback.md`), pushes, replies — **then re-dispatch the reviewer**
  on the PR (the gate re-runs after any change). Ambiguous/conflicting → escalate.
- `approved_ready` → the reviewer already added `shipflow-approved` (Phase B step 4)
  → `renaiss-shipflow pr automerge <n> --json` (merges only if `merge-policy` + CI +
  approval allow; parks on `manual` — correct, not a failure).
- conflict → worker runs `renaiss-shipflow pr sync <n>` on the branch (exit 6 =
  unresolved → escalate).
- `stale` → nudge once / escalate if blocked. `ci_pending` / `awaiting_review` →
  **parked, no action** (re-checked next tick; don't busy-wait).

A PR becomes `approved_ready` **only** because the reviewer approved it — never
hand-add `shipflow-approved`. For each in-progress issue with a `newComment`, a
worker reads + acts.

### B. Admit new work — under the WIP limit, every issue reviewed first

If (open PRs you own) ≥ `wip-limit`, **skip B** (drain A instead). Otherwise, while
PRs-opened-this-run < `cap`, admit ONE issue — each step a fresh subagent:

1. **Pick** — `renaiss-shipflow issue next --json` (claims next open/unclaimed,
   priority → severity → newest; optional `--label bug`; skips `needs-human`/claimed).
   **Exit 4** / `issue: null` → nothing to admit.
   - **Dependency check:** blocked-by / depends-on an unmerged `#X` →
     `renaiss-shipflow issue escalate <n> --reason "blocked by #X"` and pick the next.
2. **Reviewer — intake** (mandatory; `require-review`). Dispatch the reviewer
   subagent with the issue + triage. It pulls `renaiss-shipflow features --json`,
   validates the issue, maps it to the features it touches, and returns an
   **acceptance brief** (what "done" means + which features to regression-check).
   Reviewer rejects (invalid / duplicate / needs a human) → `issue escalate` and
   pick the next. See `references/loop-reviewer.md`.
3. **Worker — fix** Dispatch the worker subagent with the issue + triage + brief.
   In the loop worktree it: branches (`fix/issue-<n>-<slug>` off `origin/<default>`),
   fixes, runs project tests **and** an E2E browser pass with before/after
   screenshots (`references/browser-testing.md`), opens the PR with `renaiss-shipflow
   pr create --json` (which **pulls the full issue + triage into the PR body**), and
   attaches evidence (`issue evidence <n> --pr <pr> --file …`). Returns
   `{pr, verified, blocked}`. Unverified/blocked → `issue escalate`, no PR.
4. **Reviewer — PR review** (mandatory). Dispatch the reviewer on the new PR with
   the brief. It pulls `features --json` + the diff and does a **whole-system
   review** (cross-feature impact, regressions in co-located features, meets the
   brief), posts the review on the PR, and verdicts:
   - **approve** → `renaiss-shipflow pr approve <pr> --comment "<summary>"` (adds
     `shipflow-approved`). The PR is now `approved_ready` for A's automerge.
   - **request changes** → it lists what's wrong; re-dispatch a worker to fix, then
     re-review. Never approve until it passes.

Do **not** `issue done` here — the claim stays until the PR merges (A's automerge
releases it), keeping the issue out of `issue next` while its PR is in flight.

### C. Bug sweep — when there's nothing left to fix, hunt for new bugs

When B's `issue next` returns exit 4 / `issue: null` **and** A is clean (no PR
needs action), don't stop yet. If `bug-hunt` is on (`config get bug-hunt`, default
**true**), turn the idle time into QA that *refills* the queue:

1. **Loop the tests** (dispatch a QA subagent so its output stays out of your
   context) — run `renaiss-shipflow test` and `renaiss-shipflow regression --json`,
   then a real-browser QA sweep of the main flows (`references/browser-testing.md`:
   drive the key paths, watch for console errors, broken UI, regressions); use
   `renaiss-shipflow features --json` to prioritise `high` `test_priority` features.
   Capture screenshots of anything broken.
2. **File genuine bugs as issues** — for each bug you can **actually reproduce**,
   and that isn't already an open issue (dedupe via `renaiss-shipflow issues list
   --json` — match by title/area; skip anything labelled `auto-qa` you already
   filed), file it:
   `renaiss-shipflow issue create --title "<bug>" --body "<repro + expected vs
   actual>" --label bug --label auto-qa --json`. Attach evidence with
   `issue evidence <n> --file <shot>`. **Only file what you reproduced** — no
   speculative or duplicate issues.
3. **Feed the loop**: if the sweep filed ≥1 new issue → **go back to A** (the loop
   now fixes the bugs it just found). If it found **nothing new** (clean, or only
   dupes) → *that's* the real stop.

Bound it: file at most `bug-hunt-cap` new issues per run (default 5); the PR `cap`
still applies to fixes. Turn it off with `config set bug-hunt false` (or
`SHIPFLOW_BUG_HUNT=false`) — then an empty queue just stops.

### D. Repeat / stop

Loop A→B→C. The run ends only when PRs-opened-this-run has hit `cap`, **or** the
queue is empty AND the bug sweep (C) surfaced nothing new (or `bug-hunt` is off).
`cap` precedence: a `cap=N` token the user passed (`cap=all` drains the queue),
else `SHIPFLOW_LOOP_CAP`, else **5**.

## Reconcile playbook (inbox `state` → action)

| `state` | What it means | Action |
|---|---|---|
| `ci_failing` | a check is red | fix on branch, push; escalate after `max-fix-attempts` |
| `changes_requested` | reviewer wants changes | pr-feedback → fix → push → reply |
| `review_comments` | unaddressed comments | pr-feedback (may already be handled) → reply |
| `ci_pending` | checks running | park — re-check next tick |
| `approved_ready` | approved + CI green | `pr automerge` (parks on `manual`) |
| `stale` | green, unreviewed, old | nudge the PR; escalate if blocked on a human |
| `awaiting_review` | green, no feedback yet | park |

## Guardrails

- **The reviewer gate is mandatory** (`require-review`): no worker starts an issue
  without an intake brief, and no PR is `approved_ready`/merged without the reviewer
  posting a review and running `pr approve`. The reviewer always pulls
  `features --json` first — it reviews against the whole system, not just the diff.
- **Orchestrator context discipline:** dispatch, don't do. You read only compact
  JSON and one-line subagent returns — never open source files, diffs, or test logs
  in the main session. That's what lets the loop run `cap=all` without context bloat.
- **`pr automerge` is the only merge path the loop uses** — it self-gates on
  `merge-policy`. With the default `manual` it never merges; approved PRs pile up
  cleanly for a human. **Never** call bare `pr merge` or cut a `release` without
  explicit human confirmation.
- **Escalate, don't spin.** A single hard/blocked/unverifiable item →
  `issue escalate` (labels `needs-human`, keeps the claim, comments why) and move
  on. It never ends the run; you never pause mid-run to ask for direction.
- Reconcile (A) acts only on **your own** PRs and claimed issues. Don't touch
  others' PRs/issues unless asked.
- Because blocked/escalated issues keep their claim and carry `needs-human`,
  `issue next` advances down the priority list. When B's pick returns null **and**
  A is clean, the bug sweep (C) runs; the run ends only once C also comes up empty.
- **Bug sweep files real bugs only.** Phase C may only file an issue for a bug it
  **reproduced**, never a duplicate of an open issue, always labelled `auto-qa`,
  and at most `bug-hunt-cap` per run. It never files speculative/style nitpicks.
- **At the cap or an empty queue:** summarize — PRs opened, merged (if policy
  allowed), parked-awaiting-review, and escalated (with reasons) — then ask
  whether to continue beyond the cap, raise the merge policy, or merge anything by
  hand. Releasing escalated claims and any `pr merge`/`release` still need explicit
  confirmation.
