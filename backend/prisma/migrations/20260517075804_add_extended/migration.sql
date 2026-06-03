-- AlterTable
ALTER TABLE "FeedbackForm" ADD COLUMN     "group_id" TEXT,
ADD COLUMN     "specialGroupId" TEXT;

-- CreateTable
CREATE TABLE "SpecialGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialGroupMember" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpecialGroupMember_group_id_student_id_key" ON "SpecialGroupMember"("group_id", "student_id");

-- AddForeignKey
ALTER TABLE "SpecialGroupMember" ADD CONSTRAINT "SpecialGroupMember_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "SpecialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialGroupMember" ADD CONSTRAINT "SpecialGroupMember_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackForm" ADD CONSTRAINT "FeedbackForm_specialGroupId_fkey" FOREIGN KEY ("specialGroupId") REFERENCES "SpecialGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
