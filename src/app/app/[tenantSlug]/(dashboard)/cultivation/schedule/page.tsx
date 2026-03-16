import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function CultivationSchedulePage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.cultivation_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Calendario de cultivo</h1>
        <NoPermissionMessage message="No tenés permiso para ver el calendario." />
      </div>
    );
  }

  const now = new Date();
  const in14Days = new Date(now);
  in14Days.setDate(now.getDate() + 14);

  const lots = await prisma.cultivationLot.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      code: true,
      strain: true,
      nextWateringAt: true,
      nextFeedingAt: true,
    },
  });

  const tasks = lots.flatMap((lot) => {
    const items = [];
    if (lot.nextWateringAt && lot.nextWateringAt <= in14Days) {
      items.push({ type: "Riego", date: lot.nextWateringAt, lot });
    }
    if (lot.nextFeedingAt && lot.nextFeedingAt <= in14Days) {
      items.push({ type: "Fertilización", date: lot.nextFeedingAt, lot });
    }
    return items;
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendario de cultivo</h1>
        <p className="text-muted-foreground mt-1">Próximas tareas en los siguientes 14 días.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay tareas próximas.</p>
          ) : (
            tasks.map((t, idx) => (
              <div key={`${t.lot.id}-${t.type}-${idx}`} className="flex items-center justify-between text-sm">
                <Link href={`/app/${tenantSlug}/cultivation/${t.lot.id}`} className="hover:underline">
                  {t.type} · {t.lot.code} {t.lot.strain ? `(${t.lot.strain})` : ""}
                </Link>
                <span className="text-muted-foreground">
                  {new Date(t.date).toLocaleDateString("es-AR")}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
