#!/usr/bin/env bash
set -euo pipefail

# Candy CrackZZZ Replit import starter
#
# Fresh-import port plan:
#   5000 = Vite frontend / Replit webview preview
#   3001 = Express/API server
#
# One workflow only: "Start application"
# waitForPort = 5000
# Do not start proxy-server.cjs. Do not start Vite on 5001.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Defensively unset stale userenv.shared values that .replit may still carry
# from the old proxy-server.cjs architecture. Even if .replit sets these, the
# exports below override them for all child processes so Vite always lands on 5000.
unset PREVIEW_PROXY_PORT VITE_TARGET_PORT 2>/dev/null || true
export FRONTEND_PORT=5000
export PORT=5000
export API_PORT=3001

LOCK_DIR="/tmp/candy-crackzzz-start.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Another Candy CrackZZZ startup is already running. Waiting quietly so we do not kill the active preview..."
  while ! curl -fsS "http://127.0.0.1:5000/" >/dev/null 2>&1; do
    sleep 1
  done
  echo "Preview is already available on port 5000. Holding workflow alive."
  tail -f /dev/null
fi
cleanup_lock() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup_lock EXIT

# If a previous workflow already has the app healthy, do not disrupt it.
if curl -fsS "http://127.0.0.1:5000/" >/dev/null 2>&1 && curl -fsS "http://127.0.0.1:3001/api/cc/bootstrap" >/dev/null 2>&1; then
  echo "Candy CrackZZZ is already healthy on ports 5000 and 3001. Holding workflow alive."
  tail -f /dev/null
fi

freeport() {
  local port="$1"
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  fi
  if [ -n "$pids" ]; then
    echo "Freeing port $port (pids: $pids)..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

# Free app ports only after the health check above so we do not kill a good run.
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

cleanup() {
  kill "${API_PID:-}" 2>/dev/null || true
  kill "${VITE_PID:-}" 2>/dev/null || true
}
trap 'cleanup; cleanup_lock' EXIT

echo "Starting API server on port 3001..."
PORT=3001 API_PORT=3001 pnpm --filter @workspace/api-server run dev &
API_PID=$!

echo "Starting Candy CrackZZZ Vite frontend directly on port 5000..."
FRONTEND_PORT=5000 PORT=5000 API_PORT=3001 pnpm --filter @workspace/candy-crackzzz run dev &
VITE_PID=$!

# Keep this workflow alive while either child process is alive.
wait -n "$API_PID" "$VITE_PID"
