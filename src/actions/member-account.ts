"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { getTenantSession } from "@/lib/server-context";
import { z } from "zod";

async function getTenantContext(): Promise<{
  tenantId: string;
  tenantSlug: string;
  userId: string;
  actorName: string | null;
} | null> {
  const session = await getTenantSession();
  if (!session) return null;
  return {
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    userId: session.userId,
    actorName: session.name ?? null,
  };
}

const createAccountSchema = z.object({
  memberId: z.string().min(1),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export async function createMemberAccount(input: z.infer<typeof createAccountSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.members_update);
  } catch {
    return { error: "No tenés permiso para gestionar cuentas de socios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const member = await prisma.member.findFirst({
    where: { id: parsed.data.memberId, tenantId: ctx.tenantId },
    include: { account: true },
  });
  if (!member) return { error: "Socio no encontrado" };
  if (member.account) return { error: "El socio ya tiene una cuenta de acceso" };

  const email = parsed.data.email.trim().toLowerCase();
  const existingAccount = await prisma.memberAccount.findFirst({
    where: { email },
    include: { member: { select: { tenantId: true } } },
  });
  if (existingAccount) {
    if (existingAccount.member.tenantId !== ctx.tenantId)
      return { error: "Ese email ya está en uso en otro club" };
    return { error: "Ese email ya tiene cuenta en este club" };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.member.update({
      where: { id: member.id },
      data: { email: parsed.data.email.trim() },
    }),
    prisma.memberAccount.create({
      data: {
        memberId: member.id,
        email,
        passwordHash,
        status: "active",
      },
    }),
  ]);

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member_account.create",
    entityName: "MemberAccount",
    entityId: member.id,
    afterJson: JSON.stringify({ email }),
    origin: "actions/member-account",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  revalidatePath(`/app/${ctx.tenantSlug}/members/${member.id}`);
  return { ok: true };
}

const setStatusSchema = z.object({
  memberId: z.string().min(1),
  status: z.enum(["active", "inactive"]),
});

export async function setMemberAccountStatus(input: z.infer<typeof setStatusSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.members_update);
  } catch {
    return { error: "No tenés permiso para gestionar cuentas de socios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = setStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const account = await prisma.memberAccount.findFirst({
    where: { memberId: parsed.data.memberId, member: { tenantId: ctx.tenantId } },
  });
  if (!account) return { error: "El socio no tiene cuenta de acceso" };

  await prisma.memberAccount.update({
    where: { id: account.id },
    data: { status: parsed.data.status },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member_account.set_status",
    entityName: "MemberAccount",
    entityId: account.id,
    afterJson: JSON.stringify({ status: parsed.data.status }),
    origin: "actions/member-account",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  revalidatePath(`/app/${ctx.tenantSlug}/members/${parsed.data.memberId}`);
  return { ok: true };
}

const resetPasswordSchema = z.object({
  memberId: z.string().min(1),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
});

export async function resetMemberPassword(input: z.infer<typeof resetPasswordSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.members_update);
  } catch {
    return { error: "No tenés permiso para gestionar cuentas de socios" };
  }
  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const account = await prisma.memberAccount.findFirst({
    where: { memberId: parsed.data.memberId, member: { tenantId: ctx.tenantId } },
  });
  if (!account) return { error: "El socio no tiene cuenta de acceso" };

  const passwordHash = await hash(parsed.data.newPassword, 10);
  await prisma.memberAccount.update({
    where: { id: account.id },
    data: { passwordHash },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
    actorName: ctx.actorName ?? undefined,
    action: "member_account.reset_password",
    entityName: "MemberAccount",
    entityId: account.id,
    origin: "actions/member-account",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/members`);
  revalidatePath(`/app/${ctx.tenantSlug}/members/${parsed.data.memberId}`);
  return { ok: true };
}
