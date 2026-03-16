"use client";

import type { SalesOrder } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

type Row = SalesOrder & {
  memberName: string;
  memberNumber: string;
};

export function SalesTable({ sales }: { sales: Row[] }) {
  const columns: DataTableColumn<Row>[] = [
    { key: "createdAt", header: "Fecha", render: (o) => new Date(o.createdAt).toLocaleDateString("es-AR") },
    { key: "memberNumber", header: "Socio", render: (o) => `${o.memberNumber} · ${o.memberName}` },
    { key: "totalAmount", header: "Total", render: (o) => `${o.totalAmount.toString()} ${o.currency}` },
    { key: "status", header: "Estado", render: (o) => <Badge variant="secondary">{o.status}</Badge> },
  ];

  return (
    <DataTable
      columns={columns}
      data={sales}
      keyExtractor={(o) => o.id}
      emptyMessage="No hay ventas registradas."
    />
  );
}
