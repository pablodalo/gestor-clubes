import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CultivationEventForm } from "@/features/cultivation/cultivation-event-form";
import { CultivationScheduleForm } from "@/features/cultivation/cultivation-schedule-form";
import { TransferToInventoryForm } from "@/features/cultivation/transfer-to-inventory-form";
import { CultivationTaskForm } from "@/features/cultivation/cultivation-task-form";

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
    },
  });
  if (!lot) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lote {lot.code}</h1>
        <p className="text-muted-foreground mt-1">
          {lot.strain ?? "Sin genética"} · {lot.stage ?? "Etapa no definida"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
                <div key={s.id} className="flex items-center justify-between">
                  <span>{s.strain.name}</span>
                  <span className="text-muted-foreground">
                    {s.plantsCount ?? "—"} plantas · {s.estimatedYieldGrams?.toString?.() ?? "—"} g
                  </span>
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
      </div>
    </div>
  );
}
