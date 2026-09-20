-- CreateTable
CREATE TABLE "MilitaryUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilitaryUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MilitaryUnit_slug_key" ON "MilitaryUnit"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- AlterTable
ALTER TABLE "Order"
    ADD COLUMN "militaryUnitId" TEXT,
    ADD COLUMN "donationAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "fundsUsed" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "confirmationSentAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_militaryUnitId_fkey"
    FOREIGN KEY ("militaryUnitId") REFERENCES "MilitaryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
