# 🛡️ Outline Server: Domain Name နှင့် Port 443 အသုံးပြု၍ Setup လုပ်နည်း (Complete Guide)

Outline Server ကို ပုံမှန် IP ဖြင့်သာမက **Domain Name** ဖြင့်ပါ ချိတ်ဆက်နိုင်ရန်နှင့်၊ အင်တာနက် အပိတ်အဆို့များကို ပိုမိုလွယ်ကူစွာ ကျော်ဖြတ်နိုင်ရန် အသုံးအများဆုံးဖြစ်သော **Port 443 (HTTPS Port)** ကို အသုံးပြု၍ တည်ဆောက်နည်း အပြည့်အစုံ ဖြစ်ပါသည်။ 

*(မှတ်ချက် - Outline သည် Shadowsocks protocol ကို အခြေခံထားသောကြောင့် သီးသန့် SSL Certificate ထုတ်ရန် မလိုအပ်ပါ။)*

---

## 🌐 အဆင့် (၁) - Domain Name ကို VPS IP နှင့် ချိတ်ဆက်ခြင်း (DNS Setup)

1. မိမိ Domain ဝယ်ထားသော နေရာ (သို့) **Cloudflare ၏ DNS Management** ထဲသို့ သွားပါ။
2. **A Record** အသစ်တစ်ခု တည်ဆောက်ပြီး မိမိ Outline တင်မည့် VPS ၏ IP Address ကို ထည့်ပါ။ (ဥပမာ - `vpn.yourdomain.com` -> `192.168.x.x`)
3. **အရေးကြီးချက်:** အကယ်၍ Cloudflare ကို သုံးမည်ဆိုပါက Proxy status ကို **"DNS Only" (Grey Cloud / မီးခိုးရောင် တိမ်တိုက်)** အဖြစ်သာ သေချာပေါက် ပြောင်းထားပေးရပါမည်။ (Outline သည် Standard Shadowsocks ဖြစ်သောကြောင့် Proxy - Orange Cloud ခံထားပါက လုံးဝ အလုပ်မလုပ်ပါ)။

---

## 🔍 အဆင့် (၂) - Port 443 ကို စစ်ဆေးခြင်းနှင့် ဖွင့်ပေးခြင်း

Outline အတွက် Port 443 သုံးမည်ဆိုပါက မိမိ၏ VPS တွင် အဆိုပါ Port ကို အခြား Web Server (Nginx, Apache, 3x-ui စသည်) များက ကြိုတင်ယူသုံးထားခြင်း မရှိစေရန် အရင်ဆုံး စစ်ဆေးရပါမည်။

**၁။ Terminal တွင် အောက်ပါ Command ဖြင့် စစ်ဆေးပါ-**
```bash
sudo ss -tulnp | grep :443
```
> **မှတ်ချက်:** အကယ်၍ ဘာစာကြောင်းမှ ထွက်မလာပါက Port 443 သည် အလွတ်ဖြစ်နေသောကြောင့် ဆက်လက်လုပ်ဆောင်နိုင်ပါသည်။ အကယ်၍ Nginx သို့မဟုတ် အခြား Service တစ်ခုခုက ယူသုံးထားကြောင်း ပေါ်လာပါက ၎င်းတို့ကို အရင်ဆုံး Stop လုပ်ပေးရပါမည်။

**၂။ Port လွတ်နေကြောင်း သေချာပြီဆိုပါက Firewall တွင် Port 443 ကို ဖွင့်ပေးပါ-**
```bash
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw reload
```

---

## 🧹 အဆင့် (၃) - အမှိုက်ဖိုင်ဟောင်းများ ရှင်းလင်းခြင်း (အကြံပြုချက်)

Outline သည် အရင်က Install လုပ်ဖူးပါက Port အဟောင်းကို မှတ်ထားတတ်သောကြောင့် `--keys-port=443` ဟု ရိုက်သော်လည်း Random Port သာ ထွက်လာတတ်ပါသည်။ သို့ဖြစ်ပါ၍ **Error ကင်းစေရန် Install မလုပ်မီ အောက်ပါ Command ဖြင့် အဟောင်းများကို အရင်ရှင်းလင်းပါ-**

```bash
sudo docker rm -f shadowbox watchtower
sudo rm -rf /opt/outline
```

---

## 🚀 အဆင့် (၄) - Outline Server ကို Port 443 ဖြင့် Install လုပ်ခြင်း

ပုံမှန် Outline install script ကို run ပါက Access Key များအတွက် Port သည် Random (ကျပန်း) ဖြစ်သွားတတ်ပါသည်။ Port 443 ကိုသာ သီးသန့်သုံးလိုပါက Install လုပ်မည့် Command အား အောက်ပါအတိုင်း အတိအကျ Run ပေးရပါမည်။

VPS ၏ Terminal တွင် အောက်ပါ Command ကို Run ပါ-
```bash
wget -qO- https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/server_manager/install_scripts/install_server.sh | sudo bash -s -- --keys-port=443
```

Install ပြီးသွားပါက အစိမ်းရောင်စာသားဖြင့် ပေါ်လာမည့် `{"apiUrl":"https://...", ...}` စာကြောင်းရှည်ကြီးကို Copy ကူးထားပါ။

---

## 💻 အဆင့် (၅) - Outline Manager တွင် Server ချိတ်ဆက်ခြင်း

1. မိမိ၏ ကွန်ပျူတာတွင် **Outline Manager** ဆော့ဖ်ဝဲလ်ကို ဖွင့်ပါ။ (မရှိသေးပါက [getoutline.org](https://getoutline.org/get-started/#step-1) မှ ဒေါင်းလုဒ်ဆွဲပါ)
2. **"Add Server"** ကိုနှိပ်ပြီး၊ **"Set up Outline anywhere"** နေရာကို ရွေးချယ်ပါ။
3. အဆင့် (၄) တွင် Copy ကူးလာသော `apiUrl` ပါဝင်သည့် စာကြောင်းရှည်ကြီးကို အကွက်ထဲသို့ Paste ချပြီး **Done** ကို နှိပ်လိုက်ပါ။

---

## 🌍 အဆင့် (၆) - Outline Manager တွင် Domain ပြောင်းခြင်း

ယခုအချိန်အထိ Server သည် IP Address ဖြင့်သာ ချိတ်ဆက်နေဦးမည် ဖြစ်သည်။ Domain Name ဖြင့် ပြောင်းလဲချိတ်ဆက်ရန်-

1. Outline Manager တွင် ထပ်တိုးလိုက်သော Server ၏ ဘေးရှိ **Settings (ဂီယာပုံစံ)** ကို နှိပ်ပါ။
2. **"Server Information"** အောက်တွင် **"Hostname"** ဆိုသော အကွက်ကို ရှာပါ။
3. အဆိုပါ Hostname နေရာတွင် မူလ IP Address အစား အဆင့် (၁) တွင် ချိတ်ဆက်ခဲ့သော မိမိ၏ **Domain Name** (ဥပမာ - `vpn.yourdomain.com`) ကို အတိအကျ ပြောင်းထည့်ပြီး **Save** လုပ်ပါ။

---

## 📱 အဆင့် (၇) - User များအတွက် Key ထုတ်ပေးခြင်းနှင့် ချိတ်ဆက်ခြင်း

1. Outline Manager မှ **"Add New Key"** ကိုနှိပ်၍ User အသစ်တစ်ခု ဖန်တီးပါ။
2. **Share** ခလုတ်ကိုနှိပ်၍ ထွက်လာသော `ss://...` ဖြင့်စသည့် Access Key ကို Copy ကူးပါ။ (အဆိုပါ Key ကို ကြည့်လိုက်ပါက IP အစား သင်၏ Domain Name နှင့် Port 443 ကို အလိုအလျောက် အသုံးပြုသွားသည်ကို တွေ့ရပါမည်)။
3. ထို Key ကို ဖုန်း သို့မဟုတ် ကွန်ပျူတာရှိ **Outline Client** ဆော့ဖ်ဝဲလ်တွင် ထည့်သွင်းပြီး အလွယ်တကူ Connect လုပ်၍ အသုံးပြုနိုင်ပါပြီ။

---

## 💡 အရေးကြီးသော မှတ်သားဖွယ်ရာများ
* **Cloud Provider Firewall:** အကယ်၍ ချိတ်ဆက်၍မရပါက AWS, DigitalOcean, Oracle Cloud ကဲ့သို့ မိမိအသုံးပြုနေသော Cloud Provider ၏ Dashboard Firewall (Security Groups / Inbound Rules) တွင် Port 443 ကို `TCP/UDP` နှစ်မျိုးလုံးအတွက် ဖွင့်ထားခြင်း ရှိမရှိ မဖြစ်မနေ သွားရောက်စစ်ဆေးပါ။
* **လုံခြုံရေး ပိုမိုလိုလားပါက:** Outline သည် သာမန် Shadowsocks ဖြစ်၍ အချို့သော တင်းကြပ်သည့် ကွန်ရက်များတွင် ပိတ်ဆို့ခံရနိုင်ပါသည်။ အကယ်၍ Cloudflare Proxy (Orange Cloud) ခံပြီး အပြည့်အဝ ဖုံးကွယ်လိုပါက Outline အစား **3x-ui Panel (Vless + WebSocket + TLS)** ကို အသုံးပြုရန် အကြံပြုအပ်ပါသည်။

---

## 🔄 အပိုဆောင်း (Advanced): VPS အသစ်သို့ Outline ဆာဗာ ရွှေ့ပြောင်းခြင်း (Backup & Restore)

ဆာဗာလိုင်းမကောင်းတော့၍ဖြစ်စေ၊ IP အပိတ်ခံရ၍ဖြစ်စေ VPS အသစ်သို့ ပြောင်းရွှေ့ရာတွင် **User များဘက်မှ Key အသစ်လဲစရာမလိုဘဲ အလိုအလျောက် ချိတ်ဆက်မိစေရန်** အောက်ပါနည်းလမ်းအတိုင်း Backup ယူ၍ ရွှေ့ပြောင်းနိုင်ပါသည်။

Outline ၏ User Keys များနှင့် Manager ချိတ်ဆက်မှု အချက်အလက်များအားလုံးသည် `/opt/outline/persisted-state/` ဆိုသော ဖိုဒါထဲတွင် ရှိပါသည်။ ထိုဖိုဒါကို ကူးယူရုံဖြင့် အားလုံး ပြီးပြည့်စုံပါသည်။

### အဆင့် (၁) - ဆာဗာဟောင်းမှ Backup ယူခြင်း
ဆာဗာဟောင်း၏ Terminal တွင် အောက်ပါ Command ဖြင့် Data ဖိုဒါကို Zip (tar.gz) ချုပ်လိုက်ပါ-
```bash
sudo tar -czvf ~/outline_backup.tar.gz -C /opt/outline persisted-state
```
ထို့နောက် FileZilla သို့မဟုတ် WinSCP ကို အသုံးပြု၍ မိမိ၏ Home folder (`~` သို့မဟုတ် `/root/` စသည်) ထဲသို့ ရောက်လာသော **`outline_backup.tar.gz`** ဖိုင်ကို ကွန်ပျူတာထဲသို့ ဒေါင်းလုဒ်ဆွဲထားပါ။

> **💡 WinSCP မှ ဒေါင်းလုဒ်ဆွဲရန် အခက်အခဲရှိပါက (Permission ပြဿနာ):**
> အကယ်၍ သင့် WinSCP သည် ရိုးရိုး User အကောင့်ဖြင့် ဝင်ထား၍ `/root/` ဖိုဒါကို ဝင်ယူခွင့် မရှိပါက Terminal တွင် အောက်ပါ Command ဖြင့် ဖိုင်ကို အားလုံးဝင်ရောက်နိုင်သော `/tmp/` ဖိုဒါထဲသို့ ပြောင်းရွှေ့ပေးလိုက်ပါ-
> ```bash
> cp /root/outline_backup.tar.gz /tmp/
> chmod 777 /tmp/outline_backup.tar.gz
> ```
> ထို့နောက် WinSCP တွင် **`/tmp/`** ဖိုဒါထဲသို့ သွားရောက်၍ လွတ်လပ်စွာ Download ဆွဲယူနိုင်ပါပြီ။

### အဆင့် (၂) - ဆာဗာသစ်တွင် Install လုပ်ခြင်း
ဆာဗာသစ် (VPS အသစ်) တွင် အပေါ်ပိုင်းမှ အဆင့် (၁) (၂) နှင့် (၄) အတိုင်း Outline ကို Fresh Install လုပ်ပါ။ (Port 443 ဖြင့် သေချာစွာ Install လုပ်ပါ)။

### အဆင့် (၃) - Backup ကို ဆာဗာသစ်သို့ Restore လုပ်ခြင်း

**အထူးသတိပြုရန်:** Backup ဖိုင်တစ်ခုလုံးကို အစားထိုးလိုက်ပါက ဆာဗာသစ်၏ Management API Port နှင့် လုံခြုံရေး Certificate များ အဟောင်းနှင့် ရောထွေးသွားပြီး၊ Outline Manager မှ လှမ်းချိတ်၍ မရတော့သည့် ပြဿနာ ဖြစ်တတ်ပါသည်။ ထို့ကြောင့် User များကိုသာ ပြန်လည်ခေါ်ယူမည့် အောက်ပါ **"Selective Restore"** နည်းလမ်းကိုသာ အသုံးပြုပါ။

1. ဆာဗာသစ်ကို WinSCP ဖြင့် ဝင်ပါ။ ညာဘက်အခြမ်း (VPS ဘက်) ရှိ အားလုံးဝင်ခွင့်ရှိသော **`/tmp`** ဖိုဒါထဲသို့ ဝင်ပါ။
2. အဆိုပါ `/tmp` ဖိုဒါထဲသို့ ကွန်ပျူတာထဲရှိ `outline_backup.tar.gz` ဖိုင်ကို ဆွဲထည့်၍ Upload တင်ပါ။
   > *(မှတ်ချက် - Upload တင်ပြီးချိန်တွင် `Error occurred while setting the permissions and/or timestamp` ဟု ပေါ်လာပါက ဖိုင်ရောက်သွားပြီဖြစ်၍ **Skip** ကို နှိပ်ပြီး အောက်ပါအတိုင်း ဆက်လက်လုပ်ဆောင်ပါ)*
3. ထို့နောက် ဆာဗာသစ်၏ Terminal တွင် Backup ဖိုင်ကြီးကို ယာယီဖိုဒါတစ်ခု ဆောက်၍ အရင်ဖြေချပါ-
```bash
mkdir -p /tmp/old_backup
sudo tar -xzvf /tmp/outline_backup.tar.gz -C /tmp/old_backup
```
4. ထိုအထဲမှ User Key များပါဝင်သည့် Config ဖိုင် (၁) ခုတည်းကိုသာ လက်ရှိ Outline ထဲသို့ ကူးထည့်၍ အစားထိုးပါ-
```bash
sudo cp /tmp/old_backup/persisted-state/shadowbox_config.json /opt/outline/persisted-state/
```
5. ပြောင်းလဲမှုများ အသက်ဝင်စေရန် Outline (Shadowbox) ကို Restart ချပါ-
```bash
sudo docker restart shadowbox
```
6. **(အရေးကြီး) ယာယီဖိုင်များကို ပြန်လည်ရှင်းလင်းခြင်း:**
   Terminal တွင် `sudo` (Admin အာဏာ) ဖြင့် ဖြေချခဲ့သော ဖိုင်များဖြစ်၍ WinSCP မှတစ်ဆင့် ရိုးရိုး User အကောင့်ဖြင့် ပြန်ဖျက်ပါက `Permission Denied` ဟု ငြင်းပါလိမ့်မည်။ ထို့ကြောင့် `/tmp` ထဲမှ ယာယီဖိုင်များနှင့် Zip ဖိုင်ကို ရှင်းလင်းလိုပါက WinSCP ကို မသုံးဘဲ Terminal တွင်သာ အောက်ပါ Command များဖြင့် လွယ်ကူစွာ ဖျက်ထုတ်နိုင်ပါသည်-
```bash
# ဖြေချထားသည့် ယာယီဖိုဒါကို ဖျက်ရန်
sudo rm -rf /tmp/old_backup

# Upload တင်ထားသည့် Zip Backup ဖိုင်ကိုပါ ဖျက်ရန်
sudo rm -f /tmp/outline_backup.tar.gz
```

### အဆင့် (၄) - Cloudflare DNS ကို IP သစ် ပြောင်းခြင်း
Cloudflare Dashboard သို့သွားပြီး မိမိ၏ Domain (`outline-thai.yourdomain.com`) ၏ **A Record** နေရာတွင် ဆာဗာဟောင်း IP အစား **ဆာဗာသစ်၏ IP** ကို ပြောင်းလဲသိမ်းဆည်းလိုက်ပါ။

**ရလဒ်:**
DNS လမ်းကြောင်း ပြောင်းသွားသည်နှင့် တပြိုင်နက် သင့်ဖုန်းထဲရှိ Outline Client များအားလုံးသည် ဆာဗာသစ်ဆီသို့ **အလိုအလျောက်** ပြောင်းလဲချိတ်ဆက်သွားမည်ဖြစ်ပြီး၊ User များဘက်မှ မည်သည့်အရာမှ ပြင်ဆင်ရန် မလိုတော့ပါ။ ထို့အပြင် Outline Manager တွင်လည်း Server ပြန်လည် Add ရန် မလိုဘဲ မူလအတိုင်း ဆက်လက်အသုံးပြုနိုင်မည် ဖြစ်ပါသည်!!

---

## 🗑️ အပိုဆောင်း (Advanced): Outline Server ကို အပြီးတိုင် ဖျက်ထုတ်ခြင်း (Uninstall)

အကြောင်းအမျိုးမျိုးကြောင့် Outline ကို ဆာဗာမှ အမြစ်ပြတ် ဖျက်ထုတ်လိုပါက အောက်ပါနည်းလမ်းများထဲမှ တစ်ခုကို အသုံးပြုနိုင်ပါသည်။

**နည်းလမ်း (၁) - Official Uninstall Script အသုံးပြုခြင်း (အကောင်းဆုံးနည်းလမ်း)**
Outline မှ တရားဝင် ထုတ်ပေးထားသော Uninstall Script ဖြင့် အလွယ်တကူ ဖျက်ထုတ်နိုင်ပါသည်။
```bash
sudo bash -c "$(wget -qO- https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/server_manager/install_scripts/uninstall_server.sh)"
```

**နည်းလမ်း (၂) - Manual ဖြင့် အကြွင်းအကျန်မရှိ ဖျက်ထုတ်ခြင်း**
အကယ်၍ Script ဖြင့်ဖျက်ရန် အဆင်မပြေပါက သို့မဟုတ် Port ပြဿနာများကြောင့် လုံးဝ ပြန်အသစ်လုပ်ချင်ပါက Docker Container များနှင့် Data ဖိုဒါများကို အောက်ပါအတိုင်း ကိုယ်တိုင် ဖျက်ထုတ်နိုင်ပါသည်-
```bash
# Outline Container များကို ရပ်တန့်၍ ဖျက်ခြင်း
sudo docker rm -f shadowbox watchtower

# Outline ၏ Data ဖိုဒါများအားလုံးကို အပြီးတိုင် ရှင်းလင်းခြင်း
sudo rm -rf /opt/outline
```
ထိုသို့ ဖျက်ပြီးပါက ဆာဗာသည် Outline မတင်ရသေးသည့် မူလအခြေအနေသို့ ပြန်လည်ရောက်ရှိသွားမည် ဖြစ်ပါသည်။
