"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePlatformOwner } from "@/lib/platform-auth";
import { PLATFORM_OWNER_ROLE, PLATFORM_PERMISSION_KEYS } from "@/config/platform-permissions";
import { hash } from "bcryptjs";
import { z } from "zod";

const ROLES = ["platform_admin", "support_agent", "billing_admin"] as const;
const PERMISSION_KEYS = [PLATFORM_PERMISSION_KEYS.audit_read, PLATFORM_PERMISSION_KEYS.errors_read] as const;

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES),
  permissions: z.array(z.enum(PERMISSION_KEYS)).default([]),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.enum(ROLES).optional(),
  permissions: z.array(z.enum(PERMISSION_KEYS)).optional(),
});

export async function getPlatformUsersList() {
  const auth = await requirePlatformOwner();
  if (!auth) return [];

  return prisma.platformUser.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, status: true, permissions: true, createdAt: true },
  });
}

export async function createPlatformUser(input: z.infer<typeof createSchema>) {
  const auth = await requirePlatformOwner();
  if (!auth) return { error: "Solo el superadmin puede crear usuarios de plataforma" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const existing = await prisma.platformUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Ya existe un usuario con ese email" };

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.platformUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      permissions: parsed.data.permissions,
    },
  });

  revalidatePath("/platform/users");
  return { data: null };
}

export async function updatePlatformUser(userId: string, input: z.infer<typeof updateSchema>) {
  const auth = await requirePlatformOwner();
  if (!auth) return { error: "Solo el superadmin puede editar usuarios de plataforma" };

  const existing = await prisma.platformUser.findUnique({ where: { id: userId } });
  if (!existing) return { error: "Usuario no encontrado" };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data: { name?: string; email?: string; passwordHash?: string; role?: string; permissions?: object } = {};
  if (parsed.data.name != null) data.name = parsed.data.name;
  if (parsed.data.email != null) data.email = parsed.data.email;
  // Superadmin no puede cambiar su rol; el resto sí
  if (parsed.data.role != null && existing.role !== PLATFORM_OWNER_ROLE) data.role = parsed.data.role;
  if (parsed.data.permissions != null) data.permissions = parsed.data.permissions;
  if (parsed.data.password != null && parsed.data.password !== "") {
    data.passwordHash = await hash(parsed.data.password, 10);
  }

  await prisma.platformUser.update({ where: { id: userId }, data });
  revalidatePath("/platform/users");
  return { data: null };
}

export async function deletePlatformUser(userId: string) {
  const auth = await requirePlatformOwner();
  if (!auth) return { error: "Solo el superadmin puede eliminar usuarios de plataforma" };

  const existing = await prisma.platformUser.findUnique({ where: { id: userId } });
  if (!existing) return { error: "Usuario no encontrado" };
  if (existing.role === PLATFORM_OWNER_ROLE) return { error: "No se puede eliminar al superadmin" };
  if (existing.id === auth.userId) return { error: "No podés eliminarte a vos mismo" };

  await prisma.platformUser.delete({ where: { id: userId } });
  revalidatePath("/platform/users");
  return { data: null };
}
