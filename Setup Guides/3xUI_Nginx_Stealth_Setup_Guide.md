# 3x-ui (VLESS + WS + TLS) အစအဆုံး တပ်ဆင်နည်း လမ်းညွှန် (Nginx Stealth Mode)

ဒီလမ်းညွှန်က သင့်ဆာဗာမှာ **Amnezia WG Easy (Nginx)** တပ်ဆင်ထားပြီးသား အခြေအနေမျိုးမှာ `Port 443` ကို မထိခိုက်စေဘဲ **3x-ui (Xray)** ကို လုံခြုံစွာ ခွဲဝေအသုံးပြုမယ့် နည်းလမ်း ဖြစ်ပါတယ်။ 

> [!IMPORTANT]
> မစတင်မီ Cloudflare တွင် 3x-ui အတွက် Domain အသစ်တစ်ခု (ဥပမာ - `sgvless.yourdomain.com`) အား A Record ဖြင့် သင့်ဆာဗာ IP သို့ ညွှန်ထားပြီး၊ **Proxy Status ကို DNS Only (တိမ်တိုက်အမည်း)** အဖြစ် ပြောင်းထားရန် မမေ့ပါနဲ့။

---

## အဆင့် (၁) - 3x-ui ကို ဆာဗာတွင် တပ်ဆင်ခြင်း

Terminal တွင် အောက်ပါ Command ဖြင့် 3x-ui ကို စတင် တပ်ဆင်ပါ -

```bash
curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh | sudo bash
```
*(မှတ်ချက် - ဤ Script သည် Username, Password နှင့် Port များကို ရမ်းဘမ်း (Random) ပေးသွားပါမည်။ SSL မေးလျှင် **n** နှိပ်၍ ကျော်သွားပါ)*

တပ်ဆင်ပြီးသွားပါက မိမိ မှတ်မိလွယ်စေရန် Username/Password ကို `admin` / `admin` အဖြစ် လည်းကောင်း၊ Panel Port ကို `2053` အဖြစ် လည်းကောင်း အောက်ပါ Command (၄) ကြောင်းဖြင့် အသေအချာ ပြန်လည် သတ်မှတ်ပေးပါ -

```bash
sudo sqlite3 /etc/x-ui/x-ui.db "UPDATE settings SET value='2053' WHERE key='webPort';"
sudo sqlite3 /etc/x-ui/x-ui.db "UPDATE settings SET value='' WHERE key='webBasePath';"
sudo sqlite3 /etc/x-ui/x-ui.db "UPDATE users SET username='admin', password='admin' WHERE id=1;"
sudo x-ui restart
```

---

## အဆင့် (၂) - Nginx ကို အသုံးပြု၍ ချိတ်ဆက်ခြင်း

3x-ui ၏ Panel နှင့် VLESS VPN အတွက် Nginx ကို အသုံးပြု၍ လမ်းကြောင်း ၂ ခု ဖန်တီးပါမည်။
(အောက်ပါ Command တွင် `sgvless.yourdomain.com` နေရာ၌ မိမိ၏ Domain အသစ်ကို ပြောင်းထည့်ပါ)

**၁။ Nginx ဖိုင်အသစ် တည်ဆောက်ခြင်း**

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command တွင် `sgvless.yourdomain.com` နေရာ၌ သင်၏ Domain အမည်အသစ်ကို အတိအကျ အစားထိုးပြီးမှ Terminal တွင် Paste ချပါ။

```bash
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/sgvless
server {
    listen 80;
    server_name sgvless.yourdomain.com; # မိမိ Domain ပြောင်းပါ

    # 3x-ui Admin Panel သို့ သွားမည့် လမ်းကြောင်း
    location / {
        proxy_pass http://127.0.0.1:2053;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # VPN (VLESS) အတွက် လျှို့ဝှက် လမ်းကြောင်း
    location /zinvpn {
        proxy_redirect off;
        proxy_pass http://127.0.0.1:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF'
```

**၂။ Nginx အား အသက်သွင်းပြီး SSL တောင်းခံခြင်း**

> [!WARNING]
> **Domain ပြောင်းရန် အလွန်အရေးကြီးပါသည်!**
> အောက်ပါ Command တွင်လည်း `sgvless.yourdomain.com` နေရာ၌ သင်၏ Domain အမည်အမှန်ကို အတိအကျ အစားထိုးပြီးမှ Run ပါ။

```bash
sudo ln -s /etc/nginx/sites-available/sgvless /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d sgvless.yourdomain.com
```

---

## အဆင့် (၃) - 3x-ui Panel တွင် Inbound တည်ဆောက်ခြင်း

Browser မှတစ်ဆင့် `https://sgvless.yourdomain.com` သို့ သွား၍ `admin` ဖြင့် ဝင်ရောက်ပါ။

**Inbounds -> Add Inbound** သို့သွား၍ အောက်ပါအတိုင်း အတိအကျ ဖြည့်သွင်းပါ -

**၁။ Basics နေရာတွင်:**
*   Protocol: `vless`
*   Listen IP: `127.0.0.1` *(အရေးကြီးသည်)*
*   Port: `10000` *(အရေးကြီးသည်)*

**၂။ Stream နေရာတွင်:**
*   Network: `ws` (WebSocket)
*   Path: `/zinvpn`
*   **External Proxy:** ခလုတ်ကို ဖွင့်ပါ (Enable)
    *   Force TLS: `tls` အဖြစ် ရွေးပါ (Same အတိုင်း မထားရ)
    *   Dest / Address: `sgvless.yourdomain.com` (မိမိ Domain)
    *   Port: `443`

**၃။ Security နေရာတွင်:**
*   Security: `None` အဖြစ်သာ ထားပါ။ (Nginx က SSL တာဝန်ယူပြီး ဖြစ်၍ ဤနေရာတွင် TLS မရွေးရ)

**၄။ Sniffing နေရာတွင်:**
*   Enable ဖွင့်ထားပေးပါ။

အထက်ပါအတိုင်း အားလုံး ပြည့်စုံပါက **Create** ကို နှိပ်၍ အကောင့် ဖန်တီးနိုင်ပါပြီ။

---

## ပြီးဆုံးပါပြီ 🎉

အခုဆိုရင် ဖန်တီးလိုက်သော Inbound အောက်မှ Client တစ်ခု ပေါင်းထည့် (Add Client) ပြီး QR Code သို့မဟုတ် Link ယူလိုက်သည်နှင့်- 
`vless://....@sgvless.yourdomain.com:443?security=tls...` ဟူသော မှန်ကန်သည့် Link တစ်ခု အလိုအလျောက် ထွက်လာမည်ဖြစ်ပြီး Nekobox သို့ တိုက်ရိုက် ထည့်သွင်း အသုံးပြုနိုင်ပါပြီ။

---

## နောက်ဆက်တွဲ - VLESS Reality Inbound အသစ် ထပ်မံ ဖန်တီးနည်း (ရွေးချယ်နိုင်သည်)

အကယ်၍ Port 443 တွင် Nginx မှတစ်ဆင့် သွားသော VLESS WS အပြင်၊ အခြား Port တစ်ခု (ဥပမာ `8443`) ဖြင့် VLESS Reality ကိုပါ သီးသန့် အသုံးပြုလိုပါက အောက်ပါအတိုင်း ထပ်မံ ဖန်တီးနိုင်ပါသည်။

**၁။ UFW တွင် Port ဖွင့်ခြင်း**
Reality သည် Nginx ကို မဖြတ်ဘဲ သီးသန့် အလုပ်လုပ်မည်ဖြစ်၍ UFW တွင် Port ဖွင့်ပေးရန် လိုအပ်ပါသည်။
```bash
sudo ufw allow 8443/tcp
```

**၂။ Inbounds -> Add Inbound တွင် အောက်ပါအတိုင်း ဖြည့်ပါ:**

*   **Basics နေရာတွင်:**
    *   Protocol: `vless`
    *   Listen IP: *(အလွတ်ထားပါ)*
    *   Port: `8443`
*   **Stream နေရာတွင်:**
    *   Network: `tcp`
    *   **External Proxy:** ခလုတ်ကို ဖွင့်ပါ (Enable)
        *   Force TLS: `Same` အဖြစ်ထားပါ
        *   Dest / Address: `sgvless.yourdomain.com` (မိမိ Domain ပြောင်းပါ)
        *   Port: `8443`
*   **Security နေရာတွင် (အရေးကြီးဆုံး):**
    *   Security: `Reality` ကို ရွေးပါ
    *   uTLS: `chrome`
    *   Dest: `www.amazon.com:443` (သို့မဟုတ် အခြား နာမည်ကြီး Website)
    *   Server Names (SNI): `www.amazon.com`
    *   Private Key ဘေးရှိ **Get New Keys** ကို နှိပ်ပါ
    *   ShortIds: ဘေးရှိ **+** လက္ခဏာကို နှိပ်ပါ
*   **Sniffing နေရာတွင်:**
    *   Enable ကို ဖွင့်ပေးပါ။

**Create** ကို နှိပ်ပြီးနောက် Client အသစ် (Add Client) ထည့်ရာတွင် Flow ကို **`xtls-rprx-vision`** ဟု ရွေးချယ်ပေးရန် မမေ့ပါနှင့်။ ၎င်းနောက် ထွက်လာသော Link အား တိုက်ရိုက် အသုံးပြုနိုင်ပြီ ဖြစ်သည်။။
