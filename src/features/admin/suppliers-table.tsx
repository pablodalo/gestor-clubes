"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Supplier } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (!term) return true;
      const hay = [s.name, s.suppliesProvided ?? ""].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [suppliers, q]);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

  const daysAgoLabel = (date?: Date | null) => {
    if (!date) return "—";
    const d = new Date(date);
    const diffDays = Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
  };

  const getEstado = (s: Row): "Sin pedidos" | "En proceso" | "Pendiente" => {
    const hasOrders = !!s.lastOrder;
    if (!hasOrders) return "Sin pedidos";
    if ((s.activeOrdersCount ?? 0) > 0) return "En proceso";
    if (Number(s.balance ?? 0) > 0) return "Pendiente";
    return "Sin pedidos";
  };

  const columns: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "Proveedor",
      className: "w-[30%]",
      render: (s) => <span className="font-medium text-foreground">{s.name}</span>,
    },
    {
      key: "suppliesProvided",
      header: "Categoría",
      className: "w-[28%] text-muted-foreground",
      render: (s) => <span className="text-muted-foreground">{s.suppliesProvided ?? "—"}</span>,
    },
    {
      key: "lastOrder",
      header: "Último pedido",
      className: "w-[16%]",
      render: (s) =>
        s.lastOrder ? (
          <div className="text-muted-foreground">
            <div>{new Date(s.lastOrder.date).toLocaleDateString("es-AR")}</div>
            <div className="text-xs">{daysAgoLabel(s.lastOrder.date)}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "estado",
      header: "Estado",
      className: "w-[14%]",
      render: (s) => (
        <Badge
          variant={
            getEstado(s) === "En proceso"
              ? "warning"
              : getEstado(s) === "Pendiente"
                ? "destructive"
                : "secondary"
          }
        >
          {getEstado(s)}
        </Badge>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      className: "w-[12%] tabular-nums",
      render: (s) => (
        <span className={Number(s.balance ?? 0) > 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
          {formatMoney(Number(s.balance ?? 0))}
        </span>
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
    estado: getEstado(s),
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
          onRowClick={(s) => router.push(`/app/${tenantSlug}/suppliers/${s.id}`)}
          rowClassName="group"
          rowActions={(s) => (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/app/${tenantSlug}/suppliers/${s.id}#generador`);
              }}
            >
              Nuevo pedido
            </Button>
          )}
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre o categoría…"
                  className="sm:max-w-sm"
                />
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
