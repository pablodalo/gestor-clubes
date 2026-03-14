import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PlatformShell } from "@/components/platform-shell";
import { getTenantBySlug } from "@/actions/tenants";
import { BrandingForm } from "@/features/branding/branding-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Props = { params: Promise<{ slug: string }> };

export default async function TenantBrandingPage({ params }: Props) {
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
              <Link href={`/platform/tenants/${slug}`} className="transition-colors hover:text-foreground">
                {tenant.name}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Branding</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branding: {tenant.name}</h1>
          <p className="text-muted-foreground mt-1">Personalización visual del tenant.</p>
        </div>
        <BrandingForm tenantId={tenant.id} initial={branding} />
      </div>
    </PlatformShell>
  );
}
