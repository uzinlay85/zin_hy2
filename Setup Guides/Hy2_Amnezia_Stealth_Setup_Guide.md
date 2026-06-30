# Hysteria 2 (Zin Panel) + Amnezia WG တွဲဖက်တပ်ဆင်နည်း လမ်းညွှန်

ဒီလမ်းညွှန်သည် ဆာဗာတွင် Amnezia WG ရှိပြီးသား အခြေအနေတွင် အခြားစနစ်များကို မထိခိုက်စေဘဲ **Hysteria 2 နှင့် Web UI Panel** ကို လုံခြုံစွာ တွဲဖက်တပ်ဆင်မည့် နည်းလမ်းဖြစ်ပါသည်။ 
(Domain အနေဖြင့် `hy2.yourdomain.com` ကို အသုံးပြုသွားမည် ဖြစ်ပါသည်)

> [!IMPORTANT]
> မစတင်မီ Cloudflare တွင် `hy2sv3` အား A Record ဖြင့် ဆာဗာ IP သို့ ညွှန်ထားပြီး၊ **Proxy Status ကို DNS Only (တိမ်တိုက်အမည်း)** ထားရှိရန် လိုအပ်ပါသည်။

---

## အဆင့် (၁) - လိုအပ်သော Software များ သွင်းခြင်း

Terminal တွင် အောက်ပါ Command များကို တစ်ကြောင်းချင်းစီ ရိုက်ထည့်ပါ -

```bash
sudo apt update
sudo apt install curl wget ufw nginx certbot python3-certbot-nginx sqlite3 git -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

---

## အဆင့် (၂) - Nginx ဖြင့် ချိတ်ဆက်ခြင်း (Safe Mode)

Amnezia ၏ ဖွဲ့စည်းပုံများ မပျက်စေရန် Nginx ဖိုင်နာမည်ကို သီးသန့်ပေး၍ တည်ဆောက်ပါမည်။

**၁။ Nginx ဖိုင်အသစ် တည်ဆောက်ခြင်း**

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command ထဲရှိ `hy2.yourdomain.com` နေရာတွင် သင် အမှန်တကယ် အသုံးပြုမည့် Domain အမည်ကို မပျက်မကွက် အစားထိုး ပြင်ဆင်ပြီးမှ Copy ကူး၍ Terminal တွင် ထည့်ပါ။

```bash
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/hy2sv3
server {
    listen 80;
    server_name hy2.yourdomain.com; 

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

**၂။ Nginx ကို အသက်သွင်းခြင်း**
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/hy2sv3 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## အဆင့် (၃) - SSL Certificate အခမဲ့ ရယူခြင်း

Nginx အသက်ဝင်သွားပါက Certbot ဖြင့် လုံခြုံရေး Certificate တောင်းခံပါမည်။

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command တွင်လည်း `hy2.yourdomain.com` နေရာ၌ သင်၏ Domain အမည်အမှန်ကို အတိအကျ အစားထိုးပြီးမှ Run ပါ။

```bash
sudo certbot --nginx -d hy2.yourdomain.com
```
*(မေးခွန်းများမေးလာပါက သင့် Email ကိုထည့်ပါ၊ `Y` ကိုရွေးပါ။ HTTP to HTTPS Redirect လုပ်ရန် မေးလျှင် **Redirect (2)** ကို ရွေးပါ)*

**Hysteria မှ Certificate ဖတ်နိုင်ရန် Permission ပေးခြင်း -**
```bash
sudo chmod -R 755 /etc/letsencrypt/archive
sudo chmod -R 755 /etc/letsencrypt/live
```

---

## အဆင့် (၄) - လိုင်းဆွဲအားအတွက် UDP Buffer တိုးခြင်း

Hysteria ၏ အမြန်နှုန်း အပြည့်အဝရရှိစေရန် အောက်ပါအတိုင်း ပြင်ဆင်ပါ -
```bash
echo "net.core.rmem_max=8388608" | sudo tee -a /etc/sysctl.conf
echo "net.core.wmem_max=8388608" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## အဆင့် (၅) - Hysteria 2 ကို Install လုပ်ခြင်း

**၁။ Hysteria 2 Core ကို သွင်းပါ:**
```bash
bash <(curl -fsSL https://get.hy2.sh/)
```

**၂။ ဖွဲ့စည်းပုံ (Config) ဖိုင် တည်ဆောက်ခြင်း:**

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command ထဲရှိ `hy2.yourdomain.com` (နေရာ ၂ ခု) တွင် သင်၏ Domain အမည်အမှန်ကို အတိအကျ အစားထိုးပြီးမှ Copy ကူးထည့်ပါ။

```bash
sudo bash -c 'cat << "EOF" > /etc/hysteria/config.yaml
listen: :443

tls:
  cert: /etc/letsencrypt/live/hy2.yourdomain.com/fullchain.pem
  key: /etc/letsencrypt/live/hy2.yourdomain.com/privkey.pem

auth:
  type: http
  http:
    url: http://127.0.0.1:3000/auth

acl:
  inline:
    - reject(127.0.0.0/8)
    - reject(10.0.0.0/8)
    - reject(172.16.0.0/12)
    - reject(192.168.0.0/16)
    - direct(all)

trafficStats:
  listen: 127.0.0.1:4000
EOF'
```

**၃။ Hysteria ကို အသက်သွင်းခြင်း:**
```bash
sudo systemctl restart hysteria-server
sudo systemctl enable hysteria-server
```

---

## အဆင့် (၆) - Firewall (UFW) ဖွင့်ခြင်း

Web UI နှင့် VPN အတွက် Port များ ဖွင့်ပေးပါမည်။
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 20000:50000/udp
```

**Port Hopping လမ်းကြောင်းများ ဖန်တီးခြင်း -**
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
sudo systemctl restart docker
```
*(မှတ်ချက် - UFW Reload လုပ်ပြီးတိုင်း Amnezia အတွက် Docker ပါ မပျက်မကွက် Restart ချပေးပါ)*

---

## အဆင့် (၇) - Github မှ Web UI ကို တပ်ဆင်ခြင်း (Zin Panel)

**၁။ Code များ ဆွဲယူခြင်း နှင့် Permission ပေးခြင်း**
```bash
git clone https://github.com/uzinlay85/zin_hy2.git

sudo chown -R $USER:$USER ~/zin_hy2
sudo chmod 777 ~/zin_hy2/backend
```

**၂။ Backend Packages များ သွင်းခြင်း**
```bash
cd ~/zin_hy2/backend
npm install
```

**၃။ Frontend ကို ကြိုတင် Build လုပ်ခြင်း**
*(Backend မစတင်မီ Error မတက်စေရန် Frontend ကို အရင် Build ပါမည်)*
```bash
cd ~/zin_hy2/frontend
npm install
npm run build
```

**၄။ Backend ကို Run ခြင်း နှင့် အတည်ပြုခြင်း**
```bash
cd ~/zin_hy2/backend
pm2 start server.js --name hysteria-ui
pm2 save
pm2 startup
```
*(မှတ်ချက် - `pm2 startup` ရိုက်၍ ထွက်လာသော `sudo env PATH...` အစချီသော စာကြောင်းကို Copy ကူး၍ ပြန် Run ပေးပါ။ ပြီးလျှင် `pm2 save` ကို ထပ်ရိုက်ပါ။)*

**၅။ Database နေရာချထားမှု သေချာစေရန် Restart ချခြင်း**
```bash
pm2 restart hysteria-ui
```

---

## ပြီးဆုံးပါပြီ 🎉

သင့်ဆာဗာတွင် Hysteria 2 + Web UI အား အောင်မြင်စွာ တပ်ဆင်ပြီးပါပြီ။ 

**Admin Panel လျှို့ဝှက် URL အား ယူရန် -**
```bash
cd ~/zin_hy2
bash show_url.sh
```

ထွက်လာသော လျှို့ဝှက် Link အား Browser တွင် ဖွင့်၍ `admin` / `admin` ဖြင့် ဝင်ရောက် အသုံးပြုနိုင်ပါပြီ။ Password ကို ချက်ချင်းပြောင်းလဲရန် မမေ့ပါနှင့်!
