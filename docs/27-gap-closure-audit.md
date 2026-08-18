# Talpio gap-closure — Aşama 1 + teslim (2026-08-13)

Kod yazılmadan önce tarama. Mimari yeniden yazılmadı.

| Alan | Önce | Sonra | Not |
| --- | --- | --- | --- |
| 1. Backend | PARTIAL | PARTIAL | HTTP sürücüler bağlandı; canlı anahtar/3DS/checkout yok |
| 2. Web | PARTIAL | PARTIAL | Ticaret listesi + karşılaştırma + CRM/kanban var; yasal TODO |
| 3. Mobile | PARTIAL | PARTIAL | Beğen/kaydet + ticaret listesi; `@username` ve ERP klonu yok |
| 4. Admin | PARTIAL | PARTIAL | Commerce/moderasyon/fraud/AI ekranları eklendi |
| 5. Social | PARTIAL | PARTIAL | İşletme analytics uç; stories hâlâ stub |
| 6. Marketplace | PARTIAL | PARTIAL | iyzico HTTP var; 3DS UI yok |
| 7. ERP | PARTIAL | PARTIAL | Kanban + atama API |
| 8. CRM | PARTIAL | PARTIAL | Follow-up, analitik, not+dosya |
| 9. AI | PARTIAL | PARTIAL | OpenAI/Anthropic HTTP; onay teklif fiyatı basmaz |
| 10. Billing | PARTIAL | PARTIAL | Checkout hâlâ yok |
| 11. Notifications | PARTIAL | PARTIAL | FCM/SMTP HTTP; production mock yasak |
| 12. Security | PARTIAL | PARTIAL | Tenant köprü düzeltildi; upload throttle |
| 13. Production Readiness | PARTIAL | PARTIAL | Backup runbook; yasal TODO; sağlayıcı anahtarı operasyon |
| 14. Testing | PARTIAL | PARTIAL | Unit 357 geçti; Playwright yok |
| 15. DevOps | PARTIAL | PARTIAL | Runbook var; otomatik dump yok |

## Düzeltilenler (bu tur)

P0
- Order→CRM/WorkOrder `tenantId` = `business.id` (işletme yoksa köprü atlanır)
- Production mock push/email reddi
- OpenAI / Anthropic / FCM / SMTP / iyzico HTTP
- Agent onay: hatırlatma + teklif taslağı (fiyatsız reminder) + kampanya DRAFT
- Upload throttle

P1
- CRM follow-up CRUD, analitik, not’a dosya
- WorkOrder kanban + assignment
- Admin: ticaret talepleri, moderasyon, fraud, AI usage, cüzdan kartı
- Web: `/tedariklerim`, hesap özeti, `compareOffers`
- Satıcı paneli CRM/erişim + kanban
- Mobil: beğen/kaydet, ticaret talepleri listesi
- İşletme sosyal analytics

## Kalan (bilinçli / lansman)

- Avukat yasal metin
- Playwright E2E
- Abonelik checkout / iyzico 3DS UI
- Mobil `@username` vitrin ve ERP klonu (istenmedi)
- Stories / grup sohbet stub
- JobRequest + CommerceRequest ikiliği
- Otomatik yedek cron’u (yalnızca `docs/28-backup-runbook.md`)

Yerel: `npm run db:migrate` (`crm_customer_notes.file_asset_id`).

## Test / typecheck

- Backend Jest: 41 suite, 357 test geçti
- `tsc --noEmit`: backend, web, admin, mobile geçti

## Puan (iyimser değil)

| Alan | /10 |
| --- | --- |
| Architecture | 8 |
| Backend | 8 |
| Web | 8 |
| Mobile | 7 |
| Admin | 8 |
| Marketplace | 8 |
| Social | 8 |
| ERP | 8 |
| AI | 8 |
| Security | 8 |
| Production Readiness | 7 |
