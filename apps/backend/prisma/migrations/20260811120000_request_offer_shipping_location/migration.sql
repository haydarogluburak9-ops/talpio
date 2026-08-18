-- Satıcı teklifinde kargo dahil mi ve lokasyon bilgisi
ALTER TABLE "request_offers"
ADD COLUMN "shipping_included" BOOLEAN,
ADD COLUMN "location_text" TEXT;
