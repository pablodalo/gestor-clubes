import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StockMovementForm } from "@/features/admin/stock-movement-form";

type Props = { params: Promise<{ tenantSlug: string }> };

type StockRow = {
  id: string;
  name: string;
  currentQty: string;
  minQty: string;
  unit?: string | null;
};

export default async function StockPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.stock_read);
  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.stock_manage);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
        <NoPermissionMessage message="No tenés permiso para ver stock." />
      </div>
    );
  }

  const supplies = await prisma.supplyItem.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  const columns: DataTableColumn<StockRow>[] = [
    { key: "name", header: "Suministro", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "currentQty", header: "Stock", render: (s) => `${s.currentQty} ${s.unit ?? ""}` },
    { key: "minQty", header: "Mínimo", render: (s) => `${s.minQty} ${s.unit ?? ""}` },
  ];

  const rows: StockRow[] = supplies.map((s) => ({
    id: s.id,
    name: s.name,
    currentQty: s.currentQty.toString(),
    minQty: s.minQty.toString(),
    unit: s.unit,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
        <p className="text-muted-foreground mt-1">Movimientos y control de mínimos.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} emptyMessage="No hay stock." />
        </div>
        {canManage && (
          <div>
            <StockMovementForm
              supplies={supplies.map((s) => ({ id: s.id, name: s.name, unit: s.unit }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
