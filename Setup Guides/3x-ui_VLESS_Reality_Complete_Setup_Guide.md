# 3x-ui: VLESS + Reality (Vision) နှင့် Subscription စနစ် အပြည့်အစုံ တပ်ဆင်နည်း

လူကြီးမင်း VPS တွင် လက်တွေ့လုပ်ဆောင်သွားခဲ့သော အဆင့်ဆင့် မှတ်တမ်းများအပေါ် အခြေခံပြီး၊ စနစ်တကျ ပြန်လည်မှတ်မိစေရန်နှင့် နောင်တစ်ချိန်တွင် အလွယ်တကူ ပြန်လည်အသုံးပြုနိုင်ရန်အတွက် **3x-ui Setup Guide အပြည့်အစုံ** ကို အသေးစိတ် ရှင်းလင်းချက်၊ ဖြစ်လေ့ရှိသော Error များနှင့် ပြင်ဆင်နည်းများအပါအဝင် ပြုစုပေးလိုက်ပါသည်။

---

## 3x-ui v3.3.1 Full Installation & Configuration Guide

### Phase 1: Installation & Initial Settings

အစောဆုံးအဆင့်အနေဖြင့် System ကို Root User ပြောင်းပြီး 3x-ui Script ကို Run ရပါမည်။

```bash
# Root user အဖြစ်ပြောင်းလဲခြင်း
sudo su

# 3x-ui Installation Script ကို Run ခြင်း
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```

**ရှင်းလင်းချက် မှတ်ချက်များ:**
* **Database Selection:** Script မှ မေးသောအခါ `1) SQLite` ကို ရွေးချယ်ပါ။ (Client အယောက် ၅၀၀ အောက် သုံးမည့်ဆာဗာများအတွက် အပေါ့ပါးဆုံးနှင့် အကောင်းဆုံး ဖြစ်သည်)
* **Random Port & Path Generation:** Script မှ Panel Port ကို ကျပန်း (ဥပမာ - `4915`) အဖြစ်လည်းကောင်း၊ Web Base Path ကို ကျပန်း (ဥပမာ - `/randompath/`) အဖြစ်လည်းကောင်း အလိုအလျောက် ထုတ်ပေးသွားပါမည်။

---

### Phase 2: Domain SSL Certificate ထုတ်ခြင်းနှင့် ချိတ်ဆက်ခြင်း

Terminal ထဲတွင် `x-ui` command ကို ခေါ်၍ Standalone စနစ်ဖြင့် SSL ထုတ်ယူမည့် အဆင့်ဖြစ်သည်။

1. Terminal တွင် `x-ui` ဟု ရိုက်ထည့်ကာ Menu ကို ခေါ်ပါ။
2. **Option `19`** (SSL Certificate Management) ကို ရွေးပါ။
3. **Option `1`** (Get SSL (Domain)) ကို ဆက်ရွေးပါ။
4. မိမိ Domain (ဥပမာ - `sub.yourdomain.com`) ကို ရိုက်ထည့်ပါ။
5. Port validation အတွက် default **`80`** ကိုသာ အသုံးပြုပါ။

**အရေးကြီးသော ရွေးချယ်မှု:**
> Script မှ `Would you like to modify --reloadcmd for ACME? (y/n):` ဟု မေးလာပါက `y` ဟုဖြေပြီး **`0` (Keep default reloadcmd)** ကို ရွေးချယ်ရပါမည်။ ၎င်းသည် Certificate သက်တမ်းတိုးတိုင်း 3x-ui ကို Auto Restart ချပေးမည့်စနစ် (`x-ui restart`) ဖြစ်သည်။

**Certificate ထွက်လာသည့် လမ်းကြောင်းများ:**
* **Public Key:** `/root/cert/sub.yourdomain.com/fullchain.pem`
* **Private Key:** `/root/cert/sub.yourdomain.com/privkey.pem`
* *Script ၏ နောက်ဆုံးအဆင့်တွင် `y` ဟုနှိပ်၍ ဤလမ်းကြောင်းများကို Panel settings ထဲသို့ တိုက်ရိုက် Auto ထည့်သွင်းစေနိုင်ပါသည်။*

---

### Phase 3: Credentials Management (အကောင့်ပြင်ဆင်ခြင်း)

လုံခြုံရေးအရ ပုံမှန်ပေးထားသော Random Username/Password များကို မိမိကြိုက်နှစ်သက်ရာသို့ ပြောင်းလဲခြင်း ဖြစ်ပါသည်။

1. `x-ui` Menu ထဲမှ **Option `6`** (Reset Username & Password) ကို ရွေးပါ။
2. မိမိအသုံးပြုလိုသော Username နှင့် Password ကို သတ်မှတ်ပါ။
3. Two-Factor Authentication (2FA) ကို လောလောဆယ် disable လုပ်ရန် `y` ဟု ဖြေပါ။

**လက်ရှိ အသုံးပြုနိုင်သော Panel Access URL ဥပမာ:**
```text
https://sub.yourdomain.com:4915/randompath/
```

---

### Phase 4: OS Firewall (UFW) Configuration

အပြင်ကနေ Panel ရော VPN ချိတ်ဆက်မှုတွေပါ ဝင်ရောက်နိုင်ဖို့ Ubuntu Firewall တွင် Port များ ဖွင့်ပေးရပါမည်။

```bash
# 3x-ui Web Panel ဝင်ရန် Port ဖွင့်ခြင်း (မိမိ Port အမှန် ပြောင်းထည့်ပါ)
sudo ufw allow 4915/tcp

# Subscription Link (Sub port) အတွက် Port ဖွင့်ခြင်း
sudo ufw allow 2096/tcp

# VLESS Reality အတွက် Port 443 ကို ဖွင့်ခြင်း
sudo ufw allow 443/tcp
sudo ufw allow 443/udp

# Firewall ကို Refresh လုပ်ခြင်း
sudo ufw reload
```

---

### Phase 5: 3x-ui တွင် Subscription ဆက်တင် ချိန်ညှိခြင်း

Browser မှတစ်ဆင့် Panel သို့ လော့ဂ်အင် ဝင်ပါ။ ဘယ်ဘက် Menu မှ **Panel Settings** ကို သွားပြီး **Subscription** Tab ကို ဆက်သွားပါ။

အောက်ပါအတိုင်း အတိအကျ ပြင်ဆင်ပါ:
*   **Subscription Service:** ဖွင့်ပါ (Toggle ON)
*   **JSON / Clash / Mihomo subscription:** ပိတ်ထားပါ (OFF)
*   **Listen IP / Listen Domain:** မည်သည့်အရာမှ မရေးဘဲ အလွတ် (Blank) သာ ထားပါ။
*   **Listen Port:** `2096` ဟု ထည့်ပါ။
*   **URI Path:** `/sub/` ဟု ထည့်ပါ။
*   **Reverse Proxy URI (အလွန်အရေးကြီးသည်):** `http://sub.yourdomain.com:2096/sub/` ဟု အတိအကျ ထည့်ပေးရပါမည်။ (သတိပြုရန် - ဤသီးသန့် Port သည် SSL မပါဝင်သဖြင့် `https` မဟုတ်ဘဲ ရိုးရိုး `http` ကိုသာ အသုံးပြုရပါမည်။ နောက်ဆုံးတွင် `/` မဖြစ်မနေ ပါရပါမည်)

အောက်ဆုံးရှိ **Save** ကို နှိပ်ပြီး၊ ညာဘက်အပေါ်ထောင့်ရှိ **Restart Xray** ခလုတ်ကို နှိပ်ပါ။

---

### Phase 6: VLESS + Reality (Vision) Inbound တည်ဆောက်ခြင်း

ဘယ်ဘက် Menu မှ **Inbounds** ကို သွားပြီး **Add Inbound** ကို နှိပ်ပါ။ ညာဘက်မှ ပေါ်လာသော Box တွင် အပေါ်ဆုံး၌ Tab (၆) ခု ရှိပါသည်။ ပုံပါအတိုင်း တစ်ခုချင်းစီကို ဝင်ရောက် ပြင်ဆင်ပါ -

#### ၁။ Basics Tab
- **Remark:** `VLESS-Reality` (မိမိကြိုက်ရာ ပေးနိုင်ပါသည်၊ ဥပမာ - Thai_vle)
- **Protocol:** `vless` ကို ရွေးပါ။
- **Port:** `443` (အရေးကြီးသည် - Reality အတွက် 443 ကို သုံးပါမည်)
- ကျန်အရာများအားလုံးကို မူလ (Default) အတိုင်းသာ ထားပါ။ (Share address strategy: `Inbound listen`, Total Flow: `0`, Traffic Reset: `Never`)

#### ၂။ Protocol Tab
- **Decryption:** `none` (မူလအတိုင်း)
- **Encryption:** `none` (မူလအတိုင်း)

#### ၃။ Stream Tab
- **Transmission:** `RAW` (vless အသုံးပြုပါက Transmission သည် tcp အစား RAW ကိုသာ ပြပါမည်။ ၎င်းကိုသာ ရွေးထားပေးပါ)
- ကျန်သော ခလုတ်များကို ပိတ် (OFF) ထားပါ။

#### ၄။ Security Tab (အလွန်အရေးကြီးသော DPI ကျော်ရန် အပိုင်း)
- **Security:** `Reality` ကို ရွေးပါ။
- **uTLS:** `chrome`
- **Target:** `www.oracle.com:443` သို့မဟုတ် `www.microsoft.com:443`
- **SNI:** `www.oracle.com` သို့မဟုတ် `www.microsoft.com` (Target တွင် သုံးခဲ့သော နာမည်ကိုသာ ပြန်ထည့်ပါ)
- **Min/Max Client Ver:** `25.9.11` ဟု ပေါ်နေပါက အတိုင်းသာ ထားပါ။
- **Short IDs:** ညာဘက်ရှိ Refresh (လည်နေသော မြှား) ခလုတ်ကို နှိပ်လိုက်ပါ။ အလိုအလျောက် ထွက်လာပါမည်။
- **Private Key / Public Key:** ညာဘက်ရှိ **Get new keys** ကို နှိပ်လိုက်ပါ။ လုံခြုံရေး Key များ အလိုအလျောက် ထည့်သွင်းသွားပါမည်။

#### ၅။ Sniffing Tab
- **Enabled:** ပိတ်ထားပါ (Toggle OFF)။

#### ၆။ Advanced Tab
- မည်သည့်အရာမှ ပြင်ဆင်ရန် မလိုပါ။ မူလအတိုင်းသာ ထားပါ။

အရာအားလုံး ပြည့်စုံပါက အောက်ဆုံးရှိ **Create** ခလုတ်ကို နှိပ်လိုက်ပါ!!

---

### Phase 7: User အသစ် ပြုလုပ်ခြင်း နှင့် Subscription Link ယူခြင်း

1. Inbounds စာမျက်နှာရှိ သင်ဖန်တီးထားသော VLESS-Reality ဘေးမှ **`+` (Add Client)** ခလုတ်ကို နှိပ်ပါ။
2. **Email** နေရာတွင် User နာမည်ပေးပါ။ (ဥပမာ - `myo`)
3. **Flow** နေရာတွင် `xtls-rprx-vision` ကို သေချာပေါက် ရွေးပေးပါ။ (အမြန်ဆုံးနှင့် လုံခြုံရေးအကောင်းဆုံး ဖြစ်သည်)
4. **Subscription** နေရာတွင် User အတွက် လျှို့ဝှက်ကုဒ် သတ်မှတ်ပါ။ (ဥပမာ - `myo_sub_123` ဟု ပေးလိုက်ပါက ၎င်း၏ Link မှာ `http://.../sub/myo_sub_123` ဖြစ်သွားပါမည်)
5. **Add** ကို နှိပ်ပါ။
6. အပြင်ရောက်လျှင် Inbounds အကွက်ကို ဖွင့်ချပြီး (Expand နှိပ်ပါ)၊ User `myo` ၏ ဘေးရှိ **QR Code Icon** လေးကို နှိပ်လိုက်ပါ။
7. ထိုနေရာတွင် **Copy Link** (တိုက်ရိုက်ချိတ်ရန် VPN လင့်ခ်) နှင့် **Copy Subscription** (ဆပ်စခရိုက် လင့်ခ်) ကို တွေ့ရပါမည်။

#### Client များ ချိတ်ဆက်အသုံးပြုပုံ
- ဖုန်း (v2rayNG / Nekobox / Streisand) သို့မဟုတ် ကွန်ပျူတာ (v2rayN) မှ **Subscription Settings** ထဲသို့ ဝင်ပါ။
- Copy ကူးလာသော **Subscription Link** ကို ထည့်သွင်းပြီး Update နှိပ်လိုက်သည်နှင့် VLESS + Reality Server ပေါ်လာမည်ဖြစ်ပြီး အလွန်မြန်ဆန်သော အင်တာနက်ကို အသုံးပြုနိုင်ပြီ ဖြစ်ပါသည်!!

---

## ဖြစ်လေ့ရှိသော အမှားများ (Possible Errors) နှင့် ပြင်ဆင်နည်းလမ်းများ

### ၁။ `Error: File does not exist! Try again.`
* **အကြောင်းရင်း:** Setup လုပ်နေစဉ် Option 3 (Custom SSL) ကို ရွေးပြီး ဆာဗာထဲမှာ တကယ်မရှိသေးတဲ့ လမ်းကြောင်းကို ရိုက်ထည့်မိခြင်း သို့မဟုတ် စာလုံးပေါင်းမှားခြင်းကြောင့် ဖြစ်တတ်သည်။
* **ဖြေရှင်းနည်း:** `Ctrl + C` ဖြင့် ထွက်လိုက်ပါ။ ပြီးနောက် Panel ကို အရင်ပြီးအောင် install လုပ်ပြီးမှ `x-ui` menu ထဲက **Option 19** ကို သုံးပြီး SSL အသစ် ထုတ်ယူပါ။

### ၂။ `[ERR] Invalid domain format:...`
* **အကြောင်းရင်း:** Terminal ထဲမှာ စာသားတွေ ကော်ပီကူးထည့်လိုက်စဉ် (သို့မဟုတ်) Enter မှားနှိပ်မိစဉ် Script က တောင်းဆိုတဲ့ Domain name နေရာမှာ တခြားစာသားတွေ ရောနှောပါသွားခြင်း ဖြစ်သည်။
* **ဖြေရှင်းနည်း:** `Ctrl + C` (သို့မဟုတ် `Ctrl + Z`) ဖြင့် Script ကို ရပ်လိုက်ပြီး `x-ui` command ကို ပြန်ခေါ်ကာ အစကနေ သေချာ ပြန်ရိုက်ထည့်ပါ။

### ၃။ SSL Issue (standalone mode ဖြင့် cert ထုတ်မရခြင်း)
* **အကြောင်းရင်း:** Standalone mode သည် Port 80 ကို ခေတ္တအသုံးပြုပြီး Cert ထုတ်ပေးခြင်းဖြစ်သည်။ အကယ်၍ ဆာဗာထဲတွင် Nginx, Apache သို့မဟုတ် Caddy စသည်တို့က Port 80 ကို ကြိုတင် ယူထားပါက Cert ထုတ်ပေးနိုင်မည်မဟုတ်ပါ။
* **ဖြေရှင်းနည်း:** Cert မထုတ်မီ အောက်ပါ Command ဖြင့် Port 80 သုံးထားသော Service ကို ခေတ္တ ပိတ်ထားပေးရပါမည်-
```bash
sudo systemctl stop nginx
# SSL ထုတ်ပြီးမှ ပြန်ဖွင့်ရန်:
sudo systemctl start nginx
```

### ၄။ Panel နှင့် Sub Link မပွင့်ခြင်း (Cloud Firewall ပြဿနာ)
* **အကြောင်းရင်း:** Ubuntu ထဲက UFW Firewall မှာ Port ဖွင့်ထားသော်လည်း VPS Provider (ဥပမာ- DigitalOcean, AWS, Oracle Cloud) တို့၏ အပြင်ဘက် Dashboard Firewall တွင် ပိတ်နေခြင်း။
* **ဖြေရှင်းနည်း:** သက်ဆိုင်ရာ Cloud Provider Dashboard သို့ဝင်၍ **Inbound Rules** တွင် Port `4915` (Panel အတွက်) နှင့် Port `2096` (Sub link အတွက်) ကို **TCP - Allow Anywhere (0.0.0.0/0)** ဖွင့်ပေးရန် လိုအပ်ပါသည်။

---

## Phase 8: 3x-ui Database Backup & Restore Guide (Full Version)

ဒီနည်းလမ်းဟာ Server ဟောင်းထဲက User ဒေတာတွေ၊ Inbounds (Protocol Settings) တွေအားလုံးကို User တွေဘက်က Key အသစ်လဲစရာမလိုဘဲ Server အသစ်ဆီကို ချောမွေ့စွာ ရွှေ့ပြောင်းပေးမယ့် နည်းလမ်းဖြစ်ပါတယ်။

### 💾 အပိုင်း (၁) - ဆာဗာဟောင်းမှ ဒေတာကို စနစ်တကျ Backup ယူနည်း

SQLite Database ရဲ့ သဘာဝအရ ဒေတာတွေကို `-wal` (Temporary log) ဖိုင်ထဲမှာ ခေတ္တသိမ်းထားတတ်တဲ့အတွက် ဒေတာအပြည့်အစုံ ပါသွားစေဖို့ ဤအဆင့်အတိုင်း သေချာလုပ်ဆောင်ရပါမယ်။

**အဆင့် ၁: 3x-ui Service ကို ပိတ်ပါ**
ဒေတာတွေ ထပ်မဝင်လာစေရန်နှင့် Database ငြိမ်သွားစေရန် ဆာဗာဟောင်း Terminal တွင် အောက်ပါ Command ဖြင့် Service ကို ပိတ်ပါ-
```bash
x-ui stop
```

**အဆင့် ၂: Database ဒေတာများကို ဇွတ်အတင်း ပေါင်းခိုင်းခြင်း (Force Checkpoint)**
`-wal` ဖိုင်ထဲက ရှိသမျှ User ဒေတာအမှန်တွေအားလုံး `x-ui.db` ပင်မဖိုင်ထဲ ကွက်တိပေါင်းစည်းသွားစေရန် အောက်ပါ Python Command ကို Terminal တွင် ရိုက်ထည့်ပါ-
```bash
sudo python3 -c "import sqlite3; conn = sqlite3.connect('/etc/x-ui/x-ui.db'); conn.execute('PRAGMA wal_checkpoint(TRUNCATE);'); conn.close()"
```
> **မှတ်ချက်:** ဒီ Command ပြီသွားရင် WinSCP ထဲမှာ Refresh နှိပ်ကြည့်ပါ။ `x-ui.db-wal` ဖိုင် လုံးဝပျောက်သွားပြီး `x-ui.db` ဖိုင် Size ပြောင်းလဲသွားတာကို တွေ့ရပါလိမ့်မယ်။

**အဆင့် ၃: Backup ဖိုင်ကို ကွန်ပျူတာထဲသို့ ဒေါင်းလုဒ်ဆွဲခြင်း**
1. WinSCP (သို့မဟုတ် FileZilla) ကိုဖွင့်ပြီး ဆာဗာဟောင်းထဲသို့ ဝင်ပါ။
2. လမ်းကြောင်း `/etc/x-ui/` ထဲသို့ သွားပါ။
3. ဒေတာပေါင်းပြီးသားဖြစ်သော **`x-ui.db`** ဖိုင်ကို မိမိကွန်ပျူတာ (PC) ထဲသို့ ဒေါင်းလုဒ်ဆွဲပြီး အန္တရာယ်ကင်းကင်း သိမ်းဆည်းထားပါ။

---

### 🔄 အပိုင်း (၂) - ဆာဗာသစ်ထဲသို့ ဒေတာများ ပြန်လည်ထည့်သွင်းနည်း (Restore)

**အဆင့် ၁: Fresh Installation လုပ်ခြင်း**
ဆာဗာသစ် (VPS အသစ်) တွင် 3x-ui ကို Fresh Installation အရင်ဆုံး ပြုလုပ်ပါ-
```bash
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```

**အဆင့် ၂: Backup ဖိုင်ကို ကြားခံလမ်းကြောင်းသို့ တင်ခြင်း**
WinSCP ကိုသုံးပြီး ဆာဗာသစ်ထဲ ဝင်ပါ။ ထို့နောက် ညာဘက်အခြမ်းရှိ ဖိုဒါများထဲမှ အားလုံးဝင်ခွင့်ရှိသော **`/tmp`** ဖိုဒါထဲသို့ ဝင်ပါ။ အဆိုပါ `/tmp` ဖိုဒါထဲသို့ မိမိကွန်ပျူတာထဲက `x-ui.db` ဖိုင်ကို **Upload** တင်ပါ။
> *(မှတ်ချက် - WinSCP တွင် ရိုးရိုး User အကောင့်ဖြင့် ဝင်ထားပြီး Terminal တွင် `sudo su` ဖြင့် `root` အနေဖြင့် အလုပ်လုပ်ပါက Home လမ်းကြောင်း `~/` များ ကွဲလွဲတတ်သဖြင့် Error မရှိစေရန် အားလုံးသုံးခွင့်ရှိသော ဘုံဖိုဒါဖြစ်သည့် `/tmp` ကိုသာ အသုံးပြုခြင်း ဖြစ်ပါသည်)*

**အဆင့် ၃: ဆာဗာသစ် Service ကိုပိတ်ပြီး အမှိုက်ဖိုင်များ ရှင်းထုတ်ခြင်း**
ဆာဗာသစ် Terminal ထဲတွင် အောက်ပါ Command များဖြင့် Service ကို ခေတ္တပိတ်ပြီး ၎င်းဆာဗာသစ်က Auto ဆောက်ထားသော fresh wal ဖိုင်များကို အရင် ဖျက်ထုတ်ပါ-
```bash
sudo x-ui stop
sudo rm -f /etc/x-ui/x-ui.db-wal
sudo rm -f /etc/x-ui/x-ui.db-shm
```

**အဆင့် ၄: Backup ဖိုင်အစစ်ကို ပင်မနေရာသို့ အစားထိုးခြင်း**
ကြားခံလမ်းကြောင်း (`/tmp`) ထဲ တင်ထားသော ဒေတာအပြည့်ပါသည့် ဖိုင်ကို ပင်မလမ်းကြောင်းထဲသို့ ကူးထည့်ပါ-
```bash
sudo cp /tmp/x-ui.db /etc/x-ui/x-ui.db
```

**အဆင့် ၅: ဖိုင်ပိုင်ရှင်နှင့် ခွင့်ပြုချက် (Permission) ပြန်ပြင်ခြင်း**
ဒေတာဖတ်မရတဲ့ Error မျိုး မဖြစ်စေရန် ဖိုင်၏ Permission ကို Administrator (Root) အဖြစ် အောက်ပါအတိုင်း ပြန်ပြင်ပေးရပါမယ်-
```bash
sudo chown root:root /etc/x-ui/x-ui.db
sudo chmod 644 /etc/x-ui/x-ui.db
```

**အဆင့် ၆: လမ်းကြောင်း Refresh လုပ်ပြီး စက်ပြန်နှိုးခြင်း**
Terminal မျက်စိလည်တာ ပျောက်စေရန် Home သို့ ပြန်ထွက်ပြီး 3x-ui Service ကို ပြန်ဖွင့်ပေးလိုက်ပါ-
```bash
cd ~
sudo x-ui start
```

**အဆင့် ၇: ယာယီဖိုင်များ ရှင်းလင်းခြင်း (အရေးကြီး)**
Terminal တွင် `sudo` (Admin အာဏာ) သုံးထားသောကြောင့် WinSCP မှတစ်ဆင့် ရိုးရိုး User ဖြင့် ပြန်ဖျက်ပါက Permission Denied ဟု ငြင်းပါလိမ့်မည်။ ထို့ကြောင့် ကြားခံအဖြစ်သုံးခဲ့သော ယာယီဖိုင်ကို ရှင်းလင်းလိုပါက WinSCP ကို မသုံးဘဲ Terminal တွင်သာ အောက်ပါ Command ဖြင့် အလွယ်တကူ ဖျက်ထုတ်နိုင်ပါသည်-
```bash
sudo rm -f /tmp/x-ui.db
```

---

### ⚠️ စနစ်တစ်ခုလုံး လည်ပတ်နိုင်စေရန် နောက်ဆုံးပိတ် လုပ်ဆောင်ရမည့်အချက်များ

Database ရွှေ့ပြောင်းခြင်း ပြီးမြောက်သွားပါက အောက်ပါ Network ဆိုင်ရာ အချက်အလက်များကို မဖြစ်မနေ စစ်ဆေးပြင်ဆင်ပေးရပါမယ်-

1. **Cloudflare DNS Update:** Cloudflare Dashboard သို့သွားပြီး မိမိ Domain (ဥပမာ - `sub.yourdomain.com`) ၏ **A Record IP** နေရာတွင် **VPS အသစ်၏ IP** ကို ပြောင်းလဲပေးပါ။
2. **Cloudflare Proxy Settings:** Reality Node များ အလုပ်လုပ်နိုင်ရန် အဆိုပါ Domain သည် Cloudflare တွင် **`DNS Only` (မီးခိုးရောင် Cloud)** ဖြစ်နေရပါမည်။
3. **OS Firewall (UFW) ဖွင့်ခြင်း:** ဆာဗာသစ်၏ Firewall တွင် အောက်ပါ Port များကို မဖြစ်မနေ ဝင်ရောက်ခွင့် ပေးရပါမည်-
   - **Web Panel Port:** `ufw allow [ဆာဗာဟောင်းတွင် သုံးခဲ့သော Panel Port]/tcp`
   - **Subscription Port:** `ufw allow [ဆာဗာဟောင်းတွင် သုံးခဲ့သော Sub Port]/tcp`
   - **VLESS / Node Ports:** Panel ထဲရှိ Inbound များတွင် သုံးထားသော Port များအားလုံး (ဥပမာ- `443` သို့မဟုတ် တခြား Port များ) ကို `ufw allow [Port နံပါတ်]` ဟု ရိုက်၍ ဖွင့်ပေးရပါမည်။
4. **SSL Certificate ပြန်ထုတ်ခြင်း:** ဆာဗာသစ် ဖြစ်သွားသည့်အတွက် `x-ui` menu ထဲမှ **Option 19** ကို သုံးပြီး Domain အတွက် SSL Certificate ကို Standalone စနစ်ဖြင့် အသစ်တစ်ကြိမ် ပြန်လည်ထုတ်ယူပေးရပါမယ်ဗျာ။
