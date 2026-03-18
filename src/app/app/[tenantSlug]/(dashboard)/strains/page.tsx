import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { StrainForm } from "@/features/cultivation/strain-form";
import { StrainsTable } from "@/features/cultivation/strains-table";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function StrainsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.strains_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Cepas</h1>
        <NoPermissionMessage message="No tenés permiso para ver cepas." />
      </div>
    );
  }

  const strains = await prisma.plantStrain.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  const strainRows = strains.map((s) => ({
    id: s.id,
    name: s.name,
    genetics: s.genetics ?? null,
    cycleDays: s.cycleDays ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cepas</h1>
        <p className="text-muted-foreground mt-1">Genéticas y ciclos estimados.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StrainsTable rows={strainRows} />
        </div>
        <div>
          <StrainForm />
        </div>
      </div>
    </div>
  );
}
