"use client";

import { useMemo, useState } from "react";
import type { SupplyItem } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplyForm } from "@/features/admin/supply-form";
import { Boxes } from "lucide-react";

type Row = SupplyItem & {
  supplierName?: string | null;
  supplierPhone?: string | null;
  supplierEmail?: string | null;
};

function buildRequestLink(supply: Row) {
  const message = encodeURIComponent(`Hola, necesitamos reponer el suministro "${supply.name}". ¿Podemos coordinar entrega?`);
  if (supply.supplierPhone) {
    const cleanPhone = supply.supplierPhone.replace(/[^\d+]/g, "");
    return `https://wa.me/${cleanPhone}?text=${message}`;
  }
  if (supply.supplierEmail) {
    return `mailto:${supply.supplierEmail}?subject=${encodeURIComponent(`Reposición de ${supply.name}`)}&body=${message}`;
  }
  return null;
}

type Props = {
  supplies: Row[];
  suppliers: { id: string; name: string }[];
  canCreate: boolean;
};

export function SuppliesTable({ supplies, suppliers, canCreate }: Props) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return supplies.filter((s) => {
      const low = Number(s.currentQty) <= Number(s.minQty);
      if (statusFilter === "low" && !low) return false;
      if (statusFilter === "ok" && low) return false;
      if (statusFilter === "missing" && !s.isMissing) return false;
      if (!term) return true;
      const hay = [s.name, s.category ?? "", s.unit ?? "", s.supplierName ?? ""].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [supplies, q, statusFilter]);

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Suministro", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "category", header: "Categoría", render: (s) => <Badge variant="secondary">{s.category ?? "—"}</Badge> },
    {
      key: "currentQty",
      header: "Stock",
      render: (s) => (
        <div className="flex items-center gap-2">
          <span>{s.currentQty.toString()} {s.unit ?? ""}</span>
          {Number(s.currentQty) <= Number(s.minQty) && <Badge variant="secondary">Bajo</Badge>}
        </div>
      ),
    },
    { key: "minQty", header: "Mínimo", render: (s) => `${s.minQty.toString()} ${s.unit ?? ""}` },
    { key: "supplierName", header: "Proveedor", render: (s) => s.supplierName ?? "—" },
    {
      key: "renewalAt",
      header: "Renovación",
      render: (s) => s.renewalAt ? new Date(s.renewalAt).toLocaleDateString("es-AR") : "—",
    },
    {
      key: "status",
      header: "Estado",
      render: (s) => (
        <Badge variant={s.isMissing ? "secondary" : "success"}>
          {s.isMissing ? "Faltante" : "Disponible"}
        </Badge>
      ),
    },
  ];

  const exportData = filtered.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category ?? "",
    unit: s.unit ?? "",
    currentQty: s.currentQty.toString(),
    minQty: s.minQty.toString(),
    supplierName: s.supplierName ?? "",
    renewalAt: s.renewalAt ? new Date(s.renewalAt).toISOString() : "",
    isMissing: s.isMissing ? "Sí" : "No",
  }));

  return (
    <>
      <ListPageLayout
        title="Suministros"
        description="Insumos y consumibles del cultivo."
        actions={
          <>
            <ExportButtons data={exportData} filename="suministros" />
            {canCreate && (
              <Button onClick={() => setOpen(true)}>
                <Boxes className="h-4 w-4 mr-2" />
                Nuevo suministro
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(s) => s.id}
          emptyMessage="No hay suministros."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre, categoría o proveedor…"
                  className="sm:max-w-sm"
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Estado (todos)</option>
                  <option value="low">Bajo stock</option>
                  <option value="ok">Stock OK</option>
                  <option value="missing">Faltantes</option>
                </select>
              </div>
              <span className="text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
            </div>
          }
          rowActions={(supply) => {
            const href = buildRequestLink(supply);
            if (!href) return <span className="text-xs text-muted-foreground">Sin contacto</span>;
            return (
              <Button asChild size="sm" variant="outline">
                <a href={href} target="_blank" rel="noreferrer">Solicitar</a>
              </Button>
            );
          }}
        />
      </ListPageLayout>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo suministro</DialogTitle>
            <DialogDescription>Creá un suministro para control de stock.</DialogDescription>
          </DialogHeader>
          <SupplyForm suppliers={suppliers} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
