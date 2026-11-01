# dsh-purge integration

This document describes how the [dsh-purge](https://github.com/YuJunZhiXue/dsh-purge)
red-team / prompt-injection harness was fused into REA
([morluto/rea](https://github.com/morluto/rea)).

## What was fused

dsh-purge is a DeepSeek-client jailbreak/red-team harness. Its portable value is
**not** the DeepSeek-specific cordis plugin (which only runs inside `@deepseek-ai/*`
runtimes) — it is the **prompt-injection templates** and the **intent-routing
knowledge base** (the routing tables, rule definitions, and web-pentest canned
workflows shipped in `lib/default-prompt-inject.zh.md` / `.en.md`).

Those assets were ported into REA and exposed as a self-contained Model Context
Protocol server, so any MCP client (Claude Code, Codex, Cursor, Gemini CLI, …)
and REA itself can call them.

## Files added

| Path | Purpose |
| --- | --- |
| `scripts/dsh-purge-mcp.mjs` | Standalone, **zero-dependency** MCP server over stdio (JSON-RPC 2.0). |
| `scripts/dsh-purge-cli.mjs` | `rea dsh-purge` subcommand dispatcher (`mcp`, `presets`, `models`, `route`, `prompt`, `help`). |
| `src/dshPurge/assets/prompt-inject.zh.md` | dsh-purge's Chinese system-prompt template (port, Apache-2.0). |
| `src/dshPurge/assets/prompt-inject.en.md` | dsh-purge's English system-prompt template (port, Apache-2.0). |
| `src/dshPurge/assets/LICENSE.dsh-purge` | Apache License 2.0 text for the ported material. |
| `scripts/rea.mjs` (patched) | Intercepts the `dsh-purge` verb before REA's compiled runtime loads. |
| `package.json` (patched) | Adds the `rea-dsh-purge` bin. |

## MCP tools exposed

1. `dsh_purge_list_presets` — list the bundled red-team presets and sub-agent roles.
2. `dsh_purge_list_target_models` — list supported target model prompt profiles.
3. `dsh_purge_route_intent` — classify a request into dsh-purge's intent
   categories and return the matched rule set (faithful port of the routing table).
4. `dsh_purge_render_prompt` — render a full red-team system prompt from the
   bundled templates, appending the engagement task and an optional red-team role
   (`recon` / `assess` / `vuln-scan` / `exploit` / `internal`).

## How to run

As a REA subcommand:

```bash
# Start the dsh-purge MCP server (stdio transport) — for MCP clients
rea dsh-purge mcp

# Inspect the bundled capability surface
rea dsh-purge presets      # red-team presets / sub-agent roles
rea dsh-purge models       # target model prompt profiles
rea dsh-purge route "对目标做 web 渗透测试"   # classify text -> intent category + rules
rea dsh-purge route "reverse engineer this binary" --lang en

# Render a red-team system prompt directly from the CLI
rea dsh-purge prompt --task "对 TARGET 做 web 渗透" --role recon --lang zh
rea dsh-purge prompt --lang en --task "reverse engineer APP" --json

# Help
rea dsh-purge help
```

Directly (without REA's CLI):

```bash
node scripts/dsh-purge-mcp.mjs            # MCP server
node scripts/dsh-purge-cli.mjs <subcommand> ...   # CLI
```

## Connecting from an MCP client

dsh-purge is exposed as its **own** MCP server (REA's own tool catalog is
integrity-gated and rebuilt only during `npm run build`). Register both REA and
dsh-purge as separate MCP servers in your client config. Example
(`~/.claude.json` / `mcp.json` style):

```json
{
  "mcpServers": {
    "rea": { "command": "npx", "args": ["-y", "rea-agents@latest", "mcp"] },
    "rea-dsh-purge": { "command": "rea-dsh-purge", "args": ["mcp"] }
  }
}
```

Or point `rea-dsh-purge` at the local build:

```json
{
  "mcpServers": {
    "rea-dsh-purge": {
      "command": "node",
      "args": ["/abs/path/to/rea/scripts/dsh-purge-mcp.mjs"]
    }
  }
}
```

## Authorized use

dsh-purge is published as a cybersecurity red-team / AI-robustness research
harness. These tools reproduce its prompt framework for **testing your own
models and agents in an authorized context**. Do not use them against systems or
people without permission. The ported content is unmodified in its security
behaviour.

## License

dsh-purge is Apache License 2.0; REA first-party code is MIT. See the root
[NOTICE](NOTICE) and `src/dshPurge/assets/LICENSE.dsh-purge`.
