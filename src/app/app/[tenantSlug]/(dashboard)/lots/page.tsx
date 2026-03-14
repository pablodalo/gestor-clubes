import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function LotsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const lots = await prisma.inventoryLot.findMany({
    where: { tenantId: tenant.id },
    orderBy: { code: "asc" },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Lotes — {tenant.name}</h1>
      <p className="text-muted-foreground mt-1">Lotes de inventario.</p>
      <div className="mt-6 rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium">Código</th>
              <th className="p-4 text-left font-medium">Descripción</th>
              <th className="p-4 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  No hay lotes.
                </td>
              </tr>
            ) : (
              lots.map((lot) => (
                <tr key={lot.id} className="border-b hover:bg-muted/30">
                  <td className="p-4 font-mono">{lot.code}</td>
                  <td className="p-4">{lot.description ?? "—"}</td>
                  <td className="p-4">{lot.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
