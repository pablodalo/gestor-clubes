import { NextRequest, NextResponse } from "next/server";
import { recordErrorInDb } from "@/lib/error-log-db";

export const dynamic = "force-dynamic";

/**
 * POST /api/error-log
 * Registra un error desde el cliente (ej. error boundary). Body: { message, digest?, context?, stack? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message : "Unknown error";
    const digest = typeof body?.digest === "string" ? body.digest : null;
    const context = typeof body?.context === "string" ? body.context : null;
    const stack = typeof body?.stack === "string" ? body.stack : null;
    const path = typeof body?.path === "string" ? body.path : null;

    await recordErrorInDb({ message, digest, context, path, stack });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[GESTOR] POST /api/error-log", e);
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
