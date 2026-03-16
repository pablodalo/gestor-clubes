import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { getMemberBalanceAdjustmentsForPortal } from "@/actions/member-balance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalBalancePage({ params }: Props) {
  const { tenantSlug } = await params;
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return null;

  const m = session.member;
  const { data: adjustments } = await getMemberBalanceAdjustmentsForPortal(tenantSlug);
  const list = adjustments ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi saldo / cupo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad actual</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Límite mensual</p>
            <p className="text-xl font-semibold">{m.monthlyLimit?.toString() ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo restante</p>
            <p className="text-xl font-semibold">{m.remainingBalance?.toString() ?? "0"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Consumido este período</p>
            <p className="text-xl font-semibold">{m.consumedThisPeriod?.toString() ?? "0"}</p>
          </div>
          {m.dailyLimit != null && (
            <div>
              <p className="text-xs text-muted-foreground">Límite diario</p>
              <p className="text-xl font-semibold">{m.dailyLimit.toString()}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Últimos movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay movimientos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {list.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span>{formatDate(a.createdAt)} · {a.type}</span>
                  <span>{a.amount.toString()} {a.note ? `· ${a.note}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
