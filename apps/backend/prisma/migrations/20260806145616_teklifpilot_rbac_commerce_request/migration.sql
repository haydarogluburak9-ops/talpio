-- CreateEnum
CREATE TYPE "business_membership_status" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "request_type" AS ENUM ('SERVICE', 'PRODUCT_SUPPLY', 'MANUFACTURING', 'RENTAL', 'LOGISTICS', 'PROFESSIONAL_SERVICE', 'CONSTRUCTION', 'WHOLESALE', 'B2B_PURCHASE', 'OTHER');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('DRAFT', 'PUBLISHED', 'MATCHING', 'QUOTING', 'SELECTED', 'FULFILLING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "request_visibility" AS ENUM ('PUBLIC_MATCHED', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "request_source" AS ENUM ('WEB', 'MOBILE', 'API', 'IMPORT', 'AGENT');

-- CreateEnum
CREATE TYPE "request_offer_status" AS ENUM ('SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "order_source" AS ENUM ('MARKETPLACE', 'COMMERCE_REQUEST');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notification_type" ADD VALUE 'REQUEST_MATCHED';
ALTER TYPE "notification_type" ADD VALUE 'REQUEST_OFFER_RECEIVED';
ALTER TYPE "notification_type" ADD VALUE 'REQUEST_OFFER_ACCEPTED';

-- AlterTable
ALTER TABLE "job_requests" ADD COLUMN     "commerce_request_id" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "source" "order_source" NOT NULL DEFAULT 'MARKETPLACE',
ALTER COLUMN "job_request_id" DROP NOT NULL,
ALTER COLUMN "offer_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "platform_roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "owner_user_id" TEXT NOT NULL,
    "verification_status" "verification_status" NOT NULL DEFAULT 'UNVERIFIED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "min_order_quantity" DECIMAL(18,4),
    "provider_profile_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_memberships" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "business_membership_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_role_assignments" (
    "id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_categories" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_service_areas" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "district_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_schemas" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "schema" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_requests" (
    "id" TEXT NOT NULL,
    "request_type" "request_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" TEXT,
    "subcategory_id" TEXT,
    "quantity" DECIMAL(18,4),
    "unit" TEXT,
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "budget_minor" INTEGER,
    "currency" CHAR(3) NOT NULL DEFAULT 'TRY',
    "delivery_city_id" TEXT,
    "delivery_district_id" TEXT,
    "delivery_address_text" TEXT,
    "delivery_deadline" TIMESTAMP(3),
    "visibility" "request_visibility" NOT NULL DEFAULT 'PUBLIC_MATCHED',
    "buyer_user_id" TEXT NOT NULL,
    "business_id" TEXT,
    "status" "request_status" NOT NULL DEFAULT 'DRAFT',
    "source" "request_source" NOT NULL DEFAULT 'WEB',
    "ai_classification" JSONB,
    "ai_confidence" DECIMAL(5,4),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "commerce_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_attachments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'other',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_matches" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "reasons" JSONB NOT NULL DEFAULT '{}',
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_offers" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "status" "request_offer_status" NOT NULL DEFAULT 'SUBMITTED',
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'TRY',
    "delivery_days" INTEGER,
    "note" TEXT,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_order_links" (
    "id" TEXT NOT NULL,
    "request_offer_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_order_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_roles_code_key" ON "platform_roles"("code");

-- CreateIndex
CREATE INDEX "role_permissions_permission_code_idx" ON "role_permissions"("permission_code");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_code_key" ON "role_permissions"("role_id", "permission_code");

-- CreateIndex
CREATE INDEX "user_role_assignments_role_id_idx" ON "user_role_assignments"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_user_id_role_id_key" ON "user_role_assignments"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_owner_user_id_idx" ON "businesses"("owner_user_id");

-- CreateIndex
CREATE INDEX "businesses_provider_profile_id_idx" ON "businesses"("provider_profile_id");

-- CreateIndex
CREATE INDEX "businesses_is_active_verification_status_idx" ON "businesses"("is_active", "verification_status");

-- CreateIndex
CREATE INDEX "business_memberships_user_id_status_idx" ON "business_memberships"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "business_memberships_business_id_user_id_key" ON "business_memberships"("business_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_role_assignments_membership_id_role_id_key" ON "business_role_assignments"("membership_id", "role_id");

-- CreateIndex
CREATE INDEX "business_categories_category_id_idx" ON "business_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_categories_business_id_category_id_key" ON "business_categories"("business_id", "category_id");

-- CreateIndex
CREATE INDEX "business_service_areas_city_id_district_id_idx" ON "business_service_areas"("city_id", "district_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_service_areas_business_id_city_id_district_id_key" ON "business_service_areas"("business_id", "city_id", "district_id");

-- CreateIndex
CREATE INDEX "attribute_schemas_category_id_is_active_idx" ON "attribute_schemas"("category_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_schemas_category_id_version_key" ON "attribute_schemas"("category_id", "version");

-- CreateIndex
CREATE INDEX "commerce_requests_buyer_user_id_status_idx" ON "commerce_requests"("buyer_user_id", "status");

-- CreateIndex
CREATE INDEX "commerce_requests_category_id_status_idx" ON "commerce_requests"("category_id", "status");

-- CreateIndex
CREATE INDEX "commerce_requests_delivery_city_id_status_idx" ON "commerce_requests"("delivery_city_id", "status");

-- CreateIndex
CREATE INDEX "commerce_requests_deleted_at_idx" ON "commerce_requests"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "request_attachments_request_id_file_id_key" ON "request_attachments"("request_id", "file_id");

-- CreateIndex
CREATE INDEX "request_matches_business_id_idx" ON "request_matches"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_matches_request_id_business_id_key" ON "request_matches"("request_id", "business_id");

-- CreateIndex
CREATE INDEX "request_offers_business_id_status_idx" ON "request_offers"("business_id", "status");

-- CreateIndex
CREATE INDEX "request_offers_status_valid_until_idx" ON "request_offers"("status", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "request_offers_request_id_business_id_key" ON "request_offers"("request_id", "business_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_order_links_request_offer_id_key" ON "request_order_links"("request_offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_order_links_order_id_key" ON "request_order_links"("order_id");

-- CreateIndex
CREATE INDEX "job_requests_commerce_request_id_idx" ON "job_requests"("commerce_request_id");

-- CreateIndex
CREATE INDEX "orders_source_status_idx" ON "orders"("source", "status");

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_commerce_request_id_fkey" FOREIGN KEY ("commerce_request_id") REFERENCES "commerce_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_role_assignments" ADD CONSTRAINT "business_role_assignments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "business_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_role_assignments" ADD CONSTRAINT "business_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_service_areas" ADD CONSTRAINT "business_service_areas_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_service_areas" ADD CONSTRAINT "business_service_areas_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_service_areas" ADD CONSTRAINT "business_service_areas_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_schemas" ADD CONSTRAINT "attribute_schemas_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_requests" ADD CONSTRAINT "commerce_requests_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_requests" ADD CONSTRAINT "commerce_requests_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_requests" ADD CONSTRAINT "commerce_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_requests" ADD CONSTRAINT "commerce_requests_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "service_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_requests" ADD CONSTRAINT "commerce_requests_delivery_city_id_fkey" FOREIGN KEY ("delivery_city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_requests" ADD CONSTRAINT "commerce_requests_delivery_district_id_fkey" FOREIGN KEY ("delivery_district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "commerce_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_matches" ADD CONSTRAINT "request_matches_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "commerce_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_matches" ADD CONSTRAINT "request_matches_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_offers" ADD CONSTRAINT "request_offers_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "commerce_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_offers" ADD CONSTRAINT "request_offers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_offers" ADD CONSTRAINT "request_offers_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_order_links" ADD CONSTRAINT "request_order_links_request_offer_id_fkey" FOREIGN KEY ("request_offer_id") REFERENCES "request_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_order_links" ADD CONSTRAINT "request_order_links_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
