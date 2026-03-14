import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { logError } from "@/lib/server-log";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
};

export default async function PortalSociosDashboardLayout({ children, params }: Props) {
  try {
    const { tenantSlug } = await params;
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    const session = await getServerSession(authOptions);
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

    return <PortalShell tenant={tenant}>{children}</PortalShell>;
  } catch (err) {
    logError("PortalSociosDashboardLayout", err);
    throw err;
  }
}
