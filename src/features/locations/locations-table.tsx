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
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationFormDialog } from "@/features/locations/location-form";
import { deleteLocation } from "@/actions/locations";
import type { Location } from "@prisma/client";
import { MoreHorizontal, Pencil, Trash2, MapPin, MapPinned } from "lucide-react";

type Props = {
  tenantSlug: string;
  locations: Location[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

const typeLabels: Record<string, string> = {
  zone: "Zona",
  building: "Edificio",
  room: "Sala",
  shelf: "Estante",
};

export function LocationsTable({ tenantSlug, locations, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => router.refresh();
  const parentOptions = locations.map((l) => ({ id: l.id, name: l.name }));

  const columns: DataTableColumn<Location>[] = [
    { key: "name", header: "Nombre", render: (l) => <span className="font-medium text-foreground">{l.name}</span> },
    { key: "type", header: "Tipo", render: (l) => <span className="text-muted-foreground">{typeLabels[l.type] ?? l.type}</span> },
    { key: "description", header: "Descripción", render: (l) => <span className="text-muted-foreground">{l.description ?? "—"}</span> },
  ];

  async function handleDelete() {
    if (!canDelete || !selected) return;
    setError("");
    setLoading(true);
    const result = await deleteLocation(selected.id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirmOpen(false);
    setSelected(null);
    refresh();
  }

  const exportData = locations.map((l) => ({ id: l.id, name: l.name, type: l.type, description: l.description ?? "" }));

  return (
    <>
      <ListPageLayout
        title="Ubicaciones"
        description="Lugares y zonas del club."
        actions={
          <>
            <ExportButtons data={exportData} filename="ubicaciones" />
            {canCreate && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <MapPin className="h-4 w-4 mr-2" />
                Nueva ubicación
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={locations}
          keyExtractor={(l) => l.id}
          emptyState={{ icon: MapPinned, title: "Sin ubicaciones", description: "Creá una desde «Nueva ubicación»." }}
          rowActions={(l) =>
            canEdit || canDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => { setEditing(l); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setSelected(l);
                        setError("");
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null
          }
        />
      </ListPageLayout>
      <LocationFormDialog
        tenantSlug={tenantSlug}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        edit={editing}
        parentOptions={parentOptions}
      />
      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) { setSelected(null); setError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar ubicación</DialogTitle>
            <DialogDescription>
              {selected
                ? `Vas a eliminar la ubicación «${selected.name}». Si está en uso por movimientos o inventario, no se podrá borrar.`
                : "Vas a eliminar esta ubicación."}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-2">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || !canDelete}
            >
              {loading ? "Eliminando..." : "Eliminar ubicación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
