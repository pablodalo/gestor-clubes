/**
 * Aplica migraciones ejecutando SQL directamente. Se usa en el build cuando la DB
 * no tiene historial de migraciones (P3005).
 * 1) Módulo socios: Member.address, etc. — solo si Member.address no existe.
 * 2) Membresías: MembershipPlan + Member.membership_plan_id — solo si la columna no existe.
 *
 * Uso: node scripts/run-member-migration.cjs
 * Requiere: DATABASE_URL en el entorno (ej. en Vercel Build).
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

function runSqlFile(sqlPath) {
  const sql = fs.readFileSync(sqlPath, "utf8");
  return sql
    .split(";")
    .map((s) => s.replace(/--[^\n]*/g, "").trim())
    .filter((s) => s.length > 0);
}

async function executeStatements(statements, logPrefix) {
  for (const statement of statements) {
    const one = statement + ";";
    try {
      await prisma.$executeRawUnsafe(one);
      console.log(logPrefix, "OK:", one.slice(0, 60) + "...");
    } catch (err) {
      if (err.code === "42710" || err.message?.includes("already exists")) {
        console.log(logPrefix, "Skip (ya existe):", one.slice(0, 50) + "...");
      } else {
        throw err;
      }
    }
  }
}

async function memberAddressExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'member' AND column_name = 'address'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function membershipPlanIdExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'member' AND column_name = 'membership_plan_id'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function membershipPlanTierExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'membershipplan' AND column_name = 'tier'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function membershipPlanLimitsExist() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'membershipplan' AND column_name = 'monthly_limit'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function membershipPlanValidityExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'membershipplan' AND column_name = 'valid_until'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function membershipPlanRenewalExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'membershipplan' AND column_name = 'requires_renewal'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function productStrainIdExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'product' AND column_name = 'strain_id'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function dispensationProductIdExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'dispensation' AND column_name = 'product_id'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function dispensationCategoryExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'dispensation' AND column_name = 'category'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function dispensationStrainIdExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'dispensation'
      AND column_name IN ('strainId', 'strain_id')
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function memberConsumedThisPeriodExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'member' AND column_name = 'consumed_this_period'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function membershipPlanSortOrderExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'membershipplan' AND column_name = 'sort_order'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function activeMembershipPlansMissingCategoryLimitRulesExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1
    FROM "MembershipPlan" p
    WHERE p."status" = 'active'
      AND (
        NOT EXISTS (
          SELECT 1
          FROM "MembershipLimitRule" r1
          WHERE r1."tenantId" = p."tenantId"
            AND r1."membershipPlanId" = p."id"
            AND r1."category" = 'plant_material'
        )
        OR
        NOT EXISTS (
          SELECT 1
          FROM "MembershipLimitRule" r2
          WHERE r2."tenantId" = p."tenantId"
            AND r2."membershipPlanId" = p."id"
            AND r2."category" = 'extract'
        )
      )
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function membershipLimitRuleUnitExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'membershiplimitrule' AND column_name = 'unit'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function membershipLimitRuleTableExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND LOWER(table_name) = 'membershiplimitrule'
    LIMIT 1
  `);
  return Array.isArray(r) && r.length > 0;
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL no definida, se omite run-member-migration");
    process.exit(0);
  }
  try {
    const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");

    if (!(await memberAddressExists())) {
      const statements = runSqlFile(path.join(migrationsDir, "20260317000000_add_member_socios_module", "migration.sql"));
      await executeStatements(statements, "[socios]");
      console.log("Migración socios aplicada correctamente.");
    } else {
      console.log("Member.address ya existe, migración socios omitida.");
    }

    if (!(await membershipPlanIdExists())) {
      const statements = runSqlFile(path.join(migrationsDir, "20260318000000_add_membership_plans", "migration.sql"));
      await executeStatements(statements, "[membresías]");
      console.log("Migración membresías aplicada correctamente.");
    } else {
      console.log("Member.membership_plan_id ya existe, migración membresías omitida.");
    }

    if (!(await membershipPlanTierExists())) {
      const statements = runSqlFile(path.join(migrationsDir, "20260318010000_add_membership_plan_tier", "migration.sql"));
      await executeStatements(statements, "[membresías-tier]");
      console.log("Migración tier de membresías aplicada correctamente.");
    } else {
      console.log("MembershipPlan.tier ya existe, migración tier omitida.");
    }

    if (!(await membershipPlanLimitsExist())) {
      const statements = runSqlFile(path.join(migrationsDir, "20260317120000_add_membership_plan_limits", "migration.sql"));
      await executeStatements(statements, "[membresías-límites]");
      console.log("Migración límites de membresías aplicada correctamente.");
    } else {
      console.log("MembershipPlan.monthly_limit ya existe, migración límites omitida.");
    }

    if (!(await membershipPlanValidityExists())) {
      const statements = runSqlFile(path.join(migrationsDir, "20260317130000_add_membership_plan_validity", "migration.sql"));
      await executeStatements(statements, "[membresías-vigencia]");
      console.log("Migración vigencia de membresías aplicada correctamente.");
    } else {
      console.log("MembershipPlan.valid_until ya existe, migración vigencia omitida.");
    }

    if (!(await membershipPlanRenewalExists())) {
      const statements = runSqlFile(path.join(migrationsDir, "20260317133000_add_membership_plan_renewal", "migration.sql"));
      await executeStatements(statements, "[membresías-renovación]");
      console.log("Migración renovación de membresías aplicada correctamente.");
    } else {
      console.log("MembershipPlan.requires_renewal ya existe, migración renovación omitida.");
    }

    // PR 1: Modelo base y compatibilidad para dispensación por productId + límites por categoría
    if (
      !(await productStrainIdExists()) ||
      !(await dispensationProductIdExists()) ||
      !(await membershipLimitRuleTableExists())
    ) {
      const statements = runSqlFile(
        path.join(migrationsDir, "20260319093000_add_membership_limit_rules_product_strain_and_dispensation_product", "migration.sql")
      );
      await executeStatements(statements, "[PR1 - membershipLimitRules / product.dispensation]");
      console.log("Migración PR1 (límites por categoría + product/dispensation) aplicada correctamente.");
    } else {
      console.log("PR1 - columns/tables ya existen, migración omitida.");
    }

    // Fase MembershipPlan: sortOrder + backfill transitorio de MembershipLimitRule por categoría.
    // Importante para que el UI/validación ya no dependa de hardcode/tier.
    if (
      !(await membershipPlanSortOrderExists()) ||
      (await activeMembershipPlansMissingCategoryLimitRulesExists())
    ) {
      const statements = runSqlFile(
        path.join(
          migrationsDir,
          "20260324000000_membership_plan_sortOrder_and_backfill_limit_rules",
          "migration.sql"
        )
      );
      await executeStatements(statements, "[Fase plan sortOrder / backfill rules]");
      console.log("Migración plan sortOrder/backfill aplicada correctamente.");
    } else {
      console.log("plan sortOrder/backfill: ya ok (migración omitida).");
    }

    // Fase Membership: agregar unit + drop tier (cleanup de modelo viejo).
    // Se ejecuta si falta la columna `MembershipLimitRule.unit` o si aún existe `MembershipPlan.tier`.
    if (!(await membershipLimitRuleUnitExists()) || (await membershipPlanTierExists())) {
      const statements = runSqlFile(
        path.join(
          migrationsDir,
          "20260319000000_membership_unit_and_drop_tier",
          "migration.sql"
        )
      );
      await executeStatements(statements, "[Fase membership unit / drop tier]");
      console.log("Migración unit/tier aplicada correctamente.");
    } else {
      console.log("membership unit / drop tier: ya ok (migración omitida).");
    }

    // PR2+PR3 consolidación: canonicalizar categorías y backfill del ancla principal del consumo.
    // Requiere campos legacy en Dispensation (`category` + `strainId`) porque la migración los actualiza.
    if (
      (await productStrainIdExists()) &&
      (await dispensationProductIdExists()) &&
      (await dispensationCategoryExists()) &&
      (await dispensationStrainIdExists())
    ) {
      const statements = runSqlFile(
        path.join(migrationsDir, "20260320000000_consolidate_dispensation_product_category", "migration.sql")
      );
      await executeStatements(statements, "[PR2+PR3 consolidación - product/category/dispensation]");
      console.log("Migración PR2+PR3 (consolidación de categorías + backfill product_id) aplicada correctamente.");
    } else {
      console.log("PR2+PR3 consolidación omitida: faltan columnas product.strain_id / dispensation.product_id.");
    }

    // Fase B: backfill mínimo de product.strain_id y dispensations.product_id cuando queda NULL
    // Requiere campos legacy en Dispensation (`category` + `strainId`) porque la migración los usa.
    if (
      (await productStrainIdExists()) &&
      (await dispensationProductIdExists()) &&
      (await dispensationCategoryExists()) &&
      (await dispensationStrainIdExists())
    ) {
      const statements = runSqlFile(
        path.join(
          migrationsDir,
          "20260321000000_phaseB_backfill_product_strain_and_dispensation_product_id",
          "migration.sql"
        )
      );
      await executeStatements(statements, "[Fase B - backfill product/dispensation]");
      console.log("Migración Fase B (backfill seguro) aplicada correctamente.");
    } else {
      console.log("Fase B omitida: faltan columnas product.strain_id / dispensation.product_id.");
    }

    // Fase 2: eliminar Dispensation.category y Dispensation.strainId (modelo viejo)
    if ((await dispensationCategoryExists()) || (await dispensationStrainIdExists())) {
      const statements = runSqlFile(
        path.join(migrationsDir, "20260323000000_drop_dispensation_category_strainid", "migration.sql")
      );
      await executeStatements(statements, "[Fase 2 - drop Dispensation category/strainId]");
      console.log("Migración Fase 2 (drop Dispensation category/strainId) aplicada correctamente.");
    } else {
      console.log("Fase 2 omitida: Dispensation.category/strainId no existen en DB.");
    }

    // Fase 3: cleanup del modelo (Member.consumedThisPeriod)
    if (await memberConsumedThisPeriodExists()) {
      const statements = runSqlFile(
        path.join(migrationsDir, "20260322000000_drop_member_consumed_this_period", "migration.sql")
      );
      await executeStatements(statements, "[Fase 3 - drop Member.consumedThisPeriod]");
      console.log("Migración Fase 3 (drop consumed_this_period) aplicada correctamente.");
    } else {
      console.log("Fase 3 omitida: consumed_this_period no existe en DB.");
    }
  } catch (err) {
    // Si no se puede conectar a la base (build sin DB disponible), no rompemos el build:
    // Prisma lanza PrismaClientInitializationError con mensaje "Can't reach database server".
    if (err && (err.code === "P1001" || String(err.message || "").includes("Can't reach database server"))) {
      console.warn("run-member-migration: no se pudo conectar a la base, se omiten migraciones en este build.");
      process.exit(0);
    }
    console.error("Error en run-member-migration:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
