/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SpecialGroup" ADD COLUMN     "head_id" TEXT;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "last_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password";

-- CreateTable
CREATE TABLE "StudentHistory" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "action" TEXT NOT NULL,
    "changed_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prev_data" JSONB,
    "new_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyCareerHistory" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "prev_value" TEXT,
    "new_value" TEXT,
    "reason" TEXT,
    "changed_by" TEXT,
    "changed_by_name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyCareerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentHistory_student_id_idx" ON "StudentHistory"("student_id");

-- CreateIndex
CREATE INDEX "StudentHistory_createdAt_idx" ON "StudentHistory"("createdAt");

-- CreateIndex
CREATE INDEX "FacultyCareerHistory_faculty_id_idx" ON "FacultyCareerHistory"("faculty_id");

-- CreateIndex
CREATE INDEX "FacultyCareerHistory_createdAt_idx" ON "FacultyCareerHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "StudentHistory" ADD CONSTRAINT "StudentHistory_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyCareerHistory" ADD CONSTRAINT "FacultyCareerHistory_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
