# Loop mode — autonomous issue-fixing

Enter this mode **only** when the user explicitly asks to loop through and fix
issues (e.g. "loop through the issues and fix them", "auto-fix issues"). In this
mode the skill's "Do NOT auto-branch / auto-fix" guardrails are overridden —
auto-branching and fixing *is* the requested intent.

Run this cycle, one issue per iteration:

1. **Pick** — `renaiss-shipflow issue next --json` (optionally `--label bug` or
   `--assignee <me>`). It claims the issue exclusively and returns `{issue, triage}`.
   - Selection order: highest `priority:*`, then highest `severity:*`, then the
     newest issue when those tie. Claimed issues and any `--label`/`--assignee`
     filter are excluded first.
   - **Exit code 4** (or `issue: null`) → no actionable issues remain. **Stop the
     loop** and summarize what you shipped.
   - Use `triage.relatedFiles` / `relatedCommits` to orient before reading code.
2. **Branch** — `git checkout -b fix/issue-<n>-<short-slug>` off the default
   branch. One branch per issue; never pile fixes onto one branch.
3. **Fix** — investigate and make the change. If it turns out too risky,
   ambiguous, or you can't reproduce it: `renaiss-shipflow issue done <n>
   --reason "blocked: <why>"` to release the claim, then continue to the next
   issue (do not open a PR).
4. **Test** — run the project's tests. For UI/behavior changes, drive the app in
   the browser (the `/browse` headed browser) and capture a **screenshot or short
   video** of the fix working. Only proceed if it actually verifies.
5. **Evidence** — post the proof to the issue: `renaiss-shipflow issue evidence
   <n> --file <screenshot-or-video> --caption "Verified: <what you tested>"`. This
   lands as a GitHub issue comment + the reporter's chat thread.
6. **PR** — commit, push the branch, then `renaiss-shipflow pr create --json`.
   Reference the issue in the body (`Fixes #<n>`).
7. **Release** — `renaiss-shipflow issue done <n> --reason "PR #<pr> opened"` so
   the claim frees up and the loop can advance.
8. **Repeat** from step 1.

## Guardrails

- **Never** `pr merge` or `release` (a version release) inside the loop — those
  need explicit human confirmation each time.
- Cap iterations: default to a reasonable batch (e.g. 5) or until `issue next`
  exits 4, whichever comes first. Ask the user before going beyond.
- Each iteration is independent: a failed/blocked issue releases its claim and
  the loop moves on — it never blocks the whole run.
- If tests or the browser check fail and you can't fix them, do not open a PR for
  that issue; release it as blocked and continue.
