# Evrensel ticaret + sosyal medya

Talpio artık “satıcı hizmet pazarı” değil; **alınabilir / satılabilir / kampanyalanabilir her şey** için iki mantıklı platformdur.

## İki mantık

| Mantık | Ne işe yarar | Ana yüzey |
| --- | --- | --- |
| **1. Teklif al / ver** | İhtiyaç → talep → teklif → sipariş | `/tedarik`, Request / Offer |
| **2. Sosyal ticaret** | Kampanya, indirim, fırsat paylaşımı; takip / beğeni / yorum | `/akis`, `/kesfet` |

İkisi birbirinin yerine geçmez; köprüler (Post ↔ Request) bilinçli ve sınırlıdır.

## Kategori modeli

- Tohum: `COMMERCE_CATEGORIES` (gıda toptan, elektronik komponent, giyim, otomotiv, inşaat, yağ/kimya, makine, ofis, mobilya, tarım, medikal, lojistik, enerji, kozmetik, spor, gayrimenkul, profesyonel hizmetler, dijital)
- Eski satıcı dikeyi seed’de **pasifleştirilir** (`isActive: false`), silinmez
- Admin runtime’da kategori ekler / düzenler

## Sosyal medya hissi

- Akış + Keşfet + profil + takip
- Mesajlarda **sesli mesaj** (`MessageType.VOICE` + mikrofon kaydı)
- Ücretsiz lansman; Premium/AI sonra

## Bilinçli sınırlar (şimdilik)

- DM / story / reel yok (sonraki iterasyon)
- Grup sohbeti yok
- Paket adı `@talpio/*` duruyor
