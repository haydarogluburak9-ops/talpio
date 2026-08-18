-- AlterEnum PostType (SC3 commerce post kinds)
ALTER TYPE "post_type" ADD VALUE 'STANDARD';
ALTER TYPE "post_type" ADD VALUE 'DEAL';
ALTER TYPE "post_type" ADD VALUE 'SPECIAL_PRICE';
ALTER TYPE "post_type" ADD VALUE 'DISCOUNT';
ALTER TYPE "post_type" ADD VALUE 'BULK_PRICE';
ALTER TYPE "post_type" ADD VALUE 'LIMITED_STOCK';
ALTER TYPE "post_type" ADD VALUE 'CLEARANCE';
ALTER TYPE "post_type" ADD VALUE 'SERVICE_PROMOTION';
ALTER TYPE "post_type" ADD VALUE 'B2B_CAMPAIGN';
ALTER TYPE "post_type" ADD VALUE 'NEW_PRODUCT';
ALTER TYPE "post_type" ADD VALUE 'BUSINESS_UPDATE';

-- AlterEnum PostVisibility (SC7 targeting prep; home feed still PUBLIC+FOLLOWERS)
ALTER TYPE "post_visibility" ADD VALUE 'BUSINESS_ONLY';
ALTER TYPE "post_visibility" ADD VALUE 'CATEGORY_TARGETED';
ALTER TYPE "post_visibility" ADD VALUE 'B2B_TARGETED';
ALTER TYPE "post_visibility" ADD VALUE 'PRIVATE';

-- CreateTable
CREATE TABLE "deal_metadata" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "product_name" TEXT,
    "title" TEXT,
    "list_price_minor" INTEGER,
    "deal_price_minor" INTEGER,
    "discount_percent" INTEGER,
    "currency" CHAR(3) NOT NULL DEFAULT 'TRY',
    "unit" TEXT,
    "min_quantity" TEXT,
    "stock_quantity" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "vat_included" BOOLEAN,
    "shipping_included" BOOLEAN,
    "location_text" TEXT,
    "category_id" TEXT,
    "subcategory_id" TEXT,
    "brand" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deal_metadata_post_id_key" ON "deal_metadata"("post_id");

-- AddForeignKey
ALTER TABLE "deal_metadata" ADD CONSTRAINT "deal_metadata_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
