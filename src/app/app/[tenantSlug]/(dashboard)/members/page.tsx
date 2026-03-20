import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { MembersTable } from "@/features/members/members-table";
import { NoPermissionMessage } from "@/components/no-permission";
import { MemberSearchForm } from "@/features/members/member-search-form";

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function MembersPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const { q, status } = await searchParams;
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

  const where: { tenantId: string; status?: string; OR?: Array<Record<string, unknown>> } = {
    tenantId: tenant.id,
  };
  if (status) where.status = status;
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { firstName: { contains: term, mode: "insensitive" } },
      { lastName: { contains: term, mode: "insensitive" } },
      { memberNumber: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { documentNumber: { contains: term, mode: "insensitive" } },
    ];
  }

  const [members, membershipPlans] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 200,
      include: { membershipPlanRel: { select: { name: true } } },
    }),
    prisma.membershipPlan.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <MemberSearchForm tenantSlug={tenantSlug} initialQ={q} initialStatus={status} />
      <MembersTable
        tenantSlug={tenantSlug}
        members={members}
        membershipPlans={membershipPlans}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
