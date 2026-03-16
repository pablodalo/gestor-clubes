"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";

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
