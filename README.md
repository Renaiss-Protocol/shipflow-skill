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
`/shipflow-regression` · `/shipflow-release` · `/shipflow-login`

Requires the `renaiss-shipflow` CLI (`npm i -g @renaiss-shipflow/cli`) and a
one-time `renaiss-shipflow login`.

Guide: https://renaiss-shipflow.zeabur.app/tools/claude-cli
