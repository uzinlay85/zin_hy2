# Advanced Setup Guide (A to Z)

Complete step-by-step VPS setup guide for Hysteria 2 VPN Portal.

> **Note:** If you prefer a one-click installation, use `install.sh` instead.
> See the main [README](../README.md) for details.

---

## Pre-requisite

Before starting, make sure your **Domain Name** (e.g., `vpn.your-domain.com`) is already pointing to your VPS IP address via DNS A Record.

---

## 1. Install Required Packages

```bash
sudo apt update
sudo apt install curl wget ufw nginx certbot python3-certbot-nginx sqlite3 build-essential -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 2. Configure Nginx Reverse Proxy

> ⚠️ **Replace `your-domain.com` with your actual domain before running!**

```bash
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/zin_hy2
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF'
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/zin_hy2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 3. Generate SSL Certificate (HTTPS)

```bash
sudo certbot --nginx -d your-domain.com
```

Follow the on-screen prompts and choose to **Redirect all HTTP traffic to HTTPS**.

After Certbot finishes, your cert paths will be:
- **Cert:** `/etc/letsencrypt/live/your-domain.com/fullchain.pem`
- **Key:** `/etc/letsencrypt/live/your-domain.com/privkey.pem`

Grant Hysteria read access to certificates:
```bash
sudo chmod -R 755 /etc/letsencrypt/archive
sudo chmod -R 755 /etc/letsencrypt/live
```

---

## 4. Linux Network Tuning (UDP Buffer)

Hysteria 2 uses QUIC (UDP). Increase UDP buffer sizes for maximum speed:

```bash
echo "net.core.rmem_max=8388608" | sudo tee -a /etc/sysctl.conf
echo "net.core.wmem_max=8388608" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 5. Install Hysteria 2

```bash
bash <(curl -fsSL https://get.hy2.sh/)
hysteria version
```

Configure Hysteria 2 (`/etc/hysteria/config.yaml`):

> ⚠️ **Replace `your-domain.com` (2 places) with your actual domain!**

```bash
sudo bash -c 'cat << "EOF" > /etc/hysteria/config.yaml
listen: :443

tls:
  cert: /etc/letsencrypt/live/your-domain.com/fullchain.pem
  key: /etc/letsencrypt/live/your-domain.com/privkey.pem

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
EOF'
sudo systemctl restart hysteria-server
```

---

## 6. Configure Firewall & Port Hopping (UFW)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 20000:50000/udp
```

Add NAT rules for Port Hopping (20000-50000):

```bash
if ! grep -q "20000:50000" /etc/ufw/before.rules; then
  sudo bash -c 'cat << "EOF" >> /etc/ufw/before.rules
*nat
:PREROUTING ACCEPT [0:0]
-A PREROUTING -p udp --dport 20000:50000 -m conntrack ! --ctstate ESTABLISHED,RELATED -j REDIRECT --to-ports 443
COMMIT
EOF'
  sudo ufw reload
fi
```

---

## 7. Clone Repository & Install Dependencies

```bash
cd ~
rm -rf zin_hy2
git clone https://github.com/uzinlay85/zin_hy2.git
chown -R $USER:$USER ~/zin_hy2
chmod 750 ~/zin_hy2/backend
cd ~/zin_hy2/backend
npm install
```

---

## 8. Build the Frontend

```bash
cd ~/zin_hy2/frontend
npm install
npm run build
```

---

## 9. Start the Backend

```bash
cd ~/zin_hy2/backend
pm2 start server.js --name hysteria-ui
pm2 save
pm2 startup
```

> ⚠️ **Important:** Copy and run the `sudo env PATH=...` command that `pm2 startup` outputs, then run `pm2 save` again.

```bash
pm2 restart hysteria-ui
```

---

## Getting Your Admin URL

```bash
cd ~/zin_hy2
bash show_url.sh
```

Default login: **admin / admin** — change your password immediately after login!
