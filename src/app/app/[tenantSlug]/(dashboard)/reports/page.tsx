import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import Link from "next/link";
import { Users, Package, Layers, Ticket } from "lucide-react";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function ReportsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canReadReports = permissions === null || permissions.has(PERMISSION_KEYS.reports_read);
  if (!canReadReports) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <NoPermissionMessage message="No tenés permiso para ver reportes." />
      </div>
    );
  }

  const cards = [
    {
      title: "Socios",
      description: "Listado y exportación de socios.",
      href: `/app/${tenantSlug}/members`,
      icon: Users,
      permission: PERMISSION_KEYS.members_read,
    },
    {
      title: "Inventario",
      description: "Ítems y stock actual. Exportar datos.",
      href: `/app/${tenantSlug}/inventory`,
      icon: Package,
      permission: PERMISSION_KEYS.inventory_read,
    },
    {
      title: "Lotes",
      description: "Lotes y trazabilidad. Exportar datos.",
      href: `/app/${tenantSlug}/lots`,
      icon: Layers,
      permission: PERMISSION_KEYS.lots_read,
    },
    {
      title: "Tickets",
      description: "Tickets e incidencias. Exportar datos.",
      href: `/app/${tenantSlug}/tickets`,
      icon: Ticket,
      permission: PERMISSION_KEYS.tickets_read,
    },
  ].filter((c) => !c.permission || permissions === null || permissions.has(c.permission));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground mt-1">
          Acceso rápido a listados y exportaciones por área. Cada sección permite exportar a CSV desde su pantalla.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent/50"
            >
              <Icon className="h-8 w-8 text-muted-foreground" />
              <h2 className="font-semibold">{card.title}</h2>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </Link>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        La auditoría detallada de acciones (quién hizo qué y cuándo) está disponible en Platform → Auditoría, filtrable por tenant.
      </p>
    </div>
  );
}
