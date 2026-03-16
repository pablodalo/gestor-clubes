"use client";

import type { SupplyItem } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export function SuppliesTable({ supplies }: { supplies: Row[] }) {
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

  return (
    <DataTable
      columns={columns}
      data={supplies}
      keyExtractor={(s) => s.id}
      emptyMessage="No hay suministros."
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
  );
}
