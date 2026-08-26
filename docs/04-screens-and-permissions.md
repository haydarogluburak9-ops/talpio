# Talpio — Ekranlar ve Yetki Matrisi

## 1. Mobil Ekran Listesi (Flutter)

Tek uygulama, iki rol. Rol seçimi sonrası yönlendirme `GoRouter` redirect ile yapılır.

### 1.1 Ortak

| Ekran               | Rota                        | Not                            |
| ------------------- | --------------------------- | ------------------------------ |
| Splash              | `/`                         | Oturum ve sürüm kontrolü       |
| Onboarding          | `/onboarding`               | 3 slayt, ilk açılışta          |
| Dil seçimi          | `/language`                 | TR / EN                        |
| Giriş               | `/auth/login`               | E-posta veya telefon           |
| Kayıt               | `/auth/register`            | Rol seçimiyle                  |
| Rol seçimi          | `/auth/role`                | Müşteri / Satıcı                 |
| Telefon doğrulama   | `/auth/verify-phone`        | 6 haneli OTP                   |
| Şifremi unuttum     | `/auth/forgot-password`     |                                |
| Şifre sıfırlama     | `/auth/reset-password`      |                                |
| Bildirim merkezi    | `/notifications`            | Okundu/okunmadı                |
| Mesaj listesi       | `/messages`                 |                                |
| Sohbet              | `/messages/:conversationId` | Gerçek zamanlı                 |
| Profil              | `/profile`                  | Role göre içerik               |
| Ayarlar             | `/settings`                 | Tema, dil, bildirim, oturumlar |
| Yardım ve destek    | `/support`                  | Talep listesi + yeni talep     |
| Gizlilik politikası | `/legal/privacy`            |                                |
| Kullanım koşulları  | `/legal/terms`              |                                |

### 1.2 Müşteri

| Ekran                      | Rota                                    |
| -------------------------- | --------------------------------------- |
| Ana sayfa                  | `/customer/home`                        |
| Kategori listesi           | `/customer/categories`                  |
| Arama                      | `/customer/search`                      |
| Talep sihirbazı — kategori | `/customer/requests/new/category`       |
| Talep sihirbazı — detay    | `/customer/requests/new/details`        |
| Talep sihirbazı — medya    | `/customer/requests/new/media`          |
| Talep sihirbazı — konum    | `/customer/requests/new/location`       |
| Talep sihirbazı — tarih    | `/customer/requests/new/schedule`       |
| Talep sihirbazı — özet     | `/customer/requests/new/review`         |
| Taleplerim                 | `/customer/requests`                    |
| Talep detayı               | `/customer/requests/:id`                |
| Teklif listesi             | `/customer/requests/:id/offers`         |
| Teklif karşılaştırma       | `/customer/requests/:id/offers/compare` |
| Satıcı profili               | `/masters/:id`                          |
| Randevu                    | `/customer/requests/:id/appointment`    |
| Ödeme                      | `/customer/requests/:id/payment`        |
| İş tamamlama onayı         | `/customer/requests/:id/approve`        |
| Değerlendirme              | `/customer/requests/:id/review`         |
| Geçmiş işler               | `/customer/history`                     |
| Favori satıcılar           | `/customer/favorites`                   |

Alt navigasyon: **Ana Sayfa · Taleplerim · Mesajlar · Favoriler · Profil**

### 1.3 Satıcı

| Ekran                | Rota                             |
| -------------------- | -------------------------------- |
| Kontrol paneli       | `/master/home`                   |
| Uygun işler          | `/master/jobs`                   |
| İş detayı            | `/master/jobs/:id`               |
| Teklif oluşturma     | `/master/jobs/:id/offer`         |
| Verdiğim teklifler   | `/master/offers`                 |
| Kabul edilen işler   | `/master/active-jobs`            |
| İş durumu güncelleme | `/master/active-jobs/:id/status` |
| Takvim               | `/master/calendar`               |
| Kazançlar            | `/master/earnings`               |
| Ödeme geçmişi        | `/master/earnings/transactions`  |
| Performans           | `/master/performance`            |
| Yorumlar             | `/master/reviews`                |
| Hizmet kategorileri  | `/master/settings/categories`    |
| Hizmet bölgeleri     | `/master/settings/areas`         |
| Belgeler             | `/master/settings/documents`     |
| Abonelik             | `/master/subscription`           |
| Profil düzenleme     | `/master/profile/edit`           |

Alt navigasyon: **Ana Sayfa · İşler · Teklifler · Mesajlar · Profil**

### 1.4 Müşteri ana sayfa bölümleri

1. Üst bant: kullanıcı adı, seçili konum, bildirim ikonu
2. Başlık: "Bugün hangi satıcıya ihtiyacınız var?"
3. Büyük arama alanı
4. Popüler kategoriler (yatay kaydırma)
5. Acil satıcı çağır (vurgulu aksiyon kartı)
6. Yakınındaki doğrulanmış satıcılar
7. Devam eden işler
8. Son talepler
9. Kampanya kartı
10. Talpio nasıl çalışır? (3 adım)
11. Güvenli hizmet avantajları

## 2. Admin Panel Ekranları (Next.js)

| Menü               | Rota              | İçerik                         |
| ------------------ | ----------------- | ------------------------------ |
| Dashboard          | `/dashboard`      | KPI kartları + grafikler       |
| Kullanıcılar       | `/users`          | Liste, detay, durum değiştirme |
| Satıcılar / İşletmeler | `/masters`    | Liste, profil, performans      |
| Satıcı doğrulamaları | `/verifications`  | Belge inceleme kuyruğu         |
| İş talepleri       | `/job-requests`   | Liste, detay, durum geçmişi    |
| Teklifler          | `/offers`         | Liste, filtreler               |
| Kategoriler        | `/categories`     | Ağaç düzenleme, çeviri         |
| Konumlar           | `/locations`      | Ülke/şehir/ilçe/mahalle        |
| İşlemler           | `/transactions`   | Muhasebe kayıtları             |
| Ödemeler           | `/payments`       | Durum, iade, mutabakat         |
| Komisyonlar        | `/commissions`    | Kural yönetimi                 |
| Şikâyetler         | `/complaints`     | Çözüm akışı                    |
| Destek talepleri   | `/support`        | Ticket yönetimi                |
| Yorumlar           | `/reviews`        | Moderasyon                     |
| Kampanyalar        | `/promotions`     | Kod ve kampanya                |
| Bildirimler        | `/notifications`  | Toplu gönderim                 |
| Abonelikler        | `/subscriptions`  | Plan ve üyeler                 |
| Raporlar           | `/reports`        | Şehir, kategori, büyüme        |
| Sistem ayarları    | `/settings`       | Genel parametreler             |
| Yetkiler           | `/settings/roles` | Rol ve izin yönetimi           |
| Denetim kayıtları  | `/audit-logs`     | Değişiklik geçmişi             |

### Dashboard metrikleri

Toplam kullanıcı · Aktif müşteri · Aktif satıcı · Doğrulama bekleyen satıcı · Açık iş talebi ·
Tamamlanan iş · Toplam işlem hacmi · Platform komisyonu · İptal oranı · Şikâyet oranı ·
En popüler kategoriler · Şehirlere göre kullanım · Günlük ve aylık büyüme

## 3. Yetki Matrisi

`✓` tam erişim · `S` yalnızca kendi kaydı · `K` kısıtlı/maskeli görünüm · `—` erişim yok

| Yetenek                           |    Müşteri    |     Satıcı      |       Destek       |    Admin    |
| --------------------------------- | :-----------: | :-----------: | :----------------: | :---------: |
| Kendi profilini görüntüle/düzenle |       ✓       |       ✓       |         ✓          |      ✓      |
| Satıcı profili oluştur              |       —       |       ✓       |         —          |      —      |
| Satıcı belgesi yükle                |       —       |       S       |         —          |      —      |
| Satıcı belgesini görüntüle          |       —       |       S       |         K          |      ✓      |
| Belge onayla/reddet               |       —       |       —       |         —          |      ✓      |
| İş talebi oluştur                 |       ✓       |       —       |         —          |      —      |
| Kendi taleplerini gör             |       S       |       —       |         K          |      ✓      |
| Uygun iş havuzunu gör             |       —       |       K       |         —          |      ✓      |
| Talebin tam adresini gör          |       S       | Seçilen satıcı  |         K          |      ✓      |
| Teklif ver                        |       —       |       ✓       |         —          |      —      |
| Bir işin tüm tekliflerini gör     |       S       | Kendi teklifi |         K          |      ✓      |
| Teklif kabul et                   |       S       |       —       |         —          |      —      |
| İş durumu güncelle                |  Onay adımı   | Seçilen satıcı  |         —          |      ✓      |
| Mesaj gönder                      |   Katılımcı   |   Katılımcı   |         —          |      —      |
| Mesajları oku                     |   Katılımcı   |   Katılımcı   | Şikâyet kapsamında |      ✓      |
| Değerlendirme yaz                 | Tamamlanan iş |       —       |         —          |      —      |
| Değerlendirmeye cevap ver         |       —       |    Bir kez    |         —          |      —      |
| Yorumu gizle/sil                  |       —       |       —       |        Öner        |      ✓      |
| Ödeme yap                         |       ✓       |       —       |         —          |      —      |
| Ödeme kaydını gör                 |       S       |       S       |         K          |      ✓      |
| İade başlat                       |     Talep     |       —       |        Öner        |      ✓      |
| Komisyon kuralı düzenle           |       —       |       —       |         —          |      ✓      |
| Cüzdan/kazanç gör                 |       —       |       S       |         K          |      ✓      |
| Destek talebi aç                  |       ✓       |       ✓       |         ✓          |      ✓      |
| Destek talebi yanıtla             |       —       |       —       |         ✓          |      ✓      |
| Şikâyet oluştur                   |       ✓       |       ✓       |         —          |      —      |
| Şikâyet çöz                       |       —       |       —       |         ✓          |      ✓      |
| Kullanıcı askıya al               |       —       |       —       |         —          |      ✓      |
| Kategori/konum yönet              |       —       |       —       |         —          |      ✓      |
| Toplu bildirim gönder             |       —       |       —       |         —          |      ✓      |
| Sistem ayarları                   |       —       |       —       |         —          |      ✓      |
| Rol ve izin yönetimi              |       —       |       —       |         —          | Süper Admin |
| Denetim kayıtları                 |       —       |       —       |         K          |      ✓      |

### Nesne bazlı kural özeti

Rol kontrolü tek başına yeterli değildir; her kaynak erişiminde ek olarak:

1. **Sahiplik:** `resource.ownerId === user.id` (talep, adres, teklif, ödeme).
2. **Katılımcılık:** sohbet ve mesajlarda `ConversationParticipant` kaydı aranır.
3. **Aşama:** tam adres yalnızca `MASTER_SELECTED` ve sonrası, yalnızca seçilen satıcıya.
4. **Teklif gizliliği:** satıcı yalnızca kendi teklifini görür; rakip teklif tutarlarını göremez.
5. **Doğrulama şartı:** `VERIFIED` olmayan satıcı teklif veremez, iş kabul edemez.
6. **Destek sınırı:** destek yetkilisi finansal kayıtlarda yalnızca maskeli özet görür,
   kart/IBAN verisine hiçbir rolde erişilemez.

Her reddedilen erişim denemesi `AuditLog`'a `ACCESS_DENIED` olarak yazılır.
