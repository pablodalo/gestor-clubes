import { getTenantBySlug } from "@/lib/tenant";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { TicketIcon } from "lucide-react";
import { PortalTicketsTable } from "@/features/tickets/portal-tickets-table";

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

  const exportData = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  }));

  const ticketRows = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    priority: t.priority,
    status: t.status,
    createdAtIso: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
  }));

  return (
    <ListPageLayout
      title="Mis tickets"
      description="Consultas y soporte."
      actions={sessionData ? <ExportButtons data={exportData} filename="mis-tickets" /> : undefined}
    >
      {sessionData ? (
        <PortalTicketsTable rows={ticketRows} />
      ) : (
        <p className="text-muted-foreground text-sm">No se pudieron cargar los tickets.</p>
      )}
    </ListPageLayout>
  );
}
