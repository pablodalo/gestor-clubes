import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function LocationsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const locations = await prisma.location.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Ubicaciones — {tenant.name}</h1>
      <p className="text-muted-foreground mt-1">Lugares y zonas.</p>
      <div className="mt-6 rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium">Nombre</th>
              <th className="p-4 text-left font-medium">Tipo</th>
              <th className="p-4 text-left font-medium">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  No hay ubicaciones.
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id} className="border-b hover:bg-muted/30">
                  <td className="p-4 font-medium">{loc.name}</td>
                  <td className="p-4">{loc.type}</td>
                  <td className="p-4 text-muted-foreground">{loc.description ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
