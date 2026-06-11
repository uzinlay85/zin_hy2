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
sudo apt install curl wget ufw nginx certbot python3-certbot-nginx nodejs npm -y
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
sudo chmod 0755 /etc/letsencrypt/archive
sudo chmod 0755 /etc/letsencrypt/live
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

To support Port Hopping (20000-50000) alongside UFW, edit `/etc/ufw/before.rules`.
Add the following lines at the **very top** of the file (before `*filter`):
(Port Hopping သုံးရန်အတွက် UFW Rule ဖိုင်ရဲ့ အပေါ်ဆုံးတွင် အောက်ပါစာကြောင်းများကို ထည့်ပါ)

```text
*nat
:PREROUTING ACCEPT [0:0]
-A PREROUTING -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
COMMIT
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
```

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

## License
MIT License
