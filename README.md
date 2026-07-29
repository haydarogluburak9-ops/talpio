# UstaPilot

**Doğru usta. Doğru fiyat. Güvenli hizmet.**

Hizmet ihtiyacı olan müşterilerle profesyonel ustaları buluşturan pazaryeri platformu. İlk pazar Gaziantep'tir; mimari çok şehirli, çok ülkeli ve çok dilli büyümeye göre tasarlanmıştır.

Platform üç uygulamadan oluşur: Flutter mobil uygulama (müşteri ve usta rolleri), NestJS modüler monolit API ve Next.js yönetim paneli.

## Durum

**Faz 1 tamamlandı.** Monorepo iskeleti, altyapı servisleri, çekirdek backend katmanları, admin paneli kabuğu ve Flutter uygulama iskeleti çalışır durumdadır. Üç istemci de gerçek API'ye bağlanır — sağlık kontrolü uçtan uca doğrulanmıştır.

Alan modelleri (User, JobRequest, Offer, Payment ...) ve kimlik doğrulama Faz 2 ile gelir. Yol haritası için [docs/05-roadmap-and-risks.md](docs/05-roadmap-and-risks.md).

## Dokümantasyon

| Belge                                                               | İçerik                                                     |
| ------------------------------------------------------------------- | ---------------------------------------------------------- |
| [01-architecture.md](docs/01-architecture.md)                       | Sistem mimarisi, monorepo yapısı, teknoloji kararları      |
| [02-data-model.md](docs/02-data-model.md)                           | Varlık ilişkileri, tablo tasarımı, para ve konum modelleri |
| [03-api.md](docs/03-api.md)                                         | Endpoint listesi, yanıt zarfı, hata kodları                |
| [04-screens-and-permissions.md](docs/04-screens-and-permissions.md) | Mobil/admin ekran listeleri ve yetki matrisi               |
| [05-roadmap-and-risks.md](docs/05-roadmap-and-risks.md)             | Fazlara ayrılmış plan, teknik riskler, MVP dışı kapsam     |

## Gereksinimler

| Araç           | Sürüm            |
| -------------- | ---------------- |
| Node.js        | >= 20.11         |
| npm            | >= 10            |
| Docker Desktop | Compose v2 ile   |
| Flutter        | >= 3.35 (stable) |

## Hızlı başlangıç

```bash
git clone <repo-url> usta-pilot
cd usta-pilot

cp .env.example .env      # Windows: Copy-Item .env.example .env
npm install

npm run docker:up         # PostgreSQL, Redis, MinIO
npm run db:migrate        # şemayı uygula
npm run db:seed           # Gaziantep + sistem ayarları
npm run dev               # backend (:3000) + admin (:3001)
```

Mobil uygulama ayrı çalışır:

```bash
cd apps/mobile
flutter pub get
flutter gen-l10n         # yerelleştirme sınıflarını üretir
flutter run
```

### Adresler

| Servis          | Adres                              |
| --------------- | ---------------------------------- |
| API             | http://localhost:3000/api/v1       |
| Swagger         | http://localhost:3000/docs         |
| Sağlık kontrolü | http://localhost:3000/health/ready |
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
│   │       └── modules/  alan modülleri
│   ├── admin/            Next.js yönetim paneli
│   └── mobile/           Flutter uygulaması (feature-first)
├── docker/               Dockerfile'lar ve init script'leri
├── docs/                 mimari ve tasarım dokümanları
└── docker-compose.yml
```

Flutter tarafında her özellik `data / domain / presentation` katmanlarına ayrılır. Backend tarafında her modül kendi controller, service ve DTO sınırları içinde kalır.

## Komutlar

Kök dizinden çalıştırılır ve tüm workspace'lere yayılır.

| Komut                    | Açıklama                                                   |
| ------------------------ | ---------------------------------------------------------- |
| `npm run dev`            | Backend ve admin panelini birlikte izleme modunda başlatır |
| `npm run build`          | Tüm workspace'leri derler                                  |
| `npm run lint`           | ESLint                                                     |
| `npm run test`           | Jest                                                       |
| `npm run typecheck`      | TypeScript tip kontrolü                                    |
| `npm run format`         | Prettier ile biçimlendirir                                 |
| `npm run db:migrate`     | Migration oluşturur ve uygular                             |
| `npm run db:seed`        | Seed verisini yükler                                       |
| `npm run db:studio`      | Prisma Studio                                              |
| `npm run docker:up`      | Altyapı servisleri (Postgres, Redis, MinIO)                |
| `npm run docker:up:full` | Backend ve admin dahil tam yığın                           |
| `npm run docker:down`    | Tüm kapsayıcıları durdurur                                 |

Flutter komutları `apps/mobile` içinden çalıştırılır: `flutter analyze`, `flutter test`, `flutter gen-l10n`.

## Docker

Varsayılan `docker compose up` yalnızca altyapıyı ayağa kaldırır; backend ve admin geliştirme sırasında host üzerinde çalışır çünkü hot reload bu şekilde çok daha hızlıdır.

Tam yığını kapsayıcı içinde çalıştırmak için `full` profili kullanılır:

```bash
npm run docker:up:full
```

## Ortam değişkenleri

Tüm değişkenler `.env.example` içinde açıklamalarıyla listelenmiştir. Backend bunları Zod şemasıyla doğrular (`apps/backend/src/config/env.schema.ts`); eksik veya geçersiz bir değer varsa uygulama başlamaz.

Production ortamında şema iki ek kural uygular: demo hesapları etkinleştirilemez ve varsayılan JWT gizli anahtarları kullanılamaz.

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

Prisma tarafında camelCase, PostgreSQL tarafında snake_case adlandırma kullanılır; eşleme `@map` / `@@map` ile yapılır. Tüm modellerde UUIDv7 birincil anahtar, `createdAt` ve `updatedAt` alanları bulunur; kullanıcı verisi tutan tablolara ayrıca `deletedAt` eklenir.

Parasal tutarlar kayıt altında **kuruş cinsinden integer** olarak saklanır. Kayan noktalı tip kullanılmaz.

## Testler

| Kapsam                 | Komut                                         | Durum   |
| ---------------------- | --------------------------------------------- | ------- |
| Backend birim          | `npm run test --workspace @ustapilot/backend` | 12 test |
| Flutter birim + widget | `cd apps/mobile && flutter test`              | 12 test |

Faz 1 testleri ortam değişkeni doğrulamasını, yanıt zarfı interceptor'ını, mobil API istemcisinin hata eşlemesini ve açılış/yönlendirme akışını kapsar. Kimlik doğrulama, teklif ve ödeme akışlarının entegrasyon testleri ilgili fazlarda eklenir.

## Varsayımlar

Aşağıdaki kararlar ücretli servis veya harici hesap gerektirdiği için MVP boyunca soyut arayüz + mock uygulama olarak ilerler. Gerçek sağlayıcı seçimi yapıldığında yalnızca ilgili adaptör yazılır.

| Konu                    | Varsayım                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Ödeme sağlayıcısı       | `PaymentProvider` arayüzü + mock. iyzico sandbox ilk aday.                                           |
| SMS / OTP               | Mock sürücü; Netgsm veya Twilio için adaptör noktası hazır.                                          |
| Push bildirim           | Firebase Cloud Messaging varsayılır; proje anahtarları henüz yok.                                    |
| Harita                  | Soyut harita katmanı; Google Maps varsayılan, Mapbox alternatif.                                     |
| Hukuki metinler         | KVKK aydınlatma metni, gizlilik politikası ve kullanım koşulları yer tutucudur; hukuki onay gerekir. |
| App Store / Google Play | Yayıncı hesapları ve sertifikalar tanımlı değil.                                                     |
| Production altyapısı    | Domain, sunucu ve TLS yapılandırması belirlenmedi.                                                   |

## Demo hesapları

Yalnızca development seed'inde oluşturulur; `SEED_DEMO_ACCOUNTS` production ortamında etkinleştirilemez.

| Rol     | E-posta               | Parola    |
| ------- | --------------------- | --------- |
| Admin   | admin@ustapilot.com   | Demo1234! |
| Müşteri | musteri@ustapilot.com | Demo1234! |
| Usta    | usta@ustapilot.com    | Demo1234! |

Kullanıcı modelleri Faz 2 ile eklendiğinde bu hesaplar seed'e dahil edilir.
