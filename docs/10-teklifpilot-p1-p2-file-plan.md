# TeklifPilot P1–P2 — Dosya bazlı uygulama planı

Onaylanan kararlar: ürün adı rename (paket scope sabit), RBAC önce, sonra Request + madeni yağ dikeyi, mobil B2B yok.

## 0. Ürün kimliği (paket rename yok)

| Dosya | Değişiklik |
| --- | --- |
| `packages/localization/src/locales/{tr,en}.ts` | `appName`, görünen Talpio metinleri → TeklifPilot |
| `apps/admin/src/app/layout.tsx` | metadata title |
| `apps/web` metadata (i18n üzerinden) | otomatik |
| Bildirim / e-posta şablon metinleri | localization |
| README kısa ürün adı (opsiyonel) | TeklifPilot |

**Yapılmaz (o tarihte):** `@ustapilot/*` rename. Sonradan uygulandı: `docs/22-package-rename-plan.md`.

---

## 1. P1 — RBAC omurgası

### Paylaşılan tipler
- `packages/types/src/enums/rbac.ts` — `PlatformRoleCode`, yeni `Permission` kodları (`request.*`, `offer.*` B2B, `campaign.*`, …)
- `packages/types/src/enums/roles.ts` — mevcut `UserRole` + `Permission` korunur; yeni permission’lar eklenir (legacy kırılmaz)
- `packages/types/src/models/rbac.ts` — Business, Membership, EffectivePermissions
- `packages/business-logic/src/rbac.ts` — legacy UserRole → platform permission birleşimi; `resolveEffectivePermissions`

### Prisma
- `Business`, `BusinessMembership`, `PlatformRole`, `RolePermission`, `UserRoleAssignment`, `BusinessRoleAssignment`
- Seed: roller + permission matrisleri
- Migration: `teklifpilot_rbac_request`

### Backend
- `modules/rbac/` — RbacService, seed sync, membership helpers
- `auth/decorators/require-permissions.decorator.ts`
- `auth/guards/permissions.guard.ts` — permission tabanlı; `@Roles` dual çalışır
- `AuthenticatedUser` genişletmesi: `permissionCodes[]`, `businessIds[]` (JWT validate veya request enrich)
- Audit: membership/role değişiklikleri

### Test
- `permissions.guard.spec.ts`, `rbac.service.spec.ts`, tenant isolation

---

## 2. P2 — Request domain + yağ dikeyi

### Paylaşılan
- `packages/types/src/models/request.ts` — Request aggregate, statuses, types
- `packages/types/src/models/attribute-schema.ts` — schema definition
- `packages/validation` — create request / offer DTO zod
- `packages/config` — API routes `/requests`, `/businesses`, `/request-offers`

### Prisma
- `AttributeSchema` (categoryId + version + jsonSchema)
- `CommerceRequest` (tablo `commerce_requests` — Nest `Request` çakışmasın) veya `DemandRequest` → **`CommerceRequest` mapped `requests`**
- `RequestAttachment`, `RequestMatch`, `RequestOffer`
- `RequestOrderLink` (requestOfferId → orderId)
- Order: `jobRequestId`/`offerId` **nullable**; `source` enum MARKETPLACE \| REQUEST
- Seed: kategori `madeni-yag` + attribute schema (brand, viscosity, …)
- `JobRequest.requestId` optional FK (bridge, domain karışmaz)

### Backend modules
- `modules/businesses/` — supplier profil, kategori, bölge
- `modules/requests/` — CRUD, publish, classify (deterministik), match, notify
- `modules/request-offers/` — create/list/accept
- `modules/requests/adapters/job-request.adapter.ts` — JobRequest ↔ RequestView (tek yön dönüşüm)
- `modules/requests/matching/deterministic-matcher.ts`
- Order bridge service: accept → Order + link + audit

### Bildirim
- `NotificationType.REQUEST_MATCHED`, `REQUEST_OFFER_RECEIVED`, `REQUEST_OFFER_ACCEPTED`
- localization + mevcut push kanalı

### Web (responsive; mobil app yok)
- `apps/web/src/features/requests/` — oluştur, liste, teklif karşılaştır
- `apps/web/src/features/business/` — supplier onboarding
- Supplier panel: eşleşen talepler + teklif ver
- Buyer: talep + teklif kabul

### Admin
- İsteğe bağlı: request moderate listesi (permission `admin.request.moderate`)

---

## 3. Uygulama sırası (bu döngü)

1. RBAC şema + guard + seed  
2. Request şema + attribute schema seed (yağ)  
3. JobRequest adapter (read-only view)  
4. Business/Supplier API  
5. Request create + classify + match + notify  
6. RequestOffer + accept → Order bridge  
7. Web ince UI  
8. Audit + isolation tests + rapor  

Koruma: jobs/offers/orders/payments mevcut akışları değişmez (Order nullable alanlar geri uyumlu).

---

## Teslim

P1–P2 uygulaması tamamlandı. Detay: [`docs/11-teklifpilot-p1-p2-delivery.md`](./11-teklifpilot-p1-p2-delivery.md).
