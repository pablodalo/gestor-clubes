-- Consolidación PR2+PR3:
-- - Canonicalizar categorías en Product y Dispensation
-- - Backfill de Dispensation.product_id (ancla principal) usando strainId + Product

-- 1) Product.category: flores -> plant_material, extractos -> extract
UPDATE "Product"
SET "category" = 'plant_material'
WHERE "category" = 'flores';

UPDATE "Product"
SET "category" = 'extract'
WHERE "category" = 'extractos';

-- 2) Backfill Product.strain_id si está vacío (best-effort por normalización de nombre)
-- Normalizamos eliminando prefijos "flores " / "extractos " (misma lógica que usa el backoffice para emparejar).
UPDATE "Product" p
SET "strain_id" = ps."id"
FROM "PlantStrain" ps
WHERE p."tenantId" = ps."tenantId"
  AND p."strain_id" IS NULL
  AND lower(trim(regexp_replace(p."name", '^(flores|extractos)\\s+', '', 'i'))) =
      lower(trim(regexp_replace(ps."name", '^(flores|extractos)\\s+', '', 'i')));

-- 3) Dispensation.category: flores/extractos -> plant_material/extract
UPDATE "Dispensation"
SET "category" = 'plant_material'
WHERE "category" = 'flores';

UPDATE "Dispensation"
SET "category" = 'extract'
WHERE "category" = 'extractos';

-- 4) Backfill Dispensation.product_id cuando sea null
-- Usamos strainId (PlantStrain id) + categoría canónica.
UPDATE "Dispensation" d
SET "product_id" = p."id"
FROM "Product" p
WHERE d."product_id" IS NULL
  AND d."tenantId" = p."tenantId"
  AND d."strainId" = p."strain_id"
  AND p."category" = d."category";

