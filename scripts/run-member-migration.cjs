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
