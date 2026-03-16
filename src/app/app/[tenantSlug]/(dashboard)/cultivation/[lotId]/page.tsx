import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CultivationEventForm } from "@/features/cultivation/cultivation-event-form";
import { CultivationScheduleForm } from "@/features/cultivation/cultivation-schedule-form";
import { TransferToInventoryForm } from "@/features/cultivation/transfer-to-inventory-form";
import { CultivationTaskForm } from "@/features/cultivation/cultivation-task-form";
import { PlantForm } from "@/features/cultivation/plant-form";
import { ControlForm } from "@/features/cultivation/control-form";

type Props = { params: Promise<{ tenantSlug: string; lotId: string }> };

export default async function CultivationLotPage({ params }: Props) {
  const { tenantSlug, lotId } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return notFound();

  const lot = await prisma.cultivationLot.findFirst({
    where: { id: lotId, tenantId: tenant.id },
    include: {
      events: { orderBy: { happenedAt: "desc" } },
      strains: { include: { strain: true } },
      tasks: { orderBy: { dueAt: "asc" } },
      plants: { include: { strain: true }, orderBy: { createdAt: "desc" } },
      controls: { orderBy: { controlDate: "desc" } },
    },
  });
  if (!lot) return notFound();

  const timeline = [
    { key: "drying", label: "Secado", date: lot.dryingStartedAt },
    { key: "curing", label: "Curado", date: lot.curingStartedAt },
    { key: "ready", label: "Listo para comercializar", date: lot.readyAt },
  ];

  const totalHarvested = lot.strains.reduce((acc, item) => acc + Number(item.harvestedGrams ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Lote {lot.code}</h1>
          <Badge variant={lot.readyAt ? "success" : "secondary"}>
            {lot.readyAt ? "Listo para inventario" : lot.status}
          </Badge>
          {lot.stage && <Badge variant="outline">{lot.stage}</Badge>}
        </div>
        <p className="text-muted-foreground mt-1">{lot.strain ?? "Sin genética"} · gestión integral del lote.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Resumen del cultivo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4 text-sm">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Plantas</p>
              <p className="mt-2 text-2xl font-semibold">{lot.plants.length || lot.plantsCount || 0}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Rendimiento estimado</p>
              <p className="mt-2 text-2xl font-semibold">{lot.estimatedYieldGrams?.toString?.() ?? "0"} g</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Transferido a inventario</p>
              <p className="mt-2 text-2xl font-semibold">{totalHarvested.toFixed(2)} g</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cosecha estimada</p>
              <p className="mt-2 text-lg font-semibold">
                {lot.estimatedHarvestAt ? new Date(lot.estimatedHarvestAt).toLocaleDateString("es-AR") : "Sin fecha"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Timeline de post-cosecha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.map((step) => (
              <div key={step.key} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.date ? new Date(step.date).toLocaleDateString("es-AR") : "Sin fecha cargada"}
                  </p>
                </div>
                <Badge variant={step.date ? "success" : "secondary"}>
                  {step.date ? "Cumplido" : "Pendiente"}
                </Badge>
              </div>
            ))}
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Cuando el lote llegue a "Listo para comercializar", usá "Pasar a inventario" para sumar los gramos por cepa en flores o extractos.
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Eventos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lot.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos registrados.</p>
            ) : (
              lot.events.map((ev) => (
                <div key={ev.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium capitalize">{ev.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ev.happenedAt).toLocaleDateString("es-AR")}
                  </p>
                  {ev.note && <p className="text-sm mt-1">{ev.note}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registrar evento</CardTitle>
          </CardHeader>
          <CardContent>
            <CultivationEventForm lotId={lot.id} onSuccess={() => {}} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cepas y plantas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lot.strains.length === 0 ? (
              <p className="text-muted-foreground">Sin cepas registradas.</p>
            ) : (
              lot.strains.map((s) => (
                <div key={s.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.strain.name}</span>
                    <span className="text-muted-foreground">
                      {s.plantsCount ?? "—"} plantas
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Estimado: {s.estimatedYieldGrams?.toString?.() ?? "—"} g</span>
                    <span>Transferido: {s.harvestedGrams?.toString?.() ?? "0"} g</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plantas del lote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lot.plants.length === 0 ? (
              <p className="text-muted-foreground">Todavía no hay plantas asociadas a este lote.</p>
            ) : (
              lot.plants.map((plant) => (
                <div key={plant.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plant.code}</span>
                    <span className="text-muted-foreground capitalize">{plant.stage}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plant.strain.name} · {plant.plantedAt ? new Date(plant.plantedAt).toLocaleDateString("es-AR") : "Sin fecha"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actualizar calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <CultivationScheduleForm
              lotId={lot.id}
              defaultWatering={lot.nextWateringAt}
              defaultFeeding={lot.nextFeedingAt}
              onSuccess={() => {}}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pasar a inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <TransferToInventoryForm
              lotId={lot.id}
              strains={lot.strains.map((s) => ({ id: s.strain.id, name: s.strain.name }))}
              onSuccess={() => {}}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximas tareas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Próximo riego</span>
              <span className="text-muted-foreground">
                {lot.nextWateringAt ? new Date(lot.nextWateringAt).toLocaleDateString("es-AR") : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Próxima fertilización</span>
              <span className="text-muted-foreground">
                {lot.nextFeedingAt ? new Date(lot.nextFeedingAt).toLocaleDateString("es-AR") : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cosecha estimada</span>
              <span className="text-muted-foreground">
                {lot.estimatedHarvestAt ? new Date(lot.estimatedHarvestAt).toLocaleDateString("es-AR") : "—"}
              </span>
            </div>
            <div className="border-t pt-2">
              {lot.tasks.length === 0 ? (
                <p className="text-muted-foreground">Sin hitos definidos.</p>
              ) : (
                lot.tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <span className="capitalize">{t.type}</span>
                    <span className="text-muted-foreground">
                      {new Date(t.dueAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agregar hito</CardTitle>
          </CardHeader>
          <CardContent>
            <CultivationTaskForm lotId={lot.id} onSuccess={() => {}} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Controles del lote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lot.controls.length === 0 ? (
              <p className="text-muted-foreground">Todavía no hay controles asociados a este lote.</p>
            ) : (
              lot.controls.map((control) => (
                <div key={control.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{new Date(control.controlDate).toLocaleDateString("es-AR")}</span>
                    <span className="text-muted-foreground">pH {control.ph?.toString?.() ?? "—"} · EC {control.ec?.toString?.() ?? "—"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Temp {control.temperature?.toString?.() ?? "—"}° · Humedad {control.humidity?.toString?.() ?? "—"}%
                  </p>
                  {control.note && <p className="mt-1 text-xs">{control.note}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agregar planta al lote</CardTitle>
          </CardHeader>
          <CardContent>
            <PlantForm
              strains={lot.strains.map((s) => ({ id: s.strain.id, name: s.strain.name }))}
              lots={[{ id: lot.id, code: lot.code }]}
              defaultLotId={lot.id}
              onSuccess={() => {}}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registrar control del lote</CardTitle>
          </CardHeader>
          <CardContent>
            <ControlForm
              lots={[{ id: lot.id, code: lot.code }]}
              defaultLotId={lot.id}
              onSuccess={() => {}}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
