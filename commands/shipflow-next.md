---
description: Pick & claim the next ShipFlow issue (priority-ordered)
---

Run `renaiss-shipflow issue next --json` to claim the next open, unclaimed issue (ordered priority → severity → newest). Show the returned issue plus its `triage` context verbatim. Exit code 4 / `issue: null` means nothing actionable remains.
