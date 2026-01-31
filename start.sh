#!/usr/bin/env bash
# ==============================================
# RATEL.DECK - CTF Operations Platform
# Start Script (Production Ready)
# ==============================================

set -e

# Resolve project root
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Permissions check
if [ ! -x "$ROOT_DIR/start.js" ]; then
  chmod +x "$ROOT_DIR/start.js"
fi

clear

echo "██████╗  █████╗ ████████╗███████╗██╗     ██████╗ ███████╗ ██████╗██╗  ██╗"
echo "██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║     ██╔══██╗██╔════╝██╔════╝██║ ██╔╝"
echo "██████╔╝███████║   ██║   █████╗  ██║     ██║  ██║█████╗  ██║     █████╔╝ "
echo "██╔══██╗██╔══██║   ██║   ██╔══╝  ██║     ██║  ██║██╔══╝  ██║     ██╔═██╗ "
echo "██║  ██║██║  ██║   ██║   ███████╗███████╗██████╔╝███████╗╚██████╗██║  ██╗"
echo "╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝"
echo ""
echo "                         RATEL.DECK"
echo "                   CTF Operations Platform"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "[*] Initializing services..."
echo ""

# Launch Node controller
node "$ROOT_DIR/start.js"
