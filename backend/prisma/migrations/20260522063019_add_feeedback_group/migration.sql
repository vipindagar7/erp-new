-- AlterTable
ALTER TABLE "FeedbackForm" ADD COLUMN     "feedbackFormGroupId" TEXT;

-- CreateTable
CREATE TABLE "FeedbackFormGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackFormGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackFormGroup_category_id_idx" ON "FeedbackFormGroup"("category_id");

-- AddForeignKey
ALTER TABLE "FeedbackForm" ADD CONSTRAINT "FeedbackForm_feedbackFormGroupId_fkey" FOREIGN KEY ("feedbackFormGroupId") REFERENCES "FeedbackFormGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackFormGroup" ADD CONSTRAINT "FeedbackFormGroup_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "FeedbackCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
