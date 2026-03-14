import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { MembersTable } from "@/features/members/members-table";
import { NoPermissionMessage } from "@/components/no-permission";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function MembersPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.members_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Socios</h1>
        <NoPermissionMessage message="No tenés permiso para ver el listado de socios." />
      </div>
    );
  }

  const canCreate = permissions === null || permissions.has(PERMISSION_KEYS.members_create);
  const canUpdate = permissions === null || permissions.has(PERMISSION_KEYS.members_update);
  const canDelete = permissions === null || permissions.has(PERMISSION_KEYS.members_delete);

  const members = await prisma.member.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <MembersTable
        tenantSlug={tenantSlug}
        members={members}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
