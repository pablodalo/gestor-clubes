"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { getTenantSession } from "@/lib/server-context";
import { z } from "zod";

const createMemberSchema = z.object({
  memberNumber: z.string().min(1, "Número de socio requerido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  stateOrProvince: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  status: z.enum(["pending_validation", "active", "suspended", "inactive", "rejected"]).default("active"),
  statusReason: z.string().optional(),
  reprocannNumber: z.string().optional(),
  reprocannAffiliateNumber: z.string().optional(),
  reprocannStartDate: z.string().optional(),
  reprocannEndDate: z.string().optional(),
  reprocannActive: z.boolean().optional(),
  membershipPlanId: z.string().optional().nullable(),
  membershipPlan: z.string().optional(),
  membershipType: z.string().optional(),
  membershipStatus: z.enum(["active", "suspended", "expired", "cancelled", "pending"]).optional(),
  membershipStartDate: z.string().optional(),
  membershipEndDate: z.string().optional(),
  membershipRenewalDate: z.string().optional(),
  membershipNotes: z.string().optional(),
  membershipRecurring: z.boolean().optional(),
  membershipRecurrenceDay: z.coerce.number().int().min(1).max(28).optional(),
  membershipLastPaidAt: z.string().optional(),
  membershipLastAmount: z.string().optional(),
  membershipCurrency: z.string().optional(),
  monthlyLimit: z.string().optional(),
  dailyLimit: z.string().optional(),
  remainingBalance: z.string().optional(),
  canReserveProducts: z.boolean().optional(),
  canPreorder: z.boolean().optional(),
  canAccessEvents: z.boolean().optional(),
  canInviteGuest: z.boolean().optional(),
  allowedCategories: z.union([z.array(z.string()), z.string()]).optional(),
  allowedProducts: z.union([z.array(z.string()), z.string()]).optional(),
  internalNotes: z.string().optional(),
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
  const session = await getTenantSession();
  if (!session) return null;
  const actorName = session.name ?? null;
  return {
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    userId: session.userId,
    actorName,
  };
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
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const email = data.email?.trim() || null;
  const reprocannStartDate = data.reprocannStartDate ? new Date(data.reprocannStartDate) : null;
  const reprocannEndDate = data.reprocannEndDate ? new Date(data.reprocannEndDate) : null;
  const membershipLastPaidAt = data.membershipLastPaidAt ? new Date(data.membershipLastPaidAt) : null;
  const membershipLastAmount = data.membershipLastAmount
    ? new Prisma.Decimal(data.membershipLastAmount)
    : null;
  const birthDate = data.birthDate ? new Date(data.birthDate) : null;
  const membershipStartDate = data.membershipStartDate ? new Date(data.membershipStartDate) : null;
  const membershipEndDate = data.membershipEndDate ? new Date(data.membershipEndDate) : null;
  const membershipRenewalDate = data.membershipRenewalDate ? new Date(data.membershipRenewalDate) : null;
  const monthlyLimit = data.monthlyLimit != null && data.monthlyLimit !== "" ? new Prisma.Decimal(data.monthlyLimit) : null;
  const dailyLimit = data.dailyLimit != null && data.dailyLimit !== "" ? new Prisma.Decimal(data.dailyLimit) : null;
  const remainingBalance = data.remainingBalance != null && data.remainingBalance !== "" ? new Prisma.Decimal(data.remainingBalance) : new Prisma.Decimal(0);
  const allowedCategoriesJson = Array.isArray(data.allowedCategories)
    ? data.allowedCategories
    : typeof data.allowedCategories === "string"
      ? (data.allowedCategories ? (() => { try { return JSON.parse(data.allowedCategories); } catch { return null; } })() : null)
      : null;
  const allowedProductsJson = Array.isArray(data.allowedProducts)
    ? data.allowedProducts
    : typeof data.allowedProducts === "string"
      ? (data.allowedProducts ? (() => { try { return JSON.parse(data.allowedProducts); } catch { return null; } })() : null)
      : null;

  const plan =
    data.membershipPlanId && data.membershipPlanId.trim()
      ? await prisma.membershipPlan.findFirst({
          where: { id: data.membershipPlanId.trim(), tenantId: ctx.tenantId },
          select: {
            id: true,
            name: true,
            currency: true,
            recurrenceDay: true,
            monthlyLimit: true,
            dailyLimit: true,
            validityType: true,
            validUntil: true,
          },
        })
      : null;

  if (data.documentNumber?.trim()) {
    const dupDoc = await prisma.member.findFirst({
      where: { tenantId: ctx.tenantId, documentNumber: data.documentNumber.trim() },
    });
    if (dupDoc) return { error: "Ya existe un socio con ese número de documento en el club" };
  }

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
      documentType: data.documentType || null,
      documentNumber: data.documentNumber?.trim() || null,
      birthDate,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      stateOrProvince: data.stateOrProvince?.trim() || null,
      country: data.country?.trim() || null,
      emergencyContactName: data.emergencyContactName?.trim() || null,
      emergencyContactPhone: data.emergencyContactPhone?.trim() || null,
      status: data.status,
      statusReason: data.statusReason?.trim() || null,
      reprocannNumber: data.reprocannNumber || null,
      reprocannAffiliateNumber: data.reprocannAffiliateNumber || null,
      reprocannStartDate,
      reprocannEndDate,
      reprocannActive: data.reprocannActive ?? false,
      membershipPlanId: plan?.id ?? null,
      membershipPlan: plan?.name ?? null,
      membershipType: data.membershipType || null,
      membershipStatus: data.membershipStatus || null,
      membershipStartDate: membershipStartDate ?? (plan ? new Date() : null),
      membershipEndDate:
        membershipEndDate ??
        (plan && plan.validityType === "fixed_end" && plan.validUntil ? plan.validUntil : null),
      membershipRenewalDate,
      membershipNotes: data.membershipNotes?.trim() || null,
      membershipRecurring: data.membershipRecurring ?? false,
      membershipRecurrenceDay: (data.membershipRecurrenceDay ?? plan?.recurrenceDay) ?? null,
      membershipLastPaidAt,
      membershipLastAmount,
      membershipCurrency: data.membershipCurrency || plan?.currency || "ARS",
      monthlyLimit: plan?.monthlyLimit ?? monthlyLimit,
      dailyLimit: plan?.dailyLimit ?? dailyLimit,
      remainingBalance,
      consumedThisPeriod: new Prisma.Decimal(0),
      canReserveProducts: data.canReserveProducts ?? true,
      canPreorder: data.canPreorder ?? false,
      canAccessEvents: data.canAccessEvents ?? true,
      canInviteGuest: data.canInviteGuest ?? false,
      allowedCategories: allowedCategoriesJson ?? undefined,
      allowedProducts: allowedProductsJson ?? undefined,
      internalNotes: data.internalNotes?.trim() || null,
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const existing = await prisma.member.findFirst({
    where: { id: memberId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Socio no encontrado" };

  const data = parsed.data as Record<string, unknown>;
  const toDate = (v: unknown) => (v && String(v).trim() ? new Date(String(v)) : null);
  const toDecimal = (v: unknown) => (v != null && String(v).trim() !== "" ? new Prisma.Decimal(String(v)) : null);
  const toStr = (v: unknown) => (v == null || String(v).trim() === "" ? null : String(v).trim());
  const toJson = (v: unknown) => {
    if (v == null) return undefined;
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.trim()) { try { return JSON.parse(v); } catch { return undefined; } }
    return undefined;
  };

  if (data.documentNumber != null && String(data.documentNumber).trim()) {
    const dup = await prisma.member.findFirst({
      where: { tenantId: ctx.tenantId, documentNumber: String(data.documentNumber).trim(), id: { not: memberId } },
    });
    if (dup) return { error: "Ya existe otro socio con ese número de documento en el club" };
  }

  const updateData: Record<string, unknown> = {};
  if (data.memberNumber !== undefined) updateData.memberNumber = data.memberNumber;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = toStr(data.email);
  if (data.phone !== undefined) updateData.phone = toStr(data.phone);
  if (data.documentType !== undefined) updateData.documentType = toStr(data.documentType);
  if (data.documentNumber !== undefined) updateData.documentNumber = toStr(data.documentNumber);
  if (data.birthDate !== undefined) updateData.birthDate = toDate(data.birthDate);
  if (data.address !== undefined) updateData.address = toStr(data.address);
  if (data.city !== undefined) updateData.city = toStr(data.city);
  if (data.stateOrProvince !== undefined) updateData.stateOrProvince = toStr(data.stateOrProvince);
  if (data.country !== undefined) updateData.country = toStr(data.country);
  if (data.emergencyContactName !== undefined) updateData.emergencyContactName = toStr(data.emergencyContactName);
  if (data.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = toStr(data.emergencyContactPhone);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.statusReason !== undefined) updateData.statusReason = toStr(data.statusReason);
  if (data.reprocannNumber !== undefined) updateData.reprocannNumber = toStr(data.reprocannNumber);
  if (data.reprocannAffiliateNumber !== undefined) updateData.reprocannAffiliateNumber = toStr(data.reprocannAffiliateNumber);
  if (data.reprocannStartDate !== undefined) updateData.reprocannStartDate = toDate(data.reprocannStartDate);
  if (data.reprocannEndDate !== undefined) updateData.reprocannEndDate = toDate(data.reprocannEndDate);
  if (data.reprocannActive !== undefined) updateData.reprocannActive = data.reprocannActive;
  if (data.membershipPlanId !== undefined) updateData.membershipPlanId = toStr(data.membershipPlanId) || null;
  if (data.membershipPlan !== undefined) updateData.membershipPlan = toStr(data.membershipPlan);
  if (data.membershipType !== undefined) updateData.membershipType = toStr(data.membershipType);
  if (data.membershipStatus !== undefined) updateData.membershipStatus = data.membershipStatus;
  if (data.membershipStartDate !== undefined) updateData.membershipStartDate = toDate(data.membershipStartDate);
  if (data.membershipEndDate !== undefined) updateData.membershipEndDate = toDate(data.membershipEndDate);
  if (data.membershipRenewalDate !== undefined) updateData.membershipRenewalDate = toDate(data.membershipRenewalDate);
  if (data.membershipNotes !== undefined) updateData.membershipNotes = toStr(data.membershipNotes);
  if (data.membershipRecurring !== undefined) updateData.membershipRecurring = data.membershipRecurring;
  if (data.membershipRecurrenceDay !== undefined) updateData.membershipRecurrenceDay = data.membershipRecurrenceDay === "" ? null : data.membershipRecurrenceDay;
  if (data.membershipLastPaidAt !== undefined) updateData.membershipLastPaidAt = toDate(data.membershipLastPaidAt);
  if (data.membershipLastAmount !== undefined) updateData.membershipLastAmount = toDecimal(data.membershipLastAmount);
  if (data.membershipCurrency !== undefined) updateData.membershipCurrency = toStr(data.membershipCurrency);
  if (data.monthlyLimit !== undefined) updateData.monthlyLimit = toDecimal(data.monthlyLimit);
  if (data.dailyLimit !== undefined) updateData.dailyLimit = toDecimal(data.dailyLimit);
  if (data.remainingBalance !== undefined) updateData.remainingBalance = toDecimal(data.remainingBalance) ?? new Prisma.Decimal(0);
  if (data.canReserveProducts !== undefined) updateData.canReserveProducts = data.canReserveProducts;
  if (data.canPreorder !== undefined) updateData.canPreorder = data.canPreorder;
  if (data.canAccessEvents !== undefined) updateData.canAccessEvents = data.canAccessEvents;
  if (data.canInviteGuest !== undefined) updateData.canInviteGuest = data.canInviteGuest;
  if (data.allowedCategories !== undefined) updateData.allowedCategories = toJson(data.allowedCategories);
  if (data.allowedProducts !== undefined) updateData.allowedProducts = toJson(data.allowedProducts);
  if (data.internalNotes !== undefined) updateData.internalNotes = toStr(data.internalNotes);

  // Normalizar plan/campos si se asigna membershipPlanId
  if (updateData.membershipPlanId !== undefined) {
    const planId = updateData.membershipPlanId as string | null;
    if (!planId) {
      updateData.membershipPlan = null;
      updateData.membershipEndDate = null;
    } else {
      const plan = await prisma.membershipPlan.findFirst({
        where: { id: planId, tenantId: ctx.tenantId },
        select: {
          name: true,
          currency: true,
          recurrenceDay: true,
          monthlyLimit: true,
          dailyLimit: true,
          validityType: true,
          validUntil: true,
        },
      });
      if (plan) {
        updateData.membershipPlan = plan.name;
        if (updateData.membershipCurrency === undefined) updateData.membershipCurrency = plan.currency;
        if (updateData.membershipRecurrenceDay === undefined && plan.recurrenceDay != null) {
          updateData.membershipRecurrenceDay = plan.recurrenceDay;
        }
        // Límites salen del plan por defecto (source-of-truth)
        if (plan.monthlyLimit != null) updateData.monthlyLimit = plan.monthlyLimit;
        if (plan.dailyLimit != null) updateData.dailyLimit = plan.dailyLimit;
        // Si cambia de plan, reiniciamos inicio y vigencia según el plan
        if (existing.membershipPlanId !== planId) {
          updateData.membershipStartDate = new Date();
          if (plan.validityType === "fixed_end" && plan.validUntil) {
            updateData.membershipEndDate = plan.validUntil;
          } else {
            updateData.membershipEndDate = null;
          }
        }
      }
    }
  }

  const member = await prisma.member.update({
    where: { id: memberId },
    data: updateData as Parameters<typeof prisma.member.update>[0]["data"],
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

  // Baja lógica: no borrado destructivo
  if (existing.account) {
    await prisma.memberAccount.update({
      where: { id: existing.account.id },
      data: { status: "inactive" },
    });
  }
  await prisma.member.update({
    where: { id: memberId },
    data: { status: "inactive", statusReason: existing.statusReason ?? "Baja solicitada" },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member.delete",
    entityName: "Member",
    entityId: memberId,
    afterJson: JSON.stringify({ status: "inactive", reason: "baja lógica" }),
    origin: "actions/members",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  return { ok: true };
}
