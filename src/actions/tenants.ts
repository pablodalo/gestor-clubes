"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { z } from "zod";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "club";
  return base;
}

const createTenantSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  timezone: z.string().default("America/Argentina/Buenos_Aires"),
  locale: z.string().default("es-AR"),
  currency: z.string().default("ARS"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export async function createTenant(input: CreateTenantInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "No autorizado" };
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") return { error: "Solo superadmin puede crear tenants" };

  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors?.name?.[0] ?? "Datos inválidos" };

  let slug = slugify(parsed.data.name);
  let suffix = 0;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(parsed.data.name)}-${suffix}`;
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      slug,
      timezone: parsed.data.timezone,
      locale: parsed.data.locale,
      currency: parsed.data.currency,
    },
  });

  await prisma.tenantBranding.create({
    data: {
      tenantId: tenant.id,
      appName: tenant.name,
      shortName: tenant.name.slice(0, 2).toUpperCase(),
    },
  });

  const OPERADOR_PERMISSION_KEYS = [
    "members.read", "members.create", "members.update",
    "inventory.read", "inventory.create", "inventory.move", "inventory.adjust",
    "lots.read", "lots.create", "qr.generate", "qr.resolve",
    "weighings.read", "weighings.create", "scales.manage",
    "devices.read", "devices.manage", "reports.read",
    "tickets.read", "tickets.manage",
  ];
  const CULTIVADOR_PERMISSION_KEYS = [
    "lots.read", "lots.create",
    "inventory.read",
    "qr.generate", "qr.resolve",
    "weighings.read", "weighings.create", "scales.manage",
    "devices.read", "reports.read",
  ];
  const permissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const allPermIds = permissions.map((p) => p.id);
  const operadorPermIds = permissions.filter((p) => OPERADOR_PERMISSION_KEYS.includes(p.key)).map((p) => p.id);
  const cultivadorPermIds = permissions.filter((p) => CULTIVADOR_PERMISSION_KEYS.includes(p.key)).map((p) => p.id);

  const roleAdmin = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "tenant_admin",
      description: "Administrador del club",
      isSystem: true,
    },
  });
  const roleOperador = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "operador",
      description: "Operador con acceso a socios, inventario, lotes y tickets",
      isSystem: true,
    },
  });
  const roleCultivador = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "cultivador",
      description: "Lotes, inventario, QR, pesaje y dispositivos; sin socios ni usuarios",
      isSystem: true,
    },
  });
  for (const permId of allPermIds) {
    await prisma.rolePermission.create({ data: { roleId: roleAdmin.id, permissionId: permId } });
  }
  for (const permId of operadorPermIds) {
    await prisma.rolePermission.create({ data: { roleId: roleOperador.id, permissionId: permId } });
  }
  for (const permId of cultivadorPermIds) {
    await prisma.rolePermission.create({ data: { roleId: roleCultivador.id, permissionId: permId } });
  }

  await createAuditLog({
    tenantId: null,
    actorType: "platform_user",
    actorId: (session as unknown as { userId: string }).userId,
    action: "tenant.create",
    entityName: "Tenant",
    entityId: tenant.id,
    afterJson: JSON.stringify({ slug: tenant.slug, name: tenant.name }),
  });

  revalidatePath("/platform");
  revalidatePath("/platform/tenants");
  return { data: tenant };
}

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["active", "suspended", "trial"]).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
});

export async function updateTenant(tenantId: string, input: z.infer<typeof updateTenantSchema>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "No autorizado" };
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") return { error: "Solo superadmin puede editar tenants" };

  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const before = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!before) return { error: "Tenant no encontrado" };

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: parsed.data,
  });

  await createAuditLog({
    tenantId: null,
    actorType: "platform_user",
    actorId: (session as unknown as { userId: string }).userId,
    action: "tenant.update",
    entityName: "Tenant",
    entityId: tenant.id,
    beforeJson: JSON.stringify({ name: before.name, status: before.status }),
    afterJson: JSON.stringify({ name: tenant.name, status: tenant.status }),
  });

  revalidatePath("/platform");
  revalidatePath("/platform/tenants");
  revalidatePath(`/platform/tenants/${tenant.slug}`);
  return { data: tenant };
}

export async function deleteTenant(tenantId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "No autorizado" };
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") return { error: "Solo superadmin puede eliminar tenants" };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Tenant no encontrado" };

  await prisma.rolePermission.deleteMany({ where: { role: { tenantId } } });
  await prisma.role.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });

  await createAuditLog({
    tenantId: null,
    actorType: "platform_user",
    actorId: (session as unknown as { userId: string }).userId,
    action: "tenant.delete",
    entityName: "Tenant",
    entityId: tenantId,
    beforeJson: JSON.stringify({ slug: tenant.slug, name: tenant.name }),
  });

  revalidatePath("/platform");
  revalidatePath("/platform/tenants");
  return { data: null };
}

export async function getTenantsList() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") return [];

  return prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, status: true, createdAt: true },
  });
}

export async function getTenantBySlug(slug: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") return null;

  return prisma.tenant.findUnique({
    where: { slug },
    include: { branding: true },
  });
}
