-- Yetkinliklere ustalik derecesi.
--
-- Kolon NULL kabul eder: mevcut kayitlarda derece yok ve varsayilan bir deger
-- atamak, kullanicinin hic beyan etmedigi bir seviyeyi profilinde gostermek
-- anlamina gelirdi.
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

ALTER TABLE "social_profile_skills" ADD COLUMN "level" "SkillLevel";
