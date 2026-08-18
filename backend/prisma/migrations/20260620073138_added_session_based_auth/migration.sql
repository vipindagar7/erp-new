/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `AcademicSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Program` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_section_id_fkey";

-- AlterTable
ALTER TABLE "AcademicSession" ADD COLUMN     "code" TEXT NOT NULL DEFAULT '1';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "code" TEXT NOT NULL DEFAULT '1';

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "code" TEXT NOT NULL DEFAULT '1';

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "code" TEXT NOT NULL DEFAULT '1';

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "batch_year" INTEGER,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SectionHistory" ADD COLUMN     "new_subjects" JSONB,
ADD COLUMN     "prev_subjects" JSONB;

-- AlterTable
ALTER TABLE "SectionSubjectHistory" ADD COLUMN     "facultyId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "code" TEXT,
ALTER COLUMN "section_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "StudentSectionHistory" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_section_id" TEXT,
    "to_section_id" TEXT NOT NULL,
    "from_section_code" TEXT,
    "to_section_code" TEXT,
    "reason" TEXT,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentSectionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentSectionHistory_student_id_idx" ON "StudentSectionHistory"("student_id");

-- CreateIndex
CREATE INDEX "StudentSectionHistory_createdAt_idx" ON "StudentSectionHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_code_key" ON "AcademicSession"("code");

-- CreateIndex
CREATE INDEX "AcademicSession_code_idx" ON "AcademicSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_code_idx" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_code_idx" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Faculty_emp_id_idx" ON "Faculty"("emp_id");

-- CreateIndex
CREATE UNIQUE INDEX "Program_code_key" ON "Program"("code");

-- CreateIndex
CREATE INDEX "Program_code_idx" ON "Program"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Section_code_key" ON "Section"("code");

-- CreateIndex
CREATE INDEX "Section_code_idx" ON "Section"("code");

-- CreateIndex
CREATE INDEX "Section_course_id_idx" ON "Section"("course_id");

-- CreateIndex
CREATE INDEX "Section_semester_idx" ON "Section"("semester");

-- CreateIndex
CREATE INDEX "Section_status_idx" ON "Section"("status");

-- CreateIndex
CREATE INDEX "SectionSubject_section_id_idx" ON "SectionSubject"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_code_key" ON "Student"("code");

-- CreateIndex
CREATE INDEX "Student_code_idx" ON "Student"("code");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "StudentEnrollment_semester_idx" ON "StudentEnrollment"("semester");

-- CreateIndex
CREATE INDEX "Subject_code_idx" ON "Subject"("code");

-- AddForeignKey
ALTER TABLE "StudentSectionHistory" ADD CONSTRAINT "StudentSectionHistory_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSectionHistory" ADD CONSTRAINT "StudentSectionHistory_to_section_id_fkey" FOREIGN KEY ("to_section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubjectHistory" ADD CONSTRAINT "SectionSubjectHistory_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
