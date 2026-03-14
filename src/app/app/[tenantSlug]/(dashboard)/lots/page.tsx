import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { NoPermissionMessage } from "@/components/no-permission";
import { LotsTable } from "@/features/lots/lots-table";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function LotsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.lots_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Lotes</h1>
        <NoPermissionMessage message="No tenés permiso para ver lotes." />
      </div>
    );
  }

  const canCreate = permissions === null || permissions.has(PERMISSION_KEYS.lots_create);

  const [lots, locations] = await Promise.all([
    prisma.inventoryLot.findMany({
      where: { tenantId: tenant.id },
      include: { _count: { select: { items: true } } },
      orderBy: { code: "asc" },
    }),
    prisma.location.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <LotsTable
        tenantSlug={tenantSlug}
        lots={lots}
        locations={locations}
        canCreate={canCreate}
      />
    </div>
  );
}
