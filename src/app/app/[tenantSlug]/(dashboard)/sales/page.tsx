import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { SalesTable } from "@/features/sales/sales-table";
import { SaleForm } from "@/features/sales/sale-form";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function SalesPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.sales_read);
  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.sales_manage);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
        <NoPermissionMessage message="No tenés permiso para ver ventas." />
      </div>
    );
  }

  const [members, products, sales] = await Promise.all([
    prisma.member.findMany({
      where: { tenantId: tenant.id, status: "active" },
      select: { id: true, firstName: true, lastName: true, memberNumber: true },
    }),
    prisma.product.findMany({
      where: { tenantId: tenant.id, status: "active" },
      select: { id: true, name: true, price: true, currency: true },
      orderBy: { name: "asc" },
    }),
    prisma.salesOrder.findMany({
      where: { tenantId: tenant.id },
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const rows = sales.map((o) => ({
    ...o,
    memberName: `${o.member.firstName} ${o.member.lastName}`,
    memberNumber: o.member.memberNumber,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
        <p className="text-muted-foreground mt-1">Órdenes de venta a socios.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesTable sales={rows} />
        </div>
        {canManage && (
          <div>
            <SaleForm
              members={members.map((m) => ({
                id: m.id,
                name: `${m.firstName} ${m.lastName}`,
                memberNumber: m.memberNumber,
              }))}
              products={products.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price.toString(),
                currency: p.currency,
              }))}
              onSuccess={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
