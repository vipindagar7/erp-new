-- CreateTable
CREATE TABLE "CurriculumSubject" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "subject_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'REGULAR',
    "is_core" BOOLEAN NOT NULL DEFAULT true,
    "credits" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CurriculumSubject_program_id_idx" ON "CurriculumSubject"("program_id");

-- CreateIndex
CREATE INDEX "CurriculumSubject_course_id_semester_idx" ON "CurriculumSubject"("course_id", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumSubject_course_id_semester_subject_id_key" ON "CurriculumSubject"("course_id", "semester", "subject_id");

-- AddForeignKey
ALTER TABLE "CurriculumSubject" ADD CONSTRAINT "CurriculumSubject_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumSubject" ADD CONSTRAINT "CurriculumSubject_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumSubject" ADD CONSTRAINT "CurriculumSubject_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
