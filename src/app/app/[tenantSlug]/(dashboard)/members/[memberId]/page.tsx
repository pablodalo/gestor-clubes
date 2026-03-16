import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStatusLabel, getStatusVariant } from "@/lib/status-badges";

type Props = { params: Promise<{ tenantSlug: string; memberId: string }> };

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

export default async function MemberProfilePage({ params }: Props) {
  const { tenantSlug, memberId } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return notFound();

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: tenant.id },
  });
  if (!member) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Ficha de socio</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {member.firstName} {member.lastName}
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/${tenantSlug}/members`}>Volver</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Número de socio</p>
              <p className="font-medium">{member.memberNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <Badge variant={getStatusVariant(member.status)}>
                {getStatusLabel(member.status) ?? member.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{member.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="font-medium">{member.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Documento</p>
              <p className="font-medium">
                {member.documentType ?? "—"} {member.documentNumber ?? ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha de alta</p>
              <p className="font-medium">{formatDate(member.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reprocann</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Estado</p>
              <Badge variant={member.reprocannActive ? "success" : "secondary"}>
                {member.reprocannActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nº Reprocann</p>
              <p className="font-medium">{member.reprocannNumber ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nº de afiliado</p>
              <p className="font-medium">{member.reprocannAffiliateNumber ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inicio</p>
              <p className="font-medium">{formatDate(member.reprocannStartDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vencimiento</p>
              <p className="font-medium">{formatDate(member.reprocannEndDate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
