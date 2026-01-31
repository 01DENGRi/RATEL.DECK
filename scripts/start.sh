#!/usr/bin/env bash

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "Starting RATEL.DECK console..."
echo ""

command -v node >/dev/null 2>&1 || {
  echo "[ERR] Node.js not found"
  exit 1
}

node "$ROOT_DIR/start.js"
