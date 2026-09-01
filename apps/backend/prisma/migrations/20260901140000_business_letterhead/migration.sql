-- Firma cari / antet: logo, kaşe ve fatura bilgileri profilde saklanır;
-- teklif anında kopyalanır, sonradan değişen cari PDF'i bozmaz.
ALTER TABLE "business_locale_settings" ADD COLUMN "legal_name" TEXT;
ALTER TABLE "business_locale_settings" ADD COLUMN "invoice_title" TEXT;
ALTER TABLE "business_locale_settings" ADD COLUMN "tax_office" TEXT;
ALTER TABLE "business_locale_settings" ADD COLUMN "address" TEXT;
ALTER TABLE "business_locale_settings" ADD COLUMN "phone" TEXT;
ALTER TABLE "business_locale_settings" ADD COLUMN "logo_url" TEXT;
ALTER TABLE "business_locale_settings" ADD COLUMN "stamp_url" TEXT;
