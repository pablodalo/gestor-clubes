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
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { PlatformUserFormDialog } from "@/features/platform-users/platform-user-form";
import { deletePlatformUser } from "@/actions/platform-users";
import { PLATFORM_OWNER_ROLE, PLATFORM_PERMISSION_KEYS } from "@/config/platform-permissions";
import { MoreHorizontal, Pencil, Trash2, UserPlus, Users } from "lucide-react";

type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: unknown;
  createdAt: Date;
};

const roleLabels: Record<string, string> = {
  platform_owner: "Superadmin",
  platform_admin: "Administrador",
  support_agent: "Soporte",
  billing_admin: "Facturación",
};

export function PlatformUsersTable({ users }: { users: PlatformUserRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformUserRow | null>(null);

  const columns: DataTableColumn<PlatformUserRow>[] = [
    { key: "name", header: "Nombre", render: (u) => <span className="font-medium text-foreground">{u.name}</span> },
    { key: "email", header: "Email", render: (u) => <span className="text-muted-foreground">{u.email}</span> },
    { key: "role", header: "Rol", render: (u) => <Badge variant="secondary">{roleLabels[u.role] ?? u.role}</Badge> },
    {
      key: "permissions",
      header: "Permisos",
      render: (u) => {
        if (u.role === PLATFORM_OWNER_ROLE) return <span className="text-muted-foreground">Todo</span>;
        const perms = Array.isArray(u.permissions) ? (u.permissions as string[]) : [];
        if (perms.length === 0) return <span className="text-muted-foreground">Solo Tenants</span>;
        const labels = perms.map((p) => (p === PLATFORM_PERMISSION_KEYS.audit_read ? "Auditoría" : p === PLATFORM_PERMISSION_KEYS.errors_read ? "Errores" : p));
        return <span className="text-muted-foreground text-sm">{labels.join(", ")}</span>;
      },
    },
    { key: "status", header: "Estado", render: (u) => <Badge variant={getStatusVariant(u.status)}>{getStatusLabel(u.status) ?? u.status}</Badge> },
  ];

  async function handleDelete(u: PlatformUserRow) {
    if (u.role === PLATFORM_OWNER_ROLE) return;
    if (!confirm(`¿Eliminar a ${u.name} (${u.email})?`)) return;
    const result = await deletePlatformUser(u.id);
    if (result.error) alert(result.error);
    else router.refresh();
  }

  const exportData = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: roleLabels[u.role] ?? u.role,
    status: u.status,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  }));

  return (
    <>
      <ListPageLayout
        title="Usuarios de plataforma"
        description="Usuarios que acceden al panel superadmin. Permisos por módulo (Auditoría, Errores)."
        actions={
          <>
            <ExportButtons data={exportData} filename="usuarios-plataforma" />
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo usuario
            </Button>
          </>
        }
      >
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          emptyState={{ icon: Users, title: "Sin usuarios", description: "Creá uno desde «Nuevo usuario»." }}
          rowActions={(u) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Acciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditing(u); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {u.role !== PLATFORM_OWNER_ROLE && (
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(u)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        />
      </ListPageLayout>
      <PlatformUserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => router.refresh()} edit={editing} />
    </>
  );
}
