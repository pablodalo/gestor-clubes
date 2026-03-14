"use client";

import { useState } from "react";
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
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { LotFormDialog } from "@/features/lots/lot-form";
import { deleteLot } from "@/actions/lots";
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

  const refresh = () => router.refresh();

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

  return (
    <>
      <ListPageLayout
        title="Lotes"
        description="Lotes de inventario."
        actions={
          canCreate ? (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Package className="h-4 w-4 mr-2" />
              Nuevo lote
            </Button>
          ) : undefined
        }
      >
        <DataTable
          columns={columns}
          data={lots}
          keyExtractor={(l) => l.id}
          emptyState={{ icon: PackageOpen, title: "Sin lotes", description: "Creá uno desde «Nuevo lote»." }}
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
