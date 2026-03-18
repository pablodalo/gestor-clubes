"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { TicketIcon } from "lucide-react";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";

type Props = {
  rows: Array<{
    id: string;
    subject: string;
    priority: string;
    status: string;
    createdAtIso: string;
  }>;
};

export function PortalTicketsTable({ rows }: Props) {
  type Row = (typeof rows)[number];

  const columns: DataTableColumn<Row>[] = [
    { key: "subject", header: "Asunto", sortable: true, sortAccessor: (r) => r.subject, render: (t) => <span className="font-medium text-foreground">{t.subject}</span> },
    {
      key: "priority",
      header: "Prioridad",
      sortable: true,
      sortAccessor: (r) => r.priority,
      render: (t) => <Badge variant={getStatusVariant(t.priority)}>{getStatusLabel(t.priority) ?? t.priority}</Badge>,
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      sortAccessor: (r) => r.status,
      render: (t) => <Badge variant={getStatusVariant(t.status)}>{getStatusLabel(t.status) ?? t.status}</Badge>,
    },
    {
      key: "createdAtIso",
      header: "Fecha",
      sortable: true,
      sortAccessor: (r) => new Date(r.createdAtIso).getTime(),
      render: (t) => <span className="text-muted-foreground">{new Date(t.createdAtIso).toLocaleDateString("es-AR")}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      keyExtractor={(t) => t.id}
      emptyState={{ icon: TicketIcon, title: "Sin tickets", description: "Contactá al club para crear uno." }}
    />
  );
}

