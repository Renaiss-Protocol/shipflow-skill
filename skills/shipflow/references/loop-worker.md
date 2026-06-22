# Loop worker subagent

The orchestrator dispatches one **worker** per work item via the Task tool. The
worker runs in its **own context** and returns a compact payload — its code
reading, edits, and test output never reach the orchestrator. Run inside the loop
worktree (sequential) or a dedicated worktree (parallel mode).

## Input the orchestrator passes
- `issue` number + the `triage` payload (relatedFiles / relatedCommits / features)
- the reviewer's **acceptance brief** (what "done" means + features to regression-check)
- repo, default branch, and the active policies (so it knows the test/CI bar)

## What a fix worker does (one issue, end-to-end)
1. **Branch** — `git fetch origin && git checkout -b fix/issue-<n>-<slug> origin/<default>`.
2. **Fix** — investigate (start with the brief + `triage.relatedFiles`), make the
   change. Genuinely try to verify — start the dev server, seed a test DB;
   environmental friction is not grounds to abandon.
3. **Test** — run the project's tests, then **verify end-to-end in a real browser**
   for any UI/behavior change (`references/browser-testing.md`: `bin/shipflow-browser`,
   drive the fix, `snapshot -D` + no new console errors, capture before/after
   **screenshots** and Read them). Pure backend/library changes verify on tests alone.
4. **PR** — commit, push, `renaiss-shipflow pr create --json` (body `Fixes #<n>`).
   `pr create` references the issue via `Closes #N` (a link, not a copy of the issue).
5. **Evidence** — `renaiss-shipflow issue evidence <n> --pr <pr> --file <shot>
   --caption "Verified: <what>"`.

If it's truly too risky / ambiguous / unreproducible / unverifiable, do **not**
open a PR — report `blocked` with the reason (the orchestrator will `issue escalate`).

## What a reconcile worker does (one PR)
Scoped to a single PR + the reason(s) from `inbox`: fix failing CI, or address
review comments (`references/pr-feedback.md`) and reply, or `renaiss-shipflow pr
sync <n>` to rebase a moved base. Push when done.

## Return (compact — this is all the orchestrator sees)
```json
{ "issue": 42, "pr": 87, "verified": true, "blocked": false,
  "summary": "one line: what changed + how it was verified",
  "reason": "" }
```
Set `blocked: true` + `reason` when no PR was opened. Keep `summary` to one line —
do not paste diffs or logs back to the orchestrator.
