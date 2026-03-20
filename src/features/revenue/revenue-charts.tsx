"use client";

import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";

export type YearAnnualItem = {
  month: string;
  monthIndex: number;
  cobrado: number;
  pendiente?: number;
  proyectado: number;
  label: string;
  isFuture: boolean;
};

type PaymentRow = { amount: number; currency: string; paidAt: string | null; memberId?: string };
type RecurringMember = {
  id: string;
  membershipRecurrenceDay: number | null;
  membershipLastAmount: number;
  membershipCurrency: string | null;
};

type Props = {
  currency: string;
  yearAnnual: YearAnnualItem[];
  currentYear: number;
  payments?: PaymentRow[];
  recurringMembers?: RecurringMember[];
};

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/* Paleta The Dab Club suavizada: primary #1a1a1a, secondary #e6dcc8, accent #c6a15b */
const COLORS = {
  cobrado: "#22c55e",      // verde suave (colectado)
  pendiente: "#c6a15b",    // dorado/amber suave (pendiente)
  proyectado: "#9ca3af",   // gris suave (proyectado)
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function RevenueCharts({
  currency,
  yearAnnual,
  currentYear,
  payments = [],
  recurringMembers = [],
}: Props) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const hasAnnual = yearAnnual.some((d) => d.cobrado > 0 || d.proyectado > 0 || (d.pendiente ?? 0) > 0);

  const dailyData = useMemo(() => {
    if (expandedMonth == null) return [];
    const monthStart = new Date(currentYear, expandedMonth, 1);
    const daysInMonth = new Date(currentYear, expandedMonth + 1, 0).getDate();
    const daily: Array<{ day: number; cobrado: number; pendiente: number; proyectado: number; label: string }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(currentYear, expandedMonth, d);
      const cobrado = payments.reduce((acc, p) => {
        const paidAt = p.paidAt ? new Date(p.paidAt) : null;
        if (!paidAt || paidAt.getDate() !== d || paidAt.getMonth() !== expandedMonth || paidAt.getFullYear() !== currentYear) return acc;
        return acc + p.amount;
      }, 0);
      const pendiente = recurringMembers.reduce((acc, m) => {
        if (m.membershipRecurrenceDay !== d) return acc;
        const paidThisMonth = payments.some((p) => {
          const paidAt = p.paidAt ? new Date(p.paidAt) : null;
          return (
            paidAt &&
            paidAt.getMonth() === expandedMonth &&
            paidAt.getFullYear() === currentYear &&
            p.memberId === m.id
          );
        });
        if (paidThisMonth) return acc;
        return acc + m.membershipLastAmount;
      }, 0);
      daily.push({
        day: d,
        cobrado,
        pendiente,
        proyectado: pendiente,
        label: `${d} de ${MONTH_NAMES[expandedMonth]}`,
      });
    }
    return daily;
  }, [expandedMonth, currentYear, payments, recurringMembers]);

  const summary = useMemo(() => {
    if (expandedMonth == null) return { cobrado: 0, pendiente: 0, proyectado: 0 };
    const cobrado = dailyData.reduce((s, d) => s + d.cobrado, 0);
    const pendiente = dailyData.reduce((s, d) => s + d.pendiente, 0);
    const proyectado = dailyData.reduce((s, d) => s + d.proyectado, 0);
    return { cobrado, pendiente, proyectado };
  }, [expandedMonth, dailyData]);

  return (
    <>
      <Card className="w-full min-w-0 overflow-hidden border-primary/10 bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">Ingresos {currentYear}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cobrado, Pendiente y Proyectado por mes. Hacé clic en un mes para ver el detalle diario.
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
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
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
                      boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                      backgroundColor: "hsl(var(--card))",
                    }}
                    formatter={(value: number, name: string) => [
                      formatMoney(value, currency),
                      name === "cobrado" ? "Cobrado" : name === "pendiente" ? "Pendiente" : "Proyectado",
                    ]}
                    labelFormatter={(_, payload) =>
                      (payload as Array<{ payload?: { label?: string } }>)?.[0]?.payload?.label ?? ""
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) =>
                      value === "cobrado" ? "Cobrado" : value === "pendiente" ? "Pendiente" : "Proyectado"
                    }
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="cobrado"
                    name="cobrado"
                    fill={COLORS.cobrado}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    onClick={(data: { monthIndex?: number }) => {
                      if (typeof data?.monthIndex === "number") setExpandedMonth(data.monthIndex);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <Bar
                    dataKey="pendiente"
                    name="pendiente"
                    fill={COLORS.pendiente}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    onClick={(data: { monthIndex?: number }) => {
                      if (typeof data?.monthIndex === "number") setExpandedMonth(data.monthIndex);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <Bar
                    dataKey="proyectado"
                    name="proyectado"
                    fill={COLORS.proyectado}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    onClick={(data: { monthIndex?: number }) => {
                      if (typeof data?.monthIndex === "number") setExpandedMonth(data.monthIndex);
                    }}
                    style={{ cursor: "pointer" }}
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

      <Dialog open={expandedMonth !== null} onOpenChange={(open) => !open && setExpandedMonth(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-base">
                Detalle mensual / {expandedMonth != null ? MONTH_NAMES[expandedMonth] : ""} {currentYear}
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={() => setExpandedMonth(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al año
              </Button>
            </div>
          </DialogHeader>
          {expandedMonth != null && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <h3 className="text-sm font-semibold mb-3">Detalle diario de {MONTH_NAMES[expandedMonth]} {currentYear}</h3>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Cobrado</p>
                    <p className="text-lg font-semibold text-green-600">{formatMoney(summary.cobrado, currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                    <p className="text-lg font-semibold text-amber-700">{formatMoney(summary.pendiente, currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Proyectado</p>
                    <p className="text-lg font-semibold text-stone-700">{formatMoney(summary.proyectado, currency)}</p>
                  </div>
                </div>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      interval={Math.max(0, Math.floor(dailyData.length / 10) - 1)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => formatMoney(v, currency)}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "var(--radius)",
                        border: "1px solid hsl(var(--border))",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                        backgroundColor: "hsl(var(--card))",
                      }}
                      formatter={(value: number, name: string) => [
                        formatMoney(value, currency),
                        name === "cobrado" ? "Cobrado" : name === "pendiente" ? "Pendiente" : "Proyectado",
                      ]}
                      labelFormatter={(_, payload) =>
                        (payload as Array<{ payload?: { label?: string } }>)?.[0]?.payload?.label ?? ""
                      }
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value) =>
                        value === "cobrado" ? "Cobrado" : value === "pendiente" ? "Pendiente" : "Proyectado"
                      }
                      iconType="circle"
                      iconSize={6}
                    />
                    <Bar dataKey="cobrado" name="cobrado" fill={COLORS.cobrado} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendiente" name="pendiente" fill={COLORS.pendiente} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="proyectado" name="proyectado" fill={COLORS.proyectado} radius={[0, 0, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
