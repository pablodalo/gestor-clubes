import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { PlatformShell } from "@/components/platform-shell";
import { getTenantsList } from "@/actions/tenants";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";

type TenantRow = { id: string; name: string; slug: string; status: string; createdAt: Date };

export default async function TenantsListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/");

  const tenants = await getTenantsList();
  const rows: TenantRow[] = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    status: t.status,
    createdAt: t.createdAt,
  }));

  const columns: DataTableColumn<TenantRow>[] = [
    { key: "name", header: "Nombre", render: (t) => <span className="font-medium text-foreground">{t.name}</span> },
    { key: "slug", header: "Slug", render: (t) => <span className="font-mono text-muted-foreground">{t.slug}</span> },
    { key: "status", header: "Estado", render: (t) => <Badge variant={getStatusVariant(t.status)}>{getStatusLabel(t.status) ?? t.status}</Badge> },
    { key: "createdAt", header: "Creado", render: (t) => <span className="text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("es-AR")}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-20",
      render: (t) => (
        <Button variant="ghost" size="sm" className="text-primary h-8" asChild>
          <Link href={`/platform/tenants/${t.slug}`}>Ver</Link>
        </Button>
      ),
    },
  ];

  return (
    <PlatformShell>
      <ListPageLayout
        title="Tenants"
        description="Clubes (tenants) de la plataforma."
        actions={
          <Button asChild>
            <Link href="/platform/tenants/new">Nuevo tenant</Link>
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(t) => t.id}
          emptyState={{ icon: Building2, title: "Sin tenants", description: 'Creá uno desde "Nuevo tenant".' }}
        />
      </ListPageLayout>
    </PlatformShell>
  );
}
