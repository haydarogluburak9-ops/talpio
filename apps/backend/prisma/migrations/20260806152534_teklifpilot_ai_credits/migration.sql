-- CreateEnum
CREATE TYPE "subscription_plan_code" AS ENUM ('FREE', 'PREMIUM', 'PREMIUM_PLUS', 'BUSINESS');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');

-- CreateEnum
CREATE TYPE "subscription_provider" AS ENUM ('INTERNAL', 'STRIPE', 'APP_STORE', 'PLAY');

-- CreateEnum
CREATE TYPE "ai_credit_tx_type" AS ENUM ('GRANT', 'DEBIT', 'REFUND', 'ADJUST');

-- CreateEnum
CREATE TYPE "ai_feature_code" AS ENUM ('AGENT_CHAT', 'REQUEST_DRAFT', 'OFFER_DRAFT', 'IMAGE_ANALYSIS', 'AUDIO_TRANSCRIBE', 'DOC_ANALYSIS', 'GENERIC_COMPLETE');

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "code" "subscription_plan_code" NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_credits" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "feature_code" "ai_feature_code" NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "business_id" TEXT,
    "plan_id" TEXT NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'ACTIVE',
    "provider" "subscription_provider" NOT NULL DEFAULT 'INTERNAL',
    "external_id" TEXT,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credit_wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "business_id" TEXT,
    "balance_credits" INTEGER NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "lifetime_granted" INTEGER NOT NULL DEFAULT 0,
    "lifetime_spent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_credit_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credit_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "ai_credit_tx_type" NOT NULL,
    "amount_credits" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "feature_code" "ai_feature_code",
    "idempotency_key" TEXT NOT NULL,
    "usage_record_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_features" (
    "id" TEXT NOT NULL,
    "code" "ai_feature_code" NOT NULL,
    "name" TEXT NOT NULL,
    "base_cost_credits" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "business_id" TEXT,
    "tenant_id" TEXT,
    "feature_code" "ai_feature_code" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "credits_charged" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_code" TEXT,
    "idempotency_key" TEXT,
    "request_id" TEXT,
    "offer_id" TEXT,
    "work_order_id" TEXT,
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_quota_policies" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "monthly_credits" INTEGER NOT NULL,
    "priority_queue" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_quota_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "plan_features_feature_code_idx" ON "plan_features"("feature_code");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_id_feature_code_key" ON "plan_features"("plan_id", "feature_code");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_business_id_idx" ON "subscriptions"("business_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_status_idx" ON "subscriptions"("plan_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_credit_wallets_user_id_key" ON "ai_credit_wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_credit_wallets_business_id_key" ON "ai_credit_wallets"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_credit_transactions_idempotency_key_key" ON "ai_credit_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "ai_credit_transactions_wallet_id_created_at_idx" ON "ai_credit_transactions"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_credit_transactions_usage_record_id_idx" ON "ai_credit_transactions"("usage_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_features_code_key" ON "ai_features"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_records_idempotency_key_key" ON "ai_usage_records"("idempotency_key");

-- CreateIndex
CREATE INDEX "ai_usage_records_user_id_created_at_idx" ON "ai_usage_records"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_records_business_id_created_at_idx" ON "ai_usage_records"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_records_feature_code_created_at_idx" ON "ai_usage_records"("feature_code", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_quota_policies_plan_id_key" ON "ai_quota_policies"("plan_id");

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_credit_wallets" ADD CONSTRAINT "ai_credit_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_credit_wallets" ADD CONSTRAINT "ai_credit_wallets_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_credit_transactions" ADD CONSTRAINT "ai_credit_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "ai_credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_credit_transactions" ADD CONSTRAINT "ai_credit_transactions_usage_record_id_fkey" FOREIGN KEY ("usage_record_id") REFERENCES "ai_usage_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_records" ADD CONSTRAINT "ai_usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_records" ADD CONSTRAINT "ai_usage_records_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_quota_policies" ADD CONSTRAINT "ai_quota_policies_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
