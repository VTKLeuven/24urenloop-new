/*
  Warnings:

  - Made the column `testTime` on table `Runner` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Runner" ADD COLUMN     "shoeSize" TEXT NOT NULL DEFAULT '0',
ALTER COLUMN "testTime" SET NOT NULL,
ALTER COLUMN "testTime" SET DATA TYPE TEXT;
