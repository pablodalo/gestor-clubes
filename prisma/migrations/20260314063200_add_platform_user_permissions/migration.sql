-- AlterTable
ALTER TABLE "PlatformUser" ADD COLUMN IF NOT EXISTS "permissions" JSONB;
