import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { getStatusLabel, getStatusVariant } from "@/lib/status-badges";
import { Badge } from "@/components/ui/badge";

const formatDate = (value?: Date | null) =>
  value ? new Date(value).toLocaleDateString("es-AR") : "—";

type Props = { params: Promise<{ tenantSlug: string }> };

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export default async function PortalProfilePage({ params }: Props) {
  const { tenantSlug } = await params;
  const session = await getMemberAndTenantFromSession(tenantSlug);
  const member = session?.member;

  if (!member) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No se pudieron cargar los datos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tus datos en {session.tenant.name}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
        <div className="px-4 py-4 space-y-0">
          <Field
            label="Número de socio"
            value={<span className="font-mono font-medium">{member.memberNumber}</span>}
          />
          <Field
            label="Nombre"
            value={`${member.firstName} ${member.lastName}`}
          />
          <Field label="Email" value={member.email ?? "—"} />
          <Field label="Teléfono" value={member.phone ?? "—"} />
          <Field
            label="Estado"
            value={
              <Badge variant={getStatusVariant(member.status)} className="text-xs">
                {getStatusLabel(member.status) ?? member.status}
              </Badge>
            }
          />
          <Field
            label="Documento"
            value={
              [member.documentType, member.documentNumber].filter(Boolean).join(" ") || "—"
            }
          />
          <Field label="Fecha de nacimiento" value={formatDate(member.birthDate)} />
          <Field
            label="Dirección"
            value={
              [member.address, member.city, member.stateOrProvince, member.country]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          <Field
            label="Contacto de emergencia"
            value={
              member.emergencyContactName
                ? `${member.emergencyContactName}${member.emergencyContactPhone ? ` · ${member.emergencyContactPhone}` : ""}`
                : "—"
            }
          />
        </div>
      </div>
    </div>
  );
}
