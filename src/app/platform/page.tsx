import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlatformShell } from "@/components/platform-shell";

export default async function PlatformPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    redirect("/?error=session");
  }
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/");

  return (
    <PlatformShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bienvenido al panel de superadmin.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/platform/tenants">
            <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all hover:bg-primary/5">
              <h2 className="font-semibold">Tenants</h2>
              <p className="text-sm text-muted-foreground mt-1">Gestionar clubes (tenants)</p>
            </div>
          </Link>
          <div className="rounded-lg border bg-card p-6 shadow-sm opacity-75">
            <h2 className="font-semibold">Usuarios de plataforma</h2>
            <p className="text-sm text-muted-foreground mt-1">Próximamente</p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm opacity-75">
            <h2 className="font-semibold">Auditoría</h2>
            <p className="text-sm text-muted-foreground mt-1">Próximamente</p>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
