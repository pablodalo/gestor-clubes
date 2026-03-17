"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { LotFormDialog } from "@/features/lots/lot-form";
import { deleteLot } from "@/actions/lots";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Pencil, Trash2, Package, PackageOpen } from "lucide-react";

type LotRow = Awaited<ReturnType<typeof import("@/lib/prisma").prisma.inventoryLot.findMany>>[number] & {
  _count?: { items: number };
};

type Props = {
  tenantSlug: string;
  lots: LotRow[];
  locations: { id: string; name: string }[];
  canCreate: boolean;
};

export function LotsTable({ tenantSlug, lots, locations, canCreate }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LotRow | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const refresh = () => router.refresh();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return lots.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (!term) return true;
      const hay = [l.code, l.description ?? "", l.status].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [lots, q, statusFilter]);

  const columns: DataTableColumn<LotRow>[] = [
    { key: "code", header: "Código", render: (l) => <span className="font-mono font-medium text-foreground">{l.code}</span> },
    { key: "description", header: "Descripción", render: (l) => <span className="text-muted-foreground">{l.description ?? "—"}</span> },
    { key: "status", header: "Estado", render: (l) => <Badge variant={getStatusVariant(l.status)}>{getStatusLabel(l.status) ?? l.status}</Badge> },
    {
      key: "_count",
      header: "Ítems",
      render: (l) => (l._count?.items != null ? String(l._count.items) : "—"),
    },
  ];

  async function handleDelete(l: LotRow) {
    if (!confirm(`¿Eliminar el lote «${l.code}»?`)) return;
    const result = await deleteLot(l.id);
    if (result.error) alert(result.error);
    else refresh();
  }

  const exportData = filtered.map((l) => ({
    id: l.id,
    code: l.code,
    description: l.description ?? "",
    status: l.status,
    itemsCount: l._count?.items ?? 0,
  }));

  return (
    <>
      <ListPageLayout
        title="Lotes"
        description="Lotes de inventario."
        actions={
          <>
            <ExportButtons data={exportData} filename="lotes" />
            {canCreate && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Package className="h-4 w-4 mr-2" />
                Nuevo lote
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(l) => l.id}
          emptyState={{ icon: PackageOpen, title: "Sin lotes", description: "Creá uno desde «Nuevo lote»." }}
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por código o descripción…"
                  className="sm:max-w-sm"
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Estado (todos)</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <span className="text-xs text-muted-foreground">
                {filtered.length} resultado(s)
              </span>
            </div>
          }
          rowActions={(l) => (
            canCreate ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menú</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditing(l); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(l)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null
          )}
        />
      </ListPageLayout>
      <LotFormDialog
        tenantSlug={tenantSlug}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        edit={editing}
        locations={locations}
      />
    </>
  );
}
