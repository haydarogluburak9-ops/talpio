# Mobil parity — 2026-08-17

ERP (CRM / WorkOrder / kampanya admin) **mobil kopyası yok**; bilinçli.

| Akış | Web | Mobil | Not |
| --- | --- | --- | --- |
| Sosyal akış | Tam (sekme, composer, trending) | Kart + beğeni/kaydet | Composer / feed sekmeleri web’de |
| Hikâyeler | Ray + görüntüleyici + boş CTA | Ray + görüntüleyici | Compose “+” web’de |
| Grup sohbet | Var | Var | |
| Teklif karşılaştırma | Tablo + rozet | Kart + rozet | “EN İYİ TEKLİF” yok |
| Profil | Sekmeler (deal/kampanya/portföy) | Public profil + hesap | İşletme sekmeleri web’de |
| Hizmet talebi | `/taleplerim` | `/customer/jobs` | |
| Ürün / tedarik | `/tedarik*` | `/customer/requests` | |
| Ödeme | Flag kapalıysa açıklama | Aynı flag + açıklama | Mock canlı gibi satılmaz |

## Bu fazda tamamlanan mobil iş

- `EXPO_PUBLIC_FEATURE_PAYMENTS/AGENT/PREMIUM` okunur
- Ödeme ekranı flag kapalıysa kırık liste yerine açıklama gösterir
- Hikâye boş kopyası katalogdan gelir

## Bilinçli ertelenen

- Web feed composer / sekme klonu
- Satıcı ERP paneli
- Hikâye oluşturma CTA
