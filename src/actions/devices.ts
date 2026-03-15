"use server";

import { revalidatePath } from "next/cache";
import { assertTenantSession } from "@/lib/server-context";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";

const createDeviceSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  type: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  connectorType: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "maintenance"]).default("active"),
});

const updateDeviceSchema = createDeviceSchema.partial();

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

export async function createDevice(input: CreateDeviceInput) {
  try {
    await requirePermission(PERMISSION_KEYS.devices_manage);
  } catch {
    return { error: "No tenés permiso para crear dispositivos" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = createDeviceSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: (msg as string) ?? "Datos inválidos" };
  }

  if (parsed.data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: parsed.data.locationId, tenantId: ctx.tenantId },
    });
    if (!loc) return { error: "Ubicación no válida para este club" };
  }

  const device = await prisma.device.create({
    data: {
      tenantId: ctx.tenantId,
      name: parsed.data.name,
      type: parsed.data.type ?? null,
      brand: parsed.data.brand ?? null,
      model: parsed.data.model ?? null,
      serialNumber: parsed.data.serialNumber ?? null,
      connectorType: parsed.data.connectorType ?? null,
      locationId: parsed.data.locationId ?? null,
      status: parsed.data.status,
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
      actorName: ctx.name ?? undefined,
    action: "device.create",
    entityName: "Device",
    entityId: device.id,
    afterJson: JSON.stringify({ name: device.name, status: device.status }),
    origin: "actions/devices",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/devices`);
  return { data: device };
}

export async function updateDevice(deviceId: string, input: UpdateDeviceInput) {
  try {
    await requirePermission(PERMISSION_KEYS.devices_manage);
  } catch {
    return { error: "No tenés permiso para editar dispositivos" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const existing = await prisma.device.findFirst({
    where: { id: deviceId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Dispositivo no encontrado" };

  const parsed = updateDeviceSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: (msg as string) ?? "Datos inválidos" };
  }

  if (parsed.data.locationId !== undefined && parsed.data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: parsed.data.locationId, tenantId: ctx.tenantId },
    });
    if (!loc) return { error: "Ubicación no válida para este club" };
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.type !== undefined) data.type = parsed.data.type ?? null;
  if (parsed.data.brand !== undefined) data.brand = parsed.data.brand ?? null;
  if (parsed.data.model !== undefined) data.model = parsed.data.model ?? null;
  if (parsed.data.serialNumber !== undefined) data.serialNumber = parsed.data.serialNumber ?? null;
  if (parsed.data.connectorType !== undefined) data.connectorType = parsed.data.connectorType ?? null;
  if (parsed.data.locationId !== undefined) data.locationId = parsed.data.locationId ?? null;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;

  await prisma.device.update({
    where: { id: deviceId },
    data,
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
      actorName: ctx.name ?? undefined,
    action: "device.update",
    entityName: "Device",
    entityId: deviceId,
    afterJson: JSON.stringify(data),
    origin: "actions/devices",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/devices`);
  return { data: null };
}

export async function deleteDevice(deviceId: string) {
  try {
    await requirePermission(PERMISSION_KEYS.devices_manage);
  } catch {
    return { error: "No tenés permiso para eliminar dispositivos" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const existing = await prisma.device.findFirst({
    where: { id: deviceId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Dispositivo no encontrado" };

  await prisma.device.delete({ where: { id: deviceId } });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
      actorName: ctx.name ?? undefined,
    action: "device.delete",
    entityName: "Device",
    entityId: deviceId,
    origin: "actions/devices",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/devices`);
  return { data: null };
}
