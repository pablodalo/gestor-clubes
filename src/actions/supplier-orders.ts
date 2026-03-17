"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { assertTenantSession } from "@/lib/server-context";

const orderItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
});

const createOrderSchema = z.object({
  supplierId: z.string().min(1),
  date: z.string().optional(),
  status: z.enum(["draft", "sent", "in_progress", "delivered"]).optional(),
  total: z.coerce.number().nonnegative().optional(),
  messageSnapshot: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

export async function createSupplierOrder(input: z.infer<typeof createOrderSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.suppliers_manage);
  } catch {
    return { error: "No tenés permiso para crear pedidos" };
  }

  const ctx = await assertTenantSession().catch(() => null);
  if (!ctx) return { error: "No autorizado" };

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, tenantId: ctx.tenantId },
    select: { id: true },
  });
  if (!supplier) return { error: "Proveedor no encontrado" };

  const date = data.date ? new Date(data.date) : new Date();
  const total = new Prisma.Decimal(String(data.total ?? 0));

  const created = await prisma.supplierOrder.create({
    data: {
      tenantId: ctx.tenantId,
      supplierId: supplier.id,
      date,
      status: data.status ?? "draft",
      total,
      messageSnapshot: data.messageSnapshot || null,
      items: {
        create: data.items.map((it) => ({
          name: it.name,
          quantity: new Prisma.Decimal(String(it.quantity)),
        })),
      },
    },
    include: { items: true },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/suppliers`);
  revalidatePath(`/app/${ctx.tenantSlug}/suppliers/${supplier.id}`);
  return { data: created };
}

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  supplierId: z.string().min(1),
  status: z.enum(["draft", "sent", "in_progress", "delivered"]),
});

export async function updateSupplierOrderStatus(input: z.infer<typeof updateStatusSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.suppliers_manage);
  } catch {
    return { error: "No tenés permiso para cambiar estados" };
  }

  const ctx = await assertTenantSession().catch(() => null);
  if (!ctx) return { error: "No autorizado" };

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const order = await prisma.supplierOrder.findFirst({
    where: { id: data.orderId, tenantId: ctx.tenantId, supplierId: data.supplierId },
    select: { id: true, supplierId: true },
  });
  if (!order) return { error: "Pedido no encontrado" };

  await prisma.supplierOrder.update({
    where: { id: order.id },
    data: { status: data.status },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/suppliers`);
  revalidatePath(`/app/${ctx.tenantSlug}/suppliers/${order.supplierId}`);
  return { ok: true };
}

const deleteOrderSchema = z.object({
  orderId: z.string().min(1),
  supplierId: z.string().min(1),
});

export async function deleteSupplierOrder(input: z.infer<typeof deleteOrderSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.suppliers_manage);
  } catch {
    return { error: "No tenés permiso para eliminar pedidos" };
  }

  const ctx = await assertTenantSession().catch(() => null);
  if (!ctx) return { error: "No autorizado" };

  const parsed = deleteOrderSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const order = await prisma.supplierOrder.findFirst({
    where: { id: data.orderId, tenantId: ctx.tenantId, supplierId: data.supplierId },
    select: { id: true, supplierId: true },
  });
  if (!order) return { error: "Pedido no encontrado" };

  await prisma.supplierOrder.delete({ where: { id: order.id } });

  revalidatePath(`/app/${ctx.tenantSlug}/suppliers`);
  revalidatePath(`/app/${ctx.tenantSlug}/suppliers/${order.supplierId}`);
  return { ok: true };
}

