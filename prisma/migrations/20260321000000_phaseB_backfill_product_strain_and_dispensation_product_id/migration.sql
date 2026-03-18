-- Fase B mínima y segura:
-- 1) Mejorar backfill de Product.strain_id cuando está NULL pero el nombre coincide
--    con PlantStrain.name con una normalización más robusta.
-- 2) Backfill de Dispensation.product_id SOLO si queda un candidato único
--    (evita ambigüedad si existen múltiples productos por cepa/categoría).

-- 1) Mejorar Product.strain_id (solo cuando es NULL)
WITH normalized_products AS (
  SELECT
    p."id" AS product_id,
    p."tenantId" AS tenant_id,
    lower(trim(regexp_replace(p."name", '^(flores|extractos)[\\s\\-_:]*', '', 'i'))) AS norm_name
  FROM "Product" p
  WHERE p."strain_id" IS NULL
),
normalized_strains AS (
  SELECT
    ps."id" AS strain_id,
    ps."tenantId" AS tenant_id,
    lower(trim(regexp_replace(ps."name", '^(flores|extractos)[\\s\\-_:]*', '', 'i'))) AS norm_name
  FROM "PlantStrain" ps
),
matches AS (
  SELECT
    p.product_id,
    s.strain_id,
    count(*) OVER (PARTITION BY p.product_id) AS match_count
  FROM normalized_products p
  JOIN normalized_strains s
    ON s.tenant_id = p.tenant_id
   AND s.norm_name = p.norm_name
)
UPDATE "Product" pr
SET "strain_id" = m.strain_id
FROM matches m
WHERE pr."id" = m.product_id
  AND m.match_count = 1
  AND pr."strain_id" IS NULL;

-- 2) Backfill Dispensation.product_id cuando sea resolvible de forma única
WITH candidates AS (
  SELECT
    d."id" AS dispensation_id,
    p."id" AS product_id,
    count(*) OVER (PARTITION BY d."id") AS candidate_count
  FROM "Dispensation" d
  JOIN "Product" p
    ON p."tenantId" = d."tenantId"
   AND p."category" = d."category"
   AND p."strain_id" = d."strainId"
  WHERE d."product_id" IS NULL
)
UPDATE "Dispensation" d
SET "product_id" = c.product_id
FROM candidates c
WHERE d."id" = c.dispensation_id
  AND c.candidate_count = 1
  AND d."product_id" IS NULL;

