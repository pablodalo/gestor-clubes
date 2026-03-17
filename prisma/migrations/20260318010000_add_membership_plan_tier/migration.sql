-- AddColumn MembershipPlan.tier
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "tier" TEXT;

