"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Supplier, SupplierOrder, SupplierOrderItem } from "@prisma/client";
import { createSupplierOrder, deleteSupplierOrder, updateSupplierOrderStatus } from "@/actions/supplier-orders";
import { Copy, Mail, MessageCircle, Plus, RefreshCcw } from "lucide-react";

type OrderWithItems = SupplierOrder & { items: SupplierOrderItem[] };

type Props = {
  tenantSlug: string;
  currency: string;
  supplier: Supplier;
  orders: OrderWithItems[];
};

type DraftItem = { name: string; quantity: number };

function buildMessage(items: { name: string; quantity: number }[]) {
  const lines = items
    .filter((i) => i.quantity > 0)
    .map((i) => `- ${i.name} x ${i.quantity}`);
  return `Hola! Te paso pedido:\n\n${lines.join("\n")}\n\nGracias!`;
}

function normalizePhoneForWhatsapp(raw?: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  // Si ya viene con prefijo (ej 54...), usamos tal cual.
  if (digits.length >= 10) return digits;
  return null;
}

export function SupplierDetailClient({ tenantSlug, currency, supplier, orders }: Props) {
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

  const headerState = activeOrder ? "Pedido en proceso" : "Sin pedidos activos";
  const eta = supplier.nextDeliveryAt ? new Date(supplier.nextDeliveryAt).toLocaleDateString("es-AR") : null;
  const mainContact = supplier.email ?? supplier.phone ?? "—";

  return (
    <div className="space-y-6">
      {/* BLOQUE 1: Header resumen */}
      <Card>
        <CardContent className="py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-center">
            <div>
              <p className="text-xs text-muted-foreground">Mail</p>
              <p className="font-medium truncate">{supplier.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="font-medium truncate">{supplier.phone ?? "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Contacto principal</p>
              <p className="font-medium truncate">{mainContact}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-medium">{headerState}</p>
            </div>
            <div className="lg:text-right">
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="font-medium">{eta ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
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
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!supplier.email || (!generated && selectedItems.length === 0)}
                    onClick={() => {
                      const body = generated || buildMessage(selectedItems);
                      const subject = `Pedido - ${supplier.name}`;
                      const href = `mailto:${encodeURIComponent(supplier.email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      window.location.href = href;
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Mail
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!normalizePhoneForWhatsapp(supplier.phone) || (!generated && selectedItems.length === 0)}
                    onClick={() => {
                      const body = generated || buildMessage(selectedItems);
                      const phone = normalizePhoneForWhatsapp(supplier.phone);
                      if (!phone) return;
                      const href = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
                      window.open(href, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
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

