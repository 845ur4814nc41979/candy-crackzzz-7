#!/usr/bin/env bash
set -euo pipefail

# Candy CrackZZZ Replit import starter
# This script repairs the two common white-screen causes after importing into a new Replit account:
# 1) missing node_modules
# 2) missing database tables for /api/cc/bootstrap

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Installing dependencies..."
pnpm install

echo "Creating/updating database tables..."
pnpm --filter @workspace/db run push

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
