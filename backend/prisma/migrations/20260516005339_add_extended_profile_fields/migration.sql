-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_FEEDBACK_FORM', 'PROMOTION', 'DEMOTION', 'SECTION_CHANGE', 'FORM_CLOSED', 'GENERAL', 'ACCOUNT_BLOCKED', 'ACCOUNT_UNBLOCKED');

-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN     "aadhar_no" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "employee_type" TEXT,
ADD COLUMN     "nick_name" TEXT,
ADD COLUMN     "pan_no" TEXT,
ADD COLUMN     "personal_email" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "aadhar_no" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "group" TEXT,
ADD COLUMN     "mode_of_admission" TEXT,
ADD COLUMN     "pan_no" TEXT,
ADD COLUMN     "personal_email" TEXT,
ADD COLUMN     "religion" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_user_id_is_read_idx" ON "Notification"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
