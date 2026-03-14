import "@/lib/env";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalSecret } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Prueba en un solo request: env y conexión a PostgreSQL.
 * En producción, si INTERNAL_API_SECRET está definido, requiere header x-internal-secret.
 */
export async function GET(request: NextRequest) {
  const unauth = requireInternalSecret(request);
  if (unauth) return unauth;
  const hasDbUrl = !!(process.env.DATABASE_URL || process.env.dbgc_DATABASE_URL);
  const hasAuthUrl = !!(process.env.NEXTAUTH_URL || process.env.dbgc_NEXTAUTH_URL);
  const hasAuthSecret = !!(process.env.NEXTAUTH_SECRET || process.env.dbgc_NEXTAUTH_SECRET);

  const envOk = hasDbUrl && hasAuthUrl && hasAuthSecret;
  const env = {
    DATABASE_URL: hasDbUrl ? "set" : "missing",
    NEXTAUTH_URL: hasAuthUrl ? "set" : "missing",
    NEXTAUTH_SECRET: hasAuthSecret ? "set" : "missing",
  };

  let database: { ok: boolean; message?: string; tenantsCount?: number } = {
    ok: false,
    message: "no probado",
  };

  if (hasDbUrl) {
    try {
      const tenantsCount = await prisma.tenant.count().catch(() => 0);
      await prisma.auditLog.create({
        data: {
          tenantId: null,
          actorType: "platform_user",
          actorId: "health-check",
          action: "health.db.write",
          entityName: "Health",
          entityId: null,
          origin: "api/health",
        },
      });
      database = { ok: true, message: "PostgreSQL OK: lectura y escritura correctas", tenantsCount };
    } catch (error) {
      database = {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  } else {
    database = { ok: false, message: "DATABASE_URL no configurada en Vercel" };
  }

  const ok = envOk && database.ok;
  return NextResponse.json(
    {
      ok,
      env,
      database,
      hint: !envOk
        ? "En Vercel: Settings → Environment Variables. Agregá DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET (o con prefijo dbgc_)."
        : !database.ok
          ? "Revisá que DATABASE_URL sea la connection string correcta de Neon/Postgres y que ya hayas ejecutado prisma db push (y opcional db seed) contra esa base."
          : undefined,
    },
    { status: ok ? 200 : 500 }
  );
}
