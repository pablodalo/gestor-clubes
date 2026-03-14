import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/features/users/users-table";
import { NoPermissionMessage } from "@/components/no-permission";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function UsersPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.users_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <NoPermissionMessage message="No tenés permiso para ver el listado de usuarios." />
      </div>
    );
  }

  const canCreate = permissions === null || permissions.has(PERMISSION_KEYS.users_create);
  const canUpdate = permissions === null || permissions.has(PERMISSION_KEYS.users_update);
  const canDelete = permissions === null || permissions.has(PERMISSION_KEYS.users_delete);

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: tenant.id },
      include: { role: true },
      orderBy: { name: "asc" },
    }),
    prisma.role.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <UsersTable
        tenantSlug={tenantSlug}
        users={users}
        roles={roles}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
