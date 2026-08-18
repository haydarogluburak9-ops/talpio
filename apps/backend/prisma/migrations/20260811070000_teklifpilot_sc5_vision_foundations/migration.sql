-- CreateEnum
CREATE TYPE "work_order_source" AS ENUM ('USTAPILOT', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'RETURNING', 'REFERRAL', 'GOOGLE', 'WEBSITE', 'SAHIBINDEN', 'OTHER');

-- CreateEnum
CREATE TYPE "work_order_stage" AS ENUM ('NEW', 'SURVEY', 'QUOTE', 'NEGOTIATION', 'APPROVED', 'MATERIALS', 'APPOINTMENT', 'IN_PROGRESS', 'DONE', 'INVOICED', 'COLLECTED', 'REVIEWED', 'REFERRED', 'REPEAT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "channel_relation_type" AS ENUM ('MANUFACTURER_DISTRIBUTOR', 'DISTRIBUTOR_DEALER', 'SUPPLIER_BUYER');

-- CreateEnum
CREATE TYPE "channel_relation_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "crm_customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "source" "work_order_source" NOT NULL DEFAULT 'USTAPILOT',
    "stage" "work_order_stage" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "marketplace_order_id" TEXT,
    "currency" CHAR(3) NOT NULL DEFAULT 'TRY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_relations" (
    "id" TEXT NOT NULL,
    "from_business_id" TEXT NOT NULL,
    "to_business_id" TEXT NOT NULL,
    "type" "channel_relation_type" NOT NULL,
    "status" "channel_relation_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_campaigns" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "b2b_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_locale_settings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "default_currency" CHAR(3) NOT NULL DEFAULT 'TRY',
    "default_country_code" CHAR(2) NOT NULL DEFAULT 'TR',
    "default_timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "tax_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_locale_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_follows" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_customers_tenant_id_deleted_at_idx" ON "crm_customers"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "crm_customers_tenant_id_user_id_idx" ON "crm_customers"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_marketplace_order_id_key" ON "work_orders"("marketplace_order_id");

-- CreateIndex
CREATE INDEX "work_orders_tenant_id_stage_created_at_idx" ON "work_orders"("tenant_id", "stage", "created_at");

-- CreateIndex
CREATE INDEX "work_orders_customer_id_idx" ON "work_orders"("customer_id");

-- CreateIndex
CREATE INDEX "channel_relations_to_business_id_status_idx" ON "channel_relations"("to_business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "channel_relations_from_business_id_to_business_id_type_key" ON "channel_relations"("from_business_id", "to_business_id", "type");

-- CreateIndex
CREATE INDEX "b2b_campaigns_business_id_is_active_created_at_idx" ON "b2b_campaigns"("business_id", "is_active", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "business_locale_settings_business_id_key" ON "business_locale_settings"("business_id");

-- CreateIndex
CREATE INDEX "category_follows_category_id_created_at_idx" ON "category_follows"("category_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "category_follows_profile_id_category_id_key" ON "category_follows"("profile_id", "category_id");

-- CreateIndex
CREATE INDEX "deal_metadata_category_id_idx" ON "deal_metadata"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_work_order_links_work_order_id_key" ON "marketplace_work_order_links"("work_order_id");

-- AddForeignKey
ALTER TABLE "marketplace_work_order_links" ADD CONSTRAINT "marketplace_work_order_links_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "crm_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_relations" ADD CONSTRAINT "channel_relations_from_business_id_fkey" FOREIGN KEY ("from_business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_relations" ADD CONSTRAINT "channel_relations_to_business_id_fkey" FOREIGN KEY ("to_business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_campaigns" ADD CONSTRAINT "b2b_campaigns_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_locale_settings" ADD CONSTRAINT "business_locale_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_follows" ADD CONSTRAINT "category_follows_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_follows" ADD CONSTRAINT "category_follows_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_metadata" ADD CONSTRAINT "deal_metadata_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
