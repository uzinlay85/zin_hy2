# Hysteria 2 VPN Management Portal

A modern, fast, and elegant Web UI for managing [Hysteria 2](https://v2.hysteria.network/) VPN users. Built with React (Vite), Express.js, and SQLite.

Hysteria 2 VPN အသုံးပြုသူများကို လွယ်ကူစွာ စီမံခန့်ခွဲနိုင်မည့် ခေတ်မီ Web UI လေးဖြစ်ပါတယ်။ React, Express နဲ့ SQLite တို့ကို အသုံးပြုပြီး ရေးသားထားပါတယ်။

---

## Features / ပါဝင်သော လုပ်ဆောင်ချက်များ

- 🎨 **Modern Glassmorphism UI**: Beautiful dark mode design. (ဆွဲဆောင်မှုရှိတဲ့ Dark Mode ဒီဇိုင်း)
- 👥 **User Management**: Easily create and delete VPN access keys. (User များကို အလွယ်တကူ အသစ်ဖွင့်/ဖျက် နိုင်ခြင်း)
- ⏱️ **Time & Data Limits**: Set optional Data Limits (in GB) and Expiry Dates (in Days). (Data သုံးစွဲခွင့် ပမာဏနှင့် သက်တမ်းရက် ကန့်သတ်နိုင်ခြင်း)
- 🟢 **Real-Time Status**: Monitor active connections with an "Online" indicator. (လက်ရှိ အသုံးပြုနေသူများကို Online အနေဖြင့် တိုက်ရိုက် ကြည့်နိုင်ခြင်း)
- 📊 **Traffic Tracking**: Live tracking of data usage (TX/RX). (Data အသုံးပြုမှုကို Real-time တွက်ချက်ပြသပေးခြင်း)
- 🔗 **One-Click Links**: Automatically generates `hysteria2://` URI links with Port Hopping support. (Port Hopping ပါဝင်သည့် VPN Link များကို တစ်ချက်နှိပ်ရုံဖြင့် Copy ကူးနိုင်ခြင်း)

---

## Complete Setup Guide (English / Myanmar)

### 1. Install Hysteria 2 / Hysteria 2 ကို Install လုပ်ခြင်း
First, install Hysteria 2 on your Ubuntu VPS.
(ပထမဦးစွာ Ubuntu VPS တွင် Hysteria 2 ကို အောက်ပါ command ဖြင့် Install လုပ်ပါ)
```bash
bash <(curl -fsSL https://get.hysteria.network/)
```

### 2. Hysteria 2 Server Configuration / ဆာဗာ Setting ချိန်ခြင်း
Edit your Hysteria 2 configuration file (`/etc/hysteria/config.yaml`):
(Hysteria ရဲ့ Config ဖိုင်ထဲတွင် အောက်ပါအတိုင်း ပြင်ဆင်ပါ)

```yaml
listen: :443
tls:
  cert: /etc/hysteria/fullchain.cer # Your SSL Cert path
  key: /etc/hysteria/private.key    # Your SSL Key path

auth:
  type: http
  http:
    url: http://127.0.0.1:3000/auth

masquerade:
  type: string
  string: "Welcome to Hysteria 2!"

# Required for real-time traffic monitoring (Data တွက်ချက်ရန် မဖြစ်မနေ ထည့်ရပါမည်)
trafficStats:
  listen: 127.0.0.1:4000
```
*Restart Hysteria: `sudo systemctl restart hysteria-server`*

### 3. Configure Port Hopping (UFW & Iptables)
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

### 4. Install Dependencies & Clone Repository / လိုအပ်သည်များ သွင်းခြင်း
Install Node.js, Nginx, and PM2:
(လိုအပ်သော Node.js, Nginx နှင့် PM2 များကို Install လုပ်ပါ)
```bash
sudo apt update
sudo apt install nodejs npm nginx -y
sudo npm install -g pm2
```

Clone the repository:
(Code များကို Github မှ ဆွဲယူပါ)
```bash
git clone https://github.com/uzinlay85/zin_hy2.git
cd zin_hy2
```

### 5. Setup the Backend / Backend စတင်ခြင်း
```bash
cd backend
npm install
pm2 start server.js --name hysteria-ui
pm2 save
```

### 6. Setup the Frontend (Optional) / Frontend Build လုပ်ခြင်း
If you made changes to the React code, build the frontend:
(အကယ်၍ React ဖိုင်များ ပြင်ဆင်ထားပါက အောက်ပါအတိုင်း Build လုပ်ပါ)
```bash
cd ../frontend
npm install
npm run build
```

### 7. Configure Nginx Reverse Proxy / Nginx ဖြင့် ချိတ်ဆက်ခြင်း
Create a new Nginx configuration to serve the Web UI.
Edit `/etc/nginx/sites-available/default`:
(Web UI ကို Domain ဖြင့် ခေါ်နိုင်ရန် Nginx တွင် အောက်ပါအတိုင်း ထည့်ပါ)

```nginx
server {
    listen 80;
    server_name your-domain.com; # Replace with your domain (သင့် Domain နာမည် ပြောင်းထည့်ပါ)

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

### 8. Enable HTTPS with Let's Encrypt (Optional but Recommended) / လုံခြုံရေးအတွက် HTTPS ပြောင်းခြင်း
To secure your Web UI with HTTPS, install Certbot and let it automatically configure SSL for your Nginx setup:
(Web UI ကို `https://` ဖြင့် လုံခြုံစွာ သုံးနိုင်ရန် အောက်ပါအတိုင်း Certbot ကို သွင်းပါ)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```
*(Follow the on-screen prompts. When asked, choose to **redirect** all HTTP traffic to HTTPS).*
*(Browser တွင် မေးလာပါက HTTP ကို HTTPS သို့ အလိုအလျောက် Redirect လုပ်ရန် ရွေးချယ်ပေးပါ။)*

---

## Usage / အသုံးပြုနည်း

1. Open your browser and navigate to your domain (e.g., `http://your-domain.com`).
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
