#!/usr/bin/env bash
set -u

echo "=== GIT STATE ==="
git status
git log --oneline --max-count=8
git branch --show-current
git remote -v
echo

echo "=== .REPLIT (first 100 lines) ==="
sed -n '1,100p' .replit
echo

echo "=== START SCRIPT (key lines) ==="
sed -n '1,220p' scripts/replit-start.sh
echo

echo "=== VITE CONFIG (key lines) ==="
sed -n '1,160p' artifacts/candy-crackzzz/vite.config.ts
echo

echo "=== PACKAGE SCRIPTS ==="
node -e "const p=require('./artifacts/candy-crackzzz/package.json'); console.log(p.scripts)"
echo

echo "=== PROCESS CHECK ==="
pgrep -af "proxy-server|vite|api-server|replit-start|node --enable-source-maps|pnpm" || true
echo

echo "=== LOCAL ROUTE CHECKS ==="
curl -i http://127.0.0.1:5000/ | sed -n '1,20p' || true
echo "--- API direct ---"
curl -i http://127.0.0.1:3001/api/cc/bootstrap | sed -n '1,20p' || true
echo "--- API through Vite ---"
curl -i http://127.0.0.1:5000/api/cc/bootstrap | sed -n '1,20p' || true
echo "--- 5001 should NOT be active ---"
curl -i http://127.0.0.1:5001/ | sed -n '1,20p' || true
echo

echo "=== OLD PROXY / 5001 REFERENCES ==="
grep -R "proxy-server\\|5001\\|PREVIEW_PROXY\\|VITE_TARGET" -n .replit scripts artifacts/candy-crackzzz/vite.config.ts artifacts/candy-crackzzz/package.json || true
echo

echo "=== INTERPRETATION GUIDE ==="
echo "5000 must return HTML, 3001/api/cc/bootstrap must return JSON, 5001 should fail, and proxy-server should not appear in the active process list."