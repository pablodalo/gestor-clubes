"use server";

import { revalidatePath } from "next/cache";
import { assertTenantSession } from "@/lib/server-context";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";

const createLotSchema = z.object({
  code: z.string().min(1, "Código requerido"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  locationId: z.string().optional().nullable(),
});

const updateLotSchema = createLotSchema.partial();

export type CreateLotInput = z.infer<typeof createLotSchema>;
export type UpdateLotInput = z.infer<typeof updateLotSchema>;

export async function createLot(input: CreateLotInput) {
  try {
    await requirePermission(PERMISSION_KEYS.lots_create);
  } catch {
    return { error: "No tenés permiso para crear lotes" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = createLotSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const existing = await prisma.inventoryLot.findUnique({
    where: { tenantId_code: { tenantId: ctx.tenantId, code: parsed.data.code } },
  });
  if (existing) return { error: "Ya existe un lote con ese código" };

  if (parsed.data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: parsed.data.locationId, tenantId: ctx.tenantId },
    });
    if (!loc) return { error: "Ubicación no válida" };
  }

  const lot = await prisma.inventoryLot.create({
    data: {
      tenantId: ctx.tenantId,
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      locationId: parsed.data.locationId ?? null,
      createdById: ctx.userId,
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "lot.create",
    entityName: "InventoryLot",
    entityId: lot.id,
    afterJson: JSON.stringify({ code: lot.code }),
    origin: "actions/lots",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/lots`);
  return { data: lot };
}

export async function updateLot(lotId: string, input: UpdateLotInput) {
  try {
    await requirePermission(PERMISSION_KEYS.lots_create);
  } catch {
    return { error: "No tenés permiso para editar lotes" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = updateLotSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const existing = await prisma.inventoryLot.findFirst({
    where: { id: lotId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Lote no encontrado" };

  if (parsed.data.code && parsed.data.code !== existing.code) {
    const duplicate = await prisma.inventoryLot.findUnique({
      where: { tenantId_code: { tenantId: ctx.tenantId, code: parsed.data.code } },
    });
    if (duplicate) return { error: "Ya existe un lote con ese código" };
  }

  if (parsed.data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: parsed.data.locationId, tenantId: ctx.tenantId },
    });
    if (!loc) return { error: "Ubicación no válida" };
  }

  const lot = await prisma.inventoryLot.update({
    where: { id: lotId },
    data: parsed.data as Record<string, unknown>,
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "lot.update",
    entityName: "InventoryLot",
    entityId: lot.id,
    origin: "actions/lots",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/lots`);
  return { data: lot };
}

export async function deleteLot(lotId: string) {
  try {
    await requirePermission(PERMISSION_KEYS.lots_create);
  } catch {
    return { error: "No tenés permiso para eliminar lotes" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const existing = await prisma.inventoryLot.findFirst({
    where: { id: lotId, tenantId: ctx.tenantId },
    include: { _count: { select: { items: true } } },
  });
  if (!existing) return { error: "Lote no encontrado" };
  if (existing._count.items > 0) return { error: "No se puede eliminar un lote que tiene ítems. Reasigná o eliminá los ítems primero." };

  await prisma.inventoryLot.delete({ where: { id: lotId } });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "lot.delete",
    entityName: "InventoryLot",
    entityId: lotId,
    origin: "actions/lots",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/lots`);
  return { ok: true };
}
