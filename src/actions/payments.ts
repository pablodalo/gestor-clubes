"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createPaymentSchema = z.object({
  memberId: z.string().min(1),
  amount: z.string().min(1),
  currency: z.string().min(1),
  paidAt: z.string().optional(),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

async function getTenantContext(): Promise<{
  tenantId: string;
  tenantSlug: string;
  userId: string;
} | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;
  const tenantId = (session as unknown as { tenantId?: string }).tenantId;
  const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
  const userId = (session as unknown as { userId?: string }).userId;
  if (ctx !== "tenant" || !tenantId || !tenantSlug || !userId) return null;
  return { tenantId, tenantSlug, userId };
}

export async function createPayment(input: z.infer<typeof createPaymentSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.payments_create);
  } catch {
    return { error: "No tenés permiso para registrar pagos" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
  const amount = new Prisma.Decimal(data.amount);

  const member = await prisma.member.findFirst({
    where: { id: data.memberId, tenantId: ctx.tenantId },
  });
  if (!member) return { error: "Socio no encontrado" };

  const payment = await prisma.membershipPayment.create({
    data: {
      tenantId: ctx.tenantId,
      memberId: member.id,
      amount,
      currency: data.currency,
      paidAt,
      method: data.method || null,
      reference: data.reference || null,
      notes: data.notes || null,
    },
  });

  await prisma.member.update({
    where: { id: member.id },
    data: {
      membershipLastPaidAt: paidAt,
      membershipLastAmount: amount,
      membershipCurrency: data.currency,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/payments`);
  revalidatePath(`/app/${ctx.tenantSlug}/revenue`);
  return { data: payment };
}
