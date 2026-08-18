/*
  Warnings:

  - You are about to drop the column `dept_id` on the `AcademicCalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `AcademicCalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `section_id` on the `AcademicCalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `granted_at` on the `AdminDeptScope` table. All the data in the column will be lost.
  - You are about to drop the column `revoked_at` on the `AdminDeptScope` table. All the data in the column will be lost.
  - You are about to drop the column `attachment_url` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `max_marks` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `section_id` on the `Assignment` table. All the data in the column will be lost.
  - The `status` column on the `Assignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `AssignmentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `AssignmentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `AssignmentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `marks_obtained` on the `AssignmentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `AssignmentSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `file_url` on the `AssignmentSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `plagiarism_score` on the `AssignmentSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `ExamMark` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ExamRoom` table. All the data in the column will be lost.
  - You are about to drop the column `invigilator_id` on the `ExamRoom` table. All the data in the column will be lost.
  - You are about to drop the column `is_present` on the `ExamSeating` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `ExtraAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `HallTicket` table. All the data in the column will be lost.
  - You are about to drop the column `ineligibility_reason` on the `HallTicket` table. All the data in the column will be lost.
  - You are about to drop the column `is_eligible` on the `HallTicket` table. All the data in the column will be lost.
  - You are about to drop the column `issued_at` on the `HallTicket` table. All the data in the column will be lost.
  - You are about to drop the column `is_approved` on the `QuestionPaper` table. All the data in the column will be lost.
  - You are about to drop the column `basic_salary` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `payment_ref` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `is_deduction` on the `SalarySlipComponent` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `card_id` on the `SkillCardEntry` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `SkillCardEntry` table. All the data in the column will be lost.
  - You are about to drop the column `duration_hours` on the `SkillCardEntry` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `SkillCardEntry` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StudentLeaveApproval` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `StudentSkillCard` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StudentSkillCard` table. All the data in the column will be lost.
  - You are about to drop the `MentorTrackRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OnlineCourseRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Training` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingAttendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingEnrollment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingFeeTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingMentor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingTeamMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingUpdate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[submission_id]` on the table `AssignmentGrade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[exam_id,student_id,exam_date]` on the table `ExamSeating` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[exam_room_id,seat_no,exam_date]` on the table `ExamSeating` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ticket_no]` on the table `HallTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slip_id,component_id]` on the table `SalarySlipComponent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `AdminDeptScope` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marks` to the `AssignmentGrade` table without a default value. This is not possible if the table is not empty.
  - Made the column `submission_id` on table `AssignmentGrade` required. This step will fail if there are existing NULL values in that column.
  - Made the column `graded_by` on table `AssignmentGrade` required. This step will fail if there are existing NULL values in that column.
  - Made the column `graded_at` on table `AssignmentGrade` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `exam_type` to the `ExamMark` table without a default value. This is not possible if the table is not empty.
  - Made the column `granted_by` on table `ExtraAttendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `effective_date` on table `ExtraAttendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `components` on table `FeeStructure` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `QuestionPaper` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_earning` to the `SalarySlipComponent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entry_no` to the `SkillCardEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skill_card_id` to the `SkillCardEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year_no` to the `SkillCardEntry` table without a default value. This is not possible if the table is not empty.
  - Made the column `provider` on table `SkillCardEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_updated` on table `StudentSkillCard` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CalendarEventType" ADD VALUE 'COMMENCEMENT_OF_CLASSES';
ALTER TYPE "CalendarEventType" ADD VALUE 'OFF_SATURDAY';
ALTER TYPE "CalendarEventType" ADD VALUE 'ANNUAL_FEST';
ALTER TYPE "CalendarEventType" ADD VALUE 'PTM';
ALTER TYPE "CalendarEventType" ADD VALUE 'SESSIONAL_TEST';
ALTER TYPE "CalendarEventType" ADD VALUE 'SESSIONAL_MARKS_DISPLAY';
ALTER TYPE "CalendarEventType" ADD VALUE 'ATTENDANCE_ELIGIBILITY';
ALTER TYPE "CalendarEventType" ADD VALUE 'PRE_UNIVERSITY_EXAM';
ALTER TYPE "CalendarEventType" ADD VALUE 'LAST_TEACHING_DAY';
ALTER TYPE "CalendarEventType" ADD VALUE 'UNIVERSITY_PRACTICAL';
ALTER TYPE "CalendarEventType" ADD VALUE 'UNIVERSITY_THEORY_EXAM';
ALTER TYPE "CalendarEventType" ADD VALUE 'CLASS_TEST';
ALTER TYPE "CalendarEventType" ADD VALUE 'INTERNAL_PRACTICAL';
ALTER TYPE "CalendarEventType" ADD VALUE 'WORKING_SATURDAY';
ALTER TYPE "CalendarEventType" ADD VALUE 'SPECIAL_EVENT';
ALTER TYPE "CalendarEventType" ADD VALUE 'HACKATHON';
ALTER TYPE "CalendarEventType" ADD VALUE 'CULTURAL_EVENT';
ALTER TYPE "CalendarEventType" ADD VALUE 'SPORTS_EVENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FeeStatus" ADD VALUE 'SCHOLARSHIP';
ALTER TYPE "FeeStatus" ADD VALUE 'OVERDUE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubmissionStatus" ADD VALUE 'DRAFT';
ALTER TYPE "SubmissionStatus" ADD VALUE 'RETURNED';
ALTER TYPE "SubmissionStatus" ADD VALUE 'PLAGIARISM_FLAGGED';

-- DropForeignKey
ALTER TABLE "OnlineCourseRecord" DROP CONSTRAINT "OnlineCourseRecord_student_id_fkey";

-- DropForeignKey
ALTER TABLE "OnlineCourseRecord" DROP CONSTRAINT "OnlineCourseRecord_training_id_fkey";

-- DropForeignKey
ALTER TABLE "SkillCardEntry" DROP CONSTRAINT "SkillCardEntry_card_id_fkey";

-- DropForeignKey
ALTER TABLE "Training" DROP CONSTRAINT "Training_dept_id_fkey";

-- DropForeignKey
ALTER TABLE "Training" DROP CONSTRAINT "Training_room_id_fkey";

-- DropForeignKey
ALTER TABLE "Training" DROP CONSTRAINT "Training_session_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingAttendance" DROP CONSTRAINT "TrainingAttendance_enrollment_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingAttendance" DROP CONSTRAINT "TrainingAttendance_student_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingAttendance" DROP CONSTRAINT "TrainingAttendance_training_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingEnrollment" DROP CONSTRAINT "TrainingEnrollment_student_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingEnrollment" DROP CONSTRAINT "TrainingEnrollment_training_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingFeeTransaction" DROP CONSTRAINT "TrainingFeeTransaction_enrollment_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingMentor" DROP CONSTRAINT "TrainingMentor_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingMentor" DROP CONSTRAINT "TrainingMentor_training_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingSection" DROP CONSTRAINT "TrainingSection_section_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingSection" DROP CONSTRAINT "TrainingSection_training_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingTeamMember" DROP CONSTRAINT "TrainingTeamMember_training_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingUpdate" DROP CONSTRAINT "TrainingUpdate_mentor_id_fkey";

-- DropForeignKey
ALTER TABLE "TrainingUpdate" DROP CONSTRAINT "TrainingUpdate_training_id_fkey";

-- DropIndex
DROP INDEX "AcademicCalendarEvent_session_id_idx";

-- DropIndex
DROP INDEX "AcademicCalendarEvent_start_date_idx";

-- DropIndex
DROP INDEX "AssignmentGrade_assignment_id_student_id_key";

-- DropIndex
DROP INDEX "Exam_session_id_idx";

-- DropIndex
DROP INDEX "ExamSeating_exam_room_id_seat_no_key";

-- DropIndex
DROP INDEX "SkillCardEntry_card_id_idx";

-- AlterTable
ALTER TABLE "AcademicCalendarEvent" DROP COLUMN "dept_id",
DROP COLUMN "scope",
DROP COLUMN "section_id",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "dept_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "is_working" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "week_no" INTEGER,
ALTER COLUMN "event_type" DROP DEFAULT,
ALTER COLUMN "start_date" SET DATA TYPE DATE,
ALTER COLUMN "end_date" SET DATA TYPE DATE,
ALTER COLUMN "affects_attendance" SET DEFAULT true;

-- AlterTable
ALTER TABLE "AdminDeptScope" DROP COLUMN "granted_at",
DROP COLUMN "revoked_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "attachment_url",
DROP COLUMN "max_marks",
DROP COLUMN "section_id",
ADD COLUMN     "allow_file" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_text" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowed_formats" TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'zip']::TEXT[],
ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "co_mapping" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "max_file_size_mb" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "max_late_days" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "plagiarism_check" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plagiarism_threshold" DOUBLE PRECISION NOT NULL DEFAULT 30,
ADD COLUMN     "po_mapping" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "section_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "total_marks" DOUBLE PRECISION NOT NULL DEFAULT 10,
ALTER COLUMN "passing_marks" SET DEFAULT 4,
ALTER COLUMN "allow_late" SET DEFAULT true,
ALTER COLUMN "late_penalty_pct" SET DEFAULT 5,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "AssignmentGrade" DROP COLUMN "createdAt",
DROP COLUMN "feedback",
DROP COLUMN "grade",
DROP COLUMN "marks_obtained",
ADD COLUMN     "letter_grade" TEXT,
ADD COLUMN     "marks" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "submission_id" SET NOT NULL,
ALTER COLUMN "graded_by" SET NOT NULL,
ALTER COLUMN "graded_at" SET NOT NULL,
ALTER COLUMN "graded_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "AssignmentSubmission" DROP COLUMN "content",
DROP COLUMN "file_url",
DROP COLUMN "plagiarism_score",
ADD COLUMN     "checked_at" TIMESTAMP(3),
ADD COLUMN     "file_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "file_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "final_marks" DOUBLE PRECISION,
ADD COLUMN     "grade_remarks" TEXT,
ADD COLUMN     "graded_at" TIMESTAMP(3),
ADD COLUMN     "graded_by" TEXT,
ADD COLUMN     "justify_reason" TEXT,
ADD COLUMN     "late_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "obtained_marks" DOUBLE PRECISION,
ADD COLUMN     "penalty_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "plagiarism_flag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "similarity_pct" DOUBLE PRECISION,
ADD COLUMN     "text_content" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "dept_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hall_ticket_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "seating_auto" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ExamMark" DROP COLUMN "grade",
ADD COLUMN     "exam_type" "ExamType" NOT NULL,
ADD COLUMN     "is_withheld" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "result_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ALTER COLUMN "marks_obtained" DROP DEFAULT,
ALTER COLUMN "max_marks" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExamRoom" DROP COLUMN "createdAt",
DROP COLUMN "invigilator_id",
ADD COLUMN     "invigilator_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "capacity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExamSchedule" ADD COLUMN     "branch_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "co_mapping" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "is_practical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "section_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ExamSeating" DROP COLUMN "is_present",
ADD COLUMN     "col_no" INTEGER,
ADD COLUMN     "is_manual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roll_no" TEXT,
ADD COLUMN     "row_no" INTEGER,
ADD COLUMN     "subject_id" TEXT;

-- AlterTable
ALTER TABLE "ExtraAttendance" DROP COLUMN "deleted_at",
ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "section_id" TEXT,
ALTER COLUMN "units" DROP DEFAULT,
ALTER COLUMN "granted_by" SET NOT NULL,
ALTER COLUMN "effective_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "FeeStructure" DROP COLUMN "deleted_at",
ADD COLUMN     "created_by" TEXT,
ALTER COLUMN "installments" SET DEFAULT 1,
ALTER COLUMN "components" SET NOT NULL;

-- AlterTable
ALTER TABLE "HallTicket" DROP COLUMN "createdAt",
DROP COLUMN "ineligibility_reason",
DROP COLUMN "is_eligible",
DROP COLUMN "issued_at",
ADD COLUMN     "downloaded_at" TIMESTAMP(3),
ADD COLUMN     "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "generated_by" TEXT,
ADD COLUMN     "invalidated_reason" TEXT,
ADD COLUMN     "is_valid" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "QuestionPaper" DROP COLUMN "is_approved",
ADD COLUMN     "co_mapping" JSONB,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "format_type" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "header_html" TEXT,
ADD COLUMN     "include_logo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "po_mapping" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "submitted_at" TIMESTAMP(3),
ADD COLUMN     "text_content" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SalaryComponent" ADD COLUMN     "created_by" TEXT,
ALTER COLUMN "type" DROP DEFAULT,
ALTER COLUMN "value" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SalarySlip" DROP COLUMN "basic_salary",
DROP COLUMN "payment_ref",
ADD COLUMN     "generated_at" TIMESTAMP(3),
ADD COLUMN     "paid_by" TEXT,
ADD COLUMN     "pdf_url" TEXT,
ALTER COLUMN "working_days" DROP DEFAULT,
ALTER COLUMN "present_days" DROP DEFAULT,
ALTER COLUMN "gross_salary" DROP DEFAULT,
ALTER COLUMN "total_deductions" DROP DEFAULT,
ALTER COLUMN "net_salary" DROP DEFAULT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "SalarySlipComponent" DROP COLUMN "is_deduction",
ADD COLUMN     "is_earning" BOOLEAN NOT NULL,
ALTER COLUMN "amount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Scholarship" DROP COLUMN "deleted_at",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "session_id" TEXT,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SkillCardEntry" DROP COLUMN "card_id",
DROP COLUMN "category",
DROP COLUMN "duration_hours",
DROP COLUMN "remarks",
ADD COLUMN     "co_mapping" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "entry_no" INTEGER NOT NULL,
ADD COLUMN     "skill_card_id" TEXT NOT NULL,
ADD COLUMN     "training_id" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'SELF_LEARNING',
ADD COLUMN     "verified_sign" TEXT,
ADD COLUMN     "year_no" INTEGER NOT NULL,
ALTER COLUMN "provider" SET NOT NULL;

-- AlterTable
ALTER TABLE "StudentLeaveApproval" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "StudentSkillCard" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "branch_id" TEXT,
ADD COLUMN     "domain_rank" INTEGER,
ADD COLUMN     "domain_track_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issued_at" TIMESTAMP(3),
ADD COLUMN     "issued_by" TEXT,
ADD COLUMN     "pdf_url" TEXT,
ADD COLUMN     "placement_score" DOUBLE PRECISION,
ADD COLUMN     "program_id" TEXT,
ALTER COLUMN "total_entries" SET DEFAULT 0,
ALTER COLUMN "readiness_level" DROP NOT NULL,
ALTER COLUMN "readiness_level" DROP DEFAULT,
ALTER COLUMN "last_updated" SET NOT NULL,
ALTER COLUMN "last_updated" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "MentorTrackRecord";

-- DropTable
DROP TABLE "OnlineCourseRecord";

-- DropTable
DROP TABLE "Training";

-- DropTable
DROP TABLE "TrainingAttendance";

-- DropTable
DROP TABLE "TrainingEnrollment";

-- DropTable
DROP TABLE "TrainingFeeTransaction";

-- DropTable
DROP TABLE "TrainingMentor";

-- DropTable
DROP TABLE "TrainingSection";

-- DropTable
DROP TABLE "TrainingTeamMember";

-- DropTable
DROP TABLE "TrainingUpdate";

-- DropEnum
DROP TYPE "EnrollmentStatus";

-- DropEnum
DROP TYPE "TrainingAttendanceType";

-- DropEnum
DROP TYPE "TrainingMode";

-- DropEnum
DROP TYPE "TrainingStatus";

-- DropEnum
DROP TYPE "TrainingType";

-- CreateIndex
CREATE INDEX "AcademicCalendarEvent_session_id_start_date_idx" ON "AcademicCalendarEvent"("session_id", "start_date");

-- CreateIndex
CREATE INDEX "AcademicCalendarEvent_event_type_idx" ON "AcademicCalendarEvent"("event_type");

-- CreateIndex
CREATE INDEX "AcademicCalendarEvent_is_holiday_idx" ON "AcademicCalendarEvent"("is_holiday");

-- CreateIndex
CREATE INDEX "AdminDeptScope_user_id_idx" ON "AdminDeptScope"("user_id");

-- CreateIndex
CREATE INDEX "AdminDeptScope_dept_id_idx" ON "AdminDeptScope"("dept_id");

-- CreateIndex
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");

-- CreateIndex
CREATE INDEX "Assignment_deadline_idx" ON "Assignment"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentGrade_submission_id_key" ON "AssignmentGrade"("submission_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_assignment_id_idx" ON "AssignmentGrade"("assignment_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_student_id_idx" ON "AssignmentGrade"("student_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_assignment_id_idx" ON "AssignmentSubmission"("assignment_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_student_id_idx" ON "AssignmentSubmission"("student_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_status_idx" ON "AssignmentSubmission"("status");

-- CreateIndex
CREATE INDEX "Exam_session_id_exam_type_idx" ON "Exam"("session_id", "exam_type");

-- CreateIndex
CREATE INDEX "Exam_status_idx" ON "Exam"("status");

-- CreateIndex
CREATE INDEX "Exam_start_date_idx" ON "Exam"("start_date");

-- CreateIndex
CREATE INDEX "ExamMark_exam_id_idx" ON "ExamMark"("exam_id");

-- CreateIndex
CREATE INDEX "ExamMark_student_id_idx" ON "ExamMark"("student_id");

-- CreateIndex
CREATE INDEX "ExamMark_subject_id_idx" ON "ExamMark"("subject_id");

-- CreateIndex
CREATE INDEX "ExamRoom_exam_id_exam_date_idx" ON "ExamRoom"("exam_id", "exam_date");

-- CreateIndex
CREATE INDEX "ExamSchedule_subject_id_idx" ON "ExamSchedule"("subject_id");

-- CreateIndex
CREATE INDEX "ExamSchedule_exam_date_idx" ON "ExamSchedule"("exam_date");

-- CreateIndex
CREATE INDEX "ExamSeating_student_id_idx" ON "ExamSeating"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSeating_exam_id_student_id_exam_date_key" ON "ExamSeating"("exam_id", "student_id", "exam_date");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSeating_exam_room_id_seat_no_exam_date_key" ON "ExamSeating"("exam_room_id", "seat_no", "exam_date");

-- CreateIndex
CREATE INDEX "ExtraAttendance_session_id_idx" ON "ExtraAttendance"("session_id");

-- CreateIndex
CREATE INDEX "ExtraAttendance_section_id_idx" ON "ExtraAttendance"("section_id");

-- CreateIndex
CREATE INDEX "FeeStructure_session_id_idx" ON "FeeStructure"("session_id");

-- CreateIndex
CREATE INDEX "FeeStructure_program_id_idx" ON "FeeStructure"("program_id");

-- CreateIndex
CREATE INDEX "FeeStructure_branch_id_idx" ON "FeeStructure"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "HallTicket_ticket_no_key" ON "HallTicket"("ticket_no");

-- CreateIndex
CREATE INDEX "HallTicket_exam_id_idx" ON "HallTicket"("exam_id");

-- CreateIndex
CREATE INDEX "HallTicket_student_id_idx" ON "HallTicket"("student_id");

-- CreateIndex
CREATE INDEX "QuestionPaper_exam_id_subject_id_idx" ON "QuestionPaper"("exam_id", "subject_id");

-- CreateIndex
CREATE INDEX "QuestionPaper_faculty_id_idx" ON "QuestionPaper"("faculty_id");

-- CreateIndex
CREATE INDEX "SalaryComponent_type_is_active_idx" ON "SalaryComponent"("type", "is_active");

-- CreateIndex
CREATE INDEX "SalarySlip_month_year_idx" ON "SalarySlip"("month", "year");

-- CreateIndex
CREATE INDEX "SalarySlip_status_idx" ON "SalarySlip"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalarySlipComponent_slip_id_component_id_key" ON "SalarySlipComponent"("slip_id", "component_id");

-- CreateIndex
CREATE INDEX "Scholarship_type_idx" ON "Scholarship"("type");

-- CreateIndex
CREATE INDEX "Scholarship_is_active_idx" ON "Scholarship"("is_active");

-- CreateIndex
CREATE INDEX "SkillCardEntry_skill_card_id_idx" ON "SkillCardEntry"("skill_card_id");

-- CreateIndex
CREATE INDEX "SkillCardEntry_student_id_year_no_semester_no_idx" ON "SkillCardEntry"("student_id", "year_no", "semester_no");

-- CreateIndex
CREATE INDEX "SkillCardEntry_is_completed_idx" ON "SkillCardEntry"("is_completed");

-- CreateIndex
CREATE INDEX "SkillCardEntry_is_verified_idx" ON "SkillCardEntry"("is_verified");

-- CreateIndex
CREATE INDEX "StudentLeaveApproval_approver_id_status_idx" ON "StudentLeaveApproval"("approver_id", "status");

-- CreateIndex
CREATE INDEX "StudentSkillCard_student_id_idx" ON "StudentSkillCard"("student_id");

-- CreateIndex
CREATE INDEX "StudentSkillCard_branch_id_idx" ON "StudentSkillCard"("branch_id");

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "AssignmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCardEntry" ADD CONSTRAINT "SkillCardEntry_skill_card_id_fkey" FOREIGN KEY ("skill_card_id") REFERENCES "StudentSkillCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
