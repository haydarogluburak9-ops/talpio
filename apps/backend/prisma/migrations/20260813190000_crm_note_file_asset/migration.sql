-- AlterTable
ALTER TABLE "crm_customer_notes" ADD COLUMN "file_asset_id" TEXT;

-- CreateIndex
CREATE INDEX "crm_customer_notes_file_asset_id_idx" ON "crm_customer_notes"("file_asset_id");

-- AddForeignKey
ALTER TABLE "crm_customer_notes" ADD CONSTRAINT "crm_customer_notes_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
