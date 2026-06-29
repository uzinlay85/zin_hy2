# Vaultwarden + Cloudflare Tunnel + WebDAV Auto Backup Setup Guide

ဤလမ်းညွှန်သည် အလွတ်ဖြစ်နေသော Ubuntu/Debian VPS တစ်ခုပေါ်တွင် -
1. **Vaultwarden** (Password Manager)
2. **Cloudflare Tunnel** (Inbound Port ဖွင့်ရန်မလိုသော အမြင့်ဆုံးလုံခြုံရေး)
3. **Watchtower** (အလိုအလျောက် Update ပြုလုပ်ပေးသည့်စနစ်)
4. **Vaultwarden-backup** (WebDAV Cloud ပေါ်သို့ နေ့စဉ် အလိုအလျောက် Zip ခတ်၍ Backup ယူပေးမည့်စနစ်)

အစရှိသည်တို့ကို တစ်ပါတည်း တွဲဖက်တပ်ဆင်မည့် အပြည့်စုံဆုံး နည်းလမ်းဖြစ်ပါသည်။ 

*(Manual အဆင့်ဆင့် မလုပ်လိုပါက အောက်ဆုံးရှိ **Auto Setup Bash Script** ကို တိုက်ရိုက် အသုံးပြုနိုင်ပါသည်။)*

---

## အဆင့် (၁) - Server ကို Update ပြုလုပ်ခြင်း
သင်၏ VPS သို့ SSH ဖြင့် ဝင်ရောက်ပြီး အောက်ပါ command များကို ရိုက်ထည့်ပါ။
```bash
sudo apt update && sudo apt upgrade -y
```

## အဆင့် (၂) - Docker နှင့် Docker Compose တပ်ဆင်ခြင်း
Docker မရှိသေးပါက အလွယ်တကူ တပ်ဆင်ရန် အောက်ပါ command ကို အသုံးပြုပါ။
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## အဆင့် (၃) - Vaultwarden အတွက် Folder ဆောက်ခြင်း
Data များနှင့် ဆက်တင်ဖိုင်များထားရှိရန် Folder တစ်ခုဆောက်ပြီး ထို Folder ထဲသို့ ဝင်ပါ။
```bash
mkdir -p ~/vaultwarden
cd ~/vaultwarden
```

## အဆင့် (၄) - လုံခြုံသော Admin Token ဖန်တီးခြင်း
Admin Panel သို့ ဝင်ရောက်ရန် လုံခြုံသော Password (Token) တစ်ခု လိုအပ်ပါသည်။ အောက်ပါ command ကို ရိုက်ထည့်ပြီး ထွက်လာသော စာသားရှည်ကြီးကို မှတ်သားထားပါ။ (Copy ကူးထားပါ)
```bash
openssl rand -base64 48
```

## အဆင့် (၅) - Cloudflare Zero Trust မှ Tunnel Token ရယူခြင်း
1. Browser တွင် သင်၏ **Cloudflare အကောင့်** သို့ ဝင်ပါ။
2. ဘယ်ဘက် Menu မှ **Zero Trust** ကို နှိပ်ပါ။ 
3. **Networks** -> **Tunnels** သို့ သွားပြီး **Create a tunnel** ကို နှိပ်ပါ။
4. Tunnel နာမည်တစ်ခု ပေးပါ။ (ဥပမာ - `vwd-tunnel`)
5. "Choose your environment" တွင် **Docker** ကို ရွေးချယ်ပါ။
6. အောက်တွင် ပေါ်လာသော စာကြောင်းရှည်ကြီးထဲမှ `--token` ၏ နောက်တွင်ရှိသော **[Token စာသားအရှည်ကြီး]** ကို သေချာစွာ Copy ကူးထားပါ။ (ထို Token ကို အောက်ပါ အဆင့် ၇ တွင် အသုံးပြုပါမည်)။

## အဆင့် (၆) - WebDAV Password ကို ကုဒ်ဝှက်ခြင်း (Obscure လုပ်ခြင်း)
Backup စနစ်တွင် အသုံးပြုမည့် Rclone သည် လုံခြုံရေးအရ သင့် WebDAV (Koofr) စကားဝှက် အသစ်ကို အစစ်အတိုင်း တိုက်ရိုက်လက်မခံပါ။ ထို့ကြောင့် အောက်ပါ Command ဖြင့် စကားဝှက်ကို ကုဒ်ဝှက် (Obscure) ပြုလုပ်ရပါမည်။
```bash
docker run --rm -it ttionya/vaultwarden-backup rclone obscure "သင်၏_webdav_app_password_အသစ်ကို_ဒီမှာ_ထည့်ပါ"
```
Command ရိုက်ထည့်ပြီးပါက `mOa...` စသဖြင့် ထူးဆန်းသော စာသားတစ်ခု ထွက်လာပါမည်။ ၎င်းကို Copy ကူးထားပါ။ (အောက်ပါအဆင့် ၇ တွင် အသုံးပြုရန်ဖြစ်သည်)။

## အဆင့် (၇) - docker-compose.yml ဖိုင် ရေးသားခြင်း
ယခု `docker-compose.yml` ဖိုင်ကို တည်ဆောက်ပါမည်။
```bash
nano docker-compose.yml
```
အောက်ပါ code များကို Copy ကူးပြီး ထည့်ပါ။ (အဆင့် ၄၊ ၅ နှင့် ၆ တွင် ရခဲ့သော Token နှင့် Password များကို ပြင်ဆင်ထည့်သွင်းပါ)

```yaml
version: '3'

services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: unless-stopped
    environment:
      - DOMAIN=https://vwd.upanna.top
      - SIGNUPS_ALLOWED=true
      - INVITATIONS_ALLOWED=false
      - ADMIN_TOKEN=အဆင့်_၄_မှ_Vaultwarden_Admin_Token_ကို_ဒီမှာထည့်ပါ
      - ENABLE_DB_WAL=true
    volumes:
      - ./vw-data:/data
    # ports ဖွင့်ပေးစရာ မလိုတော့ပါ

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=အဆင့်_၅_မှ_Cloudflare_Tunnel_Token_အရှည်ကြီးကို_ဒီမှာထည့်ပါ

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=86400

  # WebDAV ဖြင့် အလိုအလျောက် Cloud Backup ပြုလုပ်ပေးမည့်စနစ်
  vaultwarden-backup:
    image: ttionya/vaultwarden-backup:latest
    container_name: vaultwarden-backup
    restart: unless-stopped
    environment:
      - CRON=0 2 * * *    # နေ့စဉ် ည (၂) နာရီတိတိတွင် Backup ယူမည်
      - ZIP_ENABLE=TRUE
      - ZIP_PASSWORD=သင်၏_Backup_Zip_ဖိုင်ကို_ပိတ်မည့်_Password
      - BACKUP_KEEP_DAYS=30 # Cloud ပေါ်တွင် ရက် ၃၀ စာ သိမ်းထားမည်
      - RCLONE_REMOTE_NAME=WebDAV
      - RCLONE_REMOTE_DIR=/Vaultwarden_Backups # Cloud ပေါ်ရှိ Folder အမည်
      # Koofr WebDAV ဆက်တင်များ
      - RCLONE_CONFIG_WEBDAV_TYPE=webdav
      - RCLONE_CONFIG_WEBDAV_URL=https://app.koofr.net/dav/Koofr
      - RCLONE_CONFIG_WEBDAV_VENDOR=other
      - RCLONE_CONFIG_WEBDAV_USER=သင်၏_Koofr_အကောင့်_Email_ကို_ထည့်ပါ
      - RCLONE_CONFIG_WEBDAV_PASS=အဆင့်_၆_မှ_ရရှိလာသော_Obscured_Password_ကို_ဒီမှာထည့်ပါ
    volumes:
      - ./vw-data:/data/
```
ဖိုင်ကို Save လုပ်ရန် `Ctrl + X` ကိုနှိပ်ပါ၊ `Y` ကိုနှိပ်ပါ၊ ထို့နောက် `Enter` ခေါက်ပါ။

## အဆင့် (၈) - စနစ်ကို စတင်ခြင်း
အောက်ပါ command ဖြင့် Docker များကို စတင်လိုက်ပါ။
```bash
docker compose up -d
```

## အဆင့် (၉) - Cloudflare တွင် URL ချိတ်ဆက်ခြင်း
1. အဆင့် (၅) တွင် ရပ်ထားခဲ့သော **Cloudflare Tunnel Dashboard** သို့ ပြန်သွားပြီး **Next** ကို နှိပ်ပါ။
2. **Public Hostnames** နေရာတွင် အောက်ပါအတိုင်း ဖြည့်ပါ -
   - **Subdomain:** `vwd` 
   - **Domain:** `upanna.top` ကို ရွေးပါ။
   - **Type:** တွင် `HTTP` ကို ရွေးပါ။
   - **URL:** တွင် `vaultwarden:80` ဟု အတိအကျ ထည့်ပါ။ 
3. အောက်ဆုံးရှိ **Save tunnel** ကို နှိပ်လိုက်ပါ။

## အဆင့် (၁၀) - ပထမဆုံး အကောင့်ပြုလုပ်ခြင်း
1. မိနစ်အနည်းငယ် စောင့်ပြီးနောက် Browser တွင် သင်၏ Domain `https://vwd.upanna.top` သို့ သွားပါ။
2. **Create Account** ကိုနှိပ်ပြီး သင်၏ ပထမဆုံး ကိုယ်ပိုင် အကောင့်ကို ဖန်တီးပါ။ Master Password ကို သေချာစွာ မှတ်သားပါ။

## အဆင့် (၁၁) - Signups ပိတ်ခြင်း (လုံခြုံရေးအတွက် မဖြစ်မနေလုပ်ပါ)
1. Browser တွင် `https://vwd.upanna.top/admin` သို့ သွားပါ။
2. အဆင့် (၄) တွင် ဖန်တီးခဲ့သော Admin Token ကို ရိုက်ထည့်ပြီး ဝင်ပါ။
3. ဘယ်ဘက် Menu မှ **General settings** သို့ သွားပါ။
4. **Allow new signups** ဆိုသည့် နေရာတွင် အမှန်ခြစ်ကို ဖြုတ်လိုက်ပါ (Uncheck လုပ်ပါ)။
5. အောက်ဆုံးရှိ **Save** ကို နှိပ်လိုက်ပါ။

---

# အပိုဆောင်းလမ်းညွှန် (၁) - Backup ကို အသုံးပြု၍ Data ပြန်လည်ရယူခြင်း (Restore & Recovery)

နောင်တစ်ချိန် Server ပျက်သွားပါက သို့မဟုတ် Server အသစ် ပြောင်းလိုပါက Koofr ပေါ်တွင် နေ့စဉ် သိမ်းထားသော `.zip` Backup ဖိုင်ကို အသုံးပြု၍ သင်၏ Password နှင့် Data အားလုံးကို အလွယ်တကူ ပြန်လည်ရယူ (Restore) နိုင်ပါသည်။

**Restore ပြုလုပ်ရန် အဆင့်များ -**
1. **Backup ဖိုင်ကို ဒေါင်းလုဒ်လုပ်ပါ:** Koofr အကောင့်ထဲသို့ ဝင်၍ နောက်ဆုံး နေ့စွဲဖြင့် သိမ်းထားသော Backup `.zip` ဖိုင်ကို သင့်ကွန်ပျူတာသို့ Download ရယူပါ။
2. **Zip ဖြည်ပါ:** ၎င်း `.zip` ဖိုင်ကို Extract (Zip ဖြည်) လိုက်ပါ။ ဖြည်သည့်အခါ `docker-compose.yml` တွင် သင်သတ်မှတ်ခဲ့သော `ZIP_PASSWORD` ကို ရိုက်ထည့်ပေးပါ။ ထိုအခါ `db.sqlite3` နှင့် တခြား Key ဖိုင်များ ထွက်လာပါမည်။
3. **Server အသစ်တွင် Folder ဆောက်ပါ:** Server အသစ်တွင် အထက်ပါ အဆင့် (၁) မှ (၃) အထိကို ပြုလုပ်ပြီး `~/vaultwarden/vw-data` Folder ကို ဖန်တီးပါ။
4. **ဖိုင်များ နေရာချပါ:** Zip ဖြည်၍ ထွက်လာသော ဖိုင်များအားလုံးကို Server အသစ်၏ `~/vaultwarden/vw-data/` Folder ထဲသို့ (WinSCP စသည်ဖြင့်) ထည့်သွင်းပေးပါ။
5. **စနစ်ကို ပြန်စတင်ပါ:** `~/vaultwarden/` Folder အတွင်း သင်၏ လက်ရှိ (ယခု ဖန်တီးခဲ့သော) `docker-compose.yml` ဖိုင်ကို ပြန်လည်ထည့်သွင်းပါ။ ထို့နောက် `docker compose up -d` ဟု Run လိုက်ပါက သင်၏ Password များနှင့် Settings အားလုံး တစ်စက်မျှမပျက်ဘဲ မူလအတိုင်း အတိအကျ ပြန်လည်ရရှိမည် ဖြစ်ပါသည်။

> **အလွန်အရေးကြီးသော အကြံပြုချက်:** ထို့ကြောင့် သင်၏ `docker-compose.yml` ဖိုင်နှင့် ၎င်းအတွင်းရှိ စကားဝှက်များ (Admin Token, Zip Password, Koofr App Password စသည်တို့) အား မှတ်စုစာအုပ် သို့မဟုတ် လုံခြုံသော နေရာတစ်ခုခုတွင် မဖြစ်မနေ သေချာစွာ သိမ်းဆည်းမှတ်သားထားပါ။

---

# အပိုဆောင်းလမ်းညွှန် (၂) - AUTO SETUP BASH SCRIPT (တစ်ကြောင်းတည်းဖြင့် အစအဆုံး အလိုအလျောက် သွင်းနည်း)

သင်သည် အထက်ပါ အဆင့် (၁) မှ (၈) အထိကို ကိုယ်တိုင် တစ်ခုချင်းစီ မလုပ်လိုပါက ဤ Script ကို အသုံးပြု၍ ၃ မိနစ်အတွင်း အလိုအလျောက် တပ်ဆင်နိုင်ပါသည်။

### အသုံးပြုရန် ပြင်ဆင်ရမည့်အချက်များ
Script ကို မစတင်မီ အောက်ပါ (၅) ချက်ကို ကြိုတင် ရယူ/စဉ်းစားထားပါ။
1. **Domain Name** (သင်အသုံးပြုမည့် Domain အမည်၊ ဥပမာ - vwd.upanna.top)
2. **Cloudflare Tunnel Token** (အဆင့် ၅ မှ ရရှိလာမည့် တိုကင်အရှည်ကြီး)
3. **Koofr Email** (Koofr အကောင့် Username)
4. **Koofr App Password** (Koofr တွင် အသစ်ဖန်တီးထားသော စကားဝှက်အသစ်)
5. **Backup Zip Password** (Backup ကို လုံခြုံစေရန် သင်ပေးမည့် စကားဝှက်တစ်ခု)

### အသုံးပြုနည်း
သင်၏ Server Terminal တွင် အောက်ပါ Command ကို Copy ကူးပြီး ရိုက်ထည့်လိုက်ပါ။

```bash
nano install.sh
```
ပွင့်လာသော မျက်နှာပြင်တွင် အောက်ပါ Script အပြည့်အစုံကို Copy ကူးထည့်ပါ -

```bash
#!/bin/bash
set -e

echo "==============================================="
echo " Vaultwarden + CF Tunnel + Backup Auto Setup "
echo "==============================================="

# 1. သုံးစွဲသူထံမှ အချက်အလက်များ တောင်းခံခြင်း
read -p "1. အသုံးပြုမည့် Domain Name (ဥပမာ - vwd.upanna.top) ကို ထည့်ပါ: " USER_DOMAIN
read -p "2. Cloudflare Tunnel Token ထည့်ပါ: " CF_TOKEN
read -p "3. Koofr Email (WebDAV Username) ထည့်ပါ: " WEBDAV_USER
read -s -p "4. Koofr App Password ထည့်ပါ: " WEBDAV_PASS
echo
read -s -p "5. Backup Zip အတွက် Password အသစ် သတ်မှတ်ပါ: " ZIP_PASS
echo
echo "==============================================="
echo "Setup စတင်နေပါပြီ... ခေတ္တစောင့်ဆိုင်းပါ။"
echo "==============================================="

# 2. Server ကို Update လုပ်၍ Docker သွင်းခြင်း
sudo apt update && sudo apt upgrade -y
if ! command -v docker &> /dev/null; then
    echo "Docker တပ်ဆင်နေပါသည်..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
fi

# 3. ဖိုင်တွဲများ တည်ဆောက်ခြင်း
mkdir -p ~/vaultwarden/vw-data
cd ~/vaultwarden

# 4. လုံခြုံသော Admin Token ကို အလိုအလျောက် ဖန်တီးခြင်း
echo "Vaultwarden Admin Token ဖန်တီးနေပါသည်..."
ADMIN_TOKEN=$(openssl rand -base64 48)

# 5. WebDAV App Password ကို ကုဒ်ဝှက်ခြင်း (Obscure)
echo "WebDAV Password ကို ကုဒ်ဝှက်နေပါသည်..."
OBSCURED_PASS=$(docker run --rm ttionya/vaultwarden-backup rclone obscure "$WEBDAV_PASS")

# 6. docker-compose.yml ဖိုင်ကို အလိုအလျောက် ဖန်တီးခြင်း
echo "docker-compose.yml ဖိုင်ကို တည်ဆောက်နေပါသည်..."
cat <<EOF > docker-compose.yml
version: '3'
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: unless-stopped
    environment:
      - DOMAIN=https://$USER_DOMAIN
      - SIGNUPS_ALLOWED=true
      - INVITATIONS_ALLOWED=false
      - ADMIN_TOKEN=$ADMIN_TOKEN
      - ENABLE_DB_WAL=true
    volumes:
      - ./vw-data:/data

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=$CF_TOKEN

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=86400

  vaultwarden-backup:
    image: ttionya/vaultwarden-backup:latest
    container_name: vaultwarden-backup
    restart: unless-stopped
    environment:
      - CRON=0 2 * * *
      - ZIP_ENABLE=TRUE
      - ZIP_PASSWORD=$ZIP_PASS
      - BACKUP_KEEP_DAYS=30
      - RCLONE_REMOTE_NAME=WebDAV
      - RCLONE_REMOTE_DIR=/Vaultwarden_Backups
      - RCLONE_CONFIG_WEBDAV_TYPE=webdav
      - RCLONE_CONFIG_WEBDAV_URL=https://app.koofr.net/dav/Koofr
      - RCLONE_CONFIG_WEBDAV_VENDOR=other
      - RCLONE_CONFIG_WEBDAV_USER=$WEBDAV_USER
      - RCLONE_CONFIG_WEBDAV_PASS=$OBSCURED_PASS
    volumes:
      - ./vw-data:/data/
EOF

# 7. စနစ်အား စတင်ခြင်း
echo "Docker များကို စတင်နေပါသည်..."
docker compose up -d

# 8. နောက်ဆုံး ရလဒ်ပြသခြင်း
echo "=================================================================="
echo "✅ Setup အောင်မြင်စွာ ပြီးဆုံးပါပြီ!"
echo "သင့် Vaultwarden သို့ https://$USER_DOMAIN မှ ဝင်ရောက်နိုင်ပါပြီ။"
echo "=================================================================="
echo "⚠️ အလွန်အရေးကြီးသော ADMIN TOKEN (အောက်ပါစာသားကို မှတ်သားထားပါ):"
echo ""
echo "$ADMIN_TOKEN"
echo ""
echo "=================================================================="
```

**Save လုပ်ရန်:** `Ctrl + X` ကို နှိပ်ပါ၊ `Y` ကို နှိပ်ပါ၊ ထို့နောက် `Enter` ခေါက်ပါ။

**Script ကို စတင် Run ရန် အောက်ပါ Command ရိုက်ပါ -**
```bash
bash install.sh
```
ထို့နောက် Script မှ မေးသော မေးခွန်းများကို ဖြည့်ပေးလိုက်သည်နှင့် အစအဆုံး အလိုအလျောက် ပြီးဆုံးသွားမည် ဖြစ်ပါသည်။

### Script ပြီးဆုံးသွားပြီးနောက် မဖြစ်မနေ ဆက်လက်လုပ်ဆောင်ရမည့် အချက်များ

Script Run တာ အောင်မြင်သွားပြီဆိုပါက အောက်ပါ (၃) ချက်ကို မဖြစ်မနေ ဆက်လုပ်ပေးရပါမည် -

**၁။ Cloudflare တွင် URL ချိတ်ဆက်ခြင်း**
- အဆင့် (၅) တွင် ရပ်ထားခဲ့သော **Cloudflare Tunnel Dashboard** သို့ ပြန်သွားပြီး **Next** ကို နှိပ်ပါ။
- **Public Hostnames** နေရာတွင် ဖြည့်ပါ: 
  - **Subdomain:** သင့် Domain အရှေ့စာသား (ဥပမာ `vwd`)
  - **Domain:** သင့် Domain (ဥပမာ `upanna.top`)
  - **Type:** တွင် `HTTP` ကို ရွေးပါ။
  - **URL:** တွင် `vaultwarden:80` ဟု ထည့်ပါ။ 
- **Save tunnel** ကို နှိပ်လိုက်ပါ။

**၂။ ပထမဆုံး အကောင့်ပြုလုပ်ခြင်း**
- Browser တွင် သင်၏ Domain (ဥပမာ `https://vwd.upanna.top`) သို့ သွားပါ။
- **Create Account** ကိုနှိပ်ပြီး သင်၏ ပထမဆုံး ကိုယ်ပိုင် အကောင့်ကို ဖန်တီးပါ။

**၃။ Signups ပိတ်ခြင်း (အခြားသူများ အကောင့်လာဖွင့်ခြင်းကို တားဆီးရန်)**
- Browser တွင် Admin Panel `https://vwd.upanna.top/admin` သို့ သွားပါ။
- Script အဆုံးတွင် ထွက်လာခဲ့သော **ADMIN TOKEN** အရှည်ကြီးကို ရိုက်ထည့်ပြီး ဝင်ပါ။
- ဘယ်ဘက် Menu မှ **General settings** သို့ သွားပါ။
- **Allow new signups** ဆိုသည့် နေရာတွင် အမှန်ခြစ်ကို ဖြုတ်လိုက်ပါ (Uncheck လုပ်ပါ)။
- အောက်ဆုံးရှိ **Save** ကို နှိပ်လိုက်ပါ။

---

# အပိုဆောင်းလမ်းညွှန် (၃) - VPS တွင် အောင်မြင်မှု ရှိ/မရှိ စစ်ဆေးခြင်းနှင့် Update ပြုလုပ်ခြင်း

သင်လုပ်ဆောင်ခဲ့သော လုပ်ငန်းစဉ်များ အောင်မြင်စွာ Run နေသလားဆိုတာကို အောက်ပါ Command များဖြင့် VPS ထဲတွင် စစ်ဆေးနိုင်ပါသည်။

### ၁။ Status နှင့် Logs များကို စစ်ဆေးရန်

**Docker Containers များအားလုံး အလုပ်လုပ်နေခြင်း ရှိ/မရှိ စစ်ဆေးရန် -**
```bash
docker ps
```
*(ဤ Command ရိုက်လိုက်ပါက `vaultwarden`, `cloudflared`, `watchtower`, `vaultwarden-backup` ဆိုသည့် Container ၄ ခုစလုံး `Up` ဖြစ်နေရပါမည်။)*

**Vaultwarden ၏ အတွင်းပိုင်း အခြေအနေ (Log) ကို ကြည့်ရန် -**
```bash
docker logs -f vaultwarden
```
*(ထွက်ရန် `Ctrl + C` ကိုနှိပ်ပါ။)*

**Cloudflare Tunnel ချိတ်ဆက်မှု အောင်မြင်ခြင်း ရှိ/မရှိ စစ်ဆေးရန် -**
```bash
docker logs -f cloudflared
```
*(`Registered tunnel connection` ဆိုသည့် စာသားကို တွေ့ပါက ၁၀၀ ရာခိုင်နှုန်း အောင်မြင်စွာ ချိတ်ဆက်မိနေပါပြီ။)*

### ၂။ Vaultwarden အား Update ပြုလုပ်ခြင်း

**အလိုအလျောက် Update စနစ် (Watchtower)**
ယခု Setup တွင် `watchtower` ကို တစ်ပါတည်း ထည့်သွင်းထားသောကြောင့် ၎င်းသည် နေ့စဉ် (၂၄ နာရီတစ်ခါ) Version အသစ်များ ထွက်မထွက် စစ်ဆေးပြီး၊ အသစ်ထွက်ပါက အလိုအလျောက် Update ပြုလုပ်ပေးသွားမည် ဖြစ်ပါသည်။ ထို့ကြောင့် သင်ကိုယ်တိုင် Update လုပ်ရန် ပူစရာ မလိုတော့ပါ။

**ကိုယ်တိုင် (Manual) Force Update ပြုလုပ်လိုပါက**
အကယ်၍ သင်ကိုယ်တိုင် ယခုချက်ချင်း Version အသစ်သို့ မြှင့်ချင်ပါက အောက်ပါ Command များကို သုံးနိုင်ပါသည် -
```bash
cd ~/vaultwarden
docker compose pull
docker compose up -d
```
*(ဤသို့ပြုလုပ်ခြင်းဖြင့် နောက်ဆုံးထွက် Image များကို ဆွဲယူပြီး Container များကို အသစ်ပြန်တင်ပေးသွားမည် ဖြစ်ပါသည်)*။

---

# အပိုဆောင်းလမ်းညွှန် (၄) - Admin Panel အသုံးပြုနည်းနှင့် သတိထားရမည့် အချက်များ

Vaultwarden တွင် အသုံးပြုသူများ (Users) ကို စီမံရန်နှင့် ဆာဗာတစ်ခုလုံး၏ ဆက်တင်များကို ပြင်ဆင်ရန် **Admin Panel** ကို အသုံးပြုရပါမည်။

### Admin Panel သို့ ဝင်ရောက်ခြင်း
- **URL:** သင်၏ ဒိုမိန်းအနောက်တွင် `/admin` ခံ၍ ဝင်ပါ။ (ဥပမာ - `https://vwd.upanna.top/admin`)
- **Authentication Token:** Admin စာမျက်နှာတွင် Password တောင်းပါက `install.sh` ပြုလုပ်စဉ်က ထွက်ပေါ်လာခဲ့သော `ADMIN_TOKEN` စာသားအရှည်ကြီးကို ရိုက်ထည့်ပြီး ဝင်ရောက်ပါ။

> **[!IMPORTANT]**
> **Admin Token မေ့သွားပါက -** သင်၏ VPS အတွင်းရှိ `~/vaultwarden/docker-compose.yml` ဖိုင်ကို `nano` ဖြင့် ပြန်ဖွင့်ကြည့်ပါက `ADMIN_TOKEN=` ဆိုသည့် နေရာတွင် ပြန်လည် ကြည့်ရှုနိုင်ပါသည်။

### Admin Panel တွင် သတိပြု/ပြင်ဆင်ရမည့် အချက်များ

၁။ **အခြားသူများ အကောင့်လာဖွင့်ခြင်းကို ပိတ်ထားပါ (Disable Signups)**
- မိမိကိုယ်တိုင် ပထမဆုံးအကောင့် ဖွင့်ပြီးသွားသည်နှင့် Admin Panel ၏ **General settings** သို့သွားကာ `Allow new signups` ကို **Uncheck** လုပ်ပြီး Save လုပ်ထားပါ။ 
- ဤသို့ပိတ်မထားပါက သင်၏ Website လိပ်စာကို သိသူတိုင်းက Password Manager အကောင့်များ လာရောက်ဖွင့်လှစ်ပြီး သင်၏ ဆာဗာနေရာလွတ်များကို အလကား အသုံးပြုသွားနိုင်ပါသည်။

၂။ **2FA (Two-Factor Authentication) မဖြစ်မနေ အသုံးပြုပါ**
- သင်၏ Vaultwarden အကောင့် (Admin Panel မဟုတ်ပါ၊ Password များ သိမ်းဆည်းသည့် အကောင့်) အတွင်းသို့ ဝင်၍ Settings > Security > Two-step login တွင် Authenticator App သို့မဟုတ် Yubikey စသည်တို့ကို မဖြစ်မနေ ဖွင့်ထားပါ။
- ဤသို့ဖွင့်ထားမှသာ Master Password ပေါက်ကြားသွားလျှင်တောင် သင်၏ အချက်အလက်များ လုံခြုံနေမည် ဖြစ်ပါသည်။

၃။ **SMTP (Email အသိပေးစနစ်) ထည့်သွင်းရန် (ချန်လှပ်နိုင်သည်)**
- Password မေ့သွားပါက ပြန်လည်ရယူရန်နှင့် User အသစ်များကို ဖိတ်ခေါ် (Invite) လုပ်ရန် Admin Panel ၏ **SMTP Email Settings** တွင် မိမိ၏ Gmail App Password (သို့) SMTP ဆာဗာအချက်အလက်များ ထည့်သွင်းထားရန် အကြံပြုပါသည်။
- သို့သော် SMTP ကို မဖြစ်မနေ ထည့်ရန် မလိုပါ။ SMTP မထည့်ထားပါက Password မေ့သွားလျှင် အကောင့်ပါ ဆုံးရှုံးနိုင်သဖြင့် **Master Password ကို မမေ့ရန် အလွန်အရေးကြီးပါသည်**။
