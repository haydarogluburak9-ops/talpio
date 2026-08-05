# UstaPilot

**Doğru usta. Doğru fiyat. Güvenli hizmet.**

Hizmet ihtiyacı olan müşterilerle profesyonel ustaları buluşturan pazaryeri platformu. İlk pazar Gaziantep'tir; mimari çok şehirli, çok ülkeli ve çok dilli büyümeye göre tasarlanmıştır.

Tek bir backend ve tek bir veritabanı üç istemciye hizmet eder: responsive web sitesi, iOS/Android mobil uygulama ve yönetim paneli. İş kuralları, tipler, doğrulama şemaları ve API istemcisi paylaşılan TypeScript paketlerinde yaşar; her istemci yalnızca kendi arayüzünü yazar.

## Durum

| Alan                                     | Durum                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Monorepo, paylaşılan paketler            | Çalışıyor                                                                          |
| Veritabanı şeması (tüm alan modelleri)   | Çalışıyor                                                                          |
| Kimlik doğrulama (kayıt/giriş/yenile)    | Uçtan uca çalışıyor — web ve mobil                                                 |
| Katalog (kategoriler, konumlar)          | Uçtan uca çalışıyor — web, mobil ve admin                                          |
| İş talebi (oluştur, listele, iptal)      | Uçtan uca çalışıyor — web ve mobil                                                  |
| Teklif (ver, listele, kabul/ret/geri çek)| Uçtan uca çalışıyor — web ve mobil                                                  |
| Sipariş (ödeme, başlat, teslim, onay)    | Uçtan uca çalışıyor — web ve mobil                                                  |
| Mesajlaşma (sohbet, gönder, okundu)      | Uçtan uca çalışıyor — web ve mobil                                                  |
| Dosya yükleme (görsel, belge, ek)        | Uçtan uca çalışıyor — web ve mobil                                                  |
| Profil (kullanıcı, usta, hizmet, bölge)  | Uçtan uca çalışıyor — web ve mobil                                                  |
| Değerlendirme (puanla, cevapla, listele) | Uçtan uca çalışıyor — web ve mobil                                                  |
| Ödeme (tahsilat, iade, cüzdan, webhook)  | Uçtan uca çalışıyor — mock sağlayıcıyla; gerçek sağlayıcı adaptörü yazılmadı        |
| Bildirim (in-app, mock push/e-posta/SMS) | Uçtan uca çalışıyor — olay bağlantıları, web/mobil liste, admin izleme; gerçek sağlayıcı adaptörü yazılmadı |
| Yönetim paneli                           | Özet, kullanıcı, usta, doğrulama, talep, teklif, sipariş, ödeme, hareket, komisyon, bildirim, denetim ve katalog gerçek veriyle; destek ve kalan büyüme modülleri iskelet |

Ekranlarda sahte veri gösterilmez. Bir uç henüz bağlı değilse ekran bunu açıkça belirtir; uydurma sayı veya örnek kayıt basılmaz.

## Mimari

```
                    ┌──────────────────────────┐
                    │   NestJS API (:3000)     │
                    │   PostgreSQL + Redis     │
                    └────────────┬─────────────┘
                                 │ /api/v1
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────┴────────┐      ┌────────┴────────┐      ┌────────┴────────┐
│ Web (Next.js)  │      │ Mobil (Expo)    │      │ Admin (Next.js) │
│    :3002       │      │  iOS / Android  │      │     :3001       │
└───────┬────────┘      └────────┬────────┘      └────────┬────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
              packages/  types · config · validation
                         business-logic · api-client
                         localization · ui
```

Jeton taşıma yöntemi platforma göre değişir, kimlik akışı değişmez: web'de yenileme jetonu HTTP-only çerezde (JavaScript erişemez), mobilde `expo-secure-store` içinde (Keychain / Keystore) tutulur. İstemci `X-Client-Platform` başlığıyla kendini tanıtır, sunucu buna göre çerez veya gövde ile yanıt verir.

## Dokümantasyon

| Belge                                                               | İçerik                                                     |
| ------------------------------------------------------------------- | ---------------------------------------------------------- |
| [01-architecture.md](docs/01-architecture.md)                       | Sistem mimarisi, monorepo yapısı, teknoloji kararları      |
| [02-data-model.md](docs/02-data-model.md)                           | Varlık ilişkileri, tablo tasarımı, para ve konum modelleri |
| [03-api.md](docs/03-api.md)                                         | Endpoint listesi, yanıt zarfı, hata kodları                |
| [04-screens-and-permissions.md](docs/04-screens-and-permissions.md) | Ekran listeleri ve yetki matrisi                           |
| [05-roadmap-and-risks.md](docs/05-roadmap-and-risks.md)             | Fazlara ayrılmış plan, teknik riskler, MVP dışı kapsam     |

## Gereksinimler

| Araç                | Sürüm          |
| ------------------- | -------------- |
| Node.js             | >= 20.11       |
| npm                 | >= 10          |
| Docker Desktop      | Compose v2 ile |
| Expo Go / EAS (opsiyonel) | SDK 57 uyumlu |

## Hızlı başlangıç

```bash
git clone <repo-url> usta-pilot
cd usta-pilot

cp .env.example .env                          # Windows: Copy-Item .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env

npm install

npm run docker:up      # PostgreSQL, Redis, MinIO
npm run db:migrate     # şemayı uygula
npm run db:seed        # konumlar, kategoriler, komisyon kuralları, demo hesaplar
npm run dev            # API + web + admin
```

Mobil uygulama ayrı bir süreçtir (Metro bundler kendi terminalini ister):

```bash
npm run dev:mobile     # ardından Expo Go ile QR kodu okutun
```

### Mobil cihazdan API'ye erişim

`localhost` telefonun kendisini işaret eder. `apps/mobile/.env` içindeki adresi ortamınıza göre ayarlayın:

| Ortam                 | Adres                          |
| --------------------- | ------------------------------ |
| Android emülatörü     | `http://10.0.2.2:3000/api/v1`  |
| iOS simülatörü        | `http://localhost:3000/api/v1` |
| Fiziksel cihaz (LAN)  | `http://<makine-ip>:3000/api/v1` |

Fiziksel cihaz kullanıyorsanız makinenizin IP adresini `CORS_ORIGINS` listesine eklemeniz gerekmez — Expo istemcisi `Origin` başlığı göndermez.

### Adresler

| Servis          | Adres                              |
| --------------- | ---------------------------------- |
| API             | http://localhost:3000/api/v1       |
| Swagger         | http://localhost:3000/docs         |
| Sağlık kontrolü | http://localhost:3000/health/ready |
| Web sitesi      | http://localhost:3002              |
| Admin paneli    | http://localhost:3001              |
| MinIO konsolu   | http://localhost:9011              |
| PostgreSQL      | localhost:5442                     |
| Redis           | localhost:6389                     |

PostgreSQL ve Redis host portları bilinçli olarak varsayılan değerlerinden farklıdır; aynı makinede çalışan diğer projelerin kapsayıcılarıyla çakışmayı önler. Kapsayıcı içi portlar standarttır (5432 / 6379).

## Monorepo yapısı

```
usta-pilot/
├── apps/
│   ├── backend/          NestJS API (modüler monolit)
│   │   ├── prisma/       şema, migration, seed
│   │   └── src/
│   │       ├── common/   yanıt zarfı, hata modeli, DTO'lar
│   │       ├── config/   Zod ile doğrulanan ortam değişkenleri
│   │       ├── infra/    Prisma, Redis, logging
│   │       └── modules/  alan modülleri (auth, catalog, locations ...)
│   ├── web/              Next.js müşteri sitesi (responsive)
│   ├── admin/            Next.js yönetim paneli
│   ├── mobile/           Expo + React Native (iOS / Android)
│   └── mobile-flutter/   arşivlenmiş Flutter iskeleti (kullanılmıyor)
├── packages/
│   ├── types/            roller, durumlar, model ve API sözleşmesi tipleri
│   ├── config/           sabitler, limitler, API yolları, sorgu anahtarları
│   ├── validation/       Zod şemaları (istemci ve sunucu aynı şemayı kullanır)
│   ├── business-logic/   durum geçişleri, komisyon, yetki matrisi, sıralama
│   ├── api-client/       fetch tabanlı HTTP istemcisi, jeton depoları
│   ├── localization/     TR/EN mesaj katalogları, para ve tarih biçimlendirme
│   └── ui/               web tasarım token'ları ve paylaşılan React bileşenleri
├── docker/
├── docs/
└── docker-compose.yml
```

`packages/ui` yalnızca web ve admin tarafından kullanılır; React Native CSS değişkenlerini okuyamadığı için mobil kendi token dosyasını (`apps/mobile/src/theme/tokens.ts`) tutar. İki dosya aynı renk ve ölçek değerlerini paylaşır.

## Paylaşılan paketler ne içerir

| Paket             | Örnek içerik                                                                    |
| ----------------- | ------------------------------------------------------------------------------- |
| `types`           | `UserRole`, `JobStatus`, `OfferStatus`, `CurrentUser`, `ApiErrorResponse`        |
| `config`          | `API_ROUTES`, `queryKeys`, `JOB`, `OFFER`, `COMMISSION`, durum renk eşlemeleri   |
| `validation`      | `registerSchema`, `loginSchema`, `createJobRequestSchema`, `createOfferSchema`   |
| `business-logic`  | `canTransition`, `calculateCommission`, `permissionsForRole`, `rankProviders`    |
| `api-client`      | `createApiClient`, otomatik jeton yenileme, `ApiError` eşlemesi                 |
| `localization`    | `createTranslator`, `formatMoneyMinor`, `formatDateTime`, durum etiketleri       |
| `ui`              | `Button`, `Card`, `Badge`, `Field`, `StatusPill`, `EmptyState`, `ErrorState`     |

Aynı Zod şeması hem istemcide (anında geri bildirim) hem sunucuda (asıl güvenlik sınırı) çalışır. İstemci doğrulaması hiçbir zaman güvenlik önlemi sayılmaz.

## Komutlar

Kök dizinden çalıştırılır ve tüm workspace'lere yayılır.

| Komut                    | Açıklama                                              |
| ------------------------ | ----------------------------------------------------- |
| `npm run dev`            | API, web ve admin'i birlikte izleme modunda başlatır  |
| `npm run dev:api`        | Yalnızca backend                                      |
| `npm run dev:web`        | Yalnızca web sitesi                                   |
| `npm run dev:admin`      | Yalnızca yönetim paneli                               |
| `npm run dev:mobile`     | Expo geliştirme sunucusu                              |
| `npm run build`          | Tüm workspace'leri derler                             |
| `npm run lint`           | ESLint                                                |
| `npm run test`           | Jest                                                  |
| `npm run typecheck`      | TypeScript tip kontrolü                               |
| `npm run format`         | Prettier ile biçimlendirir                            |
| `npm run db:migrate`     | Migration oluşturur ve uygular                        |
| `npm run db:seed`        | Tohum verisini yükler                                 |
| `npm run db:studio`      | Prisma Studio                                         |
| `npm run docker:up`      | Altyapı servisleri (Postgres, Redis, MinIO)           |
| `npm run docker:up:full` | Backend ve admin dahil tam yığın                      |
| `npm run docker:down`    | Tüm kapsayıcıları durdurur                            |

Turborepo görev bağımlılıklarını yönetir: bir uygulamayı derlemeden önce bağımlı olduğu paketler otomatik derlenir.

## Docker

Varsayılan `docker compose up` yalnızca altyapıyı ayağa kaldırır; backend ve web geliştirme sırasında host üzerinde çalışır çünkü hot reload bu şekilde çok daha hızlıdır.

Tam yığını kapsayıcı içinde çalıştırmak için `full` profili kullanılır:

```bash
npm run docker:up:full
```

## Ortam değişkenleri

Her uygulamanın kendi `.env.example` dosyası vardır:

| Dosya                       | Kapsam                                              |
| --------------------------- | --------------------------------------------------- |
| `.env.example`              | Docker Compose altyapı servisleri                   |
| `apps/backend/.env.example` | API, veritabanı, JWT, sağlayıcılar                  |
| `apps/web/.env.example`     | Web sitesi (yalnızca `NEXT_PUBLIC_`)                |
| `apps/admin/.env.example`   | Yönetim paneli (yalnızca `NEXT_PUBLIC_`)            |
| `apps/mobile/.env.example`  | Mobil uygulama (yalnızca `EXPO_PUBLIC_`)            |

`NEXT_PUBLIC_` ve `EXPO_PUBLIC_` önekli değişkenler istemci paketine gömülür ve cihazdan okunabilir. Gizli anahtarlar yalnızca backend'de tutulur.

Backend değişkenlerini açılışta Zod şemasıyla doğrular (`apps/backend/src/config/env.schema.ts`); eksik veya geçersiz bir değer varsa uygulama istek almadan durur. Production ortamında iki ek kural uygulanır: demo hesapları etkinleştirilemez ve `change_me` içeren JWT gizli anahtarları reddedilir.

## Kimlik doğrulama

| Uç                       | Açıklama                                              |
| ------------------------ | ----------------------------------------------------- |
| `POST /auth/register`    | Müşteri veya usta hesabı oluşturur                    |
| `POST /auth/login`       | E-posta ve şifreyle oturum açar                       |
| `POST /auth/refresh`     | Yenileme jetonuyla yeni erişim jetonu üretir          |
| `POST /auth/logout`      | Bulunulan cihazdaki oturumu kapatır                   |
| `POST /auth/logout-all`  | Tüm cihazlardaki oturumları kapatır                   |
| `GET  /auth/me`          | Oturum açmış kullanıcı ve rol izinleri                |

Uygulanan önlemler:

- Parolalar **argon2id** ile özetlenir (bcrypt değil); her kayıt kendi tuzunu taşır.
- Yenileme jetonu opak ve tek kullanımlıktır; veritabanında yalnızca SHA-256 özeti saklanır. Kullanılan jeton iptal edilip yenisi verilir.
- Erişim jetonu kısa ömürlüdür (varsayılan 15 dk) ve oturum kimliği taşır. Oturum iptal edildiğinde imza geçerli olsa bile istek reddedilir.
- Ardışık hatalı girişler hesabı geçici olarak kilitler; var olmayan kullanıcı için de parola doğrulaması yapılır, böylece yanıt süresi hesabın varlığını sızdırmaz.
- Kimlik doğrulama **varsayılan olarak zorunludur**. Herkese açık uçlar `@Public()` ile açıkça işaretlenir; bir ucu korumayı unutmak değil, açmak bilinçli bir karardır.

## API sözleşmesi

Tüm uçlar aynı zarfı döner. İstisna, izleme araçlarının beklediği biçimi koruyan sağlık uçlarıdır.

Başarılı yanıt:

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 143, "totalPages": 8 }
}
```

Hata yanıtı:

```json
{
  "success": false,
  "error": {
    "code": "OFFER_ALREADY_ACCEPTED",
    "message": "Bu iş için zaten bir usta seçilmiş.",
    "details": []
  },
  "requestId": "fda847e0-6e5e-4036-ad20-f06669452699"
}
```

`code` alanı makine tarafından okunur ve istemciler kararlarını bu alana göre verir; `message` son kullanıcıya gösterilir. `requestId` her yanıtta bulunur ve log kayıtlarıyla eşleşir.

## Veritabanı

Prisma tarafında camelCase, PostgreSQL tarafında snake_case adlandırma kullanılır; eşleme `@map` / `@@map` ile yapılır. Tüm modellerde UUID birincil anahtar, `createdAt` ve `updatedAt` alanları bulunur; kullanıcı verisi tutan tablolara ayrıca `deletedAt` eklenir.

Parasal tutarlar kayıt altında **kuruş cinsinden integer** olarak saklanır. Kayan noktalı tip hiçbir parasal alanda kullanılmaz.

Kategoriler ve konumlar veritabanından gelir; hiçbir istemcide sabit liste tutulmaz. Yeni şehir veya kategori eklemek kod dağıtımı gerektirmez.

## Testler

```bash
npm run test                                    # tümü
npm run test --workspace @ustapilot/backend     # backend
npm run test --workspace @ustapilot/validation  # doğrulama şemaları
```

Kapsam: ortam değişkeni doğrulaması, yanıt zarfı interceptor'ı, parola özetleme, jeton üretimi ve süre ayrıştırma, rol tabanlı yetkilendirme matrisi, durum geçiş kuralları, komisyon hesabı, usta sıralaması, yerelleştirme biçimlendirmesi ve kayıt/giriş/talep/teklif şemaları.

### Duman testleri

Her akışın uçtan uca doğrulaması ayrı bir betiktedir. Çalışan bir API, tohumlanmış veritabanı ve dosya testleri için MinIO gerektirir.

```bash
npm run smoke:auth      # kayıt, giriş, jeton yenileme, oturum kapatma
npm run smoke:jobs      # talep oluşturma, listeleme, iptal
npm run smoke:offers    # teklif verme, kabul, ret, geri çekme
npm run smoke:orders    # ödeme, başlatma, tamamlama, onay, iptal
npm run smoke:payments  # tahsilat, istemci anahtarı, sağlayıcı reddi, webhook imzası, iade
npm run smoke:reviews   # değerlendirme, ortalama puan, usta cevabı, herkese açık liste
npm run smoke:messages  # sohbet açma, mesaj gönderme, okundu işaretleme
npm run smoke:files     # yükleme, sahiplik ve tür kontrolleri
npm run smoke:profile   # kullanıcı/usta profili, hizmet ve bölge yönetimi
npm run smoke:admin     # panel özeti, kullanıcı ve usta yönetimi, denetim kaydı
npm run smoke:notifications # olay → bildirim, okundu, cihaz jetonu, mock outbox
```

Betikler tek tek çalıştırılır: her biri yeni hesaplar açtığı için art arda çalıştırmak kimlik uçlarındaki hız sınırına (`AUTH_THROTTLE_LIMIT`) takılır.

## Varsayımlar

Aşağıdaki kararlar ücretli servis veya harici hesap gerektirdiği için MVP boyunca soyut arayüz + mock uygulama olarak ilerler. Gerçek sağlayıcı seçimi yapıldığında yalnızca ilgili adaptör yazılır.

| Konu                    | Varsayım                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Ödeme sağlayıcısı       | `PaymentProvider` arayüzü + mock sürücü (`PAYMENT_DRIVER`). iyzico sandbox ilk aday. |
| SMS / OTP               | Mock sürücü; Netgsm veya Twilio için adaptör noktası hazır.                                          |
| Push bildirim           | Expo Notifications altyapısı kurulu; FCM/APNs proje anahtarları henüz yok.                           |
| Harita                  | Soyut harita katmanı; Google Maps varsayılan, Mapbox alternatif.                                     |
| Hukuki metinler         | KVKK aydınlatma metni, gizlilik politikası ve kullanım koşulları yer tutucudur; hukuki onay gerekir. |
| App Store / Google Play | Yayıncı hesapları ve sertifikalar tanımlı değil.                                                     |
| Production altyapısı    | Domain, sunucu ve TLS yapılandırması belirlenmedi.                                                   |

## Demo hesapları

Yalnızca `SEED_DEMO_ACCOUNTS=true` iken oluşturulur; şema bu değerin production ortamında true olmasını reddeder.

| Rol     | E-posta               | Parola    |
| ------- | --------------------- | --------- |
| Admin   | admin@ustapilot.com   | Demo1234! |
| Müşteri | musteri@ustapilot.com | Demo1234! |
| Usta    | usta@ustapilot.com    | Demo1234! |
