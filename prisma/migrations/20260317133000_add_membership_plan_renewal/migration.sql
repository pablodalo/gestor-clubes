-- Add renewal configuration to membership plans
ALTER TABLE "MembershipPlan"
  ADD COLUMN IF NOT EXISTS "requires_renewal" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "renewal_every_days" INTEGER;

