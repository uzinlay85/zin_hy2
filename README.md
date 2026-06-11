# Hysteria 2 VPN Management Portal

A modern, fast, and elegant Web UI for managing [Hysteria 2](https://v2.hysteria.network/) VPN users. Built with React (Vite), Express.js, and SQLite.

![Hysteria2 Portal](https://raw.githubusercontent.com/uzinlay85/zin_hy2/main/screenshot.png) *(Placeholder for screenshot)*

## Features

- 🎨 **Modern Glassmorphism UI**: Beautiful dark mode design with a responsive layout.
- 👥 **User Management**: Easily create and delete VPN access keys (username/password).
- ⏱️ **Time & Data Limits**: Set optional Data Limits (in GB) and Expiry Dates (in Days) for each user.
- 🟢 **Real-Time Status**: Monitor active connections with a real-time "Online" indicator and "Last Seen" timestamps.
- 📊 **Traffic Tracking**: Live tracking of data usage (TX/RX) via Hysteria's Traffic API.
- 🔗 **One-Click Links**: Automatically generates `hysteria2://` URI links with Port Hopping support (`&mport=20000-50000`).

## Prerequisites

- Ubuntu VPS (20.04 or 22.04 recommended)
- A Domain Name pointed to your VPS IP
- [Hysteria 2](https://v2.hysteria.network/docs/getting-started/Installation/) installed
- Node.js (v18+) & NPM
- Nginx & PM2

## Complete Setup Guide

### 1. Hysteria 2 Server Configuration
Edit your Hysteria 2 configuration file (`/etc/hysteria/config.yaml`):

```yaml
listen: :443
tls:
  cert: /etc/hysteria/fullchain.cer
  key: /etc/hysteria/private.key

auth:
  type: http
  http:
    url: http://127.0.0.1:3000/auth

masquerade:
  type: string
  string: "Welcome to Hysteria 2!"

# Required for real-time traffic monitoring
trafficStats:
  listen: 127.0.0.1:4000
```
*Restart Hysteria: `sudo systemctl restart hysteria-server`*

### 2. Configure Port Hopping (UFW & Iptables)
To support Port Hopping (20000-50000) alongside UFW, edit `/etc/ufw/before.rules`.
Add the following lines at the **very top** of the file (before `*filter`):

```text
*nat
:PREROUTING ACCEPT [0:0]
-A PREROUTING -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
COMMIT
```
*Reload UFW: `sudo ufw reload`*

### 3. Install Dependencies & Clone Repository
Install required packages:
```bash
sudo apt update
sudo apt install nodejs npm nginx -y
sudo npm install -g pm2
```

Clone the repository:
```bash
git clone https://github.com/uzinlay85/zin_hy2.git
cd zin_hy2
```

### 4. Setup the Backend
```bash
cd backend
npm install
pm2 start server.js --name hysteria-ui
pm2 save
```

### 5. Setup the Frontend (Optional if pre-built)
If the `dist` folder is not included, build the React frontend:
```bash
cd ../frontend
npm install
npm run build
```

### 6. Configure Nginx Reverse Proxy
Create a new Nginx configuration to serve the Web UI on port 80 (or 443).
Edit `/etc/nginx/sites-available/default`:

```nginx
server {
    listen 80;
    server_name your-domain.com; # Replace with your domain

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
*Restart Nginx: `sudo systemctl restart nginx`*

## Usage

1. Open your browser and navigate to `http://your-domain.com`.
2. Use the "Create New Key" section to add users.
3. Copy the generated `hysteria2://` link and paste it into your Hysteria client (Nekobox, v2rayN, Shadowrocket, etc.).

## Security Note

Currently, the Web UI is exposed without an admin login page. It is highly recommended to secure the Nginx proxy using **Basic Auth** or host it on a completely secret sub-path/port if deployed publicly.

## License
MIT License
