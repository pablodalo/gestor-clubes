import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { ControlForm } from "@/features/cultivation/control-form";
import { ControlsTable } from "@/features/cultivation/controls-table";

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

  const controlRows = controls.map((c) => ({
    id: c.id,
    controlDateIso: c.controlDate instanceof Date ? c.controlDate.toISOString() : String(c.controlDate),
    lotCode: c.cultivationLot?.code ?? null,
    temperature: c.temperature != null ? String(c.temperature) : null,
    humidity: c.humidity != null ? String(c.humidity) : null,
    ph: c.ph != null ? String(c.ph) : null,
    ec: c.ec != null ? String(c.ec) : null,
    pests: c.pests ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Controles</h1>
        <p className="text-muted-foreground mt-1">Registros de ambiente y sanidad.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ControlsTable rows={controlRows} />
        </div>
        <div>
          <ControlForm lots={lots} />
        </div>
      </div>
    </div>
  );
}
