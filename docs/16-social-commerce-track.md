# Social Commerce Track — Mevcut ürünün ÜZERİNE

Bu track, Talpio vizyonunun **yerine geçmez**. Marketplace / Request / Offer / Order / Payment / Messaging / Notification / ERP-prep / Business / AI / Queue / Outbox / RBAC / Audit / Premium AI kredi **aynen korunur**.

## Ürün hedefi (3. kullanım nedeni)

1. İhtiyacım var → Talep → Teklif  
2. Satış yapmak istiyorum → Talepleri gör → Teklif ver  
3. **Şu an ihtiyacım olmasa bile** → Fiyat / fırsat / kampanya akışını takip et  

Social Commerce yalnızca #3’ü ekler.

## Domain sınırı

| Domain | Rol |
| --- | --- |
| Request | İhtiyaç / talep |
| Offer | Teklif |
| Post | Ticari içerik yayını |
| DealMetadata | Post’a bağlı yapılandırılmış fiyat/kampanya |

Request ≠ Post. Offer ≠ Post. İlişki yalnızca FK / application service / event ile.

## Koruma kuralları

- Social module Request/Offer repository’sine doğrudan yazmaz  
- Request create → mevcut `RequestsService`  
- Bildirim / file / AI credit / audit / queue reuse  
- RBAC ≠ audience targeting  
- Sosyal paylaşım ücretsiz; Premium yalnızca AI otomasyon  

## Faz durumu

| Faz | İçerik | Durum |
| --- | --- | --- |
| SC1 | Post, media, işletme paylaşımı, basit feed | Var (Faz 2 + media) |
| SC2 | Follow, like, comment, save | Var |
| SC3 | DEAL / SPECIAL_PRICE / DISCOUNT + DealMetadata | Var — bkz. `docs/17-social-commerce-sc3-sc4-delivery.md` |
| SC4 | Post→Request, Request→REQUEST_SHARE | Var — bridge + endpoints |
| SC5 | Keşfet + ranking + kategori takip | Var — `/kesfet` + CategoryFollow (`docs/18`) |
| SC6 | İşletme social analytics | Var — `GET /social/analytics/me` |
| SC7 | B2B audience targeting | Logic v1 — CATEGORY/B2B_TARGETED feed |
| SC8 | AI social (mevcut kredi) | Ertelendi (ücretsiz lansman) |

## Request kapanınca REQUEST_SHARE

- Request `CANCELLED` / silindi → bağlı postlar akışta kalır ama `commerceRequestId` null olabilir (SetNull) veya post `deletedAt` set edilmez; UI “talep kapandı” gösterir.  
- İlk sürüm: SetNull + UI’da talep linki gizlenir.
