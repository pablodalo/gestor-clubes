import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { PlantForm } from "@/features/cultivation/plant-form";
import { PlantsTable } from "@/features/cultivation/plants-table";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PlantsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.plants_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Plantas</h1>
        <NoPermissionMessage message="No tenés permiso para ver plantas." />
      </div>
    );
  }

  const [plants, strains] = await Promise.all([
    prisma.plant.findMany({
      where: { tenantId: tenant.id },
      include: { strain: true, cultivationLot: true },
      orderBy: { code: "asc" },
    }),
    prisma.plantStrain.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const lots = await prisma.cultivationLot.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, code: true },
    orderBy: { code: "asc" },
  });

  const plantRows = plants.map((p) => ({
    id: p.id,
    code: p.code,
    strainName: p.strain?.name ?? null,
    lotCode: p.cultivationLot?.code ?? null,
    stage: p.stage,
    status: p.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plantas</h1>
        <p className="text-muted-foreground mt-1">Inventario de plantas activas.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlantsTable rows={plantRows} />
        </div>
        <div>
          <PlantForm strains={strains} lots={lots} />
        </div>
      </div>
    </div>
  );
}
