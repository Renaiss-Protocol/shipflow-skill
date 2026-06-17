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
   `⬆️ ShipFlow updated v{old} → v{new}. Restart Claude Code (or /exit and reopen) to load it — plugin updates apply on restart.`
3. **Continue with the user's original request.** Never block on the update.

If `claude plugin update` is unavailable or errors, tell the user to run
`/shipflow-update` (or `claude plugin update shipflow@renaissshipflow`) manually,
then continue with their request.
