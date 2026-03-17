import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { getPlatformSession } from "@/lib/server-context";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { MemberDetailTabs } from "@/features/members/member-detail-tabs";
import { ImpersonateMemberButton } from "@/features/members/impersonate-member-button";

type Props = {
  params: Promise<{ tenantSlug: string; memberId: string }>;
};

export default async function MemberProfilePage({ params }: Props) {
  const { tenantSlug, memberId } = await params;
  const [tenant, platform] = await Promise.all([getTenantBySlug(tenantSlug), getPlatformSession()]);
  if (!tenant) return notFound();

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: tenant.id },
    include: { account: true, membershipPlanRel: true },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Ficha de socio</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {member.firstName} {member.lastName}
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <ImpersonateMemberButton
            isPlatform={!!platform}
            tenantSlug={tenantSlug}
            memberId={member.id}
          />
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/${tenantSlug}/members`}>Volver al listado</Link>
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Usá las pestañas para ver y gestionar <strong>Datos</strong>, <strong>Membresía</strong>, <strong>Config. operativa</strong>, <strong>Historial</strong>, <strong>Saldo / cupo</strong>, <strong>Notificaciones</strong> y <strong>Cuenta de acceso</strong>. El socio ingresa al portal con su email y contraseña.
      </p>

      <MemberDetailTabs
        tenantSlug={tenantSlug}
        member={member}
        membershipPlan={member.membershipPlanRel ? { name: member.membershipPlanRel.name, tier: member.membershipPlanRel.tier ?? null } : null}
        payments={payments}
        account={member.account}
        notifications={notifications}
        balanceAdjustments={balanceAdjustments}
        auditLogs={auditLogs}
      />
    </div>
  );
}
