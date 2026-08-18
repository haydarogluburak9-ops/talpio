# Talpio — AI Destekli İşletme Platformu Vizyonu

> Mevcut marketplace korunur. Yeni özellikler yanına, modüler olarak eklenir.
> Bu belge kod yazmadan önce ürün ve mimari kararları sabitler.

## 1. Ürün kararı

**Eski konum:** Müşteri ↔ satıcı buluşturma (Armut / Thumbtack benzeri).

**Yeni konum:** Satıcının sabah–akşam kullandığı tek işletme sistemi.

| Katman | Rol |
| --- | --- |
| Marketplace | Talpio üzerinden gelen talep, teklif, emanet ödeme (mevcut) |
| ERP / CRM | Telefon, WhatsApp, Instagram vb. dış kaynaklı tüm işler |
| AI Agent | Doğal dil ile sorgu + gerçek aksiyon (araç çağrıları) |
| Operasyon | Teklif, takvim, rota, tahsilat, muhasebe, pazarlama |

Marketplace gelir kanalıdır. ERP omurgadır. Agent arayüzdür.

## 2. Mevcut mimari — dokunulmayacaklar

Korunan omurga:

- NestJS modüler monolit + Prisma + PostgreSQL
- Paylaşılan paketler: `types`, `config`, `validation`, `business-logic`, `api-client`, `localization`, `ui`
- Mevcut akış: `JobRequest → Offer → Order → Payment → Review`
- RBAC, audit log, soft delete, kuruş cinsinden para
- Mock → gerçek sağlayıcı soyutlamaları (`PaymentProvider`, bildirim sürücüleri)

**Kural:** Mevcut `jobs` / `offers` / `orders` servislerinin iş kuralları bozulmaz.
Yeni özellikler yeni modüller ve domain event’ler üzerinden bağlanır.

## 3. Kritik altyapı açıkları (önce bunlar)

16 ürün önceliğinden önce şu iskelet olmadan AI/ERP yüzeysel kalır:

| # | Eksik | Karar |
| --- | --- | --- |
| A | `AiProvider` soyutlaması | OpenAI/Anthropic/mock; production’da mock yasak (ödeme sürücüsü gibi) |
| B | BullMQ + Redis kuyruk | Transkripsiyon, PDF, toplu mesaj, hatırlatma, agent uzun işleri |
| C | Domain event bus | Zaten `EventEmitter2` var; kalıcı outbox + worker’a bağlanacak |
| D | `AgentTools` katmanı | Agent yalnızca onaylı tool’lar üzerinden yazma yapar; ham SQL yok |
| E | Observability | İstek kimliği, agent tool log’u, token/maliyet telemetrisi |

Bunlar **Faz 0**’dır. Ürün özelliği gibi satılmaz; her sonraki özelliğin zemini olur.

## 4. Domain ayrımı — marketplace vs işletme

Marketplace kaydı silinmez. ERP için paralel kök varlık eklenir:

```
Lead / WorkOrder  (satıcının tüm işleri)
  ├── source: TALPIO | PHONE | WHATSAPP | INSTAGRAM | ...
  ├── customerRef (CRM)
  ├── optional jobRequestId / orderId  (marketplace köprüsü)
  └── pipeline: NEW → SURVEY → QUOTE → ... → REPEAT
```

- Talpio’dan kabul edilen iş → otomatik `WorkOrder` + `source=TALPIO`
- Telefonla gelen iş → satıcı elle / AI ses ile `WorkOrder` açar
- Tek panelde filtre: kaynak, durum, tarih, müşteri

Bu, “sadece platform işi” kısıtını kaldırır; mevcut Order akışını kırmaz.

## 5. Önceliklendirilmiş yol haritası

### Faz 0 — Platform temeli (1–2 sprint)

- `infra/ai` (`AiProvider` + mock)
- `infra/queue` (BullMQ)
- Outbox / domain event → worker
- Agent tool izin matrisi + audit
- Telemetri iskeleti

**Çıkış:** Mock AI ile “merhaba” tool çağrısı log’lanır; kuyruk bir işi tüketir.

### Faz 1 — AI Agent MVP (Öncelik 1 — dar kapsam)

Okuma araçları (güvenli, yüksek değer):

- Bugünkü / yarınki işler
- Bu ay ciro / bekleyen tahsilat
- Teklif durumu (Ali Bey’e gönderildi mi?)
- Geciken ödemeler

Yazma araçları (onaylı, sınırlı):

- Hatırlatma oluştur
- Taslak mesaj hazırla (göndermeden önce onay)
- Takvim bloğu öner

**UI:** Satıcı panelinde kalıcı Agent sohbet (web + mobil).
**Güvenlik:** Tool’lar `userId` / `providerProfileId` scope’lu; çapraz hesap yok.
**Çıkış:** 8 örnek sorunun en az 6’sı gerçek veriyle yanıtlanır.

### Faz 2 — Satıcı ERP omurgası (Öncelik 2 + 13 + 14)

- `Lead` / `WorkOrder` / `Customer` (satıcı kapsamlı CRM)
- Kaynak enum’u (Talpio, Telefon, WhatsApp, …)
- Pipeline durumları (Yeni Talep → … → Tekrar Satış)
- Satıcı dashboard: bugün/yarın, bekleyen teklif/tahsilat, AI öneri kartları
- Marketplace köprüsü: Order oluşunca WorkOrder senkronu

**Çıkış:** Satıcı, telefon işini panelden açıp pipeline’da ilerletebilir.

### Faz 3 — AI Teklif motoru (Öncelik 3)

- Konuşma / form → yapılandırılmış teklif DTO
- Ürün satırları, işçilik, KDV, ödeme planı, garanti maddeleri
- PDF şablonu + logo (dosya deposu)
- WhatsApp paylaşım bağlantısı (önce deep link / paylaşım metni; resmi WA API sonra)

**Çıkış:** Ses/metinden PDF teklif üretilir; satıcı onaylamadan müşteriye gitmez.

### Faz 4 — Algı: fotoğraf + ses (Öncelik 4 + 5)

- Fotoğraf analizi: kategori, malzeme, süre, fiyat aralığı, eksik açı isteği
- Ses → STT → talep/teklif taslağı
- Sonuçlar `AiInsight` kaydı olarak WorkOrder’a bağlanır

**Çıkış:** Bir ses + bir fotoğraf senaryosu duman testiyle geçer.

### Faz 5 — AI CRM + skorlar (Öncelik 6 + 12)

- Müşteri hafızası (özet + etiketler)
- Risk / sadakat / ödeme puanı
- Event’lerden periyodik yeniden skorlama (kuyruk)

### Faz 6 — Satış koçu + muhasebeci (Öncelik 7 + 8)

- Kazanma oranı kategori bazlı
- Ciro / net kâr / vergi tahmini (ülke vergi profili)
- Agent tool’ları olarak sorulabilir

### Faz 7 — Takvim + rota (Öncelik 9)

- İş optimizasyonu, yakın bölge gruplama
- `MapProvider` soyutlaması (docs’ta zaten var)
- Agent: “bugün rotamı oluştur”

### Faz 8 — Sekreter + pazarlama (Öncelik 10 + 11)

- Gelen mesaj/çağrı için yanıt taslağı
- Kampanya önerisi + toplu gönderim kuyruğu
- Tercih / KVKK / opt-out zorunlu

### Faz 9 — Global (Öncelik 15)

Şema hazır; ürünleştirme:

- Ülke vergi profili, fatura şablonu
- Kategori çevirileri
- Para birimi + format (zaten minor unit)
- Telefon/adres kuralları ülke bazlı

## 6. Modül şablonları (her yeni modül için zorunlu)

Her modül aynı iskeleti izler:

```
apps/backend/src/modules/<name>/
  *.module.ts
  *.controller.ts
  *.service.ts
  *.mapper.ts
  dto/
  *.service.spec.ts

packages/types        → sözleşmeler
packages/validation   → Zod
packages/api-client   → resource
packages/localization → TR/EN
apps/web + apps/mobile → feature klasörü
scripts/smoke-<name>.mjs
```

Zorunlu kesitler (yüzeysel geliştirme yasağı):

1. **Veritabanı:** model, index, soft delete, migration
2. **API:** versioned REST, sayfalama, hata kodları
3. **Yetki:** rol + sahiplik (satıcı yalnız kendi CRM’i)
4. **AI:** hangi tool / hangi model / insan onayı gerekir mi?
5. **Performans:** liste index’leri, N+1 yasağı, kuyruk sınırları
6. **Ölçek:** worker ile yatay büyüme
7. **Güvenlik:** PII maskeleme, prompt injection’a karşı tool allowlist, audit
8. **Gözlemlenebilirlik:** tool çağrı log’u, token maliyeti, hata oranı

## 7. AI Agent — detaylı tasarım (Faz 1)

### 7.1 Veri modeli

- `AgentThread` — satıcı / kullanıcı sohbeti
- `AgentMessage` — rol: user | assistant | tool
- `AgentToolCall` — ad, girdi, çıktı, durum, süre, token
- `AgentActionProposal` — yazma aksiyonları için “onay bekliyor”

### 7.2 Tool katalogu (ilk set)

| Tool | Tür | Açıklama |
| --- | --- | --- |
| `list_work_today` | okuma | Bugünkü işler |
| `list_work_tomorrow` | okuma | Yarınki işler |
| `earnings_summary` | okuma | Dönem ciro / kâr |
| `find_offer_for_customer` | okuma | Müşteri + teklif durumu |
| `list_unpaid` | okuma | Ödeme yapmayanlar |
| `create_reminder` | yazma* | Hatırlatma |
| `draft_message` | yazma* | Mesaj taslağı |
| `propose_schedule` | yazma* | Takvim önerisi |

\* Yazma tool’ları varsayılan olarak `AgentActionProposal` üretir; satıcı onaylayınca uygulanır.

### 7.3 Yetki

- Agent, JWT’deki `providerProfileId` dışında veri görmez.
- Admin agent’ı ayrı scope (sonra).
- Müşteri agent’ı (talep asistanı) ayrı ürün; Faz 1’de yok.

### 7.4 UI

- Web: `/satici/panel` içinde sağ/alt Agent drawer
- Mobil: provider tab “Asistan”
- Her yanıtta “hangi verilere baktım” şeffaflık satırı (güven)

## 8. ERP — detaylı tasarım (Faz 2)

### 8.1 Ana modeller

- `CrmCustomer` — satıcı kapsamlı müşteri (telefon, etiket, skor)
- `WorkOrder` — iş kaydı + `source` + pipeline status
- `WorkOrderEvent` — durum geçmişi
- `Quote` / `QuoteLine` — teklif (marketplace `Offer`’dan ayrı; sonra köprü)
- `Invoice` / `Collection` — fatura / tahsilat (muhasebe Faz 6 ile derinleşir)
- `Reminder` / `CalendarBlock`

### 8.2 Kaynak enum

`TALPIO | PHONE | WHATSAPP | INSTAGRAM | FACEBOOK | RETURNING | REFERRAL | GOOGLE | WEBSITE | SAHIBINDEN | OTHER`

### 8.3 Pipeline

`NEW → SURVEY → QUOTE → NEGOTIATION → APPROVED → MATERIALS → APPOINTMENT → IN_PROGRESS → DONE → INVOICED → COLLECTED → REVIEWED → REFERRED → REPEAT`

Marketplace `OrderStatus` ile birebir eşlenmez; köprü tablosu / map fonksiyonu tutulur.

## 9. Güvenlik ve uyum (AI özel)

- Prompt’a ham PII yerine tool sonucu; log’da maskeleme
- Tool allowlist dışı fonksiyon yok
- İnsan onayı: para, dış mesaj, silme
- KVKK: AI işlem amacı, saklama süresi, silme talebi
- Model çıktısı doğrulanmadan DB’ye yazılmaz (Zod parse)

## 10. Bilinçli ertelemeler

| Özellik | Neden sonra |
| --- | --- |
| Canlı telefon cevaplama (sekreter) | Operatör / VoIP hesabı + hukuki kayıt |
| Resmi WhatsApp Business API | Meta onay süreci |
| Otomatik vergi beyannamese | Mali müşavir ürünü; tahmini rakam yeter |
| Mikroservis ayrımı | Modüler monolit yeterli; worker yatay büyür |

## 11. Başarı ölçütleri

- Satıcı DAU: paneli günde ≥1 açma
- Agent: sorgu → doğru tool ≥ %80
- ERP: dış kaynaklı işlerin ≥ %50’si panelde kayıtlı
- Teklif: AI taslaktan onay süresi &lt; 5 dk (hedef)

## 12. Uygulama emri

Kod yazımına **Faz 0** ile başlanır. Ardından **Faz 1 Agent MVP** ve **Faz 2 ERP omurgası**.
Diğer öncelikler bu iki omurga olmadan yüzeyselleşir.
