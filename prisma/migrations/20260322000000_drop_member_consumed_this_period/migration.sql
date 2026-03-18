-- Fase 3: cleanup controlado del modelo
-- Eliminar columna histórica no utilizada: Member.consumedThisPeriod
ALTER TABLE "Member" DROP COLUMN IF EXISTS "consumed_this_period";

