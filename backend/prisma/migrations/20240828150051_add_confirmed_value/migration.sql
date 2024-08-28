/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `Reading` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerCode` to the `Reading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Reading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `measureDatetime` to the `Reading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Reading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uuid` to the `Reading` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reading" ADD COLUMN     "confirmedValue" DOUBLE PRECISION,
ADD COLUMN     "customerCode" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "measureDatetime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uuid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reading_uuid_key" ON "Reading"("uuid");

-- CreateIndex
CREATE INDEX "Reading_uuid_idx" ON "Reading"("uuid");
