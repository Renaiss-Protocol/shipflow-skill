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

The real merge guard is the repo's **GitHub branch protection** — even `auto-on-green`
can't merge what GitHub blocks. Approval = a GitHub review approval **or** a
`shipflow-approved` label (a human/dashboard can add the label).

## The cycle — each tick

### A. Reconcile in-flight work — drive every owned item toward merged

Run `renaiss-shipflow inbox --json`. It classifies each of your open PRs into a
single `state`. Act per state (see the playbook table below), then loop A again
until nothing in-flight `needsAttention`:

- `ci_failing` → check it out, fix the failing checks (`gh pr checks <n>`), push.
  **Count the attempt.** After `max-fix-attempts` with the build still red →
  `renaiss-shipflow issue escalate <issue> --reason "CI red after N attempts: <summary>"`.
- `changes_requested` / `review_comments` → follow `references/pr-feedback.md`
  (gather general + inline + review comments, fix each actionable point, push,
  **reply on the PR** summarizing what changed; note the **issue** if scope shifts).
  Ambiguous or conflicting feedback you can't resolve → escalate the issue.
- `approved_ready` → `renaiss-shipflow pr automerge <n> --json`. It merges **only**
  if `merge-policy` + CI + approval allow, else it no-ops and exits 5 (leave it
  parked). On `manual` it always parks — that's correct, not a failure.
- `stale` → a parked PR aged past `stale-pr-hours`: post one nudge on the PR; if
  it's blocked on a human decision, `issue escalate` it.
- conflict (`pr ready`/`automerge` reports a merge conflict) → on the PR's branch
  run `renaiss-shipflow pr sync <n>` (rebases onto the base). Exit 6 = conflict it
  couldn't auto-resolve → escalate.
- `ci_pending` / `awaiting_review` → **parked, no action.** A next tick will
  re-check; don't busy-wait.

For each in-progress issue with a `newComment`: read it
(`gh issue view <n> --comments`) and act — answer, adjust the fix, or escalate.

### B. Admit new work — only under the WIP limit

If (open PRs you own) ≥ `wip-limit`, **skip B this tick** (you have enough in
flight; go drain A). Otherwise, and while PRs-opened-this-run < `cap`:

1. **Pick** — `renaiss-shipflow issue next --json` (claims the next open, unclaimed
   issue, priority → severity → newest; optional `--label bug`). Skips anything
   labelled `needs-human`/claimed. **Exit 4** / `issue: null` → nothing to admit.
   Use `triage.relatedFiles` / `relatedCommits` to orient.
   - **Dependency check:** if the issue says it's blocked by / depends on another
     issue or PR (`blocked by #X`, `depends on #X`, `after #X`) that isn't merged
     yet, don't fix it out of order — `renaiss-shipflow issue escalate <n> --reason
     "blocked by #X (not yet merged)"` and pick the next one.
2. **Branch** — base on the latest default branch: `git fetch origin && git
   checkout -b fix/issue-<n>-<slug> origin/<default>`. One branch per issue.
3. **Fix** — investigate and change. Genuinely try to verify (start the dev
   server, seed a test DB); environmental friction is **not** grounds to abandon.
   Truly too risky/ambiguous/unreproducible → `renaiss-shipflow issue escalate <n>
   --reason "<why>"` (labels `needs-human`, keeps the claim so it's skipped) and
   continue. No PR; never stop the loop.
4. **Test** — project tests, then **verify end-to-end in a real browser** for any
   UI/behavior change (`references/browser-testing.md`: resolve via
   `bin/shipflow-browser`, drive the fix, `snapshot -D` + no new console errors,
   capture before/after **screenshots** and Read them). Unverified → escalate, no PR.
5. **PR** — commit, push, `renaiss-shipflow pr create --json` (body `Fixes #<n>`).
   Note the PR number.
6. **Evidence** — attach the step-4 screenshots **to the PR**:
   `renaiss-shipflow issue evidence <n> --pr <pr> --file <shot> --caption "Verified:
   <what>"` (PR comment + reporter's chat thread; issue stays linked via `Fixes`).

Do **not** `issue done` here — the PR isn't merged. The claim stays until the PR
merges (reconcile's `automerge` releases it, or a human merge does). This keeps
the issue out of `issue next` while its PR is in flight.

### C. Repeat

Loop A→B until **both**: PRs-opened-this-run has hit `cap` **and** nothing
in-flight needs action (A is clean). `cap` precedence: a `cap=N` token the user
passed (`cap=all` drains the queue), else `SHIPFLOW_LOOP_CAP`, else **5**.

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
  A is clean, the run is done.
- **At the cap or an empty queue:** summarize — PRs opened, merged (if policy
  allowed), parked-awaiting-review, and escalated (with reasons) — then ask
  whether to continue beyond the cap, raise the merge policy, or merge anything by
  hand. Releasing escalated claims and any `pr merge`/`release` still need explicit
  confirmation.
