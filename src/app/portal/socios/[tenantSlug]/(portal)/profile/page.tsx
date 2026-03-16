import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { getStatusLabel, getStatusVariant } from "@/lib/status-badges";
import { Badge } from "@/components/ui/badge";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalSociosProfilePage({ params }: Props) {
  const { tenantSlug } = await params;
  const sessionData = await getMemberAndTenantFromSession(tenantSlug);
  const member = sessionData?.member;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      {member ? (
        <div className="rounded-lg border bg-card p-6 max-w-xl space-y-6">
          <dl className="grid gap-3 sm:grid-cols-2">
            <dt className="text-muted-foreground">Número de socio</dt>
            <dd className="font-mono">{member.memberNumber}</dd>
            <dt className="text-muted-foreground">Nombre</dt>
            <dd>{member.firstName} {member.lastName}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{member.email ?? "—"}</dd>
            <dt className="text-muted-foreground">Teléfono</dt>
            <dd>{member.phone ?? "—"}</dd>
            <dt className="text-muted-foreground">Estado</dt>
            <dd>
              <Badge variant={getStatusVariant(member.status)}>
                {getStatusLabel(member.status) ?? member.status}
              </Badge>
            </dd>
            <dt className="text-muted-foreground">Documento</dt>
            <dd>{member.documentType ?? ""} {member.documentNumber ?? "—"}</dd>
            <dt className="text-muted-foreground">Fecha de nacimiento</dt>
            <dd>{formatDate(member.birthDate)}</dd>
            <dt className="text-muted-foreground sm:col-span-2">Dirección</dt>
            <dd className="sm:col-span-2">
              {[member.address, member.city, member.stateOrProvince, member.country].filter(Boolean).join(", ") || "—"}
            </dd>
            <dt className="text-muted-foreground">Contacto de emergencia</dt>
            <dd>{member.emergencyContactName ?? "—"} {member.emergencyContactPhone ? `· ${member.emergencyContactPhone}` : ""}</dd>
          </dl>
        </div>
      ) : (
        <p className="text-muted-foreground">No se pudieron cargar los datos del socio.</p>
      )}
    </div>
  );
}
