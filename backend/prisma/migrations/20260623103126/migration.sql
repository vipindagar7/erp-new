/*
  Warnings:

  - A unique constraint covering the columns `[university_roll_no]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "university_roll_no" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_university_roll_no_key" ON "Student"("university_roll_no");
