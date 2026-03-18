"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";

type Props = {
  rows: Array<{
    id: string;
    name: string;
    currentQty: string;
    minQty: string;
    unit?: string | null;
  }>;
};

export function StockTable({ rows }: Props) {
  type Row = (typeof rows)[number];

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Suministro", sortable: true, sortAccessor: (r) => r.name, render: (s) => <span className="font-medium">{s.name}</span> },
    {
      key: "currentQty",
      header: "Stock",
      sortable: true,
      sortAccessor: (r) => Number(r.currentQty),
      render: (s) => `${s.currentQty} ${s.unit ?? ""}`.trim(),
    },
    {
      key: "minQty",
      header: "Mínimo",
      sortable: true,
      sortAccessor: (r) => Number(r.minQty),
      render: (s) => `${s.minQty} ${s.unit ?? ""}`.trim(),
    },
  ];

  return <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} emptyMessage="No hay stock." />;
}

