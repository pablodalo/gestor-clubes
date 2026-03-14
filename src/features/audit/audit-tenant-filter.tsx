"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  tenants: { id: string; name: string }[];
  currentTenantId: string | null;
};

export function AuditTenantFilter({ tenants, currentTenantId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tenantId = e.target.value;
    const page = searchParams.get("page") ?? "1";
    const params = new URLSearchParams();
    if (page !== "1") params.set("page", page);
    if (tenantId) params.set("tenantId", tenantId);
    router.push(`/platform/audit${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form method="get" className="flex items-center gap-2">
      <label htmlFor="audit-tenantId" className="text-sm text-muted-foreground whitespace-nowrap">
        Tenant
      </label>
      <select
        id="audit-tenantId"
        name="tenantId"
        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        value={currentTenantId ?? ""}
        onChange={handleChange}
      >
        <option value="">Todos</option>
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </form>
  );
}
