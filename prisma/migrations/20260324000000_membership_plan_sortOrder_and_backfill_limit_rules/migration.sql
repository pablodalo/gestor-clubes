-- Incremental cleanup: ordenar planes y backfill transitorio de reglas por categoría.

-- 1) sortOrder opcional en MembershipPlan
ALTER TABLE "MembershipPlan"
  ADD COLUMN IF NOT EXISTS "sort_order" INTEGER;

-- 2) Backfill transitorio de MembershipLimitRule por categoría para planes activos existentes.
--    Si no existe regla para la categoría, se crea usando MembershipPlan.monthlyLimit/dailyLimit como inicial.
WITH categories AS (
  SELECT 'plant_material'::TEXT AS category
  UNION ALL
  SELECT 'extract'::TEXT AS category
)
INSERT INTO "MembershipLimitRule" (
  "id",
  "tenantId",
  "membershipPlanId",
  "category",
  "monthly_limit",
  "daily_limit",
  "active",
  "createdAt",
  "updatedAt"
)
SELECT
  md5(p."id" || ':' || p."tenantId" || ':' || c.category) AS id,
  p."tenantId",
  p."id" AS membershipPlanId,
  c.category,
  p."monthly_limit" AS monthly_limit,
  p."daily_limit" AS daily_limit,
  true AS active,
  CURRENT_TIMESTAMP AS "createdAt",
  CURRENT_TIMESTAMP AS "updatedAt"
FROM "MembershipPlan" p
CROSS JOIN categories c
WHERE p."status" = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM "MembershipLimitRule" r
    WHERE r."tenantId" = p."tenantId"
      AND r."membershipPlanId" = p."id"
      AND r."category" = c.category
  );

