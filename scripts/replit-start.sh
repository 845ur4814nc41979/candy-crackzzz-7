#!/usr/bin/env bash
set -euo pipefail

# Candy CrackZZZ Replit import starter
# This script repairs the two common white-screen causes after importing into a new Replit account:
# 1) missing node_modules
# 2) missing database tables for /api/cc/bootstrap

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Free ports if anything is still holding them from a previous run
freeport() {
  local port="$1"
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Freeing port $port (pids: $pids)..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}
freeport 3001
freeport 5000

echo "Installing dependencies..."
pnpm install

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Creating/updating database tables..."
  pnpm --filter @workspace/db run push
else
  echo "DATABASE_URL not set; using file storage fallback"
fi

echo "Starting API server on port 3001..."
PORT=3001 pnpm --filter @workspace/api-server run dev &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Give the API a short head start so Vite proxy requests do not hit an unopened port.
sleep 3

echo "Starting Candy CrackZZZ frontend on port 5000..."
PORT=5000 pnpm --filter @workspace/candy-crackzzz run dev
