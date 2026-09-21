-- AlterTable MilitaryUnit: add EN/UK translation fields
ALTER TABLE "MilitaryUnit"
  ADD COLUMN "nameEn"        TEXT,
  ADD COLUMN "nameUk"        TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "descriptionUk" TEXT;

-- AlterTable Activity: add EN/UK translation fields
ALTER TABLE "Activity"
  ADD COLUMN "nameEn" TEXT,
  ADD COLUMN "nameUk" TEXT;

-- AlterTable Category: add EN/UK translation fields
ALTER TABLE "Category"
  ADD COLUMN "nameEn"        TEXT,
  ADD COLUMN "nameUk"        TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "descriptionUk" TEXT;
