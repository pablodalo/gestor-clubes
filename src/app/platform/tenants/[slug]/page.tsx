import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PlatformShell } from "@/components/platform-shell";
import { getTenantBySlug } from "@/actions/tenants";
import { Button } from "@/components/ui/button";
import { TenantEditForm } from "@/features/tenants/tenant-edit-form";
import { BrandingForm } from "@/features/branding/branding-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Palette, Settings } from "lucide-react";

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
          <Button asChild variant="default" className="gap-2 shrink-0">
            <Link href={`/app/${slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Abrir panel del club
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Columna principal: datos del tenant */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>General</CardTitle>
                </div>
                <CardDescription>Nombre, estado, zona horaria y moneda del tenant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd className="font-medium">{tenant.status}</dd>
                  <dt className="text-muted-foreground">Zona horaria</dt>
                  <dd>{tenant.timezone}</dd>
                  <dt className="text-muted-foreground">Moneda</dt>
                  <dd>{tenant.currency}</dd>
                </dl>
                <TenantEditForm tenant={tenant} />
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral: branding */}
          <div className="xl:col-span-1">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Apariencia y navegación</CardTitle>
                </div>
                <CardDescription>Logo, colores, fuentes y tipo de menú del panel.</CardDescription>
              </CardHeader>
              <CardContent>
                <BrandingForm tenantId={tenant.id} initial={branding} embed />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
