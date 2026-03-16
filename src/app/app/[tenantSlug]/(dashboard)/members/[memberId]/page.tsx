import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { MemberDetailTabs } from "@/features/members/member-detail-tabs";

type Props = {
  params: Promise<{ tenantSlug: string; memberId: string }>;
};

export default async function MemberProfilePage({ params }: Props) {
  const { tenantSlug, memberId } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return notFound();

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: tenant.id },
    include: { account: true },
  });
  if (!member) return notFound();

  const [payments, notifications, balanceAdjustments, auditLogs] = await Promise.all([
    prisma.membershipPayment.findMany({
      where: { tenantId: tenant.id, memberId: member.id },
      orderBy: { paidAt: "desc" },
      take: 20,
    }),
    prisma.notification.findMany({
      where: { tenantId: tenant.id, memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.memberBalanceAdjustment.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { entityName: "Member", entityId: memberId },
          { entityName: "MemberAccount", entityId: memberId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Ficha de socio</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {member.firstName} {member.lastName}
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/${tenantSlug}/members`}>Volver</Link>
        </Button>
      </div>

      <MemberDetailTabs
        tenantSlug={tenantSlug}
        member={member}
        payments={payments}
        account={member.account}
        notifications={notifications}
        balanceAdjustments={balanceAdjustments}
        auditLogs={auditLogs}
      />
    </div>
  );
}
