# Resolving PR review feedback (loop reconcile, step 1)

For each open PR the loop authored that needs attention, work through **every**
reviewer comment, fix what you can, and reply so reviewers (human and automated,
e.g. gemini-code-assist) know what happened. Only act on **your own** PRs.

## 1. Gather every comment — don't miss inline ones

`gh pr view <n> --comments` shows general comments + review summaries, but **not
line-level inline comments** — fetch those too:

```bash
gh pr view <n> --comments                                   # general + review bodies
gh pr view <n> --json reviews,statusCheckRollup,headRefName # verdicts + CI + branch
gh pr checks <n>                                            # CI status
# inline (code-line) review comments:
gh api repos/<owner>/<repo>/pulls/<n>/comments \
  --jq '.[] | "\(.path):\(.line) [@\(.user.login)] \(.body)"'
```

## 2. Triage each comment (from someone other than you)

- **Actionable & clear** → fix it.
- **Needs clarification** → ask in a reply; don't guess.
- **Won't fix / disagree** → reply with a brief reason; never silently ignore.
- **Already addressed / stale** → skip (don't re-reply).

## 3. Fix

Check out the PR's branch (`gh pr checkout <n>` or `git checkout <headRefName>`),
make the changes for **all** actionable comments together, run the project's tests
and the browser check (loop step 5), commit, and push.

## 4. Reply on the PR — necessary comments only

- Post **one consolidated comment** summarising what changed, point by point, and
  surface any question:
  `gh pr comment <n> --body "Addressed: 1) … 2) …. Q: <thing> — your call?"`
- To answer a specific inline thread, reply to it directly:
  `gh api repos/<owner>/<repo>/pulls/<n>/comments/<comment_id>/replies -f body="…"`
- If you fixed CI, say what was failing and how you fixed it.
- Don't comment just to say "done" — keep it signal, not noise.

## 5. Comment on the linked issue when relevant

If the feedback changes scope/behavior or the reporter should know, add a short
note on the issue the PR closes:
`gh issue comment <n> --body "Heads-up from review: …"`. Otherwise skip.

## 6. Hand back for re-review

Pushing re-triggers reviewers that run on push. If a specific human review is
needed, `gh pr edit <n> --add-reviewer <login>`. Never `gh pr merge` — merging
needs explicit human confirmation.
