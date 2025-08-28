/*
  Warnings:

  - A unique constraint covering the columns `[queuePlace]` on the table `Queue` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
CREATE SEQUENCE queue_queueplace_seq;
ALTER TABLE "Queue" ALTER COLUMN "queuePlace" SET DEFAULT nextval('queue_queueplace_seq');
ALTER SEQUENCE queue_queueplace_seq OWNED BY "Queue"."queuePlace";

-- CreateIndex
CREATE UNIQUE INDEX "Queue_queuePlace_key" ON "Queue"("queuePlace");
