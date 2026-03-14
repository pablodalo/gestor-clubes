import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TenantDashboardClient } from "@/features/dashboard/tenant-dashboard-client";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function TenantDashboardPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const [membersCount, locationsCount, lotsCount, itemsCount, membersByStatus] = await Promise.all([
    prisma.member.count({ where: { tenantId: tenant.id } }),
    prisma.location.count({ where: { tenantId: tenant.id } }),
    prisma.inventoryLot.count({ where: { tenantId: tenant.id } }),
    prisma.inventoryItem.count({ where: { tenantId: tenant.id } }),
    prisma.member.groupBy({
      by: ["status"],
      where: { tenantId: tenant.id },
      _count: { id: true },
    }),
  ]);

  const chartData = membersByStatus.map((s) => ({
    name: s.status === "active" ? "Activos" : s.status === "suspended" ? "Suspendidos" : s.status,
    cantidad: s._count.id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard — {tenant.name}</h1>
        <p className="text-muted-foreground mt-1">Resumen del club.</p>
      </div>
      <TenantDashboardClient
        tenantSlug={tenantSlug}
        kpis={{ membersCount, locationsCount, lotsCount, itemsCount }}
        membersChartData={chartData}
      />
    </div>
  );
}
