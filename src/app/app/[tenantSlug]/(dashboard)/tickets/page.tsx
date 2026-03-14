import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { NoPermissionMessage } from "@/components/no-permission";
import { TicketsTable } from "@/features/tickets/tickets-table";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function TicketsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.tickets_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
        <NoPermissionMessage message="No tenés permiso para ver tickets." />
      </div>
    );
  }

  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.tickets_manage);

  const tickets = await prisma.ticket.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <TicketsTable
        tenantSlug={tenantSlug}
        tickets={tickets}
        canCreate={canManage}
        canUpdateStatus={canManage}
      />
    </div>
  );
}
