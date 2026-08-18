-- CreateEnum
CREATE TYPE "outbox_status" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "agent_message_role" AS ENUM ('USER', 'ASSISTANT', 'TOOL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "agent_action_status" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED');

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "outbox_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_threads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agent_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "role" "agent_message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tool_invocations" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "result_summary" TEXT,
    "success" BOOLEAN NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "approval_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_tool_invocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_action_proposals" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "status" "agent_action_status" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_action_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "due_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompt_versions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_micros" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_work_order_links" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "marketplace_order_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "bridge_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_work_order_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotency_key_key" ON "outbox_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "outbox_events_status_created_at_idx" ON "outbox_events"("status", "created_at");

-- CreateIndex
CREATE INDEX "outbox_events_tenant_id_type_idx" ON "outbox_events"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "agent_threads_tenant_id_updated_at_idx" ON "agent_threads"("tenant_id", "updated_at");

-- CreateIndex
CREATE INDEX "agent_threads_user_id_idx" ON "agent_threads"("user_id");

-- CreateIndex
CREATE INDEX "agent_messages_thread_id_created_at_idx" ON "agent_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_tool_invocations_tenant_id_created_at_idx" ON "agent_tool_invocations"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_tool_invocations_tool_name_created_at_idx" ON "agent_tool_invocations"("tool_name", "created_at");

-- CreateIndex
CREATE INDEX "agent_action_proposals_tenant_id_status_idx" ON "agent_action_proposals"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "agent_action_proposals_thread_id_status_idx" ON "agent_action_proposals"("thread_id", "status");

-- CreateIndex
CREATE INDEX "reminders_tenant_id_due_at_idx" ON "reminders"("tenant_id", "due_at");

-- CreateIndex
CREATE INDEX "reminders_user_id_due_at_idx" ON "reminders"("user_id", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_prompt_versions_key_version_key" ON "ai_prompt_versions"("key", "version");

-- CreateIndex
CREATE INDEX "ai_usage_events_provider_created_at_idx" ON "ai_usage_events"("provider", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_events_tenant_id_created_at_idx" ON "ai_usage_events"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_work_order_links_marketplace_order_id_key" ON "marketplace_work_order_links"("marketplace_order_id");

-- CreateIndex
CREATE INDEX "marketplace_work_order_links_tenant_id_bridge_status_idx" ON "marketplace_work_order_links"("tenant_id", "bridge_status");

-- AddForeignKey
ALTER TABLE "agent_threads" ADD CONSTRAINT "agent_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "agent_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tool_invocations" ADD CONSTRAINT "agent_tool_invocations_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "agent_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_action_proposals" ADD CONSTRAINT "agent_action_proposals_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "agent_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_work_order_links" ADD CONSTRAINT "marketplace_work_order_links_marketplace_order_id_fkey" FOREIGN KEY ("marketplace_order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
