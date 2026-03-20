import Link from "next/link";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { getMemberNotificationsForPortal } from "@/actions/member-notifications";
import { getMemberHistoryForPortal } from "@/actions/member-history";
import { getStatusLabel, getStatusVariant } from "@/lib/status-badges";
import { getMembershipPlanLabel } from "@/lib/membership-label";
import { getMembershipBadgeClassName } from "@/lib/membership-badge";
import { Badge } from "@/components/ui/badge";
import {
  FileDown,
  UserPlus,
  MessageSquarePlus,
  Mail,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

const formatDate = (value?: Date | null) =>
  value ? new Date(value).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "—";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalSociosHomePage({ params }: Props) {
  const { tenantSlug } = await params;
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return null;

  const [notifResult, historyResult, memberWithPlan] = await Promise.all([
    getMemberNotificationsForPortal(tenantSlug),
    getMemberHistoryForPortal(tenantSlug),
    prisma.member.findUnique({
      where: { id: session.member.id },
      select: {
        membershipPlanId: true,
        membershipRecurring: true,
        membershipRecurrenceDay: true,
        membershipStartDate: true,
        membershipPlanRel: { select: { monthlyLimit: true } },
      },
    }),
  ]);

  const member = session.member;
  const notifications = notifResult.data ?? [];
  const history = historyResult.data ?? [];
  const lastNotifs = notifications.slice(0, 5);
  const lastHistory = history.slice(0, 8);

  let balanceInfo: { vegetal?: string; extracto?: string } | null = null;
  try {
    const tenantId = session.tenant.id;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const dispensations = await prisma.dispensation.findMany({
      where: {
        tenantId,
        memberId: member.id,
        dispensedAt: { gte: periodStart, lt: periodEnd },
      },
      select: { grams: true },
    });
    const totalConsumed = dispensations.reduce(
      (acc, d) => acc + Number(d.grams?.toString() ?? 0),
      0
    );
    const plan = memberWithPlan?.membershipPlanRel;
    const monthlyLimit = plan?.monthlyLimit;
    if (monthlyLimit != null) {
      const limitNum = Number(String(monthlyLimit));
      if (Number.isFinite(limitNum)) {
        const remaining = Math.max(0, limitNum - totalConsumed);
        balanceInfo = { vegetal: remaining.toFixed(1), extracto: "—" };
      }
    }
  } catch {
    // omit balance on error
  }

  const actions = [
    {
      href: `/portal/socios/${tenantSlug}/tickets?subject=Solicitud+de+retiro`,
      label: "Solicitar retiro",
      icon: FileDown,
    },
    {
      href: `/portal/socios/${tenantSlug}/tickets?subject=Ampliar+membresía`,
      label: "Ampliar membresía",
      icon: UserPlus,
    },
    {
      href: `/portal/socios/${tenantSlug}/tickets`,
      label: "Crear ticket",
      icon: MessageSquarePlus,
    },
    {
      href: `/portal/socios/${tenantSlug}/tickets?subject=Contacto+con+el+club`,
      label: "Contactar club",
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Estado del socio — bloque único */}
      <section className="rounded-2xl border border-border/60 bg-card/50 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={getStatusVariant(member.status)} className="text-xs font-medium">
            {getStatusLabel(member.status) ?? member.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Membresía:{" "}
            <Badge
              variant="outline"
              className={getMembershipBadgeClassName(
                member.membershipStatus === "pending" ? "Pendiente" : getMembershipPlanLabel(member)
              )}
            >
              {member.membershipStatus === "pending"
                ? "Pendiente"
                : getMembershipPlanLabel(member)}
            </Badge>
          </span>
          {balanceInfo?.vegetal != null && (
            <span className="text-sm text-muted-foreground">
              Saldo: <span className="font-medium text-foreground">{balanceInfo.vegetal}g</span>
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            Nº <span className="font-mono font-medium text-foreground">{member.memberNumber}</span>
          </span>
        </div>
      </section>

      {/* Acciones principales — grid 2x2 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Acciones
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-5 text-center shadow-sm transition-colors hover:bg-muted/50 hover:border-primary/20 active:scale-[0.98] min-h-[100px]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-foreground leading-tight">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Actividad reciente */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Actividad reciente
          </h2>
          <Link
            href={`/portal/socios/${tenantSlug}/movements`}
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            Ver todo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="space-y-2">
          {lastHistory.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
              No hay actividad reciente.
            </li>
          ) : (
            lastHistory.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/30 px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-foreground truncate">{log.action}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Notificaciones */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Notificaciones
          </h2>
          <Link
            href={`/portal/socios/${tenantSlug}/notifications`}
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            Ver todo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="space-y-2">
          {lastNotifs.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
              No tenés notificaciones nuevas.
            </li>
          ) : (
            lastNotifs.map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border px-3 py-2.5 text-sm ${
                  n.read
                    ? "border-border/40 bg-card/30"
                    : "border-l-4 border-l-primary bg-primary/5 border border-primary/20"
                }`}
              >
                <p className={n.read ? "font-medium" : "font-semibold"}>{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>}
                <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
