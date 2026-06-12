/*
  Warnings:

  - A unique constraint covering the columns `[employee_code]` on the table `Faculty` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "os" TEXT;

-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN     "bank_account_encrypted" TEXT,
ADD COLUMN     "bank_ifsc" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "blood_group" TEXT,
ADD COLUMN     "emergency_contact" TEXT,
ADD COLUMN     "emergency_phone" TEXT,
ADD COLUMN     "emergency_relation" TEXT,
ADD COLUMN     "employee_code" TEXT,
ADD COLUMN     "esi_number" TEXT,
ADD COLUMN     "experience_years" INTEGER,
ADD COLUMN     "pf_number" TEXT,
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "salary_encrypted" TEXT,
ADD COLUMN     "salary_grade" TEXT,
ADD COLUMN     "specialization" TEXT;

-- CreateTable
CREATE TABLE "OtpToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTotp" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTotp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "data_type" TEXT NOT NULL DEFAULT 'string',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErpSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpToken_user_id_purpose_idx" ON "OtpToken"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "OtpToken_expires_at_idx" ON "OtpToken"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserTotp_user_id_key" ON "UserTotp"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ErpSetting_key_key" ON "ErpSetting"("key");

-- CreateIndex
CREATE INDEX "ErpSetting_category_idx" ON "ErpSetting"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_employee_code_key" ON "Faculty"("employee_code");

-- AddForeignKey
ALTER TABLE "OtpToken" ADD CONSTRAINT "OtpToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTotp" ADD CONSTRAINT "UserTotp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
