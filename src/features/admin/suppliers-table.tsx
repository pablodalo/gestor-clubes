"use client";

import type { Supplier } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

type Row = Supplier & {
  suppliesCount?: number;
};

export function SuppliersTable({ suppliers }: { suppliers: Row[] }) {
  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Proveedor", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "suppliesProvided", header: "Suministra", render: (s) => s.suppliesProvided ?? "—" },
    { key: "suppliesCount", header: "Suministros", render: (s) => s.suppliesCount ?? 0, align: "center" },
    { key: "email", header: "Email", render: (s) => s.email ?? "—" },
    { key: "phone", header: "Teléfono", render: (s) => s.phone ?? "—" },
    {
      key: "delivery",
      header: "Entregas",
      render: (s) => (
        <Badge variant={s.pendingDelivery ? "secondary" : "success"}>
          {s.pendingDelivery ? `Pendiente${s.nextDeliveryAt ? ` · ${new Date(s.nextDeliveryAt).toLocaleDateString("es-AR")}` : ""}` : "Al día"}
        </Badge>
      ),
    },
    {
      key: "payments",
      header: "Pagos",
      render: (s) => (
        <Badge variant={s.pendingPayment || s.paymentStatus === "pending" ? "secondary" : "success"}>
          {s.pendingPayment || s.paymentStatus === "pending" ? "Pendiente" : "Al día"}
        </Badge>
      ),
    },
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
