-- Add Activity table
CREATE TABLE "Activity" (
  "id"        TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Activity_code_key" ON "Activity"("code");

-- Link MilitaryUnit to Activity
ALTER TABLE "MilitaryUnit" ADD COLUMN "activityId" TEXT;
ALTER TABLE "MilitaryUnit"
  ADD CONSTRAINT "MilitaryUnit_activityId_fkey"
  FOREIGN KEY ("activityId") REFERENCES "Activity"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add anonymous donation fields to Order
ALTER TABLE "Order" ADD COLUMN "isAnonymous"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "activityCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "activityName" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentNote"  TEXT;

-- Seed activities
INSERT INTO "Activity" ("id","code","name") VALUES
  (gen_random_uuid(),'1000','Humanitární pomoc obyvatelstvu na Ukrajině'),
  (gen_random_uuid(),'1100','Humanitární pomoc – nákup potravin'),
  (gen_random_uuid(),'1110','Humanitární pomoc – nákup potravin – Ševčenkové'),
  (gen_random_uuid(),'1200','Humanitární pomoc – nákup léků a lékařských prostředků'),
  (gen_random_uuid(),'1210','Humanitární pomoc – 3D tisk protéz, biotické končetiny'),
  (gen_random_uuid(),'1220','Humanitární pomoc – chirurgické nástroje pro Charkovskou nemocnici'),
  (gen_random_uuid(),'2000','Bezpečnost'),
  (gen_random_uuid(),'2100','Podpora vojáků na Ukrajině'),
  (gen_random_uuid(),'2110','Podpora vojáků – Arisovy Poletuchy'),
  (gen_random_uuid(),'2120','Podpora vojáků – 28. samostatná mechanizovaná brigáda'),
  (gen_random_uuid(),'2200','Bezpečnost – vývoj obranných zbraní, dronů a rušiček'),
  (gen_random_uuid(),'2210','Bezpečnost – vývoj a dodávky autonomních dronů – Kyril'),
  (gen_random_uuid(),'2300','Bezpečnost – výuka civilistů a profesionálů'),
  (gen_random_uuid(),'2310','Bezpečnost – výuka obsluhy a stavby dronů'),
  (gen_random_uuid(),'2320','Bezpečnost – válečná první pomoc');
