# TeklifPilot P1–P2 — Teslim notları

## Mimari

- Ürün adı kullanıcıya görünen metinlerde **Talpio**; paket scope `@talpio/*` değişmedi.
- Legacy marketplace (`JobRequest → Offer → Order`) korunur.
- Yeni domain: `CommerceRequest` (`commerce_requests`) + `RequestOffer` + `RequestMatch` + `RequestOrderLink`.
- Köprü: `JobRequest.commerceRequestId` (opsiyonel); accept → `Order` (`source=COMMERCE_REQUEST`, `jobRequestId/offerId` null) + `RequestOrderLink`.
- RBAC: `PlatformRole` + `RolePermission` + `UserRoleAssignment` + `Business*` membership; `PermissionsGuard` + `@RequirePermissions`.
- Kategori dikeyi: `AttributeSchema` JSON (madeni yağ seed); kategoriye özel tablo yok.

## Migration

```
cd apps/backend
npx prisma migrate dev --name teklifpilot_rbac_commerce_request
npx prisma generate
npx prisma db seed
```

Migration: `apps/backend/prisma/migrations/20260806145616_teklifpilot_rbac_commerce_request`

## Lokal komutlar

```powershell
cd D:\Projects\usta-pilot
npm run build --workspace=@talpio/types --workspace=@talpio/business-logic --workspace=@talpio/config --workspace=@talpio/localization --workspace=@talpio/validation --workspace=@talpio/api-client
cd apps\backend
npm test
npm run start:dev
```

Web: `/tedarik` (alıcı yağ talebi), `/satici/tedarik` (eşleşen talepler + teklif).

## Ana dosya listesi

| Alan | Dosyalar |
| --- | --- |
| Rename | `packages/localization`, `packages/config/src/app.ts`, `apps/admin/.../layout.tsx`, AI prompt, README |
| Types | `packages/types/src/enums/{rbac,request,roles,messaging}.ts`, `models/{rbac,request,attribute-schema}.ts` |
| Business logic | `packages/business-logic/src/{permissions,rbac}.ts` |
| Prisma | `apps/backend/prisma/schema.prisma`, seed `platform-roles.ts`, `categories.ts` |
| Backend | `modules/rbac`, `modules/businesses`, `modules/requests`, auth permissions guard |
| Config / client | `packages/config/src/api-routes.ts`, `packages/api-client/src/resources/requests.ts` |
| Web | `apps/web/src/app/tedarik/**`, `features/requests/**`, `satıcı/tedarik` |
| Docs | bu dosya |

## Test sonuçları (teslim anı)

| Paket / suite | Sonuç |
| --- | --- |
| `@talpio/business-logic` | 93 passed |
| `@talpio/localization` | 16 passed |
| Backend focused (RBAC/requests/offers/orders/jobs/notifications/ai) | **110 passed** |
| Backend `tsc --noEmit` | temiz |
| Migration | `20260806145616_teklifpilot_rbac_commerce_request` uygulandı |
| Seed | 11 platform rolü + madeni-yag attribute schema OK |

## Bilinen borç

- Attribute schema web’de dinamik render değil; yağ formu alanları UI’da sabit (şema seed’te).
- Supplier onboarding UI ince; `/businesses/supplier` API var, tam sihirbaz yok.
- Admin request moderate listesi yok (`admin.request.moderate` permission hazır).
- Campaign / CRM / WorkOrder modelleri yok (izin kodları rezerv).
- Mevcut AI system prompt DB’de eski sürüm kalmış olabilir; seed yalnızca yoksa yazar.
- Expo mobil B2B yok (bilinçli).
