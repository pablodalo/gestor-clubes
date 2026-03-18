import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { getTenantBranding } from "@/lib/branding";
import { getTenantUserPermissions } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { logError } from "@/lib/server-log";
import { prisma } from "@/lib/prisma";

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

    const tenantHealth =
      ctx === "platform"
        ? await (async () => {
            const hasDbUrl = !!(process.env.DATABASE_URL || process.env.dbgc_DATABASE_URL);
            const hasAuthUrl = !!(process.env.NEXTAUTH_URL || process.env.dbgc_NEXTAUTH_URL);
            const hasAuthSecret = !!(process.env.NEXTAUTH_SECRET || process.env.dbgc_NEXTAUTH_SECRET);

            const envOk = hasDbUrl && hasAuthUrl && hasAuthSecret;
            const env = {
              DATABASE_URL: hasDbUrl ? "set" : "missing",
              NEXTAUTH_URL: hasAuthUrl ? "set" : "missing",
              NEXTAUTH_SECRET: hasAuthSecret ? "set" : "missing",
            };

            let database: { ok: boolean; message?: string; tenantsCount?: number } = {
              ok: false,
              message: "no probado",
            };

            if (hasDbUrl) {
              try {
                const tenantsCount = await prisma.tenant.count().catch(() => 0);
                database = { ok: true, message: "PostgreSQL OK: lectura correcta", tenantsCount };
              } catch (error) {
                database = {
                  ok: false,
                  message: error instanceof Error ? error.message : String(error),
                };
              }
            } else {
              database = { ok: false, message: "DATABASE_URL no configurada en Vercel" };
            }

            const ok = envOk && database.ok;
            return {
              ok,
              env,
              database,
              hint: !envOk
                ? "En Vercel: Settings → Environment Variables. Agregá DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET (o con prefijo dbgc_)."
                : !database.ok
                  ? "Revisá que DATABASE_URL sea la connection string correcta de Neon/Postgres y que ya hayas ejecutado prisma db push (y opcional db seed) contra esa base."
                  : undefined,
            };
          })()
        : null;
    return (
      <AppShell
        tenant={tenant}
        session={session}
        permissions={permissions}
        navigationLayout={branding.navigationLayout}
        logoUrl={branding.logoUrl}
        appName={branding.appName}
        health={tenantHealth ?? undefined}
      >
        {children}
      </AppShell>
    );
  } catch (err) {
    logError("TenantDashboardLayout", err);
    throw err;
  }
}
