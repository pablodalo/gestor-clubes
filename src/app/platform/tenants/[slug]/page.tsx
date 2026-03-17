import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PlatformShell } from "@/components/platform-shell";
import { getTenantBySlug } from "@/actions/tenants";
import { Button } from "@/components/ui/button";
import { TenantDetailTabs } from "@/features/tenants/tenant-detail-tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ExternalLink } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export default async function TenantDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/");

  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const branding = tenant.branding ?? undefined;

  return (
    <PlatformShell>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link href="/platform/tenants" className="transition-colors hover:text-foreground">
                Tenants
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tenant.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-muted-foreground mt-0.5">Configuración del club y apariencia.</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/portal/socios/${slug}/login`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Portal del socio
              </Link>
            </Button>
            <Button asChild variant="default" className="gap-2">
              <Link href={`/app/${slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Abrir panel del club
              </Link>
            </Button>
          </div>
        </div>

        <TenantDetailTabs tenant={tenant} branding={branding} />
      </div>
    </PlatformShell>
  );
}
