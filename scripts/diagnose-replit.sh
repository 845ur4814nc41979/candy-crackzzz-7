#!/usr/bin/env bash
# Candy CrackZZZ — Replit routing diagnostic
# Non-destructive: reads only, no kills, no restarts, no file edits.
# Run from repo root: bash scripts/diagnose-replit.sh

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BOLD='\033[1m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

section()   { echo; echo -e "${YELLOW}══════════════════════════════════════════"; echo -e "  $1"; echo -e "══════════════════════════════════════════${NC}"; }
ok()        { echo -e "  ${GREEN}✓ $*${NC}"; }
fail()      { echo -e "  ${RED}✗ $*${NC}"; }
warn()      { echo -e "  ${YELLOW}⚠ $*${NC}"; }
info()      { echo -e "  ${CYAN}· $*${NC}"; }


# ─────────────────────────────────────────────────────────────────────────────
# 1. GIT STATE
# ─────────────────────────────────────────────────────────────────────────────
section "1. GIT STATE"
echo -e "${BOLD}Branch:${NC}"
git --no-optional-locks branch --show-current 2>/dev/null || echo "  (unknown)"

echo -e "\n${BOLD}Recent commits:${NC}"
git --no-optional-locks log --oneline --decorate --max-count=8 2>/dev/null || echo "  (unavailable)"

echo -e "\n${BOLD}Working tree:${NC}"
git --no-optional-locks status --short 2>/dev/null || echo "  (unavailable)"


# ─────────────────────────────────────────────────────────────────────────────
# 2. REPLIT ENVIRONMENT VALUES
# ─────────────────────────────────────────────────────────────────────────────
section "2. REPLIT ENVIRONMENT VALUES"
echo -e "${BOLD}Helium/microVM:${NC}"
info "REPLIT_IN_MICROVM         = ${REPLIT_IN_MICROVM:-<not set>}"
info "REPLIT_HELIUM_ENABLED     = ${REPLIT_HELIUM_ENABLED:-<not set>}"

echo -e "\n${BOLD}Port env vars (from userenv.shared — controls everything):${NC}"
info "FRONTEND_PORT             = ${FRONTEND_PORT:-<not set>}  (artifact Vite binds here)"
info "API_PORT                  = ${API_PORT:-<not set>}        (Vite proxy target + API listen)"
info "PORT                      = ${PORT:-<not set>}"
info "PREVIEW_PROXY_PORT        = ${PREVIEW_PROXY_PORT:-<not set>}"
info "VITE_TARGET_PORT          = ${VITE_TARGET_PORT:-<not set>}"

echo -e "\n${BOLD}Replit runtime:${NC}"
info "REPLIT_ARTIFACT_ROUTER    = ${REPLIT_ARTIFACT_ROUTER:-<not set>}"
info "REPLIT_DEV_DOMAIN         = ${REPLIT_DEV_DOMAIN:-<not set>}"
info "REPLIT_SLUG               = ${REPLIT_SLUG:-<not set>}"
info "REPLIT_OWNER              = ${REPLIT_OWNER:-<not set>}"

echo -e "\n${BOLD}Expected values (current correct state):${NC}"
EXPECTED_FE=5001
EXPECTED_API=3001
FE_VAL="${FRONTEND_PORT:-<not set>}"
API_VAL="${API_PORT:-<not set>}"
if [ "$FE_VAL" = "$EXPECTED_FE" ]; then
  ok "FRONTEND_PORT=$FE_VAL matches artifact.toml localPort $EXPECTED_FE"
else
  warn "FRONTEND_PORT=$FE_VAL — artifact.toml expects $EXPECTED_FE. If userenv changed, update artifact.toml."
fi
if [ "$API_VAL" = "$EXPECTED_API" ]; then
  ok "API_PORT=$API_VAL matches artifact.toml localPort $EXPECTED_API"
else
  warn "API_PORT=$API_VAL — artifact.toml expects $EXPECTED_API. If userenv changed, update both artifact.toml files."
fi


# ─────────────────────────────────────────────────────────────────────────────
# 3. RUNNING PROCESSES
# ─────────────────────────────────────────────────────────────────────────────
section "3. RUNNING PROCESSES"

procs="$(pgrep -af "artifact-router|vite.js|proxy-server|replit-start|node --enable-source-maps|pnpm" 2>/dev/null | grep -v "pgrep\|bash --rcfile\|diagnose-replit" || true)"
if [ -z "$procs" ]; then
  warn "No matching processes found — both workflows may be stopped."
else
  echo "$procs"
fi

echo
if echo "$procs" | grep -q "artifact-router"; then
  ok "artifact-router is running (visible in this shell)"
  if echo "$procs" | grep -q "previewMode=true"; then
    ok "artifact-router has previewMode=true → public URL should be registered"
  else
    warn "artifact-router previewMode not visible in args (may still be true if started via goval)"
  fi
else
  warn "artifact-router not visible from this shell — this is NORMAL when it runs inside"
  info "the 'artifacts/candy-crackzzz: web' workflow process namespace."
  info "Check public URL in section 5 to confirm routing is working despite this."
fi

if echo "$procs" | grep -q "proxy-server"; then
  fail "proxy-server.cjs is running — this should not be active. Restart the Start application workflow."
else
  ok "proxy-server.cjs is NOT running — correct"
fi

if echo "$procs" | grep -q "vite.js"; then
  ok "Vite is running"
else
  warn "Vite does not appear to be running"
fi


# ─────────────────────────────────────────────────────────────────────────────
# 4. LOCAL PORT CHECKS
# ─────────────────────────────────────────────────────────────────────────────
section "4. LOCAL PORT CHECKS"

check_port() {
  local label="$1" url="$2" expect_active="$3"
  local code
  code="$(curl -so /dev/null -w "%{http_code}" --max-time 4 "$url" 2>/dev/null || echo "000")"
  if [ "$expect_active" = "yes" ]; then
    if [ "$code" = "200" ]; then
      ok "$label → HTTP $code"
    else
      fail "$label → HTTP $code (expected 200)"
    fi
  else
    if [ "$code" = "000" ] || [ "$code" = "FAIL" ]; then
      ok "$label → not active (correct)"
    else
      warn "$label → HTTP $code (unexpected — check if wrong process is running)"
    fi
  fi
}

echo -e "${BOLD}Port 5000 — Start application Vite (IDE embedded Preview):${NC}"
check_port "5000 /"                  "http://127.0.0.1:5000/"                 "yes"
check_port "5000 /api/cc/bootstrap"  "http://127.0.0.1:5000/api/cc/bootstrap" "yes"
curl -si http://127.0.0.1:5000/ 2>/dev/null | head -5 || true

echo -e "\n${BOLD}Port 5001 — Artifact workflow Vite (public URL):${NC}"
check_port "5001 /"                  "http://127.0.0.1:5001/"                 "yes"
check_port "5001 /api/cc/bootstrap"  "http://127.0.0.1:5001/api/cc/bootstrap" "yes"
curl -si http://127.0.0.1:5001/ 2>/dev/null | head -5 || true

echo -e "\n${BOLD}Port 3001 — API server (shared by both Vite proxies):${NC}"
check_port "3001 /api/cc/bootstrap"  "http://127.0.0.1:3001/api/cc/bootstrap" "yes"
curl -si http://127.0.0.1:3001/api/cc/bootstrap 2>/dev/null | head -5 || true


# ─────────────────────────────────────────────────────────────────────────────
# 5. PUBLIC URL CHECK
# ─────────────────────────────────────────────────────────────────────────────
section "5. PUBLIC URL CHECK"

PUBLIC_URL=""
if [ -n "${REPLIT_DEV_DOMAIN:-}" ]; then
  PUBLIC_URL="https://${REPLIT_DEV_DOMAIN}/"
elif [ -n "${REPLIT_SLUG:-}" ] && [ -n "${REPLIT_OWNER:-}" ]; then
  PUBLIC_URL="https://${REPLIT_SLUG}-00-${REPLIT_OWNER}.picard.replit.dev/"
fi

if [ -n "$PUBLIC_URL" ]; then
  info "Detected public URL: $PUBLIC_URL"
  PUB_CODE="$(curl -so /dev/null -w "%{http_code}" --max-time 8 "$PUBLIC_URL" 2>/dev/null || echo "000")"
  if [ "$PUB_CODE" = "200" ]; then
    ok "Public URL → HTTP $PUB_CODE"
  elif [ "$PUB_CODE" = "502" ]; then
    fail "Public URL → HTTP 502 — artifact-router not registered. Start the 'artifacts/candy-crackzzz: web' workflow."
  else
    warn "Public URL → HTTP $PUB_CODE"
  fi
  curl -si "$PUBLIC_URL" 2>/dev/null | head -6 || true
else
  warn "Could not auto-detect public URL. Manually test:"
  info "curl -si https://<your-repl-domain>.picard.replit.dev/ | head -6"
  info "It should return HTTP/2 200. If it returns 502, the artifact workflow is not running."
fi


# ─────────────────────────────────────────────────────────────────────────────
# 6. ARTIFACT CONFIG CHECKS
# ─────────────────────────────────────────────────────────────────────────────
section "6. ARTIFACT CONFIG PORT ALIGNMENT"

CC_TOML="artifacts/candy-crackzzz/.replit-artifact/artifact.toml"
API_TOML="artifacts/api-server/.replit-artifact/artifact.toml"

echo -e "${BOLD}candy-crackzzz artifact.toml — relevant lines:${NC}"
grep -n "localPort\|PORT\|run\|build" "$CC_TOML" 2>/dev/null || warn "$CC_TOML not found"

CC_LOCAL="$(grep 'localPort' "$CC_TOML" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "?")"
if [ "$CC_LOCAL" = "5001" ]; then
  ok "candy-crackzzz localPort=$CC_LOCAL matches FRONTEND_PORT=5001 from userenv"
else
  fail "candy-crackzzz localPort=$CC_LOCAL — should be 5001 (FRONTEND_PORT). Update artifact.toml."
fi

echo -e "\n${BOLD}api-server artifact.toml — relevant lines:${NC}"
grep -n "localPort\|PORT\|run\|build" "$API_TOML" 2>/dev/null || warn "$API_TOML not found"

API_LOCAL="$(grep 'localPort' "$API_TOML" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "?")"
API_ENV_PORT="$(grep -A1 '\[services\.env\]' "$API_TOML" 2>/dev/null | grep 'PORT' | grep -o '[0-9]*' | head -1 || echo "?")"
if [ "$API_LOCAL" = "3001" ]; then
  ok "api-server localPort=$API_LOCAL matches API_PORT=3001"
else
  fail "api-server localPort=$API_LOCAL — should be 3001 (API_PORT). Update artifact.toml."
fi
if [ "$API_ENV_PORT" = "3001" ]; then
  ok "api-server [services.env] PORT=$API_ENV_PORT — correct"
else
  warn "api-server [services.env] PORT=$API_ENV_PORT — should be 3001"
fi


# ─────────────────────────────────────────────────────────────────────────────
# 7. STARTUP SCRIPT CHECK
# ─────────────────────────────────────────────────────────────────────────────
section "7. STARTUP SCRIPT CHECK — scripts/replit-start.sh"

START_SH="scripts/replit-start.sh"
if [ ! -f "$START_SH" ]; then
  fail "$START_SH does not exist"
else
  # Only flag non-comment lines that actively start artifact-router
  ACTIVE_AR="$(grep -n "REPLIT_ARTIFACT_ROUTER\|artifact-router" "$START_SH" 2>/dev/null \
    | grep -v '^\s*#' | grep -v '^[0-9]*:#' || true)"
  if [ -n "$ACTIVE_AR" ]; then
    fail "artifact-router is ACTIVELY started in $START_SH — it must be removed."
    warn "Manual artifact-router = previewMode=false = public URL never registers."
    echo "$ACTIVE_AR"
  else
    ok "artifact-router is NOT actively started in $START_SH — correct"
    info "(Comment references explaining the design are fine and expected)"
  fi

  if grep -q "proxy-server" "$START_SH"; then
    fail "proxy-server.cjs is referenced in $START_SH — it must be removed."
    grep -n "proxy-server" "$START_SH"
  else
    ok "proxy-server.cjs is NOT in $START_SH — correct"
  fi

  info "$START_SH purpose: IDE embedded Preview pane only (port 5000 + API 3001)."
  info "Public picard.replit.dev URL is handled by 'artifacts/candy-crackzzz: web' workflow."
fi


# ─────────────────────────────────────────────────────────────────────────────
# 8. STALE REFERENCE SCAN
# ─────────────────────────────────────────────────────────────────────────────
section "8. STALE REFERENCE SCAN"

SCAN_FILES=(
  ".replit"
  "scripts/replit-start.sh"
  "scripts/diagnose-replit.sh"
  "artifacts/candy-crackzzz/.replit-artifact/artifact.toml"
  "artifacts/api-server/.replit-artifact/artifact.toml"
  "artifacts/candy-crackzzz/vite.config.ts"
)

echo -e "${BOLD}Scanning for stale/unexpected values:${NC}"
echo

scan_term() {
  local term="$1" note="$2"
  local hits
  hits="$(grep -rn "$term" "${SCAN_FILES[@]}" 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    echo -e "  ${YELLOW}[$term]${NC} → $note"
    echo "$hits" | sed 's/^/    /'
  fi
}

scan_term "proxy-server"      "SUSPICIOUS unless inside a comment. Remove from active startup."
scan_term "PREVIEW_PROXY_PORT" "Should be unset at startup (unset in replit-start.sh). Only in userenv.shared is OK."
scan_term "VITE_TARGET_PORT"   "Should be unset at startup. Only in userenv.shared is OK."
scan_term "25876"              "OLD artifact port. Should not appear anywhere — update to 5001."
scan_term "8080"               "OLD API port. Should not appear anywhere active — update to 3001."
scan_term "localPort = 5001"   "EXPECTED in candy-crackzzz artifact.toml. Suspicious elsewhere."
scan_term "localPort = 3001"   "EXPECTED in api-server artifact.toml. Suspicious elsewhere."
scan_term "localPort"          "All localPort entries for reference."
scan_term "FRONTEND_PORT"      "Should equal 5001 in artifact.toml [services.env] and userenv. replit-start.sh sets 5000 for local preview only."

echo
ok "Scan complete. Entries marked SUSPICIOUS need attention if they appear outside comments."


# ─────────────────────────────────────────────────────────────────────────────
# 9. PLAIN-ENGLISH DIAGNOSIS GUIDE
# ─────────────────────────────────────────────────────────────────────────────
section "9. DIAGNOSIS GUIDE"

cat <<'GUIDE'

  ARCHITECTURE REMINDER
  ─────────────────────
  "Start application" workflow
    → scripts/replit-start.sh
    → Vite on port 5000 + API on 3001
    → Controls: Replit IDE EMBEDDED PREVIEW pane only

  "artifacts/candy-crackzzz: web" artifact workflow
    → goval starts Vite with FRONTEND_PORT=5001
    → goval starts artifact-router with previewMode=true
    → artifact-router calls PublishPortRequest (gRPC) → registers public domain
    → Controls: PUBLIC picard.replit.dev URL only

  SYMPTOM → ACTION DECISION TREE
  ────────────────────────────────────────────────────────────────────

  PUBLIC URL returns 502 (even in incognito)
    → Do NOT touch React. Do NOT change products/features.
    → The app is fine. Routing registration is broken.
    → Step 1: Is "artifacts/candy-crackzzz: web" workflow running?
              If not → start it from the Workflows panel.
    → Step 2: Check artifact.toml port alignment (section 6 above).
              candy-crackzzz localPort must equal FRONTEND_PORT (currently 5001).
              api-server localPort and [services.env] PORT must equal API_PORT (currently 3001).
    → Step 3: Restart "artifacts/candy-crackzzz: web" workflow.
    → Step 4: curl -si https://<domain>/ | head -4 → confirm HTTP/2 200.
    → Step 5: If still 502, check whether artifact-router process exists (section 3).
              If artifact-router is missing, the artifact workflow failed to start.
              Read its logs in the Replit Workflows panel.

  EMBEDDED PREVIEW works but PUBLIC URL is 502
    → "Start application" is healthy. Only the artifact workflow is broken.
    → Follow PUBLIC URL 502 steps above.

  PUBLIC URL returns 200 but page is blank white
    → HTML loaded. Routing is working. This is a JavaScript problem.
    → Open browser DevTools → Console tab → look for red errors.
    → Run in console: document.getElementById('root').innerHTML.length
      If 0 → React never mounted → check main.tsx and AppContext bootstrap.
    → Check for full-screen overlay hiding #root.
    → Do NOT change ports or restart workflows.

  LOCAL port 5000 fails (embedded Preview broken)
    → Check "Start application" workflow logs for build errors or port conflicts.
    → Confirm Vite reads FRONTEND_PORT=5000 (set explicitly in replit-start.sh).
    → Check for stale processes holding port 5000 (section 3).
    → Restart "Start application" workflow.

  BOTH 5000 and public URL fail
    → API or Vite crashed. Check "Start application" logs for the crash.
    → Run: curl -si http://127.0.0.1:3001/api/cc/bootstrap | head -3
    → If API is also down, start there — Vite depends on it for /api proxy.

  ────────────────────────────────────────────────────────────────────
  WHAT NOT TO DO
  ────────────────────────────────────────────────────────────────────
  ✗ Do not edit React/product code when public URL is 502
  ✗ Do not manually start artifact-router from replit-start.sh
    (previewMode=false → never registers public URL)
  ✗ Do not re-add proxy-server.cjs
  ✗ Do not change ports when 5000 + 3001 are already returning 200
  ✗ Do not clear browser cache after incognito also gets 502
  ✗ Do not assume local 5000 = public URL health in Helium mode

GUIDE

echo -e "${YELLOW}══════════════════════════════════════════${NC}"
echo -e "${BOLD}  Diagnostic complete. Review any ${RED}✗${NC}${BOLD} or ${YELLOW}⚠${NC}${BOLD} lines above.${NC}"
echo -e "${YELLOW}══════════════════════════════════════════${NC}"
echo
