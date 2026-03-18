import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { getPlatformSession } from "@/lib/server-context";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { MemberDetailTabs } from "@/features/members/member-detail-tabs";
import { ImpersonateMemberButton } from "@/features/members/impersonate-member-button";
import { Prisma } from "@prisma/client";

type Props = {
  params: Promise<{ tenantSlug: string; memberId: string }>;
};

export default async function MemberProfilePage({ params }: Props) {
  const { tenantSlug, memberId } = await params;
  const [tenant, platform, permissions] = await Promise.all([
    getTenantBySlug(tenantSlug),
    getPlatformSession(),
    getTenantUserPermissions(),
  ]);
  if (!tenant) return notFound();
  const canDeleteMovement = permissions === null || permissions.has(PERMISSION_KEYS.members_update);

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

  const canonicalCategory = (
    cat: string | null | undefined,
  ): "plant_material" | "extract" | null => {
    if (!cat) return null;
    if (cat === "plant_material" || cat === "flores") return "plant_material";
    if (cat === "extract" || cat === "extractos") return "extract";
    return null;
  };

  const now = new Date();
  const resolveMembershipPeriod = (member: {
    membershipRecurring: boolean;
    membershipRecurrenceDay: number | null;
    membershipStartDate: Date | null;
  }) => {
    if (member.membershipRecurring && member.membershipRecurrenceDay) {
      const day = member.membershipRecurrenceDay;
      let start = new Date(now.getFullYear(), now.getMonth(), day, 0, 0, 0, 0);
      if (now < start) {
        start = new Date(now.getFullYear(), now.getMonth() - 1, day, 0, 0, 0, 0);
      }
      const end = new Date(start.getFullYear(), start.getMonth() + 1, day, 0, 0, 0, 0);
      return { start, end };
    }

    let start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    if (member.membershipStartDate && member.membershipStartDate > start) {
      start = new Date(member.membershipStartDate);
    }
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end };
  };

  const dayBounds = () => {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    return { dayStart, dayEnd };
  };

  const { start: periodStart, end: periodEnd } = resolveMembershipPeriod({
    membershipRecurring: member.membershipRecurring,
    membershipRecurrenceDay: member.membershipRecurrenceDay ?? null,
    membershipStartDate: member.membershipStartDate ?? null,
  });
  const { dayStart, dayEnd } = dayBounds();

  const [limitRules, dispensationsInPeriod] = await Promise.all([
    prisma.membershipLimitRule.findMany({
      where: {
        tenantId: tenant.id,
        membershipPlanId: member.membershipPlanId ?? undefined,
        active: true,
      },
    }),
    prisma.dispensation.findMany({
      where: {
        tenantId: tenant.id,
        memberId: member.id,
        dispensedAt: { gte: periodStart, lt: periodEnd },
      },
      select: {
        grams: true,
        dispensedAt: true,
        product: { select: { category: true } },
      },
    }),
  ]);

  const consumedMonthly: Record<"plant_material" | "extract", Prisma.Decimal> = {
    plant_material: new Prisma.Decimal(0),
    extract: new Prisma.Decimal(0),
  };
  const consumedDaily: Record<"plant_material" | "extract", Prisma.Decimal> = {
    plant_material: new Prisma.Decimal(0),
    extract: new Prisma.Decimal(0),
  };

  for (const d of dispensationsInPeriod) {
    const canon = canonicalCategory(d.product?.category ?? undefined);
    if (!canon) continue;
    consumedMonthly[canon] = consumedMonthly[canon].add(d.grams);
    if (d.dispensedAt >= dayStart && d.dispensedAt < dayEnd) {
      consumedDaily[canon] = consumedDaily[canon].add(d.grams);
    }
  }

  const plan = member.membershipPlanRel as any;
  const usageByCategory = {
    plant_material: (() => {
      const rule = limitRules.find((r) => r.category === "plant_material" && r.active);
      const monthlyLimitDec = rule?.monthlyLimit ?? plan?.monthlyLimit ?? null;
      const dailyLimitDec = rule?.dailyLimit ?? plan?.dailyLimit ?? null;
      const monthlyLimit = monthlyLimitDec != null ? Number(monthlyLimitDec.toString()) : null;
      const dailyLimit = dailyLimitDec != null ? Number(dailyLimitDec.toString()) : null;
      const consumedMonthlyNum = Number(consumedMonthly.plant_material.toString());
      const consumedDailyNum = Number(consumedDaily.plant_material.toString());
      return {
        monthlyLimit,
        dailyLimit,
        consumedMonthly: consumedMonthlyNum,
        consumedDaily: consumedDailyNum,
        remainingMonthly: monthlyLimit != null ? monthlyLimit - consumedMonthlyNum : null,
      };
    })(),
    extract: (() => {
      const rule = limitRules.find((r) => r.category === "extract" && r.active);
      const monthlyLimitDec = rule?.monthlyLimit ?? plan?.monthlyLimit ?? null;
      const dailyLimitDec = rule?.dailyLimit ?? plan?.dailyLimit ?? null;
      const monthlyLimit = monthlyLimitDec != null ? Number(monthlyLimitDec.toString()) : null;
      const dailyLimit = dailyLimitDec != null ? Number(dailyLimitDec.toString()) : null;
      const consumedMonthlyNum = Number(consumedMonthly.extract.toString());
      const consumedDailyNum = Number(consumedDaily.extract.toString());
      return {
        monthlyLimit,
        dailyLimit,
        consumedMonthly: consumedMonthlyNum,
        consumedDaily: consumedDailyNum,
        remainingMonthly: monthlyLimit != null ? monthlyLimit - consumedMonthlyNum : null,
      };
    })(),
  };

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
        Usá las pestañas para ver y gestionar <strong>Datos</strong>, <strong>Membresía</strong>, <strong>Cupo y permisos</strong>, <strong>Historial</strong>, <strong>Notificaciones</strong> y <strong>Cuenta de acceso</strong>. El socio ingresa al portal con su email y contraseña.
      </p>

      <MemberDetailTabs
        tenantSlug={tenantSlug}
        member={member}
        canDeleteMovement={canDeleteMovement}
        usageByCategory={usageByCategory}
        membershipPlan={
          member.membershipPlanRel
            ? {
                name: member.membershipPlanRel.name,
                tier: member.membershipPlanRel.tier ?? null,
                price: (member.membershipPlanRel as any).price ?? null,
                currency: member.membershipPlanRel.currency,
                monthlyLimit: (member.membershipPlanRel as any).monthlyLimit ?? null,
                dailyLimit: (member.membershipPlanRel as any).dailyLimit ?? null,
              }
            : null
        }
        payments={payments}
        account={member.account}
        notifications={notifications}
        balanceAdjustments={balanceAdjustments}
        auditLogs={auditLogs}
      />
    </div>
  );
}
