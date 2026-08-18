-- FileAsset: işlenmiş medya türevleri (küçük resim, boyut meta)
ALTER TABLE "file_assets" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
