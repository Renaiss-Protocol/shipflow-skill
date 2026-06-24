# Loop worker subagent

The orchestrator dispatches one **worker** per work item via the Task tool. The
worker runs in its **own context** and returns a compact payload — its code
reading, edits, and test output never reach the orchestrator. Run inside the loop
worktree (sequential) or a dedicated worktree (parallel mode).

## Input the orchestrator passes
- `issue` number + the `triage` payload (relatedFiles / relatedCommits / features)
- the reviewer's **acceptance brief** (what "done" means + the feature(s) it touches
  + features to regression-check)
- repo, default branch, and the active policies (so it knows the test/CI bar)

You also pull ShipFlow's **feature map** yourself (below) — that keeps the heavy
data in your context, not the orchestrator's.

## What a fix worker does (one issue, end-to-end)
1. **Branch** — `git fetch origin && git checkout -b fix/issue-<n>-<slug> origin/<default>`.
2. **Map, then fix** — first pull the **feature map** for context:
   `renaiss-shipflow features --json` (or `--category <area>` to scope to the
   feature(s) the brief named). It gives each feature's **file paths**, **test
   priority**, and the **neighbouring** features that share those paths. Stay
   inside your feature's paths; if a change must touch a neighbour's, flag it for
   the reviewer. Then investigate (brief + `triage.relatedFiles`). The worktree has
   the **full git history** — use it: `git log -p -- <file>`, `git blame <file>`,
   and `triage.relatedCommits` to see *why* code is the way it is and what changed
   recently (essential for regressions / "it worked before" — `git log --since` /
   bisect the suspect range). Then make the change. Genuinely try to verify — start
   the dev server, seed a test DB; environmental friction is not grounds to abandon.
3. **Test** — run the project's tests, then **verify end-to-end in a real browser**
   for any UI/behavior change (`references/browser-testing.md`: `bin/shipflow-browser --ensure`,
   **scope the pass from the diff + adjacent pages**, drive the fix, `snapshot -D` +
   no new console errors, capture before/after **screenshots** and Read them, and
   **score** the affected + neighbour pages — `references/qa-report.md`, a dropped
   neighbour score means you regressed it). Pure backend/library changes verify on
   tests alone.
4. **Regression test** — after the fix verifies, **add a test that locks it in**.
   Trace the bug's codepath (what input/state triggered it, which branch broke),
   then write ONE test matching the project's existing style (read 2–3 nearby test
   files first — naming, imports, assertion style). Assert the *correct behavior*,
   not "it renders". Run just that file; commit it with the fix. Skip only for
   pure-CSS changes or when the project genuinely has no test framework (note it in
   the return). An autonomous fix with no regression test silently regresses later.
5. **PR** — commit, push, `renaiss-shipflow pr create --json` (body `Fixes #<n>`).
   `pr create` references the issue via `Closes #N` (a link, not a copy of the issue).
6. **Evidence** — `renaiss-shipflow issue evidence <n> --pr <pr> --file <shot>
   --caption "Verified: <what> · health <before>→<after> (Δ<+/-N>)"`.

If it's truly too risky / ambiguous / unreproducible / unverifiable, do **not**
open a PR — report `blocked` with the reason (the orchestrator will `issue escalate`).

## What a reconcile worker does (one PR)
Scoped to a single PR + the reason(s) from `inbox`: fix failing CI, or address
review comments (`references/pr-feedback.md`) and reply, or `renaiss-shipflow pr
sync <n>` to rebase a moved base. Pull `features --json` when a fix risks touching
more than the PR's own feature (so you don't regress a neighbour). Push when done.

## Before you return — self-verify
Your completion contract. Don't return until each holds (or you've genuinely hit a
wall) — this, not a stop-hook, is what makes the result trustworthy:
- [ ] Project tests pass **and** the E2E browser check genuinely verified the fix
      (screenshots Read) — for UI/behaviour changes.
- [ ] A **regression test** for this bug is written, passing, and committed (or you
      noted why it was skipped: pure-CSS / no test framework).
- [ ] The change stayed inside the feature's paths (or you flagged a neighbour touch),
      and **no neighbour page's health score dropped**.
- [ ] PR opened with `Fixes #<n>` and evidence (with health delta) attached to the PR.
- [ ] You only set `blocked: true` after honestly trying to reproduce, start the dev
      server, seed a test DB, and read git history — never on first friction.

A `verified: true` you can't defend is worse than an honest `blocked` — the reviewer
gate (and a re-dispatch) will catch a bluff anyway.

## Return (compact — this is all the orchestrator sees)
```json
{ "issue": 42, "pr": 87, "verified": true, "blocked": false,
  "regressionTest": "tests/foo.regression.test.ts" ,
  "healthDelta": "+4",
  "summary": "one line: what changed + how it was verified",
  "reason": "" }
```
Set `blocked: true` + `reason` when no PR was opened. `regressionTest` is the path
(or `"skipped: <why>"`); `healthDelta` is the score change (or `"n/a"` for backend).
Keep `summary` to one line — do not paste diffs or logs back to the orchestrator.
