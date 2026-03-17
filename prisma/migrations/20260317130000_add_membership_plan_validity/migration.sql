-- Add validity configuration to membership plans
ALTER TABLE "MembershipPlan"
  ADD COLUMN IF NOT EXISTS "validityType" TEXT NOT NULL DEFAULT 'unlimited',
  ADD COLUMN IF NOT EXISTS "valid_until" TIMESTAMP;

