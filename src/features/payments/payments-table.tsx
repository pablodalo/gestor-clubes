"use client";

import type { MembershipPayment } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

type Row = MembershipPayment & {
  memberName: string;
  memberNumber: string;
};

type Props = {
  payments: Row[];
};

export function PaymentsTable({ payments }: Props) {
  const columns: DataTableColumn<Row>[] = [
    { key: "paidAt", header: "Fecha", render: (p) => new Date(p.paidAt).toLocaleDateString("es-AR") },
    { key: "memberNumber", header: "Socio", render: (p) => `${p.memberNumber} · ${p.memberName}` },
    { key: "amount", header: "Monto", render: (p) => `${p.amount.toString()} ${p.currency}` },
    { key: "method", header: "Método", render: (p) => <Badge variant="secondary">{p.method ?? "—"}</Badge> },
    { key: "reference", header: "Referencia", render: (p) => p.reference ?? "—" },
  ];

  return (
    <DataTable
      columns={columns}
      data={payments}
      keyExtractor={(p) => p.id}
      emptyMessage="No hay pagos registrados."
    />
  );
}
