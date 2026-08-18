# Production hardening — 2026-08-17

Ödeme checkout/3DS ve avukat metinleri **bu fazın dışında**.

## 1. Yapılanlar

1. **Worker:** Redis nabzı, bağlantı/stalled/closed log, 3 deneme + exponential backoff, `dead-letter` kuyruğu, worker `dispatchStrict` (hata yutulmaz). Admin’de worker kapalı uyarısı.
2. **Gözlem:** `/health/status`, `/health/queues`; PostgreSQL, Redis, MinIO, kuyruk, AI sürücü (canlı probe yok). Admin `/system-health`.
3. **Yedek:** Admin `/backup` — son doğrulama zamanı + checklist. Otomatik “yedek alındı” iddiası yok.
4. **API:** `STRICT_MIGRATION_CHECK` ile bekleyen migrasyon açılışı keser (test hariç).
5. **E2E:** Playwright `e2e/` (API senaryoları: kayıt, giriş, sıfırlama, tedarik talebi, teklif, mesaj, bildirim, profil, hesap silme, moderasyon, sağlık). CI `SEED_DEMO_ACCOUNTS=true` + `npm run e2e`. Tarayıcı UI akışları sonraki borç.
6. **Domain:** JobRequest = hizmet talebi; CommerceRequest = ürün / tedarik talebi (web/admin etiketleri).
7. **Flag:** Payments/agent/premium kapalıysa açıklamalı yüzey; kırık liste yok.
8. **i18n:** TR/EN anahtarları genişletildi; rapor `docs/29-i18n-parity.md`.
9. **Admin:** Moderasyon filtre/arama/toplu red; fraud durum güncelleme; audit etiketleri.
10. **Audit:** login, logout, logout-all, register, password reset, hesap silme, rol atama, trust recompute, backup verify, fraud.
11. **Mobil:** Feature flag + ödeme açıklaması; parity raporu `docs/30-mobile-parity.md`. ERP kopyası yok.
12. **Hikâye:** 24s kuralı duruyor; boşsa son 24s PUBLIC medya yedek havuzu + keşfet CTA.
13. **Repo:** Rename yok; `docs/31-repo-cleanup.md`.

## 2. Değiştirilen başlıca dosyalar

- `packages/types/src/queues.ts`, `packages/config/src/api-routes.ts`, `packages/localization/src/locales/{tr,en}.ts`
- `apps/backend/src/infra/queue/*`, `worker.ts`, `health/*`, `prisma.service.ts`, `env.schema.ts`
- `apps/backend/src/modules/{auth,users,admin,notifications,social,rbac,businesses}`
- `apps/admin` sistem sağlığı, yedek, moderasyon, fraud, nav
- `apps/web` nav, hikâye boş durum, satıcı panel flag metinleri
- `apps/mobile` env flag + ödeme açıklaması
- `e2e/*`, `.github/workflows/ci.yml`

## 3. Kritik riskler

- Worker hâlâ ayrı süreç; `npm run dev` tek başına worker açmaz (`dev:worker` / compose `full`).
- iyzico authorize ≠ 3DS. Payments flag kapalı.
- Yasal sayfalar ürün özeti; avukat metni yok.
- `JWT_REFRESH_SECRET` env’de zorunlu ama refresh JWT değil.
- Backup doğrulama insan kaydı; cron yok.
- AI health canlı sağlayıcıyı çağırmaz (bilinçli).

## 4. Kalan borç

- Playwright senaryoları API ağırlıklı; tam tarayıcı UI (form tıklama) sonraki faz.
- Web job formu ve ERP paneli hardcoded TR.
- Admin okuma uçları hâlâ ağırlıklı `@Roles`; yazma (moderasyon/fraud) `@RequirePermissions` ile sıkılaştırıldı.
- `document-generation` / `media-analysis` kuyrukları boş iskelet.

## 5. Production readiness

İç puan (ödeme/hukuk hariç, 10 = canlıya hazır):

| Alan                 | /10   |
| -------------------- | ----- |
| Architecture         | 8     |
| Backend              | 8     |
| Observability        | 8     |
| Web                  | 8     |
| Mobile               | 7     |
| Admin                | 8     |
| Security             | 8     |
| Production readiness | **7** |

Canlı blokörler (bu faz dışı): avukat metni, 3DS/checkout + canlı anahtar, production AI anahtarı, gerçek yedek cron’u.
