# Browser end-to-end testing (loop step 5)

How the loop verifies a fix in a real browser and captures screenshot evidence,
before opening a PR. Modeled on gstack's `browse` + `/qa` flow. For UI/behavior
changes this is the **required** verification; pure backend/library changes can
verify with the project's own tests instead (but still capture relevant output).

## 1. Resolve the browser

```bash
BROWSE="$("$PLUGIN_DIR/bin/shipflow-browser")" || { echo "$BROWSE"; }   # prefers gstack `browse`
```

If none is found, fall back to the project's own E2E runner (Playwright/Cypress)
and still produce a screenshot. Never skip visual verification for a UI change.

## 2. Reuse the headed session, get the app URL

- Check first — **do not** relaunch if a healthy session exists:
  ```bash
  $BROWSE status      # reuse if Mode: headed and server healthy
  ```
  If status reports an unhealthy/stale server ("Auth failed — server may have
  restarted", a dead port, or headless mode), reconnect before testing:
  `$BROWSE disconnect 2>/dev/null; $BROWSE connect` (gstack), then re-check status.
- Get the app under test running and its URL: a local dev server (start it if
  needed, e.g. `npm run dev`), the PR's `--preview-url`, or production. Use the
  page that the issue is about.
- For auth-walled pages, import cookies once: `$BROWSE cookie-import-browser chrome --domain <domain>`.

## 3. Drive the fix end-to-end (before → after)

```bash
EV="${TMPDIR:-/tmp}/shipflow-evidence/issue-<n>"; mkdir -p "$EV"
$BROWSE goto <url>
$BROWSE snapshot -i                 # interactive elements → @e1, @e2 refs
$BROWSE screenshot "$EV/before.png" # state before exercising the fix
# Reproduce the issue's scenario using refs from the snapshot:
$BROWSE click @e3
$BROWSE fill @e4 "value"
$BROWSE press Enter
$BROWSE snapshot -D                 # DIFF — proves what changed, the heart of the check
$BROWSE console --errors            # no new console errors introduced
$BROWSE screenshot "$EV/after.png"  # the fix working
```

- The `snapshot -D` diff is the verification — it shows the DOM actually changed
  the way the fix intends (e.g. the error banner is gone, the row was deleted).
- Optionally check layout: `$BROWSE responsive "$EV/layout"` (mobile/tablet/desktop).

## 4. Make the screenshots visible, then gate

- **Read** each PNG with the Read tool (`$EV/after.png`, etc.) so you and the user
  actually see the result — an unread screenshot is invisible.
- **Pass/fail gate:** only continue to evidence + PR if the fix genuinely
  verified (expected change present, no new console errors). If it didn't, go back
  and fix, or release the issue as blocked — do **not** open a PR for an unverified
  fix.

## 5. Hand the evidence to the issue

The captured screenshot(s) become the issue evidence in loop step 6:

```bash
renaiss-shipflow issue evidence <n> --file "$EV/after.png" --caption "Verified: <what you tested>"
```

Attach a short screen recording instead/as well for flows that need motion
(`--file demo.mp4`). This posts to the GitHub issue + the reporter's chat thread.
