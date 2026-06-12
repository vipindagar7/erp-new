/*
  Warnings:

  - A unique constraint covering the columns `[session_id,course_id,semester,subject_id]` on the table `CurriculumSubject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_id,section_id,subject_id]` on the table `SectionSubject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_id,student_id]` on the table `StudentEnrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `session_id` to the `CurriculumSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `SectionSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `SectionSubjectHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `StudentEnrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CurriculumSubject_course_id_semester_subject_id_key";

-- DropIndex
DROP INDEX "SectionSubject_section_id_subject_id_key";

-- AlterTable
ALTER TABLE "CurriculumSubject" ADD COLUMN     "session_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SectionSubject" ADD COLUMN     "session_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SectionSubjectHistory" ADD COLUMN     "session_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StudentEnrollment" ADD COLUMN     "session_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionHistory" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "academic_year" TEXT,
    "class_coordinator_id" TEXT,
    "coordinator_name" TEXT,
    "prev_semester" INTEGER,
    "prev_status" TEXT,
    "prev_batch" TEXT,
    "prev_class_coordinator_id" TEXT,
    "prev_coordinator_name" TEXT,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "changed_by_role" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_name_key" ON "AcademicSession"("name");

-- CreateIndex
CREATE INDEX "AcademicSession_is_current_idx" ON "AcademicSession"("is_current");

-- CreateIndex
CREATE INDEX "SectionHistory_session_id_idx" ON "SectionHistory"("session_id");

-- CreateIndex
CREATE INDEX "SectionHistory_section_id_idx" ON "SectionHistory"("section_id");

-- CreateIndex
CREATE INDEX "SectionHistory_action_idx" ON "SectionHistory"("action");

-- CreateIndex
CREATE INDEX "SectionHistory_createdAt_idx" ON "SectionHistory"("createdAt");

-- CreateIndex
CREATE INDEX "CurriculumSubject_session_id_idx" ON "CurriculumSubject"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumSubject_session_id_course_id_semester_subject_id_key" ON "CurriculumSubject"("session_id", "course_id", "semester", "subject_id");

-- CreateIndex
CREATE INDEX "SectionSubject_session_id_idx" ON "SectionSubject"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "SectionSubject_session_id_section_id_subject_id_key" ON "SectionSubject"("session_id", "section_id", "subject_id");

-- CreateIndex
CREATE INDEX "SectionSubjectHistory_session_id_idx" ON "SectionSubjectHistory"("session_id");

-- CreateIndex
CREATE INDEX "StudentEnrollment_session_id_idx" ON "StudentEnrollment"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_session_id_student_id_key" ON "StudentEnrollment"("session_id", "student_id");

-- AddForeignKey
ALTER TABLE "SectionSubject" ADD CONSTRAINT "SectionSubject_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubjectHistory" ADD CONSTRAINT "SectionSubjectHistory_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionHistory" ADD CONSTRAINT "SectionHistory_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionHistory" ADD CONSTRAINT "SectionHistory_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumSubject" ADD CONSTRAINT "CurriculumSubject_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
