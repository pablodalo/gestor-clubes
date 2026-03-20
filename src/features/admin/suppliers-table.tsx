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
import { MessageCircle, Truck, Building2, Search } from "lucide-react";

/** Mismo criterio que en detalle de proveedor (wa.me). */
function normalizePhoneForWhatsapp(raw?: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length >= 10) return digits;
  return null;
}

type Row = Supplier & {
  suppliesCount?: number;
  lastOrder?: { date: Date; total: unknown; status: string } | null;
  activeOrdersCount?: number;
  activeLastOrder?: { date: Date; total: unknown; status: string } | null;
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

  const getEstado = (s: Row) => {
    const st = (s.activeLastOrder ?? s.lastOrder)?.status ?? null;
    if (!st) return { label: "Sin pedidos", variant: "secondary" as const };
    if (st === "draft") return { label: "Borrador", variant: "secondary" as const };
    if (st === "sent") return { label: "Enviado", variant: "default" as const };
    if (st === "in_progress") return { label: "En progreso", variant: "warning" as const };
    if (st === "delivered") return { label: "Entregado", variant: "success" as const };
    return { label: st, variant: "outline" as const };
  };

  const columns: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "Proveedor",
      className: "w-[33%]",
      render: (s) => <span className="font-medium text-foreground truncate block">{s.name}</span>,
    },
    {
      key: "suppliesProvided",
      header: "Categoría",
      className: "w-[33%]",
      render: (s) => <span className="text-muted-foreground truncate block">{s.suppliesProvided ?? "—"}</span>,
    },
    {
      key: "lastOrder",
      header: "Último pedido",
      className: "w-[16%]",
      render: (s) =>
        s.lastOrder ? (
          <span className="text-muted-foreground">{new Date(s.lastOrder.date).toLocaleDateString("es-AR")}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "estado",
      header: "Estado",
      className: "w-[18%]",
      render: (s) => {
        const estado = getEstado(s);
        const wa = normalizePhoneForWhatsapp(s.phone);
        const waHref = wa ? `https://wa.me/${wa}` : null;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant={estado.variant} className="shrink-0">
              {estado.label}
            </Badge>
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 rounded-md p-1 text-[#25D366] hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Abrir WhatsApp con ${s.name}`}
                title="WhatsApp"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </div>
        );
      },
      sortable: false,
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
    estado: getEstado(s).label,
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
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative sm:max-w-sm w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder=""
                    className="pl-9"
                    aria-label="Buscar"
                  />
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
