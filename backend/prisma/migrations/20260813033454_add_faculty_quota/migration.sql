-- AlterTable
ALTER TABLE "SalarySlip" ADD COLUMN     "cycle_id" TEXT;

-- CreateTable
CREATE TABLE "LeaveRulePolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "staff_type" TEXT NOT NULL,
    "dept_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRulePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRule" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "max_per_session" INTEGER NOT NULL,
    "max_consecutive" INTEGER NOT NULL DEFAULT 3,
    "max_in_month" INTEGER NOT NULL DEFAULT 2,
    "carry_forward" BOOLEAN NOT NULL DEFAULT false,
    "encashable" BOOLEAN NOT NULL DEFAULT false,
    "requires_cover" BOOLEAN NOT NULL DEFAULT true,
    "min_notice_days" INTEGER NOT NULL DEFAULT 1,
    "applies_to" TEXT NOT NULL DEFAULT 'ALL',
    "is_slot_based" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveSlot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot_type" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "max_leaves" INTEGER NOT NULL,
    "staff_type" TEXT NOT NULL DEFAULT 'ALL',
    "dept_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryCycle" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_days" INTEGER NOT NULL,
    "working_days" INTEGER NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_by" TEXT,
    "locked_at" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyLeaveQuota" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "pending" INTEGER NOT NULL DEFAULT 0,
    "lapsed" INTEGER NOT NULL DEFAULT 0,
    "carried_forward" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyLeaveQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveRulePolicy_session_id_idx" ON "LeaveRulePolicy"("session_id");

-- CreateIndex
CREATE INDEX "LeaveRule_policy_id_idx" ON "LeaveRule"("policy_id");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRule_policy_id_leave_type_key" ON "LeaveRule"("policy_id", "leave_type");

-- CreateIndex
CREATE INDEX "LeaveSlot_session_id_idx" ON "LeaveSlot"("session_id");

-- CreateIndex
CREATE INDEX "SalaryCycle_session_id_idx" ON "SalaryCycle"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryCycle_session_id_month_year_key" ON "SalaryCycle"("session_id", "month", "year");

-- CreateIndex
CREATE INDEX "FacultyLeaveQuota_faculty_id_session_id_idx" ON "FacultyLeaveQuota"("faculty_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyLeaveQuota_faculty_id_session_id_leave_type_key" ON "FacultyLeaveQuota"("faculty_id", "session_id", "leave_type");

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "SalaryCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRulePolicy" ADD CONSTRAINT "LeaveRulePolicy_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRule" ADD CONSTRAINT "LeaveRule_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "LeaveRulePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveSlot" ADD CONSTRAINT "LeaveSlot_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryCycle" ADD CONSTRAINT "SalaryCycle_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyLeaveQuota" ADD CONSTRAINT "FacultyLeaveQuota_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyLeaveQuota" ADD CONSTRAINT "FacultyLeaveQuota_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "LeaveRulePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyLeaveQuota" ADD CONSTRAINT "FacultyLeaveQuota_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
