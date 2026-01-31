-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "FloorPlan" ADD COLUMN     "defaultZoom" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateIndex
CREATE INDEX "Booking_groupId_idx" ON "Booking"("groupId");
