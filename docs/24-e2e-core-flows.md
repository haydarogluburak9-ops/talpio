# E2E çekirdek akışlar (Faz 46)

Playwright henüz yok. Çekirdek akışlar mevcut duman scriptleriyle doğrulanır:

```bash
npm run smoke:auth
npm run smoke:jobs
npm run smoke:offers
npm run smoke:orders
npm run smoke:payments
```

Sahte üretim metriği kullanılmaz.

## E2E 1 — Talep / teklif / sipariş

1. Alıcı kayıt
2. Tedarik talebi oluştur
3. Eşleşme + bildirim (worker açık)
4. Satıcı teklif
5. Karşılaştırma rozetleri (EN İYİ TEKLİF yok)
6. Kabul → sipariş

## E2E 2 — Sosyal ticaret

1. İşletme kayıt
2. Fırsat gönderisi (DealMetadata)
3. Akışta yayın
4. Takip / kaydet
5. Teklif iste (`/tedarik?magaza=`)

## E2E 3 — CRM

1. Dış kaynaklı CRM müşteri
2. WorkOrder
3. Görev
4. Aşama güncelleme

## E2E 4 — Premium AI

1. AI talep taslağı
2. Kredi düşümü
3. Taslak onay öncesi yayınlanmaz
4. Kullanıcı onayı
