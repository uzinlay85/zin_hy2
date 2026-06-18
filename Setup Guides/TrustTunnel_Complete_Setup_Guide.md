# TrustTunnel VPN Server Complete Setup Guide (Hysteria 2 နှင့် တွဲဖက်သုံးရန်)

TrustTunnel သည် Traffic များကို ပုံမှန် **HTTPS (HTTP/1.1, HTTP/2) သို့မဟုတ် QUIC** Traffic များအဖြစ် ပုံဖျက် (Obfuscate) ပေးသောကြောင့် မြန်မာနိုင်ငံရှိ ISP များနှင့် တယ်လီကွန်းများ၏ **DPI (Deep Packet Inspection)** စနစ်များကို ကောင်းမွန်စွာ ကျော်ဖြတ်နိုင်သော ခေတ်မီ Open-Source VPN Protocol တစ်ခု ဖြစ်သည်။

ဤလမ်းညွှန်သည် ဆာဗာတစ်ခုတည်းတွင် **Hysteria 2 (Zin Panel) နှင့် TrustTunnel** နှစ်မျိုးလုံးကို Nginx Port (443) အချင်းချင်း မလုဘဲ အဆင်ပြေချောမွေ့စွာ အလုပ်လုပ်နိုင်ရန် အထူးပြုပြင်ရေးသားထားခြင်း ဖြစ်ပါသည်။

## ကြိုတင်လိုအပ်ချက်များ (Prerequisites)

- **OS:** Ubuntu Linux (သို့မဟုတ် သဟဇာတဖြစ်သော Linux VPS)
- **Domain Name:** VPS IP သို့ ညွှန်ပြထားသော Domain (ဥပမာ - `th02.yourdomain.com`)
- **Open Ports:** Let's Encrypt အတွက် **Port 80** နှင့် VPN အတွက် **Port 8443** ကို Firewall (UFW) တွင် ဖွင့်ထားရပါမည်။
```bash
sudo ufw allow 80/tcp
sudo ufw allow 8443/tcp
sudo ufw allow 8443/udp
sudo ufw reload
```
*(မှတ်ချက် - Nginx သည် TrustTunnel ချိန်ညှိချိန်၌ ခေတ္တပိတ်ထားရမည် ဖြစ်သော်လည်း၊ နောက်ပိုင်းတွင် Hysteria 2 Web Panel ထံ `http://` ဖြင့် ဝင်လာသူများကို လုံခြုံသော `https://` သို့ အလိုအလျောက် ပြောင်းပေးနိုင်ရန် UFW တွင် Port 80 ကို အမြဲဖွင့်ထားရပါမည်။)*

## အဆင့် (၁) - TrustTunnel Endpoint (Server) အား Install လုပ်ခြင်း

အလိုအလျောက် Install လုပ်ပေးမည့် Official Script ကို အသုံးပြု၍ အောက်ပါအတိုင်း ရိုက်ထည့်သွင်းပါသည်-

```bash
curl -fsSL https://raw.githubusercontent.com/TrustTunnel/TrustTunnel/refs/heads/master/scripts/install.sh | sh -s -
```

- **ရလဒ်:** ဤ Script သည် လိုအပ်သော Binary ဖိုင်များကို ဒေါင်းလုဒ်ဆွဲပြီး `/opt/trusttunnel` ဖိုဒါထဲသို့ စနစ်တကျ ထည့်သွင်းပေးသွားမည် ဖြစ်သည်။

## အဆင့် (၂) - Setup Wizard ဖြင့် Configuration များ သတ်မှတ်ခြင်း

> [!WARNING]
> **Nginx ကို ခေတ္တပိတ်ထားရန် အလွန်အရေးကြီးပါသည်!**
> Setup Wizard မှ လုံခြုံရေး Certificate တောင်းခံရန် Port 80 ကို အသုံးပြုမည် ဖြစ်သဖြင့် Hysteria 2 အတွက် မောင်းနှင်နေသော Nginx နှင့် မတိုက်မိစေရန် Wizard မစတင်မီ အောက်ပါ Command ဖြင့် Nginx ကို အရင်ဆုံး ပိတ်ထားရပါမည်-
> ```bash
> sudo systemctl stop nginx
> ```

Nginx ပိတ်ထားပြီးပါက အောက်ပါ Command ကို အသုံးပြု၍ Interactive Setup Wizard ကို မောင်းနှင်ပါ-

```bash
cd /opt/trusttunnel
sudo ./setup_wizard
```

### Wizard တွင် ရွေးချယ်ရမည့် အချက်အလက်များ-

1. **The address to listen on:** **`0.0.0.0:8443`** ဟု သတ်မှတ်ပါ။ *(အရေးကြီးသည် - Hysteria 2 ၏ Nginx နှင့် မတိုက်မိစေရန် 443 အစား 8443 ကို သုံးရပါမည်)*
2. **User Credentials (အကောင့်ဆောက်ခြင်း):**
    - ပထမအကောင့်: Username `zinko` နှင့် Password သတ်မှတ်ပါ။
    - ဒုတိယအကောင့်: Username `myo` နှင့် Password သတ်မှတ်ပါ။
    - (ထွက်လာသည့် Config: `credentials.toml`)
3. **Connection filtering rules:** `no` ဟု ရွေးချယ်ပါ။ (အထူး ကန့်သတ်ချက်မထားဘဲ အားလုံးကို ချိတ်ဆက်ခွင့်ပြုရန်)
4. **Certificate Creation:** `Issue a Let's Encrypt certificate (requires a public domain)` ကို ရွေးချယ်ပါ။
5. **Domain & Email:**
    - Domain: `th02.yourdomain.com` *(မိမိ၏ အမှန်တကယ် Domain ထည့်ပါ)*
    - Email: `zinko@gmail.com`
6. **Challenge method:** `HTTP-01` ကို ရွေးချယ်ပါ။
7. **Use Let's Encrypt staging environment:** `no` ဟု ရွေးချယ်ပါ။ (တကယ့် အစစ်အမှန် Production Certificate ရယူရန်)
8. **Configure alternative SNIs:** `no` ဟု ရွေးချယ်ပါ။ (Domain တစ်ခုတည်းဖြင့် လုံလောက်သောကြောင့်)

- **ရလဒ်:** `vpn.toml`, `hosts.toml`, `credentials.toml` နှင့် SSL သက်သေခံလက်မှတ် `certs/cert.pem`, `certs/key.pem` တို့ အောင်မြင်စွာ ထွက်ရှိလာပါမည်။

> [!IMPORTANT]
> **Nginx ကို ပြန်လည်ဖွင့်ရန်**
> Wizard အောင်မြင်စွာ ပြီးဆုံးသွားပြီ ဖြစ်သဖြင့် Hysteria 2 (Zin Panel) ပြန်လည် အလုပ်လုပ်နိုင်ရန် Nginx ကို အောက်ပါ Command ဖြင့် ချက်ချင်း ပြန်ဖွင့်ပေးပါ-
> ```bash
> sudo systemctl start nginx
> ```

## အဆင့် (၃) - Setup ကာလအတွင်း ကြုံတွေ့ရနိုင်သော ပြဿနာများနှင့် ဖြေရှင်းနည်း (Troubleshooting)

### ပြဿနာ (၁) - Let's Encrypt Staging Environment ကို Yes မိခြင်း

- **အကျိုးဆက်:** `yes` ရွေးမိပါက Let's Encrypt က စမ်းသပ်ဆဲ (Fake) လက်မှတ်ကို ထုတ်ပေးမည်ဖြစ်ပြီး Client App များမှ ချိတ်ဆက်သောအခါ "Untrusted Certificate" ဟု ပြကာ **VPN ချိတ်၍ ရမည်မဟုတ်ပါ။**
- **ဖြေရှင်းနည်း:** မေးခွန်းတွင် **`no`** ကိုသာ သေချာစွာ ရွေးချယ်ပေးရမည်။

## အဆင့် (၄) - VPN Server ကို Background တွင် အမြဲ Run ထားခြင်း (Systemd)

Server ပိတ်သွားလျှင်ပင် VPN အလိုအလျောက် ပြန်ပွင့်နေစေရန်နှင့် Background တွင် အမြဲ Run နေစေရန် Systemd Service အဖြစ် သတ်မှတ်ပေးရပါမည်။

```bash
cd /opt/trusttunnel/
sudo cp trusttunnel.service.template /etc/systemd/system/trusttunnel.service
sudo systemctl daemon-reload
sudo systemctl enable --now trusttunnel
```

### Server Status စစ်ဆေးရန် Command:
```bash
sudo systemctl status trusttunnel
```
*(အစိမ်းရောင်ဖြင့် `active (running)` ပြနေပါက အောင်မြင်ပါသည်။ ပြန်ထွက်ရန် `q` ကို နှိပ်ပါ)*

## အဆင့် (၅) - User များအတွက် Client Link (`tt://`) ထုတ်ယူခြင်း

ဖုန်း သို့မဟုတ် ကွန်ပျူတာ အက်ပ်များတွင် ထည့်သွင်းအသုံးပြုနိုင်ရန်အတွက် `tt://` ပုံစံ Deep-Link များကို အောက်ပါ Command များဖြင့် ထုတ်ယူနိုင်ပါသည်-

*(မှတ်ချက် - Port 8443 ကို ပြောင်းလဲအသုံးပြုထားသောကြောင့် `-a` အနောက်တွင် Domain အမည်နှင့်အတူ **`:8443`** ကို မပျက်မကွက် ထည့်သွင်းပေးရပါမည်)*

- **`zinko` အကောင့်အတွက် Link ထုတ်ရန်:**
```bash
./trusttunnel_endpoint vpn.toml hosts.toml -c zinko -a th02.yourdomain.com:8443
```
    
- **`myo` အကောင့်အတွက် Link ထုတ်ရန်:**
```bash
./trusttunnel_endpoint vpn.toml hosts.toml -c myo -a th02.yourdomain.com:8443
```

Terminal တွင် ထွက်လာမည့် `tt://?username=...` အစရှိသည့် စာတန်းရှည်ကြီးကို Copy ကူးယူပြီး သိမ်းဆည်းထားကာ Client App ထဲတွင် ထည့်သွင်း (Import) အသုံးပြုရမည် ဖြစ်သည်။

## အဆင့် (၆) - ပြုပြင်ထိန်းသိမ်းခြင်းနှင့် Log စစ်ဆေးခြင်း (Maintenance)

VPN Server ၏ အခြေအနေ၊ Connection ဝင်မဝင်နှင့် Error များကို အောက်ပါ `journalctl` Command များဖြင့် စစ်ဆေးနိုင်ပါသည်-

- **Live Log (အချိန်နဲ့တစ်ပြေးညီ လိုက်ကြည့်ရန်):**
```bash
sudo journalctl -u trusttunnel -f
```
*(ထွက်လိုပါက **Ctrl + C** ကို နှိပ်ပါ)*
    
- **နောက်ဆုံးဖြစ်ပျက်ခဲ့သော Log အလိုင်း ၁၀၀ ကို ကြည့်ရန်:**
```bash
sudo journalctl -u trusttunnel -n 100 --no-pager
```
    
- **ယနေ့တစ်နေ့တာ Log များကိုသာ သီးသန့်စစ်ရန်:**
```bash
sudo journalctl -u trusttunnel --since today
```

---

## ဖြည့်စွက်ချက် - User အသစ်များ ထပ်မံထည့်သွင်းနည်း

နောက်ထပ် User အသစ်တွေ (ဥပမာ - ဝယ်သူတွေ သို့မဟုတ် သူငယ်ချင်းတွေ) ထပ်တိုးချင်တယ်ဆိုရင် Setup ကြီးတစ်ခုလုံးကို ပြန်လုပ်စရာ မလိုပါဘူး။

`/opt/trusttunnel/credentials.toml` ဖိုင်ထဲမှာ အကောင့်အသစ်ကို သွားထည့်ပေးပြီး Server ကို တစ်ခေါက် Restart ချပေးရုံပါပဲ။ အောက်ပါအတိုင်း အဆင့်ဆင့် လုပ်ဆောင်နိုင်ပါတယ် -

### အဆင့် (၁) - Credentials ဖိုင်ထဲတွင် User အသစ် ထည့်ခြင်း

ဖိုင်ကို ပြင်ဆင်ရန်အတွက် `nano` text editor ဖြင့် ဖွင့်လိုက်ပါ -
```bash
cd /opt/trusttunnel
sudo nano credentials.toml
```

ဖိုင်ထဲတွင် ယခင်ဆောက်ခဲ့သော `zinko` နှင့် `myo` တို့၏ အကောင့်များကို မြင်ရပါလိမ့်မည်။ ထိုစာသားများ၏ အောက်ဆုံးတွင် **User အသစ်အတွက် အောက်ပါ format အတိုင်း** ထပ်မံဖြည့်စွက်ပေးပါ -

```toml
[[client]]
username = "user_new_name"
password = "user_new_password"
```
*(မှတ်ချက် - `user_new_name` နှင့် `user_new_password` နေရာတွင် မိမိပေးလိုသော နာမည်နှင့် Password ကို အစားထိုးပါ)*

**သိမ်းဆည်းနည်း:** ဖြည့်စွက်ပြီးပါက **Ctrl + O** ကိုနှိပ်၊ **Enter** ခေါက်ပြီး၊ **Ctrl + X** ဖြင့် ပြန်ထွက်ပါ။

### အဆင့် (၂) - ပြင်ဆင်မှုများ အလုပ်လုပ်ရန် Server အား Restart ချခြင်း

User အသစ်စာရင်းကို Server က သိရှိသွားစေရန်အတွက် TrustTunnel Service ကို Restart ချပေးရပါမည် -
```bash
sudo systemctl restart trusttunnel
```

### အဆင့် (၃) - User အသစ်အတွက် ချိတ်ဆက်ရန် Link ထုတ်ယူခြင်း

ယခင်အတိုင်းပဲ User အသစ်၏ နာမည်ကို သုံးပြီး `tt://` လင့်ခ် ထုတ်ပေးလိုက်ရုံပါပဲ -
```bash
./trusttunnel_endpoint vpn.toml hosts.toml -c user_new_name -a th02.yourdomain.com:8443
```

ထွက်လာသော လင့်ခ်အသစ်ကို ထို User အသစ်၏ ဖုန်းထဲသို့ ထည့်သွင်းပေးပြီး အသုံးပြုခိုင်းနိုင်ပြီ ဖြစ်ပါသည်။
