#!/usr/bin/env node
/**
 * FLF Epistemic Stack — click-to-own runner.
 *
 * Double-click RUN-EPISTACK.command (Mac) or RUN-EPISTACK.bat (Windows) to invoke this.
 *
 * Progressive install philosophy:
 *   1. UI loads INSTANTLY with frozen case outputs — value in 2 seconds, no LLM needed.
 *   2. If Ollama is missing or no model is pulled, the UI shows a clear "Install full stack" CTA.
 *   3. The human decides whether to install. Nothing is downloaded without consent.
 *
 * This script:
 *   - Verifies Node ≥20
 *   - Starts the local server on :4318
 *   - Opens the browser
 *   - Reports Ollama status (does NOT auto-install — the user clicks through if they want it)
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const isMac = platform() === "darwin";
const isWin = platform() === "win32";

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function line(text, color = "") {
  console.log(color ? `${color}${text}${COLORS.reset}` : text);
}

function header(text) {
  console.log("");
  line("─".repeat(60), COLORS.dim);
  line(`  ${text}`, COLORS.bold);
  line("─".repeat(60), COLORS.dim);
}

async function checkNode() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 20) {
    line(`✗ Node ${process.versions.node} detected — need 20 or newer.`, COLORS.red);
    line(`  Install from https://nodejs.org/ and re-run this.`, COLORS.dim);
    process.exit(1);
  }
  line(`✓ Node ${process.versions.node}`, COLORS.green);
}

async function checkOllama() {
  // Best-effort health check. Do NOT auto-install.
  try {
    const res = await fetch("http://127.0.0.1:11434/api/tags", {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models = (data?.models ?? []).map((m) => m.name).filter(Boolean);
    const hasLlama = models.some((m) => m.startsWith("llama3.1"));
    if (hasLlama) {
      line(`✓ Ollama up, model available (${models.find((m) => m.startsWith("llama3.1"))})`, COLORS.green);
      return true;
    }
    line(`△ Ollama is running but no llama3.1 model is pulled.`, COLORS.yellow);
    line(`  For chat + alias-proposal features, run in another terminal:`, COLORS.dim);
    line(`    ollama pull llama3.1`, COLORS.dim);
    line(`  The static case views work fully without it.`, COLORS.dim);
    return false;
  } catch {
    line(`△ Ollama not detected.`, COLORS.yellow);
    line(`  The tool works fully without it — static case views load instantly.`, COLORS.dim);
    line(`  For the chat + alias-proposal features, install Ollama:`, COLORS.dim);
    line(`    Mac:    brew install ollama  &&  ollama serve`, COLORS.dim);
    line(`    Windows: download from https://ollama.com`, COLORS.dim);
    line(`  Then: ollama pull llama3.1`, COLORS.dim);
    return false;
  }
}

function openBrowser(url) {
  try {
    if (isMac) spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    else if (isWin) spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    else spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  } catch {
    /* user can open the URL manually */
  }
}

async function main() {
  console.clear();
  line("");
  line("  FLF Epistemic Stack", COLORS.bold + COLORS.blue);
  line("  A gift to the Future of Life Foundation.", COLORS.dim);
  line("");

  header("Checking environment");
  await checkNode();
  await checkOllama();

  header("Starting local server");
  line(`  Launching on http://127.0.0.1:4318 ...`, COLORS.dim);

  // server.js listens on its own when loaded as main. Spawn it as a child so this
  // runner can open the browser and stay attached for logs.
  const server = spawn(process.execPath, [join(ROOT, "server.js")], {
    cwd: ROOT,
    stdio: "inherit",
  });

  // Give the server a moment, then probe + open browser.
  setTimeout(async () => {
    try {
      const res = await fetch("http://127.0.0.1:4318/api/ping", {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        line(`  Server up. Opening browser...`, COLORS.green);
        openBrowser("http://127.0.0.1:4318/");
        line("");
        line("  Press Ctrl+C in this window to stop the server.", COLORS.dim);
        line("");
      } else {
        line(`  Server responded HTTP ${res.status} — open http://127.0.0.1:4318/ manually.`, COLORS.yellow);
      }
    } catch (e) {
      line(`  Server not yet responding: ${e.message}`, COLORS.yellow);
      line(`  Try opening http://127.0.0.1:4318/ in your browser in a few seconds.`, COLORS.dim);
    }
  }, 1500);

  server.on("exit", (code) => {
    line(`Server exited with code ${code}.`, COLORS.dim);
    process.exit(code ?? 0);
  });
}

main().catch((e) => {
  line(`Runner failed: ${e.message}`, COLORS.red);
  process.exit(1);
});
