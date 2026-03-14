import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform-shell";
import { getTenantsList } from "@/actions/tenants";
import { TenantsTable } from "@/features/tenants/tenants-table";
import { logError } from "@/lib/server-log";

export default async function TenantsListPage() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/");
    const ctx = (session as unknown as { context?: string }).context;
    if (ctx !== "platform") redirect("/");

    const tenants = await getTenantsList();
    const rows = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt,
    }));

    return (
      <PlatformShell>
        <TenantsTable tenants={rows} />
      </PlatformShell>
    );
  } catch (err) {
    logError("PlatformTenantsPage", err, "/platform/tenants");
    throw err;
  }
}
