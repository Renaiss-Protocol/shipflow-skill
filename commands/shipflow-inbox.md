---
description: Show open PRs (review feedback / failing CI) and in-progress issues (new comments) needing follow-up
---

Run `renaiss-shipflow inbox --json` and report what needs follow-up before new work:
- PRs where `needsAttention` is true (reasons: `changes_requested`, `ci_failing`, `review_comments`).
- In-progress issues with a `newComment` (someone replied and you may owe a response).

For anything flagged, offer to address it (read the PR/issue, fix, push, reply).
