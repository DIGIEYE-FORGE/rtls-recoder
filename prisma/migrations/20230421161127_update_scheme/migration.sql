/*
  Warnings:

  - You are about to drop the column `tenant_id` on the `machines` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "alert" DROP CONSTRAINT "alert_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "rapport" DROP CONSTRAINT "rapport_alertId_fkey";

-- DropIndex
DROP INDEX "machines_tenant_id_index";

-- AlterTable
ALTER TABLE "alert" ADD COLUMN     "ackowledge" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "deviceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "machines" DROP COLUMN "tenant_id";

-- CreateIndex
CREATE INDEX "created_at" ON "history"("created_at");

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport" ADD CONSTRAINT "rapport_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
