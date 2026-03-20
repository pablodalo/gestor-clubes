import Link from "next/link";
import { getMemberNotificationsForPortal } from "@/actions/member-notifications";
import { PortalNotificationsList } from "./portal-notifications-list";
import { PollingRefresh } from "./polling-refresh";
import { ChevronLeft } from "lucide-react";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalNotificationsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const { data: notifications } = await getMemberNotificationsForPortal(tenantSlug);

  return (
    <div className="space-y-6">
      <PollingRefresh />
      <div className="flex items-center gap-2">
        <Link
          href={`/portal/socios/${tenantSlug}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Volver"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">Todas tus notificaciones</p>
        </div>
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
          No tenés notificaciones.
        </div>
      ) : (
        <PortalNotificationsList
          tenantSlug={tenantSlug}
          notifications={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            read: n.read,
            createdAt: n.createdAt,
          }))}
        />
      )}
    </div>
  );
}
