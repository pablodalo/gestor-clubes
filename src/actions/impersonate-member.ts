"use server";

import { getPlatformSession } from "@/lib/server-context";
import { signImpersonateToken } from "@/lib/impersonate-token";
import { prisma } from "@/lib/prisma";

/**
 * Solo superadmin. Devuelve la URL para abrir el portal del socio en una nueva pestaña
 * con sesión de ese socio (impersonación), sin mezclar con la sesión de platform.
 */
export async function getImpersonateMemberUrl(memberId: string, tenantSlug: string): Promise<{ error?: string; url?: string }> {
  const platform = await getPlatformSession();
  if (!platform) return { error: "Solo superadmin puede acceder como socio" };

  const member = await prisma.member.findFirst({
    where: { id: memberId },
    include: { account: true, tenant: true },
  });
  if (!member) return { error: "Socio no encontrado" };
  if (member.tenant.slug !== tenantSlug) return { error: "Tenant no coincide" };
  if (!member.account || member.account.status !== "active") {
    return { error: "El socio no tiene cuenta de portal activa. Creá una en la pestaña Cuenta de acceso." };
  }

  const token = signImpersonateToken(memberId, tenantSlug);
  const url = `/portal/socios/${tenantSlug}/login?impersonate=${encodeURIComponent(token)}`;
  return { url };
}
