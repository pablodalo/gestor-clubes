"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type SummaryBarItem = {
  name: string;
  cobrado: number;
  pendiente: number;
  proyectado: number;
};

export type MonthlyTrendItem = {
  month: string;
  cobrado: number;
  label: string;
};

export type YearAnnualItem = {
  month: string;
  monthIndex: number;
  cobrado: number;
  proyectado: number;
  label: string;
  isFuture: boolean;
};

type Props = {
  currency: string;
  summaryData: SummaryBarItem[];
  monthlyTrend: MonthlyTrendItem[];
  yearAnnual: YearAnnualItem[];
  currentYear: number;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function RevenueCharts({ currency, summaryData, monthlyTrend, yearAnnual, currentYear }: Props) {
  const hasSummary = summaryData.some((d) => d.cobrado > 0 || d.pendiente > 0 || d.proyectado > 0);
  const hasTrend = monthlyTrend.some((d) => d.cobrado > 0);
  const hasAnnual = yearAnnual.some((d) => d.cobrado > 0 || d.proyectado > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
      {/* Resumen: Cobrado · Pendiente · Proyectado */}
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Resumen del mes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresos cobrados, pendientes por cobro y proyección mensual por recurrencias.
          </p>
        </CardHeader>
        <CardContent>
          {hasSummary ? (
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summaryData}
                  margin={{ top: 12, right: 12, left: 12, bottom: 8 }}
                  barCategoryGap="28%"
                  barGap={8}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/80" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v, currency)} width={72} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "var(--radius)",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value: number) => [formatMoney(value, currency), ""]}
                    labelFormatter={(label) => label}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) =>
                      value === "cobrado"
                        ? "Cobrado"
                        : value === "pendiente"
                          ? "Pendiente"
                          : "Proyectado"
                    }
                  />
                  <Bar
                    dataKey="cobrado"
                    name="cobrado"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={56}
                  />
                  <Bar
                    dataKey="pendiente"
                    name="pendiente"
                    fill="hsl(38 92% 50%)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={56}
                  />
                  <Bar
                    dataKey="proyectado"
                    name="proyectado"
                    fill="hsl(174 30% 45%)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 text-sm text-muted-foreground">
              Sin datos para mostrar. Registrá pagos y socios recurrentes.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tendencia últimos meses (compacto) */}
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Ingresos por mes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total cobrado en cada mes (pagos registrados).
          </p>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTrend}
                  margin={{ top: 12, right: 12, left: 12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/80" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v, currency)} width={72} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "var(--radius)",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value: number) => [formatMoney(value, currency), "Cobrado"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                  />
                  <Bar
                    dataKey="cobrado"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 text-sm text-muted-foreground">
              Aún no hay pagos registrados por mes.
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Gráfico anual: ancho completo, pasado + futuro con proyección */}
      <Card className="w-full overflow-hidden border-primary/10 bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Vista anual {currentYear}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cobrado real por mes y proyección mensual por recurrencias (meses futuros).
          </p>
        </CardHeader>
        <CardContent className="w-full">
          {hasAnnual ? (
            <div className="h-[280px] w-full min-w-0" style={{ width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearAnnual}
                  margin={{ top: 12, right: 16, left: 12, bottom: 8 }}
                  barCategoryGap="12%"
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/80" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v, currency)} width={72} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "var(--radius)",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value: number, name: string) => [
                      formatMoney(value, currency),
                      name === "cobrado" ? "Cobrado" : "Proyectado",
                    ]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => (value === "cobrado" ? "Cobrado" : "Proyectado")}
                  />
                  <Bar
                    dataKey="cobrado"
                    name="cobrado"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="proyectado"
                    name="proyectado"
                    fill="hsl(174 30% 55% / 0.85)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[220px] w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 text-sm text-muted-foreground">
              Sin datos de cobrado ni proyección para el año.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
