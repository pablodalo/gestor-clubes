"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { getTenantSession } from "@/lib/server-context";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { z } from "zod";

async function getTenantContext() {
  const session = await getTenantSession();
  if (!session) return null;
  return {
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    userId: session.userId,
  };
}

export async function getMemberNotificationsForAdmin(memberId: string) {
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

  const list = await prisma.notification.findMany({
    where: { tenantId: ctx.tenantId, memberId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { data: list };
}

export async function getMemberNotificationsForPortal(tenantSlug: string) {
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return { error: "No autorizado", data: [] };

  const list = await prisma.notification.findMany({
    where: { tenantId: session.tenant.id, memberId: session.member.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { data: list };
}

export async function markMemberNotificationRead(notificationId: string, tenantSlug: string) {
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return { error: "No autorizado" };

  const n = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      tenantId: session.tenant.id,
      memberId: session.member.id,
    },
  });
  if (!n) return { error: "Notificación no encontrada" };

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });
  revalidatePath(`/portal/socios/${tenantSlug}`);
  return { ok: true };
}

const createSchema = z.object({
  memberId: z.string().min(1),
  title: z.string().min(1, "Título requerido"),
  body: z.string().optional(),
  type: z.string().optional(),
});

export async function createMemberNotification(input: z.infer<typeof createSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.members_update);
  } catch {
    return { error: "No tenés permiso para enviar notificaciones a socios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const member = await prisma.member.findFirst({
    where: { id: parsed.data.memberId, tenantId: ctx.tenantId },
  });
  if (!member) return { error: "Socio no encontrado" };

  await prisma.notification.create({
    data: {
      tenantId: ctx.tenantId,
      memberId: member.id,
      title: parsed.data.title,
      body: parsed.data.body ?? null,
      type: parsed.data.type ?? null,
      read: false,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  revalidatePath(`/app/${ctx.tenantSlug}/members/${parsed.data.memberId}`);
  return { ok: true };
}
