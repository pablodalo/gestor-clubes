import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/config/permissions";

/**
 * Obtiene los permission keys que el usuario actual tiene en el contexto tenant.
 * Para platform users retorna null (acceso total); para member retorna null (sin permisos de panel).
 * Para tenant users carga el rol y sus permisos desde la DB.
 */
export async function getTenantUserPermissions(): Promise<Set<string> | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const ctx = (session as unknown as { context?: string }).context;
  if (ctx === "platform") return null; // superadmin: sin restricción por permisos en esta capa
  if (ctx === "member") return new Set(); // socio: sin permisos del panel tenant

  if (ctx !== "tenant") return new Set();
  const userId = (session as unknown as { userId?: string }).userId;
  const tenantId = (session as unknown as { tenantId?: string }).tenantId;
  if (!userId || !tenantId) return new Set();

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, status: "active" },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user?.role) return new Set();
  const keys = new Set(
    user.role.rolePermissions.map((rp) => rp.permission.key)
  );
  return keys;
}

/**
 * Comprueba si el usuario actual (tenant) tiene el permiso indicado.
 * Platform siempre tiene permiso; member nunca (para acciones de panel);
 * tenant user según RolePermission.
 */
export async function hasPermission(key: PermissionKey): Promise<boolean> {
  const perms = await getTenantUserPermissions();
  if (perms === null) return true; // platform
  return perms.has(key);
}

/**
 * Para usar en Server Actions: lanza si el usuario no tiene permiso.
 * Retorna void si tiene permiso.
 */
export async function requirePermission(key: PermissionKey): Promise<void> {
  const ok = await hasPermission(key);
  if (!ok) throw new Error("No tenés permiso para esta acción");
}
