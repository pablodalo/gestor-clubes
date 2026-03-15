import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { DevicesTable } from "@/features/devices/devices-table";
import { NoPermissionMessage } from "@/components/no-permission";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function DevicesPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.devices_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dispositivos</h1>
        <NoPermissionMessage message="No tenés permiso para ver dispositivos." />
      </div>
    );
  }

  const canManage = permissions === null || permissions.has(PERMISSION_KEYS.devices_manage);

  const [devices, locations] = await Promise.all([
    prisma.device.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <DevicesTable
        tenantSlug={tenantSlug}
        devices={devices}
        locationOptions={locations}
        canCreate={canManage}
        canManage={canManage}
      />
    </div>
  );
}
