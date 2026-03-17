import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ tenantSlug: string }> };

function normalizeProductName(name: string) {
  return name
    .toLowerCase()
    .replace(/^flores\s+/i, "")
    .replace(/^extractos\s+/i, "")
    .trim();
}

export default async function InventoryExtractsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return notFound();

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.inventory_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Extractos</h1>
          <Link className="text-sm text-muted-foreground hover:underline" href={`/app/${tenantSlug}/inventory`}>
            Volver
          </Link>
        </div>
        <NoPermissionMessage message="No tenés permiso para ver el inventario." />
      </div>
    );
  }

  const [strains, stocks, products] = await Promise.all([
    prisma.plantStrain.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    prisma.inventoryStock.findMany({ where: { tenantId: tenant.id, category: "extractos" } }),
    prisma.product.findMany({ where: { tenantId: tenant.id, category: "extractos", status: "active" }, orderBy: { name: "asc" } }),
  ]);

  const stockByStrainId = new Map(stocks.map((s) => [s.strainId, Number(s.availableGrams)]));
  const productByNormalizedName = new Map(products.map((p) => [normalizeProductName(p.name), p]));

  const rows = strains.map((strain) => {
    const grams = stockByStrainId.get(strain.id) ?? 0;
    const product = productByNormalizedName.get(normalizeProductName(strain.name)) ?? null;
    return { strain, grams, product };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Inventario</p>
          <h1 className="text-2xl font-bold tracking-tight">Extractos</h1>
        </div>
        <Link className="text-sm text-muted-foreground hover:underline" href={`/app/${tenantSlug}/inventory`}>
          Volver
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cepas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map(({ strain, grams, product }) => (
            <div key={strain.id} className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{strain.name}</p>
                <p className="text-xs text-muted-foreground truncate">{strain.genetics ?? "—"}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Stock</p>
                  <p className="text-sm tabular-nums">{grams.toFixed(2)} g</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Precio</p>
                  <p className="text-sm tabular-nums">
                    {product ? `${product.price.toString()} ${product.currency}${product.unit ? ` / ${product.unit}` : ""}` : "—"}
                  </p>
                </div>
                <Badge variant={grams > 0 ? "success" : "secondary"}>{grams > 0 ? "En stock" : "Sin stock"}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

