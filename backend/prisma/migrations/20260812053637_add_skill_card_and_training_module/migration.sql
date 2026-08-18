-- ============================================================
-- Phase 1 Migration — EIT ERP V3
-- Safe version: uses IF NOT EXISTS everywhere
-- ============================================================

-- CreateEnums (safe — check before create)
DO $$ BEGIN
  CREATE TYPE "LeaveApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FORWARDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExamType" AS ENUM ('CLASS_TEST', 'SESSIONAL_1', 'SESSIONAL_2', 'MID_TERM', 'PRE_UNIVERSITY', 'UNIVERSITY_THEORY', 'UNIVERSITY_PRACTICAL', 'INTERNAL_PRACTICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'LATE', 'GRADED', 'FLAGGED', 'RESUBMIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SalaryStatus" AS ENUM ('DRAFT', 'GENERATED', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CalendarEventType" AS ENUM ('HOLIDAY', 'EXAM', 'EVENT', 'FESTIVAL', 'SPORTS', 'CULTURAL', 'ACADEMIC', 'LEAVE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── CREATE TABLES (all with IF NOT EXISTS) ────────────────────

CREATE TABLE IF NOT EXISTS "AcademicCalendarEvent" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" "CalendarEventType" NOT NULL DEFAULT 'EVENT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_holiday" BOOLEAN NOT NULL DEFAULT false,
    "affects_attendance" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'INSTITUTE',
    "dept_id" TEXT,
    "section_id" TEXT,
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExtraAttendance" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "subject_id" TEXT,
    "units" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'EXTRA',
    "reason" TEXT NOT NULL,
    "granted_by" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_date" DATE,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "ExtraAttendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentLeaveApproval" (
    "id" TEXT NOT NULL,
    "leave_id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "approver_id" TEXT,
    "status" "LeaveApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "acted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentLeaveApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "subject_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "section_id" TEXT,
    "session_id" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "max_marks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passing_marks" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "allow_late" BOOLEAN NOT NULL DEFAULT false,
    "late_penalty_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "attachment_url" TEXT,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "content" TEXT,
    "file_url" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "plagiarism_score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssignmentGrade" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "submission_id" TEXT,
    "student_id" TEXT NOT NULL,
    "marks_obtained" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grade" TEXT,
    "feedback" TEXT,
    "graded_by" TEXT,
    "graded_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssignmentGrade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "exam_type" "ExamType" NOT NULL,
    "session_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "result_published" BOOLEAN NOT NULL DEFAULT false,
    "result_published_at" TIMESTAMP(3),
    "instructions" TEXT,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExamSchedule" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "exam_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "max_marks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passing_marks" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "duration_mins" INTEGER NOT NULL DEFAULT 180,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExamRoom" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "exam_date" DATE NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "invigilator_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExamSeating" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "seat_no" TEXT NOT NULL,
    "exam_date" DATE NOT NULL,
    "is_present" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamSeating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HallTicket" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "ticket_no" TEXT NOT NULL,
    "is_eligible" BOOLEAN NOT NULL DEFAULT true,
    "ineligibility_reason" TEXT,
    "issued_at" TIMESTAMP(3),
    "pdf_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HallTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuestionPaper" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionPaper_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExamMark" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "marks_obtained" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_marks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "is_absent" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT,
    "remarks" TEXT,
    "entered_by" TEXT,
    "verified_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamMark_pkey" PRIMARY KEY ("id")
);

-- Scholarship BEFORE FeePayment
CREATE TABLE IF NOT EXISTS "Scholarship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MERIT',
    "amount_type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "amount" DOUBLE PRECISION NOT NULL,
    "max_amount" DOUBLE PRECISION,
    "eligibility" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- FeeStructure BEFORE FeePayment
CREATE TABLE IF NOT EXISTS "FeeStructure" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "program_id" TEXT,
    "branch_id" TEXT,
    "semester" INTEGER,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 2,
    "components" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- FeePayment AFTER Scholarship AND FeeStructure
CREATE TABLE IF NOT EXISTS "FeePayment" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_structure_id" TEXT,
    "session_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due_amount" DOUBLE PRECISION NOT NULL,
    "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "installment_no" INTEGER NOT NULL DEFAULT 1,
    "installment_due_date" DATE,
    "payment_date" DATE,
    "payment_mode" TEXT,
    "receipt_no" TEXT,
    "transaction_ref" TEXT,
    "bank_ref" TEXT,
    "scholarship_id" TEXT,
    "waiver_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waiver_reason" TEXT,
    "received_by" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,
    "receipt_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SalaryComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EARNING',
    "calc_type" TEXT NOT NULL DEFAULT 'FIXED',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_taxable" BOOLEAN NOT NULL DEFAULT false,
    "is_statutory" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SalarySlip" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "working_days" INTEGER NOT NULL DEFAULT 26,
    "present_days" INTEGER NOT NULL DEFAULT 26,
    "lop_days" INTEGER NOT NULL DEFAULT 0,
    "basic_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gross_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "SalaryStatus" NOT NULL DEFAULT 'GENERATED',
    "generated_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "payment_ref" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalarySlip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SalarySlipComponent" (
    "id" TEXT NOT NULL,
    "slip_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_deduction" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SalarySlipComponent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentSkillCard" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "batch_year" INTEGER,
    "domain_track" TEXT,
    "total_entries" INTEGER NOT NULL DEFAULT 62,
    "completed_entries" INTEGER NOT NULL DEFAULT 0,
    "readiness_level" TEXT NOT NULL DEFAULT 'FOUNDATIONAL',
    "last_updated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentSkillCard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SkillCardEntry" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "semester_no" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "provider" TEXT,
    "duration_hours" INTEGER,
    "course_url" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completion_date" DATE,
    "certificate_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SkillCardEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminDeptScope" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dept_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DEPT_ADMIN',
    "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "granted_by" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    CONSTRAINT "AdminDeptScope_pkey" PRIMARY KEY ("id")
);

-- ── ALTER (safe) ──────────────────────────────────────────────
ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "basic_salary" DOUBLE PRECISION;

-- ── INDEXES (safe) ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "AcademicCalendarEvent_session_id_idx" ON "AcademicCalendarEvent"("session_id");
CREATE INDEX IF NOT EXISTS "AcademicCalendarEvent_start_date_idx" ON "AcademicCalendarEvent"("start_date");
CREATE INDEX IF NOT EXISTS "ExtraAttendance_student_id_idx" ON "ExtraAttendance"("student_id");
CREATE INDEX IF NOT EXISTS "StudentLeaveApproval_leave_id_idx" ON "StudentLeaveApproval"("leave_id");
CREATE INDEX IF NOT EXISTS "Assignment_subject_id_idx" ON "Assignment"("subject_id");
CREATE INDEX IF NOT EXISTS "Assignment_faculty_id_idx" ON "Assignment"("faculty_id");
CREATE INDEX IF NOT EXISTS "Assignment_session_id_idx" ON "Assignment"("session_id");
CREATE UNIQUE INDEX IF NOT EXISTS "AssignmentSubmission_assignment_id_student_id_key" ON "AssignmentSubmission"("assignment_id", "student_id");
CREATE UNIQUE INDEX IF NOT EXISTS "AssignmentGrade_assignment_id_student_id_key" ON "AssignmentGrade"("assignment_id", "student_id");
CREATE INDEX IF NOT EXISTS "Exam_session_id_idx" ON "Exam"("session_id");
CREATE INDEX IF NOT EXISTS "ExamSchedule_exam_id_idx" ON "ExamSchedule"("exam_id");
CREATE INDEX IF NOT EXISTS "ExamSeating_exam_id_idx" ON "ExamSeating"("exam_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ExamSeating_exam_room_id_seat_no_key" ON "ExamSeating"("exam_room_id", "seat_no");
CREATE UNIQUE INDEX IF NOT EXISTS "HallTicket_exam_id_student_id_key" ON "HallTicket"("exam_id", "student_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ExamMark_exam_id_student_id_subject_id_key" ON "ExamMark"("exam_id", "student_id", "subject_id");
CREATE UNIQUE INDEX IF NOT EXISTS "Scholarship_code_key" ON "Scholarship"("code");
CREATE INDEX IF NOT EXISTS "FeePayment_student_id_idx" ON "FeePayment"("student_id");
CREATE INDEX IF NOT EXISTS "FeePayment_session_id_idx" ON "FeePayment"("session_id");
CREATE INDEX IF NOT EXISTS "FeePayment_status_idx" ON "FeePayment"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "SalaryComponent_code_key" ON "SalaryComponent"("code");
CREATE INDEX IF NOT EXISTS "SalarySlip_faculty_id_idx" ON "SalarySlip"("faculty_id");
CREATE UNIQUE INDEX IF NOT EXISTS "SalarySlip_faculty_id_month_year_key" ON "SalarySlip"("faculty_id", "month", "year");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentSkillCard_student_id_key" ON "StudentSkillCard"("student_id");
CREATE INDEX IF NOT EXISTS "SkillCardEntry_card_id_idx" ON "SkillCardEntry"("card_id");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminDeptScope_user_id_dept_id_key" ON "AdminDeptScope"("user_id", "dept_id");

-- ── FOREIGN KEYS (safe) ───────────────────────────────────────
ALTER TABLE "AcademicCalendarEvent" DROP CONSTRAINT IF EXISTS "AcademicCalendarEvent_session_id_fkey";
ALTER TABLE "AcademicCalendarEvent" ADD CONSTRAINT "AcademicCalendarEvent_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExtraAttendance" DROP CONSTRAINT IF EXISTS "ExtraAttendance_student_id_fkey";
ALTER TABLE "ExtraAttendance" ADD CONSTRAINT "ExtraAttendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExtraAttendance" DROP CONSTRAINT IF EXISTS "ExtraAttendance_session_id_fkey";
ALTER TABLE "ExtraAttendance" ADD CONSTRAINT "ExtraAttendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentLeaveApproval" DROP CONSTRAINT IF EXISTS "StudentLeaveApproval_leave_id_fkey";
ALTER TABLE "StudentLeaveApproval" ADD CONSTRAINT "StudentLeaveApproval_leave_id_fkey" FOREIGN KEY ("leave_id") REFERENCES "StudentLeave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assignment" DROP CONSTRAINT IF EXISTS "Assignment_subject_id_fkey";
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Assignment" DROP CONSTRAINT IF EXISTS "Assignment_faculty_id_fkey";
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Assignment" DROP CONSTRAINT IF EXISTS "Assignment_session_id_fkey";
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AssignmentSubmission" DROP CONSTRAINT IF EXISTS "AssignmentSubmission_assignment_id_fkey";
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssignmentSubmission" DROP CONSTRAINT IF EXISTS "AssignmentSubmission_student_id_fkey";
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssignmentGrade" DROP CONSTRAINT IF EXISTS "AssignmentGrade_assignment_id_fkey";
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssignmentGrade" DROP CONSTRAINT IF EXISTS "AssignmentGrade_student_id_fkey";
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Exam" DROP CONSTRAINT IF EXISTS "Exam_session_id_fkey";
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExamSchedule" DROP CONSTRAINT IF EXISTS "ExamSchedule_exam_id_fkey";
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamSchedule" DROP CONSTRAINT IF EXISTS "ExamSchedule_subject_id_fkey";
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExamRoom" DROP CONSTRAINT IF EXISTS "ExamRoom_exam_id_fkey";
ALTER TABLE "ExamRoom" ADD CONSTRAINT "ExamRoom_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamRoom" DROP CONSTRAINT IF EXISTS "ExamRoom_room_id_fkey";
ALTER TABLE "ExamRoom" ADD CONSTRAINT "ExamRoom_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExamSeating" DROP CONSTRAINT IF EXISTS "ExamSeating_exam_id_fkey";
ALTER TABLE "ExamSeating" ADD CONSTRAINT "ExamSeating_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamSeating" DROP CONSTRAINT IF EXISTS "ExamSeating_exam_room_id_fkey";
ALTER TABLE "ExamSeating" ADD CONSTRAINT "ExamSeating_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "ExamRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamSeating" DROP CONSTRAINT IF EXISTS "ExamSeating_student_id_fkey";
ALTER TABLE "ExamSeating" ADD CONSTRAINT "ExamSeating_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HallTicket" DROP CONSTRAINT IF EXISTS "HallTicket_exam_id_fkey";
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HallTicket" DROP CONSTRAINT IF EXISTS "HallTicket_student_id_fkey";
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionPaper" DROP CONSTRAINT IF EXISTS "QuestionPaper_exam_id_fkey";
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionPaper" DROP CONSTRAINT IF EXISTS "QuestionPaper_subject_id_fkey";
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuestionPaper" DROP CONSTRAINT IF EXISTS "QuestionPaper_faculty_id_fkey";
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExamMark" DROP CONSTRAINT IF EXISTS "ExamMark_exam_id_fkey";
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamMark" DROP CONSTRAINT IF EXISTS "ExamMark_student_id_fkey";
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamMark" DROP CONSTRAINT IF EXISTS "ExamMark_subject_id_fkey";
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeeStructure" DROP CONSTRAINT IF EXISTS "FeeStructure_session_id_fkey";
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeePayment" DROP CONSTRAINT IF EXISTS "FeePayment_student_id_fkey";
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeePayment" DROP CONSTRAINT IF EXISTS "FeePayment_fee_structure_id_fkey";
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FeePayment" DROP CONSTRAINT IF EXISTS "FeePayment_session_id_fkey";
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeePayment" DROP CONSTRAINT IF EXISTS "FeePayment_scholarship_id_fkey";
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "Scholarship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SalarySlip" DROP CONSTRAINT IF EXISTS "SalarySlip_faculty_id_fkey";
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SalarySlipComponent" DROP CONSTRAINT IF EXISTS "SalarySlipComponent_slip_id_fkey";
ALTER TABLE "SalarySlipComponent" ADD CONSTRAINT "SalarySlipComponent_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "SalarySlip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SalarySlipComponent" DROP CONSTRAINT IF EXISTS "SalarySlipComponent_component_id_fkey";
ALTER TABLE "SalarySlipComponent" ADD CONSTRAINT "SalarySlipComponent_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentSkillCard" DROP CONSTRAINT IF EXISTS "StudentSkillCard_student_id_fkey";
ALTER TABLE "StudentSkillCard" ADD CONSTRAINT "StudentSkillCard_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillCardEntry" DROP CONSTRAINT IF EXISTS "SkillCardEntry_card_id_fkey";
ALTER TABLE "SkillCardEntry" ADD CONSTRAINT "SkillCardEntry_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "StudentSkillCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillCardEntry" DROP CONSTRAINT IF EXISTS "SkillCardEntry_student_id_fkey";
ALTER TABLE "SkillCardEntry" ADD CONSTRAINT "SkillCardEntry_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminDeptScope" DROP CONSTRAINT IF EXISTS "AdminDeptScope_dept_id_fkey";
ALTER TABLE "AdminDeptScope" ADD CONSTRAINT "AdminDeptScope_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
