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
4. **Fix** — investigate and make the change. Make a genuine attempt to verify —
   start the dev server, seed a local/test DB, stand up what you need;
   environmental friction is **not** a reason to abandon. Only if it's truly too
   risky, ambiguous, unreproducible, or impossible to verify here: **keep the
   claim** (do not release it yet — the held claim makes step 2 skip it next
   time), record it as blocked with the reason, and **continue to the next
   iteration**. Do not open a PR for it, and do **not** stop the loop.
5. **Test** — run the project's tests, then **verify end-to-end in a real
   browser** for any UI/behavior change: follow `references/browser-testing.md`
   (resolve the browser via `bin/shipflow-browser`, reuse the headed session,
   drive the fix, confirm with a `snapshot -D` diff + no new console errors, and
   capture before/after **screenshots**). Read the screenshots so they're visible.
   Only proceed if it genuinely verifies — otherwise fix it or release as blocked,
   never open a PR for an unverified fix. Pure backend/library changes can verify
   with the project's tests alone.
6. **Evidence** — attach the screenshot(s)/recording captured in step 5:
   `renaiss-shipflow issue evidence <n> --file <shot-or-video> --caption "Verified:
   <what you tested>"`. Lands as a GitHub issue comment + the reporter's chat
   thread.
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
- **Run to the cap — do not stop early to ask.** Keep cycling (pick → … → PR)
  until you have opened `cap` PRs (default **5**) **or** step 2 returns no
  actionable issue. A single hard / blocked / unverifiable issue is skipped
  (step 4, claim held) and the loop moves on — it never ends the run, and you
  never pause mid-run to ask the user for direction or permission.
- Because blocked issues keep their claim, step 2 naturally advances **down the
  priority list** to the next workable issue. When step 2 finally returns null,
  every remaining issue is either shipped or blocked-by-you — that's the stop.
- An unverified fix is never shipped: if the browser/test check fails and you
  can't fix it, treat the issue as blocked (skip + continue) — not as a reason to
  halt the loop.
- **Only at the cap or an empty queue:** release any held blocked claims
  (`renaiss-shipflow issue done <n> --reason "blocked: <why>"`), then summarize —
  PRs opened, and issues blocked with reasons — and ask whether to continue beyond
  the cap or to merge anything. `pr merge` / `release` still need explicit
  confirmation.
