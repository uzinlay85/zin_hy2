# TrustTunnel + Hysteria 2 (Zin Panel) တွဲဖက်တပ်ဆင်နည်း လမ်းညွှန်
(ဆာဗာတစ်ခုတည်းတွင် နှစ်မျိုးလုံး Run ရန် TrustTunnel အား ပြင်ဆင်ခြင်း)

## ဘာကြောင့် ပြင်ဆင်ရန် လိုအပ်သလဲ?
ပုံမှန်အားဖြင့် TrustTunnel သည် လုံခြုံရေးချိတ်ဆက်မှုများအတွက် Port `443` ကို အသုံးပြုပါသည်။ သို့သော် Hysteria 2 ၏ Web UI (Zin Panel) အလုပ်လုပ်ရန်အတွက် Nginx ကလည်း Port `443` ကို လိုအပ်ပါသည်။ 
အကယ်၍ ဆာဗာတစ်ခုတည်းတွင် နှစ်မျိုးလုံးကို တပ်ဆင်မည်ဆိုပါက Port 443 အချင်းချင်း လုပြီး (Conflict ဖြစ်ကာ) Web UI သို့မဟုတ် TrustTunnel တစ်ခုခု အလုပ်မလုပ်တော့သည့် ပြဿနာ ဖြစ်တတ်ပါသည်။

ထို့ကြောင့် Nginx ကို မထိခိုက်စေရန် **TrustTunnel ၏ Port ကို 8443 သို့ ပြောင်းလဲပေးခြင်းဖြင့်** နှစ်မျိုးလုံးကို ဆာဗာတစ်ခုတည်းတွင် အဆင်ပြေချောမွေ့စွာ တွဲဖက် အသုံးပြုနိုင်ပါသည်။

---

## အဆင့် (၁) - TrustTunnel ၏ Config ဖိုင်အား ပြင်ဆင်ခြင်း

TrustTunnel ၏ Configuration ဖိုင်သည် `/opt/trusttunnel/vpn.toml` တွင် ရှိပါသည်။ Nginx အတွက် Port 443 ကို လွှတ်ပေးပြီး TrustTunnel ကို 8443 ပြောင်းပါမည်။

Terminal တွင် အောက်ပါ Command ကို ရိုက်ထည့်၍ အလိုအလျောက် ပြင်ဆင်နိုင်ပါသည် -

```bash
sudo sed -i 's/listen_address = "0.0.0.0:443"/listen_address = "0.0.0.0:8443"/g' /opt/trusttunnel/vpn.toml
```

**(သို့မဟုတ်) Nano ဖြင့် ကိုယ်တိုင် ဝင်ရောက်ပြင်ဆင်လိုပါက :**
```bash
sudo nano /opt/trusttunnel/vpn.toml
```
ဖိုင်ထဲရှိ အပေါ်ဆုံးနားတွင် `listen_address = "0.0.0.0:443"` ကို ရှာပြီး၊ `listen_address = "0.0.0.0:8443"` ဟု ပြင်ပါ။ ထို့နောက် `Ctrl + O`, `Enter`, `Ctrl + X` နှိပ်၍ သိမ်းပါ။

---

## အဆင့် (၂) - ပြောင်းလဲမှုအား အသက်သွင်းခြင်း

TrustTunnel အား အတင်းပိတ်ပြီး အလိုအလျောက် ပြန်ပွင့်လာစေရန် (Restart ချရန်) အောက်ပါ Command ကို ရိုက်ပါ -

```bash
sudo pkill -f trusttunnel_endpoint
```
*(ယခုအခါ Systemd မှ TrustTunnel အား Port သစ် `8443` ဖြင့် အလိုအလျောက် ပြန်လည် Run ပေးပါလိမ့်မည်)*

---

## အဆင့် (၃) - Nginx အား Port 443 အပ်နှင်းခြင်း

TrustTunnel မှ Port 443 အား လွှတ်ပေးလိုက်ပြီဖြစ်၍၊ Hysteria 2 (Zin Panel) အလုပ်လုပ်နိုင်ရန် Nginx ကို ပြန်လည် Restart ချပေးရပါမည်။

```bash
sudo systemctl restart nginx
```

---

## အဆင့် (၄) - Firewall (UFW) တွင် Port 8443 အား ဖွင့်ပေးခြင်း

TrustTunnel သည် ယခုအခါ Port `8443` ဖြင့် အလုပ်လုပ်မည်ဖြစ်၍ UFW (Firewall) တွင် အဆိုပါ Port အား ဖွင့်ပေးရန် လိုအပ်ပါသည်။

```bash
sudo ufw allow 8443/tcp
sudo ufw allow 8443/udp
sudo ufw reload
```

---

## အတည်ပြုခြင်း (Verification)

ယခုဆိုလျှင် ဆာဗာတစ်ခုတည်းတွင် နှစ်မျိုးလုံး အလုပ်လုပ်နေပြီ ဖြစ်သည် -
1. **Zin Panel (Hysteria 2)** သည် `https://your-domain.com` သို့မဟုတ် Port `443` ဖြင့် ပုံမှန်အတိုင်း ဆက်လက် အလုပ်လုပ်နေပါမည်။
2. **TrustTunnel** အသုံးပြုမည့် Client များဘက် (ဖုန်း/ကွန်ပျူတာ အက်ပ်များ) တွင်မူ Server Port အား `443` အစား **`8443`** သို့ ပြောင်းလဲ ချိတ်ဆက်ပေးရပါမည်။
