-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN     "accommodation_type" TEXT,
ADD COLUMN     "biometric_device_id" TEXT,
ADD COLUMN     "campus_address" TEXT,
ADD COLUMN     "campus_quarter_no" TEXT,
ADD COLUMN     "erp_role" TEXT,
ADD COLUMN     "lives_on_campus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subject_pref_1" TEXT,
ADD COLUMN     "subject_pref_2" TEXT;

-- AlterTable
ALTER TABLE "TimetableEntry" ADD COLUMN     "combined_label" TEXT,
ADD COLUMN     "span_periods" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "TimetableEntryLog" (
    "id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "period_config_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "prev_subject_id" TEXT,
    "prev_faculty_id" TEXT,
    "prev_room_id" TEXT,
    "prev_entry_type" TEXT,
    "new_subject_id" TEXT,
    "new_faculty_id" TEXT,
    "new_room_id" TEXT,
    "new_entry_type" TEXT,
    "swap_with_entry_id" TEXT,
    "swap_section_id" TEXT,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "changed_by_role" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableEntryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSnapshot" (
    "id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "snapshot_data" JSONB NOT NULL,
    "published_by" TEXT,
    "published_by_name" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultySubjectRequest" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "preference" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,

    CONSTRAINT "FacultySubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableEntryLog_timetable_id_idx" ON "TimetableEntryLog"("timetable_id");

-- CreateIndex
CREATE INDEX "TimetableEntryLog_section_id_idx" ON "TimetableEntryLog"("section_id");

-- CreateIndex
CREATE INDEX "TimetableEntryLog_changed_by_idx" ON "TimetableEntryLog"("changed_by");

-- CreateIndex
CREATE INDEX "TimetableEntryLog_createdAt_idx" ON "TimetableEntryLog"("createdAt");

-- CreateIndex
CREATE INDEX "TimetableSnapshot_timetable_id_is_active_idx" ON "TimetableSnapshot"("timetable_id", "is_active");

-- CreateIndex
CREATE INDEX "TimetableSnapshot_section_id_idx" ON "TimetableSnapshot"("section_id");

-- CreateIndex
CREATE INDEX "FacultySubjectRequest_faculty_id_status_idx" ON "FacultySubjectRequest"("faculty_id", "status");

-- CreateIndex
CREATE INDEX "FacultySubjectRequest_session_id_status_idx" ON "FacultySubjectRequest"("session_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FacultySubjectRequest_faculty_id_subject_id_session_id_key" ON "FacultySubjectRequest"("faculty_id", "subject_id", "session_id");

-- AddForeignKey
ALTER TABLE "TimetableEntryLog" ADD CONSTRAINT "TimetableEntryLog_timetable_id_fkey" FOREIGN KEY ("timetable_id") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntryLog" ADD CONSTRAINT "TimetableEntryLog_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntryLog" ADD CONSTRAINT "TimetableEntryLog_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSnapshot" ADD CONSTRAINT "TimetableSnapshot_timetable_id_fkey" FOREIGN KEY ("timetable_id") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSnapshot" ADD CONSTRAINT "TimetableSnapshot_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSnapshot" ADD CONSTRAINT "TimetableSnapshot_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultySubjectRequest" ADD CONSTRAINT "FacultySubjectRequest_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultySubjectRequest" ADD CONSTRAINT "FacultySubjectRequest_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultySubjectRequest" ADD CONSTRAINT "FacultySubjectRequest_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
