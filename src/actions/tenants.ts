"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { z } from "zod";

const createTenantSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  slug: z.string().min(1, "Slug requerido").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
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
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors?.slug?.[0] ?? "Datos inválidos" };

  const existing = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "Ya existe un tenant con ese slug" };

  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
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
