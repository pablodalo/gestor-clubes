import "@/lib/env";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/test-db
 * Prueba la conexión a PostgreSQL y que se pueden crear datos.
 * Llamar desde el navegador o curl para verificar que la DB funciona en Vercel.
 */
export async function GET() {
  try {
    // 1. Probar lectura
    const count = await prisma.tenant.count();
    // 2. Probar escritura: crear un registro de auditoría de prueba
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
      tenantsCount: count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
