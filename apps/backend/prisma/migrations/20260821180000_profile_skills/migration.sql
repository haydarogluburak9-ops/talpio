CREATE TABLE "social_profile_skills" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_profile_skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "social_profile_skills_profile_id_name_key" ON "social_profile_skills"("profile_id", "name");
CREATE INDEX "social_profile_skills_profile_id_sort_order_idx" ON "social_profile_skills"("profile_id", "sort_order");

ALTER TABLE "social_profile_skills" ADD CONSTRAINT "social_profile_skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
