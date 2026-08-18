-- Faz 8–16 + 25/31/32: güven skoru, CRM/WO/görev, kampanya, fiyat geçmişi, moderasyon, jeton

ALTER TYPE "work_order_stage" ADD VALUE IF NOT EXISTS 'DISCOVERY';
ALTER TYPE "work_order_stage" ADD VALUE IF NOT EXISTS 'QUOTATION';
ALTER TYPE "work_order_stage" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "work_order_stage" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "work_order_stage" ADD VALUE IF NOT EXISTS 'PAID';

ALTER TYPE "content_report_status" ADD VALUE IF NOT EXISTS 'APPEALED';

ALTER TYPE "ai_feature_code" ADD VALUE IF NOT EXISTS 'SOCIAL_DRAFT';
ALTER TYPE "ai_feature_code" ADD VALUE IF NOT EXISTS 'SALES_COACH';

CREATE TYPE "crm_customer_source" AS ENUM (
  'TALPIO', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK',
  'GOOGLE', 'WEBSITE', 'REFERRAL', 'EXISTING_CUSTOMER', 'OTHER'
);

CREATE TYPE "business_task_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "business_task_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "campaign_audience" AS ENUM (
  'PUBLIC', 'FOLLOWERS', 'CATEGORY_TARGETED', 'BUSINESS_ONLY', 'B2B_TARGETED'
);
CREATE TYPE "campaign_status" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');
CREATE TYPE "fraud_flag_status" AS ENUM ('OPEN', 'REVIEWING', 'DISMISSED', 'CONFIRMED');
CREATE TYPE "fraud_flag_reason" AS ENUM (
  'MANY_REQUESTS', 'MANY_OFFERS', 'FAKE_ENGAGEMENT', 'REVIEW_FARMING',
  'MULTI_ACCOUNT', 'SPAM_MESSAGES', 'OTHER'
);

ALTER TABLE "device_tokens" ADD COLUMN "revoked_at" TIMESTAMP(3);
DROP INDEX IF EXISTS "device_tokens_user_id_idx";
CREATE INDEX "device_tokens_user_id_revoked_at_idx" ON "device_tokens"("user_id", "revoked_at");

ALTER TABLE "crm_customers"
  ADD COLUMN "source" "crm_customer_source" NOT NULL DEFAULT 'TALPIO',
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "last_contact_at" TIMESTAMP(3),
  ADD COLUMN "next_action" TEXT,
  ADD COLUMN "lifetime_value_minor" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "crm_customers_tenant_id_source_idx" ON "crm_customers"("tenant_id", "source");

CREATE TABLE "crm_customer_notes" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crm_customer_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "crm_customer_notes_customer_id_created_at_idx" ON "crm_customer_notes"("customer_id", "created_at");
ALTER TABLE "crm_customer_notes"
  ADD CONSTRAINT "crm_customer_notes_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "crm_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "crm_follow_ups" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "due_at" TIMESTAMP(3) NOT NULL,
  "body" TEXT NOT NULL,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crm_follow_ups_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "crm_follow_ups_customer_id_due_at_idx" ON "crm_follow_ups"("customer_id", "due_at");
ALTER TABLE "crm_follow_ups"
  ADD CONSTRAINT "crm_follow_ups_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "crm_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "work_orders"
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "scheduled_at" TIMESTAMP(3),
  ADD COLUMN "assigned_user_id" TEXT;
CREATE INDEX "work_orders_assigned_user_id_idx" ON "work_orders"("assigned_user_id");

CREATE TABLE "work_order_assignments" (
  "id" TEXT NOT NULL,
  "work_order_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_order_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "work_order_assignments_work_order_id_user_id_key"
  ON "work_order_assignments"("work_order_id", "user_id");
CREATE INDEX "work_order_assignments_user_id_idx" ON "work_order_assignments"("user_id");
ALTER TABLE "work_order_assignments"
  ADD CONSTRAINT "work_order_assignments_work_order_id_fkey"
  FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_order_assignments"
  ADD CONSTRAINT "work_order_assignments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "business_tasks" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "work_order_id" TEXT,
  "assignee_user_id" TEXT,
  "title" TEXT NOT NULL,
  "status" "business_task_status" NOT NULL DEFAULT 'OPEN',
  "priority" "business_task_priority" NOT NULL DEFAULT 'MEDIUM',
  "due_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "business_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "business_tasks_tenant_id_status_due_at_idx"
  ON "business_tasks"("tenant_id", "status", "due_at");
CREATE INDEX "business_tasks_assignee_user_id_idx" ON "business_tasks"("assignee_user_id");
ALTER TABLE "business_tasks"
  ADD CONSTRAINT "business_tasks_work_order_id_fkey"
  FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "business_tasks"
  ADD CONSTRAINT "business_tasks_assignee_user_id_fkey"
  FOREIGN KEY ("assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "b2b_campaigns"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "category_id" TEXT,
  ADD COLUMN "audience" "campaign_audience" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "status" "campaign_status" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "impression_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "click_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "conversion_count" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "b2b_campaigns_status_starts_at_idx" ON "b2b_campaigns"("status", "starts_at");

CREATE TABLE "campaign_posts" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaign_posts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "campaign_posts_campaign_id_post_id_key" ON "campaign_posts"("campaign_id", "post_id");
CREATE INDEX "campaign_posts_post_id_idx" ON "campaign_posts"("post_id");
ALTER TABLE "campaign_posts"
  ADD CONSTRAINT "campaign_posts_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "b2b_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_posts"
  ADD CONSTRAINT "campaign_posts_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "business_trust_scores" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "breakdown" JSONB NOT NULL,
  "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "business_trust_scores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_trust_scores_business_id_key" ON "business_trust_scores"("business_id");
CREATE INDEX "business_trust_scores_score_idx" ON "business_trust_scores"("score");
ALTER TABLE "business_trust_scores"
  ADD CONSTRAINT "business_trust_scores_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts"
  ADD COLUMN "quote_request_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "message_start_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "request_conversion_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "offer_conversion_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "deal_metadata"
  ADD COLUMN "max_quantity" TEXT,
  ADD COLUMN "delivery_regions" JSONB;

CREATE TABLE "price_history" (
  "id" TEXT NOT NULL,
  "deal_metadata_id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "business_id" TEXT,
  "list_price_minor" INTEGER,
  "deal_price_minor" INTEGER,
  "currency" CHAR(3) NOT NULL DEFAULT 'TRY',
  "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "price_history_post_id_recorded_at_idx" ON "price_history"("post_id", "recorded_at");
CREATE INDEX "price_history_business_id_recorded_at_idx" ON "price_history"("business_id", "recorded_at");
ALTER TABLE "price_history"
  ADD CONSTRAINT "price_history_deal_metadata_id_fkey"
  FOREIGN KEY ("deal_metadata_id") REFERENCES "deal_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content_reports"
  ADD COLUMN "action_note" TEXT,
  ADD COLUMN "reviewed_at" TIMESTAMP(3);

CREATE TABLE "fraud_flags" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "subject_type" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "reason" "fraud_flag_reason" NOT NULL,
  "status" "fraud_flag_status" NOT NULL DEFAULT 'OPEN',
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fraud_flags_status_created_at_idx" ON "fraud_flags"("status", "created_at");
CREATE INDEX "fraud_flags_subject_type_subject_id_idx" ON "fraud_flags"("subject_type", "subject_id");
CREATE INDEX "fraud_flags_user_id_idx" ON "fraud_flags"("user_id");
ALTER TABLE "fraud_flags"
  ADD CONSTRAINT "fraud_flags_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "payment_webhook_events" (
  "id" TEXT NOT NULL,
  "provider_name" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "payload_hash" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_webhook_events_provider_name_event_id_key"
  ON "payment_webhook_events"("provider_name", "event_id");
CREATE INDEX "payment_webhook_events_processed_at_idx" ON "payment_webhook_events"("processed_at");
