import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ tenantSlug: string }> };

const formatDate = (value?: Date | null) =>
  value ? new Date(value).toLocaleDateString("es-AR") : "—";

export default async function CompliancePage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.compliance_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <NoPermissionMessage message="No tenés permiso para ver compliance." />
      </div>
    );
  }

  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(now.getDate() + 30);

  const members = await prisma.member.findMany({
    where: { tenantId: tenant.id, status: "active" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      memberNumber: true,
      reprocannActive: true,
      reprocannEndDate: true,
      membershipRecurring: true,
      membershipRecurrenceDay: true,
      membershipLastPaidAt: true,
      membershipLastAmount: true,
      membershipCurrency: true,
    },
  });

  const expiringReprocann = members.filter(
    (m) => m.reprocannActive && m.reprocannEndDate && m.reprocannEndDate <= in30Days
  );
  const inactiveReprocann = members.filter((m) => !m.reprocannActive);

  const upcomingRecurrences = members.filter((m) => {
    if (!m.membershipRecurring || !m.membershipRecurrenceDay) return false;
    const day = m.membershipRecurrenceDay;
    const today = now.getDate();
    return day >= today && day <= Math.min(today + 7, 28);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="text-muted-foreground mt-1">
          Control de vencimientos Reprocann y cobros programados.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reprocann por vencer (30 días)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expiringReprocann.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin vencimientos próximos.</p>
            ) : (
              expiringReprocann.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span>{m.memberNumber} · {m.firstName} {m.lastName}</span>
                  <span className="text-muted-foreground">{formatDate(m.reprocannEndDate)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reprocann inactivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inactiveReprocann.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos activos.</p>
            ) : (
              inactiveReprocann.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span>{m.memberNumber} · {m.firstName} {m.lastName}</span>
                  <Badge variant="secondary">Inactivo</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cobros programados (7 días)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingRecurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay cobros programados.</p>
          ) : (
            upcomingRecurrences.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span>{m.memberNumber} · {m.firstName} {m.lastName}</span>
                <span className="text-muted-foreground">
                  Día {m.membershipRecurrenceDay} · Último pago {formatDate(m.membershipLastPaidAt)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
