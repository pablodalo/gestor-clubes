"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createDispensationSchema = z.object({
  strainId: z.string().min(1),
  category: z.enum(["flores", "extractos"]),
  grams: z.string().min(1),
  memberId: z.string().optional(),
  notes: z.string().optional(),
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

export async function createDispensation(input: z.infer<typeof createDispensationSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.inventory_move);
  } catch {
    return { error: "No tenés permiso para registrar salidas" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createDispensationSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const grams = new Prisma.Decimal(data.grams);

  const stock = await prisma.inventoryStock.findFirst({
    where: { tenantId: ctx.tenantId, strainId: data.strainId, category: data.category },
  });
  if (!stock || stock.availableGrams.lessThan(grams)) {
    return { error: "Stock insuficiente" };
  }

  const newQty = stock.availableGrams.minus(grams);
  const status = newQty.greaterThan(0) ? "in_stock" : "out_of_stock";

  await prisma.$transaction([
    prisma.inventoryStock.update({
      where: { id: stock.id },
      data: { availableGrams: newQty, status },
    }),
    prisma.inventoryStockMovement.create({
      data: {
        tenantId: ctx.tenantId,
        stockId: stock.id,
        type: "out",
        grams,
        note: data.notes || null,
      },
    }),
    prisma.dispensation.create({
      data: {
        tenantId: ctx.tenantId,
        memberId: data.memberId || null,
        strainId: data.strainId,
        category: data.category,
        grams,
        notes: data.notes || null,
      },
    }),
  ]);

  revalidatePath(`/app/${ctx.tenantSlug}/inventory`);
  return { ok: true };
}
"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createDispensationSchema = z.object({
  memberId: z.string().min(1),
  category: z.enum(["flores", "extractos"]),
  strainId: z.string().min(1),
  grams: z.string().min(1),
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

export async function createDispensation(input: z.infer<typeof createDispensationSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.dispensations_manage);
  } catch {
    return { error: "No tenés permiso para registrar dispensaciones" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createDispensationSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const grams = new Prisma.Decimal(data.grams);

  const [member, stock] = await Promise.all([
    prisma.member.findFirst({ where: { id: data.memberId, tenantId: ctx.tenantId } }),
    prisma.inventoryStock.findFirst({
      where: { tenantId: ctx.tenantId, category: data.category, strainId: data.strainId },
    }),
  ]);

  if (!member) return { error: "Socio no encontrado" };
  if (!stock) return { error: "No hay stock para esa cepa" };

  const newQty = new Prisma.Decimal(stock.availableGrams).sub(grams);
  if (newQty.isNegative()) return { error: "Stock insuficiente" };

  await prisma.$transaction([
    prisma.dispensation.create({
      data: {
        tenantId: ctx.tenantId,
        memberId: member.id,
        category: data.category,
        strainId: data.strainId,
        grams,
        note: data.note || null,
      },
    }),
    prisma.inventoryStock.update({
      where: { id: stock.id },
      data: { availableGrams: newQty },
    }),
    prisma.inventoryStockMovement.create({
      data: {
        tenantId: ctx.tenantId,
        stockId: stock.id,
        type: "out",
        grams,
        note: `Dispensación a ${member.memberNumber}`,
      },
    }),
  ]);

  revalidatePath(`/app/${ctx.tenantSlug}/inventory`);
  revalidatePath(`/app/${ctx.tenantSlug}/dispensations`);
  return { ok: true };
}
