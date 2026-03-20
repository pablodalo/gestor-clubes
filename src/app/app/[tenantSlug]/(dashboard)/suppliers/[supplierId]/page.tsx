import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { Button } from "@/components/ui/button";
import { SupplierDetailClient } from "@/features/suppliers/supplier-detail-client";

type Props = { params: Promise<{ tenantSlug: string; supplierId: string }> };

export default async function SupplierDetailPage({ params }: Props) {
  const { tenantSlug, supplierId } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return notFound();

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.suppliers_read);
  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.suppliers_manage);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Proveedor</h1>
          <Button asChild variant="outline">
            <Link href={`/app/${tenantSlug}/suppliers`}>Volver</Link>
          </Button>
        </div>
        <NoPermissionMessage message="No tenés permiso para ver este proveedor." />
      </div>
    );
  }

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, tenantId: tenant.id },
  });
  if (!supplier) return notFound();

  const [orders] = await Promise.all([
    prisma.supplierOrder.findMany({
      where: { tenantId: tenant.id, supplierId: supplier.id },
      orderBy: { date: "desc" },
      include: { items: true },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Proveedor</p>
          <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/${tenantSlug}/suppliers`}>Volver</Link>
        </Button>
      </div>

      <SupplierDetailClient
        tenantSlug={tenantSlug}
        currency={tenant.currency ?? "ARS"}
        supplier={supplier}
        orders={orders}
        canManage={canManage}
      />
    </div>
  );
}

