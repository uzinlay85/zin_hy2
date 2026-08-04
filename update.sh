#!/usr/bin/env bash
# =============================================================
#  Hysteria 2 VPN Portal - Update Script
#  https://github.com/uzinlay85/zin_hy2
# =============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗] ERROR: $1${NC}"; exit 1; }
step() { echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}"; }

echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   Hysteria 2 VPN Portal - Update Script   ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
info "Install directory: $INSTALL_DIR"

# ── Step 1: Pull latest code ──────────────────────────────────
step "1/5  Pulling latest code from GitHub"
cd "$INSTALL_DIR"
git reset --hard
git pull
log "Code updated"

# ── Step 2: Update backend ────────────────────────────────────
step "2/5  Updating Backend"
cd "$INSTALL_DIR/backend"
npm install --quiet
log "Backend packages updated"

# ── Step 3: Fix permissions ───────────────────────────────────
step "3/5  Fixing Permissions"
APP_USER="${SUDO_USER:-$(logname 2>/dev/null || echo $USER)}"
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR" 2>/dev/null || \
  chown -R "$USER:$USER" "$INSTALL_DIR"
chmod 750 "$INSTALL_DIR/backend"
if [[ -f "$INSTALL_DIR/backend/hysteria.db" ]]; then
  chmod 640 "$INSTALL_DIR/backend/hysteria.db"
fi
log "Permissions fixed (750 backend, 640 database)"

# ── Step 4: Rebuild frontend ──────────────────────────────────
step "4/5  Rebuilding Frontend"
cd "$INSTALL_DIR/frontend"
npm install --quiet
npm run build --quiet
log "Frontend rebuilt"

# ── Step 5: Restart services ──────────────────────────────────
step "5/5  Restarting Services"
pm2 restart hysteria-ui 2>/dev/null || sudo pm2 restart hysteria-ui
systemctl restart nginx 2>/dev/null || sudo systemctl restart nginx
log "Services restarted"

# ── Show Admin URL ────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ✓ Update complete!${NC}"
echo ""
cd "$INSTALL_DIR"
bash show_url.sh
