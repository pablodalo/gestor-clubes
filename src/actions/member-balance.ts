"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { getTenantSession } from "@/lib/server-context";
import { z } from "zod";

async function getTenantContext() {
  const session = await getTenantSession();
  if (!session) return null;
  return {
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    userId: session.userId,
    actorName: session.name ?? null,
  };
}

const adjustSchema = z.object({
  memberId: z.string().min(1),
  amount: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) !== 0, "Monto inválido"),
  type: z.enum(["adjustment", "consumption", "reset"]).default("adjustment"),
  note: z.string().optional(),
});

export async function adjustMemberBalance(input: z.infer<typeof adjustSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.members_update);
  } catch {
    return { error: "No tenés permiso para ajustar saldos" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const member = await prisma.member.findFirst({
    where: { id: parsed.data.memberId, tenantId: ctx.tenantId },
  });
  if (!member) return { error: "Socio no encontrado" };

  const amount = new Prisma.Decimal(parsed.data.amount);
  const current = member.remainingBalance ?? new Prisma.Decimal(0);
  let newBalance: Prisma.Decimal;
  if (parsed.data.type === "reset") {
    newBalance = amount;
  } else {
    newBalance = current.add(amount);
  }
  if (newBalance.lessThan(0)) newBalance = new Prisma.Decimal(0);

  await prisma.$transaction([
    prisma.memberBalanceAdjustment.create({
      data: {
        tenantId: ctx.tenantId,
        memberId: member.id,
        amount,
        type: parsed.data.type,
        note: parsed.data.note ?? null,
        createdById: ctx.userId,
      },
    }),
    prisma.member.update({
      where: { id: member.id },
      data: { remainingBalance: newBalance },
    }),
  ]);

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member.balance_adjust",
    entityName: "Member",
    entityId: member.id,
    afterJson: JSON.stringify({
      type: parsed.data.type,
      amount: amount.toString(),
      newBalance: newBalance.toString(),
      note: parsed.data.note,
    }),
    origin: "actions/member-balance",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  revalidatePath(`/app/${ctx.tenantSlug}/members/${parsed.data.memberId}`);
  return { ok: true };
}

export async function getMemberBalanceAdjustments(memberId: string) {
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

  const list = await prisma.memberBalanceAdjustment.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { data: list };
}

export async function getMemberBalanceAdjustmentsForPortal(tenantSlug: string) {
  const { getMemberAndTenantFromSession } = await import("@/lib/portal-session");
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return { error: "No autorizado", data: [] };

  const list = await prisma.memberBalanceAdjustment.findMany({
    where: { memberId: session.member.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return { data: list };
}

/**
 * Elimina un movimiento de saldo. Solo administradores del panel (members_update).
 * Valida que el ajuste pertenezca al member y al tenant de la sesión.
 */
export async function deleteMemberBalanceAdjustment(adjustmentId: string, memberId: string) {
  try {
    await requirePermission(PERMISSION_KEYS.members_update);
  } catch {
    return { error: "No tenés permiso para eliminar movimientos" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: ctx.tenantId },
  });
  if (!member) return { error: "Socio no encontrado" };

  const adjustment = await prisma.memberBalanceAdjustment.findFirst({
    where: { id: adjustmentId, memberId, tenantId: ctx.tenantId },
  });
  if (!adjustment) return { error: "Movimiento no encontrado" };

  await prisma.memberBalanceAdjustment.delete({
    where: { id: adjustmentId },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member.balance_adjustment_delete",
    entityName: "MemberBalanceAdjustment",
    entityId: adjustmentId,
    afterJson: JSON.stringify({
      memberId,
      amount: adjustment.amount.toString(),
      type: adjustment.type,
      note: adjustment.note,
    }),
    origin: "actions/member-balance",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  revalidatePath(`/app/${ctx.tenantSlug}/members/${memberId}`);
  return { ok: true };
}
