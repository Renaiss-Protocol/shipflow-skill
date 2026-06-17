---
description: Check for and install ShipFlow plugin updates now
---

Force a ShipFlow plugin update check and install if newer:

```bash
PLUGIN_DIR=$(ls -d ~/.claude/plugins/cache/renaissshipflow/shipflow/*/ 2>/dev/null | sort -V | tail -1)
[ -n "$PLUGIN_DIR" ] && "$PLUGIN_DIR/bin/shipflow-update-check" --force || echo "ShipFlow plugin not found in the plugin cache."
```

- If it prints `UPGRADE_AVAILABLE <old> <new>`: run `claude plugin marketplace update renaissshipflow` then `claude plugin update shipflow@renaissshipflow`, and tell the user to restart Claude Code to apply it.
- If it prints nothing: tell the user they're on the latest version.
