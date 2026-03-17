import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StrainForm } from "@/features/cultivation/strain-form";

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

  const columns: DataTableColumn<typeof strains[number]>[] = [
    { key: "name", header: "Cepa", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "genetics", header: "Genética", render: (s) => s.genetics ?? "—" },
    { key: "cycleDays", header: "Ciclo (días)", render: (s) => s.cycleDays ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cepas</h1>
        <p className="text-muted-foreground mt-1">Genéticas y ciclos estimados.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} data={strains} keyExtractor={(s) => s.id} emptyMessage="No hay cepas." />
        </div>
        <div>
          <StrainForm />
        </div>
      </div>
    </div>
  );
}
