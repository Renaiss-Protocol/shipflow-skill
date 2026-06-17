---
description: Run the ShipFlow autonomous issue-fixing loop (reconcile → pick → fix → test → evidence → PR → repeat)
---

Enter ShipFlow **Loop mode**: autonomously work items one at a time. In this mode
the usual "don't auto-branch / auto-fix" guardrails are intentionally lifted.

Run this cycle, one item per iteration:

1. **Reconcile open work first** — run `renaiss-shipflow inbox --json`. For each PR
   with `needsAttention` (changes_requested / ci_failing / review_comments): read
   it (`gh pr view <n> --comments`, `gh pr checks <n>`), check out its branch,
   address the feedback or fix CI, push, and reply. For each in-progress issue with
   a `newComment`: read (`gh issue view <n> --comments`) and act on it. Only move on
   once the inbox is clear.
2. **Pick** — `renaiss-shipflow issue next --json` (claims the next open, unclaimed
   issue, ordered priority → severity → newest). Optional filters: $ARGUMENTS.
   Exit code 4 / `issue: null` → nothing actionable remains: **stop** and summarize
   what shipped. Use the returned `triage.relatedFiles`/`relatedCommits` to orient.
3. **Branch** — `git checkout -b fix/issue-<n>-<slug>` off the default branch.
4. **Fix** — investigate and make the change. Genuinely try to verify (start the
   dev server / seed a test DB). Only if it's truly too risky/ambiguous,
   unreproducible, or unverifiable: **keep the claim** (so step 2 skips it next
   time), note it as blocked, and continue to the next iteration — no PR, and
   **do not stop the loop**.
5. **Test** — run the project's tests; for any UI/behavior change verify
   **end-to-end in a real browser** (resolve it via the plugin's
   `bin/shipflow-browser`, preferring gstack `browse`): `goto` the app, exercise
   the fix, confirm with `snapshot -D` + no new console errors, and capture
   before/after **screenshots** (Read them so they're visible). Only proceed if it
   genuinely verifies — never open a PR for an unverified fix.
6. **Evidence** — `renaiss-shipflow issue evidence <n> --file <shot-or-video>
   --caption "Verified: <what you tested>"`.
7. **PR** — commit, push, then `renaiss-shipflow pr create --json` (body `Fixes #<n>`).
8. **Release** — `renaiss-shipflow issue done <n> --reason "PR #<pr> opened"`.
9. **Repeat** from step 1 — the next reconcile picks up any review that lands on the
   PR you just opened.

**Run to the cap — don't stop early to ask.** Keep cycling until you've opened
`cap` PRs (default **5**) **or** step 2 returns no actionable issue. A blocked
issue is skipped (claim held) and the loop moves on; it never ends the run and you
never pause mid-run to ask for direction. Only at the cap or an empty queue:
release any held blocked claims, summarize (PRs opened + blocked w/ reasons), and
ask whether to continue beyond the cap. **Never** `pr merge` / `release` without
explicit confirmation.
