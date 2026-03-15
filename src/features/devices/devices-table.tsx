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
import { ExportButtons } from "@/components/export-buttons";
import { DeviceFormDialog } from "@/features/devices/device-form";
import { deleteDevice } from "@/actions/devices";
import type { Device } from "@prisma/client";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { MoreHorizontal, Pencil, Trash2, Cpu, CpuIcon } from "lucide-react";

type Props = {
  tenantSlug: string;
  devices: Device[];
  locationOptions: { id: string; name: string }[];
  canCreate: boolean;
  canManage: boolean;
};

export function DevicesTable({ tenantSlug, devices, locationOptions, canCreate, canManage }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);

  const refresh = () => router.refresh();

  const columns: DataTableColumn<Device>[] = [
    { key: "name", header: "Nombre", render: (d) => <span className="font-medium text-foreground">{d.name}</span> },
    { key: "type", header: "Tipo", render: (d) => <span className="text-muted-foreground">{d.type ?? "—"}</span> },
    { key: "brand", header: "Marca", render: (d) => <span className="text-muted-foreground">{d.brand ?? "—"}</span> },
    { key: "status", header: "Estado", render: (d) => <Badge variant={getStatusVariant(d.status)}>{getStatusLabel(d.status) ?? d.status}</Badge> },
  ];

  async function handleDelete(d: Device) {
    if (!canManage) return;
    if (!confirm(`¿Eliminar el dispositivo «${d.name}»?`)) return;
    const result = await deleteDevice(d.id);
    if (result.error) alert(result.error);
    else refresh();
  }

  const exportData = devices.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type ?? "",
    brand: d.brand ?? "",
    model: d.model ?? "",
    serialNumber: d.serialNumber ?? "",
    status: d.status,
  }));

  return (
    <>
      <ListPageLayout
        title="Dispositivos"
        description="Balanzas, sensores y otros dispositivos del club."
        actions={
          <>
            <ExportButtons data={exportData} filename="dispositivos" />
            {canCreate && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Cpu className="h-4 w-4 mr-2" />
                Nuevo dispositivo
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={devices}
          keyExtractor={(d) => d.id}
          emptyState={{ icon: CpuIcon, title: "Sin dispositivos", description: "Agregá uno desde «Nuevo dispositivo»." }}
          rowActions={
            canManage
              ? (d) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(d); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(d)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              : undefined
          }
        />
      </ListPageLayout>
      <DeviceFormDialog
        tenantSlug={tenantSlug}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        edit={editing}
        locationOptions={locationOptions}
      />
    </>
  );
}
