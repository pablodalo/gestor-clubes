import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { DispensationForm } from "@/features/inventory/dispensation-form";
import { DispensationsTable } from "@/features/inventory/dispensations-table";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function DispensationsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.dispensations_read);
  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.dispensations_manage);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dispensaciones</h1>
        <NoPermissionMessage message="No tenés permiso para ver dispensaciones." />
      </div>
    );
  }

  const [members, strains, dispensations] = await Promise.all([
    prisma.member.findMany({
      where: { tenantId: tenant.id, status: "active" },
      select: { id: true, firstName: true, lastName: true, memberNumber: true },
    }),
    prisma.plantStrain.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.dispensation.findMany({
      where: { tenantId: tenant.id },
      include: { member: true, strain: true },
      orderBy: { dispensedAt: "desc" },
      take: 50,
    }),
  ]);

  const rows = dispensations.map((d) => ({
    ...d,
    memberName: `${d.member.firstName} ${d.member.lastName}`,
    memberNumber: d.member.memberNumber,
    strainName: d.strain.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispensaciones</h1>
        <p className="text-muted-foreground mt-1">Registro de entrega a socios.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DispensationsTable rows={rows} />
        </div>
        {canManage && (
          <div>
            <DispensationForm
              members={members.map((m) => ({
                id: m.id,
                label: `${m.memberNumber} · ${m.firstName} ${m.lastName}`,
              }))}
              strains={strains.map((s) => ({ id: s.id, label: s.name }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
