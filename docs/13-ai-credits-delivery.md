# AI Credits Delivery (Faz 0)

Ücretsiz sosyal + Premium AI modelinin faturalama omurgası. Analiz: `docs/12-free-social-premium-ai-analysis.md`.

## Implemented

### Types / config / business-logic
- `packages/types/src/enums/billing.ts`, `models/billing.ts`
- `ERROR_CODES.AI_CREDITS_EXHAUSTED` (402), `AI_FEATURE_NOT_IN_PLAN` (403)
- `packages/config/src/monetization.ts` + `API_ROUTES.billing` + `queryKeys.billing`
- `packages/business-logic/src/ai-credits.ts`, `free-core-policy.ts`
- `commission.ts` üstüne: lead paywall değil; birincil gelir AI kredileri

### Prisma
- Migration: `20260806152534_teklifpilot_ai_credits`
- Models: SubscriptionPlan, PlanFeature, Subscription, AiCreditWallet, AiCreditTransaction, AiFeature, AiUsageRecord, AiQuotaPolicy
- Seed: `prisma/seed/data/billing.ts` (FREE 50 / PREMIUM 500 / PREMIUM_PLUS 2000 / BUSINESS 5000; FREE = AGENT_CHAT + GENERIC_COMPLETE)

### Backend
- `modules/billing/` — AiCreditService, BillingController
- Endpoints: `GET /billing/credits`, `/billing/credits/transactions`, `/billing/usage`, `/billing/plans` (plans public)
- `AiService.complete`: `userId` varsa debit; başarıda usage update; başarısızda refund; `userId` yoksa yalnızca telemetri
- `AgentService`: `AGENT_CHAT` + `agent-msg:{messageId}` idempotency

### Client / web / i18n
- `packages/api-client` billing resource
- Localization: `billing.creditsRemaining`, `upgradeHint`, `freeCore`
- Web: agent panelinde “AI kredi: X / Y” + yumuşak upgrade metni (paywall modal yok)

## Test results

| Suite | Result |
| --- | --- |
| `packages/business-logic` (all) | 95 passed |
| `ai-credit.service.spec` | 8 passed |
| `agent.service.spec` | 1 passed |
| Backend `tsc --noEmit` | ok |

```powershell
cd packages/business-logic; npm test
cd apps/backend; npx prisma migrate dev --name teklifpilot_ai_credits
cd apps/backend; npx prisma db seed
cd apps/backend; npm test -- --testPathPatterns=ai-credit.service --testPathPatterns=agent.service.spec
```

## Known debt
- Apple / Stripe / Play checkout yok (INTERNAL FREE only)
- Sosyal Post/Follow/Feed yok (Faz 2)
- Business kredi havuzu ayrı tablo yok (AiCreditWallet.businessId yeterli MVP)
- Admin `/subscriptions` stub henüz AI planlarına bağlanmadı
- `ProviderProfile.isPremium` komisyon indirimi ile AI premium ayrımı (Faz 3)
