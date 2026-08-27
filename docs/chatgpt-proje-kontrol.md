# TALPIO — Tüm Yazılım ChatGPT Denetim Briefi

**Tarih:** 2026-08-17  
**Kapsam:** Tüm ürün / monorepo. Landing pixel denetimi değil.  
**Landing-only brief:** `docs/chatgpt-landing-kontrol.md` (ayrı iş; bu dosyayı onun yerine kullanma)

Bu dosyayı ChatGPT’ye yükle. Kod, patch, SQL, exploit üretme. Sırlar (`.env`, JWT, MinIO key) yapıştırma.

Önceki brief 2026-08-13. Bu sürüm 13–17 Ağustos teslimlerini ve bilinen operasyon risklerini içerir.

---

## Görev

1. Ürünü, mimariyi ve üç istemciyi (web / mobil / admin) + API’yi özetle.
2. Tutarsızlık, eksik, güvenlik riski, domain karışıklığı ve isimlendirme borçlarını madde madde yaz.
3. Her maddeye **kritik / orta / düşük** ver. Kanıt olarak bu brief’teki bilgiyi kullan.
4. Kod yazma. Sadece denetim, boşluk listesi ve önerilen sıra üret.
5. Sahte üretim metriği, yetkisiz marka logosu, “EN İYİ TEKLİF”, LLM finansal hesap önerme.
6. Landing’i yalnızca ürün yüzeyi olarak değerlendir; pixel/layout raporu isteme.

---

## 1) Ürün

**Ad:** Talpio  
**Slogan:** İste. Teklif al. Fırsatı yakala.  
**Eski ad:** UstaPilot (hizmet pazaryeri). Paketler `@talpio/*`. Ürün adı Talpio. Rename uygulandı.

**Ne:** Talep odaklı ticaret + sosyal ticaret + işletme ERP/CRM + AI asistan.

Üç kullanım nedeni:

1. İhtiyacım var → talep yayınla → teklif al
2. Satış yapmak istiyorum → talepleri gör → teklif ver
3. Şu an ihtiyacım olmasa bile → fiyat / fırsat / kampanya akışını takip et

**Pazar:** Küresel. Mimari çok şehir / ülke / dil (EN, TR, DE, ES, FR, AR) için tasarlandı.

**Kimlik:** Navy `#04111F` / `#07192D` + turuncu `#FF5A0A`. UI işi backend/API/iş kuralını değiştirmez.

### Değişmez domain kuralları

- Request ≠ Post. Offer ≠ Post.
- Social, CommerceRequest / RequestOffer / JobRequest repository’sine **doğrudan yazmaz**.
- Trust score premium üyelikten **etkilenmez**.
- Finansal hesap (fiyat, indirim %, komisyon, LTV) **LLM yapmaz**; kuruş integer.
- “EN İYİ TEKLİF” yazılmaz. Karşılaştırma rozetleri iddiasız olabilir.
- Ekranda sahte üretim verisi yok. Bağlı olmayan uç açıkça “iskelet / bağlı değil” der.
- Para her yerde **kuruş integer**. Float yok.
- Varsayılan para birimi **TRY**. Diğer ISO kodları pasif (minor-unit tablosu var; UI/ödeme TRY).

---

## 2) Yerel çalışma

| Servis     | Adres                                                            |
| ---------- | ---------------------------------------------------------------- |
| Web        | http://localhost:3002                                            |
| Admin      | http://localhost:3001                                            |
| API        | http://localhost:3000/api/v1                                     |
| Swagger    | http://localhost:3000/docs                                       |
| Health     | http://localhost:3000/health, `/health/ready`, `/health/metrics` |
| MinIO      | http://localhost:9011                                            |
| PostgreSQL | localhost:5442                                                   |
| Redis      | localhost:6389                                                   |

```bash
npm run docker:up
npm run db:migrate
npm run db:seed
npm run dev
```

Eşleşme bildirimi: ayrı süreç `npm run dev:worker`  
Mobil: `npm run dev:mobile`  
PowerShell: `&&` değil `;`  
Paketler `dist` tüketir. Turbopack panik olursa `apps/web/.next` ve `apps/admin/.next` sil.

### Demo (yalnızca `SEED_DEMO_ACCOUNTS=true`; production’da yasak)

| Rol       | E-posta              | Parola           |
| --------- | -------------------- | ---------------- |
| Kullanıcı | kullanici@talpio.com | `DEMO_PASSWORD`  |
| Satıcı    | satici@talpio.com    | `DEMO_PASSWORD`  |
| Yönetici  | admin@talpio.com     | `ADMIN_PASSWORD` |
| Destek    | destek@talpio.com    | `ADMIN_PASSWORD` |

Parolalar `.env`'den gelir, depoda tutulmaz.

Girişli web `/` → otomatik `/akis`.

### Bilinen yerel operasyon (2026-08-15)

- Web açıkken API düşerse giriş formu `auth.networkError` gösterir: “Sunucuya ulaşılamadı”.
- Nest `--watch` bir TS hatasında süreci ayakta tutmaz / dinlemeyi keser. 15 Ağustos’ta `admin.service.ts` `ContentReport | undefined` hatası API’yi kapattı; düzeltildi.
- Bekleyen Prisma migrasyonu (`marketing_consent_at`, grup sohbet alanları) login’de 500 üretti. `20260815120000_auth_consent_group_chat` uygulandı.
- Hikâyeler ayrı tablo değil: son 24 saatteki görselli gönderiler. Seed `hoursAgo` ile yazıldığı için 24 saat sonra ray boşalır. Yenileme: `npx tsx prisma/seed/refresh-stories.ts` (`#hikaye` etiketli 8 mağaza hikâyesi).

---

## 3) Mimari

Tek backend + tek veritabanı, üç istemci.

```
NestJS API (:3000)  — PostgreSQL + Redis + MinIO
        /api/v1
   ┌─────┼─────┐
 Web   Mobil  Admin
 :3002  Expo  :3001
```

- **Backend:** NestJS modüler monolit, Prisma, JWT + refresh rotation, RBAC, outbox, BullMQ worker
- **Web:** Next.js 16 App Router, Tailwind
- **Admin:** Next.js panel
- **Mobil:** Expo / React Native SDK 57
- **Paketler:** `@talpio/types`, `config`, `validation`, `business-logic`, `api-client`, `localization`, `ui`

İş kuralları, Zod ve API istemcisi paylaşılan paketlerde. İstemci yalnızca UI yazar.

Auth: web refresh HTTP-only cookie; mobil SecureStore. İstemci `X-Client-Platform` gönderir.

API zarfı: `{ success, data, meta }` veya `{ success: false, error: { code, message }, requestId }`.

Production env kontrolleri: demo seed yasak, zayıf JWT yasak, mock ödeme/AI/SMS yasak, `API_PUBLIC_URL` HTTPS, CORS yalnızca localhost olamaz, OpenAI/Anthropic anahtarı sürücüye göre zorunlu.

Web feature flag (varsayılan **kapalı**):

- `NEXT_PUBLIC_FEATURE_PREMIUM=false`
- `NEXT_PUBLIC_FEATURE_AGENT=false`
- `NEXT_PUBLIC_FEATURE_PAYMENTS=false`

Abonelik satışı ve AI kredi satışı **bilinçli atlandı** (ürün kararı). Admin’de abonelik/AI usage listesi var; checkout yok.

---

## 4) Monorepo

```
talpio/
├── apps/
│   ├── backend/          NestJS, Prisma, seed, worker
│   ├── web/              müşteri + satıcı web
│   ├── admin/            yönetim
│   └── mobile/           Expo iOS/Android
├── packages/             types, config, validation, business-logic, api-client, localization, ui
├── docker/
├── docs/
└── docker-compose.yml
```

npm workspaces + Turborepo. Node >= 20.11.  
Git deposu `talpio`; yerel klasör adı hâlâ `usta-pilot` (elle yeniden adlandırılacak).

---

## 5) Domain haritası (karıştırma)

İki ticaret hattı + sosyal + ERP birlikte durur. Birbirinin yerine geçmez.

| Domain            | Modeller                                      | UI                                                                                                         |
| ----------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Hizmet pazaryeri  | JobRequest, Offer, Order                      | Web `/taleplerim`, mobil jobs, admin `/job-requests`                                                       |
| Ticaret / tedarik | CommerceRequest, RequestOffer, RequestMatch   | Web `/tedarik`, `/talep-olustur`, `/satici/tedarik`; mobil `customer/requests`; admin `/commerce-requests` |
| Sosyal ticaret    | Post, DealMetadata, FeedItem, Follow, Hashtag | Web `/akis`, `/kesfet`, `/u/[username]`; hikâye rayı = 24s medya post                                      |
| İşletme           | Business, ProviderProfile (eski), membership  | `/satici/panel`, admin Satıcılar                                                                           |
| ERP               | CrmCustomer, WorkOrder, BusinessTask          | Satıcı paneli v2; mobil klon değil                                                                         |
| Kampanya          | B2bCampaign, CampaignPost, PriceHistory       | Admin `/promotions`; deal indirim kuruştan                                                                 |
| Güven             | BusinessTrustScore                            | Mağaza kartı; premium girdisi yok                                                                          |
| AI / fatura       | Agent*, AiCredit*, Subscription               | Premium flag kapalı; satış UI yok                                                                          |
| Fraud             | FraudFlag                                     | Hacim bayrağı; otomatik ban yok                                                                            |
| Moderasyon        | ContentReport                                 | Kullanıcı şikâyet + admin `/moderation` (kaldır / askıya al / ban)                                         |

Marketplace **Order ≠ WorkOrder**. Sosyal post, CommerceRequest oluşturmaz.

---

## 6) Backend modülleri

`apps/backend/src/modules/` + infra:

| Modül                     | Rol                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| auth                      | kayıt, giriş, refresh, logout, logout-all; e-posta/telefon doğrulama; şifre unuttum/sıfırla; `marketing_consent_at` |
| users                     | profil + `DELETE /users/me` hesap kapatma                                                                           |
| providers                 | satıcı profil, belge, hizmet, bölge                                                                                 |
| businesses                | işletme, locale, CRM, WorkOrder, görev, dashboard v2, kampanya, trust                                               |
| catalog / locations       | kategori, coğrafya                                                                                                  |
| jobs / requests           | JobRequest + CommerceRequest + deterministik matching                                                               |
| offers                    | teklif + karşılaştırma rozetleri (EN İYİ TEKLİF yok)                                                                |
| orders / payments         | sipariş; mock + **iyzico authorize HTTP** (3DS / Checkout Form UI yok); webhook HMAC + idempotency                  |
| messages / notifications  | sohbet + **grup sohbet**; in-app + SMTP / FCM / Netgsm / Twilio adaptörleri (sürücü env)                            |
| reviews / files / support | değerlendirme, MinIO, bilet/şikâyet                                                                                 |
| admin                     | abonelik listesi, AI usage, kampanya, **moderasyon**, fraud-flags, kullanıcılar                                     |
| rbac / billing / agent    | izin, AI kredi, taslak+onay tool                                                                                    |
| social                    | feed v2 (takip + aynı şehir keşif), hashtag/trending, follow, hikâye rayı, mağaza kartı + trustScore                |
| fraud                     | hacim bayrağı; ban yok                                                                                              |
| health                    | `/health`, `/health/ready`, `/health/metrics`                                                                       |

Infra: Prisma, Redis, storage, queue, outbox, AI (OpenAI / Anthropic / mock — **production’da mock yasak**), payment provider.

Prisma kaynak: `apps/backend/prisma/schema.prisma`.

---

## 7) Web (`apps/web` :3002)

### Public / marketing

| Yol                                                         | Not                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `/`                                                         | Public landing. Girişli → `/akis`. Sahte 50K+/1M+/200.000+ yok        |
| `/nasil-calisir`                                            | Nasıl çalışır                                                         |
| `/satici-ol`                                                | Satıcı ol                                                             |
| `/giris` `/kayit`                                           | Auth; kayıtta isteğe bağlı ticari ileti kutusu                        |
| `/sifremi-unuttum` `/sifre-sifirla` `/dogrula-eposta`       | Auth doğrulama / sıfırlama                                            |
| `/yasal/gizlilik` `/yasal/kullanim-kosullari` `/yasal/kvkk` | **Ürün özeti + disclaimer** — avukat imzalı metin yok; lansman engeli |
| `/sistem-durumu`                                            | Durum                                                                 |

Landing navbar vs rota (bilinçli borç): Fırsatlar → `/kategoriler`, Kampanyalar → `/akis`, İşletmeler → `/satici-ol`.

Landing stats: yetenek etiketleri + “üretim istatistiği değil” uyarısı. Partner: `Marka 01…08`. Telefon mockup’ta demo sayılar kalabilir — üretim iddiası değil.

### Ürün yüzeyleri

| Yol                                                         | Not                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `/akis`                                                     | Ana sosyal akış + hikâye rayı                             |
| `/kesfet`                                                   | Keşif / fırsat                                            |
| `/tedarik` `/tedarik/[id]` `/talep-olustur` `/tedariklerim` | CommerceRequest                                           |
| `/kategoriler` `/kategoriler/[slug]`                        | Katalog                                                   |
| `/gundem/[slug]`                                            | Gündem                                                    |
| `/mesajlar` `/bildirimler`                                  | Sohbet (grup oluşturma var) / bildirim                    |
| `/hesabim`                                                  | Hesap + silme                                             |
| `/profil` `/odemeler`                                       | Profil / ödeme (payments flag kapalıysa yüzey kapalı der) |
| `/satici/panel`                                             | CRM / WO / görev / dashboard v2                           |
| `/satici/tedarik`                                           | Satıcı tedarik                                            |
| `/u/[username]`                                             | Sosyal profil                                             |
| `/taleplerim` `/siparislerim`                               | JobRequest hattı                                          |
| `/saticilar/[id]`                                           | Satıcı profil                                             |
| `/destek` `/sikayet`                                        | Destek                                                    |

Akış: takip yoksa da aynı şehir PUBLIC medya/keşif karışır; takip edilenler öne çıkar.

---

## 8) Admin (`apps/admin` :3001)

Gerçek API verisi. Sidebar grupları:

- Genel: Panel `/dashboard`
- Kullanıcılar: Kullanıcılar, **Satıcılar / İşletmeler** (`/masters`), İşletme doğrulamaları
- İşler: İş talepleri, **Tedarik talepleri** (`/commerce-requests`), Teklifler, Siparişler, Yorumlar
- Katalog: Kategoriler, Konumlar
- Finans: Ödemeler, İşlemler, Komisyonlar, Abonelikler (liste; satış yok)
- Destek: Destek talepleri, Şikâyetler
- Büyüme: Kampanyalar, **Moderasyon**, **Fraud**, **AI usage**, Bildirimler, Raporlar
- Sistem: Ayarlar, Yetkiler, Denetim kayıtları

Moderasyon: bildirim önizleme (metin/görsel/yazar/bildiren). Aksiyonlar: incele, reddet, içeriği kaldır (soft-delete + feed item düşer), askıya al, ban (oturum iptali). Otomatik ban yok. Kaldırma yalnızca yazma rollerinde.

---

## 9) Mobil (`apps/mobile`)

Expo Router. 13–17 Ağustos parite:

- Hikâye rayı + görüntüleyici
- Create sekmesi: iş talebi **veya** tedarik talebi
- Commerce request liste/detay + teklif karşılaştırma
- Public profil `/customer/u/[username]`, `/provider/u/[username]`
- İş teklifi karşılaştırma rozetleri
- Satıcı kazanç → cüzdan ekranı
- Grup sohbet oluşturma
- Şifre unuttum

Gelişmiş ERP (CRM/WO/kampanya admin) web klonu **değil**.

---

## 10) 13–17 Ağustos teslimleri

| #   | Konu                                       | Durum                                                                           |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| 1   | Yasal: ticari ileti onayı + yasal sayfalar | Ürün özeti + `marketing_consent_at`. Avukat metni yok                           |
| 2   | Ödeme                                      | iyzico authorize HTTP var; **3DS / Checkout Form UI yok**. Payments flag kapalı |
| 3   | Auth                                       | E-posta/telefon doğrulama + şifre sıfırlama                                     |
| 4   | SMS                                        | Netgsm + Twilio adaptörü (env sürücü)                                           |
| 5   | Ops                                        | Worker compose, web Docker, yedek runbook (`docs/28-backup-runbook.md`)         |
| 6   | Akış                                       | Lokasyon keşfi + takip karışımı                                                 |
| 7   | Mobil parite                               | Tedarik, hikâye, profil, teklif, kazanç                                         |
| 8   | Admin                                      | CommerceRequest, moderasyon, kullanıcı i18n                                     |
| 9   | Abonelik / AI kredi satışı                 | **Atlandı**                                                                     |
| 10  | Çok para birimi                            | Pasif; TRY varsayılan                                                           |
| +   | Grup sohbet UI                             | Web + mobil                                                                     |
| +   | İçerik moderasyonu                         | Kullanıcı şikâyet + admin kaldırma/askı/ban                                     |
| +   | Hikâye yenileme scripti                    | Seed 24s dolunca boşalır                                                        |

---

## 11) Faz 0–50 + güncel dürüstlük

| Blok  | İçerik                                                           | Durum                                             |
| ----- | ---------------------------------------------------------------- | ------------------------------------------------- |
| 1–3   | Matching, bildirim, teklif karşılaştırma                         | Var                                               |
| 4–7   | Sosyal grafik, hashtag/trending, feed v2, mağaza profili, hikâye | Var                                               |
| 8     | Trust score (premium girdisi yok)                                | Var                                               |
| 9–12  | CRM, WorkOrder, görev, dashboard v2                              | Var                                               |
| 13–16 | Analytics, kampanya, deal indirim kuruştan, PriceHistory         | Var                                               |
| 17–22 | AI provider, taslak+onay, satış koçu, kredi                      | Var; prod mock yasak; satış UI yok                |
| 23–27 | Billing admin, push/e-posta/SMS/ödeme adaptörü                   | HTTP istemcileri yazıldı; canlı anahtar + 3DS yok |
| 28–37 | Web parite, admin veri, Flutter arşiv, `@talpio/*`               | Rename **uygulandı**                              |
| 38–50 | i18n, yasal özet, metrics, fraud, hesap silme                    | Var; avukat metni yok                             |

İç puan (`docs/25-final-audit.md`, 10 = production-complete) — 13 Ağustos tabanı; 17 Ağustos’ta ops/auth/SMS ilerledi, ödeme 3DS ve avukat metni hâlâ eksik:

| Alan                 | /10 (13 Ağu iç) | 17 Ağu not                                     |
| -------------------- | --------------- | ---------------------------------------------- |
| Architecture         | 8               | Aynı                                           |
| Backend              | 8               | Auth/SMS/iyzico authorize eklendi              |
| Web                  | 8               | Yasal özet + auth sayfaları                    |
| Mobile               | 7               | Parite arttı (tedarik/hikâye/grup)             |
| Admin                | 7               | Moderasyon + CommerceRequest                   |
| Marketplace          | 8               | Aynı                                           |
| Social               | 8               | Hikâye + moderasyon bağlı                      |
| Business ERP         | 7               | Aynı                                           |
| AI                   | 7               | Satış yok; flag kapalı                         |
| Security             | 8               | Şikâyet/ban var; 3DS yok                       |
| Production readiness | **6**           | Yedek runbook var; yasal+3DS+canlı anahtar yok |

---

## 12) Gerçek / mock / yer tutucu

| Konu                                                                       | Durum                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Auth, katalog, talep, teklif, sipariş, mesaj, dosya, profil, değerlendirme | Çalışıyor                                                                                        |
| E-posta/telefon doğrulama, şifre sıfırlama                                 | Çalışıyor (gönderim sürücüye bağlı; local çoğu zaman mock)                                       |
| Matching + in-app bildirim                                                 | Çalışıyor (worker açık olmalı)                                                                   |
| Ödeme                                                                      | Mock çalışıyor; iyzico **authorize** kodu var; **3DS/Checkout UI yok**; web payments flag kapalı |
| Push / e-posta / SMS                                                       | SMTP, FCM, Netgsm, Twilio adaptörleri var; local varsayılan mock                                 |
| AI                                                                         | Mock local; production’da yasak                                                                  |
| Landing istatistikleri                                                     | Sayı iddiası yok; yetenek etiketleri                                                             |
| Partner logoları                                                           | `Marka 01…08`                                                                                    |
| Hukuki metinler                                                            | Ürün özeti + disclaimer; **avukat onayı lansman engeli**                                         |
| `@talpio/*` rename                                                         | Uygulandı                                                                                        |
| Playwright E2E                                                             | Yok; duman scriptleri var                                                                        |
| Flutter                                                                    | Silindi; yalnızca git geçmişinde                                                                 |
| Abonelik / AI kredi satışı                                                 | Yok (bilinçli)                                                                                   |

**Lansman engelleri:** avukat onaylı yasal metin, gerçek ödeme 3DS/checkout + canlı anahtar, production AI anahtarı, store gizlilik metinleri, yedeklemenin gerçekten çalıştırılması (runbook var, “yedek alındı” iddiası yok).

---

## 13) ChatGPT’nin özellikle bakması gerekenler

1. **Repo klasörü:** GitHub deposu `talpio`; yerel dizin hâlâ `usta-pilot`. Ürün ve paketler Talpio.
2. **Çift talep modeli:** JobRequest vs CommerceRequest — web/mobil/admin hangisini birincil kullanıyor? Kullanıcı hangisini görüyor?
3. **Sosyal vs ticaret sızıntısı:** Post, talep/teklif yazıyor mu?
4. **Landing vs app:** `/` marketing, `/akis` ürün. Navbar vaadi vs gerçek rota.
5. **Güvenlik:** cookie vs body token, tenant isolation, webhook HMAC, AI tool onay, hesap silme, RBAC, moderasyon ban.
6. **i18n:** TR kaynak; hardcoded TR web/admin kopyaları; EN paritesi.
7. **Mobil vs web parite:** ERP hâlâ web’de; tedarik/hikâye/grup eklendi.
8. **Admin:** JobRequest + CommerceRequest + moderasyon var mı, boşluk kaldı mı?
9. **Trust score** premium’a bağlı olmamalı.
10. **Para:** kuruş integer; LLM fiyat hesaplamamalı; çok para birimi pasif.
11. **Sahte metrik:** 50K+ / 1M+ / 200.000+ geri basılmamalı.
12. **Stub vs gerçek:** iyzico authorize’ı “ödeme canlı” diye satma; 3DS yok. SMTP/SMS adaptörünü “SMS production’da kanıtlandı” diye satma.
13. **Worker zorunluluğu:** matching bildirimi `dev:worker` olmadan sessiz kalır.
14. **Yasal:** sayfa var ≠ avukat metni var. Disclaimer’ı yeterli sayma.
15. **Yerel kırılganlık:** watch TS hatası API’yi düşürür; pending migration login’i 500 yapar; hikâyeler 24s sonra biter.
16. **Feature flag:** payments/premium/agent kapalı — UI “çalışmıyor” sanılmamalı.

Bu listeyi doğrula, çelişki veya kaçırılan risk ekle. Uydurma endpoint veya “kesin bug” uydurma.

---

## 14) Çıktı formatı (zorunlu)

### A) Ürün özeti (en fazla 12 satır)

Ne, kim için, üç istemci, iki ticaret hattı + sosyal.

### B) Kritik riskler (max 10)

Her satır: sorun → neden önemli → kanıt (bu brief’ten) → önerilen sıra. Kod yok.

### C) Orta öncelik

Web / admin / mobil / backend ayrı başlık.

### D) Düşük / bilinçli borç

Yerel klasör adı `usta-pilot`, landing placeholder logolar, nav semantik sapma, hikâye 24s seed, payments flag.

### E) Lansman kararı

Production’a çıkılır mı? Engeller 5 maddeden fazla olmasın.

### F) Skor (bu brief’e göre, iç puanı kör kopyalama)

- Architecture /10
- Backend /10
- Web /10
- Mobile /10
- Admin /10
- Marketplace /10
- Social /10
- ERP /10
- AI /10
- Security /10
- Production readiness /10
- Honesty (no fake metrics / no stub-as-real) /10

### G) “Şimdi yapma / sonra yap”

En fazla 12 madde. Sahte metrik, yetkisiz logo, rewrite, paket rename’i “şimdi” diye dayatma (rename bitti). Abonelik satışını “şimdi zorunlu” yapma (bilinçli atlandı).

Kod, patch, SQL, exploit üretme.

---

## 15) İç belgeler (ChatGPT göremez; çelişki olursa brief üstün)

| Dosya                               | İçerik                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `README.md`                         | Çalıştırma, durum tablosu (ödeme satırı eski kalabilir: “iyzico yazılmadı”) |
| `docs/01-architecture.md`           | Mimari                                                                      |
| `docs/20-phase-8-50-delivery.md`    | Faz 8–50                                                                    |
| `docs/22-package-rename-plan.md`    | `@ustapilot` → `@talpio` (uygulandı)                                        |
| `docs/23-legal-todos.md`            | Yasal: özet var, avukat yok                                                 |
| `docs/24-e2e-core-flows.md`         | E2E sıra                                                                    |
| `docs/25-final-audit.md`            | İç puan (13 Ağu)                                                            |
| `docs/26-i18n-coverage.md`          | Çeviri                                                                      |
| `docs/28-backup-runbook.md`         | Yedek prosedür                                                              |
| `docs/chatgpt-landing-kontrol.md`   | Sadece `/` pixel                                                            |
| `apps/backend/prisma/schema.prisma` | Şema                                                                        |

Opsiyonel görseller (zorunlu değil): `/akis`, admin dashboard, logo. Landing pixel için ayrı brief kullan.
