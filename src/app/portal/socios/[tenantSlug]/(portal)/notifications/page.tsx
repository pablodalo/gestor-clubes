import { getMemberNotificationsForPortal } from "@/actions/member-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalNotificationsList } from "./portal-notifications-list";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalNotificationsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const { data: notifications } = await getMemberNotificationsForPortal(tenantSlug);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mis notificaciones</h1>
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {!notifications || notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tenés notificaciones.</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
