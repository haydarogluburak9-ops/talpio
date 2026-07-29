-- UstaPilot: veritabanı ilk kurulumunda çalışan eklentiler.
-- Prisma migration'ları bu eklentilerin varlığını varsayar.

-- Benzerlik tabanlı metin araması (usta adı, iş başlığı, kategori arama)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Aksan ve büyük/küçük harf duyarsız arama (Türkçe karakterler için)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Sorgu performans izleme (yavaş sorgu tespiti)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
