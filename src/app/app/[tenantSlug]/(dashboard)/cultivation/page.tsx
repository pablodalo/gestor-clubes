import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StrainForm } from "@/features/cultivation/strain-form";
import { PlantForm } from "@/features/cultivation/plant-form";
import { ControlForm } from "@/features/cultivation/control-form";

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
    include: {
      strains: { include: { strain: true } },
      tasks: { orderBy: { dueAt: "asc" }, take: 4 },
      plants: { select: { id: true } },
      controls: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [strains, plants, controls] = await Promise.all([
    prisma.plantStrain.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.plant.findMany({
      where: { tenantId: tenant.id, status: "active" },
      include: { strain: true, cultivationLot: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.cultivationControl.findMany({
      where: { tenantId: tenant.id },
      include: { cultivationLot: true },
      orderBy: { controlDate: "desc" },
      take: 6,
    }),
  ]);

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
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{lot.code}</CardTitle>
                  <Badge variant={lot.readyAt ? "success" : "secondary"}>
                    {lot.readyAt ? "Listo" : lot.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {lot.strain ?? "Sin genética"} · {lot.stage ?? "Etapa no definida"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Plantas: {lot.plantsCount ?? "—"} · Rendimiento: {lot.estimatedYieldGrams?.toString?.() ?? "—"} g
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{lot.plants.length} plantas asociadas</span>
                  <span>·</span>
                  <span>{lot.controls.length} controles</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cepas del lote</p>
                  {lot.strains.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin cepas cargadas.</p>
                  ) : (
                    lot.strains.map((strain) => (
                      <div key={strain.id} className="flex items-center justify-between text-sm">
                        <span>{strain.strain.name}</span>
                        <span className="text-muted-foreground">
                          {strain.plantsCount ?? "—"} plantas · {strain.estimatedYieldGrams?.toString?.() ?? "—"} g
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Próximas acciones</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>Riego</span>
                    <span className="text-muted-foreground">
                      {lot.nextWateringAt ? new Date(lot.nextWateringAt).toLocaleDateString("es-AR") : "Sin fecha"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Fertilización</span>
                    <span className="text-muted-foreground">
                      {lot.nextFeedingAt ? new Date(lot.nextFeedingAt).toLocaleDateString("es-AR") : "Sin fecha"}
                    </span>
                  </div>
                  {lot.tasks.length > 0 && (
                    <div className="border-t border-border/60 pt-2 space-y-1">
                      {lot.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between text-xs">
                          <span className="capitalize">{task.type}</span>
                          <span className="text-muted-foreground">
                            {new Date(task.dueAt).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Próximo riego: {lot.nextWateringAt ? new Date(lot.nextWateringAt).toLocaleDateString("es-AR") : "—"}
                  {" · "}
                  Próx. fertilización: {lot.nextFeedingAt ? new Date(lot.nextFeedingAt).toLocaleDateString("es-AR") : "—"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Gestión integrada de cultivo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cepas, plantas y controles siguen disponibles como páginas propias, pero ahora también se gestionan desde este módulo.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Cepas</CardTitle>
                <Link href={`/app/${tenantSlug}/strains`} className="text-xs text-primary hover:underline">
                  Ver todas
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {strains.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay cepas registradas.</p>
                ) : (
                  strains.map((strain) => (
                    <div key={strain.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{strain.name}</p>
                        <p className="text-xs text-muted-foreground">{strain.genetics ?? "Sin genética"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{strain.cycleDays ?? "—"} días</span>
                    </div>
                  ))
                )}
              </div>
              <StrainForm onSuccess={() => {}} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Plantas activas</CardTitle>
                <Link href={`/app/${tenantSlug}/plants`} className="text-xs text-primary hover:underline">
                  Ver todas
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay plantas activas.</p>
                ) : (
                  plants.map((plant) => (
                    <div key={plant.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{plant.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {plant.strain.name}
                          {plant.cultivationLot ? ` · ${plant.cultivationLot.code}` : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p className="capitalize">{plant.stage}</p>
                        <p>{plant.plantedAt ? new Date(plant.plantedAt).toLocaleDateString("es-AR") : "Sin fecha"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <PlantForm
                strains={strains.map((strain) => ({ id: strain.id, name: strain.name }))}
                lots={lots.map((lot) => ({ id: lot.id, code: lot.code }))}
                onSuccess={() => {}}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Controles</CardTitle>
                <Link href={`/app/${tenantSlug}/controls`} className="text-xs text-primary hover:underline">
                  Ver historial
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {controls.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay controles cargados.</p>
                ) : (
                  controls.map((control) => (
                    <div key={control.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{new Date(control.controlDate).toLocaleDateString("es-AR")}</p>
                        <span className="text-xs text-muted-foreground">
                          pH {control.ph?.toString?.() ?? "—"} · EC {control.ec?.toString?.() ?? "—"}
                          {control.cultivationLot ? ` · ${control.cultivationLot.code}` : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Temp {control.temperature?.toString?.() ?? "—"}° · Humedad {control.humidity?.toString?.() ?? "—"}%
                      </p>
                      {control.pests && <p className="mt-1 text-xs text-amber-500">Plagas: {control.pests}</p>}
                    </div>
                  ))
                )}
              </div>
              <ControlForm lots={lots.map((lot) => ({ id: lot.id, code: lot.code }))} onSuccess={() => {}} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
