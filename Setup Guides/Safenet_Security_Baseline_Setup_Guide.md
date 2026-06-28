# Safenet Security Baseline (Server Hardening) Setup Guide

ဤလမ်းညွှန်သည် အလွတ်ဖြစ်နေသော Ubuntu/Debian VPS တစ်ခုအား လုံခြုံရေးအမြင့်ဆုံးဖြစ်စေရန် အလိုအလျောက် (Auto Bash Script) ဖြင့် တည်ဆောက်ပေးမည့် လမ်းညွှန်ဖြစ်ပါသည်။

## ဤ Script မှ အလိုအလျောက် လုပ်ဆောင်ပေးမည့် အချက်များ
1. **Timezone:** Server အချိန်ကို `Asia/Yangon` သို့ ပြောင်းပေးမည်။
2. **Swap File:** RAM မလောက်၍ Server ကျခြင်းမှ ကာကွယ်ရန် 4GB Swap File အလိုအလျောက် တည်ဆောက်ပေးမည်။
3. **OS Update:** System ကို နောက်ဆုံးထွက် Update များ ပြုလုပ်ပေးမည်။
4. **Essential Tools:** လိုအပ်သော `ufw, fail2ban, unattended-upgrades, htop` စသည်တို့ကို သွင်းပေးမည်။
5. **Secure User:** `root` အစား သုံးရန် သုံးစွဲသူ User အသစ်တစ်ခု ဆောက်ပေးပြီး Sudo (Admin) အခွင့်အရေး ပေးမည်။ 
6. **SSH Key:** ထို User သစ်အတွက် သင်၏ SSH Public Key ကို အလိုအလျောက် ထည့်သွင်းပေးမည်။
7. **SSH Hardening:** 
   - SSH Port အား Custom Port (ဥပမာ 2213) သို့ ပြောင်းမည်။
   - Password ဖြင့် Login ဝင်ခြင်းကို ပိတ်မည်။
   - `root` အကောင့်ဖြင့် တိုက်ရိုက်ဝင်ခြင်းကို ပိတ်မည်။
8. **Firewall & Fail2Ban:** UFW Firewall ကို အသက်သွင်းပြီး SSH Port, HTTP (80), HTTPS (443) များကိုသာ ဖွင့်မည်။ Fail2Ban ဖြင့် Hackers များအား Block လုပ်မည်။

---

## တပ်ဆင်နည်း အဆင့်ဆင့်

### အဆင့် (၁) - Script အား Server ထဲသို့ ရေးသားခြင်း
သင်၏ Server သို့ `root` အနေဖြင့် ဝင်ရောက်ပြီး အောက်ပါ Command များကို Copy ကူးထည့်ပါ။

```bash
cat > /root/safenet-security-baseline.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

USER_NAME="${USER_NAME:-zinko}"
SSH_PORT="${SSH_PORT:-2213}"
PUBLIC_KEY="${1:-${PUBLIC_KEY:-}}"

if [ -z "$PUBLIC_KEY" ]; then
  echo "ERROR: SSH public key is required."
  echo "Usage: sudo /root/safenet-security-baseline.sh 'ssh-ed25519 AAAA...'"
  exit 1
fi

if ! echo "$PUBLIC_KEY" | grep -Eq '^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp256) '; then
  echo "ERROR: PUBLIC_KEY does not look like a valid SSH public key."
  exit 1
fi

echo "==> Set Timezone to Asia/Yangon"
timedatectl set-timezone Asia/Yangon

echo "==> Configure 4GB Swap File"
if [ ! -f /swapfile ]; then
  # 4GB Swap file ဆောက်ခြင်း (fallocate မရပါက dd ဖြင့် အစားထိုးပါမည်)
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  
  # Reboot တက်လာလျှင်လည်း Swap အလိုအလျောက် အလုပ်လုပ်ရန် fstab တွင် ထည့်ခြင်း
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  
  # Swappiness ကို 10 သို့ ပြောင်းလဲခြင်း (RAM ကို ပိုဦးစားပေးသုံးရန်)
  if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
  else
    sed -i 's/^vm.swappiness.*/vm.swappiness=10/' /etc/sysctl.conf
  fi
  sysctl -p || true
  echo "Swap file created successfully."
else
  echo "Swap file already exists. Skipping."
fi

echo "==> System update and packages"
apt update
apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades htop iotop vnstat net-tools curl speedtest-cli
apt autoremove -y
apt autoclean

echo "==> Create sudo user: $USER_NAME"
if ! id "$USER_NAME" >/dev/null 2>&1; then
  # User အသစ်ဆောက်ရာတွင် Password တောင်းခံရန် --disabled-password အား ဖြုတ်ထားပါသည်
  adduser --gecos "" "$USER_NAME"
fi
# Sudo access ပေးခြင်း (Password တောင်းပါမည်)
usermod -aG sudo "$USER_NAME"

echo "==> Install SSH public key"
install -d -m 700 -o "$USER_NAME" -g "$USER_NAME" "/home/$USER_NAME/.ssh"
echo "$PUBLIC_KEY" > "/home/$USER_NAME/.ssh/authorized_keys"
chmod 600 "/home/$USER_NAME/.ssh/authorized_keys"
chown -R "$USER_NAME:$USER_NAME" "/home/$USER_NAME/.ssh"

echo "==> Backup SSH config"
cp /etc/ssh/sshd_config "/etc/ssh/sshd_config.bak.$(date +%Y%m%d%H%M%S)"

echo "==> Disable cloud image SSH overrides"
for f in /etc/ssh/sshd_config.d/60-cloudimg-settings.conf /etc/ssh/sshd_config.d/01-cloud-init.conf /etc/ssh/sshd_config.d/50-cloud-init.conf; do
  if [ -f "$f" ]; then
    cp "$f" "$f.bak"
    mv "$f" "$f.disabled"
  fi
done

echo "==> Centralized SSH Hardening"
cat > /etc/ssh/sshd_config.d/99-safenet-hardening.conf <<SSHCONF
Port $SSH_PORT
PasswordAuthentication no
PermitRootLogin no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PubkeyAuthentication yes
SSHCONF
chmod 644 /etc/ssh/sshd_config.d/99-safenet-hardening.conf

echo "==> Restart SSH on port $SSH_PORT"
mkdir -p /run/sshd
chmod 0755 /run/sshd
sshd -t
systemctl disable --now ssh.socket || true
systemctl enable --now ssh.service
systemctl restart ssh

echo "==> Configure UFW"
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 58210/udp
ufw --force enable

echo "==> Configure Fail2ban"
cat > /etc/fail2ban/jail.local <<JAIL
[DEFAULT]
backend = systemd
banaction = ufw

[sshd]
enabled = true
port = $SSH_PORT
maxretry = 3
findtime = 600
bantime = 86400
JAIL
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "==> Enable unattended upgrades"
dpkg-reconfigure -f noninteractive unattended-upgrades || true
systemctl enable --now unattended-upgrades || true

echo "==> Initialize vnStat"
systemctl enable --now vnstat || true

echo
echo "=== Timezone ==="
timedatectl | grep "Time zone"
echo
echo "=== Swap Status ==="
swapon --show
echo
echo "=== SSH effective config ==="
sshd -T | grep -E '^(port|passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)'
echo
echo "=== SSH listening ports ==="
ss -ltnp | grep ssh || true
echo
echo "=== UFW ==="
ufw status verbose
echo
echo "=== Fail2ban ==="
fail2ban-client status || true
echo
echo "DONE."
echo "IMPORTANT: Before closing this root session, test from local PC:"
echo "ssh -p $SSH_PORT $USER_NAME@SERVER_IP"
EOF

chmod +x /root/safenet-security-baseline.sh
```

### အဆင့် (၂) - Script အား Run ခြင်း
Script ကို စတင်အလုပ်လုပ်စေရန် အောက်ပါ Command တွင် သင့်စိတ်ကြိုက် Username, Port နှင့် Public Key များကို အစားထိုး၍ ရိုက်ထည့်ပါ။

```bash
USER_NAME="zinko" SSH_PORT="2213" /root/safenet-security-baseline.sh "ssh-ed25519 AAAA... သင့်_Public_Key_အပြည့်အစုံ"
```

> **သတိပြုရန်:** Script Run နေစဉ် User အသစ် (ဥပမာ - `zinko`) အတွက် `New password:` နှင့် `Retype new password:` ဟု မေးပါမည်။ လုံခြုံသော Password အသစ်ကို ကိုယ်တိုင်ရိုက်ထည့်ပေးပါ။ (ရိုက်ထည့်ရာတွင် လုံခြုံရေးအရ စာလုံးများ ပေါ်မည်မဟုတ်ပါ)။

### အဆင့် (၃) - အောင်မြင်မှုအား စစ်ဆေးခြင်း
Script အလုပ်လုပ်ပြီး အောက်ဆုံး၌ "DONE" ဟု ပြပါက လက်ရှိ Root Terminal အမည်းရောင်ផ្ទាំងကို **ချက်ချင်း မပိတ်ပါနှင့်ဦး။** 

Terminal ផ្ទាំងအသစ်တစ်ခုဖွင့်၍ အောက်ပါအတိုင်း ဝင်ရောက်ကြည့်ရှုပါ -
```bash
ssh -p 2213 zinko@သင့်_Server_IP_Address
```
အောင်မြင်စွာ ဝင်ရောက်နိုင်ပြီဆိုမှသာ မူလ Root Terminal ကြီးကို ပိတ်လိုက်ပါ။ 

> **ဂုဏ်ယူပါသည်။** ယခုဆိုလျှင် သင်၏ Server သည် ပုံမှန်ထက် များစွာပိုမိုလုံခြုံသော Safenet Security Baseline ကို အောင်မြင်စွာ တပ်ဆင်ပြီးစီးသွားပြီ ဖြစ်ပါသည်။

---

## အဆင့် (၄) - အားလုံးမှန်ကန်မှုရှိမရှိ အလိုအလျောက် စစ်ဆေးခြင်း (Verification)
User အသစ်ဖြင့် ဝင်ရောက်ပြီးသည့်အခါ လုံခြုံရေးအဆင့်မြှင့်တင်မှုများ အားလုံး အလုပ်လုပ်ခြင်း ရှိမရှိကို အောက်ပါ Verification Script ဖြင့် အလွယ်တကူ စစ်ဆေးနိုင်ပါသည်။

၁။ သင်၏ User အသစ် (ဥပမာ - `zinko`) ဖြင့် ဆာဗာသို့ ဝင်ရောက်ပါ။
၂။ Terminal တွင် အောက်ပါ Script အပြည့်အစုံကို Copy ကူးထည့်ပြီး `Enter` ခေါက်ပါ။

```bash
cat > verify_security.sh <<'EOF'
#!/usr/bin/env bash

echo "==============================================="
echo "   Safenet Security Baseline - Verification    "
echo "==============================================="

echo "[1] Current User စစ်ဆေးခြင်း..."
if [ "$USER" = "root" ]; then
    echo "❌ သတိ: သင်သည် root ဖြင့် ဝင်ရောက်နေပါသည်။ zinko ဖြင့် ဝင်ပါ။"
else
    echo "✅ လက်ရှိ User: $USER (Root မဟုတ်ပါ - မှန်ကန်သည်)"
fi

echo ""
echo "[2] Sudo (Admin) အခွင့်အရေး စစ်ဆေးခြင်း..."
if groups "$USER" | grep -q '\bsudo\b'; then
    echo "✅ '$USER' သည် 'sudo' အုပ်စုတွင် ပါဝင်ပါသည်။ (Admin အခွင့်အရေးရှိသည်)"
else
    echo "❌ '$USER' သည် 'sudo' အုပ်စုတွင် မပါဝင်ပါ။"
fi

echo ""
echo "[3] Timezone စစ်ဆေးခြင်း..."
TZ=$(timedatectl | grep "Time zone" | awk '{print $3}')
if [ "$TZ" = "Asia/Yangon" ]; then
    echo "✅ Timezone: $TZ (မှန်ကန်သည်)"
else
    echo "❌ Timezone: $TZ (Asia/Yangon မဟုတ်ပါ)"
fi

echo ""
echo "[4] Swap Memory စစ်ဆေးခြင်း..."
SWAP_SIZE=$(free -h | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" != "0B" ] && [ "$SWAP_SIZE" != "0.0K" ]; then
    echo "✅ Swap Memory အလုပ်လုပ်နေပါသည်။ (Total: $SWAP_SIZE)"
else
    echo "❌ Swap Memory မရှိပါ။"
fi

echo ""
echo "[5] SSH Hardening လုံခြုံရေး စစ်ဆေးခြင်း..."
SSH_CONF="/etc/ssh/sshd_config.d/99-safenet-hardening.conf"
if [ -f "$SSH_CONF" ]; then
    echo "✅ SSH Config အသစ် တွေ့ရှိပါသည်။ အောက်ပါလုံခြုံရေးများ ပိတ်ထားပါသည် -"
    grep -E '^(Port|PasswordAuthentication|PermitRootLogin)' $SSH_CONF | while read -r line; do
        echo "   👉 $line"
    done
else
    echo "❌ SSH Config အသစ် မတွေ့ပါ။"
fi

echo ""
echo "[6] UFW (Firewall) Status စစ်ဆေးခြင်း..."
echo "   (Firewall စစ်ဆေးရန် သင့် Password ကို တောင်းပါမည်)"
sudo ufw status | grep -E 'Status:|2213|80|443|58210'

echo ""
echo "[7] Fail2Ban (Hacker ကာကွယ်ရေး) စစ်ဆေးခြင်း..."
sudo fail2ban-client status sshd || echo "❌ Fail2Ban အလုပ်မလုပ်ပါ။"

echo ""
echo "==============================================="
echo "✅ စစ်ဆေးခြင်း အောင်မြင်စွာ ပြီးဆုံးပါပြီ!"
echo "==============================================="
EOF

bash verify_security.sh
```

**အထက်ပါ Script အား Run ပြီးပါက -**
Firewall များကို စစ်ဆေးရန် `sudo` အသုံးပြုထားသဖြင့် သင်၏ Password (zinko ၏ password) ကို တောင်းပါမည်။ စကားဝှက် ရိုက်ထည့်လိုက်သည်နှင့် အားလုံးစစ်ဆေးပြီး အောင်မြင်ကြောင်း အမှန်ခြစ် (✅) များဖြင့် ရှင်းလင်းစွာ ပြသပေးသွားမည် ဖြစ်ပါသည်။
