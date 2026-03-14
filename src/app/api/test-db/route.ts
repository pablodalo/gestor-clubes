import "@/lib/env";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalSecret } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/test-db
 * Prueba la conexión a PostgreSQL y escritura. En producción requiere x-internal-secret si INTERNAL_API_SECRET está definido.
 */
export async function GET(request: NextRequest) {
  const unauth = requireInternalSecret(request);
  if (unauth) return unauth;
  try {
    let tenantsCount = 0;
    try {
      tenantsCount = await prisma.tenant.count();
    } catch {
      // Tabla Tenant puede no existir en build; no fallar.
    }
    await prisma.auditLog.create({
      data: {
        tenantId: null,
        actorType: "platform_user",
        actorId: "test-db",
        action: "test.db.write",
        entityName: "Test",
        entityId: null,
        origin: "api/test-db",
      },
    });
    return NextResponse.json({
      ok: true,
      message: "PostgreSQL OK: lectura y escritura correctas",
      tenantsCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
