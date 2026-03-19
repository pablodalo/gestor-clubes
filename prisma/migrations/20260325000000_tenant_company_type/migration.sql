-- Add tenant company type: club | grow | cultivador
ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "company_type" TEXT;

UPDATE "Tenant"
  SET "company_type" = 'club'
  WHERE "company_type" IS NULL;

ALTER TABLE "Tenant"
  ALTER COLUMN "company_type" SET DEFAULT 'club';

ALTER TABLE "Tenant"
  ALTER COLUMN "company_type" SET NOT NULL;

