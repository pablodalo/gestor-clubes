"use client";

import type { Supplier } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const columns: DataTableColumn<Supplier>[] = [
    { key: "name", header: "Proveedor", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "email", header: "Email", render: (s) => s.email ?? "—" },
    { key: "phone", header: "Teléfono", render: (s) => s.phone ?? "—" },
    { key: "status", header: "Estado", render: (s) => s.status },
  ];

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      keyExtractor={(s) => s.id}
      emptyMessage="No hay proveedores."
    />
  );
}
