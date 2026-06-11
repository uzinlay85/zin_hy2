# Hysteria 2 VPN Management Portal

A modern, fast, and elegant Web UI for managing [Hysteria 2](https://v2.hysteria.network/) VPN users. Built with React (Vite), Express.js, and SQLite.

Hysteria 2 VPN အသုံးပြုသူများကို လွယ်ကူစွာ စီမံခန့်ခွဲနိုင်မည့် ခေတ်မီ Web UI လေးဖြစ်ပါတယ်။ React, Express နဲ့ SQLite တို့ကို အသုံးပြုပြီး ရေးသားထားပါတယ်။

---

## Features / ပါဝင်သော လုပ်ဆောင်ချက်များ

- 🎨 **Modern Glassmorphism UI**: Beautiful dark mode design. (ဆွဲဆောင်မှုရှိတဲ့ Dark Mode ဒီဇိုင်း)
- 🔒 **Admin Security**: Secure admin login system to protect your portal. (Admin Login လုံခြုံရေး စနစ်)
- 👥 **User Management**: Easily create and delete VPN access keys. (User များကို အလွယ်တကူ အသစ်ဖွင့်/ဖျက် နိုင်ခြင်း)
- ⏱️ **Time & Data Limits**: Set optional Data Limits (in GB) and Expiry Dates (in Days). (Data သုံးစွဲခွင့် ပမာဏနှင့် သက်တမ်းရက် ကန့်သတ်နိုင်ခြင်း)
- 🟢 **Real-Time Status**: Monitor active connections with an "Online" indicator. (လက်ရှိ အသုံးပြုနေသူများကို Online အနေဖြင့် တိုက်ရိုက် ကြည့်နိုင်ခြင်း)
- 📊 **Traffic Tracking**: Live tracking of data usage (TX/RX). (Data အသုံးပြုမှုကို Real-time တွက်ချက်ပြသပေးခြင်း)
- 🔗 **One-Click Links**: Automatically generates `hysteria2://` URI links with Port Hopping support. (Port Hopping ပါဝင်သည့် VPN Link များကို တစ်ချက်နှိပ်ရုံဖြင့် Copy ကူးနိုင်ခြင်း)

---

## Complete Setup Guide for a New VPS (A to Z)
(VPS အသစ်တစ်ခုအတွက် အစမှအဆုံး တပ်ဆင်နည်း အဆင့်ဆင့်)

**⚠️ Pre-requisite:**
Before starting, make sure your Domain Name (e.g., `vpn.your-domain.com`) is already pointing to your VPS IP address.
(မစတင်မီ သင့် Domain Name ၏ DNS ကို VPS IP သို့ ချိတ်ဆက်ထားရန် လိုအပ်ပါသည်။)

### 1. Install Required Packages / လိုအပ်သည်များ သွင်းခြင်း
Install Node.js, Nginx, Certbot, and PM2:
(အခြေခံ လိုအပ်သော Software များကို Install လုပ်ပါ)
```bash
sudo apt update
sudo apt install curl wget ufw nginx certbot python3-certbot-nginx -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
```

### 2. Configure Nginx Reverse Proxy / Nginx ဖြင့် ချိတ်ဆက်ခြင်း
Create a new Nginx configuration to serve the Web UI on Port 80.
(Web UI ကို Domain ဖြင့် ခေါ်နိုင်ရန် Nginx တွင် အောက်ပါ Command ဖြင့် အလွယ်တကူ ထည့်သွင်းပါ)

> **📝 မှတ်ချက်:** အောက်ပါ Command မှ `your-domain.com` နေရာတွင် မိမိ၏ Domain အမှန်ကို အစားထိုးပြီးမှ Copy ကူးထည့်ပါ။

```bash
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/default
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
```
*Restart Nginx: `sudo systemctl restart nginx`*

### 3. Generate Free SSL Certificate (HTTPS) / လုံခြုံရေး Certificate ရယူခြင်း
Run Certbot to automatically generate SSL certificates for your Nginx configuration:
(Domain အတွက် HTTPS လုံခြုံရေး Certificate များကို Certbot ဖြင့် အောက်ပါအတိုင်း ယူပါ)
```bash
sudo certbot --nginx -d your-domain.com
```
*(Follow the on-screen prompts and choose to **Redirect** all HTTP traffic to HTTPS).*

> **IMPORTANT**: Certbot will save your certificates at:
> - **Cert Path**: `/etc/letsencrypt/live/your-domain.com/fullchain.pem`
> - **Key Path**: `/etc/letsencrypt/live/your-domain.com/privkey.pem`
> You will use these exact paths in Step 4 for Hysteria.

**Grant Permissions to the Certificates:**
Hysteria runs as a non-root user and needs permission to read Let's Encrypt certificates. Run these commands:
(Hysteria မှ Certificate များကို ဖတ်နိုင်ရန် အောက်ပါ Command များဖြင့် ခွင့်ပြုချက် ပေးပါ)
```bash
sudo chmod -R 755 /etc/letsencrypt/archive
sudo chmod -R 755 /etc/letsencrypt/live
```

### 4. Install Hysteria 2 / Hysteria 2 ကို Install လုပ်ခြင်း
Now install Hysteria 2 on your VPS:
(Hysteria 2 ကို အောက်ပါ command ဖြင့် Install လုပ်ပါ)
```bash
bash <(curl -fsSL https://get.hy2.sh/)
```
*Verify Installation:* `hysteria version`

Edit your Hysteria 2 configuration file (`/etc/hysteria/config.yaml`):
(Hysteria ရဲ့ Config ဖိုင်ထဲတွင် Certbot မှ ရလာသော Cert လမ်းကြောင်းများကို အစားထိုး ထည့်သွင်းပေးရန် အောက်ပါ Command ဖြင့် အလွယ်တကူ ထည့်ပါ)

> **📝 မှတ်ချက်:** အောက်ပါ Command မှ `your-domain.com` နေရာတွင် မိမိ၏ Domain အမှန်ကို အစားထိုးပြီးမှ Copy ကူးထည့်ပါ။

```bash
sudo bash -c 'cat << "EOF" > /etc/hysteria/config.yaml
listen: :443

# USE THE CERT PATHS FROM STEP 3 HERE!
tls:
  cert: /etc/letsencrypt/live/your-domain.com/fullchain.pem
  key: /etc/letsencrypt/live/your-domain.com/privkey.pem

auth:
  type: http
  http:
    url: http://127.0.0.1:3000/auth

# Prevent VPN users from accessing internal VPS services
acl:
  inline:
    - reject(127.0.0.0/8)
    - reject(10.0.0.0/8)
    - reject(172.16.0.0/12)
    - reject(192.168.0.0/16)
    - direct(all)

# Required for real-time traffic monitoring
trafficStats:
  listen: 127.0.0.1:4000
EOF'
```
*Restart Hysteria: `sudo systemctl restart hysteria-server`*

### 5. Configure Firewall & Port Hopping (UFW)
Open the necessary ports for Web UI (HTTP/HTTPS) and Hysteria 2 (UDP):
(Web UI နှင့် Hysteria 2 အလုပ်လုပ်ရန် လိုအပ်သော Port များကို Firewall တွင် ဖွင့်ပေးပါ)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 20000:50000/udp
```

To support Port Hopping (20000-50000) alongside UFW, we need to add NAT rules to `/etc/ufw/before.rules`.
You can easily append them by running this command:
(Port Hopping သုံးရန်အတွက် UFW Rule ဖိုင်ထဲသို့ အောက်ပါ Command ဖြင့် အလိုအလျောက် ထည့်သွင်းပါ)

```bash
sudo bash -c 'cat << "EOF" >> /etc/ufw/before.rules

*nat
:PREROUTING ACCEPT [0:0]
-A PREROUTING -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
COMMIT
EOF'
```
*Reload UFW: `sudo ufw reload`*

### 6. Clone Repository & Setup Web UI Backend / Web UI စတင်ခြင်း
(Code များကို Github မှ ဆွဲယူ၍ Backend ကို စတင်ပါ)
```bash
git clone https://github.com/uzinlay85/zin_hy2.git
cd zin_hy2/backend
npm install
pm2 start server.js --name hysteria-ui
pm2 save
pm2 startup
```
*(Note: If you are NOT root, `pm2 startup` will output a `sudo env PATH...` command. Copy and run that exact command, then run `pm2 save` again to enable auto-start on reboot. If you are root, it will do it automatically.)*
*(မှတ်ချက် - pm2 startup လို့ ရိုက်လိုက်ရင် ထွက်လာမည့် `sudo env PATH...` စာကြောင်းအရှည်ကြီးကို ကော်ပီကူးပြီး ထပ်ရိုက်ပေးပါ။ ပြီးလျှင် `pm2 save` ကို နောက်တစ်ကြိမ် ထပ်ရိုက်ပေးမှသာ ဆာဗာ Reboot ကျလျှင် အလိုအလျောက် ပြန်ပွင့်မည် ဖြစ်ပါသည်။)*

### 7. Build the Frontend (React) / Frontend ကို Build လုပ်ခြင်း
(Web UI ထွက်လာရန်အတွက် Frontend ကို အောက်ပါအတိုင်း Build လုပ်ပေးပါ)
```bash
cd ../frontend
npm install
npm run build
```

---

## Usage / အသုံးပြုနည်း

1. Open your browser and navigate to your domain (e.g., `https://your-domain.com`).
   (သင့် Domain ကို Browser တွင် ဖွင့်ပါ)
2. **Login / အကောင့်ဝင်ခြင်း**: 
   - **Default Username**: `admin`
   - **Default Password**: `admin`
   *(Please log in and immediately click the ⚙️ Settings icon to change your password!)*
   *(အကောင့်ဝင်ပြီးသည်နှင့် ညာဘက်အပေါ်ထောင့်ရှိ ⚙️ Settings ခလုတ်ကို နှိပ်၍ Password ချက်ချင်း ပြောင်းပေးပါ။)*
3. Use the "Create New Key" section to add users. You can specify a Data Limit (GB) and Expiry (Days).
   (User အသစ်များကို Data Limit နှင့် ရက်အကန့်အသတ်များဖြင့် ဖန်တီးနိုင်ပါသည်)
4. Click "Copy Link" to get the `hysteria2://` URI and paste it into your VPN client (Nekobox, v2rayN, etc.).
   (ရရှိလာသော Link ကို Copy ကူး၍ VPN Software များတွင် ထည့်သွင်း အသုံးပြုနိုင်ပါပြီ)

## How to Update / နောက်ဆုံး Version သို့ မြှင့်တင်နည်း
If there are new updates on GitHub, run these commands on your VPS to update the Web UI.
**(⚠️ WARNING: Always run these commands as your normal user. DO NOT use `sudo su` before updating, otherwise files will become owned by root and cause permission errors!)**
(Github တွင် အသစ်တင်ထားသော Update များရှိပါက အောက်ပါ Command များဖြင့် အလွယ်တကူ Update လုပ်နိုင်ပါသည်။ **သတိပြုရန် - `sudo su` ဝင်ပြီး Root အကောင့်ဖြင့် Update မလုပ်ပါနှင့်။ Normal User အကောင့်ဖြင့်သာ အမြဲလုပ်ပါ။**)

```bash
# If you get "Permission Denied" errors, run this command ONCE to fix permissions:
# (Permission Error တက်ပါက ဖိုင်ပိုင်ဆိုင်ခွင့်များ ပြန်လည်ရယူရန် အောက်ပါစာကြောင်းကို အရင် Run ပါ)
# sudo chown -R $USER:$USER ~/zin_hy2

cd ~/zin_hy2
git pull
cd backend
npm install
# Since PM2 runs as root, we use sudo here / PM2 ကို Root ဖြင့် Run ထားသဖြင့် ဤနေရာတွင်သာ sudo ခံပါမည်
sudo pm2 restart hysteria-ui
cd ../frontend
npm install
npm run build
```

## How to Check Status & Troubleshoot / အလုပ်လုပ်/မလုပ် စစ်ဆေးနည်းများ

If something is not working, you can use these commands to check the server status:
(ဆာဗာ အလုပ်လုပ်ခြင်း ရှိ/မရှိ စစ်ဆေးရန် အောက်ပါ Command များကို အသုံးပြုပါ)

**1. Check Hysteria 2 Server Status (Hysteria အလုပ်လုပ်/မလုပ် စစ်ရန်):**
```bash
sudo systemctl status hysteria-server
```
*(It should say `active (running)`. / အစိမ်းရောင်ဖြင့် active ဟု ပြနေရပါမည်)*

**2. Check Hysteria 2 Live Logs (Hysteria ၏ အမှားများကို ကြည့်ရန်):**
```bash
sudo journalctl -u hysteria-server.service -n 50 -f
```
*(Press `Ctrl+C` to exit / ထွက်ရန် Ctrl+C ကိုနှိပ်ပါ)*

**3. Check Web UI Backend Status (Web UI အလုပ်လုပ်/မလုပ် စစ်ရန်):**
```bash
pm2 status
```
*(Note: PM2 is user-specific. If you installed it as `root`, you must use `sudo pm2 status` and `sudo pm2 logs` to see it! / မှတ်ချက် - မိမိက root ဖြင့် သွင်းခဲ့ပါက `sudo pm2 status` ဟု ရိုက်မှသာ မြင်ရပါမည်)*
*(It should say `online`. / အစိမ်းရောင်ဖြင့် online ဟု ပြနေရပါမည်)*

**4. Check Web UI Error Logs (Web UI ၏ အမှားများကို ကြည့်ရန်):**
```bash
pm2 logs hysteria-ui
```

## Server Migration & Backup / ဆာဗာအသစ်သို့ ပြောင်းရွှေ့ခြင်း

If your VPS IP is blocked or throttled, you can easily migrate to a new server without requiring your users to update their VPN keys.
(ဆာဗာ IP အပိတ်ခံရလျှင် သို့မဟုတ် လိုင်းနှေးသွားလျှင် User များဖုန်းထဲရှိ Key များကို ပြောင်းစရာမလိုဘဲ ဆာဗာအသစ်သို့ အလွယ်တကူ ပြောင်းရွှေ့နိုင်ပါသည်။)

### Method 1: Web UI (Easiest / အလွယ်ဆုံး)
1. On your **Old Server**, go to the Web UI ⚙️ Settings and click **[ Download Backup ]**. Save the `hysteria_backup.db` file.
2. Setup your **New Server** completely (Follow Steps 1-8).
3. On your **New Server**, go to the Web UI ⚙️ Settings, click **[ Upload & Restore ]**, and select your `hysteria_backup.db` file.
4. Go to Cloudflare and change your domain's DNS A Record to the **New Server IP**.
5. Wait for DNS to propagate. All users will reconnect automatically!

### Method 2: Command Line (Fallback)
We also provide a `migration.sh` script to backup and restore the database from the terminal.
```bash
# To Backup (Old Server):
cd ~/zin_hy2
bash migration.sh backup
# (Then download the created hysteria_backup.db via SFTP/WinSCP)

# To Restore (New Server):
# (Upload hysteria_backup.db to ~/zin_hy2 folder)
cd ~/zin_hy2
bash migration.sh restore
```

---

## License
MIT License
