"use server";

import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Resuelve el tipo de usuario y el slug del tenant a partir del email y contraseña.
 * El slug se usa para iniciar sesión en el proveedor correcto (tenant o member).
 * Orden: platform → usuario del panel (tenant) → socio (member).
 */
export async function resolveLogin(
  email: string,
  password: string
): Promise<
  | { context: "platform" }
  | { context: "tenant"; slug: string }
  | { context: "member"; slug: string }
  | { error: string }
> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return { error: "Email y contraseña requeridos" };

  // 1) Superadmin / platform (findUnique solo acepta el campo único email)
  const platformUser = await prisma.platformUser.findUnique({
    where: { email: normalizedEmail },
  });
  if (platformUser?.status === "active" && (await compare(password, platformUser.passwordHash))) {
    return { context: "platform" };
  }

  // 2) Usuario del panel del club (tenant user)
  const tenantUser = await prisma.user.findFirst({
    where: { email: normalizedEmail, status: "active" },
    include: { tenant: true },
  });
  if (tenantUser?.tenant?.status === "active" && (await compare(password, tenantUser.passwordHash))) {
    return { context: "tenant", slug: tenantUser.tenant.slug };
  }

  // 3) Socio (member)
  const member = await prisma.member.findFirst({
    where: { email: normalizedEmail, status: "active" },
    include: { tenant: true, account: true },
  });
  if (
    member?.tenant?.status === "active" &&
    member?.account &&
    (await compare(password, member.account.passwordHash))
  ) {
    return { context: "member", slug: member.tenant.slug };
  }

  return { error: "Credenciales incorrectas." };
}
