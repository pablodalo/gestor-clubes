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
  // Fuente principal futura:
  // - `productId` permite resolver canónico (category) y strain de forma determinística.
  // Compatibilidad PR2:
  // - si `productId` no viene, se permite el flujo viejo con `category` + `strainId`.
  productId: z.string().min(1).optional(),

  // Deprecated (PR1 compat): usar solo si no se envía `productId`.
  strainId: z.string().min(1).optional(),
  category: z.enum(["flores", "extractos"]).optional(),
  grams: z.string().min(1),
  memberId: z.string().min(1),
  notes: z.string().optional(),
}).refine(
  (v) => {
    // Aceptar si viene productId (strain/cat se resuelven desde Product)
    if (v.productId) return true;
    // Si no hay productId, debe existir strainId + category legacy
    return !!v.strainId && !!v.category;
  },
  { message: "ProductId requerido o (category + strainId) para compatibilidad" }
);

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

  const now = new Date();
  const grams = new Prisma.Decimal(data.grams.replace(",", "."));

  const canonicalCategory = (cat: string | null | undefined): "plant_material" | "extract" | null => {
    if (!cat) return null;
    if (cat === "plant_material" || cat === "flores") return "plant_material";
    if (cat === "extract" || cat === "extractos") return "extract";
    return null;
  };

  const canonicalToLegacyStockCategory = (cat: "plant_material" | "extract") =>
    cat === "plant_material" ? "flores" : "extractos";

  const resolveMembershipPeriod = (member: {
    membershipRecurring: boolean;
    membershipRecurrenceDay: number | null;
    membershipStartDate: Date | null;
  }) => {
    // Período mensual lógico para límites.
    // - Recurring: se calcula por `membershipRecurrenceDay` como frontera del período.
    // - No recurring: se usa el mes calendario actual (con ajuste por start si aplica).
    if (member.membershipRecurring && member.membershipRecurrenceDay) {
      const day = member.membershipRecurrenceDay;
      let start = new Date(now.getFullYear(), now.getMonth(), day, 0, 0, 0, 0);
      if (now < start) {
        start = new Date(now.getFullYear(), now.getMonth() - 1, day, 0, 0, 0, 0);
      }
      const end = new Date(start.getFullYear(), start.getMonth() + 1, day, 0, 0, 0, 0);
      return { start, end };
    }

    let start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    if (member.membershipStartDate && member.membershipStartDate > start) {
      start = new Date(member.membershipStartDate);
    }
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end };
  };

  const dayBounds = () => {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    return { dayStart, dayEnd };
  };

  // 1) validar socio y membresía vigente
  const member = await prisma.member.findFirst({
    where: { id: data.memberId, tenantId: ctx.tenantId },
    include: { membershipPlanRel: true },
  });

  if (!member) return { error: "Socio no encontrado" };
  if (!member.membershipPlanId || !member.membershipPlanRel) return { error: "Socio sin plan de membresía" };

  const membershipPlan = member.membershipPlanRel;
  if (member.membershipStatus && member.membershipStatus !== "active") {
    return { error: "Membresía no activa" };
  }
  if (member.membershipEndDate && member.membershipEndDate < now) {
    return { error: "Membresía vencida" };
  }

  // 2) resolver productId y categoría canónica (y strain)
  let resolvedProductId: string | null = null;
  let resolvedStrainId: string;
  let resolvedCanonicalCategory: "plant_material" | "extract";

  if (data.productId) {
    const product = await prisma.product.findFirst({
      where: { id: data.productId, tenantId: ctx.tenantId },
      select: { id: true, category: true, strainId: true },
    });

    if (!product) return { error: "Producto no encontrado" };
    const canon = canonicalCategory(product.category);
    if (!canon) return { error: "Producto no dispensable (categoría)" };
    if (!product.strainId) return { error: "Producto sin strain configurado" };

    resolvedProductId = product.id;
    resolvedStrainId = product.strainId;
    resolvedCanonicalCategory = canon;
  } else {
    // Compatibilidad con payload viejo (deprecated): category + strainId.
    if (!data.strainId || !data.category) return { error: "Datos inválidos" };
    const canon = canonicalCategory(data.category);
    if (!canon) return { error: "Producto no dispensable (categoría)" };

    resolvedProductId = null;
    resolvedStrainId = data.strainId;
    resolvedCanonicalCategory = canon;
  }

  // 3) validar que el producto sea dispensable
  if (resolvedCanonicalCategory !== "plant_material" && resolvedCanonicalCategory !== "extract") {
    return { error: "Producto no dispensable" };
  }

  // 4) validar stock disponible
  const legacyStockCategory = canonicalToLegacyStockCategory(resolvedCanonicalCategory);
  const stock = await prisma.inventoryStock.findFirst({
    where: { tenantId: ctx.tenantId, strainId: resolvedStrainId, category: legacyStockCategory },
  });

  if (!stock || stock.availableGrams.lessThan(grams)) {
    return { error: "Stock insuficiente" };
  }

  const newQty = stock.availableGrams.minus(grams);

  // 5) calcular consumo actual por categoría desde Dispensation
  const { start: periodStart, end: periodEnd } = resolveMembershipPeriod({
    membershipRecurring: member.membershipRecurring,
    membershipRecurrenceDay: member.membershipRecurrenceDay ?? null,
    membershipStartDate: member.membershipStartDate ?? null,
  });
  const { dayStart, dayEnd } = dayBounds();

  const dispensationsInPeriod = await prisma.dispensation.findMany({
    where: {
      tenantId: ctx.tenantId,
      memberId: member.id,
      dispensedAt: { gte: periodStart, lt: periodEnd },
    },
    select: {
      grams: true,
      category: true,
      product: { select: { category: true } },
      dispensedAt: true,
    },
  });

  const consumedMonthly: Record<"plant_material" | "extract", Prisma.Decimal> = {
    plant_material: new Prisma.Decimal(0),
    extract: new Prisma.Decimal(0),
  };
  const consumedDaily: Record<"plant_material" | "extract", Prisma.Decimal> = {
    plant_material: new Prisma.Decimal(0),
    extract: new Prisma.Decimal(0),
  };

  for (const d of dispensationsInPeriod) {
    const canon =
      canonicalCategory(d.product?.category ?? undefined) ?? canonicalCategory(d.category ?? undefined);
    if (!canon) continue;

    consumedMonthly[canon] = consumedMonthly[canon].add(d.grams);
    if (d.dispensedAt >= dayStart && d.dispensedAt < dayEnd) {
      consumedDaily[canon] = consumedDaily[canon].add(d.grams);
    }
  }

  // 6) validar límites por categoría (MembershipLimitRule o fallback del plan)
  const limitRule = await prisma.membershipLimitRule.findFirst({
    where: {
      tenantId: ctx.tenantId,
      membershipPlanId: member.membershipPlanId ?? undefined,
      category: resolvedCanonicalCategory,
      active: true,
    },
  });

  const monthlyLimit = (limitRule?.monthlyLimit ?? membershipPlan.monthlyLimit) ?? null;
  const dailyLimit = (limitRule?.dailyLimit ?? membershipPlan.dailyLimit) ?? null;

  const afterMonthly = consumedMonthly[resolvedCanonicalCategory].add(grams);
  const afterDaily = consumedDaily[resolvedCanonicalCategory].add(grams);

  if (monthlyLimit != null && afterMonthly.greaterThan(monthlyLimit)) {
    return { error: "Excediste el límite mensual por categoría" };
  }
  if (dailyLimit != null && afterDaily.greaterThan(dailyLimit)) {
    return { error: "Excediste el límite diario por categoría" };
  }

  // 7) crear dispensación
  // 8) crear movimiento de inventario
  await prisma.$transaction([
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
        note: data.notes || null,
      },
    }),
    prisma.dispensation.create({
      data: {
        tenantId: ctx.tenantId,
        memberId: member.id,
        productId: resolvedProductId,
        strainId: resolvedStrainId,
        category: legacyStockCategory,
        grams,
        note: data.notes || null,
      },
    }),
  ]);

  // 9) devolver resumen actualizado derivado
  const summary = {
    memberId: member.id,
    category: resolvedCanonicalCategory,
    consumedMonthlyAfter: afterMonthly.toString(),
    consumedDailyAfter: afterDaily.toString(),
    monthlyLimitUsed: monthlyLimit?.toString?.() ?? null,
    dailyLimitUsed: dailyLimit?.toString?.() ?? null,
    stockRemainingAfter: newQty.toString(),
  };

  revalidatePath(`/app/${ctx.tenantSlug}/inventory`);
  revalidatePath(`/app/${ctx.tenantSlug}/dispensations`);
  return { ok: true, summary };
}
