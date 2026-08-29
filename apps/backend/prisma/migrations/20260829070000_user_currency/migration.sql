-- Kullanici basina para birimi ve ulke tercihi.
--
-- Ikisi de NULL kabul eder: mevcut hesaplarda bu bilgi yok ve varsayilan bir
-- deger yazmak, kullanicinin hic secmedigi bir para biriminde fiyat gormesine
-- yol acardi. Bos birakildiginda ulke > dil > USD sirasiyla turetilir.
ALTER TABLE "users" ADD COLUMN "currency" CHAR(3);
ALTER TABLE "users" ADD COLUMN "country_code" CHAR(2);
