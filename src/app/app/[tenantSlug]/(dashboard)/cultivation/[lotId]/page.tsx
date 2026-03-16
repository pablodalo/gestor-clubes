import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CultivationEventForm } from "@/features/cultivation/cultivation-event-form";
import { CultivationScheduleForm } from "@/features/cultivation/cultivation-schedule-form";

type Props = { params: Promise<{ tenantSlug: string; lotId: string }> };

export default async function CultivationLotPage({ params }: Props) {
  const { tenantSlug, lotId } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return notFound();

  const lot = await prisma.cultivationLot.findFirst({
    where: { id: lotId, tenantId: tenant.id },
    include: { events: { orderBy: { happenedAt: "desc" } } },
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
