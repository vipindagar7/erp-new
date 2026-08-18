-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "branch_id" TEXT,
ADD COLUMN     "duration_years" INTEGER,
ADD COLUMN     "max_semesters" INTEGER;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "branch_id" TEXT;

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dept_id" TEXT NOT NULL,
    "has_combined_first_year" BOOLEAN NOT NULL DEFAULT false,
    "start_session" TEXT,
    "end_session" TEXT,
    "discontinued_at" TIMESTAMP(3),
    "discontinued_reason" TEXT,
    "discontinued_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_dept_id_idx" ON "Branch"("dept_id");

-- CreateIndex
CREATE INDEX "Branch_code_idx" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_discontinued_at_idx" ON "Branch"("discontinued_at");

-- CreateIndex
CREATE INDEX "Program_branch_id_idx" ON "Program"("branch_id");

-- CreateIndex
CREATE INDEX "Student_branch_id_idx" ON "Student"("branch_id");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
