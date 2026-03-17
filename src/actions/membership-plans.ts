"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { getTenantSession } from "@/lib/server-context";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createPlanSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().default("ARS"),
  recurrenceDay: z.coerce.number().int().min(1).max(28).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const updatePlanSchema = createPlanSchema.partial();

export type CreateMembershipPlanInput = z.infer<typeof createPlanSchema>;
export type UpdateMembershipPlanInput = z.infer<typeof updatePlanSchema>;

async function getTenantContext(): Promise<{
  tenantId: string;
  tenantSlug: string;
  userId: string;
  actorName: string | null;
} | null> {
  const session = await getTenantSession();
  if (!session) return null;
  return {
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    userId: session.userId,
    actorName: session.name ?? null,
  };
}

export async function getMembershipPlans() {
  const ctx = await getTenantContext();
  if (!ctx) return [];
  try {
    await requirePermission(PERMISSION_KEYS.members_read);
  } catch {
    return [];
  }
  return prisma.membershipPlan.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { name: "asc" },
  });
}

export async function createMembershipPlan(input: CreateMembershipPlanInput) {
  try {
    await requirePermission(PERMISSION_KEYS.members_create);
  } catch {
    return { error: "No tenés permiso para crear planes de membresía" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createPlanSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const price = data.price != null && data.price !== "" ? new Prisma.Decimal(data.price) : null;

  const existing = await prisma.membershipPlan.findUnique({
    where: { tenantId_name: { tenantId: ctx.tenantId, name: data.name } },
  });
  if (existing) return { error: "Ya existe un plan con ese nombre" };

  const plan = await prisma.membershipPlan.create({
    data: {
      tenantId: ctx.tenantId,
      name: data.name,
      description: data.description?.trim() || null,
      price,
      currency: data.currency || "ARS",
      recurrenceDay: data.recurrenceDay ?? null,
      status: data.status,
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "membership_plan.create",
    entityName: "MembershipPlan",
    entityId: plan.id,
    afterJson: JSON.stringify({ name: plan.name, price: plan.price?.toString(), status: plan.status }),
    origin: "actions/membership-plans",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/memberships`);
  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  return { data: plan };
}

export async function updateMembershipPlan(planId: string, input: UpdateMembershipPlanInput) {
  try {
    await requirePermission(PERMISSION_KEYS.members_update);
  } catch {
    return { error: "No tenés permiso para editar planes de membresía" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = updatePlanSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const existing = await prisma.membershipPlan.findFirst({
    where: { id: planId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Plan no encontrado" };

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = typeof data.description === "string" ? data.description.trim() || null : null;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.recurrenceDay !== undefined) updateData.recurrenceDay = data.recurrenceDay;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.price !== undefined) {
    updateData.price = data.price != null && data.price !== "" ? new Prisma.Decimal(String(data.price)) : null;
  }

  if (data.name && data.name !== existing.name) {
    const dup = await prisma.membershipPlan.findUnique({
      where: { tenantId_name: { tenantId: ctx.tenantId, name: data.name } },
    });
    if (dup) return { error: "Ya existe un plan con ese nombre" };
  }

  const plan = await prisma.membershipPlan.update({
    where: { id: planId },
    data: updateData,
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "membership_plan.update",
    entityName: "MembershipPlan",
    entityId: plan.id,
    beforeJson: JSON.stringify({ name: existing.name, status: existing.status }),
    afterJson: JSON.stringify({ name: plan.name, status: plan.status }),
    origin: "actions/membership-plans",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/memberships`);
  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  return { data: plan };
}

export async function deleteMembershipPlan(planId: string) {
  try {
    await requirePermission(PERMISSION_KEYS.members_delete);
  } catch {
    return { error: "No tenés permiso para eliminar planes de membresía" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const existing = await prisma.membershipPlan.findFirst({
    where: { id: planId, tenantId: ctx.tenantId },
    include: { _count: { select: { members: true } } },
  });
  if (!existing) return { error: "Plan no encontrado" };
  if (existing._count.members > 0) {
    return { error: "No se puede eliminar: hay socios asignados a este plan. Reasigná o quitá el plan primero." };
  }

  await prisma.membershipPlan.delete({ where: { id: planId } });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "membership_plan.delete",
    entityName: "MembershipPlan",
    entityId: planId,
    beforeJson: JSON.stringify({ name: existing.name }),
    origin: "actions/membership-plans",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/memberships`);
  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  return { data: null };
}
