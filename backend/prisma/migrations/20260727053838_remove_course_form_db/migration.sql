/*
  Warnings:

  - You are about to drop the column `dept_id` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `course_id` on the `CurriculumSubject` table. All the data in the column will be lost.
  - You are about to drop the column `course_id` on the `FeedbackForm` table. All the data in the column will be lost.
  - You are about to drop the column `snap_course_name` on the `FeedbackResponse` table. All the data in the column will be lost.
  - You are about to drop the column `branch_id` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `course_id` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `course_id` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `course_id` on the `StudentEnrollment` table. All the data in the column will be lost.
  - You are about to drop the `Course` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[session_id,program_id,semester,subject_id]` on the table `CurriculumSubject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `program_id` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_id` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Branch" DROP CONSTRAINT "Branch_dept_id_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_program_id_fkey";

-- DropForeignKey
ALTER TABLE "CurriculumSubject" DROP CONSTRAINT "CurriculumSubject_course_id_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackForm" DROP CONSTRAINT "FeedbackForm_course_id_fkey";

-- DropForeignKey
ALTER TABLE "Program" DROP CONSTRAINT "Program_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_course_id_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_course_id_fkey";

-- DropForeignKey
ALTER TABLE "StudentEnrollment" DROP CONSTRAINT "StudentEnrollment_course_id_fkey";

-- DropIndex
DROP INDEX "Branch_dept_id_idx";

-- DropIndex
DROP INDEX "CurriculumSubject_course_id_semester_idx";

-- DropIndex
DROP INDEX "CurriculumSubject_session_id_course_id_semester_subject_id_key";

-- DropIndex
DROP INDEX "Program_branch_id_idx";

-- DropIndex
DROP INDEX "Section_course_id_idx";

-- DropIndex
DROP INDEX "Student_course_id_idx";

-- AlterTable
ALTER TABLE "Branch" DROP COLUMN "dept_id",
ADD COLUMN     "program_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CurriculumSubject" DROP COLUMN "course_id",
ADD COLUMN     "branch_id" TEXT;

-- AlterTable
ALTER TABLE "FeedbackForm" DROP COLUMN "course_id",
ADD COLUMN     "program_id" TEXT;

-- AlterTable
ALTER TABLE "FeedbackResponse" DROP COLUMN "snap_course_name",
ADD COLUMN     "snap_branch_name" TEXT;

-- AlterTable
ALTER TABLE "Program" DROP COLUMN "branch_id";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "course_id",
ADD COLUMN     "academic_year" TEXT,
ADD COLUMN     "branch_id" TEXT NOT NULL,
ADD COLUMN     "is_combined" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "course_id";

-- AlterTable
ALTER TABLE "StudentEnrollment" DROP COLUMN "course_id",
ADD COLUMN     "branch_id" TEXT;

-- DropTable
DROP TABLE "Course";

-- CreateIndex
CREATE INDEX "Branch_program_id_idx" ON "Branch"("program_id");

-- CreateIndex
CREATE INDEX "CurriculumSubject_program_id_semester_idx" ON "CurriculumSubject"("program_id", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumSubject_session_id_program_id_semester_subject_id_key" ON "CurriculumSubject"("session_id", "program_id", "semester", "subject_id");

-- CreateIndex
CREATE INDEX "Section_branch_id_idx" ON "Section"("branch_id");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackForm" ADD CONSTRAINT "FeedbackForm_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
