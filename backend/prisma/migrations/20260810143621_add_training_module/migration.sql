-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('MANDATORY', 'ELECTIVE', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "TrainingMode" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID', 'WORKSHOP', 'SEMINAR', 'INTERNSHIP', 'GUEST_LECTURE', 'BOOTCAMP');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ONGOING', 'COMPLETED', 'CANCELLED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'WAIVED');

-- CreateEnum
CREATE TYPE "TrainingAttendanceType" AS ENUM ('REGULAR', 'EXTRA', 'IRREGULAR');

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "TrainingType" NOT NULL DEFAULT 'MANDATORY',
    "mode" "TrainingMode" NOT NULL DEFAULT 'OFFLINE',
    "status" "TrainingStatus" NOT NULL DEFAULT 'DRAFT',
    "dept_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "venue" TEXT,
    "room_id" TEXT,
    "online_link" TEXT,
    "has_fee" BOOLEAN NOT NULL DEFAULT false,
    "fee_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fee_currency" TEXT NOT NULL DEFAULT 'INR',
    "fee_due_date" TIMESTAMP(3),
    "refund_policy" TEXT,
    "refund_on_completion" BOOLEAN NOT NULL DEFAULT false,
    "refund_on_attendance" BOOLEAN NOT NULL DEFAULT false,
    "refund_attendance_pct" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "attendance_unit_type" TEXT NOT NULL DEFAULT 'REGULAR',
    "extra_attendance_units" INTEGER NOT NULL DEFAULT 0,
    "attendance_pct_required" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "max_enrollments" INTEGER,
    "elective_deadline" TIMESTAMP(3),
    "timetable_slot_id" TEXT,
    "special_session_id" TEXT,
    "created_by" TEXT,
    "cancelled_by" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "deactivated_by" TEXT,
    "deactivated_at" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingMentor" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MENTOR',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_by" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "TrainingMentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSection" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "assigned_by" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEnrollment" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "enrolled_by" TEXT,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "dropped_at" TIMESTAMP(3),
    "drop_reason" TEXT,
    "fee_status" "FeeStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "fee_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fee_paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fee_paid_at" TIMESTAMP(3),
    "fee_paid_by" TEXT,
    "fee_receipt_no" TEXT,
    "refund_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refund_at" TIMESTAMP(3),
    "refund_reason" TEXT,
    "refund_by" TEXT,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "attended_sessions" INTEGER NOT NULL DEFAULT 0,
    "attendance_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_units_granted" INTEGER NOT NULL DEFAULT 0,
    "extra_units_granted_at" TIMESTAMP(3),
    "extra_units_granted_by" TEXT,
    "completion_note" TEXT,
    "certificate_url" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingFeeTransaction" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PAYMENT',
    "amount" DOUBLE PRECISION NOT NULL,
    "receipt_no" TEXT,
    "remarks" TEXT,
    "recorded_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingFeeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "session_label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "attendance_type" "TrainingAttendanceType" NOT NULL DEFAULT 'REGULAR',
    "marked_by" TEXT,
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineCourseRecord" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "platform" TEXT,
    "course_name" TEXT NOT NULL,
    "course_url" TEXT,
    "certificate_url" TEXT,
    "completion_date" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "duration_hours" DOUBLE PRECISION,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "attendance_credited" BOOLEAN NOT NULL DEFAULT false,
    "units_credited" INTEGER NOT NULL DEFAULT 0,
    "credited_by" TEXT,
    "credited_at" TIMESTAMP(3),
    "credited_to_session" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineCourseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingUpdate" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "mentor_id" TEXT,
    "posted_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingTeamMember" (
    "id" TEXT NOT NULL,
    "training_id" TEXT,
    "user_id" TEXT NOT NULL,
    "faculty_id" TEXT,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_all" BOOLEAN NOT NULL DEFAULT false,
    "can_view_reports" BOOLEAN NOT NULL DEFAULT true,
    "allowed_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "granted_by" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "TrainingTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorTrackRecord" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "session_id" TEXT,
    "total_trainings" INTEGER NOT NULL DEFAULT 0,
    "active_trainings" INTEGER NOT NULL DEFAULT 0,
    "completed_trainings" INTEGER NOT NULL DEFAULT 0,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "completed_students" INTEGER NOT NULL DEFAULT 0,
    "avg_attendance_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_hours_given" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updates_posted" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3),
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB,

    CONSTRAINT "MentorTrackRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Training_code_key" ON "Training"("code");

-- CreateIndex
CREATE INDEX "Training_session_id_idx" ON "Training"("session_id");

-- CreateIndex
CREATE INDEX "Training_dept_id_idx" ON "Training"("dept_id");

-- CreateIndex
CREATE INDEX "Training_status_idx" ON "Training"("status");

-- CreateIndex
CREATE INDEX "Training_type_idx" ON "Training"("type");

-- CreateIndex
CREATE INDEX "Training_start_date_idx" ON "Training"("start_date");

-- CreateIndex
CREATE INDEX "TrainingMentor_training_id_idx" ON "TrainingMentor"("training_id");

-- CreateIndex
CREATE INDEX "TrainingMentor_faculty_id_idx" ON "TrainingMentor"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMentor_training_id_faculty_id_key" ON "TrainingMentor"("training_id", "faculty_id");

-- CreateIndex
CREATE INDEX "TrainingSection_training_id_idx" ON "TrainingSection"("training_id");

-- CreateIndex
CREATE INDEX "TrainingSection_section_id_idx" ON "TrainingSection"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSection_training_id_section_id_key" ON "TrainingSection"("training_id", "section_id");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_training_id_idx" ON "TrainingEnrollment"("training_id");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_student_id_idx" ON "TrainingEnrollment"("student_id");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_status_idx" ON "TrainingEnrollment"("status");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_fee_status_idx" ON "TrainingEnrollment"("fee_status");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingEnrollment_training_id_student_id_key" ON "TrainingEnrollment"("training_id", "student_id");

-- CreateIndex
CREATE INDEX "TrainingFeeTransaction_enrollment_id_idx" ON "TrainingFeeTransaction"("enrollment_id");

-- CreateIndex
CREATE INDEX "TrainingAttendance_training_id_date_idx" ON "TrainingAttendance"("training_id", "date");

-- CreateIndex
CREATE INDEX "TrainingAttendance_student_id_idx" ON "TrainingAttendance"("student_id");

-- CreateIndex
CREATE INDEX "TrainingAttendance_enrollment_id_idx" ON "TrainingAttendance"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttendance_training_id_student_id_date_session_labe_key" ON "TrainingAttendance"("training_id", "student_id", "date", "session_label");

-- CreateIndex
CREATE INDEX "OnlineCourseRecord_training_id_idx" ON "OnlineCourseRecord"("training_id");

-- CreateIndex
CREATE INDEX "OnlineCourseRecord_student_id_idx" ON "OnlineCourseRecord"("student_id");

-- CreateIndex
CREATE INDEX "OnlineCourseRecord_is_verified_idx" ON "OnlineCourseRecord"("is_verified");

-- CreateIndex
CREATE INDEX "TrainingUpdate_training_id_idx" ON "TrainingUpdate"("training_id");

-- CreateIndex
CREATE INDEX "TrainingUpdate_createdAt_idx" ON "TrainingUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "TrainingTeamMember_user_id_idx" ON "TrainingTeamMember"("user_id");

-- CreateIndex
CREATE INDEX "TrainingTeamMember_faculty_id_idx" ON "TrainingTeamMember"("faculty_id");

-- CreateIndex
CREATE INDEX "TrainingTeamMember_training_id_idx" ON "TrainingTeamMember"("training_id");

-- CreateIndex
CREATE INDEX "MentorTrackRecord_faculty_id_idx" ON "MentorTrackRecord"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "MentorTrackRecord_faculty_id_session_id_key" ON "MentorTrackRecord"("faculty_id", "session_id");

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMentor" ADD CONSTRAINT "TrainingMentor_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMentor" ADD CONSTRAINT "TrainingMentor_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSection" ADD CONSTRAINT "TrainingSection_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSection" ADD CONSTRAINT "TrainingSection_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFeeTransaction" ADD CONSTRAINT "TrainingFeeTransaction_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineCourseRecord" ADD CONSTRAINT "OnlineCourseRecord_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "Training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineCourseRecord" ADD CONSTRAINT "OnlineCourseRecord_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingUpdate" ADD CONSTRAINT "TrainingUpdate_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingUpdate" ADD CONSTRAINT "TrainingUpdate_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "TrainingMentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingTeamMember" ADD CONSTRAINT "TrainingTeamMember_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;
