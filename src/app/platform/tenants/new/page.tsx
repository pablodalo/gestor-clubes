import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform-shell";
import { TenantForm } from "@/features/tenants/tenant-form";

export default async function NewTenantPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/");

  return (
    <PlatformShell>
      <div className="p-6 max-w-xl">
        <h1 className="text-2xl font-bold">Nuevo tenant</h1>
        <p className="text-muted-foreground mt-1">Crear un nuevo club (tenant).</p>
        <TenantForm />
      </div>
    </PlatformShell>
  );
}
