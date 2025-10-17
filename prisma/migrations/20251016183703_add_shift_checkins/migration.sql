-- AlterTable
ALTER TABLE "Runner" ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "ShiftCheckIn" (
    "id" SERIAL NOT NULL,
    "runnerId" INTEGER NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftCheckIn_runnerId_timeSlot_key" ON "ShiftCheckIn"("runnerId", "timeSlot");

-- AddForeignKey
ALTER TABLE "ShiftCheckIn" ADD CONSTRAINT "ShiftCheckIn_runnerId_fkey" FOREIGN KEY ("runnerId") REFERENCES "Runner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
