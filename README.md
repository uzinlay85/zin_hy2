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
sudo apt install curl wget ufw nginx certbot python3-certbot-nginx sqlite3 build-essential -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
```

### 2. Configure Nginx Reverse Proxy / Nginx ဖြင့် ချိတ်ဆက်ခြင်း
Create a new Nginx configuration to serve the Web UI on Port 80.
(Web UI ကို Domain ဖြင့် ခေါ်နိုင်ရန် Nginx တွင် အောက်ပါ Command ဖြင့် အလွယ်တကူ ထည့်သွင်းပါ)

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command မှ `your-domain.com` နေရာတွင် သင် အမှန်တကယ် အသုံးပြုမည့် မိမိ၏ Domain အမည်ကို မပျက်မကွက် အစားထိုးပြီးမှသာ Copy ကူး၍ Terminal တွင် ထည့်ပါ။

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

### 4. Linux Network Tuning (Speed Optimization) / လိုင်းဆွဲအား ပိုကောင်းစေရန် ပြင်ဆင်ခြင်း
Hysteria 2 uses QUIC (UDP), which requires larger network buffers for maximum speed. Run these commands to permanently increase your server's UDP buffer sizes:
(Hysteria 2 ၏ အမြန်နှုန်း အပြည့်အဝရရှိစေရန် UDP Buffer Size များကို အမြဲတမ်း တိုးမြှင့်ပေးမည့် Command များ ဖြစ်ပါသည်)
```bash
echo "net.core.rmem_max=8388608" | sudo tee -a /etc/sysctl.conf
echo "net.core.wmem_max=8388608" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 5. Install Hysteria 2 / Hysteria 2 ကို Install လုပ်ခြင်း
Now install Hysteria 2 on your VPS:
(Hysteria 2 ကို အောက်ပါ command ဖြင့် Install လုပ်ပါ)
```bash
bash <(curl -fsSL https://get.hy2.sh/)
```
*Verify Installation:* `hysteria version`

Edit your Hysteria 2 configuration file (`/etc/hysteria/config.yaml`):
(Hysteria ရဲ့ Config ဖိုင်ထဲတွင် Certbot မှ ရလာသော Cert လမ်းကြောင်းများကို အစားထိုး ထည့်သွင်းပေးရန် အောက်ပါ Command ဖြင့် အလွယ်တကူ ထည့်ပါ)

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command တွင်လည်း `your-domain.com` (နေရာ ၂ ခု) တွင် သင်၏ Domain အမည်အမှန်ကို အတိအကျ အစားထိုးပြီးမှ Copy ကူးထည့်ပါ။ (အပေါ် Nginx တွင် သုံးခဲ့သော Domain နှင့် တစ်ထပ်တည်း တူညီရပါမည်)။

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

### 6. Configure Firewall & Port Hopping (UFW)
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
if ! grep -q "20000:50000" /etc/ufw/before.rules; then
    sudo bash -c 'cat << "EOF" >> /etc/ufw/before.rules

*nat
:PREROUTING ACCEPT [0:0]
-A PREROUTING -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
COMMIT
EOF'
    sudo ufw reload
fi
```

### 7. Clone Repository & Install Dependencies / Code များရယူခြင်း
(Code များကို Github မှ ဆွဲယူ၍ လိုအပ်သည်များ သွင်းပါမည်)
```bash
git clone https://github.com/uzinlay85/zin_hy2.git

# အရေးကြီး - Database ဖန်တီးခွင့်ရရန် Permission အရင်ပေးရပါမည်
sudo chown -R $USER:$USER ~/zin_hy2
sudo chmod 777 ~/zin_hy2/backend

# Backend Packages များ သွင်းမည်
cd ~/zin_hy2/backend
npm install
```

### 8. Build the Frontend (React) / Frontend ကို Build လုပ်ခြင်း
(Backend မစတင်မီ Error မတက်စေရန် Frontend ကို အရင် Build လုပ်ပါမည်)
```bash
cd ~/zin_hy2/frontend
npm install
npm run build
```

### 9. Start the Backend / Web UI ကို စတင်ခြင်း
(အရာအားလုံး အသင့်ဖြစ်ပြီဆိုလျှင် Backend ကို စတင်ပါမည်)
```bash
cd ~/zin_hy2/backend
pm2 start server.js --name hysteria-ui
pm2 save
pm2 startup
```
> **⚠️ အရေးကြီး (Very Important): Auto-Start on Reboot**
> 
> `pm2 startup` ကို ရိုက်လိုက်သည့်အခါ Terminal ၏ အောက်ဆုံးတွင် `sudo env PATH...` ဖြင့်စသော စာကြောင်းအရှည်ကြီး တစ်ကြောင်း ထွက်လာပါမည်။
> ထိုစာကြောင်းကို **Copy ကူး၍ ပြန် Run ပေးပါ**။ ပြီးလျှင် **`pm2 save`** ကို နောက်တစ်ကြိမ် ထပ်ရိုက်ပေးပါ။ 
> သို့မှသာ ဆာဗာ Restart/Reboot ကျသွားလျှင် Web UI သည် အလိုအလျောက် ပြန်ပွင့်လာမည် ဖြစ်ပါသည်။
> 
> *(Note: `pm2 startup` will output a `sudo env PATH...` command. **Copy and run that exact command**, then run **`pm2 save`** again. This is required to enable auto-start on reboot!)*

**Database အား မှန်ကန်စွာ နေရာချထားနိုင်ရန် Restart ချပါ -**
```bash
pm2 restart hysteria-ui
```

---

## Usage / အသုံးပြုနည်း

1. Run the `show_url.sh` script to get your Secret Admin URL:
   (လျှို့ဝှက် Admin URL ကို သိရှိရန် အောက်ပါ Command ကို ရိုက်ပါ)
   ```bash
   cd ~/zin_hy2
   bash show_url.sh
   ```
2. Open your browser and navigate to the generated Secret URL (e.g., `https://your-domain.com/admin_123456`). 
   (ရရှိလာသော လျှို့ဝှက် URL ကို Browser တွင် ဖွင့်ပါ)
3. **Login / အကောင့်ဝင်ခြင်း**: 
   - **Default Username**: `admin`
   - **Default Password**: `admin`
   *(Please log in and immediately click the ⚙️ Settings icon to change your password!)*
   *(အကောင့်ဝင်ပြီးသည်နှင့် ညာဘက်အပေါ်ထောင့်ရှိ ⚙️ Settings ခလုတ်ကို နှိပ်၍ Password ချက်ချင်း ပြောင်းပေးပါ။)*
4. Use the "Create New Key" section to add users. You can specify a Data Limit (GB) and Expiry (Days).
   (User အသစ်များကို Data Limit နှင့် ရက်အကန့်အသတ်များဖြင့် ဖန်တီးနိုင်ပါသည်)
5. Click "Copy Link" to get the `hysteria2://` URI and paste it into your VPN client (Nekobox, v2rayN, etc.).
   (ရရှိလာသော Link ကို Copy ကူး၍ VPN Software များတွင် ထည့်သွင်း အသုံးပြုနိုင်ပါပြီ)

## How to Update (ဆာဗာအသစ်နှင့် အဟောင်းများတွင် Update လုပ်နည်း)
Github တွင် အသစ်တင်ထားသော Update များရှိပါက (သို့မဟုတ်) ဆာဗာအသစ်တစ်ခုတွင် Update လုပ်လိုပါက အောက်ပါ Command များကို တစ်ကြောင်းချင်းစီ ရိုက်ထည့်၍ အလွယ်တကူ Update လုပ်နိုင်ပါသည်။

```bash
# ၁။ Github ကနေ Code အသစ်တွေ အကုန်ယူမယ်
cd ~/zin_hy2
git reset --hard
git pull

# ၂။ Backend ကို Update လုပ်မယ်
cd backend
npm install

# ၃။ Permission တွေ ပြန်ချိန်မယ် (အရေးကြီးဆုံး အဆင့်)
cd ~/zin_hy2
sudo chown -R $USER:$USER ~/zin_hy2
sudo chmod 777 ~/zin_hy2/backend
sudo chmod 666 ~/zin_hy2/backend/hysteria.db*

# ၄။ Frontend ကို Update လုပ်မယ် (၂၀၂၆ UI/UX အသစ်အတွက်)
cd ~/zin_hy2/frontend
npm install
npm run build

# ၅။ Server တွေကို Restart ချမယ်
sudo pm2 restart hysteria-ui
sudo systemctl restart nginx

# ၆။ လျှို့ဝှက် Admin URL ကို ထုတ်ကြည့်မယ်
cd ~/zin_hy2
bash show_url.sh
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

**5. Fix SQLITE_READONLY Error (Database ရေးခွင့်မရသည့် ပြဿနာဖြေရှင်းရန်):**
If your backend crashes or Web UI fails to save data due to a permission issue (e.g., after restoring a backup):
```bash
cd ~/zin_hy2
sudo chown -R $USER:$USER ~/zin_hy2
sudo chmod 777 ~/zin_hy2/backend
sudo chmod 666 ~/zin_hy2/backend/hysteria.db*
sudo pm2 restart hysteria-ui
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

## Advanced Security (Secret Admin URL)

To protect against hackers and bot attacks, the Admin Panel is **NOT** accessible from the root domain (`https://your-domain.com`). 
A Secret Admin URL is automatically generated when the server starts.

To view your current Secret Admin URL, run:
```bash
cd ~/zin_hy2
bash show_url.sh
```
It will display a link like `https://your-domain.com/admin_123456`. You must use this exact link to access the login page.
The system also includes **Rate Limiting**, which will permanently block any IP address for 1 hour if they fail to login 5 times within a 60-minute window.

---

## License
MIT License

---

## How to Uninstall (စနစ်တစ်ခုလုံးကို အရှင်း ဖြုတ်ချနည်း)

If you want to completely remove Hysteria 2 and the Web UI from your server, run the following commands step-by-step:
(Hysteria 2 နှင့် Web UI စနစ်တစ်ခုလုံးကို ဆာဗာမှ အစအနမကျန် အရှင်း ဖြုတ်ချလိုပါက အောက်ပါ Command များကို တစ်ပိုင်းချင်းစီ Run ပေးပါ)

**1. Remove Web UI & Database:**
```bash
pm2 stop hysteria-ui
pm2 delete hysteria-ui
pm2 save
rm -rf ~/zin_hy2
```

**2. Remove Hysteria 2 Server:**
```bash
sudo systemctl stop hysteria-server
sudo systemctl disable hysteria-server
sudo rm -f /etc/systemd/system/hysteria-server.service
sudo rm -rf /etc/hysteria
sudo rm -f /usr/local/bin/hysteria
sudo systemctl daemon-reload
```

**3. Remove Nginx Configuration (Optional):**
```bash
sudo rm -f /etc/nginx/sites-available/default
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```
