import { getTenantBySlug } from "@/lib/tenant";
import Link from "next/link";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function TenantDashboardPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard — {tenant.name}</h1>
      <p className="text-muted-foreground mt-1">Panel del club. KPIs y reportes próximamente.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href={`/app/${tenantSlug}/members`}>
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:bg-accent/50 transition-colors">
            <h2 className="font-semibold">Socios</h2>
            <p className="text-sm text-muted-foreground">Gestión de socios</p>
          </div>
        </Link>
        <Link href={`/app/${tenantSlug}/locations`}>
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:bg-accent/50 transition-colors">
            <h2 className="font-semibold">Ubicaciones</h2>
            <p className="text-sm text-muted-foreground">Lugares y zonas</p>
          </div>
        </Link>
        <Link href={`/app/${tenantSlug}/lots`}>
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:bg-accent/50 transition-colors">
            <h2 className="font-semibold">Lotes</h2>
            <p className="text-sm text-muted-foreground">Lotes de inventario</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
