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

    // Último pedido por proveedor (simple, usando distinct + orderBy)
    const lastOrders = await prisma.supplierOrder.findMany({
      where: { tenantId: tenant.id },
      distinct: ["supplierId"],
      orderBy: [{ supplierId: "asc" }, { date: "desc" }],
      select: { supplierId: true, date: true, total: true, status: true },
    });
    const lastOrderBySupplier = new Map(lastOrders.map((o) => [o.supplierId, o]));

    // Pedidos activos por proveedor
    const activeOrders = await prisma.supplierOrder.groupBy({
      by: ["supplierId"],
      where: { tenantId: tenant.id, status: { in: ["draft", "sent", "in_progress"] } },
      _count: { id: true },
    });
    const activeOrdersBySupplier = new Map(activeOrders.map((g) => [g.supplierId, g._count.id]));

    // Pedido activo más reciente por proveedor (si existe)
    const activeLastOrders = await prisma.supplierOrder.findMany({
      where: { tenantId: tenant.id, status: { in: ["draft", "sent", "in_progress"] } },
      distinct: ["supplierId"],
      orderBy: [{ supplierId: "asc" }, { date: "desc" }],
      select: { supplierId: true, date: true, total: true, status: true },
    });
    const activeLastOrderBySupplier = new Map(activeLastOrders.map((o) => [o.supplierId, o]));

    const rows = suppliers.map((supplier) => ({
      ...supplier,
      suppliesCount: supplier.supplies.length,
      lastOrder: lastOrderBySupplier.get(supplier.id) ?? null,
      activeOrdersCount: activeOrdersBySupplier.get(supplier.id) ?? 0,
      activeLastOrder: activeLastOrderBySupplier.get(supplier.id) ?? null,
    }));

    return (
      <div className="space-y-6">
        <SuppliersTable tenantSlug={tenantSlug} suppliers={rows} canCreate={canManage} />
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
