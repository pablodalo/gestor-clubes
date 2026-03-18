"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

type Props = {
  rows: Array<{
    id: string;
    actorType: string;
    actorName: string | null;
    action: string;
    entityName: string;
    entityId: string | null;
    createdAt: string; // ISO
  }>;
  emptyMessage?: string;
  icon?: LucideIcon;
};

export function AuditTable({
  rows,
  emptyMessage = "Sin registros",
  icon = FileText,
}: Props) {
  type Row = (typeof rows)[number];

  const columns: DataTableColumn<Row>[] = [
    {
      key: "createdAt",
      header: "Fecha",
      sortable: true,
      sortAccessor: (r) => new Date(r.createdAt).getTime(),
      render: (r) => <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString("es-AR")}</span>,
    },
    {
      key: "actor",
      header: "Actor",
      sortable: true,
      sortAccessor: (r) => (r.actorName ?? r.actorType),
      render: (r) => <span className="font-medium text-foreground">{r.actorName ?? r.actorType}</span>,
    },
    { key: "action", header: "Acción", sortable: true, sortAccessor: (r) => r.action, render: (r) => r.action },
    {
      key: "entityName",
      header: "Entidad",
      sortable: true,
      sortAccessor: (r) => r.entityName,
      render: (r) => r.entityName,
    },
    {
      key: "entityId",
      header: "ID entidad",
      sortable: true,
      sortAccessor: (r) => r.entityId ?? "",
      render: (r) => <span className="font-mono text-muted-foreground text-xs">{r.entityId ?? "—"}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      keyExtractor={(r) => r.id}
      emptyState={{ icon, title: emptyMessage, description: "No hay registros de auditoría." }}
    />
  );
}

