-- Phase 2: eliminar modelo viejo de Dispensation (category/strainId)
ALTER TABLE "Dispensation" DROP COLUMN IF EXISTS "category";
ALTER TABLE "Dispensation" DROP COLUMN IF EXISTS "strainId";
ALTER TABLE "Dispensation" DROP COLUMN IF EXISTS "strain_id";

