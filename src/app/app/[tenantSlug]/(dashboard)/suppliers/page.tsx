import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { SuppliersTable } from "@/features/admin/suppliers-table";
import { logError } from "@/lib/server-log";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function SuppliersPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.suppliers_read);
  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.suppliers_manage);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
        <NoPermissionMessage message="No tenés permiso para ver proveedores." />
      </div>
    );
  }

  try {
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId: tenant.id },
      include: {
        supplies: {
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const rows = suppliers.map((supplier) => ({
      ...supplier,
      suppliesCount: supplier.supplies.length,
    }));

    return (
      <div className="space-y-6">
        <SuppliersTable suppliers={rows} canCreate={canManage} />
      </div>
    );
  } catch (error) {
    logError("SuppliersPage", error, `/app/${tenantSlug}/suppliers`);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-destructive text-sm">No se pudo cargar el módulo en este momento.</p>
        </div>
      </div>
    );
  }
}
