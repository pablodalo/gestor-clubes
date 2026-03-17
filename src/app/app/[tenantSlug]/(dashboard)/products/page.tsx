import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { ProductsTable } from "@/features/products/products-table";
import { ProductForm } from "@/features/products/product-form";
import { logError } from "@/lib/server-log";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function ProductsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.products_read);
  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.products_manage);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
        <NoPermissionMessage message="No tenés permiso para ver productos." />
      </div>
    );
  }

  try {
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground mt-1">Catálogo para ventas a socios.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProductsTable products={products} />
          </div>
          {canManage && (
            <div>
              <ProductForm currency={tenant.currency} />
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    logError("ProductsPage", error, `/app/${tenantSlug}/products`);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-destructive text-sm">No se pudo cargar el módulo en este momento.</p>
        </div>
      </div>
    );
  }
}
