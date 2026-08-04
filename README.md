# Hysteria 2 VPN Management Portal

A modern, fast, and elegant Web UI for managing [Hysteria 2](https://v2.hysteria.network/) VPN users.
Built with React (Vite), Express.js, and SQLite.

Hysteria 2 VPN အသုံးပြုသူများကို လွယ်ကူစွာ စီမံခန့်ခွဲနိုင်မည့် ခေတ်မီ Web UI။

---

## ✨ Features

- 🎨 **Modern Glassmorphism UI** — Beautiful dark mode design
- 🔒 **Secret Admin URL** — Hidden admin panel, not accessible from root domain
- 🛡️ **Rate Limiting** — Auto-blocks IPs after 5 failed login attempts (1 hour)
- 👥 **User Management** — Create, edit, suspend, and delete VPN keys
- ⏱️ **Time & Data Limits** — Set data caps (GB) and expiry dates (Days)
- 🟢 **Real-Time Online Status** — See who is connected right now
- 📊 **Traffic Tracking** — Live TX/RX usage per user
- 🔗 **One-Click Copy** — Auto-generates `hysteria2://` URI links with Port Hopping
- 🗂️ **Batch Key Creation** — Generate multiple VPN keys at once
- 💾 **Backup & Restore** — One-click database backup and restore via Web UI
- 🔄 **Server Migration** — Move to a new VPS without users updating their keys

---

## 🚀 Quick Install (One Command)

> ⚠️ **Pre-requisite:** Point your domain's DNS A Record to your VPS IP before running.

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/uzinlay85/zin_hy2/main/install.sh)
```

The installer will ask for your **domain**, **email**, and whether to enable **Port Hopping**, then automatically set up everything:

✓ Node.js · Nginx · SSL (Certbot) · Hysteria 2 · Firewall · PM2 · Web UI

**After install, get your Secret Admin URL:**
```bash
cd ~/zin_hy2 && bash show_url.sh
```

Default login: `admin` / `admin` — **Change your password immediately!**

---

## 🔧 Utility Scripts

| Script | Description |
|---|---|
| `bash install.sh` | Full one-click install on a fresh VPS |
| `bash update.sh` | Pull latest code, rebuild, and restart |
| `bash repair.sh` | Auto-diagnose and fix common issues |
| `bash uninstall.sh` | Completely remove everything |
| `bash migration.sh backup` | Backup the database from terminal |
| `bash migration.sh restore` | Restore the database from terminal |
| `bash show_url.sh` | Display your Secret Admin URL |

---

## 📖 Usage

1. Open your **Secret Admin URL** (from `show_url.sh`) in your browser
2. Login with your admin credentials
3. Use **"Create New Key"** to add users — set Data Limit (GB) and Expiry (Days)
4. Click **"Copy Link"** to get the `hysteria2://` URI
5. Paste the link into your VPN client (Nekobox, v2rayN, etc.)

---

## 🔄 How to Update

```bash
cd ~/zin_hy2
bash update.sh
```

---

## 🔁 Server Migration

See **[docs/migration.md](docs/migration.md)** for full instructions.

**Quick method (Web UI):**
1. Old server: Settings → **Download Backup**
2. New server: Run `install.sh`
3. New server: Settings → **Upload & Restore**
4. Update DNS A Record → done!

---

## 🛠️ Troubleshooting

Run the repair script first:
```bash
bash ~/zin_hy2/repair.sh
```

For detailed troubleshooting, see **[docs/troubleshooting.md](docs/troubleshooting.md)**.

**Quick status checks:**
```bash
sudo systemctl status hysteria-server   # Hysteria 2
pm2 status                              # Web UI
pm2 logs hysteria-ui                    # Web UI logs
```

---

## 📚 Documentation

| Guide | Description |
|---|---|
| [Advanced Setup](docs/advanced-setup.md) | Manual step-by-step installation guide |
| [Migration Guide](docs/migration.md) | How to move to a new VPS |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and fixes |

---

## 🔐 Security

- **Secret Admin URL** — Admin panel is hidden behind a random URL (e.g., `/admin_a1b2c3`)
- **Rate Limiting** — IP blocked for 1 hour after 5 failed login attempts
- **ACL Rules** — VPN users cannot access internal VPS services
- **JWT Auth** — All API endpoints are protected

### Permissions (Secure Defaults)
```
backend/          750  (rwxr-x---)
backend/hysteria.db  640  (rw-r-----)
```

---

## 📜 License

MIT License
