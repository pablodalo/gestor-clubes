import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function MembersPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const members = await prisma.member.findMany({
    where: { tenantId: tenant.id },
    orderBy: { lastName: "asc" },
    take: 50,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Socios — {tenant.name}</h1>
      <p className="text-muted-foreground mt-1">Listado de socios (base).</p>
      <div className="mt-6 rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium">Nº</th>
              <th className="p-4 text-left font-medium">Nombre</th>
              <th className="p-4 text-left font-medium">Email</th>
              <th className="p-4 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No hay socios cargados.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-b hover:bg-muted/30">
                  <td className="p-4 font-mono">{m.memberNumber}</td>
                  <td className="p-4">{m.firstName} {m.lastName}</td>
                  <td className="p-4 text-muted-foreground">{m.email ?? "—"}</td>
                  <td className="p-4">{m.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
