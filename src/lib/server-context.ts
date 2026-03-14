import { getServerSession } from "next-auth";
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

/**
 * Obtiene la sesión actual. Si no hay sesión o no es tenant, retorna null.
 * Usar en Server Actions del panel tenant: el tenantId/tenantSlug vienen de sesión, nunca del cliente.
 */
export async function getTenantSession(): Promise<TenantSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "tenant") return null;
  const userId = (session as unknown as { userId?: string }).userId;
  const tenantId = (session as unknown as { tenantId?: string }).tenantId;
  const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
  if (!userId || !tenantId || !tenantSlug) return null;
  return {
    context: "tenant",
    userId,
    tenantId,
    tenantSlug,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  };
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
