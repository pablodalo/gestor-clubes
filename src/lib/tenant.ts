import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/server-log";

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  status: string;
  locale: string;
};

/**
 * Resuelve el tenant por slug. Usar en layout/pages de /app/[tenantSlug] y /portal/[tenantSlug].
 */
export async function getTenantBySlug(slug: string): Promise<TenantContext | null> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { slug, status: "active" },
      select: { id: true, slug: true, name: true, status: true, locale: true },
    });
    return tenant;
  } catch (err) {
    logError(`getTenantBySlug(${slug})`, err);
    return null;
  }
}

/**
 * Obtiene el tenant por ID (cuando ya tienes el id en sesión).
 */
export async function getTenantById(id: string): Promise<TenantContext | null> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id, status: "active" },
      select: { id: true, slug: true, name: true, status: true, locale: true },
    });
    return tenant;
  } catch (err) {
    logError(`getTenantById(${id})`, err);
    return null;
  }
}

/**
 * Helper para asegurar que todas las queries de negocio incluyan tenantId.
 * Uso: where: { ...tenantWhere(tenantId), ...otherConditions }
 */
export function tenantWhere(tenantId: string) {
  return { tenantId };
}
