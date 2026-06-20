# Auto-update flow

Referenced by the skill **Preamble** when `bin/shipflow-update-check` prints
`UPGRADE_AVAILABLE <old> <new>`. Updating is automatic by default — opt out with
`SHIPFLOW_AUTO_UPDATE=false` (then the skill just notes an update exists and
continues).

## Steps

1. Refresh the marketplace and update the plugin (both no-op if already current):
   ```bash
   claude plugin marketplace update renaissshipflow >/dev/null 2>&1 || true
   claude plugin update shipflow@renaissshipflow >/dev/null 2>&1 || true
   ```
2. Tell the user, concisely:
   `⬆️ ShipFlow updated v{old} → v{new} — it loads automatically next session, or run /reload-plugins to apply it now.`
3. **Continue with the user's original request.** Never block on the update.

## How updates apply (no manual action needed)

A **SessionStart hook** (`hooks/hooks.json` → `bin/shipflow-session-start`)
silently installs any pending update at the start of each session. Combined with
this preamble, updates get installed proactively — you don't run anything — and
load **automatically on your next session**.

## Why the skill can't apply it *this* session

Claude Code **pins the plugin version at session start, before hooks run**, so a
freshly-installed version can't take effect in the current session — no command,
`reloadSkills`, hook, or API can swap the loaded plugin version mid-session
(verified against the docs). The only ways an installed update goes live:

- **Automatically** — at the next session start (the SessionStart hook already
  installed it, so it just loads). No user action.
- **Immediately** — the user runs **`/reload-plugins`** (a manual command; the
  assistant cannot self-type it).

Most behavior needs **no** reload anyway: the `renaiss-shipflow` **CLI is bundled
and re-resolved from disk on each skill run** (the preamble symlinks the newest
version), so CLI behavior (commands, ordering, inbox, config) updates **live**. A
reload is only for **new/changed skill files** — added slash commands, edited
loop steps, reference docs.

If `claude plugin update` is unavailable or errors, tell the user to run
`/shipflow-update` (or `claude plugin update shipflow@renaissshipflow`) manually,
then continue with their request.
