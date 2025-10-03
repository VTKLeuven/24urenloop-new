-- AlterTable
ALTER TABLE "Runner" ADD COLUMN     "reward1Collected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reward2Collected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reward3Collected" BOOLEAN NOT NULL DEFAULT false;
