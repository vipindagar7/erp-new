-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LEAVE_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'LEAVE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'LEAVE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_TASK';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_POLL';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_NOTICE';
ALTER TYPE "NotificationType" ADD VALUE 'STATUS_CHANGED';

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "description" TEXT,
ADD COLUMN     "intake_capacity" INTEGER,
ADD COLUMN     "total_semesters_override" INTEGER;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "description" TEXT,
ADD COLUMN     "established_year" INTEGER,
ADD COLUMN     "hod_id" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rooms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "exit_reason" TEXT,
ADD COLUMN     "is_teaching" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "resignation_date" TIMESTAMP(3),
ADD COLUMN     "retirement_date" TIMESTAMP(3),
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "FacultyCareerHistory" ADD COLUMN     "changed_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "effective_date" TIMESTAMP(3),
ADD COLUMN     "new_data" JSONB,
ADD COLUMN     "new_dept_id" TEXT,
ADD COLUMN     "new_designation" TEXT,
ADD COLUMN     "new_salary_grade" TEXT,
ADD COLUMN     "new_status" TEXT,
ADD COLUMN     "prev_data" JSONB,
ADD COLUMN     "prev_dept_id" TEXT,
ADD COLUMN     "prev_designation" TEXT,
ADD COLUMN     "prev_salary_grade" TEXT,
ADD COLUMN     "prev_status" TEXT;

-- AlterTable
ALTER TABLE "FacultyGroup" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "head_id" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "FacultyGroupMember" ADD COLUMN     "addedBy" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "accreditation" TEXT,
ADD COLUMN     "degree_type" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "intake_capacity" INTEGER;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "SpecialGroup" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SpecialGroupMember" ADD COLUMN     "addedBy" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "blood_group" TEXT,
ADD COLUMN     "emergency_contact" TEXT,
ADD COLUMN     "emergency_phone" TEXT,
ADD COLUMN     "emergency_relation" TEXT,
ADD COLUMN     "father_aadhar" TEXT,
ADD COLUMN     "father_occupation" TEXT,
ADD COLUMN     "is_alumni" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lateral_entry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mother_aadhar" TEXT,
ADD COLUMN     "mother_occupation" TEXT,
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "tenth_percentage" DOUBLE PRECISION,
ADD COLUMN     "twelfth_percentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "StudentEnrollment" ADD COLUMN     "demotion_reason" TEXT,
ADD COLUMN     "promoted_at" TIMESTAMP(3),
ADD COLUMN     "promoted_by" TEXT,
ADD COLUMN     "promoted_from_section_id" TEXT,
ADD COLUMN     "promoted_to_section_id" TEXT;

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "total_days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "remarks" TEXT,
    "rejection_reason" TEXT,
    "cancelled_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApprovalFlow" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "chain" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApprovalFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApprovalStep" (
    "id" TEXT NOT NULL,
    "leave_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "actioned_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UIPermission" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "role" TEXT,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UIPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupAnnouncement" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "posted_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupAttendanceRequest" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "from_time" TEXT,
    "to_time" TEXT,
    "venue" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupAttendanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTask" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPoll" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "poll_type" TEXT NOT NULL DEFAULT 'SINGLE',
    "ends_at" TIMESTAMP(3),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPollChoice" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GroupPollChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPollResponse" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "choice_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPollResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupFile" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_type" TEXT,
    "description" TEXT,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupNotice" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "posted_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRoomBooking" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "room_name" TEXT NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL,
    "from_time" TEXT NOT NULL,
    "to_time" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expected_count" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupRoomBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveRequest_faculty_id_idx" ON "LeaveRequest"("faculty_id");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_from_date_idx" ON "LeaveRequest"("from_date");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApprovalFlow_faculty_id_key" ON "LeaveApprovalFlow"("faculty_id");

-- CreateIndex
CREATE INDEX "LeaveApprovalStep_leave_id_idx" ON "LeaveApprovalStep"("leave_id");

-- CreateIndex
CREATE INDEX "LeaveApprovalStep_approver_id_idx" ON "LeaveApprovalStep"("approver_id");

-- CreateIndex
CREATE INDEX "LeaveApprovalStep_status_idx" ON "LeaveApprovalStep"("status");

-- CreateIndex
CREATE INDEX "UIPermission_module_idx" ON "UIPermission"("module");

-- CreateIndex
CREATE INDEX "UIPermission_role_idx" ON "UIPermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UIPermission_module_action_role_key" ON "UIPermission"("module", "action", "role");

-- CreateIndex
CREATE INDEX "GroupAnnouncement_group_id_idx" ON "GroupAnnouncement"("group_id");

-- CreateIndex
CREATE INDEX "GroupAnnouncement_createdAt_idx" ON "GroupAnnouncement"("createdAt");

-- CreateIndex
CREATE INDEX "GroupAttendanceRequest_group_id_idx" ON "GroupAttendanceRequest"("group_id");

-- CreateIndex
CREATE INDEX "GroupAttendanceRequest_status_idx" ON "GroupAttendanceRequest"("status");

-- CreateIndex
CREATE INDEX "GroupTask_group_id_idx" ON "GroupTask"("group_id");

-- CreateIndex
CREATE INDEX "GroupTask_status_idx" ON "GroupTask"("status");

-- CreateIndex
CREATE INDEX "GroupPoll_group_id_idx" ON "GroupPoll"("group_id");

-- CreateIndex
CREATE INDEX "GroupPollChoice_poll_id_idx" ON "GroupPollChoice"("poll_id");

-- CreateIndex
CREATE INDEX "GroupPollResponse_poll_id_idx" ON "GroupPollResponse"("poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPollResponse_poll_id_student_id_choice_id_key" ON "GroupPollResponse"("poll_id", "student_id", "choice_id");

-- CreateIndex
CREATE INDEX "GroupFile_group_id_idx" ON "GroupFile"("group_id");

-- CreateIndex
CREATE INDEX "GroupNotice_group_id_idx" ON "GroupNotice"("group_id");

-- CreateIndex
CREATE INDEX "GroupRoomBooking_group_id_idx" ON "GroupRoomBooking"("group_id");

-- CreateIndex
CREATE INDEX "GroupRoomBooking_status_idx" ON "GroupRoomBooking"("status");

-- CreateIndex
CREATE INDEX "GroupRoomBooking_booking_date_idx" ON "GroupRoomBooking"("booking_date");

-- CreateIndex
CREATE INDEX "FacultyCareerHistory_action_idx" ON "FacultyCareerHistory"("action");

-- CreateIndex
CREATE INDEX "StudentEnrollment_status_idx" ON "StudentEnrollment"("status");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hod_id_fkey" FOREIGN KEY ("hod_id") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApprovalFlow" ADD CONSTRAINT "LeaveApprovalFlow_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApprovalStep" ADD CONSTRAINT "LeaveApprovalStep_leave_id_fkey" FOREIGN KEY ("leave_id") REFERENCES "LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApprovalStep" ADD CONSTRAINT "LeaveApprovalStep_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAnnouncement" ADD CONSTRAINT "GroupAnnouncement_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "SpecialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAttendanceRequest" ADD CONSTRAINT "GroupAttendanceRequest_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "SpecialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTask" ADD CONSTRAINT "GroupTask_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "SpecialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPoll" ADD CONSTRAINT "GroupPoll_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "SpecialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPollChoice" ADD CONSTRAINT "GroupPollChoice_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "GroupPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPollResponse" ADD CONSTRAINT "GroupPollResponse_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "GroupPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPollResponse" ADD CONSTRAINT "GroupPollResponse_choice_id_fkey" FOREIGN KEY ("choice_id") REFERENCES "GroupPollChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupFile" ADD CONSTRAINT "GroupFile_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "SpecialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupNotice" ADD CONSTRAINT "GroupNotice_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "SpecialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRoomBooking" ADD CONSTRAINT "GroupRoomBooking_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "SpecialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
