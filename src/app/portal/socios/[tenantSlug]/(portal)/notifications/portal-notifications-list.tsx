"use client";

import { useRouter } from "next/navigation";
import { markMemberNotificationRead } from "@/actions/member-notifications";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type Notif = { id: string; title: string; body: string | null; read: boolean; createdAt: Date };

type Props = { tenantSlug: string; notifications: Notif[] };

export function PortalNotificationsList({ tenantSlug, notifications }: Props) {
  const router = useRouter();

  async function handleMarkRead(id: string) {
    await markMemberNotificationRead(id, tenantSlug);
    router.refresh();
  }

  return (
    <ul className="space-y-2">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`flex justify-between items-start gap-4 rounded-xl border p-4 ${
            n.read
              ? "bg-card/50 border-border/40"
              : "border-l-4 border-l-primary bg-primary/5 border border-primary/20"
          }`}
        >
          <div className="min-w-0">
            <p className={n.read ? "font-medium" : "font-semibold text-foreground"}>{n.title}</p>
            {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
            <p className="text-xs text-muted-foreground mt-2">{formatDate(n.createdAt)}</p>
          </div>
          {!n.read && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleMarkRead(n.id)}
              className="shrink-0"
            >
              <Check className="h-4 w-4 mr-1" />
              Marcar leída
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
