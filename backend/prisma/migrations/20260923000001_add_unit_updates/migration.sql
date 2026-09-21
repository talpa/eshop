CREATE TABLE "UnitUpdate" (
    "id" TEXT NOT NULL,
    "militaryUnitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitUpdate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UnitUpdate" ADD CONSTRAINT "UnitUpdate_militaryUnitId_fkey"
  FOREIGN KEY ("militaryUnitId") REFERENCES "MilitaryUnit"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
