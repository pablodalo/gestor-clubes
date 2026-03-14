import { prisma } from "@/lib/prisma";

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  status: string;
};

/**
 * Resuelve el tenant por slug. Usar en layout/pages de /app/[tenantSlug] y /portal/[tenantSlug].
 */
export async function getTenantBySlug(slug: string): Promise<TenantContext | null> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug, status: "active" },
    select: { id: true, slug: true, name: true, status: true },
  });
  return tenant;
}

/**
 * Obtiene el tenant por ID (cuando ya tienes el id en sesión).
 */
export async function getTenantById(id: string): Promise<TenantContext | null> {
  const tenant = await prisma.tenant.findFirst({
    where: { id, status: "active" },
    select: { id: true, slug: true, name: true, status: true },
  });
  return tenant;
}

/**
 * Helper para asegurar que todas las queries de negocio incluyan tenantId.
 * Uso: where: { ...tenantWhere(tenantId), ...otherConditions }
 */
export function tenantWhere(tenantId: string) {
  return { tenantId };
}
