-- AlterTable
ALTER TABLE "users" ADD COLUMN "marketing_consent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "title" TEXT;
ALTER TABLE "conversations" ADD COLUMN "is_group" BOOLEAN NOT NULL DEFAULT false;
