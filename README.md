# ShipFlow plugin for Claude Code

Install via the dashboard-hosted marketplace:

```sh
claude plugin marketplace add https://renaiss-shipflow.zeabur.app/claude-plugin/marketplace.json
claude plugin install shipflow@renaissshipflow
```

Provides dedicated slash commands — one per ShipFlow action — plus a
natural-language skill that routes free-form requests to the same `renaiss-shipflow`
CLI calls:

`/shipflow-loop` (autonomous fix loop) · `/shipflow-status` · `/shipflow-issues` ·
`/shipflow-next` · `/shipflow-work` · `/shipflow-new-issue` · `/shipflow-done` ·
`/shipflow-evidence` · `/shipflow-pr` · `/shipflow-merge` · `/shipflow-test` ·
`/shipflow-regression` · `/shipflow-release` · `/shipflow-login` · `/shipflow-update`

The `renaiss-shipflow` CLI is **bundled** (`cli/dist/renaiss-shipflow.mjs`) — no
separate `npm i -g` needed. The skill links it onto your PATH on first use; it
just needs `node`, `git`, and `gh` available. Run `renaiss-shipflow login` once.

**Self-updating:** triggering the skill checks for a newer published version
(cached, every ~4h) and auto-installs it (`claude plugin update`), applied on the
next restart. Disable with `SHIPFLOW_AUTO_UPDATE=false`; force a check anytime with
`/shipflow-update`.

Guide: https://renaiss-shipflow.zeabur.app/tools/claude-cli
