import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function CultivationPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.cultivation_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Cultivo</h1>
        <NoPermissionMessage message="No tenés permiso para ver cultivo." />
      </div>
    );
  }

  const lots = await prisma.cultivationLot.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cultivo</h1>
          <p className="text-muted-foreground mt-1">
            Seguimiento de lotes, etapas y eventos (riego, fertilización, cosecha).
          </p>
        </div>
        <Link
          href={`/app/${tenantSlug}/cultivation/schedule`}
          className="text-sm text-primary hover:underline"
        >
          Ver calendario
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lots.map((lot) => (
          <Link key={lot.id} href={`/app/${tenantSlug}/cultivation/${lot.id}`}>
            <Card className="hover:bg-accent/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">{lot.code}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {lot.strain ?? "Sin genética"} · {lot.stage ?? "Etapa no definida"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Plantas: {lot.plantsCount ?? "—"} · Rendimiento: {lot.estimatedYieldGrams?.toString?.() ?? "—"} g
                </p>
                <p className="text-xs text-muted-foreground">
                  Próximo riego: {lot.nextWateringAt ? new Date(lot.nextWateringAt).toLocaleDateString("es-AR") : "—"}
                  {" · "}
                  Próx. fertilización: {lot.nextFeedingAt ? new Date(lot.nextFeedingAt).toLocaleDateString("es-AR") : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Estado: {lot.status}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
