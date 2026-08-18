-- AlterEnum
ALTER TYPE "post_type" ADD VALUE 'VIDEO';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "original_price_minor" INTEGER,
ADD COLUMN     "promo_currency" CHAR(3),
ADD COLUMN     "promo_label" TEXT,
ADD COLUMN     "promo_price_minor" INTEGER,
ADD COLUMN     "promo_valid_until" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "posts_type_created_at_idx" ON "posts"("type", "created_at");
