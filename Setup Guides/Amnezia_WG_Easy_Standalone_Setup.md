# Amnezia-WG-Easy အပြည့်အစုံ တပ်ဆင်နည်း လမ်းညွှန်

ဒီလမ်းညွှန်က သင့်ရဲ့ Domain (`vpn.yourdomain.com` သို့မဟုတ် မိမိပိုင် Domain) ကို အသုံးပြုပြီး **Amnezia-WG-Easy** စနစ်ကို Ubuntu/Debian ဆာဗာပေါ်မှာ အမှားအယွင်းမရှိ (Error-free) အပြည့်အစုံ တပ်ဆင်နည်း ဖြစ်ပါတယ်။

> [!IMPORTANT]
> မစတင်မီ Cloudflare (သို့) သင်၏ Domain Control Panel တွင် Domain ကို သင့်ဆာဗာ IP သို့ ညွှန်ထားပြီး၊ **Proxy Status ကို DNS Only (တိမ်တိုက်အမည်း/မီးခိုးရောင်)** အဖြစ် ပြောင်းထားရန် မမေ့ပါနဲ့။

---

## **အဆင့် (၁) - NAT Module ဖွင့်ခြင်း နှင့် Docker သွင်းခြင်း**

ဆာဗာအသစ် (OS အသစ်) တွင် Docker မသွင်းမီ၊ ခေတ်မီ OS များတွင် Docker ၏ `legacy iptables` အလုပ်လုပ်နိုင်ရန် NAT Module ကို ကြိုတင် ဖွင့်ပေးထားရပါမည်။ (သို့မှသာ နောက်ပိုင်းတွင် Error မတက်မည် ဖြစ်သည်)။

Terminal တွင် အောက်ပါ Command များကို တစ်ကြောင်းချင်းစီ Run ပေးပါ -

```bash
# ၁။ NAT Error မတက်စေရန် iptable_nat module ကို အရင် လှမ်းဖွင့်ရန်
sudo modprobe iptable_nat

# ၂။ ဆာဗာ Reboot ချတိုင်း အလိုအလျောက် ပွင့်နေစေရန် Save လုပ်ရန်
echo "iptable_nat" | sudo tee /etc/modules-load.d/iptable_nat.conf

# ၃။ Docker အလိုအလျောက် သွင်းရန်
curl -fsSL https://get.docker.com | sudo bash

# ၄။ Docker ကို အမြဲတမ်း ပွင့်နေစေရန် ဖွင့်ထားရန်
sudo systemctl enable --now docker
```

---

## **အဆင့် (၂) - Firewall (UFW) ပေါက်များ ဖွင့်ခြင်း**

VPN နှင့် Website အလုပ်လုပ်နိုင်ရန် လိုအပ်သော Port များကို UFW တွင် ကြိုတင် ဖွင့်ထားရပါမည်။

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 58210/udp
sudo ufw reload
```

---

## **အဆင့် (၃) - Web UI အတွက် Password ကို Hash ပြောင်းခြင်း**

Web UI ထဲဝင်ရန် မိမိအသုံးပြုလိုသော Password ကို လုံခြုံရေးအရ Hash Code ပြောင်းပေးရပါမည်။
အောက်ပါ Command တွင် `YOUR_PASSWORD` နေရာ၌ မိမိထားချင်သော စကားဝှက်ကို ပြောင်းထည့်၍ Run ပါ -

```bash
sudo docker run -it ghcr.io/w0rng/amnezia-wg-easy wgpw 'YOUR_PASSWORD'
```

> [!TIP]
> ရလဒ်အနေဖြင့် `$2b$12$...` စသဖြင့် စာသားအရှည်ကြီးတစ်ခု ထွက်လာပါမည်။ အဆိုပါ Hash Code အရှည်ကြီးကို သေချာစွာ Copy ကူးထားပါ။

---

## **အဆင့် (၄) - Amnezia-WG-Easy ကို Run ခြင်း**

အောက်ပါ Command တစ်ခုလုံးကို Copy ကူးပါ။ သို့သော် မ Run ခင် `PASSWORD_HASH` နေရာတွင် အဆင့် (၃) မှ ရလာသော Hash Code အရှည်ကြီးကို အစားထိုးထည့်သွင်းပေးပါ။

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command ထဲရှိ `vpn.yourdomain.com` နေရာတွင် သင် အမှန်တကယ် အသုံးပြုမည့် Domain အမည်ကို မပျက်မကွက် အစားထိုး ပြင်ဆင်ပြီးမှ Terminal တွင် Run ပါ။

```bash
sudo docker run -d \
  --name=amnezia-wg-easy \
  -e WG_HOST=vpn.yourdomain.com \
  -e PASSWORD_HASH='အဆင့်(၃)မှ_ရလာသော_HASH_CODE_ကို_ဒီမှာထည့်ပါ' \
  -e PORT=51831 \
  -e WG_PORT=58210 \
  -e WG_MTU=1200 \
  -e WG_PERSISTENT_KEEPALIVE=25 \
  -e JC=3 \
  -e JMIN=50 \
  -e JMAX=195 \
  -e S1=70 \
  -e S2=85 \
  -e H1=1377139017 \
  -e H2=820269891 \
  -e H3=989884595 \
  -e H4=1838347724 \
  -e UI_ENABLE_SORT_CLIENTS=true \
  -e UI_TRAFFIC_STATS=true \
  -e WG_ENABLE_EXPIRES_TIME=true \
  -e WG_ENABLE_ONE_TIME_LINKS=true \
  -v ~/.amnezia-wg-easy:/etc/wireguard \
  -p 58210:58210/udp \
  -p 127.0.0.1:51831:51831/tcp \
  --cap-add=NET_ADMIN \
  --cap-add=SYS_MODULE \
  --sysctl="net.ipv4.conf.all.src_valid_mark=1" \
  --sysctl="net.ipv4.ip_forward=1" \
  --device=/dev/net/tun:/dev/net/tun \
  --restart unless-stopped \
  ghcr.io/w0rng/amnezia-wg-easy
```

---

## **အဆင့် (၅) - Web UI အတွက် Nginx နှင့် SSL (HTTPS) တပ်ဆင်ခြင်း**

Web UI ကို လုံခြုံရေးအရ `127.0.0.1` မှာပဲ ဖွင့်ထားတာဖြစ်လို့၊ အပြင်ကနေ Domain နဲ့ လှမ်းခေါ်နိုင်အောင် Nginx Reverse Proxy ကို အသုံးပြုရပါမည်။

**၁။ Nginx နှင့် Certbot (SSL) ကို Install လုပ်ရန် -**
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

**၂။ Nginx Config ဖိုင် အသစ်ဖန်တီးရန် -** 

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command တွင် `vpn.yourdomain.com` နေရာ၌ သင်၏ Domain အမည်အမှန်ကို အတိအကျ အစားထိုးပြီးမှ Terminal တွင် Paste ချပါ။

```bash
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/amnezia
server {
    listen 80;
    server_name vpn.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:51831;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF'
```

**၃။ Config ကို အသက်သွင်းပြီး Nginx ကို Restart ချရန် -**
```bash
sudo ln -s /etc/nginx/sites-available/amnezia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**၄။ SSL (HTTPS) လုံခြုံရေးလက်မှတ် တောင်းယူရန် -**

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command တွင်လည်း `vpn.yourdomain.com` နေရာ၌ သင်၏ Domain အမည်အမှန်ကို အတိအကျ အစားထိုးပြီးမှ Run ပါ။

```bash
sudo certbot --nginx -d vpn.yourdomain.com
```
*(Certbot မှ Email တောင်းလျှင် ထည့်ပေးပြီး၊ Terms and Conditions ကို `Y` နှိပ်၍ သဘောတူပေးပါ။)*

---

## **ပြီးဆုံးပါပြီ 🎉**

အခုဆိုရင် သင့်ရဲ့ Browser ထဲမှာ **`https://vpn.yourdomain.com`** လို့ ရိုက်ထည့်လိုက်တာနဲ့ Amnezia Web UI လေး ပွင့်လာပါလိမ့်မယ်။

အဆင့် (၃) တုန်းက သတ်မှတ်ခဲ့တဲ့ သင်၏ **စကားဝှက် (Password) အစစ်** ကို ရိုက်ထည့်ပြီး ဝင်ရောက်နိုင်ပါတယ်။ အထဲရောက်ရင် `+ New Client` ကို နှိပ်ပြီး VPN အကောင့်အသစ်များ အလွယ်တကူ ဖန်တီး အသုံးပြုနိုင်ပါပြီ!
