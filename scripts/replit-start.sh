#!/usr/bin/env bash
set -euo pipefail

# Candy CrackZZZ — "Start application" workflow
#
# This workflow serves the Replit IDE's embedded Preview pane (port 5000).
# It does NOT make the public dev-domain URL work in Helium/microVM mode.
#
# PUBLIC URL (*.picard.replit.dev) is handled exclusively by Replit's
# native "artifacts/candy-crackzzz: web" artifact workflow, which runs
# Vite on port 5001 (FRONTEND_PORT from userenv) and starts the
# artifact-router in previewMode=true via goval IPC, which then registers
# the domain with Replit's control plane (PublishPortRequest gRPC call).
#
# This "Start application" script only:
#   5000 = Vite dev (waitForPort=5000 → Replit Preview pane / HMR)
#   3001 = API dev (Vite /api proxy target)
#
# The artifact-router is intentionally NOT started here because:
#   - Without goval IPC context it runs in previewMode=false and never
#     calls PublishPortRequest, so it cannot make the public URL work.
#   - Its port 8000 listener would conflict with the artifact workflow's
#     own artifact-router when both run simultaneously.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

unset PREVIEW_PROXY_PORT VITE_TARGET_PORT 2>/dev/null || true
export FRONTEND_PORT=5000
export PORT=5000
export API_PORT=3001

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
  kill "${API_PID:-}" "${VITE_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting API dev server on port 3001 (for Vite /api proxy)..."
PORT=3001 API_PORT=3001 pnpm --filter @workspace/api-server run dev &
API_PID=$!

echo "Starting Vite dev server on port 5000 (Preview pane + HMR)..."
FRONTEND_PORT=5000 PORT=5000 API_PORT=3001 pnpm --filter @workspace/candy-crackzzz run dev &
VITE_PID=$!

wait -n "$API_PID" "$VITE_PID"
