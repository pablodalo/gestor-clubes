import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { NoPermissionMessage } from "@/components/no-permission";
import { Package } from "lucide-react";

type ItemWithLot = Awaited<ReturnType<typeof prisma.inventoryItem.findMany>>[number];

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

  const items = await prisma.inventoryItem.findMany({
    where: { tenantId: tenant.id },
    include: { lot: true },
    orderBy: { code: "asc" },
    take: 100,
  });

  const columns: DataTableColumn<ItemWithLot>[] = [
    { key: "code", header: "Código", render: (i) => <span className="font-mono font-medium text-foreground">{i.code}</span> },
    { key: "lot", header: "Lote", render: (i) => <span className="text-muted-foreground">{i.lot.code}</span> },
    { key: "quantityCurrent", header: "Cantidad", render: (i) => String(i.quantityCurrent) },
    { key: "status", header: "Estado", render: (i) => <Badge variant={getStatusVariant(i.status)}>{getStatusLabel(i.status) ?? i.status}</Badge> },
  ];

  const exportData = items.map((i) => ({
    id: i.id,
    code: i.code,
    lotCode: i.lot.code,
    quantityCurrent: String(i.quantityCurrent),
    status: i.status,
  }));

  return (
    <ListPageLayout
      title="Inventario"
      description="Ítems de inventario."
      actions={<ExportButtons data={exportData} filename="inventario" />}
    >
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(i) => i.id}
        emptyState={{ icon: Package, title: "Sin ítems", description: "No hay ítems en inventario." }}
      />
    </ListPageLayout>
  );
}
