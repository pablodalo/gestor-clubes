import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { params: Promise<{ tenantSlug: string }> };

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount);
}

export default async function RevenuePage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.revenue_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Ingresos</h1>
        <NoPermissionMessage message="No tenés permiso para ver ingresos." />
      </div>
    );
  }

  const members = await prisma.member.findMany({
    where: { tenantId: tenant.id, status: "active" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      membershipRecurring: true,
      membershipRecurrenceDay: true,
      membershipLastPaidAt: true,
      membershipLastAmount: true,
      membershipCurrency: true,
      membershipPlan: true,
    },
  });

  const payments = await prisma.membershipPayment.findMany({
    where: { tenantId: tenant.id },
    select: { amount: true, currency: true, paidAt: true },
  });

  const currencySet = new Set(members.map((m) => m.membershipCurrency || "ARS"));
  const currency = currencySet.size === 1 ? (currencySet.values().next().value as string) : "ARS";
  const toNumber = (value: unknown) => Number(value ?? 0);

  const recurringMembers = members.filter((m) => m.membershipRecurring);
  const projectedMonthly = recurringMembers.reduce(
    (sum, m) => sum + toNumber(m.membershipLastAmount),
    0
  );
  const projectedYearly = projectedMonthly * 12;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyCollected = payments.reduce((sum, p) => {
    const paidAt = p.paidAt ? new Date(p.paidAt) : null;
    if (!paidAt) return sum;
    if (paidAt.getMonth() !== currentMonth || paidAt.getFullYear() !== currentYear) return sum;
    return sum + toNumber(p.amount);
  }, 0);

  const dueSoonCount = recurringMembers.filter((m) => {
    if (!m.membershipRecurrenceDay) return false;
    const day = m.membershipRecurrenceDay;
    const today = now.getDate();
    return day >= today && day <= Math.min(today + 7, 28);
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ingresos</h1>
        <p className="text-muted-foreground mt-1">
          Proyección basada en membresías activas y datos de último pago.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Recurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{recurringMembers.length}</p>
            <p className="text-sm text-muted-foreground">socios con membresía recurrente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proyección mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(projectedMonthly, currency)}</p>
            <p className="text-sm text-muted-foreground">estimado por recurrencias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proyección anual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(projectedYearly, currency)}</p>
            <p className="text-sm text-muted-foreground">si no hay bajas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximos 7 días</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{dueSoonCount}</p>
            <p className="text-sm text-muted-foreground">cobros programados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos del mes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-semibold">{formatCurrency(monthlyCollected, currency)}</p>
          <p className="text-sm text-muted-foreground">
            Total de montos registrados como último pago dentro del mes actual.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
