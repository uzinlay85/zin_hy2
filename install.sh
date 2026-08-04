#!/usr/bin/env bash
# =============================================================
#  Hysteria 2 VPN Portal - One-Click Installer
#  https://github.com/uzinlay85/zin_hy2
# =============================================================
set -e

# ── Colors ────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗] ERROR: $1${NC}"; exit 1; }
step() { echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}"; }

# ── Banner ────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
cat << 'BANNER'
  ╔══════════════════════════════════════════╗
  ║   Hysteria 2 VPN Portal - Auto Installer  ║
  ║   github.com/uzinlay85/zin_hy2           ║
  ╚══════════════════════════════════════════╝
BANNER
echo -e "${NC}"

# ── Root check ────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  fail "This script must be run as root. Use: sudo bash install.sh"
fi

# ── OS check ─────────────────────────────────────────────────
if ! grep -qiE "ubuntu|debian" /etc/os-release 2>/dev/null; then
  warn "This installer is tested on Ubuntu/Debian. Proceeding anyway..."
fi

# ── Collect user input ────────────────────────────────────────
step "Configuration"
echo ""

read -p "  Enter your Domain Name (e.g. vpn.example.com): " DOMAIN
[[ -z "$DOMAIN" ]] && fail "Domain cannot be empty."

read -p "  Enter your Email (for SSL certificate): " EMAIL
[[ -z "$EMAIL" ]] && fail "Email cannot be empty."

read -p "  Enable Port Hopping (20000-50000)? [Y/n]: " PORT_HOP_INPUT
PORT_HOP_INPUT="${PORT_HOP_INPUT:-Y}"
[[ "$PORT_HOP_INPUT" =~ ^[Yy]$ ]] && ENABLE_PORT_HOP=true || ENABLE_PORT_HOP=false

echo ""
echo -e "  ${BOLD}Summary:${NC}"
echo -e "  Domain      : ${CYAN}$DOMAIN${NC}"
echo -e "  Email       : ${CYAN}$EMAIL${NC}"
echo -e "  Port Hopping: ${CYAN}$( $ENABLE_PORT_HOP && echo 'Enabled' || echo 'Disabled' )${NC}"
echo ""
read -p "  Continue? [Y/n]: " CONFIRM
CONFIRM="${CONFIRM:-Y}"
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { info "Cancelled."; exit 0; }

# ── Variables ─────────────────────────────────────────────────
# INSTALL_DIR set above based on APP_USER
# Determine the real (non-root) user who invoked this script
if [[ -n "$SUDO_USER" ]]; then
  APP_USER="$SUDO_USER"
  APP_HOME=$(getent passwd "$SUDO_USER" | cut -d: -f6)
else
  # Running directly as root (ssh root@server)
  APP_USER="root"
  APP_HOME="/root"
fi
INSTALL_DIR="$APP_HOME/zin_hy2"

# ── Step 1: System packages ───────────────────────────────────
step "1/9  Installing System Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl wget ufw nginx certbot python3-certbot-nginx \
  sqlite3 build-essential git
log "System packages installed"

# ── Step 2: Node.js 22.x ──────────────────────────────────────
step "2/9  Installing Node.js 22.x"
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - &>/dev/null
  apt-get install -y -qq nodejs
fi
npm install -g pm2 --quiet
log "Node.js $(node -v) and PM2 installed"

# ── Step 3: Network tuning ────────────────────────────────────
step "3/9  Network Tuning (UDP Buffer)"
if ! grep -q "rmem_max=8388608" /etc/sysctl.conf 2>/dev/null; then
  echo "net.core.rmem_max=8388608" >> /etc/sysctl.conf
  echo "net.core.wmem_max=8388608" >> /etc/sysctl.conf
  sysctl -p &>/dev/null
fi
log "UDP buffer sizes configured"

# ── Step 4: Clone / update repo ───────────────────────────────
step "4/9  Cloning Repository"
if [[ -d "$INSTALL_DIR" ]]; then
  warn "Existing install found at $INSTALL_DIR — removing and re-cloning..."
  pm2 stop hysteria-ui 2>/dev/null || true
  pm2 delete hysteria-ui 2>/dev/null || true
  rm -rf "$INSTALL_DIR"
fi
git clone https://github.com/uzinlay85/zin_hy2.git "$INSTALL_DIR" --quiet
log "Repository cloned to $INSTALL_DIR"

# ── Step 5: Install dependencies & build frontend (BEFORE chmod) ───
step "5/9  Installing Dependencies & Building Frontend"

[[ -d "$INSTALL_DIR/backend" ]] || fail "Backend directory not found: $INSTALL_DIR/backend"
[[ -d "$INSTALL_DIR/frontend" ]] || fail "Frontend directory not found: $INSTALL_DIR/frontend"

pushd "$INSTALL_DIR/backend" > /dev/null
npm install --quiet
popd > /dev/null

pushd "$INSTALL_DIR/frontend" > /dev/null
npm install --quiet
npm run build --quiet
popd > /dev/null

log "Backend and Frontend ready"

# ── Step 6: Set permissions (AFTER npm install so nothing is blocked) ──
step "6/9  Fixing Permissions"
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR"
chmod 750 "$INSTALL_DIR/backend"
[[ -f "$INSTALL_DIR/backend/hysteria.db" ]] && chmod 640 "$INSTALL_DIR/backend/hysteria.db"
log "Permissions set (750 backend, 640 database)"

# ── Step 7: Hysteria 2 ──────────────────────────────────────────────
step "7/9  Installing Hysteria 2"
if ! command -v hysteria &>/dev/null; then
  bash <(curl -fsSL https://get.hy2.sh/) &>/dev/null
  log "Hysteria 2 installed: $(hysteria version 2>&1 | head -1)"
else
  log "Hysteria 2 already installed: $(hysteria version 2>&1 | head -1)"
fi

# ── Step 8: Nginx + SSL ───────────────────────────────────────
step "8/9  Configuring Nginx & SSL"
cat > /etc/nginx/sites-available/zin_hy2 << NGINX_EOF
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/zin_hy2 /etc/nginx/sites-enabled/
nginx -t &>/dev/null || fail "Nginx config test failed!"
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" \
  --redirect &>/dev/null || {
  warn "Certbot failed. Check DNS is pointing to this server. Continuing..."
}

# Fix cert permissions for Hysteria
chmod -R 755 /etc/letsencrypt/archive 2>/dev/null || true
chmod -R 755 /etc/letsencrypt/live 2>/dev/null || true
log "Nginx + SSL configured"

# ── Hysteria config.yaml ──────────────────────────────────────
cat > /etc/hysteria/config.yaml << HY2_EOF
listen: :443

tls:
  cert: /etc/letsencrypt/live/$DOMAIN/fullchain.pem
  key: /etc/letsencrypt/live/$DOMAIN/privkey.pem

auth:
  type: http
  http:
    url: http://127.0.0.1:3000/auth

acl:
  inline:
    - reject(127.0.0.0/8)
    - reject(10.0.0.0/8)
    - reject(172.16.0.0/12)
    - reject(192.168.0.0/16)
    - direct(all)

trafficStats:
  listen: 127.0.0.1:4000
HY2_EOF
systemctl enable hysteria-server &>/dev/null
systemctl restart hysteria-server
log "Hysteria 2 configured and started"

# ── Step 9: Firewall ──────────────────────────────────────────
step "9/9  Configuring Firewall"
ufw allow 80/tcp &>/dev/null
ufw allow 443/tcp &>/dev/null
ufw allow 443/udp &>/dev/null
ufw allow OpenSSH &>/dev/null

if $ENABLE_PORT_HOP; then
  ufw allow 20000:50000/udp &>/dev/null
  if ! grep -q "20000:50000" /etc/ufw/before.rules 2>/dev/null; then
    cat >> /etc/ufw/before.rules << 'UFW_EOF'
*nat
:PREROUTING ACCEPT [0:0]
-A PREROUTING -p udp --dport 20000:50000 -m conntrack ! --ctstate ESTABLISHED,RELATED -j REDIRECT --to-ports 443
COMMIT
UFW_EOF
  fi
  log "Port Hopping (20000-50000) enabled"
else
  log "Port Hopping disabled"
fi

ufw --force enable &>/dev/null
ufw reload &>/dev/null
log "Firewall configured"

# ── Start Web UI ──────────────────────────────────────────────
step "Starting Web UI with PM2"
pushd "$INSTALL_DIR/backend" > /dev/null
pm2 start server.js --name hysteria-ui
pm2 save --force

# Setup PM2 startup (auto-start on reboot) — wrap entirely in || true so set -e won't kill the script
if [[ "$APP_USER" == "root" ]]; then
  pm2 startup systemd -u root --hp /root &>/dev/null || true
else
  # Run as root (we are root), generate startup for the real user
  PM2_STARTUP=$(pm2 startup systemd -u "$APP_USER" --hp "$APP_HOME" 2>&1 | grep '^sudo' || true)
  if [[ -n "$PM2_STARTUP" ]]; then
    eval "$PM2_STARTUP" &>/dev/null || true
  fi
fi
pm2 save --force || true
log "PM2 started and configured for auto-restart"

sleep 2
pm2 restart hysteria-ui &>/dev/null || true
popd > /dev/null

# ── Show result ───────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║        ✓ Installation Complete!          ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "  ${BOLD}Your Secret Admin URL:${NC}"
bash "$INSTALL_DIR/show_url.sh" 2>/dev/null || \
  echo -e "  ${CYAN}Run: cd ~/zin_hy2 && bash show_url.sh${NC}"
echo ""
echo -e "  Default login:  ${BOLD}admin / admin${NC}"
echo -e "  ${YELLOW}⚠ Please change your password immediately after login!${NC}"
echo ""
