import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { getTenantBySlug } from "@/lib/tenant";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalSociosProfilePage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const sessionData = await getMemberAndTenantFromSession(tenantSlug);
  const member = sessionData?.member;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      {member ? (
        <div className="rounded-lg border bg-card p-6 max-w-xl">
          <dl className="grid gap-3 sm:grid-cols-2">
            <dt className="text-muted-foreground">Número de socio</dt>
            <dd className="font-mono">{member.memberNumber}</dd>
            <dt className="text-muted-foreground">Nombre</dt>
            <dd>{member.firstName} {member.lastName}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{member.email ?? "—"}</dd>
            <dt className="text-muted-foreground">Estado</dt>
            <dd>{member.status}</dd>
          </dl>
        </div>
      ) : (
        <p className="text-muted-foreground">No se pudieron cargar los datos del socio.</p>
      )}
    </div>
  );
}
