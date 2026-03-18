"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";

type Props = {
  rows: Array<{
    id: string;
    controlDateIso: string;
    lotCode: string | null;
    temperature: string | null;
    humidity: string | null;
    ph: string | null;
    ec: string | null;
    pests: string | null;
  }>;
};

export function ControlsTable({ rows }: Props) {
  type Row = (typeof rows)[number];

  const columns: DataTableColumn<Row>[] = [
    {
      key: "controlDateIso",
      header: "Fecha",
      sortable: true,
      sortAccessor: (r) => new Date(r.controlDateIso).getTime(),
      render: (c) => new Date(c.controlDateIso).toLocaleDateString("es-AR"),
    },
    { key: "lotCode", header: "Lote", sortable: true, sortAccessor: (r) => r.lotCode ?? "", render: (c) => c.lotCode ?? "—" },
    { key: "temperature", header: "Temp", sortable: true, sortAccessor: (r) => r.temperature ?? "", render: (c) => c.temperature ?? "—" },
    { key: "humidity", header: "Humedad", sortable: true, sortAccessor: (r) => r.humidity ?? "", render: (c) => c.humidity ?? "—" },
    { key: "ph", header: "pH", sortable: true, sortAccessor: (r) => r.ph ?? "", render: (c) => c.ph ?? "—" },
    { key: "ec", header: "EC", sortable: true, sortAccessor: (r) => r.ec ?? "", render: (c) => c.ec ?? "—" },
    { key: "pests", header: "Plagas", sortable: true, sortAccessor: (r) => r.pests ?? "", render: (c) => c.pests ?? "—" },
  ];

  return <DataTable columns={columns} data={rows} keyExtractor={(c) => c.id} emptyMessage="No hay controles." />;
}

