"use server";

import { revalidatePath } from "next/cache";
import { assertTenantSession } from "@/lib/server-context";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const createItemSchema = z.object({
  lotId: z.string().min(1, "Lote requerido"),
  code: z.string().min(1, "Código requerido"),
  type: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  quantityCurrent: z.number().min(0).default(0),
  locationId: z.string().optional().nullable(),
});

const updateItemSchema = z.object({
  code: z.string().min(1).optional(),
  type: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  quantityCurrent: z.number().min(0).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  locationId: z.string().optional().nullable(),
});

export type CreateInventoryItemInput = z.infer<typeof createItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateItemSchema>;

export async function createInventoryItem(input: CreateInventoryItemInput) {
  try {
    await requirePermission(PERMISSION_KEYS.inventory_create);
  } catch {
    return { error: "No tenés permiso para crear ítems de inventario" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: (msg as string) ?? "Datos inválidos" };
  }

  const lot = await prisma.inventoryLot.findFirst({
    where: { id: parsed.data.lotId, tenantId: ctx.tenantId },
  });
  if (!lot) return { error: "Lote no válido para este club" };

  if (parsed.data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: parsed.data.locationId, tenantId: ctx.tenantId },
    });
    if (!loc) return { error: "Ubicación no válida para este club" };
  }

  const item = await prisma.inventoryItem.create({
    data: {
      tenantId: ctx.tenantId,
      lotId: parsed.data.lotId,
      code: parsed.data.code.trim(),
      type: parsed.data.type ?? null,
      unit: parsed.data.unit ?? null,
      quantityCurrent: new Decimal(parsed.data.quantityCurrent),
      status: "active",
      locationId: parsed.data.locationId ?? null,
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
      actorName: ctx.name ?? undefined,
    action: "inventory_item.create",
    entityName: "InventoryItem",
    entityId: item.id,
    afterJson: JSON.stringify({ code: item.code, lotId: item.lotId }),
    origin: "actions/inventory",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/inventory`);
  return { data: item };
}

export async function updateInventoryItem(itemId: string, input: UpdateInventoryItemInput) {
  try {
    await requirePermission(PERMISSION_KEYS.inventory_adjust);
  } catch {
    return { error: "No tenés permiso para modificar ítems de inventario" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const existing = await prisma.inventoryItem.findFirst({
    where: { id: itemId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Ítem no encontrado" };

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: (msg as string) ?? "Datos inválidos" };
  }

  if (parsed.data.locationId !== undefined && parsed.data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: parsed.data.locationId, tenantId: ctx.tenantId },
    });
    if (!loc) return { error: "Ubicación no válida para este club" };
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.code !== undefined) data.code = parsed.data.code.trim();
  if (parsed.data.type !== undefined) data.type = parsed.data.type ?? null;
  if (parsed.data.unit !== undefined) data.unit = parsed.data.unit ?? null;
  if (parsed.data.quantityCurrent !== undefined) data.quantityCurrent = new Decimal(parsed.data.quantityCurrent);
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.locationId !== undefined) data.locationId = parsed.data.locationId ?? null;

  await prisma.inventoryItem.update({
    where: { id: itemId },
    data,
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
      actorName: ctx.name ?? undefined,
    action: "inventory_item.update",
    entityName: "InventoryItem",
    entityId: itemId,
    afterJson: JSON.stringify(data),
    origin: "actions/inventory",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/inventory`);
  return { data: null };
}
