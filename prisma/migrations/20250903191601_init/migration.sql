-- DropIndex
DROP INDEX "Queue_queuePlace_key";

-- AlterTable
ALTER TABLE "Queue" ALTER COLUMN "queuePlace" DROP DEFAULT;
DROP SEQUENCE "queue_queueplace_seq";
