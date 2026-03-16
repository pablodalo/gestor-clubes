-- AlterTable Member: add datos del socio, membresía y config operativa
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "state_or_province" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "emergency_contact_name" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "status_reason" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_type" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_status" TEXT DEFAULT 'pending';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_start_date" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_end_date" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_renewal_date" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_notes" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "member_tier" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "monthly_limit" DECIMAL(12,2);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "daily_limit" DECIMAL(12,2);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "remaining_balance" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "consumed_this_period" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "period_start_date" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "can_reserve_products" BOOLEAN DEFAULT true;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "can_preorder" BOOLEAN DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "can_access_events" BOOLEAN DEFAULT true;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "can_invite_guest" BOOLEAN DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "allowed_categories" JSONB;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "allowed_products" JSONB;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;

-- CreateTable MemberBalanceAdjustment
CREATE TABLE IF NOT EXISTS "MemberBalanceAdjustment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "created_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberBalanceAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MemberBalanceAdjustment_tenantId_idx" ON "MemberBalanceAdjustment"("tenantId");
CREATE INDEX IF NOT EXISTS "MemberBalanceAdjustment_memberId_idx" ON "MemberBalanceAdjustment"("memberId");
CREATE INDEX IF NOT EXISTS "MemberBalanceAdjustment_memberId_createdAt_idx" ON "MemberBalanceAdjustment"("memberId", "createdAt");

ALTER TABLE "MemberBalanceAdjustment" ADD CONSTRAINT "MemberBalanceAdjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberBalanceAdjustment" ADD CONSTRAINT "MemberBalanceAdjustment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Notification: read_at and FK to Member
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3);

-- Index for document number uniqueness check (optional, for performance)
CREATE INDEX IF NOT EXISTS "Member_tenantId_documentNumber_idx" ON "Member"("tenantId", "documentNumber");
