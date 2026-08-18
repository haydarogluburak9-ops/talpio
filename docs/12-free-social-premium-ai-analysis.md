# TeklifPilot — Ücretsiz sosyal + Premium AI analizi ve faz planı

Ürün kuralı: temel ticaret/sosyal ücretsiz; gelir = premium üyelik + kotalı AI. Lead satışı / teklif ücreti yok.

---

## 1. Ücretsiz modele aykırı / gerilimli alanlar

| Alan | Bugün | Sınıflandırma | Karar |
| --- | --- | --- | --- |
| Komisyon (bps) | Accept → Order’a yazılır; escrow hakedişten düşer | Post-accept commerce fee | Lead duvarı değil. Korunur ama **birincil gelir modeli olarak pazarlanmaz**. İleride opsiyonel/ayarlanabilir. |
| Zorunlu escrow ödeme | Order `PENDING_PAYMENT` → iş başlatmak için `PAID` | Post-accept | Keşif/teklif ücretsiz kalır. Nakit dışı tamamlama ayrı ürün kararı (şimdilik bozulmaz). |
| `ProviderProfile.isPremium` | Komisyon indirimi + ranking | **Ürün çelişkisi** | AI premium ile karıştırılmaz. Güven rozeti değildir. Yeniden adlandırma / AI entitlement ayrımı Faz 3. |
| Admin `/subscriptions` stub | Veri modeli yok | Doküman borcu | AI SubscriptionPlan ile değiştirilecek |
| Lead satın alma / teklif kotası | **Yok** | Uyumlu | Korunacak |
| Job/request görüntüleme ücreti | **Yok** | Uyumlu | Korunacak |
| Bildirim ücreti | **Yok** (SMS ürün kanalı kapalı) | Uyumlu | Korunacak |

**Sonuç:** Temel UX (kayıt, talep, teklif, mesaj) ücretsiz. Çatışma kavramsal: “premium = komisyon indirimi” → “premium = AI kota”.

---

## 2. Lead / teklif / komisyon bağımlılıkları

| Bağımlılık | Dosya | Ücretsiz çekirdeği bloke eder mi? |
| --- | --- | --- |
| `calculateCommission` | `packages/business-logic/src/commission.ts` | Hayır (accept sonrası) |
| `offers.service` accept | commission snapshot | Hayır |
| `requests.service` accept | aynı | Hayır |
| `payments` COMMISSION ledger | hakediş | Hayır |
| `isPremium` ranking | `provider-ranking.ts` | Hayır (yumuşak) |

Lead paywall kodu yok — eklenmeyecek.

---

## 3. Sosyal domain eksikleri

Tümü yok (Business = B2B org, sosyal profil değil):

SocialProfile · BusinessProfile (sosyal) · Follow · Post · PostMedia · PostLike · PostComment · PostCommentLike · SavedPost · Hashtag · PostHashtag · Mention · FeedItem · FeedPreference · ContentReport · UserBlock · ProfileView · PostView · NotificationPreference (sosyal)

Request ≠ Post; FeedItem projeksiyonu Faz 2.

---

## 4. AI kredi / abonelik domain planı

| Model | Amaç |
| --- | --- |
| SubscriptionPlan | free / premium / premium_plus / business |
| PlanFeature | plana bağlı AI özellikleri |
| Subscription | user veya business entitlement |
| AiCreditWallet | bakiye + period |
| AiCreditTransaction | debit/credit/refund, idempotencyKey |
| AiFeature | özellik kodu + kredi maliyeti |
| AiUsageRecord | işlem detayı (provider, tokens, feature, refs) |
| AiQuotaPolicy | plan → aylık kredi |
| BillingPeriod | dönem penceresi |
| BusinessCreditPool | ekip havuzu (Business plan) |
| UpgradeOffer | soft upsell (paywall değil) |

Kurallar: başarısız AI → iade; idempotency; kota bitince temel app çalışır.

---

## 5. Navigasyon değerlendirmesi

| Yüzey | Bugün | Hedef |
| --- | --- | --- |
| Web header | kategoriler, tedarik, nasıl çalışır, satıcı ol | + Ana akış, Keşfet (Faz 2/4) |
| Provider panel | tedarik, mesaj, sipariş | + Panel/CRM/AI (kademeli) |
| Mobile tabs | home/jobs/messages… | Ana / Keşfet / Talep / Mesaj / Profil — **mobil B2B erteli**; sosyal Faz 2+ |
| Hesap | tek rol hissi | bireysel ↔ işletme switch (RBAC membership hazır) |

---

## 6. Fazlara göre dosya planı

### Faz 0 (bu döngü — eksikler) — UYGULANDI
- Detay: `docs/13-ai-credits-delivery.md`
- AI kredi cüzdanı, plan seed, debit/refund/idempotency, Agent `AGENT_CHAT` bağlı
- `MONETIZATION.leadPurchaseEnabled = false`; free-core policy
- Sosyal Post/Follow bu turda yok (Faz 2)

**Implemented (Faz 0):** bkz. `docs/13-ai-credits-delivery.md` — types/config/business-logic, Prisma migration `teklifpilot_ai_credits`, BillingModule, AiService debit/refund, agent hook, api-client + web kredi göstergesi. Sosyal Post/Follow ve Store checkout bilinçli olarak dışarıda.

### Faz 1 (çoğu mevcut)
Request / supplier / match / offer / accept — korunur; ücretsiz garanti regresyon testleri

### Faz 2 — UYGULANDI
`modules/social/` — profile, follow, post, like, comment, save, feed  
Web: `/akis`, `/u/[username]` ince dilim  
Teslimat: `docs/15-faz2-social-delivery.md`

### Faz 3
Subscription checkout (web), kota UI, AI request/offer assist, Agent krediye bağlı

### Faz 4–5
Keşfet, kişiselleştirme, medya AI, satış koçu, moderasyon paneli

---

## 7. Koruma

Marketplace jobs/offers/orders/payments bozulmaz. Sosyal ve Request ayrı domain. Premium ≠ güven rozeti.
