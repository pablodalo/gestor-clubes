"use client";

import { useMemo, useState } from "react";
import type { Supplier } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierForm } from "@/features/admin/supplier-form";
import { Truck, Building2 } from "lucide-react";

type Row = Supplier & {
  suppliesCount?: number;
  lastOrder?: { date: Date; total: unknown; status: string } | null;
  activeOrdersCount?: number;
  balance?: number;
};

export function SuppliersTable({
  tenantSlug,
  suppliers,
  canCreate,
}: {
  tenantSlug: string;
  suppliers: Row[];
  canCreate: boolean;
}) {
  const [q, setQ] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (deliveryFilter === "pending" && !s.pendingDelivery) return false;
      if (deliveryFilter === "ok" && s.pendingDelivery) return false;
      const paymentPending = s.pendingPayment || s.paymentStatus === "pending";
      if (paymentFilter === "pending" && !paymentPending) return false;
      if (paymentFilter === "ok" && paymentPending) return false;
      if (!term) return true;
      const hay = [s.name, s.suppliesProvided ?? "", s.email ?? "", s.phone ?? ""].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [suppliers, q, deliveryFilter, paymentFilter]);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

  const columns: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "Proveedor",
      render: (s) => (
        <Link
          href={`/app/${tenantSlug}/suppliers/${s.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {s.name}
        </Link>
      ),
    },
    { key: "suppliesProvided", header: "Suministra", render: (s) => s.suppliesProvided ?? "—" },
    { key: "suppliesCount", header: "Suministros", render: (s) => s.suppliesCount ?? 0, align: "center" },
    {
      key: "lastOrder",
      header: "Último pedido",
      render: (s) =>
        s.lastOrder ? (
          <span className="text-muted-foreground">
            {new Date(s.lastOrder.date).toLocaleDateString("es-AR")} · {formatMoney(Number(s.lastOrder.total ?? 0))}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "activeOrders",
      header: "Activos",
      align: "center",
      render: (s) => (
        <Badge variant={(s.activeOrdersCount ?? 0) > 0 ? "secondary" : "success"}>
          {(s.activeOrdersCount ?? 0) > 0 ? `${s.activeOrdersCount}` : "0"}
        </Badge>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      render: (s) => (
        <span className={Number(s.balance ?? 0) > 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
          {formatMoney(Number(s.balance ?? 0))}
        </span>
      ),
    },
    { key: "email", header: "Email", render: (s) => s.email ?? "—" },
    { key: "phone", header: "Teléfono", render: (s) => s.phone ?? "—" },
    {
      key: "delivery",
      header: "Entregas",
      render: (s) => (
        <Badge variant={s.pendingDelivery ? "secondary" : "success"}>
          {s.pendingDelivery ? `Pendiente${s.nextDeliveryAt ? ` · ${new Date(s.nextDeliveryAt).toLocaleDateString("es-AR")}` : ""}` : "Al día"}
        </Badge>
      ),
    },
    {
      key: "payments",
      header: "Pagos",
      render: (s) => (
        <Badge variant={s.pendingPayment || s.paymentStatus === "pending" ? "secondary" : "success"}>
          {s.pendingPayment || s.paymentStatus === "pending" ? "Pendiente" : "Al día"}
        </Badge>
      ),
    },
  ];

  const exportData = filtered.map((s) => ({
    id: s.id,
    name: s.name,
    suppliesProvided: s.suppliesProvided ?? "",
    suppliesCount: s.suppliesCount ?? 0,
    lastOrderDate: s.lastOrder ? new Date(s.lastOrder.date).toISOString() : "",
    lastOrderTotal: Number(s.lastOrder?.total ?? 0),
    activeOrdersCount: s.activeOrdersCount ?? 0,
    balance: Number(s.balance ?? 0),
    email: s.email ?? "",
    phone: s.phone ?? "",
    pendingDelivery: s.pendingDelivery ? "Sí" : "No",
    nextDeliveryAt: s.nextDeliveryAt ? new Date(s.nextDeliveryAt).toISOString() : "",
    pendingPayment: s.pendingPayment || s.paymentStatus === "pending" ? "Sí" : "No",
  }));

  return (
    <>
      <ListPageLayout
        title="Proveedores"
        description="Gestión de proveedores e insumos."
        actions={
          <>
            <ExportButtons data={exportData} filename="proveedores" />
            {canCreate && (
              <Button onClick={() => setOpen(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                Nuevo proveedor
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(s) => s.id}
          emptyMessage="No hay proveedores."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre, email, teléfono…"
                  className="sm:max-w-sm"
                />
                <div className="flex gap-2">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={deliveryFilter}
                    onChange={(e) => setDeliveryFilter(e.target.value)}
                  >
                    <option value="">Entregas (todas)</option>
                    <option value="pending">Pendientes</option>
                    <option value="ok">Al día</option>
                  </select>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                  >
                    <option value="">Pagos (todos)</option>
                    <option value="pending">Pendientes</option>
                    <option value="ok">Al día</option>
                  </select>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
            </div>
          }
          emptyState={{ icon: Truck, title: "Sin proveedores", description: "Creá uno desde «Nuevo proveedor»." }}
        />
      </ListPageLayout>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo proveedor</DialogTitle>
            <DialogDescription>Registrá un proveedor para gestionar insumos.</DialogDescription>
          </DialogHeader>
          <SupplierForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
