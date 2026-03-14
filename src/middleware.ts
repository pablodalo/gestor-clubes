import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware mínimo para evitar problemas con Edge en Vercel.
 * La protección de rutas /platform se hace en los layouts y páginas con getServerSession + redirect.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/platform/:path*"],
};
