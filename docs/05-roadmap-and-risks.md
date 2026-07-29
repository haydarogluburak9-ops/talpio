# UstaPilot — Geliştirme Planı, Riskler ve Kapsam Sınırı

## 1. Fazlar

Her faz sonunda: build doğrulaması, testlerin geçmesi, yapılanların özeti ve eksiklerin
açıkça listelenmesi zorunludur. Bir faz "biter" demek, çıkış kriterlerinin tamamı sağlanmış
demektir.

### Faz 1 — Proje Kurulumu

**Kapsam:** Monorepo, NestJS iskeleti, Next.js admin iskeleti, Flutter iskeleti, Docker
Compose (Postgres + Redis + MinIO), ortam değişkenleri, sağlık kontrolü, Swagger, README.
**Çıkış kriteri:** `docker compose up` ile üç servis ayağa kalkar, `/health/ready` yeşil,
admin panel ve Flutter uygulaması derlenir.

### Faz 2 — Veritabanı ve Auth

**Kapsam:** Prisma şeması (tüm modeller), migration, seed (Gaziantep + kategoriler + demo
hesaplar), kayıt/giriş, rol-izin sistemi, refresh token rotation, telefon/e-posta doğrulama,
Flutter giriş-kayıt ekranlarının API'ye bağlanması.
**Çıkış kriteri:** Demo hesaplarla mobilden giriş yapılabilir; auth ve yetki testleri geçer.

### Faz 3 — Profil ve Kategoriler

**Kapsam:** Müşteri profili, usta profili, belge yükleme, kategori/konum servisleri, usta
kategori ve bölge seçimi, admin kategori-konum yönetimi.
**Çıkış kriteri:** Usta profilini tamamlayıp doğrulamaya gönderebilir; admin onaylayabilir.

### Faz 4 — İş Talebi

**Kapsam:** Talep sihirbazı (6 adım), medya yükleme (presigned + sıkıştırma), talep listesi
ve detayı, adres maskeleme, usta eşleştirme kuyruğu.
**Çıkış kriteri:** Müşteri talep yayınlar, uygun ustaların havuzunda görünür.

### Faz 5 — Teklifler

**Kapsam:** İş havuzu, teklif verme/güncelleme/geri çekme, teklif karşılaştırma ekranı,
kabul/ret akışı, transaction ve yarış koşulu koruması, idempotency.
**Çıkış kriteri:** Eşzamanlı iki kabul denemesinde yalnızca biri başarılı olur (test ile
kanıtlanır).

### Faz 6 — Mesajlaşma ve Bildirim

**Kapsam:** Socket.IO altyapısı, sohbet ekranı, okundu bilgisi, sistem mesajları, içerik
güvenlik filtresi, FCM push, bildirim merkezi ve tercihleri.
**Çıkış kriteri:** İki cihaz arasında gerçek zamanlı mesajlaşma ve push bildirimi çalışır.

### Faz 7 — İş Tamamlama ve Değerlendirme

**Kapsam:** Tüm iş durumları ve geçmişi, randevu akışı, tamamlama onayı, beş kriterli
puanlama, yorum ve tek seferlik usta cevabı.
**Çıkış kriteri:** Uçtan uca senaryo (talep → teklif → kabul → iş → onay → yorum) çalışır.

### Faz 8 — Admin Paneli

**Kapsam:** Dashboard, kullanıcı/usta yönetimi, belge doğrulama, talep-teklif-destek-şikâyet
ekranları, sistem ayarları, denetim kayıtları.
**Çıkış kriteri:** Admin, bir ustayı doğrulayıp askıya alabilir; tüm kritik listeler sayfalı
ve filtreli çalışır.

### Faz 9 — Ödeme Altyapısı

**Kapsam:** `PaymentProvider` arayüzü, mock sağlayıcı, komisyon hesaplama servisi, emanet
(escrow) akışı, cüzdan ve muhasebe kayıtları, iade, gerçek sağlayıcı için entegrasyon noktaları.
**Çıkış kriteri:** Mock sağlayıcıyla tam ödeme döngüsü ve komisyon kesintisi doğrulanır.

### Faz 10 — Test ve Kalite

**Kapsam:** Test kapsamının tamamlanması, güvenlik gözden geçirmesi, hata senaryoları,
mobil performans, Docker doğrulaması, API dokümantasyonu ve README.
**Çıkış kriteri:** CI yeşil; kritik akışların tamamı otomatik testle korunuyor.

## 2. Teknik Riskler

| #   | Risk                                                          | Etki            | Olasılık | Önlem                                                                                                   |
| --- | ------------------------------------------------------------- | --------------- | :------: | ------------------------------------------------------------------------------------------------------- |
| 1   | Teklif kabulünde yarış koşulu → iki usta seçilmesi            | Kritik          |   Orta   | `SELECT FOR UPDATE` + benzersiz kısıt + idempotency key + eşzamanlılık testi                            |
| 2   | Ödeme mutabakatsızlığı (para float, yuvarlama, çift kesinti)  | Kritik          |   Orta   | Tam sayı kuruş, değişmez muhasebe kaydı, webhook idempotency, günlük mutabakat işi                      |
| 3   | Adres/telefon sızıntısı (yetkisiz ustaya)                     | Yüksek          |   Orta   | Nesne bazlı policy guard, DTO seviyesinde maskeleme, sızıntı testleri                                   |
| 4   | Platform dışına çıkma (usta-müşteri doğrudan anlaşma)         | Yüksek (gelir)  |  Yüksek  | Mesajda iletişim bilgisi filtresi, işaretleme, emanet ödemenin avantajlı kurgusu                        |
| 5   | Sahte usta / belge sahteciliği                                | Yüksek          |   Orta   | Manuel belge doğrulama, kimlik kontrolü, rozet sistemi, şikâyet akışı                                   |
| 6   | Soğuk başlangıç: kategoride usta yok → teklif gelmez          | Yüksek (ürün)   |  Yüksek  | Gaziantep'te dar kategori seti ile başlama, ustayı önce onboard etme, "usta aranıyor" beklenti yönetimi |
| 7   | Socket.IO yatay ölçeklemede mesaj kaybı                       | Orta            |   Orta   | Redis adapter, mesajın önce DB'ye yazılması, istemcide yeniden bağlanınca cursor ile senkron            |
| 8   | Push bildirim iletilememesi (jeton geçersiz)                  | Orta            |  Yüksek  | Jeton temizliği, çoklu cihaz, uygulama içi bildirim yedeği                                              |
| 9   | Medya yükleme maliyeti ve yavaşlığı                           | Orta            |  Yüksek  | İstemcide sıkıştırma, presigned doğrudan yükleme, boyut/adet limiti, thumbnail                          |
| 10  | N+1 sorgu ve liste performansı                                | Orta            |  Yüksek  | Seçili `select`, index planı, sorgu log eşiği, yük testi                                                |
| 11  | KVKK uyumu (veri saklama, silme, aydınlatma)                  | Yüksek (hukuki) |   Orta   | Soft delete + anonimleştirme işi, veri işleme envanteri, açık rıza kayıtları                            |
| 12  | Ödeme sağlayıcısı entegrasyon gecikmesi (sözleşme, onay)      | Yüksek (takvim) |  Yüksek  | Soyut arayüz + mock ile geliştirmeyi bloklamama                                                         |
| 13  | Harita API maliyeti                                           | Orta            |   Orta   | Soyut `MapProvider`, statik harita önizleme, gereksiz istek engelleme                                   |
| 14  | Çok dilli veri (kategori adları) yapısının sonradan eklenmesi | Orta            |   Orta   | Çeviri tablosunun ilk şemada tanımlanması                                                               |
| 15  | Flutter tek uygulamada iki rol → gezinme karmaşası            | Orta            |   Orta   | Rol bazlı router shell, ayrı navigasyon ağacı, rol değiştirmede tam sıfırlama                           |
| 16  | Uygulama mağazası reddi (ödeme politikaları, izinler)         | Orta            |   Orta   | Fiziksel hizmet ödemesi istisnası, izin gerekçelerinin açık yazılması                                   |

## 3. MVP Dışında Bırakılanlar

Bilinçli olarak ilk sürüme alınmayan özellikler:

| Özellik                                      | Gerekçe                                             | Ne zaman          |
| -------------------------------------------- | --------------------------------------------------- | ----------------- |
| Video yükleme                                | Depolama/işleme maliyeti; altyapı hazır bırakılıyor | v1.1              |
| Sesli/görüntülü arama                        | Yüksek karmaşıklık                                  | v2                |
| Canlı usta konum takibi (harita üzerinde)    | Pil, gizlilik, altyapı                              | v1.2              |
| Otomatik fiyat tahmini / yapay zekâ öneri    | Yeterli veri yok                                    | v2                |
| Abonelik ödemesi otomatik yenileme           | Ödeme sağlayıcısı gerekli                           | Faz 9 sonrası     |
| Çoklu para birimi canlı kur                  | Tek ülke ile başlıyoruz; şema hazır                 | Yurt dışı açılışı |
| Fatura/e-arşiv entegrasyonu                  | Mali müşavir ve entegratör gerekir                  | v1.2              |
| Usta ekip/çalışan yönetimi                   | Kurumsal segment sonraya                            | v2                |
| Takvim senkronizasyonu (Google/Apple)        | Düşük öncelik                                       | v1.2              |
| Referans programı ve puan/rozet oyunlaştırma | Büyüme fazı                                         | v1.1              |
| Web müşteri uygulaması                       | Mobil öncelikli strateji                            | v1.2              |
| Anlaşmazlıkta otomatik hakemlik              | Manuel destek yeterli                               | v2                |
| SMS bildirim kanalı                          | Maliyet; altyapı hazır                              | Talep olunca      |
| Sosyal giriş (Google/Apple)                  | Apple giriş zorunluluğu yayına yakın çözülür        | Yayın öncesi      |

## 4. Ölçüm

MVP başarısı şu göstergelerle izlenir (analytics olayları Faz 6'da eklenir):

- Talep başına ortalama teklif sayısı (hedef ≥ 3)
- İlk teklif süresi (hedef < 30 dk)
- Talep → usta seçimi dönüşümü (hedef ≥ %60)
- Tamamlanan iş oranı ve iptal oranı
- Değerlendirme bırakma oranı
- Usta doğrulama süresi
