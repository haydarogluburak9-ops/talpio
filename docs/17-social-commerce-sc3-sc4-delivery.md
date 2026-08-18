# Social Commerce SC3 + SC4 Delivery

## Shipped

### SC3 — DealMetadata + post types
- `PostType` genişletildi: STANDARD, DEAL, SPECIAL_PRICE, DISCOUNT, BULK_PRICE, LIMITED_STOCK, CLEARANCE, SERVICE_PROMOTION, B2B_CAMPAIGN, NEW_PRODUCT, BUSINESS_UPDATE (+ mevcutlar)
- `PostVisibility` genişletildi: BUSINESS_ONLY, CATEGORY_TARGETED, B2B_TARGETED, PRIVATE (+ PUBLIC, FOLLOWERS)
- Prisma `DealMetadata` modeli + migration `teklifpilot_social_commerce_sc3`
- Create post DTO nested `deal`; DEAL/SPECIAL_PRICE/DISCOUNT için fiyat veya ürün/başlık zorunlu
- `deal` varken TEXT/STANDARD → DEAL
- Dual-write: DealMetadata + legacy `promo_*` kolonları
- Mapper: `deal` + `promo` (promo DealMetadata’dan aynalanır)
- Legacy promo alanları hâlâ CAMPAIGN üretir ve DealMetadata’ya da yazılır

### SC4 — Bridges
- `SocialBridgeService`
  - `createRequestFromPost` → yalnızca `RequestsService.create` (Prisma CommerceRequest yok)
  - `shareRequestToFeed` → REQUEST_SHARE; aynı kullanıcı+request için idempotent
- Endpoints:
  - `POST /social/posts/:id/create-request`
  - `POST /social/requests/:requestId/share`
- Audit: `social.post.create_request`
- Publish otomatik social share yok (explicit only)

### Feed ranking v1
- Read-time skor (`feed-ranking.ts`):
  - +100 takip
  - +40 DealMetadata / DEAL|SPECIAL_PRICE|DISCOUNT|CAMPAIGN (+commerce kinds)
  - +20 endsAt ≤ 72h ve gelecek
  - +10·log1p(engagement) (cap)
  - −ageHours·0.5
- Home feed visibility: PUBLIC + (FOLLOWERS if following); SC7 hedefleri yok sayılır
- Engeller hâlâ dışlanır

### Web
- PostCard: fırsat/promo → “Talep oluştur” → `/tedarik/[id]`
- Composer: structured `deal` + type DEAL
- Request detail: “Akışta paylaş”
- api-client + i18n anahtarları

## Deferred
| Faz | Ne | Not |
| --- | --- | --- |
| SC5 | Keşfet + kategori takip | Ranking v1 bu turda; keşfet UI/sonra |
| SC6 | İşletme social analytics | Sonra |
| SC7 | B2B audience targeting logic | Enum hazır; feed filtre logic sonra |
| SC8 | AI social (kredi) | Sonra |

## Known debt
- Feed cursor hâlâ `createdAt` tabanlı; ranking sonrası cursor tutarlılığı v2
- `RequirePermissions` OR semantiği — her iki izin zorunluluğu service/RBAC seed’e bağlı
- Quantity DealMetadata string → CommerceRequest Decimal; birim dönüşümü sınırlı
- Composer hâlâ basit promo UI; tam DealMetadata formu yok
