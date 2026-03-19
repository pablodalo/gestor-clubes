-- Membership: agregar unidad de medida en MembershipLimitRule y sacar tier de MembershipPlan

-- 1) Unit en MembershipLimitRule (transitorio/compatibilidad)
ALTER TABLE "MembershipLimitRule"
  ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'g';

-- Asegura valores no nulos en caso de ejecuciones parciales
UPDATE "MembershipLimitRule"
SET "unit" = 'g'
WHERE "unit" IS NULL;

-- 2) Drop de tier en MembershipPlan (remoción del modelo viejo)
ALTER TABLE "MembershipPlan"
  DROP COLUMN IF EXISTS "tier";

