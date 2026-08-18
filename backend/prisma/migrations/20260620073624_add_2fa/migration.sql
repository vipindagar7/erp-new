-- AlterTable
ALTER TABLE "User" ADD COLUMN     "first_login_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_root" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pin_hash" TEXT,
ADD COLUMN     "pin_set_at" TIMESTAMP(3),
ADD COLUMN     "requires_2fa" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "is_locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locked_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_is_root_idx" ON "User"("is_root");
