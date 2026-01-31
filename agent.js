import WebSocket, { WebSocketServer } from "ws";
import { spawn } from "child_process";

const PORT = 8787;
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  let vpnProcess = null;

  const shell = spawn("/usr/bin/zsh", [], { stdio: "pipe" });

  shell.stdout.on("data", (data) => ws.send(data.toString()));
  shell.stderr.on("data", (data) => ws.send(data.toString()));

  ws.on("message", (msg) => {
    const message = msg.toString().trim();

    // START VPN
    if (message.startsWith("OPENVPN:")) {
      const vpnFile = message.replace("OPENVPN:", "").trim();
      if (vpnProcess) {
        ws.send("[-] VPN already running");
        return;
      }

      vpnProcess = spawn("sudo", ["openvpn", "--config", vpnFile]);

      vpnProcess.stdout.on("data", (d) => ws.send(d.toString()));
      vpnProcess.stderr.on("data", (d) => ws.send(d.toString()));

      vpnProcess.on("close", (code) => {
        ws.send(`[-] VPN disconnected (exit ${code})`);
        vpnProcess = null;
      });

      ws.send(`[*] OpenVPN started: ${vpnFile}`);
      return;
    }

    // STOP VPN
    if (message === "STOPVPN") {
      if (vpnProcess) {
        vpnProcess.kill("SIGTERM");
        vpnProcess = null;
        ws.send("[!] VPN stopped");
      } else {
        ws.send("[-] No VPN running");
      }
      return;
    }

    // STOP SHELL
    if (message === "STOP") {
      shell.kill("SIGINT");
      ws.send("[!] Shell interrupted");
      return;
    }

    shell.stdin.write(message + "\n");
  });

  ws.on("close", () => {
    if (vpnProcess) vpnProcess.kill("SIGTERM");
    shell.kill();
  });
});

console.log(`✔ Kali Agent running on ws://localhost:${PORT}`);
