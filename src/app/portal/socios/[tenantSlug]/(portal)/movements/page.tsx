import { getTenantBySlug } from "@/lib/tenant";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalSociosMovementsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const sessionData = await getMemberAndTenantFromSession(tenantSlug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis movimientos</h1>
        <p className="text-muted-foreground mt-1">Historial de movimientos asociados a tu cuenta.</p>
      </div>
      {sessionData ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p>Por el momento no hay movimientos vinculados a tu cuenta de socio.</p>
          <p className="text-sm mt-2">Cuando el club registre movimientos asociados a tu perfil, aparecerán aquí.</p>
        </div>
      ) : (
        <p className="text-muted-foreground">No se pudo cargar la sesión.</p>
      )}
    </div>
  );
}
