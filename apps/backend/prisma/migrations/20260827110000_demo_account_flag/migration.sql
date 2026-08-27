-- Tohumlanmış vitrin hesapları. Akışta görünmeye devam ederler ama talep
-- eşleştirmesinden ve kullanıcı sayımlarından dışlanırlar; gerçek bir alıcı
-- sahte bir satıcıyla eşleşip cevapsız kalmasın.
ALTER TABLE "users" ADD COLUMN "is_demo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "businesses" ADD COLUMN "is_demo" BOOLEAN NOT NULL DEFAULT false;
