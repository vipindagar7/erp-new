/*
  Warnings:

  - You are about to drop the column `browser` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `device_type` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `os` on the `AuditLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "browser",
DROP COLUMN "device_type",
DROP COLUMN "os";
