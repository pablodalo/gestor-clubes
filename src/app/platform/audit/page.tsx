import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PlatformShell } from "@/components/platform-shell";
import { prisma } from "@/lib/prisma";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ListPageLayout } from "@/components/list-page-layout";

type AuditRow = {
  id: string;
  actorType: string;
  action: string;
  entityName: string;
  entityId: string | null;
  createdAt: Date;
  tenantId: string | null;
};

const PAGE_SIZE = 20;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tenantId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/");

  const { page = "1", tenantId: filterTenantId } = await searchParams;
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * PAGE_SIZE;

  const where = filterTenantId ? { tenantId: filterTenantId } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: { id: true, actorType: true, action: true, entityName: true, entityId: true, createdAt: true, tenantId: true },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const rows: AuditRow[] = logs.map((l) => ({
    id: l.id,
    actorType: l.actorType,
    action: l.action,
    entityName: l.entityName,
    entityId: l.entityId,
    createdAt: l.createdAt,
    tenantId: l.tenantId,
  }));

  const columns: DataTableColumn<AuditRow>[] = [
    { key: "createdAt", header: "Fecha", render: (r) => <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString("es-AR")}</span> },
    { key: "actorType", header: "Actor", render: (r) => <span className="font-medium text-foreground">{r.actorType}</span> },
    { key: "action", header: "Acción", render: (r) => r.action },
    { key: "entityName", header: "Entidad", render: (r) => r.entityName },
    { key: "entityId", header: "ID entidad", render: (r) => <span className="font-mono text-muted-foreground text-xs">{r.entityId ?? "—"}</span> },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(parseInt(page, 10) || 1, totalPages));

  return (
    <PlatformShell>
      <ListPageLayout
        title="Auditoría"
        description="Registro de acciones en la plataforma."
        toolbar={
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="tenantId" className="text-sm text-muted-foreground whitespace-nowrap">Tenant</label>
            <select
              id="tenantId"
              name="tenantId"
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              defaultValue={filterTenantId ?? ""}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">Todos</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </form>
        }
      >
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyState={{ icon: FileText, title: "Sin registros", description: "No hay registros de auditoría." }}
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
            <span>
              Página {currentPage} de {totalPages} ({total} registros)
            </span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <a
                  href={`?page=${currentPage - 1}${filterTenantId ? `&tenantId=${filterTenantId}` : ""}`}
                  className="text-primary hover:underline"
                >
                  Anterior
                </a>
              )}
              {currentPage < totalPages && (
                <a
                  href={`?page=${currentPage + 1}${filterTenantId ? `&tenantId=${filterTenantId}` : ""}`}
                  className="text-primary hover:underline"
                >
                  Siguiente
                </a>
              )}
            </div>
          </div>
        )}
      </ListPageLayout>
    </PlatformShell>
  );
}
