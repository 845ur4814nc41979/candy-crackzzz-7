#!/usr/bin/env bash
# Candy CrackZZZ — Replit diagnostic script
# Non-destructive: does NOT kill processes or change any files.
# Run from the repo root: bash scripts/diagnose-replit.sh

set -u

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

section() { echo; echo -e "${YELLOW}========== $1 ==========${NC}"; }

# ── Git state ─────────────────────────────────────────────────────────────────
section "GIT STATE"
git --no-optional-locks log --oneline --decorate --max-count=12 2>/dev/null || git log --oneline --decorate --max-count=12
git --no-optional-locks status 2>/dev/null || echo "(git status unavailable)"
git branch --show-current 2>/dev/null || true
git remote -v 2>/dev/null || true

# ── .replit ───────────────────────────────────────────────────────────────────
section ".REPLIT (first 140 lines)"
sed -n '1,140p' .replit

# ── Start script ──────────────────────────────────────────────────────────────
section "START SCRIPT — scripts/replit-start.sh"
sed -n '1,220p' scripts/replit-start.sh

# ── Vite config ───────────────────────────────────────────────────────────────
section "VITE CONFIG — artifacts/candy-crackzzz/vite.config.ts"
sed -n '1,180p' artifacts/candy-crackzzz/vite.config.ts

# ── Package scripts ───────────────────────────────────────────────────────────
section "PACKAGE SCRIPTS"
echo "--- frontend ---"
node -e "const p=require('./artifacts/candy-crackzzz/package.json'); console.log(JSON.stringify(p.scripts,null,2))"
echo "--- api-server ---"
node -e "const p=require('./artifacts/api-server/package.json'); console.log(JSON.stringify(p.scripts,null,2))"

# ── Stale proxy / 5001 references ────────────────────────────────────────────
section "STALE PROXY / 5001 REFERENCES (should only appear as inactive/comment)"
grep -R "proxy-server\|5001\|PREVIEW_PROXY\|VITE_TARGET\|FRONTEND_PORT = \"5001\"" \
  -n .replit scripts \
  artifacts/candy-crackzzz/vite.config.ts \
  artifacts/candy-crackzzz/package.json \
  artifacts/api-server/package.json 2>/dev/null || echo "(none found)"

# ── Running processes ─────────────────────────────────────────────────────────
section "RUNNING PROCESSES"
pgrep -af "proxy-server|vite|api-server|replit-start|node --enable-source-maps|pnpm" 2>/dev/null || echo "(none matching)"

# ── Local HTTP checks ─────────────────────────────────────────────────────────
section "LOCAL HTTP CHECKS"

echo -e "\n${YELLOW}--- frontend 5000 ---${NC}"
HTTP5000=$(curl -so /dev/null -w "%{http_code}" http://127.0.0.1:5000/ 2>/dev/null || echo "FAIL")
if [ "$HTTP5000" = "200" ]; then
  echo -e "${GREEN}5000 → $HTTP5000 OK${NC}"
else
  echo -e "${RED}5000 → $HTTP5000 FAIL${NC}"
fi
curl -si http://127.0.0.1:5000/ 2>/dev/null | head -12 || true

echo -e "\n${YELLOW}--- API direct 3001 ---${NC}"
HTTP3001=$(curl -so /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/cc/bootstrap 2>/dev/null || echo "FAIL")
if [ "$HTTP3001" = "200" ]; then
  echo -e "${GREEN}3001/api/cc/bootstrap → $HTTP3001 OK${NC}"
else
  echo -e "${RED}3001/api/cc/bootstrap → $HTTP3001 FAIL${NC}"
fi
curl -si http://127.0.0.1:3001/api/cc/bootstrap 2>/dev/null | head -10 || true

echo -e "\n${YELLOW}--- API through Vite proxy 5000 ---${NC}"
HTTP5000API=$(curl -so /dev/null -w "%{http_code}" http://127.0.0.1:5000/api/cc/bootstrap 2>/dev/null || echo "FAIL")
if [ "$HTTP5000API" = "200" ]; then
  echo -e "${GREEN}5000/api/cc/bootstrap → $HTTP5000API OK${NC}"
else
  echo -e "${RED}5000/api/cc/bootstrap → $HTTP5000API FAIL${NC}"
fi

echo -e "\n${YELLOW}--- 5001 (should NOT be active) ---${NC}"
HTTP5001=$(curl -so /dev/null -w "%{http_code}" --max-time 2 http://127.0.0.1:5001/ 2>/dev/null || echo "FAIL/TIMEOUT")
if [ "$HTTP5001" = "FAIL/TIMEOUT" ] || [ "$HTTP5001" = "000" ]; then
  echo -e "${GREEN}5001 not active — correct${NC}"
else
  echo -e "${RED}5001 is active (status $HTTP5001) — something is wrong${NC}"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
section "INTERPRETATION GUIDE"
cat <<'EOF'
PASS state (fresh import should be healthy):
  ✓ 5000 returns 200 HTML        → Vite is up and serving the frontend
  ✓ 3001 returns 200 JSON        → API server is up
  ✓ 5000/api/cc/bootstrap 200    → Vite proxy to API is working
  ✗ 5001 should NOT be active    → No old proxy or Vite on wrong port
  ✗ proxy-server.cjs NOT in pgrep → Old proxy workaround not running

FAILURE decision tree:
  5000 fails → startup/workflow/port issue (check replit-start.sh, waitForPort)
  3001 fails → API server did not start (check api-server build/start logs)
  5001 active → Old proxy or wrong Vite port (check replit-start.sh and vite.config.ts)
  proxy-server in pgrep → Old startup path still active; restart the workflow

  5000 OK + public dev-domain 502:
    → Check .replit userenv.shared — FRONTEND_PORT must be "5000" not "5001"
    → Check localPort 5000 externalPort 80 is present in .replit
    → Check outputType = "webview" on the workflow metadata
    → Restart the workflow once; Replit public routing updates on workflow restart

  5000 OK + preview loads HTML + white screen:
    → React runtime crash. Check browser console for red errors.
    → The boot-level fallback in main.tsx should show a visible error panel.
    → Do NOT change ports. Fix the exact crashing component.

WHAT NOT TO DO:
  - Do not randomly restart repeatedly
  - Do not change ports when 5000 already returns HTML
  - Do not re-add proxy-server.cjs without proof direct Vite cannot work
  - Do not chase Replit routing after confirming the public dev-domain loads HTML
EOF
