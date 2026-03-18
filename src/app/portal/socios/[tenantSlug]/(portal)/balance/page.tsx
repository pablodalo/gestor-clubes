import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { getMemberBalanceAdjustmentsForPortal } from "@/actions/member-balance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalBalancePage({ params }: Props) {
  const { tenantSlug } = await params;
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return null;

  const m = session.member;

  const tenantId = session.tenant.id;

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
    membershipRecurring: m.membershipRecurring,
    membershipRecurrenceDay: m.membershipRecurrenceDay ?? null,
    membershipStartDate: m.membershipStartDate ?? null,
  });

  const { dayStart, dayEnd } = dayBounds();

  const plan = (m as any).membershipPlanRel;

  const [limitRules, dispensationsInPeriod, adjustmentsResult] = await Promise.all([
    prisma.membershipLimitRule.findMany({
      where: {
        tenantId,
        membershipPlanId: m.membershipPlanId ?? undefined,
        active: true,
      },
    }),
    prisma.dispensation.findMany({
      where: {
        tenantId,
        memberId: m.id,
        dispensedAt: { gte: periodStart, lt: periodEnd },
      },
      select: {
        grams: true,
        dispensedAt: true,
        product: { select: { category: true } },
      },
    }),
    getMemberBalanceAdjustmentsForPortal(tenantSlug),
  ]);

  const adjustments = adjustmentsResult.data ?? [];
  const list = adjustments ?? [];

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

  const usageByCategory = (cat: "plant_material" | "extract") => {
    const rule = limitRules.find((r) => r.category === cat && r.active);
    const monthlyLimit = (rule?.monthlyLimit ?? plan?.monthlyLimit ?? null) as Prisma.Decimal | null;
    const dailyLimit = (rule?.dailyLimit ?? plan?.dailyLimit ?? null) as Prisma.Decimal | null;
    const remainingMonthly =
      monthlyLimit != null ? monthlyLimit.minus(consumedMonthly[cat]) : null;

    return {
      monthlyLimit,
      dailyLimit,
      remainingMonthly,
      consumedMonthly: consumedMonthly[cat],
      consumedDaily: consumedDaily[cat],
    };
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi saldo / cupo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad actual</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { cat: "plant_material" as const, title: "Materia vegetal" },
              { cat: "extract" as const, title: "Extracto" },
            ] as const
          ).map(({ cat, title }) => {
            const u = usageByCategory(cat);
            return (
              <div key={cat} className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">{title} · Límite mensual</p>
                  <p className="text-xl font-semibold">{u.monthlyLimit?.toString() ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{title} · Saldo restante</p>
                  <p className="text-xl font-semibold">{u.remainingMonthly?.toString() ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{title} · Consumido período</p>
                  <p className="text-xl font-semibold">{u.consumedMonthly?.toString() ?? "0"}</p>
                </div>
                {u.dailyLimit != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">{title} · Límite diario</p>
                    <p className="text-xl font-semibold">{u.dailyLimit.toString()}</p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Últimos movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay movimientos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {list.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span>{formatDate(a.createdAt)} · {a.type}</span>
                  <span>{a.amount.toString()} {a.note ? `· ${a.note}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
