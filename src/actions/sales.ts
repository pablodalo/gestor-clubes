"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createSaleSchema = z.object({
  memberId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.string().min(1),
  paidAt: z.string().optional(),
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

export async function createSale(input: z.infer<typeof createSaleSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.sales_manage);
  } catch {
    return { error: "No tenés permiso para registrar ventas" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const quantity = new Prisma.Decimal(data.quantity);

  const [member, product] = await Promise.all([
    prisma.member.findFirst({ where: { id: data.memberId, tenantId: ctx.tenantId } }),
    prisma.product.findFirst({ where: { id: data.productId, tenantId: ctx.tenantId, status: "active" } }),
  ]);
  if (!member) return { error: "Socio no encontrado" };
  if (!product) return { error: "Producto no encontrado" };

  const unitPrice = product.price;
  const total = new Prisma.Decimal(unitPrice).mul(quantity);
  const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();

  const order = await prisma.salesOrder.create({
    data: {
      tenantId: ctx.tenantId,
      memberId: member.id,
      status: "paid",
      totalAmount: total,
      currency: product.currency,
      paidAt,
      items: {
        create: {
          productId: product.id,
          quantity,
          unitPrice,
          total,
        },
      },
    },
    include: { items: true },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/sales`);
  return { data: order };
}
