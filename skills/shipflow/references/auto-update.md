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
   `⬆️ ShipFlow updated v{old} → v{new}. Run /reload-plugins to apply it now (or it loads on next restart).`
3. **Continue with the user's original request.** Never block on the update.

## Why the skill can't apply it for you

Claude Code only has a `claude plugin update` CLI (which **installs** to disk but
says "restart required") — there is **no** command, hook, or API for a skill to
reload plugins into the *running* session. `/reload-plugins` is the only
in-session apply and it's a **manual user action** the assistant cannot self-type.
So the best the auto-update can do is install silently and point the user at
`/reload-plugins`.

Good news — most updates need **no** reload: the `renaiss-shipflow` **CLI is
bundled and re-resolved from disk on the next skill run** (the preamble symlinks
the newest version), so CLI behavior (commands, ordering, inbox, config) updates
**live**. A reload/restart is only needed to pick up **new or changed skill files**
— added slash commands, edited loop steps, reference docs.

If `claude plugin update` is unavailable or errors, tell the user to run
`/shipflow-update` (or `claude plugin update shipflow@renaissshipflow`) manually,
then continue with their request.
