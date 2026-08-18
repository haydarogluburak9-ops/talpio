# i18n kapsam raporu (Faz 38)

Kaynak dil: TR. EN katalog anahtarları `packages/localization` testinde birebir eşlenir.

| Yüzey | Kaynak | Durum |
| --- | --- | --- |
| Paylaşılan katalog | `packages/localization` TR+EN | Anahtar paritesi testte zorunlu |
| Web | `t()` + katalog | Landing sahte metriklerden arındırıldı |
| Admin | kısmi katalog | Rol dili “Satıcı / İşletme” |
| Mobil | aynı katalog + `useI18n` | Ayarlar / yasal TODO / hesap silme |

Kasıtlı hardcoded:

- Demo e-posta / seed
- API hata mesajları (backend TR)
- Bazı admin etiketleri

Eksik: tüm web string’lerinin katalogda olması (kademeli). Yeni ekranlar `t()` kullanır.
