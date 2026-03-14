"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { hash } from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  roleId: z.string().min(1, "Rol requerido"),
  status: z.enum(["active", "suspended", "inactive"]).default("active"),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
  roleId: z.string().min(1).optional(),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
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

export async function createTenantUser(input: z.infer<typeof createUserSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.users_create);
  } catch {
    return { error: "No tenés permiso para crear usuarios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: (msg as string) ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const role = await prisma.role.findFirst({
    where: { id: data.roleId, tenantId: ctx.tenantId },
  });
  if (!role) return { error: "Rol no válido para este club" };

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: ctx.tenantId, email: data.email } },
  });
  if (existing) return { error: "Ya existe un usuario con ese email" };

  const passwordHash = await hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      tenantId: ctx.tenantId,
      roleId: role.id,
      name: data.name,
      email: data.email,
      passwordHash,
      status: data.status,
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "user.create",
    entityName: "User",
    entityId: user.id,
  });

  revalidatePath(`/app/${ctx.tenantSlug}/users`);
  return { data: user };
}

export async function updateTenantUser(
  userId: string,
  input: z.infer<typeof updateUserSchema>
) {
  try {
    await requirePermission(PERMISSION_KEYS.users_update);
  } catch {
    return { error: "No tenés permiso para editar usuarios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: (msg as string) ?? "Datos inválidos" };
  }

  const existing = await prisma.user.findFirst({
    where: { id: userId, tenantId: ctx.tenantId },
    include: { role: true },
  });
  if (!existing) return { error: "Usuario no encontrado" };

  const data = parsed.data;
  const update: {
    name?: string;
    email?: string;
    passwordHash?: string;
    roleId?: string;
    status?: string;
  } = {};
  if (data.name != null) update.name = data.name;
  if (data.email != null) update.email = data.email;
  if (data.status != null) update.status = data.status;
  if (data.roleId != null) {
    const role = await prisma.role.findFirst({
      where: { id: data.roleId, tenantId: ctx.tenantId },
    });
    if (!role) return { error: "Rol no válido para este club" };
    update.roleId = role.id;
  }
  if (data.password != null && data.password !== "") {
    update.passwordHash = await hash(data.password, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data: update,
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "user.update",
    entityName: "User",
    entityId: userId,
  });

  revalidatePath(`/app/${ctx.tenantSlug}/users`);
  return { data: null };
}

export async function deleteTenantUser(userId: string) {
  try {
    await requirePermission(PERMISSION_KEYS.users_delete);
  } catch {
    return { error: "No tenés permiso para eliminar usuarios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };
  if (userId === ctx.userId) return { error: "No podés eliminarte a vos mismo" };

  const existing = await prisma.user.findFirst({
    where: { id: userId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Usuario no encontrado" };

  await prisma.user.delete({ where: { id: userId } });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    action: "user.delete",
    entityName: "User",
    entityId: userId,
  });

  revalidatePath(`/app/${ctx.tenantSlug}/users`);
  return { data: null };
}
