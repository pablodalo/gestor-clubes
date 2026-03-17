/**
 * Aplica la migración del módulo de socios (Member.address, etc.) ejecutando
 * el SQL directamente. Se usa en el build cuando la DB no tiene historial de
 * migraciones (P3005). Solo aplica si la columna Member.address no existe.
 *
 * Uso: node scripts/run-member-migration.cjs
 * Requiere: DATABASE_URL en el entorno (ej. en Vercel Build).
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function columnExists() {
  const r = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'member' AND column_name = 'address'
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
    if (await columnExists()) {
      console.log("Member.address ya existe, migración omitida.");
      process.exit(0);
    }
    const sqlPath = path.join(
      __dirname,
      "..",
      "prisma",
      "migrations",
      "20260317000000_add_member_socios_module",
      "migration.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.replace(/--[^\n]*/g, "").trim())
      .filter((s) => s.length > 0);
    for (const statement of statements) {
      const one = statement + ";";
      try {
        await prisma.$executeRawUnsafe(one);
        console.log("OK:", one.slice(0, 60) + "...");
      } catch (err) {
        if (err.code === "42710" || err.message?.includes("already exists")) {
          console.log("Skip (ya existe):", one.slice(0, 50) + "...");
        } else {
          throw err;
        }
      }
    }
    console.log("Migración aplicada correctamente.");
  } catch (err) {
    console.error("Error en run-member-migration:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
