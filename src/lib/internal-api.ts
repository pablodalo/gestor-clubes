import { NextRequest, NextResponse } from "next/server";

/**
 * En producción, si INTERNAL_API_SECRET está definido, exige que el request
 * envíe el mismo valor en el header x-internal-secret. Si no coincide, devuelve 401.
 * Si INTERNAL_API_SECRET no está definido o no es producción, no exige nada.
 */
export function requireInternalSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (process.env.NODE_ENV !== "production" || !secret) return null;

  const provided = request.headers.get("x-internal-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
