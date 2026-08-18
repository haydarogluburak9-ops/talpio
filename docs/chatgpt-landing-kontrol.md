# TALPIO PUBLIC LANDING — ChatGPT Kontrol Briefi

> Bu dosya **yalnızca public `/` landing** içindir. Tüm yazılım denetimi: `docs/chatgpt-proje-kontrol.md`.

**Tarih:** 2026-08-13  
**Kapsam:** Yalnızca public web ana sayfa `/` (giriş yapılmamış).  
**Viewport:** 1440px veya 1536px desktop.

Bu dosyayı ChatGPT’ye yükle. Görsel karşılaştırma istiyorsan aynı sohbete şunları da ekle:

1. TARGET — `docs/chatgpt-assets/talpio-landing-target.png`
2. CURRENT — `docs/chatgpt-assets/talpio-landing-current-full.png`

Görsel yoksa yine de bu metne göre denetim yaz. Kod üretme.

---

## Görev

1. TARGET (varsa) ile CURRENT implementasyonu karşılaştır.
2. Layout / ölçek / hiyerarşi / premium his farklarını madde madde yaz.
3. Her farka **kritik / orta / düşük** ver.
4. Kod yazma. Sadece denetim ve düzeltme listesi üret.
5. Dashboard, feed, admin, mobil’e dokunma.

**Hedef his:** Sosyal ticaret ağı (talep + teklif + fırsat). Linear / Stripe kalitesinde premium landing. Talpio kimliği: navy + orange.

**Yasak:** “En büyük / 1 milyon kullanıcı / 50K+ / 200.000+” gibi kanıtsız üretim metriği önerme. Sahte sayıyı geri ekleme.

---

## CURRENT — kod gerçeği (2026-08-13 canlı `/`)

Route: `apps/web/src/app/page.tsx`  
Kopya: `packages/localization/src/locales/tr.ts` → `home.*`  
Hero sağ: `apps/web/src/components/home/hero-visual.tsx`  
Navbar: `apps/web/src/components/layout/site-header.tsx`  
Logo: `/brand/talpio-lockup-light.png`

Giriş yapmış kullanıcı `/` görmez, `/akis`’e gider.

### Navbar

- Zemin: beyaz `#FFFFFF`, yükseklik ~76px, max-width 1500px, border `#E8EBF0`
- Menü: Keşfet · Fırsatlar · Talepler · İşletmeler · Kampanyalar · Kaynaklar
- Sağ: search, TR, Giriş yap, turuncu **Ücretsiz Kayıt Ol** (`#FF5A0A`, ~46px, 10px radius)

| Label | href |
| --- | --- |
| Keşfet | `/kesfet` |
| Fırsatlar | `/kategoriler` |
| Talepler | `/tedarik` |
| İşletmeler | `/satici-ol` |
| Kampanyalar | `/akis` |
| Kaynaklar | `/nasil-calisir` |

### Hero (desktop ≥1280)

Grid 42% / 58%, max-width 1500px, min-height ~560–580px.

**Sol kopya (canlı):**

- Badge: `Talep · teklif · fırsat ağı`
- Title:
  - Taleplerini paylaş,
  - **en iyi teklifleri** al,  ← orange `#FF5A0A`
  - işini büyüt!
- Title ölçü: `clamp(40–66px)`, weight 800, tracking -0.035em
- Subtitle: `İhtiyacını yayınla, satıcılardan teklif al, fırsat akışını takip et. Sahte üye veya işlem sayısı gösterilmez.`
- CTA: **Hemen Talep Oluştur** (56px, orange) + **Fırsatları Keşfet** (56px, outline)
- Social proof: overlapping avatar harfleri (B E A M S) + `Talep · Teklif · Fırsat aynı platformda`
  - Eski `200.000+` kaldırıldı. Geri ekleme.

**Sağ:** HTML telefon + floating kartlar. Fotogerçekçi 3D device değil. Castrol vb. demo ürün kopyası; partner iddiası değil.

Telefon mockup’ta kalan **demo sayılar** (üretim istatistiği değil; hero/stats regresyonu sayma):

- Trend: `Şu anda 1.240 kişi inceliyor`
- Reaksiyon: `124` / `86`
- Talep kartı: `12 Teklif Aldı`
- Kampanya: `%20 İNDİRİM`

İstenirse bu kopyayı sayı içermeyen demo metne çevir; layout aynı kalsın.

### Stats şeridi (hero’nun hemen altı)

Yükseklik ~96px. **Sayı yok.** 6 kolon, ikon + etiket:

1. Talep yayınla
2. Teklif al
3. Fırsat akışı
4. Satıcı keşfi
5. Güvenli mesaj
6. İşletme paneli

Uyarı (görünür): `Aşağıdakiler ürün yetenekleridir; üretim istatistiği değildir`

TARGET’ta 50K+ / 1M+ varsa layout hiyerarşisini koru, sahte üretim sayısı basma. Bu sapma kasıtlı ürün kuralı; bug değil.

### Features

- Başlık: `Talpio ile ticaret artık` + orange `çok daha kolay!`
- Hint: `İhtiyacını paylaş, en uygun teklifleri al, güvenilir işletmelerle çalış ve işini büyüt.`
- Chip: Güvenli / Hızlı / Kolay / Kazançlı
- 4 kart:
  - Talep Oluştur — `İhtiyacını detaylı olarak paylaş, doğru teklifler sana gelsin.` → `/tedarik`
  - Fırsatları Keşfet — `İndirimleri, kampanyaları ve özel fiyatları anında keşfet.` → `/kesfet`
  - Teklifleri Karşılaştır — `Gelen teklifleri kolayca karşılaştır, en iyisini seç.` → `/nasil-calisir`
  - İşini Büyüt — `Doğru bağlantılar kur, operasyonlarını yönet, kazancını artır.` → `/satici-ol`

### Partners

- Başlık: `İşletmeler Talpio ile buluşuyor` (eski “Binlerce işletme…” kaldırıldı)
- Gerçek marka logosu yok: `Marka 01` … `Marka 08`
- Yetkisiz “Castrol/Bosch güveniyor” iddiası yok
- Screen-reader disclaimer: logo şeridi sunum placeholder’ıdır

Yasal sayfalar var (`/yasal/gizlilik`, `/yasal/kullanim-kosullari`, `/yasal/kvkk`) ama metin TODO; büyük marketing footer `/` üzerinde gizli olabilir.

### Renkler

- Navy: `#04111F` / `#07192D`
- Orange: `#FF5A0A` · hover `#EA4B00`
- White: `#FFFFFF`
- Light bg: `#F8FAFC`
- Border: `#E6EAF0` / `#E8EBF0`
- Text: `#101828` / `#0D1B2A`
- Muted: `#667085` / `#475467`

---

## Bilinçli farklar (bug sayma)

1. Partner şeridi gerçek marka logosu değil (yasal).
2. Stats / social proof sayı iddia etmez (ürün kuralı).
3. Telefon HTML mockup; 3D device değil.
4. Ürün görselleri crop/placeholder.
5. Büyük marketing footer `/` üzerinde gizli olabilir.
6. Giriş yapmış kullanıcı `/` görmez.
7. Badge “en güvenilir / en büyük” iddiası yok.

---

## Checklist

Her madde: **OK / FARK / KRİTİK**

Navbar

- [ ] Beyaz arka plan
- [ ] Logo kırpılmamış (turuncu T + navy Talpio)
- [ ] Menü ortada, koyu text
- [ ] Ücretsiz Kayıt Ol turuncu

Hero

- [ ] 42/58 kolon
- [ ] Title 3 satır, “en iyi teklifleri” orange
- [ ] CTA boyutu TARGET’a yakın
- [ ] Hero sinematik ama cyberpunk değil
- [ ] Badge / social proof sahte üye sayısı yok

Phone

- [ ] Dominant obje, ~390–420px
- [ ] Telefonla kartlar OVERLAP
- [ ] Feed içi fiyat / indirim / CTA okunaklı

Cards

- [ ] Request sol-alt overlap
- [ ] Campaign sağ-alt overlap
- [ ] Glass floating reaksiyonlar

Density

- [ ] Sağ kolon boşluk TARGET’tan belirgin fazla mı?
- [ ] Stats strip hemen altında mı?

Premium his

- [ ] “güzel SaaS” mi, “sosyal ticaret ağı” mı?

Metrik kuralı

- [ ] CURRENT’ta 50K+ / 1M+ / 10M+ / 200.000+ yok (varsa KRİTİK regresyon)

---

## Çıktı formatı

### A) Özet (5 cümle)

### B) Kritik farklar (max 8)

Her satır: sorun → neden önemli → nasıl düzelt (ölçek/layout; sahte metrik önerme)

### C) Orta öncelik

### D) Düşük / görmezden gelinebilir

### E) Skor

- Layout fidelity: /10
- Visual density: /10
- Premium quality: /10
- Brand match: /10
- Honesty (no fake metrics): /10

Kod üretme. Sadece denetim raporu yaz.
