# SC5–SC7 + Vizyon omurgası — Teslimat

Ücretsiz lansman önceliği: Premium/AI (SC8) **ertelendi**. Mock AI canlıda kalabilir.

## SC5 — Keşfet + kategori takip

- Prisma `CategoryFollow` + `DealMetadata.categoryId` FK
- API:
  - `GET /social/discover`
  - `POST|DELETE /social/categories/:categoryId/follow`
  - `GET /social/categories/following`
- Ranking: kategori takip **+60**
- Web: `/kesfet`, SocialShell nav, kategori detay takip CTA
- Mobile: müşteri sekmesi `feed` (Akış + Keşfet)

## SC6 — Sosyal analytics

- `GET /social/analytics/me`
- Web sağ ray: `SocialAnalyticsCard`

## SC7 — Audience targeting (logic v1)

- Home/Discover feed visibility:
  - `PUBLIC`
  - `FOLLOWERS` (takip)
  - `CATEGORY_TARGETED` (kategori takip + deal.categoryId)
  - `B2B_TARGETED` (aktif business membership)
- `PRIVATE` / `BUSINESS_ONLY` hâlâ home’da yok sayılır

## SC8 — AI social

- **Ertelendi** (free-first). Feature flag: `NEXT_PUBLIC_FEATURE_AGENT` / Premium sonra.

## Vizyon boşlukları (omurga)

| Alan | Durum |
| --- | --- |
| ERP/CRM | `CrmCustomer`, `WorkOrder` şema; outbox bridge → LINKED WorkOrder |
| B2B | `ChannelRelation`, `B2bCampaign` şema (API paneli sonra) |
| Multi-currency / locale | `BusinessLocaleSettings` (currency, country, timezone, taxId) |
| Mobile social | Temel Akış/Keşfet sekmesi |
| `@talpio/*` rename | Bilinçli olarak yapılmadı |

## Migration

`teklifpilot_sc5_vision_foundations` (CategoryFollow + ERP/B2B/locale)
