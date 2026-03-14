"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  tenantSlug: string;
  kpis: {
    membersCount: number;
    locationsCount: number;
    lotsCount: number;
    itemsCount: number;
  };
  membersChartData: { name: string; cantidad: number }[];
};

export function TenantDashboardClient({ tenantSlug, kpis, membersChartData }: Props) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href={`/app/${tenantSlug}/members`}>
          <Card className="hover:border-primary/30 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Socios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis.membersCount}</p>
              <p className="text-xs text-muted-foreground">Ver listado</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/app/${tenantSlug}/locations`}>
          <Card className="hover:border-primary/30 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ubicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis.locationsCount}</p>
              <p className="text-xs text-muted-foreground">Ver listado</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/app/${tenantSlug}/lots`}>
          <Card className="hover:border-primary/30 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lotes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis.lotsCount}</p>
              <p className="text-xs text-muted-foreground">Ver listado</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/app/${tenantSlug}/inventory`}>
          <Card className="hover:border-primary/30 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ítems inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis.itemsCount}</p>
              <p className="text-xs text-muted-foreground">Ver listado</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      {membersChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Socios por estado</CardTitle>
            <p className="text-sm text-muted-foreground">Distribución de socios activos, suspendidos e inactivos.</p>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={membersChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))" }}
                    formatter={(value: number) => [value, "Socios"]}
                  />
                  <Bar dataKey="cantidad" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
