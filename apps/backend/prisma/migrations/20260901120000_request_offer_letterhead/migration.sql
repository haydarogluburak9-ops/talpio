-- Resmi teklif formu: marka / model ve antet kopyası.
ALTER TABLE "request_offers" ADD COLUMN "brand" TEXT;
ALTER TABLE "request_offers" ADD COLUMN "model" TEXT;
ALTER TABLE "request_offers" ADD COLUMN "letterhead" JSONB NOT NULL DEFAULT '{}';
