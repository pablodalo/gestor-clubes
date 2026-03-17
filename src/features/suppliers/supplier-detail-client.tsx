"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Supplier, SupplierOrder, SupplierOrderItem, SupplierPayment } from "@prisma/client";
import { createSupplierOrder, updateSupplierOrderStatus } from "@/actions/supplier-orders";
import { createSupplierPayment } from "@/actions/supplier-payments";
import { Copy, CreditCard, History, Plus, RefreshCcw, Save } from "lucide-react";

type OrderWithItems = SupplierOrder & { items: SupplierOrderItem[] };

type Props = {
  tenantSlug: string;
  currency: string;
  supplier: Supplier;
  orders: OrderWithItems[];
  payments: SupplierPayment[];
  balance: number;
};

type DraftItem = { name: string; quantity: number; checked: boolean };

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function buildMessage(items: { name: string; quantity: number }[]) {
  const lines = items
    .filter((i) => i.quantity > 0)
    .map((i) => `- ${i.name} x ${i.quantity}`);
  return `Hola! Te paso pedido:\n\n${lines.join("\n")}\n\nGracias!`;
}

export function SupplierDetailClient({ tenantSlug, currency, supplier, orders, payments, balance }: Props) {
  const router = useRouter();
  const lastOrder = orders[0] ?? null;

  const [draftItems, setDraftItems] = useState<DraftItem[]>(() => {
    const base = (lastOrder?.items ?? []).map((it) => ({
      name: it.name,
      quantity: Number(it.quantity ?? 0),
      checked: true,
    }));
    return base.length
      ? base
      : [
          { name: "Producto A", quantity: 2, checked: true },
          { name: "Producto B", quantity: 5, checked: true },
        ];
  });

  const [generated, setGenerated] = useState("");
  const [total, setTotal] = useState<number>(() => Number(lastOrder?.total ?? 0));
  const [status, setStatus] = useState<"draft" | "sent" | "in_progress" | "delivered">("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedItems = useMemo(
    () => draftItems.filter((i) => i.checked && i.quantity > 0).map((i) => ({ name: i.name.trim(), quantity: i.quantity })),
    [draftItems]
  );

  async function handleGenerate() {
    setGenerated(buildMessage(selectedItems));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generated || buildMessage(selectedItems));
    } catch {
      // ignore
    }
  }

  async function handleSaveOrder() {
    setError("");
    if (selectedItems.length === 0) {
      setError("Seleccioná al menos un ítem con cantidad.");
      return;
    }
    setSaving(true);
    const snapshot = generated || buildMessage(selectedItems);
    const res = await createSupplierOrder({
      supplierId: supplier.id,
      status,
      total,
      messageSnapshot: snapshot,
      items: selectedItems,
    });
    setSaving(false);
    if ((res as { error?: string }).error) {
      setError((res as { error: string }).error);
      return;
    }
    router.refresh();
  }

  function loadFromOrder(o: OrderWithItems) {
    setDraftItems(
      o.items.map((it) => ({
        name: it.name,
        quantity: Number(it.quantity ?? 0),
        checked: true,
      }))
    );
    setGenerated(o.messageSnapshot ?? buildMessage(o.items.map((it) => ({ name: it.name, quantity: Number(it.quantity ?? 0) }))));
    setTotal(Number(o.total ?? 0));
    setStatus((o.status as typeof status) ?? "draft");
  }

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(toDateInput(new Date()));
  const [paymentError, setPaymentError] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentError("");
    setPaymentSaving(true);
    const res = await createSupplierPayment({
      supplierId: supplier.id,
      amount: paymentAmount,
      date: paymentDate,
    });
    setPaymentSaving(false);
    if ((res as { error?: string }).error) {
      setPaymentError((res as { error: string }).error);
      return;
    }
    setPaymentOpen(false);
    setPaymentAmount(0);
    setPaymentDate(toDateInput(new Date()));
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6 min-w-0">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Generador de pedido</CardTitle>
            <p className="text-sm text-muted-foreground">
              Basado en el último pedido. Marcá ítems, ajustá cantidades y generá el texto para copiar/pegar.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="grid gap-2">
              {draftItems.map((it, idx) => (
                <div key={`${it.name}-${idx}`} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={it.checked}
                    onChange={(e) => {
                      const next = [...draftItems];
                      next[idx] = { ...next[idx], checked: e.target.checked };
                      setDraftItems(next);
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Input
                    value={it.name}
                    onChange={(e) => {
                      const next = [...draftItems];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setDraftItems(next);
                    }}
                    className="flex-1"
                    placeholder="Nombre del ítem"
                  />
                  <Input
                    value={it.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const next = [...draftItems];
                      next[idx] = { ...next[idx], quantity: Number.isFinite(qty) ? qty : 0 };
                      setDraftItems(next);
                    }}
                    className="w-28"
                    type="number"
                    min={0}
                    step={1}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraftItems([...draftItems, { name: "", quantity: 1, checked: true }])}
                className="w-fit"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar ítem
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  min={0}
                  value={total}
                  onChange={(e) => setTotal(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviado</option>
                  <option value="in_progress">En progreso</option>
                  <option value="delivered">Entregado</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" variant="outline" onClick={handleGenerate} className="w-full">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Generar
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Texto del pedido</Label>
              <textarea
                className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={generated}
                onChange={(e) => setGenerated(e.target.value)}
                placeholder="Generá el pedido para ver el texto acá…"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={handleCopy} disabled={!generated && selectedItems.length === 0}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button type="button" onClick={handleSaveOrder} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar pedido"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historial de pedidos</CardTitle>
              <p className="text-sm text-muted-foreground">Pedidos guardados para este proveedor.</p>
            </div>
            <History className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pedidos todavía.</p>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {new Date(o.date).toLocaleDateString("es-AR")} · {formatMoney(Number(o.total ?? 0), currency)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.items.slice(0, 3).map((it) => `${it.name} x ${Number(it.quantity ?? 0)}`).join(" · ")}
                      {o.items.length > 3 ? " · …" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={o.status}
                      onChange={async (e) => {
                        await updateSupplierOrderStatus({
                          orderId: o.id,
                          supplierId: supplier.id,
                          status: e.target.value as any,
                        });
                        router.refresh();
                      }}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="draft">Borrador</option>
                      <option value="sent">Enviado</option>
                      <option value="in_progress">En progreso</option>
                      <option value="delivered">Entregado</option>
                    </select>
                    <Button type="button" variant="outline" onClick={() => loadFromOrder(o)}>
                      Repetir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Proveedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{supplier.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contacto</span>
              <span className="font-medium">{supplier.email ?? supplier.phone ?? "—"}</span>
            </div>
            <div>
              <p className="text-muted-foreground">Notas</p>
              <p className="mt-1">{supplier.notes ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Estado financiero</CardTitle>
            <Badge variant={balance > 0 ? "secondary" : "success"}>
              {balance > 0 ? "Saldo pendiente" : "Al día"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Balance (pedidos - pagos)</p>
            <p className="text-2xl font-bold tabular-nums">{formatMoney(balance, currency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pagos</CardTitle>
            <Button type="button" size="sm" onClick={() => setPaymentOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Registrar pago
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {payments.length === 0 ? (
              <p className="text-muted-foreground">No hay pagos registrados.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{new Date(p.date).toLocaleDateString("es-AR")}</span>
                  <span className="font-medium">{formatMoney(Number(p.amount ?? 0), currency)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar pago</DialogTitle>
              <DialogDescription>Guardá un pago asociado a este proveedor.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitPayment} className="grid gap-4">
              {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}
              <div className="grid gap-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={paymentSaving}>
                  {paymentSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </aside>
    </div>
  );
}

