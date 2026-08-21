-- LinkedIn-style profile career fields
ALTER TABLE "social_profiles" ADD COLUMN "headline" TEXT;

CREATE TABLE "social_profile_experiences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location_text" TEXT,
    "description" TEXT,
    "start_year" INTEGER NOT NULL,
    "start_month" INTEGER,
    "end_year" INTEGER,
    "end_month" INTEGER,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_profile_experiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "social_profile_education" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "degree" TEXT,
    "field_of_study" TEXT,
    "description" TEXT,
    "start_year" INTEGER NOT NULL,
    "start_month" INTEGER,
    "end_year" INTEGER,
    "end_month" INTEGER,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_profile_education_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_profile_experiences_profile_id_sort_order_idx" ON "social_profile_experiences"("profile_id", "sort_order");
CREATE INDEX "social_profile_education_profile_id_sort_order_idx" ON "social_profile_education"("profile_id", "sort_order");

ALTER TABLE "social_profile_experiences" ADD CONSTRAINT "social_profile_experiences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_profile_education" ADD CONSTRAINT "social_profile_education_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "social_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
