"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createEventSchema = z.object({
  lotId: z.string().min(1),
  type: z.string().min(1),
  happenedAt: z.string().optional(),
  note: z.string().optional(),
});

const updateScheduleSchema = z.object({
  lotId: z.string().min(1),
  nextWateringAt: z.string().optional(),
  nextFeedingAt: z.string().optional(),
});

const createTaskSchema = z.object({
  lotId: z.string().min(1),
  type: z.enum(["secado", "curado", "listo"]),
  dueAt: z.string().min(1),
});

const transferSchema = z.object({
  lotId: z.string().min(1),
  items: z.array(
    z.object({
      strainId: z.string().min(1),
      category: z.enum(["flores", "extractos"]),
      grams: z.string().min(1),
    })
  ),
});

const transferInventorySchema = z.object({
  lotId: z.string().min(1),
  strainId: z.string().min(1),
  category: z.enum(["flores", "extractos"]),
  grams: z.string().min(1),
});

const createStrainSchema = z.object({
  name: z.string().min(1),
  genetics: z.string().optional(),
  thcPct: z.string().optional(),
  cbdPct: z.string().optional(),
  cycleDays: z.string().optional(),
});

const createPlantSchema = z.object({
  code: z.string().min(1),
  strainId: z.string().min(1),
  stage: z.string().optional(),
  status: z.string().optional(),
  plantedAt: z.string().optional(),
});

const createControlSchema = z.object({
  controlDate: z.string().optional(),
  temperature: z.string().optional(),
  humidity: z.string().optional(),
  ph: z.string().optional(),
  ec: z.string().optional(),
  pests: z.string().optional(),
  note: z.string().optional(),
});

const updateTimelineSchema = z.object({
  lotId: z.string().min(1),
  harvestedAt: z.string().optional(),
  dryingStartedAt: z.string().optional(),
  curingStartedAt: z.string().optional(),
  readyAt: z.string().optional(),
});

async function getTenantContext(): Promise<{
  tenantId: string;
  tenantSlug: string;
} | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;
  const tenantId = (session as unknown as { tenantId?: string }).tenantId;
  const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
  if (ctx !== "tenant" || !tenantId || !tenantSlug) return null;
  return { tenantId, tenantSlug };
}

export async function createCultivationEvent(input: z.infer<typeof createEventSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.cultivation_manage);
  } catch {
    return { error: "No tenés permiso para registrar eventos" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const lot = await prisma.cultivationLot.findFirst({
    where: { id: data.lotId, tenantId: ctx.tenantId },
  });
  if (!lot) return { error: "Lote no encontrado" };

  const event = await prisma.cultivationEvent.create({
    data: {
      tenantId: ctx.tenantId,
      cultivationLotId: lot.id,
      type: data.type,
      happenedAt: data.happenedAt ? new Date(data.happenedAt) : new Date(),
      note: data.note || null,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/cultivation`);
  revalidatePath(`/app/${ctx.tenantSlug}/cultivation/${lot.id}`);
  return { data: event };
}

export async function updateCultivationSchedule(input: z.infer<typeof updateScheduleSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.cultivation_manage);
  } catch {
    return { error: "No tenés permiso para editar el calendario" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = updateScheduleSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const lot = await prisma.cultivationLot.findFirst({
    where: { id: data.lotId, tenantId: ctx.tenantId },
  });
  if (!lot) return { error: "Lote no encontrado" };

  await prisma.cultivationLot.update({
    where: { id: lot.id },
    data: {
      nextWateringAt: data.nextWateringAt ? new Date(data.nextWateringAt) : null,
      nextFeedingAt: data.nextFeedingAt ? new Date(data.nextFeedingAt) : null,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/cultivation`);
  revalidatePath(`/app/${ctx.tenantSlug}/cultivation/${lot.id}`);
  revalidatePath(`/app/${ctx.tenantSlug}/cultivation/schedule`);
  return { ok: true };
}

export async function createCultivationTask(input: z.infer<typeof createTaskSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.cultivation_manage);
  } catch {
    return { error: "No tenés permiso para crear tareas" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const lot = await prisma.cultivationLot.findFirst({
    where: { id: data.lotId, tenantId: ctx.tenantId },
  });
  if (!lot) return { error: "Lote no encontrado" };

  await prisma.cultivationTask.create({
    data: {
      tenantId: ctx.tenantId,
      lotId: lot.id,
      type: data.type,
      dueAt: new Date(data.dueAt),
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/cultivation/${lot.id}`);
  return { ok: true };
}

export async function transferCultivationToInventory(input: z.infer<typeof transferSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.cultivation_manage);
  } catch {
    return { error: "No tenés permiso para transferir a inventario" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const lot = await prisma.cultivationLot.findFirst({
    where: { id: data.lotId, tenantId: ctx.tenantId },
  });
  if (!lot) return { error: "Lote no encontrado" };

  await prisma.$transaction(async (tx) => {
    for (const item of data.items) {
      const grams = new Prisma.Decimal(item.grams);
      const stock = await tx.inventoryStock.findFirst({
        where: { tenantId: ctx.tenantId, strainId: item.strainId, category: item.category },
      });
      const newQty = stock ? stock.availableGrams.add(grams) : grams;

      const upserted = await tx.inventoryStock.upsert({
        where: {
          tenantId_category_strainId: {
            tenantId: ctx.tenantId,
            category: item.category,
            strainId: item.strainId,
          },
        },
        update: { availableGrams: newQty, status: newQty.greaterThan(0) ? "in_stock" : "out_of_stock" },
        create: {
          tenantId: ctx.tenantId,
          category: item.category,
          strainId: item.strainId,
          availableGrams: newQty,
          status: "in_stock",
        },
      });

      await tx.inventoryStockMovement.create({
        data: {
          tenantId: ctx.tenantId,
          stockId: upserted.id,
          type: "in",
          grams,
          note: `Transferencia desde cultivo ${lot.code}`,
        },
      });

      await tx.cultivationLotStrain.updateMany({
        where: { cultivationLotId: lot.id, strainId: item.strainId },
        data: { harvestedGrams: grams },
      });
    }

    await tx.cultivationLot.update({
      where: { id: lot.id },
      data: { readyAt: new Date(), status: "ready" },
    });
  });

  revalidatePath(`/app/${ctx.tenantSlug}/cultivation`);
  revalidatePath(`/app/${ctx.tenantSlug}/cultivation/${lot.id}`);
  revalidatePath(`/app/${ctx.tenantSlug}/inventory`);
  return { ok: true };
}

export async function transferCultivationToInventory(input: z.infer<typeof transferInventorySchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.cultivation_manage);
  } catch {
    return { error: "No tenés permiso para transferir a inventario" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = transferInventorySchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const grams = new Prisma.Decimal(data.grams);

  const lot = await prisma.cultivationLot.findFirst({
    where: { id: data.lotId, tenantId: ctx.tenantId },
  });
  if (!lot) return { error: "Lote no encontrado" };

  const strainLink = await prisma.cultivationLotStrain.findFirst({
    where: { cultivationLotId: lot.id, strainId: data.strainId },
  });
  if (!strainLink) return { error: "Cepa no asociada al lote" };

  await prisma.$transaction(async (tx) => {
    const stock = await tx.inventoryStock.upsert({
      where: {
        tenantId_category_strainId: {
          tenantId: ctx.tenantId,
          category: data.category,
          strainId: data.strainId,
        },
      },
      update: { availableGrams: { increment: grams } },
      create: {
        tenantId: ctx.tenantId,
        category: data.category,
        strainId: data.strainId,
        availableGrams: grams,
      },
    });

    await tx.inventoryStockMovement.create({
      data: {
        tenantId: ctx.tenantId,
        stockId: stock.id,
        type: "in",
        grams,
        note: `Transferencia desde lote ${lot.code}`,
      },
    });

    await tx.cultivationLotStrain.update({
      where: { id: strainLink.id },
      data: {
        harvestedGrams: new Prisma.Decimal(strainLink.harvestedGrams ?? 0).add(grams),
      },
    });

    await tx.cultivationLot.update({
      where: { id: lot.id },
      data: { readyAt: lot.readyAt ?? new Date() },
    });
  });

  revalidatePath(`/app/${ctx.tenantSlug}/inventory`);
  revalidatePath(`/app/${ctx.tenantSlug}/cultivation/${lot.id}`);
  return { ok: true };
}

export async function createStrain(input: z.infer<typeof createStrainSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.strains_manage);
  } catch {
    return { error: "No tenés permiso para crear cepas" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };
  const parsed = createStrainSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  await prisma.plantStrain.create({
    data: {
      tenantId: ctx.tenantId,
      name: parsed.data.name,
      genetics: parsed.data.genetics || null,
      thcPct: parsed.data.thcPct ? new Prisma.Decimal(parsed.data.thcPct) : null,
      cbdPct: parsed.data.cbdPct ? new Prisma.Decimal(parsed.data.cbdPct) : null,
      cycleDays: parsed.data.cycleDays ? Number(parsed.data.cycleDays) : null,
    },
  });
  revalidatePath(`/app/${ctx.tenantSlug}/strains`);
  return { ok: true };
}

export async function createPlant(input: z.infer<typeof createPlantSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.plants_manage);
  } catch {
    return { error: "No tenés permiso para crear plantas" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };
  const parsed = createPlantSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  await prisma.plant.create({
    data: {
      tenantId: ctx.tenantId,
      strainId: parsed.data.strainId,
      code: parsed.data.code,
      stage: parsed.data.stage || "vegetativo",
      status: parsed.data.status || "active",
      plantedAt: parsed.data.plantedAt ? new Date(parsed.data.plantedAt) : null,
    },
  });
  revalidatePath(`/app/${ctx.tenantSlug}/plants`);
  return { ok: true };
}

export async function createControl(input: z.infer<typeof createControlSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.controls_manage);
  } catch {
    return { error: "No tenés permiso para registrar controles" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };
  const parsed = createControlSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  await prisma.cultivationControl.create({
    data: {
      tenantId: ctx.tenantId,
      controlDate: parsed.data.controlDate ? new Date(parsed.data.controlDate) : new Date(),
      temperature: parsed.data.temperature ? new Prisma.Decimal(parsed.data.temperature) : null,
      humidity: parsed.data.humidity ? new Prisma.Decimal(parsed.data.humidity) : null,
      ph: parsed.data.ph ? new Prisma.Decimal(parsed.data.ph) : null,
      ec: parsed.data.ec ? new Prisma.Decimal(parsed.data.ec) : null,
      pests: parsed.data.pests || null,
      note: parsed.data.note || null,
    },
  });
  revalidatePath(`/app/${ctx.tenantSlug}/controls`);
  return { ok: true };
}

export async function updateCultivationTimeline(input: z.infer<typeof updateTimelineSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.cultivation_manage);
  } catch {
    return { error: "No tenés permiso para actualizar el timeline" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };
  const parsed = updateTimelineSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  await prisma.cultivationLot.update({
    where: { id: parsed.data.lotId },
    data: {
      harvestedAt: parsed.data.harvestedAt ? new Date(parsed.data.harvestedAt) : null,
      dryingStartedAt: parsed.data.dryingStartedAt ? new Date(parsed.data.dryingStartedAt) : null,
      curingStartedAt: parsed.data.curingStartedAt ? new Date(parsed.data.curingStartedAt) : null,
      readyAt: parsed.data.readyAt ? new Date(parsed.data.readyAt) : null,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/cultivation/${parsed.data.lotId}`);
  return { ok: true };
}
