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
    <Card className="w-full overflow-hidden border-primary/10 bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Vista anual {currentYear}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Por cada mes: Cobrado (real) y Proyectado (recurrencias). Meses pasados pueden tener ambos; meses futuros solo proyección.
        </p>
      </CardHeader>
      <CardContent className="w-full px-0 sm:px-6">
        {hasAnnual ? (
          <div className="h-[300px] w-full min-w-0" style={{ width: "100%" }}>
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
                  labelFormatter={(_, payload) =>
                    (payload as Array<{ payload?: { label?: string } }>)?.[0]?.payload?.label ?? ""
                  }
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
                  maxBarSize={40}
                />
                <Bar
                  dataKey="proyectado"
                  name="proyectado"
                  fill="hsl(174 30% 55% / 0.85)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
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
