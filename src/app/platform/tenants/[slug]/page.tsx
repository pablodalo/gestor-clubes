import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PlatformShell } from "@/components/platform-shell";
import { getTenantBySlug } from "@/actions/tenants";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

export default async function TenantDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/");

  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <PlatformShell>
      <div className="p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/platform/tenants">← Tenants</Link>
          </Button>
        </div>
        <div className="mt-6 rounded-lg border bg-card p-6 shadow-sm max-w-2xl">
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono">{tenant.slug}</dd>
            <dt className="text-muted-foreground">Estado</dt>
            <dd>{tenant.status}</dd>
            <dt className="text-muted-foreground">Zona horaria</dt>
            <dd>{tenant.timezone}</dd>
            <dt className="text-muted-foreground">Moneda</dt>
            <dd>{tenant.currency}</dd>
          </dl>
          <div className="mt-6 flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/platform/tenants/${slug}/branding`}>Branding</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/app/${slug}`}>Ir al panel del club</Link>
            </Button>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
