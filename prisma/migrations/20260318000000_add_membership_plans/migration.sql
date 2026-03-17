-- CreateTable MembershipPlan
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "recurrence_day" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- AddColumn Member.membershipPlanId
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_plan_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_tenantId_name_key" ON "MembershipPlan"("tenantId", "name");
CREATE INDEX "MembershipPlan_tenantId_idx" ON "MembershipPlan"("tenantId");

-- AddForeignKey
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Member" ADD CONSTRAINT "Member_membership_plan_id_fkey" FOREIGN KEY ("membership_plan_id") REFERENCES "MembershipPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
