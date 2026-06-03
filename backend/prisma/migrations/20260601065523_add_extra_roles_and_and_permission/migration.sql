-- AlterTable
ALTER TABLE "User" ADD COLUMN     "extra_roles" TEXT[] DEFAULT ARRAY[]::TEXT[];
