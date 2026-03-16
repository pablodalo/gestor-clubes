import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantUserPermissions } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { NoPermissionMessage } from "@/components/no-permission";
import { PaymentsTable } from "@/features/payments/payments-table";
import { PaymentForm } from "@/features/payments/payment-form";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PaymentsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const permissions = await getTenantUserPermissions();
  const canRead = permissions === null || permissions.has(PERMISSION_KEYS.payments_read);
  const canCreate = permissions === null || permissions.has(PERMISSION_KEYS.payments_create);
  if (!canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        <NoPermissionMessage message="No tenés permiso para ver pagos." />
      </div>
    );
  }

  const [members, payments] = await Promise.all([
    prisma.member.findMany({
      where: { tenantId: tenant.id, status: "active" },
      select: { id: true, firstName: true, lastName: true, memberNumber: true, membershipCurrency: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.membershipPayment.findMany({
      where: { tenantId: tenant.id },
      include: { member: true },
      orderBy: { paidAt: "desc" },
      take: 50,
    }),
  ]);

  const currency = members.find((m) => m.membershipCurrency)?.membershipCurrency ?? "ARS";

  const rows = payments.map((p) => ({
    ...p,
    memberName: `${p.member.firstName} ${p.member.lastName}`,
    memberNumber: p.member.memberNumber,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        <p className="text-muted-foreground mt-1">Registro y control de pagos de membresías.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PaymentsTable payments={rows} />
        </div>
        {canCreate && (
          <div>
            <PaymentForm
              members={members.map((m) => ({
                id: m.id,
                name: `${m.firstName} ${m.lastName}`,
                memberNumber: m.memberNumber,
              }))}
              currency={currency}
              onSuccess={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
