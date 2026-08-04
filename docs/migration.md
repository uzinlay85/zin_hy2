# Migration Guide — Moving to a New Server

If your VPS IP is blocked or throttled, you can migrate to a new server without requiring users to update their VPN keys.

---

## Method 1: Web UI (Easiest)

1. **Old Server:** Go to Web UI ⚙️ Settings → click **[ Download Backup ]**. Save `hysteria_backup.db`.
2. **New Server:** Complete full installation using `install.sh`.
3. **New Server:** Go to Web UI ⚙️ Settings → click **[ Upload & Restore ]** → select your `hysteria_backup.db`.
4. **Cloudflare:** Update your domain's DNS A Record to the New Server IP.
5. Wait for DNS propagation. All users will reconnect automatically!

---

## Method 2: Command Line

Use the included `migration.sh` script:

```bash
# On the OLD server — create a backup:
cd ~/zin_hy2
bash migration.sh backup
# Download the generated hysteria_backup.db via SFTP/WinSCP

# On the NEW server — restore from backup:
# (Upload hysteria_backup.db to ~/zin_hy2 first)
cd ~/zin_hy2
bash migration.sh restore
```

---

## DNS Propagation

After changing your DNS A Record, it may take **5–30 minutes** for changes to propagate globally. During this time, some users may be unable to connect. Once propagation is complete, all users will reconnect automatically using the same VPN keys.
