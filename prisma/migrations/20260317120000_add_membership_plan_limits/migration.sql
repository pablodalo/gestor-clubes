-- Add limits config to membership plans
ALTER TABLE "MembershipPlan"
  ADD COLUMN IF NOT EXISTS "monthly_limit" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "daily_limit" DECIMAL(12,2);

