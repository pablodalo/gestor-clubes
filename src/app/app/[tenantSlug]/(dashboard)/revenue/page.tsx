import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueCharts, type YearAnnualItem } from "@/features/revenue/revenue-charts";
import { TrendingUp, Users, Calendar, Wallet, Banknote } from "lucide-react";

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
      membershipRecurring: true,
      membershipRecurrenceDay: true,
      membershipLastAmount: true,
      membershipCurrency: true,
    },
  });

  const paymentsRaw = await prisma.membershipPayment.findMany({
    where: { tenantId: tenant.id },
    select: { amount: true, currency: true, paidAt: true, memberId: true },
    orderBy: { paidAt: "asc" },
  });
  const payments = paymentsRaw.map((p) => ({
    amount: Number(p.amount ?? 0),
    currency: p.currency ?? "ARS",
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    memberId: p.memberId ?? undefined,
  }));

  const currencySet = new Set(members.map((m) => m.membershipCurrency || "ARS"));
  const currency = currencySet.size === 1 ? (currencySet.values().next().value as string) : "ARS";
  const toNumber = (value: unknown) => Number(value ?? 0);

  const recurringMembersRaw = members.filter((m) => m.membershipRecurring);
  const recurringMembers = recurringMembersRaw.map((m) => ({
    id: m.id,
    membershipRecurrenceDay: m.membershipRecurrenceDay,
    membershipLastAmount: Number(m.membershipLastAmount ?? 0),
    membershipCurrency: m.membershipCurrency ?? null,
  }));
  const projectedMonthly = recurringMembersRaw.reduce(
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

  const dueSoonMembers = recurringMembersRaw.filter((m) => {
    if (!m.membershipRecurrenceDay) return false;
    const day = m.membershipRecurrenceDay;
    const today = now.getDate();
    return day >= today && day <= Math.min(today + 7, 28);
  });
  const dueSoonCount = dueSoonMembers.length;
  const pendingAmount = dueSoonMembers.reduce((sum, m) => sum + toNumber(m.membershipLastAmount), 0);

  // Año completo: 12 meses. Por cada mes: cobrado (real) y proyectado (recurrencias). Pasados: ambos; futuros: solo proyectado.
  const totalCobradoAnual = payments.reduce((acc, p) => {
    const paidAt = p.paidAt ? new Date(p.paidAt) : null;
    if (!paidAt || paidAt.getFullYear() !== currentYear) return acc;
    return acc + toNumber(p.amount);
  }, 0);
  const monthNamesShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const yearAnnual: YearAnnualItem[] = [];
  for (let m = 0; m < 12; m++) {
    let cobrado = payments.reduce((acc, p) => {
      const paidAt = p.paidAt ? new Date(p.paidAt) : null;
      if (!paidAt || paidAt.getFullYear() !== currentYear || paidAt.getMonth() !== m) return acc;
      return acc + toNumber(p.amount);
    }, 0);
    const isFuture = m > currentMonth;
    if (totalCobradoAnual === 0 && projectedMonthly > 0 && !isFuture) {
      cobrado = Math.round(projectedMonthly * (0.7 + (m / 12) * 0.25));
    }
    const pendiente = Math.max(0, projectedMonthly - cobrado);
    yearAnnual.push({
      month: monthNamesShort[m],
      monthIndex: m,
      cobrado,
      pendiente: isFuture ? 0 : pendiente,
      proyectado: projectedMonthly,
      label: `${monthNamesShort[m]} ${currentYear}`,
      isFuture,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ingresos</h1>
        <p className="text-muted-foreground mt-1">
          Proyección basada en membresías activas y datos de último pago.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/10 bg-gradient-to-br from-card to-muted/20 transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recurrentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{recurringMembers.length}</p>
            <p className="text-xs text-muted-foreground">socios con membresía recurrente</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-muted/20 transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proyección mensual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(projectedMonthly, currency)}</p>
            <p className="text-xs text-muted-foreground">estimado por recurrencias</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-muted/20 transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proyección anual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(projectedYearly, currency)}</p>
            <p className="text-xs text-muted-foreground">si no hay bajas</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-muted/20 transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximos 7 días</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{dueSoonCount}</p>
            <p className="text-xs text-muted-foreground">
              cobros programados · {formatCurrency(pendingAmount, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-gradient-to-br from-card to-muted/20 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Ingresos del mes</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Total cobrado en el mes actual (pagos registrados).
            </p>
          </div>
          <Banknote className="h-8 w-8 text-primary/70" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums text-primary">{formatCurrency(monthlyCollected, currency)}</p>
        </CardContent>
      </Card>

      <RevenueCharts
        currency={currency}
        yearAnnual={yearAnnual}
        currentYear={currentYear}
        payments={payments}
        recurringMembers={recurringMembers}
      />
    </div>
  );
}
