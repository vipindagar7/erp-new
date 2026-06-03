/*
  Warnings:

  - You are about to drop the column `room_no` on the `Subject` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "room_no" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "room_no";
