-- AlterTable
ALTER TABLE "TenantBranding" ADD COLUMN IF NOT EXISTS "navigationLayout" TEXT DEFAULT 'horizontal';
