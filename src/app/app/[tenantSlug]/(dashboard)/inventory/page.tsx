import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function InventoryPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const items = await prisma.inventoryItem.findMany({
    where: { tenantId: tenant.id },
    include: { lot: true },
    orderBy: { code: "asc" },
    take: 50,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Inventario — {tenant.name}</h1>
      <p className="text-muted-foreground mt-1">Items de inventario.</p>
      <div className="mt-6 rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium">Código</th>
              <th className="p-4 text-left font-medium">Lote</th>
              <th className="p-4 text-left font-medium">Cantidad</th>
              <th className="p-4 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No hay ítems en inventario.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/30">
                  <td className="p-4 font-mono">{item.code}</td>
                  <td className="p-4">{item.lot.code}</td>
                  <td className="p-4">{String(item.quantityCurrent)}</td>
                  <td className="p-4">{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
