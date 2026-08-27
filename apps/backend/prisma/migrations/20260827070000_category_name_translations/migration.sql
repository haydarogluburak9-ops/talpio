-- Kategori ve alt kategori adlarının çok dilli sözlüğü. Mevcut `name` sütunu
-- Türkçe ad ve yedek olarak yerinde kalır; bu sütun boşsa `name` kullanılır.
ALTER TABLE "service_categories" ADD COLUMN "name_translations" JSONB;
ALTER TABLE "service_subcategories" ADD COLUMN "name_translations" JSONB;
