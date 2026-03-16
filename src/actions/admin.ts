"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createSupplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
});

const createSupplySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  minQty: z.string().optional(),
  supplierId: z.string().optional(),
});

const createStockMovementSchema = z.object({
  supplyId: z.string().min(1),
  type: z.enum(["in", "out", "adjust"]),
  quantity: z.string().min(1),
  note: z.string().optional(),
});

async function getTenantContext(): Promise<{ tenantId: string; tenantSlug: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;
  const tenantId = (session as unknown as { tenantId?: string }).tenantId;
  const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
  if (ctx !== "tenant" || !tenantId || !tenantSlug) return null;
  return { tenantId, tenantSlug };
}

export async function createSupplier(input: z.infer<typeof createSupplierSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.suppliers_manage);
  } catch {
    return { error: "No tenés permiso para crear proveedores" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createSupplierSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  await prisma.supplier.create({
    data: {
      tenantId: ctx.tenantId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/suppliers`);
  return { ok: true };
}

export async function createSupplyItem(input: z.infer<typeof createSupplySchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.supplies_manage);
  } catch {
    return { error: "No tenés permiso para crear suministros" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createSupplySchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const minQty = parsed.data.minQty ? new Prisma.Decimal(parsed.data.minQty) : new Prisma.Decimal(0);

  await prisma.supplyItem.create({
    data: {
      tenantId: ctx.tenantId,
      supplierId: parsed.data.supplierId || null,
      name: parsed.data.name,
      category: parsed.data.category || null,
      unit: parsed.data.unit || null,
      minQty,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/supplies`);
  return { ok: true };
}

export async function createSupplyMovement(input: z.infer<typeof createStockMovementSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.stock_manage);
  } catch {
    return { error: "No tenés permiso para gestionar stock" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createStockMovementSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const quantity = new Prisma.Decimal(parsed.data.quantity);
  const supply = await prisma.supplyItem.findFirst({
    where: { id: parsed.data.supplyId, tenantId: ctx.tenantId },
  });
  if (!supply) return { error: "Suministro no encontrado" };

  const delta = parsed.data.type === "out" ? quantity.neg() : quantity;
  await prisma.$transaction([
    prisma.supplyStockMovement.create({
      data: {
        tenantId: ctx.tenantId,
        supplyId: supply.id,
        type: parsed.data.type,
        quantity,
        note: parsed.data.note || null,
      },
    }),
    prisma.supplyItem.update({
      where: { id: supply.id },
      data: { currentQty: new Prisma.Decimal(supply.currentQty).add(delta) },
    }),
  ]);

  revalidatePath(`/app/${ctx.tenantSlug}/stock`);
  revalidatePath(`/app/${ctx.tenantSlug}/supplies`);
  return { ok: true };
}
