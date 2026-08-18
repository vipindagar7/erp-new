-- CreateTable
CREATE TABLE "AcademicPeriod" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentHistory" (
    "id" TEXT NOT NULL,
    "dept_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prev_data" JSONB,
    "new_data" JSONB,
    "reason" TEXT,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "changed_by_role" TEXT,
    "is_rollback" BOOLEAN NOT NULL DEFAULT false,
    "rolled_back_to" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramHistory" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prev_data" JSONB,
    "new_data" JSONB,
    "reason" TEXT,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "changed_by_role" TEXT,
    "is_rollback" BOOLEAN NOT NULL DEFAULT false,
    "rolled_back_to" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchHistory" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prev_data" JSONB,
    "new_data" JSONB,
    "reason" TEXT,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "changed_by_role" TEXT,
    "is_rollback" BOOLEAN NOT NULL DEFAULT false,
    "rolled_back_to" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionSnapshot" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "section_code" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggered_by" TEXT,
    "triggered_by_name" TEXT,
    "section_data" JSONB NOT NULL,
    "students_data" JSONB NOT NULL,
    "enrollments_data" JSONB NOT NULL,
    "subjects_data" JSONB NOT NULL,
    "from_semester" INTEGER,
    "to_semester" INTEGER,
    "from_session" TEXT,
    "to_session" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "rolled_back_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentHistory" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "student_id" TEXT NOT NULL,
    "section_id" TEXT,
    "session_id" TEXT,
    "action" TEXT NOT NULL,
    "from_semester" INTEGER,
    "to_semester" INTEGER,
    "from_status" TEXT,
    "to_status" TEXT,
    "from_section_id" TEXT,
    "to_section_id" TEXT,
    "from_section_code" TEXT,
    "to_section_code" TEXT,
    "from_session" TEXT,
    "to_session" TEXT,
    "prev_data" JSONB,
    "new_data" JSONB,
    "reason" TEXT,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "changed_by_role" TEXT,
    "is_rollback" BOOLEAN NOT NULL DEFAULT false,
    "rolled_back_to" TEXT,
    "snapshot_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicPeriod_session_id_idx" ON "AcademicPeriod"("session_id");

-- CreateIndex
CREATE INDEX "AcademicPeriod_type_idx" ON "AcademicPeriod"("type");

-- CreateIndex
CREATE INDEX "DepartmentHistory_dept_id_idx" ON "DepartmentHistory"("dept_id");

-- CreateIndex
CREATE INDEX "DepartmentHistory_action_idx" ON "DepartmentHistory"("action");

-- CreateIndex
CREATE INDEX "DepartmentHistory_createdAt_idx" ON "DepartmentHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ProgramHistory_program_id_idx" ON "ProgramHistory"("program_id");

-- CreateIndex
CREATE INDEX "ProgramHistory_action_idx" ON "ProgramHistory"("action");

-- CreateIndex
CREATE INDEX "ProgramHistory_createdAt_idx" ON "ProgramHistory"("createdAt");

-- CreateIndex
CREATE INDEX "BranchHistory_branch_id_idx" ON "BranchHistory"("branch_id");

-- CreateIndex
CREATE INDEX "BranchHistory_action_idx" ON "BranchHistory"("action");

-- CreateIndex
CREATE INDEX "BranchHistory_createdAt_idx" ON "BranchHistory"("createdAt");

-- CreateIndex
CREATE INDEX "SectionSnapshot_section_id_idx" ON "SectionSnapshot"("section_id");

-- CreateIndex
CREATE INDEX "SectionSnapshot_trigger_idx" ON "SectionSnapshot"("trigger");

-- CreateIndex
CREATE INDEX "SectionSnapshot_createdAt_idx" ON "SectionSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "EnrollmentHistory_student_id_idx" ON "EnrollmentHistory"("student_id");

-- CreateIndex
CREATE INDEX "EnrollmentHistory_section_id_idx" ON "EnrollmentHistory"("section_id");

-- CreateIndex
CREATE INDEX "EnrollmentHistory_action_idx" ON "EnrollmentHistory"("action");

-- CreateIndex
CREATE INDEX "EnrollmentHistory_createdAt_idx" ON "EnrollmentHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "AcademicPeriod" ADD CONSTRAINT "AcademicPeriod_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
