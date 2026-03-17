import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { NoPermissionMessage } from "@/components/no-permission";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logError } from "@/lib/server-log";
import Link from "next/link";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function InventoryPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.inventory_read);
  const canReadProducts = permissions === null || permissions.has(PERMISSION_KEYS.products_read);
  const canManageProducts = permissions === null || permissions.has(PERMISSION_KEYS.products_manage);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <NoPermissionMessage message="No tenés permiso para ver el inventario." />
      </div>
    );
  }

  try {
    const [stocks, strains] = await Promise.all([
      prisma.inventoryStock.findMany({
        where: { tenantId: tenant.id },
        include: { strain: true },
      }),
      prisma.plantStrain.findMany({
        where: { tenantId: tenant.id },
        orderBy: { name: "asc" },
      }),
    ]);

    const stockMap = new Map(
      stocks.map((s) => [`${s.category}-${s.strainId}`, s])
    );

    const buildRows = (category: "flores" | "extractos") =>
      strains.map((strain) => {
        const stock = stockMap.get(`${category}-${strain.id}`);
        const grams = stock ? Number(stock.availableGrams) : 0;
        return { strain, grams };
      });

    const flowerRows = buildRows("flores");
    const extractRows = buildRows("extractos");

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario / Productos</h1>
          <p className="text-muted-foreground mt-1">
            Flores y extractos disponibles para comercializar.
          </p>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>
                  <Link href={`/app/${tenantSlug}/inventory/flores`} className="hover:underline underline-offset-4">
                    Flores
                  </Link>
                </CardTitle>
                <Link
                  href={`/app/${tenantSlug}/inventory/flores`}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
                >
                  Ver detalle
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {flowerRows.map(({ strain, grams }) => (
                <div key={strain.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{strain.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{strain.genetics ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={grams > 0 ? "success" : "secondary"}>
                      {grams > 0 ? "En stock" : "Sin stock"}
                    </Badge>
                    <span className="text-sm tabular-nums">{grams.toFixed(2)} g</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>
                  <Link href={`/app/${tenantSlug}/inventory/extractos`} className="hover:underline underline-offset-4">
                    Extractos
                  </Link>
                </CardTitle>
                <Link
                  href={`/app/${tenantSlug}/inventory/extractos`}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
                >
                  Ver detalle
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {extractRows.map(({ strain, grams }) => (
                <div key={strain.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{strain.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{strain.genetics ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={grams > 0 ? "success" : "secondary"}>
                      {grams > 0 ? "En stock" : "Sin stock"}
                    </Badge>
                    <span className="text-sm tabular-nums">{grams.toFixed(2)} g</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    logError("InventoryPage", error, `/app/${tenantSlug}/inventory`);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario / Productos</h1>
          <p className="text-destructive text-sm">No se pudo cargar el módulo en este momento.</p>
        </div>
      </div>
    );
  }
}
