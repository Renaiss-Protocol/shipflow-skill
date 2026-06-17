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
4. **Fix** — investigate and make the change. If too risky/ambiguous or you can't
   reproduce it: `renaiss-shipflow issue done <n> --reason "blocked: <why>"` and go
   to the next issue (no PR).
5. **Test** — run the project's tests; for UI/behavior changes drive the app in a
   browser and capture a screenshot/short video. Only proceed if it verifies.
6. **Evidence** — `renaiss-shipflow issue evidence <n> --file <shot-or-video>
   --caption "Verified: <what you tested>"`.
7. **PR** — commit, push, then `renaiss-shipflow pr create --json` (body `Fixes #<n>`).
8. **Release** — `renaiss-shipflow issue done <n> --reason "PR #<pr> opened"`.
9. **Repeat** from step 1 — the next reconcile picks up any review that lands on the
   PR you just opened.

**Never** `pr merge` or cut a `release` inside the loop without explicit
confirmation. Cap iterations at a reasonable batch (default ~5) or until step 2
exits 4; ask before going beyond.
