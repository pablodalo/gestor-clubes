import Link from "next/link";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { getMemberNotificationsForPortal } from "@/actions/member-notifications";
import { getMemberHistoryForPortal } from "@/actions/member-history";
import { getStatusLabel, getStatusVariant } from "@/lib/status-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalSociosHomePage({ params }: Props) {
  const { tenantSlug } = await params;
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return null;

  const [notifResult, historyResult] = await Promise.all([
    getMemberNotificationsForPortal(tenantSlug),
    getMemberHistoryForPortal(tenantSlug),
  ]);

  const member = session.member;
  const notifications = notifResult.data ?? [];
  const history = historyResult.data ?? [];
  const lastNotifs = notifications.slice(0, 5);
  const lastHistory = history.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Hola, {member.firstName} {member.lastName}
      </h1>
      <p className="text-muted-foreground">Resumen de tu cuenta en {session.tenant.name}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado del socio</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusVariant(member.status)}>
              {getStatusLabel(member.status) ?? member.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Membresía</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusVariant(member.membershipStatus ?? "")}>
              {getStatusLabel(member.membershipStatus ?? "") ?? member.membershipStatus ?? "—"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo restante</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{member.remainingBalance?.toString() ?? "0"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nº de socio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono font-medium">{member.memberNumber}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas notificaciones</CardTitle>
            <Link
              href={`/portal/socios/${tenantSlug}/notifications`}
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {lastNotifs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tenés notificaciones nuevas.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lastNotifs.map((n) => (
                  <li key={n.id}>
                    <span className="font-medium">{n.title}</span>
                    <span className="text-muted-foreground ml-2">{formatDate(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Actividad reciente</CardTitle>
            <Link
              href={`/portal/socios/${tenantSlug}/history`}
              className="text-sm text-primary hover:underline"
            >
              Ver historial
            </Link>
          </CardHeader>
          <CardContent>
            {lastHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay actividad reciente.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lastHistory.map((log) => (
                  <li key={log.id}>
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground ml-2">{formatDate(log.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
