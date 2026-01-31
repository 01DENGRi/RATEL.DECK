#!/usr/bin/env node

import net from "net";
import readline from "readline";
import chalk from "chalk";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// ─────────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, "Frontend");
const BACKEND_DIR = path.join(__dirname, "backend");
const AGENT_FILE = path.join(__dirname, "agent.js");

// ─────────────────────────────────────────────
// SERVICES CONFIG
// ─────────────────────────────────────────────
const SERVICES = {
  frontend: {
    name: "Frontend UI",
    port: 8080,
    url: "http://localhost:8080",
  },
  backend: {
    name: "Backend API",
    port: 3001,
    url: "http://localhost:3001",
  },
  agent: {
    name: "Agent Socket",
    port: 8787,
    url: "ws://localhost:8787",
  },
};

let processes = [];
let statusChecked = false;

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function checkPort(port, timeout = 700) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket
      .once("connect", () => {
        socket.destroy();
        resolve(true);
      })
      .once("error", () => resolve(false))
      .once("timeout", () => resolve(false))
      .connect(port, "127.0.0.1");
  });
}

function rawStatus(alive) {
  if (!statusChecked) return "—";
  return alive ? "● RUNNING" : "● DOWN";
}

function colorStatus(text) {
  if (text.includes("RUNNING")) return chalk.green(text);
  if (text.includes("DOWN")) return chalk.red(text);
  return chalk.gray(text);
}

function tableRow(name, statusText, url) {
  const statusPadded = statusText.padEnd(15);
  return (
    "│ " +
    name.padEnd(22) +
    " │ " +
    colorStatus(statusPadded) +
    " │ " +
    url.padEnd(27) +
    " │"
  );
}

// ─────────────────────────────────────────────
// START SERVICES
// ─────────────────────────────────────────────
function startProcess(cmd, args, cwd) {
  const p = spawn(cmd, args, {
    cwd,
    stdio: "ignore",
    detached: true,
  });
  processes.push(p);
}

startProcess("npm", ["run", "dev"], FRONTEND_DIR);
startProcess("node", ["server.js"], BACKEND_DIR);
startProcess("node", [AGENT_FILE], __dirname);

// ─────────────────────────────────────────────
// RENDER UI
// ─────────────────────────────────────────────
async function render() {
  const f = await checkPort(SERVICES.frontend.port);
  const b = await checkPort(SERVICES.backend.port);
  const a = await checkPort(SERVICES.agent.port);

  console.clear();

  console.log(chalk.red(`
█████╗  █████╗ ████████╗███████╗██╗     ██████╗ ███████╗ ██████╗██╗  ██╗
██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║     ██╔══██╗██╔════╝██╔════╝██║ ██╔╝
██████╔╝███████║   ██║   █████╗  ██║     ██║  ██║█████╗  ██║     █████╔╝ 
██╔══██╗██╔══██║   ██║   ██╔══╝  ██║     ██║  ██║██╔══╝  ██║     ██╔═██╗ 
██║  ██║██║  ██║   ██║   ███████╗███████╗██████╔╝███████╗╚██████╗██║  ██╗
╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝
`));

  console.log(chalk.bold(`
                         RATEL.DECK
                   CTF Operational Workspace
══════════════════════════════════════════════════════════════`));

  console.log(`
┌────────────────────────┬─────────────────┬─────────────────────────────┐
│ SERVICE                │ STATUS          │ ACCESS                      │
├────────────────────────┼─────────────────┼─────────────────────────────┤`);

  console.log(tableRow(SERVICES.frontend.name, rawStatus(f), SERVICES.frontend.url));
  console.log(tableRow(SERVICES.backend.name, rawStatus(b), SERVICES.backend.url));
  console.log(tableRow(SERVICES.agent.name, rawStatus(a), SERVICES.agent.url));

  console.log("└────────────────────────┴─────────────────┴─────────────────────────────┘\n");

  console.log(`
[1] Check services status
[2] Stop all services
[3] Change Frontend Port
[4] Change Backend API Port
[5] Change Agent Socket Port
`);
}

// ─────────────────────────────────────────────
// INPUT LOOP
// ─────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  await render();

  rl.on("line", async (line) => {
    switch (line.trim()) {
      case "1":
        statusChecked = true;
        await render();
        break;

      case "2":
        console.log(chalk.red("\n[!] Stopping all services...\n"));
        processes.forEach((p) => {
          try {
            process.kill(-p.pid);
          } catch {}
        });
        process.exit(0);

      default:
        console.log(chalk.gray("[INFO] Option under development\n"));
    }
  });
}

main();
