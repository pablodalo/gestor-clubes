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
import { createSupplierOrder, deleteSupplierOrder, updateSupplierOrderStatus } from "@/actions/supplier-orders";
import { createSupplierPayment } from "@/actions/supplier-payments";
import { Copy, CreditCard, Plus, RefreshCcw } from "lucide-react";

type OrderWithItems = SupplierOrder & { items: SupplierOrderItem[] };

type Props = {
  tenantSlug: string;
  currency: string;
  supplier: Supplier;
  orders: OrderWithItems[];
  payments: SupplierPayment[];
  balance: number;
};

type DraftItem = { name: string; quantity: number };

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
  const activeOrder = orders.find((o) => o.status !== "delivered") ?? null;
  const [viewing, setViewing] = useState<OrderWithItems | null>(null);
  const generatorId = "generador";

  const [draftItems, setDraftItems] = useState<DraftItem[]>(() => {
    const base = (lastOrder?.items ?? []).map((it) => ({
      name: it.name,
      quantity: Number(it.quantity ?? 0),
    }));
    return base.length ? base : [{ name: "", quantity: 1 }];
  });

  const [generated, setGenerated] = useState("");
  const [error, setError] = useState("");

  const selectedItems = useMemo(
    () => draftItems.filter((i) => i.name.trim() && i.quantity > 0).map((i) => ({ name: i.name.trim(), quantity: i.quantity })),
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

  function loadFromOrder(o: OrderWithItems) {
    setDraftItems(
      o.items.map((it) => ({
        name: it.name,
        quantity: Number(it.quantity ?? 0),
      }))
    );
    setGenerated(
      o.messageSnapshot ??
        buildMessage(o.items.map((it) => ({ name: it.name, quantity: Number(it.quantity ?? 0) })))
    );

    // Scroll al generador para acelerar el flujo
    requestAnimationFrame(() => {
      const el = document.getElementById(generatorId);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function loadLastOrder() {
    if (!lastOrder) return;
    loadFromOrder(lastOrder);
  }

  async function saveOrderSnapshot() {
    setError("");
    if (selectedItems.length === 0) {
      setError("Agregá al menos un ítem con cantidad.");
      return;
    }
    const snapshot = generated || buildMessage(selectedItems);
    const res = await createSupplierOrder({
      supplierId: supplier.id,
      status: "draft",
      total: 0,
      messageSnapshot: snapshot,
      items: selectedItems,
    });
    if ((res as { error?: string }).error) {
      setError((res as { error: string }).error);
      return;
    }
    router.refresh();
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

  const headerState = activeOrder ? "Pedido en proceso" : "Sin pedidos activos";
  const eta = supplier.nextDeliveryAt ? new Date(supplier.nextDeliveryAt).toLocaleDateString("es-AR") : null;

  return (
    <div className="space-y-6">
      {/* BLOQUE 1: Header resumen */}
      <Card>
        <CardContent className="py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2 min-w-0">
              <p className="text-xs text-muted-foreground">Contacto</p>
              <p className="font-medium truncate">{supplier.email ?? supplier.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-medium">{headerState}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="font-medium">{eta ?? "—"}</p>
            </div>
            <div className="lg:text-right">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-semibold tabular-nums">{formatMoney(balance, currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 min-w-0">
          {/* BLOQUE 2: Pedido activo */}
          {activeOrder && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pedido activo</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activeOrder.date).toLocaleDateString("es-AR")} · Estado: {activeOrder.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      await updateSupplierOrderStatus({
                        orderId: activeOrder.id,
                        supplierId: supplier.id,
                        status: "delivered",
                      });
                      router.refresh();
                    }}
                  >
                    Marcar como entregado
                  </Button>
                  <select
                    value={activeOrder.status}
                    onChange={async (e) => {
                      await updateSupplierOrderStatus({
                        orderId: activeOrder.id,
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
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <ul className="text-sm space-y-1">
                    {activeOrder.items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between gap-4">
                        <span className="truncate">{it.name}</span>
                        <span className="tabular-nums text-muted-foreground">x {Number(it.quantity ?? 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {eta && <p className="text-sm text-muted-foreground">ETA: {eta}</p>}
              </CardContent>
            </Card>
          )}

          {/* BLOQUE 3: Generador de pedido (simple) */}
          <Card id={generatorId}>
            <CardHeader>
              <CardTitle>Generador de pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="space-y-2">
                {draftItems.map((it, idx) => (
                  <div key={`${idx}`} className="flex items-center gap-3">
                    <Input
                      value={it.name}
                      onChange={(e) => {
                        const next = [...draftItems];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setDraftItems(next);
                      }}
                      className="flex-1"
                      placeholder="Producto"
                    />
                    <Input
                      value={it.quantity}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        const next = [...draftItems];
                        next[idx] = { ...next[idx], quantity: Number.isFinite(qty) ? qty : 0 };
                        setDraftItems(next);
                      }}
                      className="w-24"
                      type="number"
                      min={0}
                      step={1}
                    />
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setDraftItems([...draftItems, { name: "", quantity: 1 }])}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar ítem
                  </Button>
                  <Button type="button" variant="outline" onClick={loadLastOrder} disabled={!lastOrder}>
                    Cargar último pedido
                  </Button>
                  <Button type="button" variant="outline" onClick={handleGenerate}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Generar texto
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Mensaje</Label>
                <textarea
                  className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={generated}
                  onChange={(e) => setGenerated(e.target.value)}
                  placeholder="Hola! Te paso pedido…"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleCopy} disabled={!generated && selectedItems.length === 0}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button type="button" onClick={saveOrderSnapshot}>
                    Guardar pedido
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOQUE 4: Historial de pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de pedidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay pedidos todavía.</p>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{new Date(o.date).toLocaleDateString("es-AR")}</p>
                      <p className={o.status !== "delivered" ? "text-xs font-medium" : "text-xs text-muted-foreground"}>
                        {o.status !== "delivered" ? "Activo" : o.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setViewing(o)}>
                        Ver
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => loadFromOrder(o)}>
                        Repetir
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!confirm("¿Eliminar este pedido?")) return;
                          await deleteSupplierOrder({ orderId: o.id, supplierId: supplier.id });
                          router.refresh();
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* BLOQUE 5: Pagos (sin protagonismo) */}
        <aside className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pagos</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={() => setPaymentOpen(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Registrar
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {payments.length === 0 ? (
                <p className="text-muted-foreground">No hay pagos registrados.</p>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{new Date(p.date).toLocaleDateString("es-AR")}</span>
                    <span className="font-medium tabular-nums">{formatMoney(Number(p.amount ?? 0), currency)}</span>
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

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedido</DialogTitle>
            <DialogDescription>
              {viewing ? `${new Date(viewing.date).toLocaleDateString("es-AR")} · ${viewing.status}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-3">
                <ul className="text-sm space-y-1">
                  {viewing.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-4">
                      <span className="truncate">{it.name}</span>
                      <span className="tabular-nums text-muted-foreground">x {Number(it.quantity ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-2">
                <Label>Mensaje</Label>
                <textarea
                  readOnly
                  className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={viewing.messageSnapshot ?? buildMessage(viewing.items.map((it) => ({ name: it.name, quantity: Number(it.quantity ?? 0) })))}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

