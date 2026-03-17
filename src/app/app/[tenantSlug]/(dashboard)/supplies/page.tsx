import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { SuppliesTable } from "@/features/admin/supplies-table";
import { logError } from "@/lib/server-log";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function SuppliesPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.supplies_read);
  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.supplies_manage);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Suministros</h1>
        <NoPermissionMessage message="No tenés permiso para ver suministros." />
      </div>
    );
  }

  try {
    const [supplies, suppliers] = await Promise.all([
      prisma.supplyItem.findMany({
        where: { tenantId: tenant.id },
        include: { supplier: true },
        orderBy: { name: "asc" },
      }),
      prisma.supplier.findMany({
        where: { tenantId: tenant.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    const rows = supplies.map((s) => ({
      ...s,
      supplierName: s.supplier?.name ?? null,
      supplierPhone: s.supplier?.phone ?? null,
      supplierEmail: s.supplier?.email ?? null,
    }));

    return (
      <div className="space-y-6">
        <SuppliesTable supplies={rows} suppliers={suppliers} canCreate={canManage} />
      </div>
    );
  } catch (error) {
    logError("SuppliesPage", error, `/app/${tenantSlug}/supplies`);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suministros</h1>
          <p className="text-destructive text-sm">No se pudo cargar el módulo en este momento.</p>
        </div>
      </div>
    );
  }
}
