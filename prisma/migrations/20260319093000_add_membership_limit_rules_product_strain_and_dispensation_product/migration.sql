-- PR 1: Modelo base y compatibilidad para dispensación por productId + límites por categoría

-- Product.strainId (FK a PlantStrain) - nullable para compatibilidad
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "strain_id" TEXT;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_strain_id_fkey"
  FOREIGN KEY ("strain_id") REFERENCES "PlantStrain"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Dispensation.productId (FK a Product) - nullable para compatibilidad
ALTER TABLE "Dispensation" ADD COLUMN IF NOT EXISTS "product_id" TEXT;

ALTER TABLE "Dispensation"
  ADD CONSTRAINT "Dispensation_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- MembershipLimitRule por categoría (asociada a MembershipPlan)
CREATE TABLE IF NOT EXISTS "MembershipLimitRule" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "membershipPlanId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "monthly_limit" DECIMAL(12,2),
  "daily_limit" DECIMAL(12,2),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MembershipLimitRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MembershipLimitRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MembershipLimitRule_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "MembershipPlan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MembershipLimitRule_tenantId_membershipPlanId_category_key"
  ON "MembershipLimitRule"("tenantId", "membershipPlanId", "category");

CREATE INDEX IF NOT EXISTS "MembershipLimitRule_membershipPlanId_idx"
  ON "MembershipLimitRule"("membershipPlanId");

CREATE INDEX IF NOT EXISTS "MembershipLimitRule_tenantId_idx"
  ON "MembershipLimitRule"("tenantId");

