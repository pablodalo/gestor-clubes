"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";

const createLocationSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  type: z.enum(["zone", "building", "room", "shelf"]),
  description: z.string().optional(),
  parentLocationId: z.string().optional().nullable(),
});

const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

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

export async function createLocation(input: CreateLocationInput) {
  try {
    await requirePermission(PERMISSION_KEYS.inventory_create);
  } catch {
    return { error: "No tenés permiso para crear ubicaciones" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createLocationSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const location = await prisma.location.create({
    data: {
      tenantId: ctx.tenantId,
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
      parentLocationId: parsed.data.parentLocationId ?? null,
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "location.create",
    entityName: "Location",
    entityId: location.id,
    afterJson: JSON.stringify({ name: location.name, type: location.type }),
    origin: "actions/locations",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/locations`);
  return { data: location };
}

export async function updateLocation(locationId: string, input: UpdateLocationInput) {
  try {
    await requirePermission(PERMISSION_KEYS.inventory_create);
  } catch {
    return { error: "No tenés permiso para editar ubicaciones" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = updateLocationSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const existing = await prisma.location.findFirst({
    where: { id: locationId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Ubicación no encontrada" };

  const data = parsed.data as Record<string, unknown>;
  if (data.parentLocationId === "") data.parentLocationId = null;
  const location = await prisma.location.update({
    where: { id: locationId },
    data,
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "location.update",
    entityName: "Location",
    entityId: location.id,
    origin: "actions/locations",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/locations`);
  return { data: location };
}

export async function deleteLocation(locationId: string) {
  try {
    await requirePermission(PERMISSION_KEYS.inventory_create);
  } catch {
    return { error: "No tenés permiso para eliminar ubicaciones" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const existing = await prisma.location.findFirst({
    where: { id: locationId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Ubicación no encontrada" };

  await prisma.location.delete({ where: { id: locationId } });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "location.delete",
    entityName: "Location",
    entityId: locationId,
    origin: "actions/locations",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/locations`);
  return { ok: true };
}
