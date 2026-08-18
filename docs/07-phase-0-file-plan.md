# Faz 0 — Dosya bazlı uygulama planı

Mevcut marketplace modülleri (`jobs`, `offers`, `orders`, `payments`, `messages`, `notifications`, `reviews`) değiştirilmez; yalnızca Order oluşturulunca outbox’a event eklenir.

## Yeni / değişecek dosyalar

### Paylaşılan
- `packages/types/src/queues.ts` — kuyruk adları, job payload tipleri
- `packages/types/src/agent.ts` — thread, message, tool, action proposal
- `packages/types/src/domain-events.ts` — outbox event tipleri (`order.created` köprü hazırlığı)
- `packages/types/src/models/erp-prep.ts` — WorkOrder/CRM sınır tipleri (şema henüz yok)
- `packages/config/src/api-routes.ts` — `/agent/*` rotaları
- `packages/config/src/query-keys.ts` — agent sorgu anahtarları
- `packages/api-client/src/resources/agent.ts`
- `packages/localization` — agent metinleri TR/EN

### Backend infra
- `apps/backend/src/infra/ai/*` — AiProvider, Mock, OpenAI/Anthropic iskelet, module
- `apps/backend/src/infra/queue/*` — BullMQ bağlantı, queue factory, job durumları
- `apps/backend/src/infra/outbox/*` — OutboxService, publisher scheduler
- `apps/backend/src/worker.ts` + `start:worker` script

### Backend modül
- `apps/backend/src/modules/agent/*` — sohbet, tool registry, tool use-case’ler, onay

### Prisma
- `OutboxEvent`, `AgentThread`, `AgentMessage`, `AgentToolInvocation`, `AgentActionProposal`, `Reminder`, `AiPromptVersion`, `AiUsageEvent`
- `MarketplaceWorkOrderLink` (köprü tablosu iskeleti — WorkOrder henüz yok, link Order’a hazır)

### Web
- `apps/web/src/features/agent/*` + panel entegrasyonu

### Test / docs / scripts
- contract testleri, smoke:agent, `docs/08-phase-0-delivery.md`
