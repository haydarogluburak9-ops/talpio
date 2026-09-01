-- Satıcının teklif ettiği ürünün fotoğrafları. Talep tarafı zaten
-- request_attachments kullanıyor; teklifte ayrı tablo gerekir çünkü bir
-- talebe birden fazla teklif gelir ve fotoğraflar teklife aittir.
CREATE TABLE "request_offer_attachments" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_offer_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "request_offer_attachments_offer_id_file_id_key" ON "request_offer_attachments"("offer_id", "file_id");

ALTER TABLE "request_offer_attachments" ADD CONSTRAINT "request_offer_attachments_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "request_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "request_offer_attachments" ADD CONSTRAINT "request_offer_attachments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
