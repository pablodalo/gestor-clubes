import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantBranding } from "@/lib/branding";
import { getTenantUserPermissions } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { logError } from "@/lib/server-log";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantDashboardLayout({ children, params }: Props) {
  try {
    const { tenantSlug } = await params;
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    const session = await getServerSession(authOptions);
    const ctx = (session as unknown as { context?: string })?.context;
    const canAccess =
      ctx === "platform" ||
      (ctx === "tenant" && (session as unknown as { tenantSlug?: string }).tenantSlug === tenantSlug);

    if (!canAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">
            No tenés acceso a este club.{" "}
            <a href={`/app/${tenantSlug}/login`} className="text-primary hover:underline">
              Iniciar sesión
            </a>
          </p>
        </div>
      );
    }

    const [permissions, branding] = await Promise.all([
      getTenantUserPermissions(),
      getTenantBranding(tenantSlug, "slug"),
    ]);
    return (
      <AppShell
        tenant={tenant}
        session={session}
        permissions={permissions}
        navigationLayout={branding.navigationLayout}
        logoUrl={branding.logoUrl}
        appName={branding.appName}
      >
        {children}
      </AppShell>
    );
  } catch (err) {
    logError("TenantDashboardLayout", err);
    throw err;
  }
}
