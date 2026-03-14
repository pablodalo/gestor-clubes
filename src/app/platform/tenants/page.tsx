import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlatformShell } from "@/components/platform-shell";
import { getTenantsList } from "@/actions/tenants";
import { Button } from "@/components/ui/button";

export default async function TenantsListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/");

  const tenants = await getTenantsList();

  return (
    <PlatformShell>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tenants</h1>
          <Button asChild>
            <Link href="/platform/tenants/new">Nuevo tenant</Link>
          </Button>
        </div>
        <div className="mt-6 rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium">Nombre</th>
                <th className="p-4 text-left font-medium">Slug</th>
                <th className="p-4 text-left font-medium">Estado</th>
                <th className="p-4 text-left font-medium">Creado</th>
                <th className="p-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No hay tenants. Creá uno desde &quot;Nuevo tenant&quot;.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-medium">{t.name}</td>
                    <td className="p-4 text-muted-foreground">{t.slug}</td>
                    <td className="p-4">
                      <span
                        className={
                          t.status === "active"
                            ? "text-green-600"
                            : t.status === "suspended"
                            ? "text-red-600"
                            : "text-amber-600"
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/platform/tenants/${t.slug}`}
                        className="text-primary hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PlatformShell>
  );
}
