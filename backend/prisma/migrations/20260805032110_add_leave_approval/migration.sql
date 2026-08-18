/*
  Warnings:

  - You are about to drop the column `leave_id` on the `LeaveApprovalStep` table. All the data in the column will be lost.
  - Added the required column `application_id` to the `LeaveApprovalStep` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LeaveApprovalStep" DROP CONSTRAINT "LeaveApprovalStep_leave_id_fkey";

-- DropIndex
DROP INDEX "LeaveApprovalStep_approver_id_idx";

-- DropIndex
DROP INDEX "LeaveApprovalStep_leave_id_idx";

-- DropIndex
DROP INDEX "LeaveApprovalStep_status_idx";

-- AlterTable
ALTER TABLE "LeaveApprovalStep" DROP COLUMN "leave_id",
ADD COLUMN     "application_id" TEXT NOT NULL,
ADD COLUMN     "approver_role" TEXT,
ADD COLUMN     "leaveRequestId" TEXT,
ADD COLUMN     "notified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicable_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_days_per_year" INTEGER NOT NULL DEFAULT 0,
    "carry_forward" BOOLEAN NOT NULL DEFAULT false,
    "carry_forward_max" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "requires_document" BOOLEAN NOT NULL DEFAULT false,
    "min_days" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "max_consecutive" INTEGER,
    "notice_days" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contract_types" TEXT[],
    "employee_types" TEXT[],
    "sat_off_rule" TEXT NOT NULL DEFAULT 'NONE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "accepted_by" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "terms_text" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicyRule" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "days_per_year" INTEGER NOT NULL,
    "carry_forward" BOOLEAN NOT NULL DEFAULT false,
    "carry_forward_max" INTEGER,

    CONSTRAINT "LeavePolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyLeavePolicy" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMP(3),
    "assigned_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyLeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "total_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pending_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carried_forward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApprovalWorkflow" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "total_days" DOUBLE PRECISION NOT NULL,
    "half_day" BOOLEAN NOT NULL DEFAULT false,
    "half_day_period" TEXT,
    "reason" TEXT NOT NULL,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "policy_accepted" BOOLEAN NOT NULL DEFAULT false,
    "policy_version" INTEGER,
    "remarks" TEXT,
    "rejection_reason" TEXT,
    "cancelled_by" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveSubstitution" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "entry_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "period_name" TEXT NOT NULL,
    "subject_name" TEXT,
    "original_id" TEXT NOT NULL,
    "substitute_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMP(3),
    "response_note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveSubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLeave" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceFreezeRule" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'INSTITUTE',
    "scope_id" TEXT,
    "is_frozen" BOOLEAN NOT NULL DEFAULT false,
    "frozen_by" TEXT,
    "frozen_at" TIMESTAMP(3),
    "freeze_reason" TEXT,
    "unfrozen_by" TEXT,
    "unfrozen_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceFreezeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttendance" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "faculty_id" TEXT,
    "date" DATE NOT NULL,
    "period_name" TEXT NOT NULL,
    "period_config_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "late_reason" TEXT,
    "late_approved_by" TEXT,
    "late_approved_at" TIMESTAMP(3),
    "marked_by" TEXT,
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_frozen" BOOLEAN NOT NULL DEFAULT false,
    "back_entry" BOOLEAN NOT NULL DEFAULT false,
    "back_entry_reason" TEXT,
    "back_entry_by" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "facultyId" TEXT,

    CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyAttendance" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "in_time" TIMESTAMP(3),
    "out_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "source" TEXT NOT NULL DEFAULT 'BIOMETRIC',
    "device_id" TEXT,
    "raw_logs" JSONB,
    "remarks" TEXT,
    "marked_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableGenConfig" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "dept_id" TEXT,
    "theory_periods_per_week" INTEGER NOT NULL DEFAULT 1,
    "lab_periods_per_week" INTEGER NOT NULL DEFAULT 2,
    "lab_consecutive" BOOLEAN NOT NULL DEFAULT true,
    "allow_combined_sections" BOOLEAN NOT NULL DEFAULT false,
    "combined_rules" JSONB,
    "working_days" TEXT[] DEFAULT ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']::TEXT[],
    "max_periods_per_day" INTEGER NOT NULL DEFAULT 8,
    "generated_at" TIMESTAMP(3),
    "generated_by" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableGenConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseStructure" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "unit_no" INTEGER NOT NULL,
    "unit_title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "sub_topic" TEXT,
    "planned_hours" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_covered" BOOLEAN NOT NULL DEFAULT false,
    "covered_on" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicTaught" (
    "id" TEXT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "period_name" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "course_topic_id" TEXT,
    "topic_text" TEXT NOT NULL,
    "sub_topic" TEXT,
    "teaching_method" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicTaught_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialSession" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SEMINAR',
    "organizer" TEXT,
    "venue" TEXT,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "from_time" TEXT,
    "to_time" TEXT,
    "attendance_counts_as" TEXT NOT NULL DEFAULT 'PRESENT',
    "section_ids" TEXT[],
    "faculty_ids" TEXT[],
    "created_by" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialSessionAttendance" (
    "id" TEXT NOT NULL,
    "special_session_id" TEXT NOT NULL,
    "student_id" TEXT,
    "faculty_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "marked_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialSessionAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "report_date" DATE NOT NULL,
    "report_type" TEXT NOT NULL,
    "faculty_id" TEXT,
    "student_id" TEXT,
    "section_id" TEXT,
    "dept_id" TEXT,
    "branch_id" TEXT,
    "program_id" TEXT,
    "session_id" TEXT,
    "data" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" TEXT,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_code_key" ON "LeaveType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_name_key" ON "LeavePolicy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicyRule_policy_id_leave_type_id_key" ON "LeavePolicyRule"("policy_id", "leave_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyLeavePolicy_faculty_id_key" ON "FacultyLeavePolicy"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_faculty_id_leave_type_id_academic_year_key" ON "LeaveBalance"("faculty_id", "leave_type_id", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApprovalWorkflow_faculty_id_key" ON "LeaveApprovalWorkflow"("faculty_id");

-- CreateIndex
CREATE INDEX "LeaveApplication_faculty_id_status_idx" ON "LeaveApplication"("faculty_id", "status");

-- CreateIndex
CREATE INDEX "LeaveApplication_from_date_to_date_idx" ON "LeaveApplication"("from_date", "to_date");

-- CreateIndex
CREATE INDEX "LeaveSubstitution_application_id_idx" ON "LeaveSubstitution"("application_id");

-- CreateIndex
CREATE INDEX "LeaveSubstitution_substitute_id_status_idx" ON "LeaveSubstitution"("substitute_id", "status");

-- CreateIndex
CREATE INDEX "StudentLeave_student_id_status_idx" ON "StudentLeave"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceFreezeRule_session_id_scope_scope_id_key" ON "AttendanceFreezeRule"("session_id", "scope", "scope_id");

-- CreateIndex
CREATE INDEX "StudentAttendance_student_id_session_id_idx" ON "StudentAttendance"("student_id", "session_id");

-- CreateIndex
CREATE INDEX "StudentAttendance_section_id_date_idx" ON "StudentAttendance"("section_id", "date");

-- CreateIndex
CREATE INDEX "StudentAttendance_subject_id_session_id_idx" ON "StudentAttendance"("subject_id", "session_id");

-- CreateIndex
CREATE INDEX "StudentAttendance_date_idx" ON "StudentAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_session_id_section_id_subject_id_student__key" ON "StudentAttendance"("session_id", "section_id", "subject_id", "student_id", "date", "period_name");

-- CreateIndex
CREATE INDEX "FacultyAttendance_faculty_id_date_idx" ON "FacultyAttendance"("faculty_id", "date");

-- CreateIndex
CREATE INDEX "FacultyAttendance_date_idx" ON "FacultyAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyAttendance_faculty_id_date_key" ON "FacultyAttendance"("faculty_id", "date");

-- CreateIndex
CREATE INDEX "CourseStructure_faculty_id_subject_id_section_id_idx" ON "CourseStructure"("faculty_id", "subject_id", "section_id");

-- CreateIndex
CREATE INDEX "TopicTaught_faculty_id_attendance_date_idx" ON "TopicTaught"("faculty_id", "attendance_date");

-- CreateIndex
CREATE INDEX "TopicTaught_section_id_attendance_date_idx" ON "TopicTaught"("section_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "TopicTaught_attendance_date_period_name_faculty_id_subject__key" ON "TopicTaught"("attendance_date", "period_name", "faculty_id", "subject_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialSessionAttendance_special_session_id_student_id_key" ON "SpecialSessionAttendance"("special_session_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialSessionAttendance_special_session_id_faculty_id_key" ON "SpecialSessionAttendance"("special_session_id", "faculty_id");

-- CreateIndex
CREATE INDEX "DailyReport_report_date_idx" ON "DailyReport"("report_date");

-- CreateIndex
CREATE INDEX "DailyReport_report_type_report_date_idx" ON "DailyReport"("report_type", "report_date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_report_date_report_type_faculty_id_key" ON "DailyReport"("report_date", "report_type", "faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_report_date_report_type_student_id_key" ON "DailyReport"("report_date", "report_type", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_report_date_report_type_section_id_key" ON "DailyReport"("report_date", "report_type", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_report_date_report_type_dept_id_key" ON "DailyReport"("report_date", "report_type", "dept_id");

-- CreateIndex
CREATE INDEX "LeaveApprovalStep_application_id_idx" ON "LeaveApprovalStep"("application_id");

-- CreateIndex
CREATE INDEX "LeaveApprovalStep_approver_id_status_idx" ON "LeaveApprovalStep"("approver_id", "status");

-- AddForeignKey
ALTER TABLE "LeavePolicyRule" ADD CONSTRAINT "LeavePolicyRule_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "LeavePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicyRule" ADD CONSTRAINT "LeavePolicyRule_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyLeavePolicy" ADD CONSTRAINT "FacultyLeavePolicy_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyLeavePolicy" ADD CONSTRAINT "FacultyLeavePolicy_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "LeavePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApprovalWorkflow" ADD CONSTRAINT "LeaveApprovalWorkflow_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApprovalStep" ADD CONSTRAINT "LeaveApprovalStep_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "LeaveApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApprovalStep" ADD CONSTRAINT "LeaveApprovalStep_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveSubstitution" ADD CONSTRAINT "LeaveSubstitution_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "LeaveApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveSubstitution" ADD CONSTRAINT "LeaveSubstitution_original_id_fkey" FOREIGN KEY ("original_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveSubstitution" ADD CONSTRAINT "LeaveSubstitution_substitute_id_fkey" FOREIGN KEY ("substitute_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLeave" ADD CONSTRAINT "StudentLeave_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceFreezeRule" ADD CONSTRAINT "AttendanceFreezeRule_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyAttendance" ADD CONSTRAINT "FacultyAttendance_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseStructure" ADD CONSTRAINT "CourseStructure_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseStructure" ADD CONSTRAINT "CourseStructure_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseStructure" ADD CONSTRAINT "CourseStructure_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseStructure" ADD CONSTRAINT "CourseStructure_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicTaught" ADD CONSTRAINT "TopicTaught_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicTaught" ADD CONSTRAINT "TopicTaught_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicTaught" ADD CONSTRAINT "TopicTaught_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicTaught" ADD CONSTRAINT "TopicTaught_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialSession" ADD CONSTRAINT "SpecialSession_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialSessionAttendance" ADD CONSTRAINT "SpecialSessionAttendance_special_session_id_fkey" FOREIGN KEY ("special_session_id") REFERENCES "SpecialSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
