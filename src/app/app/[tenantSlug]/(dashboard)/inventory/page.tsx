import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { NoPermissionMessage } from "@/components/no-permission";
import { InventoryTable } from "@/features/inventory/inventory-table";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function InventoryPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.inventory_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <NoPermissionMessage message="No tenés permiso para ver el inventario." />
      </div>
    );
  }

  const canCreate = permissions === null || permissions.has(PERMISSION_KEYS.inventory_create);
  const canAdjust = permissions === null || permissions.has(PERMISSION_KEYS.inventory_adjust);

  const [items, lots, locations] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { tenantId: tenant.id },
      include: { lot: true },
      orderBy: { code: "asc" },
      take: 100,
    }),
    prisma.inventoryLot.findMany({
      where: { tenantId: tenant.id },
      orderBy: { code: "asc" },
      select: { id: true, code: true },
    }),
    prisma.location.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <InventoryTable
        items={items}
        lots={lots}
        locations={locations}
        canCreate={canCreate}
        canAdjust={canAdjust}
      />
    </div>
  );
}
