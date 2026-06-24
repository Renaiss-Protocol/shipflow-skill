# Browser end-to-end testing (loop step 5)

How the loop verifies a fix in a real browser and captures screenshot evidence,
before opening a PR. Modeled on gstack's `browse` + `/qa` flow. For UI/behavior
changes this is the **required** verification; pure backend/library changes can
verify with the project's own tests instead (but still capture relevant output).

## 1. Resolve + ensure a healthy browser

ShipFlow drives the **gstack headed browser** (`browse`). Resolve *and* health-check
it in one step:

```bash
BROWSE="$("$PLUGIN_DIR/bin/shipflow-browser" --ensure)" || { echo "$BROWSE" >&2; exit 1; }
```

`--ensure` resolves gstack `browse` **and heals a wedged server** — the
"Auth failed — server may have restarted" / stale-port state that `browse restart`
can't recover on its own. It kills the stale server + its chromium so the next
command respawns fresh; the chromium profile (cookies, auth, scroll) persists on
disk, so nothing is lost. If gstack isn't installed, fall back to the project's own
E2E runner (Playwright/Cypress) and still produce a screenshot — never skip visual
verification for a UI change.

## 2. Get the app under test running

- The browser is already healthy (step 1 ensured it) — **reuse** the session, don't
  relaunch.
- Point it at the **running app** and its URL: a local dev server (start it if
  needed, e.g. `npm run dev`), the PR's `--preview-url`, or production. Use the page
  the issue is about.
- For auth-walled pages, import cookies once:
  `$BROWSE cookie-import-browser chrome --domain <domain>` (a one-time macOS
  Keychain prompt the user approves).

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

## 5. Hand the evidence to the PR

Once the PR is open (loop step 6), attach the captured screenshot(s) **to the PR**
so reviewers see the verification inline — pass the PR number with `--pr`:

```bash
renaiss-shipflow issue evidence <n> --pr <pr> --file "$EV/after.png" --caption "Verified: <what you tested>"
```

With `--pr`, the comment lands on the PR (plus the reporter's chat thread); the
issue stays linked through the PR's `Fixes #<n>`. Without a PR, it falls back to an
issue comment. Attach a short screen recording instead/as well for flows that need
motion (`--file demo.mp4`).
