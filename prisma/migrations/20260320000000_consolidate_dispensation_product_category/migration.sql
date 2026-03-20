-- Consolidación PR2+PR3:
-- - Canonicalizar categorías en Product y Dispensation
-- - Backfill de Dispensation.product_id (ancla principal) usando strainId + Product

-- 1) Product.category: flores -> plant_material, extractos -> extract (si existe la columna)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'category') THEN
    UPDATE "Product" SET "category" = 'plant_material' WHERE "category" = 'flores';
    UPDATE "Product" SET "category" = 'extract' WHERE "category" = 'extractos';
  END IF;
END
$$;

-- 2) Backfill Product.strain_id si está vacío (best-effort por normalización de nombre)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'strain_id') THEN
    UPDATE "Product" p
    SET "strain_id" = ps."id"
    FROM "PlantStrain" ps
    WHERE p."tenantId" = ps."tenantId"
      AND p."strain_id" IS NULL
      AND lower(trim(regexp_replace(p."name", '^(flores|extractos)\s+', '', 'i'))) =
          lower(trim(regexp_replace(ps."name", '^(flores|extractos)\s+', '', 'i')));
  END IF;
END
$$;

-- 3) Dispensation.category: flores/extractos -> plant_material/extract (si existe la columna)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Dispensation' AND column_name = 'category') THEN
    UPDATE "Dispensation" SET "category" = 'plant_material' WHERE "category" = 'flores';
    UPDATE "Dispensation" SET "category" = 'extract' WHERE "category" = 'extractos';
  END IF;
END
$$;

-- 4) Backfill Dispensation.product_id cuando sea null (si existen strainId y category en Dispensation)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Dispensation' AND column_name = 'strainId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Dispensation' AND column_name = 'category') THEN
    UPDATE "Dispensation" d
    SET "product_id" = p."id"
    FROM "Product" p
    WHERE d."product_id" IS NULL
      AND d."tenantId" = p."tenantId"
      AND d."strainId" = p."strain_id"
      AND p."category" = d."category";
  END IF;
END
$$;

