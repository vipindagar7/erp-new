-- AlterTable
ALTER TABLE "FeedbackResponse" ADD COLUMN     "snap_academic_year" TEXT,
ADD COLUMN     "snap_batch" TEXT,
ADD COLUMN     "snap_course_name" TEXT,
ADD COLUMN     "snap_dept_name" TEXT,
ADD COLUMN     "snap_program_name" TEXT,
ADD COLUMN     "snap_section_name" TEXT,
ADD COLUMN     "snap_semester" INTEGER;

-- CreateTable
CREATE TABLE "SectionSubjectHistory" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "faculty_id" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "prev_data" JSONB,
    "new_data" JSONB,
    "changed_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionSubjectHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SectionSubjectHistory_section_id_idx" ON "SectionSubjectHistory"("section_id");

-- CreateIndex
CREATE INDEX "SectionSubjectHistory_action_idx" ON "SectionSubjectHistory"("action");

-- CreateIndex
CREATE INDEX "SectionSubjectHistory_createdAt_idx" ON "SectionSubjectHistory"("createdAt");

-- CreateIndex
CREATE INDEX "SectionSubjectHistory_subject_id_idx" ON "SectionSubjectHistory"("subject_id");

-- AddForeignKey
ALTER TABLE "SectionSubjectHistory" ADD CONSTRAINT "SectionSubjectHistory_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubjectHistory" ADD CONSTRAINT "SectionSubjectHistory_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
