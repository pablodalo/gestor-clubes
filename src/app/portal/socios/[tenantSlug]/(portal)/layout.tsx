import { getServerSession } from "next-auth";
import { portalAuthOptions } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantBranding } from "@/lib/branding";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { logError } from "@/lib/server-log";
import { getMemberNotificationsForPortal } from "@/actions/member-notifications";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
};

export default async function PortalSociosDashboardLayout({ children, params }: Props) {
  try {
    const { tenantSlug } = await params;
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    const session = await getServerSession(portalAuthOptions);
    const ctx = (session as unknown as { context?: string })?.context;
    const isMember =
      ctx === "member" && (session as unknown as { tenantSlug?: string }).tenantSlug === tenantSlug;

    if (!isMember) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">
            <a href={`/portal/socios/${tenantSlug}/login`} className="text-primary hover:underline">
              Iniciar sesión como socio
            </a>
          </p>
        </div>
      );
    }

    const [branding, { data: notifications }] = await Promise.all([
      getTenantBranding(tenantSlug, "slug"),
      getMemberNotificationsForPortal(tenantSlug),
    ]);
    const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

    return (
      <PortalShell
        tenant={tenant}
        logoUrl={branding.logoUrl}
        appName={branding.appName}
        unreadNotificationsCount={unreadCount}
      >
        {children}
      </PortalShell>
    );
  } catch (err) {
    logError("PortalSociosDashboardLayout", err);
    throw err;
  }
}
