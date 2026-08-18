-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN     "primary_role_id" TEXT,
ADD COLUMN     "secondary_role_id" TEXT;

-- CreateTable
CREATE TABLE "PermissionGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "permissions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermissionGroup" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermissionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "session_id" TEXT,
    "dept_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramAffiliation" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "program_id" TEXT,
    "branch_id" TEXT,
    "affiliation_no" TEXT NOT NULL,
    "valid_from" DATE,
    "valid_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramAffiliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "smtp_user" TEXT,
    "smtp_pass" TEXT,
    "smtp_from" TEXT,
    "smtp_from_name" TEXT,
    "wa_api_key" TEXT,
    "wa_from" TEXT,
    "wa_provider" TEXT,
    "updated_by" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body_email" TEXT,
    "body_whatsapp" TEXT,
    "variables" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "cron_expr" TEXT NOT NULL,
    "template_key" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "recipients" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run" TIMESTAMP(3),
    "last_status" TEXT,
    "last_error" TEXT,
    "created_by" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyQualification" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "board_university" TEXT,
    "institution" TEXT,
    "subject_stream" TEXT,
    "percentage" DOUBLE PRECISION,
    "grade" TEXT,
    "year_of_passing" INTEGER,
    "certificate_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyQualification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissionGroup_name_key" ON "PermissionGroup"("name");

-- CreateIndex
CREATE INDEX "UserPermissionGroup_user_id_idx" ON "UserPermissionGroup"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionGroup_user_id_group_id_key" ON "UserPermissionGroup"("user_id", "group_id");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Holiday_session_id_idx" ON "Holiday"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_dept_id_key" ON "Holiday"("date", "dept_id");

-- CreateIndex
CREATE UNIQUE INDEX "University_code_key" ON "University"("code");

-- CreateIndex
CREATE INDEX "ProgramAffiliation_university_id_idx" ON "ProgramAffiliation"("university_id");

-- CreateIndex
CREATE INDEX "ProgramAffiliation_program_id_idx" ON "ProgramAffiliation"("program_id");

-- CreateIndex
CREATE INDEX "ProgramAffiliation_branch_id_idx" ON "ProgramAffiliation"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationConfig_type_key" ON "NotificationConfig"("type");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_key_key" ON "NotificationTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CronSchedule_key_key" ON "CronSchedule"("key");

-- CreateIndex
CREATE INDEX "FacultyQualification_faculty_id_idx" ON "FacultyQualification"("faculty_id");

-- CreateIndex
CREATE INDEX "FacultyQualification_level_idx" ON "FacultyQualification"("level");

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_primary_role_id_fkey" FOREIGN KEY ("primary_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_secondary_role_id_fkey" FOREIGN KEY ("secondary_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionGroup" ADD CONSTRAINT "UserPermissionGroup_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionGroup" ADD CONSTRAINT "UserPermissionGroup_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "PermissionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAffiliation" ADD CONSTRAINT "ProgramAffiliation_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAffiliation" ADD CONSTRAINT "ProgramAffiliation_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAffiliation" ADD CONSTRAINT "ProgramAffiliation_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronSchedule" ADD CONSTRAINT "CronSchedule_template_key_fkey" FOREIGN KEY ("template_key") REFERENCES "NotificationTemplate"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyQualification" ADD CONSTRAINT "FacultyQualification_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
