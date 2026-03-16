"use client";

import type { SupplyItem } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

type Row = SupplyItem & { supplierName?: string | null };

export function SuppliesTable({ supplies }: { supplies: Row[] }) {
  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Suministro", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "category", header: "Categoría", render: (s) => <Badge variant="secondary">{s.category ?? "—"}</Badge> },
    { key: "currentQty", header: "Stock", render: (s) => `${s.currentQty.toString()} ${s.unit ?? ""}` },
    { key: "minQty", header: "Mínimo", render: (s) => `${s.minQty.toString()} ${s.unit ?? ""}` },
    { key: "supplierName", header: "Proveedor", render: (s) => s.supplierName ?? "—" },
  ];

  return (
    <DataTable
      columns={columns}
      data={supplies}
      keyExtractor={(s) => s.id}
      emptyMessage="No hay suministros."
    />
  );
}
