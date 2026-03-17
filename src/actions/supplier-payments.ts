"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { assertTenantSession } from "@/lib/server-context";

const createPaymentSchema = z.object({
  supplierId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string().optional(),
});

export async function createSupplierPayment(input: z.infer<typeof createPaymentSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.suppliers_manage);
  } catch {
    return { error: "No tenés permiso para registrar pagos" };
  }

  const ctx = await assertTenantSession().catch(() => null);
  if (!ctx) return { error: "No autorizado" };

  const parsed = createPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, tenantId: ctx.tenantId },
    select: { id: true },
  });
  if (!supplier) return { error: "Proveedor no encontrado" };

  const amount = new Prisma.Decimal(String(data.amount));
  const date = data.date ? new Date(data.date) : new Date();

  const created = await prisma.supplierPayment.create({
    data: {
      tenantId: ctx.tenantId,
      supplierId: supplier.id,
      amount,
      date,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/suppliers`);
  revalidatePath(`/app/${ctx.tenantSlug}/suppliers/${supplier.id}`);
  return { data: created };
}

