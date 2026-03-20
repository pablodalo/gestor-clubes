"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import { AlertDialog } from "@/components/alert-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { createSupplierOrder, deleteSupplierOrder, updateSupplierOrderStatus } from "@/actions/supplier-orders";
import { updateSupplier } from "@/actions/admin";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Copy, Mail, Pencil, Plus, RefreshCcw } from "lucide-react";

type OrderWithItems = SupplierOrder & { items: SupplierOrderItem[] };

type Props = {
  tenantSlug: string;
  currency: string;
  supplier: Supplier;
  orders: OrderWithItems[];
  canManage?: boolean;
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
  if (digits.length >= 10) return digits;
  return null;
}

function parseOrderSnapshot(snapshot?: string | null) {
  if (!snapshot) return { author: null as string | null, message: null as string | null };
  const match = snapshot.match(/^\[\[author:(.+?)\]\]\s*\n?/);
  if (!match) return { author: null as string | null, message: snapshot };
  const author = match[1]?.trim() || null;
  const message = snapshot.replace(/^\[\[author:.+?\]\]\s*\n?/, "");
  return { author, message };
}

/** Etiquetas en español para estados de pedido guardados en DB. */
function orderStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Borrador",
    sent: "Enviado",
    in_progress: "En progreso",
    delivered: "Entregado",
  };
  return map[status] ?? status;
}

export function SupplierDetailClient({
  tenantSlug,
  currency: _currency,
  supplier,
  orders,
  canManage = false,
}: Props) {
  void _currency;
  void tenantSlug;
  const router = useRouter();
  const lastOrder = orders[0] ?? null;
  const activeOrder = orders.find((o) => o.status !== "delivered") ?? null;
  const [viewing, setViewing] = useState<OrderWithItems | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderWithItems | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "Aviso", message: "" });

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [editName, setEditName] = useState(supplier.name);
  const [editEmail, setEditEmail] = useState(supplier.email ?? "");
  const [editPhone, setEditPhone] = useState(supplier.phone ?? "");
  const [editAddress, setEditAddress] = useState(supplier.address ?? "");
  const [editSupplies, setEditSupplies] = useState(supplier.suppliesProvided ?? "");
  const [editNotes, setEditNotes] = useState(supplier.notes ?? "");

  useEffect(() => {
    setEditName(supplier.name);
    setEditEmail(supplier.email ?? "");
    setEditPhone(supplier.phone ?? "");
    setEditAddress(supplier.address ?? "");
    setEditSupplies(supplier.suppliesProvided ?? "");
    setEditNotes(supplier.notes ?? "");
  }, [supplier]);

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
    () =>
      draftItems
        .filter((i) => i.name.trim() && i.quantity > 0)
        .map((i) => ({ name: i.name.trim(), quantity: i.quantity })),
    [draftItems]
  );

  function openNewOrderDialog() {
    setDraftItems([{ name: "", quantity: 1 }]);
    setGenerated("");
    setError("");
    setGeneratorOpen(true);
  }

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
    const parsed = parseOrderSnapshot(o.messageSnapshot);
    setDraftItems(
      o.items.map((it) => ({
        name: it.name,
        quantity: Number(it.quantity ?? 0),
      }))
    );
    setGenerated(
      parsed.message ??
        buildMessage(o.items.map((it) => ({ name: it.name, quantity: Number(it.quantity ?? 0) })))
    );
    setError("");
    setGeneratorOpen(true);
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
    setGeneratorOpen(false);
    router.refresh();
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    setEditSaving(true);
    const res = await updateSupplier({
      supplierId: supplier.id,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
      suppliesProvided: editSupplies.trim(),
      notes: editNotes.trim(),
    });
    setEditSaving(false);
    if ((res as { error?: string }).error) {
      setEditError((res as { error: string }).error);
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  const headerState = activeOrder ? "Pedido en proceso" : "Sin pedidos activos";
  const eta = supplier.nextDeliveryAt ? new Date(supplier.nextDeliveryAt).toLocaleDateString("es-AR") : null;
  const activeOrderAuthor = activeOrder ? parseOrderSnapshot(activeOrder.messageSnapshot).author : null;

  return (
    <div className="space-y-5">
      {/* Datos del proveedor */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid flex-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mail</p>
                <p className="text-sm font-medium leading-snug break-all">{supplier.email ?? "—"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Teléfono</p>
                <p className="text-sm font-medium leading-snug">{supplier.phone ?? "—"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</p>
                <p className="text-sm font-medium">{headerState}</p>
              </div>
              <div className="space-y-0.5 lg:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Próxima entrega</p>
                <p className="text-sm font-medium">{eta ?? "—"}</p>
              </div>
            </div>
            {canManage && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                aria-label="Editar datos del proveedor"
                title="Editar datos del proveedor"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pedido activo */}
      {activeOrder && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base">Pedido activo</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(activeOrder.date).toLocaleDateString("es-AR")}
                {activeOrderAuthor ? ` · Hecho por: ${activeOrderAuthor}` : ` · ${orderStatusLabel(activeOrder.status)}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                    status: e.target.value as "draft" | "sent" | "in_progress" | "delivered",
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
          <CardContent className="space-y-3 pt-0">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <ul className="space-y-1.5 text-sm">
                {activeOrder.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-4">
                    <span className="truncate">{it.name}</span>
                    <span className="tabular-nums text-muted-foreground">× {Number(it.quantity ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {eta && <p className="text-xs text-muted-foreground">Entrega estimada: {eta}</p>}
          </CardContent>
        </Card>
      )}

      {/* Historial + CTA nuevo pedido */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Historial de pedidos</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Pedidos anteriores y su estado</p>
          </div>
          <Button type="button" size="sm" className="shrink-0" onClick={openNewOrderDialog}>
            Nuevo pedido
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No hay pedidos todavía.</p>
          ) : (
            orders.map((o) => {
              const isActive = o.status !== "delivered";
              const statusText = isActive ? "Activo" : orderStatusLabel(o.status);
              return (
                <div
                  key={o.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-medium tabular-nums">
                      {new Date(o.date).toLocaleDateString("es-AR")}
                    </span>
                    <Badge variant={isActive ? "warning" : "secondary"} className="font-normal">
                      {statusText}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setViewing(o)}>
                      Ver
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => loadFromOrder(o)}>
                      Repetir
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOrderToDelete(o)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Editar proveedor */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md gap-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Editar proveedor</DialogTitle>
            <DialogDescription>Actualizá los datos de contacto y notas.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4">
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Input id="edit-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-supplies">Qué suministra</Label>
              <Input id="edit-supplies" value={editSupplies} onChange={(e) => setEditSupplies(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Input id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generador de pedido (modal) */}
      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg gap-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Nuevo pedido</DialogTitle>
            <DialogDescription>Armá el pedido y envialo por mail o WhatsApp, o guardalo como borrador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                <Button type="button" variant="outline" size="sm" onClick={() => setDraftItems([...draftItems, { name: "", quantity: 1 }])}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar ítem
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={loadLastOrder} disabled={!lastOrder}>
                  Cargar último pedido
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerate}>
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
                <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={!generated && selectedItems.length === 0}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                {supplier.email?.trim() && (
                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!generated && selectedItems.length === 0}
                  >
                    <a
                      href={`mailto:${(supplier.email ?? "").trim()}?subject=${encodeURIComponent(
                        `Pedido - ${supplier.name}`
                      )}&body=${encodeURIComponent(generated || buildMessage(selectedItems))}`}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Mail
                    </a>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!normalizePhoneForWhatsapp(supplier.phone) || (!generated && selectedItems.length === 0)}
                  onClick={() => {
                    const body = generated || buildMessage(selectedItems);
                    const phone = normalizePhoneForWhatsapp(supplier.phone);
                    if (!phone) return;
                    const href = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
                    window.open(href, "_blank", "noopener,noreferrer");
                  }}
                >
                  <WhatsAppIcon className="mr-2 h-4 w-4 text-[#25D366]" />
                  WhatsApp
                </Button>
                <Button type="button" size="sm" onClick={saveOrderSnapshot}>
                  Guardar pedido
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
        title="Eliminar pedido"
        description="¿Eliminar este pedido?"
        confirmLabel="Eliminar"
        destructive
        onConfirm={async () => {
          if (!orderToDelete) return;
          const res = await deleteSupplierOrder({ orderId: orderToDelete.id, supplierId: supplier.id });
          if (res.error) {
            setAlertMessage({ title: "Error", message: res.error });
            setAlertOpen(true);
          } else router.refresh();
        }}
      />
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen} title={alertMessage.title} message={alertMessage.message} />
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md gap-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Detalle del pedido</DialogTitle>
            <DialogDescription>
              {viewing
                ? `${new Date(viewing.date).toLocaleDateString("es-AR")} · ${orderStatusLabel(viewing.status)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-4">
              {parseOrderSnapshot(viewing.messageSnapshot).author && (
                <p className="text-[11px] text-muted-foreground">
                  Hecho por: {parseOrderSnapshot(viewing.messageSnapshot).author}
                </p>
              )}
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
                  value={
                    parseOrderSnapshot(viewing.messageSnapshot).message ??
                    buildMessage(viewing.items.map((it) => ({ name: it.name, quantity: Number(it.quantity ?? 0) })))
                  }
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
