/*
  Warnings:

  - You are about to drop the column `rooms` on the `Department` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('CLASSROOM', 'LAB', 'SEMINAR_HALL', 'AUDITORIUM', 'TRAINING_ROOM', 'CONFERENCE_ROOM', 'LIBRARY', 'OTHER');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('LECTURE', 'LAB', 'LUNCH', 'BREAK', 'ASSEMBLY', 'OTHER');

-- CreateEnum
CREATE TYPE "TimetableStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('LECTURE', 'LAB', 'TUTORIAL', 'FREE', 'LUNCH', 'BREAK');

-- CreateEnum
CREATE TYPE "SubstStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "AcademicPeriod" ALTER COLUMN "type" SET DEFAULT 'ACADEMIC';

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "rooms";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "group_no" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "RoomType" NOT NULL DEFAULT 'CLASSROOM',
    "capacity" INTEGER NOT NULL DEFAULT 60,
    "floor" TEXT,
    "block" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "dept_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomSubject" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,

    CONSTRAINT "RoomSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomStaff" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LAB_STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facultyId" TEXT,

    CONSTRAINT "RoomStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodConfig" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PeriodType" NOT NULL DEFAULT 'LECTURE',
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "days" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "dept_id" TEXT,
    "status" "TimetableStatus" NOT NULL DEFAULT 'DRAFT',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_by" TEXT,
    "locked_at" TIMESTAMP(3),
    "generated_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "period_config_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "subject_id" TEXT,
    "faculty_id" TEXT,
    "room_id" TEXT,
    "entry_type" "EntryType" NOT NULL DEFAULT 'LECTURE',
    "notes" TEXT,
    "is_combined" BOOLEAN NOT NULL DEFAULT false,
    "combined_section_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Substitution" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "original_faculty_id" TEXT NOT NULL,
    "substitute_faculty_id" TEXT NOT NULL,
    "status" "SubstStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "leave_id" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "response_note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Substitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyWorkload" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "weekly_hours" INTEGER NOT NULL DEFAULT 4,
    "preferred_days" TEXT[],
    "preferred_periods" INTEGER[],
    "room_id" TEXT,
    "entry_type" "EntryType" NOT NULL DEFAULT 'LECTURE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyWorkload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RoomSubject_room_id_subject_id_key" ON "RoomSubject"("room_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "RoomStaff_room_id_user_id_key" ON "RoomStaff"("room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodConfig_session_id_order_key" ON "PeriodConfig"("session_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_section_id_key" ON "Timetable"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_timetable_id_day_period_config_id_key" ON "TimetableEntry"("timetable_id", "day", "period_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyWorkload_session_id_faculty_id_subject_id_section_id_key" ON "FacultyWorkload"("session_id", "faculty_id", "subject_id", "section_id");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSubject" ADD CONSTRAINT "RoomSubject_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSubject" ADD CONSTRAINT "RoomSubject_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomStaff" ADD CONSTRAINT "RoomStaff_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomStaff" ADD CONSTRAINT "RoomStaff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomStaff" ADD CONSTRAINT "RoomStaff_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodConfig" ADD CONSTRAINT "PeriodConfig_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_timetable_id_fkey" FOREIGN KEY ("timetable_id") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_period_config_id_fkey" FOREIGN KEY ("period_config_id") REFERENCES "PeriodConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "TimetableEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_original_faculty_id_fkey" FOREIGN KEY ("original_faculty_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_substitute_faculty_id_fkey" FOREIGN KEY ("substitute_faculty_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyWorkload" ADD CONSTRAINT "FacultyWorkload_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyWorkload" ADD CONSTRAINT "FacultyWorkload_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyWorkload" ADD CONSTRAINT "FacultyWorkload_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyWorkload" ADD CONSTRAINT "FacultyWorkload_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyWorkload" ADD CONSTRAINT "FacultyWorkload_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
