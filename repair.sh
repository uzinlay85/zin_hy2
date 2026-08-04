#!/usr/bin/env bash
# =============================================================
#  Hysteria 2 VPN Portal - Repair Script
#  Checks and fixes: Permissions, PM2, SQLite, Nginx, SSL, Firewall
#  https://github.com/uzinlay85/zin_hy2
# =============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

OK()   { echo -e "  ${GREEN}[✓]${NC} $1"; }
FAIL() { echo -e "  ${RED}[✗]${NC} $1"; }
FIX()  { echo -e "  ${YELLOW}[→]${NC} $1"; }
step() { echo -e "\n${BOLD}${CYAN}── $1 ──${NC}"; }

ERRORS=0

echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   Hysteria 2 VPN Portal - Repair Script   ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$INSTALL_DIR/backend"
DB_PATH="$BACKEND_DIR/hysteria.db"

# ── 1. Permissions ────────────────────────────────────────────
step "Checking Permissions"
APP_USER="${SUDO_USER:-$(logname 2>/dev/null || echo $USER)}"

if [[ -d "$BACKEND_DIR" ]]; then
  BACKEND_PERM=$(stat -c "%a" "$BACKEND_DIR" 2>/dev/null || stat -f "%Lp" "$BACKEND_DIR" 2>/dev/null)
  if [[ "$BACKEND_PERM" == "750" || "$BACKEND_PERM" == "755" ]]; then
    OK "Backend dir permissions OK ($BACKEND_PERM)"
  else
    FIX "Fixing backend dir permissions ($BACKEND_PERM → 750)"
    chmod 750 "$BACKEND_DIR"
    chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR" 2>/dev/null || true
    OK "Permissions fixed"
  fi
else
  FAIL "Backend directory not found at $BACKEND_DIR"
  ((ERRORS++))
fi

if [[ -f "$DB_PATH" ]]; then
  DB_PERM=$(stat -c "%a" "$DB_PATH" 2>/dev/null || stat -f "%Lp" "$DB_PATH" 2>/dev/null)
  if [[ "$DB_PERM" == "640" || "$DB_PERM" == "644" || "$DB_PERM" == "666" ]]; then
    if [[ "$DB_PERM" == "666" ]]; then
      FIX "Fixing database permissions (666 → 640)"
      chmod 640 "$DB_PATH"
      OK "Database permissions fixed"
    else
      OK "Database permissions OK ($DB_PERM)"
    fi
  else
    FIX "Setting database permissions → 640"
    chmod 640 "$DB_PATH"
    OK "Database permissions set"
  fi
fi

# ── 2. PM2 / Web UI ──────────────────────────────────────────
step "Checking Web UI (PM2)"
if pm2 describe hysteria-ui 2>/dev/null | grep -q "online"; then
  OK "hysteria-ui is running (online)"
else
  FAIL "hysteria-ui is not running"
  FIX "Attempting to restart..."
  cd "$BACKEND_DIR"
  pm2 restart hysteria-ui 2>/dev/null || pm2 start server.js --name hysteria-ui
  sleep 2
  if pm2 describe hysteria-ui 2>/dev/null | grep -q "online"; then
    OK "hysteria-ui restarted successfully"
  else
    FAIL "Could not start hysteria-ui — check: pm2 logs hysteria-ui"
    ((ERRORS++))
  fi
fi

# ── 3. SQLite Database ────────────────────────────────────────
step "Checking SQLite Database"
if [[ -f "$DB_PATH" ]]; then
  if sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" &>/dev/null; then
    USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "?")
    OK "Database OK — $USER_COUNT user(s)"
  else
    FAIL "Database is corrupt or inaccessible"
    FIX "Attempting permission fix..."
    chown "$APP_USER:$APP_USER" "$DB_PATH" 2>/dev/null || true
    chmod 640 "$DB_PATH"
    pm2 restart hysteria-ui 2>/dev/null || true
    ((ERRORS++))
  fi
else
  FIX "Database not found — it will be created on next PM2 start"
fi

# ── 4. Nginx ──────────────────────────────────────────────────
step "Checking Nginx"
if systemctl is-active --quiet nginx; then
  OK "Nginx is running"
  if nginx -t &>/dev/null; then
    OK "Nginx config is valid"
  else
    FAIL "Nginx config has errors"
    FIX "Attempting reload after re-test..."
    nginx -t
    ((ERRORS++))
  fi
else
  FAIL "Nginx is not running"
  FIX "Starting Nginx..."
  systemctl start nginx && OK "Nginx started" || { FAIL "Could not start Nginx"; ((ERRORS++)); }
fi

# ── 5. SSL Certificates ───────────────────────────────────────
step "Checking SSL Certificates"
CERT_DIR="/etc/letsencrypt/live"
if [[ -d "$CERT_DIR" ]]; then
  DOMAINS=$(ls "$CERT_DIR" 2>/dev/null | grep -v "README")
  if [[ -n "$DOMAINS" ]]; then
    for d in $DOMAINS; do
      CERT_FILE="$CERT_DIR/$d/fullchain.pem"
      if [[ -f "$CERT_FILE" ]]; then
        EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_FILE" 2>/dev/null | cut -d= -f2)
        OK "SSL cert for $d — expires: $EXPIRY"
      fi
    done
    # Fix cert read permissions for Hysteria
    chmod -R 755 /etc/letsencrypt/archive 2>/dev/null || true
    chmod -R 755 /etc/letsencrypt/live 2>/dev/null || true
    OK "SSL cert permissions OK"
  else
    FAIL "No SSL certificates found in $CERT_DIR"
    ((ERRORS++))
  fi
else
  FAIL "Let's Encrypt directory not found"
  ((ERRORS++))
fi

# ── 6. Hysteria 2 ─────────────────────────────────────────────
step "Checking Hysteria 2"
if systemctl is-active --quiet hysteria-server; then
  OK "Hysteria 2 server is running"
else
  FAIL "Hysteria 2 server is not running"
  FIX "Attempting restart..."
  systemctl restart hysteria-server && OK "Hysteria 2 restarted" || {
    FAIL "Could not restart Hysteria 2"
    FIX "Check logs: sudo journalctl -u hysteria-server.service -n 50"
    ((ERRORS++))
  }
fi

# Traffic API check
if curl -sf http://127.0.0.1:4000/traffic &>/dev/null; then
  OK "Traffic API (port 4000) is reachable"
else
  FAIL "Traffic API not reachable — Hysteria may still be starting"
fi

# ── 7. Firewall ───────────────────────────────────────────────
step "Checking Firewall (UFW)"
UFW_STATUS=$(ufw status 2>/dev/null | head -1)
if echo "$UFW_STATUS" | grep -q "active"; then
  OK "UFW is active"
  for PORT in "80/tcp" "443/tcp" "443/udp"; do
    if ufw status | grep -q "$PORT"; then
      OK "Port $PORT is open"
    else
      FIX "Opening port $PORT"
      ufw allow "$PORT" &>/dev/null
    fi
  done
else
  FAIL "UFW is not active"
  FIX "Enabling UFW..."
  ufw allow OpenSSH &>/dev/null
  ufw allow 80/tcp &>/dev/null
  ufw allow 443/tcp &>/dev/null
  ufw allow 443/udp &>/dev/null
  ufw --force enable &>/dev/null && OK "UFW enabled" || { FAIL "Could not enable UFW"; ((ERRORS++)); }
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo -e "${BOLD}${GREEN}  ✓ All checks passed — system is healthy!${NC}"
else
  echo -e "${BOLD}${YELLOW}  ⚠ Repair complete with $ERRORS issue(s) remaining.${NC}"
  echo -e "  Check the items marked ${RED}[✗]${NC} above."
fi

echo ""
echo -e "  Admin URL: "
cd "$INSTALL_DIR"
bash show_url.sh 2>/dev/null || true
