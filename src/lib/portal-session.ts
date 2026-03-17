import { getServerSession } from "next-auth";
import { portalAuthOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Para contexto "member": devuelve el Member y Tenant asociados a la sesión.
 * Usar en páginas del portal para obtener datos del socio sin confiar en IDs del cliente.
 * Si la sesión no es member o no coincide el tenantSlug, retorna null.
 */
export async function getMemberAndTenantFromSession(tenantSlug: string) {
  const session = await getServerSession(portalAuthOptions);
  if (!session?.user) return null;

  const ctx = (session as unknown as { context?: string }).context;
  const sessionSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
  const accountId = (session as unknown as { userId?: string }).userId;

  if (ctx !== "member" || sessionSlug !== tenantSlug || !accountId) return null;

  const account = await prisma.memberAccount.findUnique({
    where: { id: accountId, status: "active" },
    include: {
      member: {
        include: { tenant: true },
      },
    },
  });

  if (!account?.member || account.member.tenant.slug !== tenantSlug) return null;
  return {
    member: account.member,
    tenant: account.member.tenant,
    account,
  };
}
