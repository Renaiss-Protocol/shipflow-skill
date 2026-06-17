---
description: Run the ShipFlow autonomous issue-fixing loop (pick → fix → test → evidence → PR → repeat)
---

Enter ShipFlow **Loop mode**: autonomously work issues one at a time. In this mode
the usual "don't auto-branch / auto-fix" guardrails are intentionally lifted.

Run this cycle, one issue per iteration:

1. **Pick** — `renaiss-shipflow issue next --json` (claims the next open, unclaimed
   issue, ordered priority → severity → newest). Optional filters: $ARGUMENTS.
   Exit code 4 / `issue: null` → nothing actionable remains: **stop** and summarize
   what shipped. Use the returned `triage.relatedFiles`/`relatedCommits` to orient.
2. **Branch** — `git checkout -b fix/issue-<n>-<slug>` off the default branch.
3. **Fix** — investigate and make the change. If too risky/ambiguous or you can't
   reproduce it: `renaiss-shipflow issue done <n> --reason "blocked: <why>"` and go
   to the next issue (no PR).
4. **Test** — run the project's tests; for UI/behavior changes drive the app in a
   browser and capture a screenshot/short video. Only proceed if it verifies.
5. **Evidence** — `renaiss-shipflow issue evidence <n> --file <shot-or-video>
   --caption "Verified: <what you tested>"`.
6. **PR** — commit, push, then `renaiss-shipflow pr create --json` (body `Fixes #<n>`).
7. **Release** — `renaiss-shipflow issue done <n> --reason "PR #<pr> opened"`.
8. **Repeat** from step 1.

**Never** `pr merge` or cut a `release` inside the loop without explicit
confirmation. Cap iterations at a reasonable batch (default ~5) or until step 1
exits 4; ask before going beyond.
