import { getMemberHistoryForPortal } from "@/actions/member-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalHistoryPage({ params }: Props) {
  const { tenantSlug } = await params;
  const { data: logs } = await getMemberHistoryForPortal(tenantSlug);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi historial</h1>
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay registros.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((log) => (
                <li key={log.id} className="flex flex-wrap gap-2 items-baseline border-b pb-2">
                  <span className="text-muted-foreground">{formatDate(log.createdAt)}</span>
                  <span className="font-medium">{log.action}</span>
                  {log.actorName && <span className="text-muted-foreground">· {log.actorName}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
