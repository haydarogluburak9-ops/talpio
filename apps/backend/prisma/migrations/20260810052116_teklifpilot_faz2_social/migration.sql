-- CreateEnum
CREATE TYPE "social_profile_kind" AS ENUM ('PERSONAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "post_type" AS ENUM ('TEXT', 'IMAGE', 'MULTI_IMAGE', 'PRODUCT', 'SERVICE', 'COMPLETED_WORK', 'BEFORE_AFTER', 'CAMPAIGN', 'REQUEST_SHARE', 'REFERENCE', 'QUESTION', 'POLL');

-- CreateEnum
CREATE TYPE "post_visibility" AS ENUM ('PUBLIC', 'FOLLOWERS');

-- CreateEnum
CREATE TYPE "feed_item_kind" AS ENUM ('POST', 'COMMERCE_REQUEST');

-- CreateEnum
CREATE TYPE "content_report_status" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "content_report_target" AS ENUM ('POST', 'COMMENT', 'PROFILE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notification_type" ADD VALUE 'SOCIAL_FOLLOW';
ALTER TYPE "notification_type" ADD VALUE 'SOCIAL_LIKE';
ALTER TYPE "notification_type" ADD VALUE 'SOCIAL_COMMENT';

-- CreateTable
CREATE TABLE "social_profiles" (
    "id" TEXT NOT NULL,
    "kind" "social_profile_kind" NOT NULL,
    "user_id" TEXT,
    "business_id" TEXT,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_file_id" TEXT,
    "cover_file_id" TEXT,
    "location_city_id" TEXT,
    "location_text" TEXT,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "following_count" INTEGER NOT NULL DEFAULT 0,
    "post_count" INTEGER NOT NULL DEFAULT 0,
    "is_verified_display" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "social_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "follower_profile_id" TEXT NOT NULL,
    "following_profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "author_profile_id" TEXT NOT NULL,
    "type" "post_type" NOT NULL DEFAULT 'TEXT',
    "body" TEXT,
    "visibility" "post_visibility" NOT NULL DEFAULT 'PUBLIC',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "save_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "commerce_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_media" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "alt_text" TEXT,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_profile_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "body" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_posts" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_items" (
    "id" TEXT NOT NULL,
    "kind" "feed_item_kind" NOT NULL,
    "post_id" TEXT,
    "commerce_request_id" TEXT,
    "author_profile_id" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "target_type" "content_report_target" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "content_report_status" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blocker_user_id" TEXT NOT NULL,
    "blocked_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_profiles_user_id_key" ON "social_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_profiles_business_id_key" ON "social_profiles"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_profiles_username_key" ON "social_profiles"("username");

-- CreateIndex
CREATE INDEX "social_profiles_kind_deleted_at_idx" ON "social_profiles"("kind", "deleted_at");

-- CreateIndex
CREATE INDEX "social_profiles_location_city_id_idx" ON "social_profiles"("location_city_id");

-- CreateIndex
CREATE INDEX "follows_following_profile_id_created_at_idx" ON "follows"("following_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "follows_follower_profile_id_created_at_idx" ON "follows"("follower_profile_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_profile_id_following_profile_id_key" ON "follows"("follower_profile_id", "following_profile_id");

-- CreateIndex
CREATE INDEX "posts_author_profile_id_created_at_idx" ON "posts"("author_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");

-- CreateIndex
CREATE INDEX "posts_deleted_at_idx" ON "posts"("deleted_at");

-- CreateIndex
CREATE INDEX "post_media_post_id_sort_order_idx" ON "post_media"("post_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "post_media_post_id_file_id_key" ON "post_media"("post_id", "file_id");

-- CreateIndex
CREATE INDEX "post_likes_profile_id_created_at_idx" ON "post_likes"("profile_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_profile_id_key" ON "post_likes"("post_id", "profile_id");

-- CreateIndex
CREATE INDEX "post_comments_post_id_created_at_idx" ON "post_comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "post_comments_author_profile_id_idx" ON "post_comments"("author_profile_id");

-- CreateIndex
CREATE INDEX "post_comments_parent_id_idx" ON "post_comments"("parent_id");

-- CreateIndex
CREATE INDEX "saved_posts_profile_id_created_at_idx" ON "saved_posts"("profile_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_posts_post_id_profile_id_key" ON "saved_posts"("post_id", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "feed_items_post_id_key" ON "feed_items"("post_id");

-- CreateIndex
CREATE INDEX "feed_items_created_at_idx" ON "feed_items"("created_at");

-- CreateIndex
CREATE INDEX "feed_items_author_profile_id_created_at_idx" ON "feed_items"("author_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "content_reports_status_created_at_idx" ON "content_reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "content_reports_reporter_user_id_idx" ON "content_reports"("reporter_user_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocked_user_id_idx" ON "user_blocks"("blocked_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blocker_user_id_blocked_user_id_key" ON "user_blocks"("blocker_user_id", "blocked_user_id");

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_cover_file_id_fkey" FOREIGN KEY ("cover_file_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_location_city_id_fkey" FOREIGN KEY ("location_city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_profile_id_fkey" FOREIGN KEY ("follower_profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_profile_id_fkey" FOREIGN KEY ("following_profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_profile_id_fkey" FOREIGN KEY ("author_profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_commerce_request_id_fkey" FOREIGN KEY ("commerce_request_id") REFERENCES "commerce_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_author_profile_id_fkey" FOREIGN KEY ("author_profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_commerce_request_id_fkey" FOREIGN KEY ("commerce_request_id") REFERENCES "commerce_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_author_profile_id_fkey" FOREIGN KEY ("author_profile_id") REFERENCES "social_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_user_id_fkey" FOREIGN KEY ("blocker_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
