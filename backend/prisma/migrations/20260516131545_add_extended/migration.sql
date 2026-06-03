/*
  Warnings:

  - You are about to drop the column `created_by` on the `FeedbackCategory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FeedbackCategory" DROP COLUMN "created_by";

-- AlterTable
ALTER TABLE "FeedbackForm" ADD COLUMN     "all_students" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "batch_year" INTEGER,
ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "department_id" TEXT;

-- CreateTable
CREATE TABLE "FeedbackFormStudent" (
    "form_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,

    CONSTRAINT "FeedbackFormStudent_pkey" PRIMARY KEY ("form_id","student_id")
);

-- AddForeignKey
ALTER TABLE "FeedbackForm" ADD CONSTRAINT "FeedbackForm_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackForm" ADD CONSTRAINT "FeedbackForm_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackFormStudent" ADD CONSTRAINT "FeedbackFormStudent_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "FeedbackForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackFormStudent" ADD CONSTRAINT "FeedbackFormStudent_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
