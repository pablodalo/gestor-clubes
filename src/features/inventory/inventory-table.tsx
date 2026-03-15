"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
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
import { InventoryItemFormDialog } from "@/features/inventory/inventory-item-form";
import { Package, Pencil, MoreHorizontal } from "lucide-react";

type ItemWithLot = Prisma.InventoryItemGetPayload<{ include: { lot: true } }>;

type Props = {
  items: ItemWithLot[];
  lots: { id: string; code: string }[];
  locations: { id: string; name: string }[];
  canCreate: boolean;
  canAdjust: boolean;
};

export function InventoryTable({ items, lots, locations, canCreate, canAdjust }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ItemWithLot | null>(null);

  const refresh = () => router.refresh();

  const columns: DataTableColumn<ItemWithLot>[] = [
    { key: "code", header: "Código", render: (i) => <span className="font-mono font-medium text-foreground">{i.code}</span> },
    { key: "lot", header: "Lote", render: (i) => <span className="text-muted-foreground">{i.lot.code}</span> },
    { key: "quantityCurrent", header: "Cantidad", render: (i) => String(i.quantityCurrent) },
    { key: "status", header: "Estado", render: (i) => <Badge variant={getStatusVariant(i.status)}>{getStatusLabel(i.status) ?? i.status}</Badge> },
  ];

  const exportData = items.map((i) => ({
    id: i.id,
    code: i.code,
    lotCode: i.lot.code,
    quantityCurrent: String(i.quantityCurrent),
    status: i.status,
  }));

  return (
    <>
      <ListPageLayout
        title="Inventario"
        description="Ítems de inventario."
        actions={
          <>
            <ExportButtons data={exportData} filename="inventario" />
            {canCreate && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Package className="h-4 w-4 mr-2" />
                Nuevo ítem
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={items}
          keyExtractor={(i) => i.id}
          emptyState={{ icon: Package, title: "Sin ítems", description: canCreate ? "Creá uno desde «Nuevo ítem»." : "No hay ítems en inventario." }}
          rowActions={
            canAdjust
              ? (item) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(item); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              : undefined
          }
        />
      </ListPageLayout>
      <InventoryItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        edit={editing}
        lots={lots}
        locations={locations}
        canCreate={canCreate}
        canAdjust={canAdjust}
      />
    </>
  );
}
