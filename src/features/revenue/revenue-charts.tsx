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
  yearAnnual: YearAnnualItem[];
  currentYear: number;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function RevenueCharts({ currency, yearAnnual, currentYear }: Props) {
  const hasAnnual = yearAnnual.some((d) => d.cobrado > 0 || d.proyectado > 0);

  return (
    <Card className="w-full min-w-0 overflow-hidden border-primary/20 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">Vista anual {currentYear}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cobrado (real) y Proyectado (recurrencias) por mes. Meses pasados: ambos cuando hay datos; meses futuros: solo proyección.
        </p>
      </CardHeader>
      <CardContent className="w-full px-0">
        {hasAnnual ? (
          <div className="h-[320px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={yearAnnual}
                margin={{ top: 16, right: 24, left: 8, bottom: 12 }}
                barCategoryGap="8%"
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => formatMoney(v, currency)}
                  width={76}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "var(--radius)",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                    backgroundColor: "hsl(var(--card))",
                  }}
                  formatter={(value: number, name: string) => [
                    formatMoney(value, currency),
                    name === "cobrado" ? "Cobrado" : "Proyectado",
                  ]}
                  labelFormatter={(_, payload) =>
                    (payload as Array<{ payload?: { label?: string } }>)?.[0]?.payload?.label ?? ""
                  }
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => (value === "cobrado" ? "Cobrado" : "Proyectado")}
                  iconType="square"
                  iconSize={10}
                />
                <Bar
                  dataKey="cobrado"
                  name="cobrado"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
                <Bar
                  dataKey="proyectado"
                  name="proyectado"
                  fill="hsl(174 35% 52%)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[240px] w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 text-sm text-muted-foreground">
            Sin datos de cobrado ni proyección para el año.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
