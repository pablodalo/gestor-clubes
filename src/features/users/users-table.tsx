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
import { UserFormDialog } from "@/features/users/user-form";
import { deleteTenantUser } from "@/actions/users";
import type { User, Role } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Pencil, Trash2, UserPlus, Users } from "lucide-react";

type UserWithRole = User & { role: Role };

const roleDisplayName: Record<string, string> = {
  tenant_admin: "Administrador",
  operador: "Operador",
  cultivador: "Cultivador",
  auditor: "Auditor",
  socio: "Socio",
};

type Props = {
  tenantSlug: string;
  users: UserWithRole[];
  roles: Role[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function UsersTable({
  tenantSlug,
  users,
  roles,
  canCreate,
  canUpdate,
  canDelete,
}: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserWithRole | null>(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const refresh = () => router.refresh();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role.name !== roleFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      if (!term) return true;
      const hay = [u.name, u.email, u.role.name, u.status].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [users, q, roleFilter, statusFilter]);

  const columns: DataTableColumn<UserWithRole>[] = [
    { key: "name", header: "Nombre", render: (u) => <span className="font-medium text-foreground">{u.name}</span> },
    { key: "email", header: "Email", render: (u) => <span className="text-muted-foreground">{u.email}</span> },
    { key: "role", header: "Rol", render: (u) => <Badge variant="secondary">{roleDisplayName[u.role.name] ?? u.role.name}</Badge> },
    { key: "status", header: "Estado", render: (u) => <Badge variant={getStatusVariant(u.status)}>{getStatusLabel(u.status) ?? u.status}</Badge> },
  ];

  async function handleDelete(u: UserWithRole) {
    if (!canDelete) return;
    if (!confirm(`¿Eliminar al usuario ${u.name} (${u.email})? Esta acción no se puede deshacer.`)) return;
    const result = await deleteTenantUser(u.id);
    if (result.error) alert(result.error);
    else refresh();
  }

  const exportData = filtered.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: roleDisplayName[u.role.name] ?? u.role.name,
    status: u.status,
  }));

  return (
    <>
      <ListPageLayout
        title="Usuarios"
        description="Usuarios del panel del club (Admin y Operador) con acceso configurable por rol."
        actions={
          <>
            <ExportButtons data={exportData} filename="usuarios" />
            {canCreate && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo usuario
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(u) => u.id}
          emptyState={{ icon: Users, title: "Sin usuarios", description: "Creá uno desde «Nuevo usuario»." }}
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre o email…"
                  className="sm:max-w-sm"
                />
                <div className="flex gap-2">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">Rol (todos)</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {roleDisplayName[r.name] ?? r.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Estado (todos)</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="suspended">Suspendido</option>
                  </select>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {filtered.length} resultado(s)
              </span>
            </div>
          }
          rowActions={(u) =>
            canUpdate || canDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canUpdate && (
                    <DropdownMenuItem onClick={() => { setEditing(u); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(u)}
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
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        edit={editing}
        roles={roles}
      />
    </>
  );
}
