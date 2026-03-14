import "@/lib/env";
import { NextResponse } from "next/server";

/**
 * GET /api/env-check
 * Indica si las variables necesarias están definidas (sin mostrar valores).
 * Útil cuando hay "Application error" en superadmin.
 */
export async function GET() {
  const hasDb = !!(process.env.DATABASE_URL || process.env.dbgc_DATABASE_URL);
  const hasAuthUrl = !!(process.env.NEXTAUTH_URL || process.env.dbgc_NEXTAUTH_URL);
  const hasAuthSecret = !!(process.env.NEXTAUTH_SECRET || process.env.dbgc_NEXTAUTH_SECRET);
  const ok = hasDb && hasAuthUrl && hasAuthSecret;
  return NextResponse.json({
    ok,
    env: {
      DATABASE_URL: hasDb ? "set" : "missing",
      NEXTAUTH_URL: hasAuthUrl ? "set" : "missing",
      NEXTAUTH_SECRET: hasAuthSecret ? "set" : "missing",
    },
    hint: !hasAuthSecret
      ? "En Vercel agregá NEXTAUTH_SECRET (o dbgc_NEXTAUTH_SECRET) y redeployá."
      : undefined,
  });
}
