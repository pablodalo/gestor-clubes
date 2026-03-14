import { getTenantBySlug } from "@/lib/tenant";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalSociosHomePage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Bienvenido — {tenant.name}</h1>
      <p className="text-muted-foreground mt-1">Portal de socios. Acá podés ver tu perfil, movimientos y tickets.</p>
    </div>
  );
}
