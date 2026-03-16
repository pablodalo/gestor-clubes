import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { SuppliersTable } from "@/features/admin/suppliers-table";
import { SupplierForm } from "@/features/admin/supplier-form";

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

  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
        <p className="text-muted-foreground mt-1">Gestión de proveedores e insumos.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SuppliersTable suppliers={suppliers} />
        </div>
        {canManage && (
          <div>
            <SupplierForm onSuccess={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}
