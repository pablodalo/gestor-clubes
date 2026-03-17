import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ControlForm } from "@/features/cultivation/control-form";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function ControlsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.controls_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Controles</h1>
        <NoPermissionMessage message="No tenés permiso para ver controles." />
      </div>
    );
  }

  const [controls, lots] = await Promise.all([
    prisma.cultivationControl.findMany({
      where: { tenantId: tenant.id },
      include: { cultivationLot: true },
      orderBy: { controlDate: "desc" },
      take: 100,
    }),
    prisma.cultivationLot.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const columns: DataTableColumn<typeof controls[number]>[] = [
    { key: "controlDate", header: "Fecha", render: (c) => new Date(c.controlDate).toLocaleDateString("es-AR") },
    { key: "cultivationLot", header: "Lote", render: (c) => c.cultivationLot?.code ?? "—" },
    { key: "temperature", header: "Temp", render: (c) => c.temperature?.toString?.() ?? "—" },
    { key: "humidity", header: "Humedad", render: (c) => c.humidity?.toString?.() ?? "—" },
    { key: "ph", header: "pH", render: (c) => c.ph?.toString?.() ?? "—" },
    { key: "ec", header: "EC", render: (c) => c.ec?.toString?.() ?? "—" },
    { key: "pests", header: "Plagas", render: (c) => c.pests ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Controles</h1>
        <p className="text-muted-foreground mt-1">Registros de ambiente y sanidad.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable columns={columns} data={controls} keyExtractor={(c) => c.id} emptyMessage="No hay controles." />
        </div>
        <div>
          <ControlForm lots={lots} />
        </div>
      </div>
    </div>
  );
}
