/*
  Warnings:

  - A unique constraint covering the columns `[biometric_id]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "admission_date" TEXT,
ADD COLUMN     "alt_contact_number" TEXT,
ADD COLUMN     "biometric_id" TEXT,
ADD COLUMN     "is_hosteller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_using_transport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nick_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_biometric_id_key" ON "Student"("biometric_id");
