type PlanLike = {
  name?: string | null;
  monthlyLimit?: unknown;
};

type MemberLike = {
  membershipType?: string | null;
  membershipPlan?: string | null;
  membershipPlanRel?: PlanLike | null;
};

/**
 * Formato legible para mostrar el tipo de membresía.
 * Prioridad: plan.name > "X G mes" desde monthlyLimit > membershipType > membershipPlan.
 */
export function getMembershipPlanLabel(member: MemberLike): string {
  const plan = member.membershipPlanRel;
  if (plan?.name?.trim()) return plan.name.trim();
  if (plan?.monthlyLimit != null) {
    const n = Number(String(plan.monthlyLimit));
    if (Number.isFinite(n)) return `${n} G mes`;
  }
  if (member.membershipType?.trim()) return member.membershipType.trim();
  if (member.membershipPlan?.trim()) return member.membershipPlan.trim();
  return "—";
}
