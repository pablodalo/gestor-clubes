"use client";

import type { Dispensation } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";

type Row = Dispensation & {
  memberName: string;
  memberNumber: string;
  strainName: string;
};

export function DispensationsTable({ rows }: { rows: Row[] }) {
  const columns: DataTableColumn<Row>[] = [
    { key: "dispensedAt", header: "Fecha", render: (d) => new Date(d.dispensedAt).toLocaleDateString("es-AR") },
    { key: "memberNumber", header: "Socio", render: (d) => `${d.memberNumber} · ${d.memberName}` },
    { key: "strainName", header: "Cepa", render: (d) => d.strainName },
    { key: "category", header: "Tipo", render: (d) => d.category },
    { key: "grams", header: "Gramos", render: (d) => d.grams.toString() },
  ];

  return (
    <DataTable columns={columns} data={rows} keyExtractor={(d) => d.id} emptyMessage="Sin dispensaciones." />
  );
}
