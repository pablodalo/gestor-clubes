"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { deleteTenant } from "@/actions/tenants";
import { Building2, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

type TenantRow = { id: string; name: string; slug: string; status: string; createdAt: Date };

type Props = {
  tenants: TenantRow[];
};

export function TenantsTable({ tenants }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<TenantRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const columns: DataTableColumn<TenantRow>[] = [
    { key: "name", header: "Nombre", render: (t) => <span className="font-medium text-foreground">{t.name}</span> },
    { key: "status", header: "Estado", render: (t) => <Badge variant={getStatusVariant(t.status)}>{getStatusLabel(t.status) ?? t.status}</Badge> },
    { key: "createdAt", header: "Creado", render: (t) => <span className="text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("es-AR")}</span> },
  ];

  async function handleDelete() {
    if (!selected) return;
    setError("");
    setLoading(true);
    const result = await deleteTenant(selected.id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirmOpen(false);
    setSelected(null);
    router.refresh();
  }

  const exportData = tenants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    status: r.status,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }));

  return (
    <ListPageLayout
      title="Tenants"
      description="Clubes (tenants) de la plataforma."
      actions={
        <>
          <ExportButtons data={exportData} filename="tenants" />
          <Button asChild>
            <Link href="/platform/tenants/new">Nuevo tenant</Link>
          </Button>
        </>
      }
    >
      <DataTable
        columns={columns}
        data={tenants}
        keyExtractor={(t) => t.id}
        emptyState={{ icon: Building2, title: "Sin tenants", description: 'Creá uno desde "Nuevo tenant".' }}
        rowActions={(t) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/app/${t.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver (panel del club)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/platform/tenants/${t.slug}`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelected(t);
                  setError("");
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) { setSelected(null); setError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar club</DialogTitle>
            <DialogDescription>
              {selected
                ? `Vas a eliminar el club «${selected.name}». Se borrarán usuarios, socios, inventario, cultivo y todos los datos asociados. Esta acción no se puede deshacer.`
                : "Vas a eliminar este club."}
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
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar club"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageLayout>
  );
}
