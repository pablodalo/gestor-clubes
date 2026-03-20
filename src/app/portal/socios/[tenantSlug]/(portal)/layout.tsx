import { getTenantBySlug } from "@/lib/tenant";
import { getTenantBranding } from "@/lib/branding";
import { notFound } from "next/navigation";
import { PortalAppShell } from "@/components/portal-app-shell";
import { logError } from "@/lib/server-log";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
};

export default async function PortalSociosDashboardLayout({ children, params }: Props) {
  try {
    const { tenantSlug } = await params;
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    const session = await getMemberAndTenantFromSession(tenantSlug);
    if (!session) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <p className="text-muted-foreground text-center">
            <a href={`/portal/socios/${tenantSlug}/login`} className="text-primary hover:underline">
              Iniciar sesión como socio
            </a>
          </p>
        </div>
      );
    }

    const branding = await getTenantBranding(tenantSlug, "slug");

    return (
      <PortalAppShell
        tenant={session.tenant}
        logoUrl={branding.logoUrl}
        appName={branding.appName}
        memberFirstName={session.member.firstName || "Socio"}
      >
        {children}
      </PortalAppShell>
    );
  } catch (err) {
    logError("PortalSociosDashboardLayout", err);
    throw err;
  }
}
