# Loop mode — autonomous issue-fixing

Enter this mode **only** when the user explicitly asks to loop through and fix
issues (e.g. "loop through the issues and fix them", "auto-fix issues"). In this
mode the skill's "Do NOT auto-branch / auto-fix" guardrails are overridden —
auto-branching and fixing *is* the requested intent.

Run this cycle, one item per iteration:

1. **Reconcile open work first** — before picking anything new, run
   `renaiss-shipflow inbox --json` and clear it:
   - For each PR with `needsAttention` (`changes_requested`, `ci_failing`, or
     `review_comments`): read it (`gh pr view <n> --comments`, `gh pr checks <n>`),
     check out its branch, address the feedback / fix CI, push, and reply on the
     PR summarizing what you changed.
   - For each in-progress issue with a `newComment`: read it
     (`gh issue view <n> --comments`) and act — answer the question, adjust the
     fix, or note it.
   - Only when the inbox is clear (nothing needs attention) move on to step 2.
2. **Pick** — `renaiss-shipflow issue next --json` (claims the next open,
   unclaimed issue, ordered priority → severity → newest). Optional filters:
   `--label bug` / `--assignee <me>`.
   - **Exit code 4** / `issue: null` → no actionable issues remain. **Stop the
     loop** and summarize what you shipped.
   - Use `triage.relatedFiles` / `relatedCommits` to orient before reading code.
3. **Branch** — `git checkout -b fix/issue-<n>-<short-slug>` off the default
   branch. One branch per issue; never pile fixes onto one branch.
4. **Fix** — investigate and make the change. If it turns out too risky,
   ambiguous, or you can't reproduce it: `renaiss-shipflow issue done <n>
   --reason "blocked: <why>"` to release the claim, then continue (no PR).
5. **Test** — run the project's tests. For UI/behavior changes, drive the app in
   the browser (the `/browse` headed browser) and capture a **screenshot or short
   video** of the fix working. Only proceed if it actually verifies.
6. **Evidence** — `renaiss-shipflow issue evidence <n> --file <shot-or-video>
   --caption "Verified: <what you tested>"`. Lands as a GitHub issue comment + the
   reporter's chat thread.
7. **PR** — commit, push the branch, then `renaiss-shipflow pr create --json`
   (body `Fixes #<n>`).
8. **Release** — `renaiss-shipflow issue done <n> --reason "PR #<pr> opened"` so
   the claim frees up and the loop can advance.
9. **Repeat** from step 1 — the next iteration's reconcile will pick up any review
   that lands on the PR you just opened.

## Guardrails

- **Never** `pr merge` or cut a `release` inside the loop — those need explicit
  human confirmation each time.
- Reconcile (step 1) handles your own PRs and claimed issues. Don't act on PRs or
  issues authored by other people without being asked.
- Cap iterations: default to a reasonable batch (e.g. 5) or until step 2 exits 4,
  whichever comes first. Ask the user before going beyond.
- Each iteration is independent: a failed/blocked issue releases its claim and the
  loop moves on — it never blocks the whole run.
- If tests or the browser check fail and you can't fix them, do not open a PR for
  that issue; release it as blocked and continue.
