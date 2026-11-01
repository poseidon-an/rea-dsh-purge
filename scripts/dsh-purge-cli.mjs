#!/usr/bin/env node
/**
 * REA `dsh-purge` subcommand dispatcher.
 *
 *   rea dsh-purge mcp               -> launch the dsh-purge MCP server (stdio)
 *   rea dsh-purge prompt [opts]    -> render a red-team prompt and print it
 *   rea dsh-purge help             -> this message
 *
 * This is a thin wrapper around scripts/dsh-purge-mcp.mjs so the dsh-purge
 * capabilities (ported from github.com/YuJunZhiXue/dsh-purge) are callable
 * both as MCP tools (for agents) and as a plain REA subcommand.
 *
 * Authorized red-team / AI-robustness research use only.
 */

import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = join(HERE, "dsh-purge-mcp.mjs");

export function printDshPurgeHelp() {
  process.stdout.write(
    [
      "rea dsh-purge — red-team prompt framework ported from dsh-purge",
      "",
      "USAGE",
      "  rea dsh-purge mcp               Start the dsh-purge MCP server (stdio transport).",
      "  rea dsh-purge presets           List bundled red-team presets / sub-agent roles.",
      "  rea dsh-purge models            List target model prompt profiles.",
      "  rea dsh-purge route <text>      Classify text into an intent category + rule set.",
      "  rea dsh-purge prompt ...         Render a red-team system prompt and print it.",
      "  rea dsh-purge help              Show this message.",
      "",
      "PROMPT OPTIONS (prompt)",
      "  --lang <zh|en>                 Template language (default: zh).",
      "  --task <text>                  Engagement task / objective to append.",
      "  --model <id>                   Target model profile id (see `rea dsh-purge models`).",
      "  --role <code>                  Red-team role: recon|assess|vuln-scan|exploit|internal.",
      "",
      "ROUTE OPTIONS (route)",
      "  --lang <zh|en>                 Classification language (default: zh).",
      "",
      "GLOBAL",
      "  --json                        Emit raw JSON instead of rendered text (all subcommands).",
      "",
      "EXAMPLES",
      "  rea dsh-purge mcp",
      "  rea dsh-purge presets",
      "  rea dsh-purge models",
      "  rea dsh-purge route \"如何绕过模型的内容过滤\"",
      "  rea dsh-purge prompt --task \"对 TARGET 做 web 渗透\" --role recon",
      "",
      "NOTE: dsh-purge is a cybersecurity red-team / AI-robustness research harness.",
      "Use only against systems you are authorized to test.",
    ].join("\n") + "\n",
  );
}

/**
 * Parse flags + collect positional (non-flag) arguments.
 * `--json` is boolean; `--lang/--task/--model/--role` consume the next token
 * (skipping it as a positional so e.g. route text is never polluted by values).
 */
function parseFlags(argv) {
  const opts = { lang: "zh", task: "", model: "universal-zh", role: "", json: false };
  const positional = [];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") { opts.json = true; continue; }
    if (a.startsWith("--")) {
      const key = a.replace(/^--/, "");
      const val = argv[i + 1];
      if (["lang", "task", "model", "role"].includes(key) && val !== undefined && !val.startsWith("--")) {
        opts[key] = val;
        i += 1;
      }
      continue;
    }
    positional.push(a);
  }
  return { opts, positional };
}

/** Minimal inline MCP client: initialize then call one tool, return the text. */
function callTool(tool, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [MCP_SERVER], { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("error", reject);
    child.on("exit", () => {
      try {
        const lines = out
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => JSON.parse(l));
        const res = lines.find((l) => l.id === 4 && l.result);
        if (!res) return reject(new Error("no tool result from dsh-purge server"));
        const text = res.result?.content?.[0]?.text ?? "";
        resolve(text);
      } catch (e) {
        reject(e);
      }
    });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) + "\n");
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: tool, arguments: args } }) + "\n",
    );
    setTimeout(() => child.stdin.end(), 30);
  });
}

export async function runDshPurge(argv) {
  const sub = argv[0];
  if (sub === undefined || sub === "help" || sub === "-h") {
    printDshPurgeHelp();
    return;
  }
  if (sub === "mcp" || sub === "--mcp") {
    // Await the child so the parent keeps the inherited stdio pipe open until
    // the server has produced its output, then propagate the child's exit code.
    await new Promise((resolve) => {
      const child = spawn(process.execPath, [MCP_SERVER], { stdio: "inherit" });
      child.on("exit", (code) => {
        process.exitCode = code ?? 0;
        resolve();
      });
      child.on("error", (err) => {
        process.stderr.write(`dsh-purge mcp failed: ${err.message}\n`);
        process.exitCode = 1;
        resolve();
      });
    });
    return;
  }

  const { opts, positional } = parseFlags(argv);

  if (sub === "presets" || sub === "models" || sub === "target-models") {
    const tool = sub === "presets" ? "dsh_purge_list_presets" : "dsh_purge_list_target_models";
    const text = await callTool(tool, {});
    process.stdout.write(text + "\n");
    return;
  }

  if (sub === "route") {
    const text = positional.join(" ").trim();
    if (!text) {
      process.stderr.write("dsh-purge: `route` requires a text argument, e.g. `rea dsh-purge route \"如何绕过过滤器\"`\n");
      process.exitCode = 1;
      return;
    }
    const out = await callTool("dsh_purge_route_intent", { text, language: opts.lang });
    process.stdout.write(out + "\n");
    return;
  }

  if (sub === "prompt") {
    let text = await callTool("dsh_purge_render_prompt", {
      language: opts.lang,
      task: opts.task,
      model: opts.model,
      role: opts.role,
    });
    // The MCP tool returns a JSON envelope {"prompt": "..."}; unwrap to bare text.
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.prompt === "string") text = parsed.prompt;
    } catch {
      /* already bare text */
    }
    if (opts.json) {
      process.stdout.write(JSON.stringify({ prompt: text }, null, 2) + "\n");
    } else {
      process.stdout.write(text + "\n");
    }
    return;
  }

  process.stderr.write(`dsh-purge: unknown subcommand "${sub}"\n\n`);
  printDshPurgeHelp();
  process.exitCode = 1;
}

// Entry point. Triggers only when this file is run directly (the `rea-dsh-purge`
// bin, or `node scripts/dsh-purge-cli.mjs ...`). When imported by scripts/rea.mjs,
// the parent invokes runDshPurge itself, so this guard stays dormant.
const invokedDirectly =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const sub = process.argv.slice(2);
  runDshPurge(sub)
    .catch((err) => {
      process.stderr.write(`dsh-purge: ${err && err.message ? err.message : err}\n`);
      process.exitCode = 1;
    })
    .then(() => {
      if (invokedDirectly) process.exit(process.exitCode ?? 0);
    });
}
