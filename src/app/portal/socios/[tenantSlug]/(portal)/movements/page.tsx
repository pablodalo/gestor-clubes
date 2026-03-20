import { getMemberHistoryForPortal } from "@/actions/member-history";

const formatDate = (value?: Date | null) =>
  value
    ? new Date(value).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalMovementsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const { data: logs } = await getMemberHistoryForPortal(tenantSlug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Movimientos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Historial de actividad en tu cuenta
        </p>
      </div>

      <ul className="space-y-2">
        {!logs || logs.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
            No hay movimientos registrados.
          </li>
        ) : (
          logs.map((log) => (
            <li
              key={log.id}
              className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card/50 px-4 py-3"
            >
              <span className="font-medium text-foreground">{log.action}</span>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(log.createdAt)}</span>
                {log.actorName && <span>· {log.actorName}</span>}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
