#!/usr/bin/env bash
# =============================================================
#  Hysteria 2 VPN Portal - Uninstall Script
#  Completely removes Hysteria 2 and the Web UI from your server
#  https://github.com/uzinlay85/zin_hy2
# =============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
step() { echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}"; }

echo -e "${BOLD}${RED}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   Hysteria 2 VPN Portal - Uninstall       ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

warn "This will COMPLETELY remove Hysteria 2 and the Web UI."
warn "Your database and all VPN keys will be DELETED."
echo ""
read -p "  Type 'yes' to confirm uninstall: " CONFIRM
[[ "$CONFIRM" == "yes" ]] || { info "Uninstall cancelled."; exit 0; }

echo ""

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Step 1: Stop & remove Web UI ──────────────────────────────
step "1/4  Removing Web UI (PM2)"
pm2 stop hysteria-ui 2>/dev/null && log "PM2 process stopped" || warn "PM2 process not found"
pm2 delete hysteria-ui 2>/dev/null && log "PM2 process deleted" || true
pm2 save 2>/dev/null || true

# ── Step 2: Remove files ──────────────────────────────────────
step "2/4  Removing Web UI Files"
if [[ -d "$INSTALL_DIR" && "$INSTALL_DIR" != "/" ]]; then
  rm -rf "$INSTALL_DIR"
  log "Removed $INSTALL_DIR"
fi

# ── Step 3: Remove Hysteria 2 ─────────────────────────────────
step "3/4  Removing Hysteria 2 Server"
systemctl stop hysteria-server 2>/dev/null && log "Hysteria 2 stopped" || warn "Hysteria 2 was not running"
systemctl disable hysteria-server 2>/dev/null && log "Hysteria 2 disabled" || true
rm -f /etc/systemd/system/hysteria-server.service
rm -rf /etc/hysteria
rm -f /usr/local/bin/hysteria
systemctl daemon-reload
log "Hysteria 2 removed"

# ── Step 4: Remove Nginx config ───────────────────────────────
step "4/4  Removing Nginx Configuration"
rm -f /etc/nginx/sites-available/zin_hy2
rm -f /etc/nginx/sites-enabled/zin_hy2
systemctl restart nginx 2>/dev/null && log "Nginx restarted" || warn "Could not restart Nginx"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ✓ Uninstall complete!${NC}"
echo ""
info "Note: Node.js, PM2, Nginx, Certbot, UFW, and SSL certificates were kept."
info "To remove SSL certs: sudo certbot delete"
info "To remove Nginx:     sudo apt remove nginx"
info "To remove Node.js:   sudo apt remove nodejs"
