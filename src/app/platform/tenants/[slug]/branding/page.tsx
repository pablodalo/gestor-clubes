import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PlatformShell } from "@/components/platform-shell";
import { getTenantBySlug } from "@/actions/tenants";
import { Button } from "@/components/ui/button";
import { BrandingForm } from "@/features/branding/branding-form";

type Props = { params: Promise<{ slug: string }> };

export default async function TenantBrandingPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/platform/login");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/platform/login");

  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const branding = tenant.branding ?? undefined;

  return (
    <PlatformShell>
      <div className="p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/platform/tenants/${slug}`}>← {tenant.name}</Link>
        </Button>
        <h1 className="text-2xl font-bold mt-4">Branding: {tenant.name}</h1>
        <p className="text-muted-foreground mt-1">Personalización visual del tenant.</p>
        <BrandingForm tenantId={tenant.id} initial={branding} />
      </div>
    </PlatformShell>
  );
}
