# Faz 8–50 teslim özeti

Çalışan marketplace / sosyal omurga bozulmadan ERP, güven skoru, kampanya,
AI taslak, faturalama admin bağları ve üretim iskeletleri eklendi.

## 8 Trust score

`computeTrustScore` (`packages/business-logic`) — premium girdisi yok.
`BusinessTrustScore` persist; mağaza kartı ve satıcı paneli gösterir.

## 9–12 CRM / WorkOrder / Task / Dashboard v2

CRM kaynak, not, takip, LTV alanları. WorkOrder aşama alias’ları eklendi
(eski SURVEY/QUOTE/DONE duruyor). Görev ve kanban listesi. Dashboard
deterministik sayılar; LLM hesaplamaz.

## 13–16 Analitik / kampanya / deal / fiyat geçmişi

Post dönüşüm sayaçları. `B2bCampaign` audience/status/performans.
Deal `discountPercent` kuruştan hesaplanır. `PriceHistory` deal yazımında.

## 17–22 AI

Mock production’da yasak. Talep / teklif / sosyal taslak + satış koçu.
Agent tool allowlist genişledi; yazma tool onay ister.

## 23–27 Billing / push / e-posta / ödeme

Admin abonelik ve AI kullanım gerçek tablolardan. FCM/SMTP/iyzico adaptör
iskeleti. Cihaz jetonu revoke. Webhook event idempotency.

## 28–37 Parite / moderasyon / dil / Flutter / docs

Satıcı paneli CRM+WO+görev. Admin “Satıcılar”. Flutter arşiv + CI çıkarıldı.
`@talpio` rename uygulandı: `docs/22-package-rename-plan.md`.

## 38–50 i18n / yasal / audit

Yasal sayfalar TODO. Landing sahte metrik yok. `/health/metrics`.
Hesap silme (web+mobil). Fraud hacim bayrağı (ban yok).
E2E: duman scriptleri. Nihai puan: `docs/25-final-audit.md`.
i18n rapor: `docs/26-i18n-coverage.md`. Store yer tutucu: `apps/mobile/store-listing.json`.
