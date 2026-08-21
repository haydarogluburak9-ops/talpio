-- CreateTable
CREATE TABLE "story_highlights" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover_file_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_highlight_items" (
    "id" TEXT NOT NULL,
    "highlight_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_highlight_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "story_highlights_profile_id_sort_order_idx" ON "story_highlights"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "story_highlight_items_highlight_id_sort_order_idx" ON "story_highlight_items"("highlight_id", "sort_order");

-- CreateIndex
CREATE INDEX "story_highlight_items_post_id_idx" ON "story_highlight_items"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_highlight_items_highlight_id_post_id_key" ON "story_highlight_items"("highlight_id", "post_id");

-- AddForeignKey
ALTER TABLE "story_highlights" ADD CONSTRAINT "story_highlights_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_highlights" ADD CONSTRAINT "story_highlights_cover_file_id_fkey" FOREIGN KEY ("cover_file_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_highlight_items" ADD CONSTRAINT "story_highlight_items_highlight_id_fkey" FOREIGN KEY ("highlight_id") REFERENCES "story_highlights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_highlight_items" ADD CONSTRAINT "story_highlight_items_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
