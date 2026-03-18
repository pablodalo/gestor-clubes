"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";

type Props = {
  rows: Array<{
    id: string;
    code: string;
    strainName: string | null;
    lotCode: string | null;
    stage: string;
    status: string;
  }>;
};

export function PlantsTable({ rows }: Props) {
  type Row = (typeof rows)[number];

  const columns: DataTableColumn<Row>[] = [
    { key: "code", header: "Código", sortable: true, sortAccessor: (r) => r.code, render: (p) => <span className="font-medium">{p.code}</span> },
    { key: "strainName", header: "Cepa", sortable: true, sortAccessor: (r) => r.strainName ?? "", render: (p) => p.strainName ?? "—" },
    { key: "lotCode", header: "Lote", sortable: true, sortAccessor: (r) => r.lotCode ?? "", render: (p) => p.lotCode ?? "—" },
    { key: "stage", header: "Etapa", sortable: true, sortAccessor: (r) => r.stage, render: (p) => p.stage },
    { key: "status", header: "Estado", sortable: true, sortAccessor: (r) => r.status, render: (p) => p.status },
  ];

  return <DataTable columns={columns} data={rows} keyExtractor={(p) => p.id} emptyMessage="No hay plantas." />;
}

