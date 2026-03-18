import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { MembershipPlansTable } from "@/features/memberships/membership-plans-table";
import { MembershipPlanSearchForm } from "@/features/memberships/membership-plan-search-form";
import { NoPermissionMessage } from "@/components/no-permission";

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function MembershipsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const { q, status } = await searchParams;
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

  const where: { tenantId: string; status?: string; OR?: Array<Record<string, unknown>> } = {
    tenantId: tenant.id,
  };
  if (status) where.status = status;
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  const plansRaw = await prisma.membershipPlan.findMany({
    where,
    include: { limitRules: true },
  });

  const plans = plansRaw.sort((a, b) => {
    const aSort = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bSort = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (aSort !== bSort) return aSort - bSort;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <MembershipPlanSearchForm tenantSlug={tenantSlug} initialQ={q} initialStatus={status} />
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
