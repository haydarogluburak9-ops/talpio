# TR / EN i18n parity — 2026-08-17

Kaynak dil: **TR** (`packages/localization/src/locales/tr.ts`).  
EN aynı anahtar şeklini takip eder; DE/ES/FR/AR `...en` yayar.

## Bu fazda netleştirilen anahtarlar

- `nav.serviceRequests` / `nav.supplyRequests` / `nav.newServiceRequest` / `nav.newSupplyRequest`
- `commerce.createTitle` / `myListTitle` / `chooseSupply` → **Ürün / tedarik talebi**
- `admin.jobRequests` → **Hizmet talepleri**
- `admin.commerceRequests` → **Ürün / tedarik talepleri**
- Feature-off metinleri: `payments.featureOff`, `agent.featureOff`, `billing.featureOff`
- Hikâye boş durum: `social.storiesEmpty`, `social.storiesEmptyCta`
- Admin ops: `systemHealth`, `backupStatus`, `workerDown`, kuyruk etiketleri

## Kalan hardcoded (bilinçli / sonraki)

| Yer | Not |
| --- | --- |
| `apps/admin/src/lib/labels.ts` | Durum/rol TR sabit; audit etiketleri bu fazda genişletildi |
| `apps/web/src/features/jobs/create-job-form.tsx` | Alan etiketleri kısmen hardcoded |
| `apps/web/src/features/requests/my-commerce-requests.tsx` | Sayfa gövdesi kısmen hardcoded |
| `apps/web/src/features/businesses/seller-ops-panels.tsx` | ERP paneli TR ağırlıklı |
| Backend `AppException` mesajları | API TR; istemci `error.message` gösterir |

## Parite

TR ve EN katalogları aynı anahtar ağacına sahip olmalıdır (`Messages` tipi). Yeni anahtar eklenince EN zorunlu; diğer diller `...en` ile iner.
