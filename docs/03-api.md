# Talpio — API Sözleşmesi

Taban yol: `/api/v1` · Kimlik: `Authorization: Bearer <accessToken>` · Format: JSON

## 1. Standart Yanıt Zarfı

Başarılı:

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 134, "hasNext": true }
}
```

Hatalı:

```json
{
  "success": false,
  "error": {
    "code": "OFFER_ALREADY_ACCEPTED",
    "message": "Bu iş için zaten bir satıcı seçilmiş.",
    "details": [{ "field": "offerId", "issue": "conflict" }]
  },
  "requestId": "01J8XZ..."
}
```

- `code` makine-okunur ve sabittir; istemci buna göre davranır.
- `message` kullanıcıya gösterilebilir, `Accept-Language` başlığına göre yerelleştirilir.
- Doğrulama hataları `422 VALIDATION_ERROR`, yetki `403 FORBIDDEN`, kimlik `401 UNAUTHORIZED`.

### Sayfalama, filtreleme, sıralama

Tüm liste uçları: `?page=1&limit=20&sort=createdAt:desc&q=arama&filter[status]=PUBLISHED`
Sonsuz kaydırma gereken uçlarda (mesajlar, bildirimler) ek olarak cursor desteği:
`?cursor=<id>&limit=30`.

### Idempotency

Kritik POST uçları (`teklif kabul`, `ödeme başlat`) `Idempotency-Key` başlığı kabul eder.
Aynı anahtarla gelen tekrar istek, ilk işlemin sonucunu döndürür — çift tıklama korumaya alınır.

## 2. Uç Nokta Listesi

### Auth — `/auth`

| Metot  | Yol                          | Açıklama                                | Erişim        |
| ------ | ---------------------------- | --------------------------------------- | ------------- |
| POST   | `/auth/register`             | E-posta + telefon ile kayıt, rol seçimi | Herkes        |
| POST   | `/auth/login`                | Giriş, access + refresh döner           | Herkes        |
| POST   | `/auth/refresh`              | Token yenileme (rotation)               | Refresh token |
| POST   | `/auth/logout`               | Mevcut oturumu kapat                    | Kimlikli      |
| POST   | `/auth/logout-all`           | Tüm cihazlardan çıkış                   | Kimlikli      |
| POST   | `/auth/verify/phone/request` | SMS kodu gönder                         | Kimlikli      |
| POST   | `/auth/verify/phone/confirm` | Kodu doğrula                            | Kimlikli      |
| POST   | `/auth/verify/email/request` | Doğrulama e-postası                     | Kimlikli      |
| GET    | `/auth/verify/email/confirm` | E-posta doğrulama bağlantısı            | Token         |
| POST   | `/auth/password/forgot`      | Sıfırlama talebi                        | Herkes        |
| POST   | `/auth/password/reset`       | Yeni parola                             | Token         |
| POST   | `/auth/password/change`      | Parola değiştir                         | Kimlikli      |
| GET    | `/auth/sessions`             | Aktif cihaz/oturum listesi              | Kimlikli      |
| DELETE | `/auth/sessions/:id`         | Oturumu sonlandır                       | Kimlikli      |

### Users & Profiles

| Metot  | Yol                         | Açıklama                                    | Erişim   |
| ------ | --------------------------- | ------------------------------------------- | -------- |
| GET    | `/users/me`                 | Profil + roller + izinler                   | Kimlikli |
| PATCH  | `/users/me`                 | Temel bilgi güncelle                        | Kimlikli |
| PATCH  | `/users/me/locale`          | Dil / saat dilimi                           | Kimlikli |
| DELETE | `/users/me`                 | Hesap silme talebi (soft delete)            | Kimlikli |
| GET    | `/customers/me`             | Müşteri profili                             | Müşteri  |
| PATCH  | `/customers/me`             | Müşteri profili güncelle                    | Müşteri  |
| POST   | `/masters`                  | Satıcı profili oluştur                        | Kimlikli |
| GET    | `/masters/me`               | Kendi satıcı profili (özel alanlar dahil)     | Satıcı     |
| PATCH  | `/masters/me`               | Satıcı profili güncelle                       | Satıcı     |
| GET    | `/masters/:id`              | Herkese açık satıcı profili                   | Kimlikli |
| GET    | `/masters`                  | Satıcı arama (kategori, bölge, puan filtreli) | Kimlikli |
| PUT    | `/masters/me/categories`    | Hizmet kategorilerini ayarla                | Satıcı     |
| PUT    | `/masters/me/service-areas` | Hizmet bölgelerini ayarla                   | Satıcı     |
| PUT    | `/masters/me/working-hours` | Çalışma saatleri                            | Satıcı     |
| GET    | `/masters/me/stats`         | Performans özeti                            | Satıcı     |

### Documents & Verification

| Metot  | Yol                                | Açıklama                    | Erişim |
| ------ | ---------------------------------- | --------------------------- | ------ |
| POST   | `/masters/me/documents`            | Belge yükle                 | Satıcı   |
| GET    | `/masters/me/documents`            | Kendi belgeleri + durumları | Satıcı   |
| DELETE | `/masters/me/documents/:id`        | Belge sil (onaylanmamışsa)  | Satıcı   |
| GET    | `/admin/verifications`             | Bekleyen doğrulamalar       | Admin  |
| POST   | `/admin/verifications/:id/approve` | Belge onayla                | Admin  |
| POST   | `/admin/verifications/:id/reject`  | Gerekçeyle reddet           | Admin  |

### Categories & Locations

| Metot             | Yol                                    | Açıklama                               | Erişim |
| ----------------- | -------------------------------------- | -------------------------------------- | ------ |
| GET               | `/categories`                          | Ağaç yapısında kategoriler (dile göre) | Herkes |
| GET               | `/categories/:slug`                    | Kategori detayı                        | Herkes |
| GET               | `/categories/popular`                  | Popüler kategoriler                    | Herkes |
| POST/PATCH/DELETE | `/admin/categories/...`                | Kategori yönetimi                      | Admin  |
| GET               | `/locations/countries`                 | Ülkeler                                | Herkes |
| GET               | `/locations/cities?countryId=`         | Şehirler                               | Herkes |
| GET               | `/locations/districts?cityId=`         | İlçeler                                | Herkes |
| GET               | `/locations/neighborhoods?districtId=` | Mahalleler                             | Herkes |
| POST/PATCH/DELETE | `/admin/locations/...`                 | Konum yönetimi                         | Admin  |

### Addresses

| Metot  | Yol              | Açıklama           | Erişim   |
| ------ | ---------------- | ------------------ | -------- |
| GET    | `/addresses`     | Kayıtlı adreslerim | Kimlikli |
| POST   | `/addresses`     | Adres ekle         | Kimlikli |
| PATCH  | `/addresses/:id` | Güncelle           | Sahip    |
| DELETE | `/addresses/:id` | Sil                | Sahip    |

### Job Requests

| Metot  | Yol                                | Açıklama                              | Erişim       |
| ------ | ---------------------------------- | ------------------------------------- | ------------ |
| POST   | `/job-requests`                    | Taslak oluştur                        | Müşteri      |
| PATCH  | `/job-requests/:id`                | Taslağı güncelle (sihirbaz adımları)  | Sahip        |
| POST   | `/job-requests/:id/publish`        | Yayınla → eşleştirme tetiklenir       | Sahip        |
| GET    | `/job-requests`                    | Kendi taleplerim (durum filtreli)     | Müşteri      |
| GET    | `/job-requests/:id`                | Detay (role göre maskeli adres)       | İlgili taraf |
| POST   | `/job-requests/:id/cancel`         | İptal + gerekçe                       | Sahip        |
| GET    | `/job-requests/:id/status-history` | Durum geçmişi                         | İlgili taraf |
| POST   | `/job-requests/:id/status`         | Durum güncelle (satıcı yolda, başladı…) | Seçilen satıcı |
| POST   | `/job-requests/:id/complete`       | Satıcı tamamlandı bildirir              | Seçilen satıcı |
| POST   | `/job-requests/:id/approve`        | Müşteri onaylar → ödeme serbest       | Sahip        |
| POST   | `/job-requests/:id/dispute`        | Anlaşmazlık aç                        | İlgili taraf |
| GET    | `/job-requests/available`          | Satıcıya uygun iş havuzu                | Satıcı         |
| POST   | `/job-requests/:id/media`          | Fotoğraf yükleme (presigned)          | Sahip        |
| DELETE | `/job-requests/:id/media/:mediaId` | Medya sil                             | Sahip        |

### Offers

| Metot | Yol                        | Açıklama                                  | Erişim        |
| ----- | -------------------------- | ----------------------------------------- | ------------- |
| POST  | `/job-requests/:id/offers` | Teklif ver                                | Satıcı          |
| GET   | `/job-requests/:id/offers` | İşin teklifleri (karşılaştırma verisiyle) | İş sahibi     |
| PATCH | `/offers/:id`              | Teklifi güncelle (revizyon kaydı)         | Teklif sahibi |
| POST  | `/offers/:id/withdraw`     | Teklifi geri çek                          | Teklif sahibi |
| POST  | `/offers/:id/accept`       | Teklifi kabul et (transaction)            | İş sahibi     |
| POST  | `/offers/:id/reject`       | Tek teklifi reddet                        | İş sahibi     |
| GET   | `/offers/mine`             | Verdiğim teklifler                        | Satıcı          |

### Appointments

| Metot | Yol                             | Açıklama               | Erişim       |
| ----- | ------------------------------- | ---------------------- | ------------ |
| POST  | `/job-requests/:id/appointment` | Randevu öner           | İlgili taraf |
| PATCH | `/appointments/:id`             | Zaman değişikliği öner | İlgili taraf |
| POST  | `/appointments/:id/confirm`     | Onayla                 | Karşı taraf  |
| POST  | `/appointments/:id/cancel`      | İptal                  | İlgili taraf |
| GET   | `/appointments/calendar`        | Takvim görünümü        | Satıcı         |

### Messaging

| Metot | Yol                           | Açıklama                               | Erişim    |
| ----- | ----------------------------- | -------------------------------------- | --------- |
| GET   | `/conversations`              | Sohbet listesi + son mesaj + okunmamış | Kimlikli  |
| GET   | `/conversations/:id`          | Sohbet meta verisi                     | Katılımcı |
| GET   | `/conversations/:id/messages` | Mesajlar (cursor sayfalama)            | Katılımcı |
| POST  | `/conversations/:id/messages` | Mesaj gönder                           | Katılımcı |
| POST  | `/conversations/:id/read`     | Okundu işaretle                        | Katılımcı |
| POST  | `/messages/:id/hide`          | Kendinden gizle                        | Katılımcı |
| POST  | `/messages/:id/report`        | Şikâyet et                             | Katılımcı |

**WebSocket olayları** (`/realtime`):
`message:new`, `message:read`, `typing:start`, `typing:stop`, `job:status_changed`,
`offer:new`, `offer:accepted`, `notification:new`

### Payments

| Metot | Yol                            | Açıklama                               | Erişim       |
| ----- | ------------------------------ | -------------------------------------- | ------------ |
| POST  | `/payments/intent`             | Kabul edilen teklif için ödeme niyeti  | Müşteri      |
| POST  | `/payments/:id/confirm`        | Sağlayıcı dönüşü / doğrulama           | Müşteri      |
| GET   | `/payments/:id`                | Ödeme detayı                           | İlgili taraf |
| GET   | `/payments/mine`               | Ödeme geçmişi                          | Kimlikli     |
| POST  | `/webhooks/payments/:provider` | Sağlayıcı webhook'u (imza doğrulamalı) | Sağlayıcı    |
| GET   | `/wallet/me`                   | Satıcı cüzdan bakiyesi                   | Satıcı         |
| GET   | `/wallet/me/transactions`      | Cüzdan hareketleri                     | Satıcı         |
| POST  | `/wallet/me/payout-request`    | Ödeme talebi                           | Satıcı         |

### Reviews

| Metot | Yol                        | Açıklama                    | Erişim                    |
| ----- | -------------------------- | --------------------------- | ------------------------- |
| POST  | `/job-requests/:id/review` | Değerlendirme bırak         | İş sahibi, tamamlanmış iş |
| GET   | `/masters/:id/reviews`     | Satıcı yorumları (sayfalı)    | Herkes                    |
| POST  | `/reviews/:id/reply`       | Satıcının tek seferlik cevabı | Yorumun ustası            |
| POST  | `/reviews/:id/report`      | Yorumu şikâyet et           | Kimlikli                  |

### Favorites, Notifications, Support

| Metot           | Yol                              | Açıklama                | Erişim   |
| --------------- | -------------------------------- | ----------------------- | -------- |
| GET/POST/DELETE | `/favorites/masters[/:masterId]` | Favori satıcı yönetimi    | Müşteri  |
| GET             | `/notifications`                 | Bildirim merkezi        | Kimlikli |
| POST            | `/notifications/read-all`        | Tümünü okundu yap       | Kimlikli |
| PUT             | `/notifications/preferences`     | Kanal tercihleri        | Kimlikli |
| POST            | `/devices/token`                 | FCM cihaz jetonu kaydet | Kimlikli |
| DELETE          | `/devices/token`                 | Jeton sil               | Kimlikli |
| POST            | `/support/tickets`               | Destek talebi aç        | Kimlikli |
| GET             | `/support/tickets`               | Taleplerim              | Kimlikli |
| POST            | `/support/tickets/:id/messages`  | Talebe mesaj            | Kimlikli |
| POST            | `/complaints`                    | Şikâyet oluştur         | Kimlikli |

### Subscriptions & Promotions

| Metot  | Yol                    | Açıklama               | Erişim   |
| ------ | ---------------------- | ---------------------- | -------- |
| GET    | `/subscriptions/plans` | Planlar                | Kimlikli |
| POST   | `/subscriptions`       | Abonelik başlat        | Satıcı     |
| DELETE | `/subscriptions/me`    | Aboneliği iptal et     | Satıcı     |
| POST   | `/promotions/validate` | Promosyon kodu doğrula | Kimlikli |

### Admin

| Metot          | Yol                              | Açıklama                    |
| -------------- | -------------------------------- | --------------------------- |
| GET            | `/admin/dashboard`               | Özet metrikler              |
| GET            | `/admin/users`                   | Kullanıcı listesi + filtre  |
| PATCH          | `/admin/users/:id/status`        | Askıya alma / aktifleştirme |
| GET            | `/admin/masters`                 | Satıcı listesi                |
| GET            | `/admin/job-requests`            | Tüm talepler                |
| GET            | `/admin/offers`                  | Tüm teklifler               |
| GET            | `/admin/payments`                | Ödeme ve mutabakat          |
| GET/POST/PATCH | `/admin/commission-rules`        | Komisyon yönetimi           |
| GET/PATCH      | `/admin/complaints`              | Şikâyet yönetimi            |
| GET/PATCH      | `/admin/support/tickets`         | Destek yönetimi             |
| GET/PATCH      | `/admin/reviews`                 | Yorum moderasyonu           |
| GET/POST       | `/admin/promotions`              | Kampanyalar                 |
| POST           | `/admin/notifications/broadcast` | Toplu bildirim              |
| GET            | `/admin/reports/*`               | Raporlar                    |
| GET/PUT        | `/admin/settings`                | Sistem ayarları             |
| GET            | `/admin/audit-logs`              | Denetim kayıtları           |

### Sistem

| Metot | Yol             | Açıklama                               |
| ----- | --------------- | -------------------------------------- |
| GET   | `/health`       | Canlılık                               |
| GET   | `/health/ready` | DB + Redis + storage hazırlık kontrolü |
| GET   | `/docs`         | Swagger UI                             |

## 3. Hata Kodları (seçilmiş)

| Kod                                        | HTTP      | Anlam                                             |
| ------------------------------------------ | --------- | ------------------------------------------------- |
| `VALIDATION_ERROR`                         | 422       | Alan doğrulama hatası                             |
| `INVALID_CREDENTIALS`                      | 401       | Hatalı giriş                                      |
| `TOKEN_EXPIRED`                            | 401       | Access token süresi doldu                         |
| `REFRESH_TOKEN_REUSED`                     | 401       | Token yeniden kullanımı — tüm oturumlar kapatılır |
| `PHONE_NOT_VERIFIED`                       | 403       | Telefon doğrulaması gerekli                       |
| `MASTER_NOT_VERIFIED`                      | 403       | Doğrulanmamış satıcı teklif veremez                 |
| `FORBIDDEN_RESOURCE`                       | 403       | Nesne sahipliği yok                               |
| `JOB_NOT_OPEN_FOR_OFFERS`                  | 409       | İş teklife kapalı                                 |
| `OFFER_ALREADY_ACCEPTED`                   | 409       | Zaten satıcı seçilmiş                               |
| `OFFER_EXPIRED`                            | 409       | Teklif geçerlilik süresi doldu                    |
| `DUPLICATE_OFFER`                          | 409       | Bu işe zaten teklif verilmiş                      |
| `PAYMENT_REQUIRED`                         | 402       | Ödeme tamamlanmadan devam edilemez                |
| `RATE_LIMITED`                             | 429       | İstek limiti aşıldı                               |
| `FILE_TOO_LARGE` / `UNSUPPORTED_FILE_TYPE` | 413 / 415 | Dosya kısıtları                                   |
