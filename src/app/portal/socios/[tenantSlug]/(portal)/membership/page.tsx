import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { getStatusLabel, getStatusVariant } from "@/lib/status-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalMembershipPage({ params }: Props) {
  const { tenantSlug } = await params;
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return null;

  const m = session.member;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi membresía</h1>
      <Card>
        <CardHeader>
          <CardTitle>Estado de la membresía</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Tipo / Plan</p>
            <p className="font-medium">{m.membershipType ?? m.membershipPlan ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge variant={getStatusVariant(m.membershipStatus ?? "")}>
              {getStatusLabel(m.membershipStatus ?? "") ?? m.membershipStatus ?? "—"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inicio</p>
            <p className="font-medium">{formatDate(m.membershipStartDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vencimiento</p>
            <p className="font-medium">{formatDate(m.membershipEndDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Próxima renovación</p>
            <p className="font-medium">{formatDate(m.membershipRenewalDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Recurrente</p>
            <p className="font-medium">{m.membershipRecurring ? "Sí" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Último pago</p>
            <p className="font-medium">{formatDate(m.membershipLastPaidAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monto último pago</p>
            <p className="font-medium">
              {m.membershipLastAmount?.toString?.() ?? "—"} {m.membershipCurrency ?? ""}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
