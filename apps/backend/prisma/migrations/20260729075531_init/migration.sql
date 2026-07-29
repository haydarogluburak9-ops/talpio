-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "code" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "phone_code" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "default_locale" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "cities_country_id_is_active_idx" ON "cities"("country_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "cities_country_id_name_key" ON "cities"("country_id", "name");

-- CreateIndex
CREATE INDEX "districts_city_id_is_active_idx" ON "districts"("city_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "districts_city_id_name_key" ON "districts"("city_id", "name");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
