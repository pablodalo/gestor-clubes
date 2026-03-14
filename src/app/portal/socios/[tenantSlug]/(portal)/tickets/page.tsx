import { getTenantBySlug } from "@/lib/tenant";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { prisma } from "@/lib/prisma";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { TicketIcon } from "lucide-react";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalSociosTicketsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const sessionData = await getMemberAndTenantFromSession(tenantSlug);
  const member = sessionData?.member;

  const tickets = member
    ? await prisma.ticket.findMany({
        where: {
          tenantId: tenant.id,
          createdByType: "member",
          createdById: member.id,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const columns: DataTableColumn<(typeof tickets)[number]>[] = [
    { key: "subject", header: "Asunto", render: (t) => <span className="font-medium text-foreground">{t.subject}</span> },
    { key: "priority", header: "Prioridad", render: (t) => <Badge variant={getStatusVariant(t.priority)}>{getStatusLabel(t.priority) ?? t.priority}</Badge> },
    { key: "status", header: "Estado", render: (t) => <Badge variant={getStatusVariant(t.status)}>{getStatusLabel(t.status) ?? t.status}</Badge> },
    { key: "createdAt", header: "Fecha", render: (t) => <span className="text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("es-AR")}</span> },
  ];

  const exportData = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  }));

  return (
    <ListPageLayout
      title="Mis tickets"
      description="Consultas y soporte."
      actions={sessionData ? <ExportButtons data={exportData} filename="mis-tickets" /> : undefined}
    >
      {sessionData ? (
        <DataTable
          columns={columns}
          data={tickets}
          keyExtractor={(t) => t.id}
          emptyState={{ icon: TicketIcon, title: "Sin tickets", description: "Contactá al club para crear uno." }}
        />
      ) : (
        <p className="text-muted-foreground text-sm">No se pudieron cargar los tickets.</p>
      )}
    </ListPageLayout>
  );
}
