-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('HOME', 'PACKETA');

-- AlterTable: make shippingAddress nullable, add structured address fields
ALTER TABLE "Order"
    ALTER COLUMN "shippingAddress" DROP NOT NULL,
    ADD COLUMN "street" TEXT,
    ADD COLUMN "city" TEXT,
    ADD COLUMN "zip" TEXT,
    ADD COLUMN "country" TEXT NOT NULL DEFAULT 'CZ',
    ADD COLUMN "deliveryType" "DeliveryType" NOT NULL DEFAULT 'HOME',
    ADD COLUMN "packetaPointId" TEXT,
    ADD COLUMN "packetaPointName" TEXT;

-- CreateTable: implicit M2M for Product <-> MilitaryUnit
CREATE TABLE "_ProductMilitaryUnits" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductMilitaryUnits_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductMilitaryUnits_B_index" ON "_ProductMilitaryUnits"("B");

-- AddForeignKey
ALTER TABLE "_ProductMilitaryUnits" ADD CONSTRAINT "_ProductMilitaryUnits_A_fkey"
    FOREIGN KEY ("A") REFERENCES "MilitaryUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ProductMilitaryUnits" ADD CONSTRAINT "_ProductMilitaryUnits_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
