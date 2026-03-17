import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { MembershipPlansTable } from "@/features/memberships/membership-plans-table";
import { NoPermissionMessage } from "@/components/no-permission";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function MembershipsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.members_read);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Planes de membresía</h1>
        <NoPermissionMessage message="No tenés permiso para ver los planes de membresía." />
      </div>
    );
  }

  const canCreate = permissions === null || permissions.has(PERMISSION_KEYS.members_create);
  const canUpdate = permissions === null || permissions.has(PERMISSION_KEYS.members_update);
  const canDelete = permissions === null || permissions.has(PERMISSION_KEYS.members_delete);

  const plans = await prisma.membershipPlan.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <MembershipPlansTable
        tenantSlug={tenantSlug}
        plans={plans}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
