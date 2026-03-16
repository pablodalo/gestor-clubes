"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { getTenantSession } from "@/lib/server-context";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";

async function getTenantContext() {
  const session = await getTenantSession();
  if (!session) return null;
  return { tenantId: session.tenantId, tenantSlug: session.tenantSlug };
}

export async function getMemberHistoryForAdmin(memberId: string) {
  try {
    await requirePermission(PERMISSION_KEYS.members_read);
  } catch {
    return { error: "Sin permiso", data: [] };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado", data: [] };

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: ctx.tenantId },
  });
  if (!member) return { error: "Socio no encontrado", data: [] };

  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId: ctx.tenantId,
      OR: [
        { entityName: "Member", entityId: memberId },
        { entityName: "MemberAccount", entityId: memberId },
        { action: { contains: "member", mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return { data: logs };
}

export async function getMemberHistoryForPortal(tenantSlug: string) {
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return { error: "No autorizado", data: [] };

  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId: session.tenant.id,
      OR: [
        { entityName: "Member", entityId: session.member.id },
        { entityName: "MemberAccount", entityId: session.member.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { data: logs };
}
