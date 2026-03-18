"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";

type Props = {
  rows: Array<{
    id: string;
    name: string;
    genetics: string | null;
    cycleDays: number | null;
  }>;
};

export function StrainsTable({ rows }: Props) {
  type Row = (typeof rows)[number];

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Cepa", sortable: true, sortAccessor: (r) => r.name, render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "genetics", header: "Genética", sortable: true, sortAccessor: (r) => r.genetics ?? "", render: (s) => s.genetics ?? "—" },
    {
      key: "cycleDays",
      header: "Ciclo (días)",
      sortable: true,
      sortAccessor: (r) => r.cycleDays ?? 0,
      render: (s) => (s.cycleDays != null ? String(s.cycleDays) : "—"),
    },
  ];

  return <DataTable columns={columns} data={rows} keyExtractor={(s) => s.id} emptyMessage="No hay cepas." />;
}

