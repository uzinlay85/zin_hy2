# Troubleshooting Guide

Common issues and how to fix them.

---

## Checking Status

| What to check | Command |
|---|---|
| Hysteria 2 status | `sudo systemctl status hysteria-server` |
| Hysteria 2 live logs | `sudo journalctl -u hysteria-server.service -n 50 -f` |
| Web UI status | `pm2 status` |
| Web UI error logs | `pm2 logs hysteria-ui` |
| Quick health check | `bash ~/zin_hy2/repair.sh` |

---

## Common Issues

### 1. SQLITE_READONLY Error

**Symptom:** Backend crashes or fails to save data.

**Fix:**
```bash
cd ~/zin_hy2
sudo chown -R $USER:$USER ~/zin_hy2
chmod 750 ~/zin_hy2/backend
chmod 640 ~/zin_hy2/backend/hysteria.db
pm2 restart hysteria-ui
```

Or simply run:
```bash
bash ~/zin_hy2/repair.sh
```

---

### 2. Port Hopping (20000-50000) Not Working / Timeout

**Cause:** Some VPS providers (e.g., RackNerd) have UDP Port Scan Protection at the hypervisor level, which blocks Port Hopping traffic.

**Solution:** Disable Port Hopping and use Port 443 directly.

**Step 1 — Remove NAT rules:**
```bash
sudo iptables -t nat -D PREROUTING -p udp --dport 20000:50000 -m conntrack ! --ctstate ESTABLISHED,RELATED -j REDIRECT --to-ports 443 2>/dev/null
sudo ufw reload
```

**Step 2 — Edit `/etc/ufw/before.rules`:**
```bash
sudo nano /etc/ufw/before.rules
```
Find and delete the entire `*nat` block that was added for Port Hopping, then save and reload:
```bash
sudo ufw reload
```

**Step 3 — Remove Port Hopping from VPN links in the Web UI:**
```bash
python3 -c "
import pathlib, os
p = pathlib.Path(os.path.expanduser('~/zin_hy2/frontend/src/App.jsx'))
p.write_text(p.read_text().replace('&mport=20000-50000', ''))
"
cd ~/zin_hy2/frontend && npm run build
pm2 restart hysteria-ui
```

VPN keys will now use Port 443 directly.

---

### 3. Nginx Not Starting

**Check config syntax:**
```bash
sudo nginx -t
```

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```

---

### 4. SSL Certificate Issues

**Renew certificate:**
```bash
sudo certbot renew
```

**Fix certificate permissions for Hysteria:**
```bash
sudo chmod -R 755 /etc/letsencrypt/archive
sudo chmod -R 755 /etc/letsencrypt/live
sudo systemctl restart hysteria-server
```

---

### 5. Web UI Not Starting After Reboot

PM2 auto-start was not configured. Run:
```bash
pm2 startup
# Copy and run the sudo env PATH=... command that appears
pm2 save
```

---

### 6. PM2 shows "sudo required"

If you installed PM2 as root, use `sudo` prefix:
```bash
sudo pm2 status
sudo pm2 logs hysteria-ui
sudo pm2 restart hysteria-ui
```
