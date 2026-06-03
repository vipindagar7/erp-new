-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_course_id_fkey";

-- DropIndex
DROP INDEX "Section_course_id_idx";

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
