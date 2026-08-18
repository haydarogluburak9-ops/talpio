-- Sosyal grafik: repost/quote, hashtag, mention, share, view, hide, trending
ALTER TYPE "post_type" ADD VALUE IF NOT EXISTS 'REPOST';
ALTER TYPE "post_type" ADD VALUE IF NOT EXISTS 'QUOTE';

ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'SOCIAL_MENTION';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'SOCIAL_SHARE';

ALTER TABLE "posts"
ADD COLUMN "unique_view_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "repost_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "original_post_id" TEXT;

CREATE INDEX "posts_original_post_id_idx" ON "posts"("original_post_id");

ALTER TABLE "posts"
ADD CONSTRAINT "posts_original_post_id_fkey"
FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "hashtags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display" TEXT NOT NULL,
    "post_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hashtags_slug_key" ON "hashtags"("slug");

CREATE TABLE "post_hashtags" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "hashtag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_hashtags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_hashtags_post_id_hashtag_id_key" ON "post_hashtags"("post_id", "hashtag_id");
CREATE INDEX "post_hashtags_hashtag_id_created_at_idx" ON "post_hashtags"("hashtag_id", "created_at");

ALTER TABLE "post_hashtags"
ADD CONSTRAINT "post_hashtags_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_hashtags"
ADD CONSTRAINT "post_hashtags_hashtag_id_fkey"
FOREIGN KEY ("hashtag_id") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "post_mentions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_mentions_post_id_profile_id_key" ON "post_mentions"("post_id", "profile_id");
CREATE INDEX "post_mentions_profile_id_created_at_idx" ON "post_mentions"("profile_id", "created_at");

ALTER TABLE "post_mentions"
ADD CONSTRAINT "post_mentions_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_mentions"
ADD CONSTRAINT "post_mentions_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "post_shares" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_shares_post_id_profile_id_key" ON "post_shares"("post_id", "profile_id");
CREATE INDEX "post_shares_profile_id_created_at_idx" ON "post_shares"("profile_id", "created_at");

ALTER TABLE "post_shares"
ADD CONSTRAINT "post_shares_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_shares"
ADD CONSTRAINT "post_shares_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "post_views" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_views_post_id_profile_id_key" ON "post_views"("post_id", "profile_id");
CREATE INDEX "post_views_profile_id_created_at_idx" ON "post_views"("profile_id", "created_at");

ALTER TABLE "post_views"
ADD CONSTRAINT "post_views_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_views"
ADD CONSTRAINT "post_views_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "post_hides" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_hides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_hides_post_id_profile_id_key" ON "post_hides"("post_id", "profile_id");
CREATE INDEX "post_hides_profile_id_idx" ON "post_hides"("profile_id");

ALTER TABLE "post_hides"
ADD CONSTRAINT "post_hides_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_hides"
ADD CONSTRAINT "post_hides_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trending_topics" (
    "id" TEXT NOT NULL,
    "hashtag_id" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "unique_interactions" INTEGER NOT NULL DEFAULT 0,
    "engagement_velocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "save_count" INTEGER NOT NULL DEFAULT 0,
    "request_conversions" INTEGER NOT NULL DEFAULT 0,
    "region_city_id" TEXT,
    "category_id" TEXT,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trending_topics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trending_topics_hashtag_id_window_start_key" ON "trending_topics"("hashtag_id", "window_start");
CREATE INDEX "trending_topics_window_start_score_idx" ON "trending_topics"("window_start", "score");

ALTER TABLE "trending_topics"
ADD CONSTRAINT "trending_topics_hashtag_id_fkey"
FOREIGN KEY ("hashtag_id") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trending_topics"
ADD CONSTRAINT "trending_topics_region_city_id_fkey"
FOREIGN KEY ("region_city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "trending_topics"
ADD CONSTRAINT "trending_topics_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
