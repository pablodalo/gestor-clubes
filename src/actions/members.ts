"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";

const createMemberSchema = z.object({
  memberNumber: z.string().min(1, "Número de socio requerido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  reprocannNumber: z.string().optional(),
  reprocannAffiliateNumber: z.string().optional(),
  reprocannStartDate: z.string().optional(),
  reprocannEndDate: z.string().optional(),
  reprocannActive: z.boolean().optional(),
  membershipPlan: z.string().optional(),
  membershipRecurring: z.boolean().optional(),
  membershipRecurrenceDay: z.coerce.number().int().min(1).max(28).optional(),
  membershipLastPaidAt: z.string().optional(),
  membershipLastAmount: z.string().optional(),
  membershipCurrency: z.string().optional(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  status: z.enum(["active", "suspended", "inactive"]).default("active"),
});

const updateMemberSchema = createMemberSchema.partial();

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

async function getTenantContext(): Promise<{
  tenantId: string;
  tenantSlug: string;
  userId: string;
  actorName: string | null;
} | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;
  const tenantId = (session as unknown as { tenantId?: string }).tenantId;
  const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
  const userId = (session as unknown as { userId?: string }).userId;
  if (ctx !== "tenant" || !tenantId || !tenantSlug || !userId) return null;
  const actorName = (session as unknown as { user?: { name?: string | null } }).user?.name ?? null;
  return { tenantId, tenantSlug, userId, actorName };
}

export async function createMember(input: CreateMemberInput) {
  try {
    await requirePermission(PERMISSION_KEYS.members_create);
  } catch {
    return { error: "No tenés permiso para crear socios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const email = data.email?.trim() || null;
  const reprocannStartDate = data.reprocannStartDate ? new Date(data.reprocannStartDate) : null;
  const reprocannEndDate = data.reprocannEndDate ? new Date(data.reprocannEndDate) : null;
  const membershipLastPaidAt = data.membershipLastPaidAt ? new Date(data.membershipLastPaidAt) : null;
  const membershipLastAmount = data.membershipLastAmount
    ? new Prisma.Decimal(data.membershipLastAmount)
    : null;

  const existing = await prisma.member.findUnique({
    where: { tenantId_memberNumber: { tenantId: ctx.tenantId, memberNumber: data.memberNumber } },
  });
  if (existing) return { error: "Ya existe un socio con ese número" };

  const member = await prisma.member.create({
    data: {
      tenantId: ctx.tenantId,
      memberNumber: data.memberNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      phone: data.phone || null,
      reprocannNumber: data.reprocannNumber || null,
      reprocannAffiliateNumber: data.reprocannAffiliateNumber || null,
      reprocannStartDate,
      reprocannEndDate,
      reprocannActive: data.reprocannActive ?? false,
      membershipPlan: data.membershipPlan || null,
      membershipRecurring: data.membershipRecurring ?? false,
      membershipRecurrenceDay: data.membershipRecurrenceDay ?? null,
      membershipLastPaidAt,
      membershipLastAmount,
      membershipCurrency: data.membershipCurrency || "ARS",
      documentType: data.documentType || null,
      documentNumber: data.documentNumber || null,
      status: data.status,
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member.create",
    entityName: "Member",
    entityId: member.id,
    afterJson: JSON.stringify({ memberNumber: member.memberNumber, firstName: member.firstName, lastName: member.lastName }),
    origin: "actions/members",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  return { data: member };
}

export async function updateMember(memberId: string, input: UpdateMemberInput) {
  try {
    await requirePermission(PERMISSION_KEYS.members_update);
  } catch {
    return { error: "No tenés permiso para editar socios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const existing = await prisma.member.findFirst({
    where: { id: memberId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Socio no encontrado" };

  const data = parsed.data as Record<string, unknown>;
  const reprocannStartDate = data.reprocannStartDate ? new Date(String(data.reprocannStartDate)) : null;
  const reprocannEndDate = data.reprocannEndDate ? new Date(String(data.reprocannEndDate)) : null;
  const membershipLastPaidAt = data.membershipLastPaidAt ? new Date(String(data.membershipLastPaidAt)) : null;
  const membershipLastAmount = data.membershipLastAmount
    ? new Prisma.Decimal(String(data.membershipLastAmount))
    : null;
  const member = await prisma.member.update({
    where: { id: memberId },
    data: {
      ...data,
      email: data.email === "" ? null : (data.email as string | null),
      phone: data.phone === "" ? null : (data.phone as string | null),
      reprocannNumber: data.reprocannNumber === "" ? null : (data.reprocannNumber as string | null),
      reprocannAffiliateNumber:
        data.reprocannAffiliateNumber === "" ? null : (data.reprocannAffiliateNumber as string | null),
      reprocannStartDate: data.reprocannStartDate ? reprocannStartDate : undefined,
      reprocannEndDate: data.reprocannEndDate ? reprocannEndDate : undefined,
      membershipPlan: data.membershipPlan === "" ? null : (data.membershipPlan as string | null),
      membershipRecurring:
        typeof data.membershipRecurring === "boolean" ? (data.membershipRecurring as boolean) : undefined,
      membershipRecurrenceDay:
        data.membershipRecurrenceDay === "" ? null : (data.membershipRecurrenceDay as number | null),
      membershipLastPaidAt: data.membershipLastPaidAt ? membershipLastPaidAt : undefined,
      membershipLastAmount: data.membershipLastAmount ? membershipLastAmount : undefined,
      membershipCurrency:
        data.membershipCurrency === "" ? null : (data.membershipCurrency as string | null),
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member.update",
    entityName: "Member",
    entityId: member.id,
    origin: "actions/members",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  return { data: member };
}

export async function deleteMember(memberId: string) {
  try {
    await requirePermission(PERMISSION_KEYS.members_delete);
  } catch {
    return { error: "No tenés permiso para eliminar socios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const existing = await prisma.member.findFirst({
    where: { id: memberId, tenantId: ctx.tenantId },
    include: { account: true },
  });
  if (!existing) return { error: "Socio no encontrado" };

  if (existing.account) {
    await prisma.memberAccount.delete({ where: { id: existing.account.id } });
  }
  await prisma.member.delete({ where: { id: memberId } });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member.delete",
    entityName: "Member",
    entityId: memberId,
    origin: "actions/members",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  return { ok: true };
}
