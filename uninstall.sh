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
echo -e "${YELLOW}🧹 စနစ်ဟောင်းများကို အရှင်းဖျက်နေပါသည်...${NC}"

# ── ၁။ PM2 (Backend) ကို ရပ်တန့်ပြီး ဖျက်ပစ်ခြင်း ────────────
step "1/4  Stopping & Removing Web UI (PM2)"
pm2 stop hysteria-ui 2>/dev/null || true
pm2 delete hysteria-ui 2>/dev/null || true
pm2 save --force 2>/dev/null || true
log "PM2 process stopped and removed"

# ── ၂။ Hysteria 2 Server ကို ရပ်တန့်ပြီး ဖျက်ပစ်ခြင်း ─────────
step "2/4  Removing Hysteria 2 Server"
sudo systemctl stop hysteria-server 2>/dev/null || true
sudo systemctl disable hysteria-server 2>/dev/null || true
sudo rm -rf /etc/hysteria
sudo rm -f /usr/local/bin/hysteria
sudo rm -f /etc/systemd/system/hysteria-server.service
sudo rm -f /etc/systemd/system/hysteria-server@.service
sudo systemctl daemon-reload
log "Hysteria 2 server removed"

# ── ၃။ Nginx Configuration များကို ဖျက်ပစ်ခြင်း ──────────────
step "3/4  Removing Nginx Configuration"
sudo rm -f /etc/nginx/sites-available/zin_hy2
sudo rm -f /etc/nginx/sites-enabled/zin_hy2
sudo systemctl restart nginx 2>/dev/null && log "Nginx restarted" || warn "Could not restart Nginx"

# ── ၄။ Project Folder ကြီးတစ်ခုလုံးကို အရှင်းဖျက်ပစ်ခြင်း ─────
step "4/4  Removing Project Files"
cd ~
sudo rm -rf ~/zin_hy2
log "Project folder removed"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}✅ အားလုံး အစအနမကျန် အရှင်းလင်းသွားပါပြီ!${NC}"
echo ""
info "Note: Node.js, PM2, Nginx, Certbot, UFW, and SSL certificates were kept."
info "To remove SSL certs: sudo certbot delete"
info "To remove Nginx:     sudo apt remove nginx"
info "To remove Node.js:   sudo apt remove nodejs"
