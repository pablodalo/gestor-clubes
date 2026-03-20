import { getTenantBySlug } from "@/lib/tenant";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { PortalCreateTicketForm } from "@/features/tickets/portal-create-ticket-form";

const formatDate = (value: Date) =>
  new Date(value).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ subject?: string }>;
};

export default async function PortalTicketsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const { subject: subjectParam } = await searchParams;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return null;

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId: tenant.id,
      createdByType: "member",
      createdById: session.member.id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tickets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Consultas y solicitudes al club
        </p>
      </div>

      <PortalCreateTicketForm
        tenantSlug={tenantSlug}
        defaultSubject={subjectParam ?? ""}
      />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Mis tickets
        </h2>
        <ul className="space-y-2">
          {tickets.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
              Aún no creaste ningún ticket.
            </li>
          ) : (
            tickets.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border border-border/40 bg-card/50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">{t.subject}</span>
                  <Badge variant={getStatusVariant(t.status)} className="shrink-0 text-xs">
                    {getStatusLabel(t.status) ?? t.status}
                  </Badge>
                </div>
                {t.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {t.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(t.createdAt)}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
