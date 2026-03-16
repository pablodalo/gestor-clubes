import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PlatformSession = {
  context: "platform";
  userId: string;
  email: string;
  name: string;
};

export type TenantSession = {
  context: "tenant";
  userId: string;
  tenantId: string;
  tenantSlug: string;
  email: string;
  name: string;
};

/**
 * Obtiene la sesión actual. Si no hay sesión o no es platform, retorna null.
 */
export async function getPlatformSession(): Promise<PlatformSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") return null;
  const userId = (session as unknown as { userId?: string }).userId;
  if (!userId) return null;
  return {
    context: "platform",
    userId,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  };
}

function getTenantSlugFromHeaders(): string | null {
  try {
    const h = headers();
    const referer = h.get("referer") ?? "";
    const match = referer.match(/\/app\/([^\/\?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Obtiene la sesión actual en contexto tenant.
 * Para usuarios del panel (ctx === "tenant") toma tenantId/slug de la sesión.
 * Para superadmin (ctx === "platform") intenta inferir el tenant a partir de la URL (/app/[slug])
 * para permitir operar como "viewer" del tenant sin romper la seguridad.
 */
export async function getTenantSession(): Promise<TenantSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;

  const base = {
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  };

  if (ctx === "tenant") {
    const userId = (session as unknown as { userId?: string }).userId;
    const tenantId = (session as unknown as { tenantId?: string }).tenantId;
    const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
    if (!userId || !tenantId || !tenantSlug) return null;
    return {
      context: "tenant",
      userId,
      tenantId,
      tenantSlug,
      ...base,
    };
  }

  // Vista superadmin sobre un tenant (/app/[tenantSlug]) — se arma un contexto tenant sintético.
  if (ctx === "platform") {
    const userId = (session as unknown as { userId?: string }).userId;
    if (!userId) return null;
    let tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
    if (!tenantSlug) {
      tenantSlug = getTenantSlugFromHeaders() ?? undefined;
    }
    if (!tenantSlug) return null;
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) return null;
    return {
      context: "tenant",
      userId,
      tenantId: tenant.id,
      tenantSlug,
      ...base,
    };
  }

  return null;
}

/**
 * Exige sesión tenant. Lanza si no hay sesión o no es contexto tenant.
 * Usar al inicio de Server Actions que modifican datos del tenant.
 */
export async function assertTenantSession(): Promise<TenantSession> {
  const ctx = await getTenantSession();
  if (!ctx) throw new Error("No autorizado: se requiere sesión de operador del club.");
  return ctx;
}

/**
 * Exige sesión platform. Lanza si no hay sesión o no es superadmin.
 */
export async function assertPlatformSession(): Promise<PlatformSession> {
  const ctx = await getPlatformSession();
  if (!ctx) throw new Error("No autorizado: se requiere sesión de superadmin.");
  return ctx;
}

/**
 * Valida que el tenantId exista. Usar en acciones platform cuando el tenantId viene del cliente (ej. branding).
 * Retorna true si existe; false si no. No lanza.
 */
export async function validateTenantIdExists(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });
  return !!tenant;
}
