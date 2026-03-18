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
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { AlertDialog } from "@/components/alert-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MemberFormDialog } from "@/features/members/member-form";
import { deleteMember } from "@/actions/members";
import type { Member } from "@prisma/client";
import { MoreHorizontal, Pencil, Trash2, UserPlus, Users, Eye } from "lucide-react";

type MembershipPlanOption = { id: string; name: string };

type Props = {
  tenantSlug: string;
  members: Member[];
  membershipPlans: MembershipPlanOption[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function MembersTable({ tenantSlug, members, membershipPlans, canCreate, canUpdate, canDelete }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "Aviso", message: "" });

  const refresh = () => router.refresh();

  const columns: DataTableColumn<Member>[] = [
    { key: "memberNumber", header: "Nº", render: (m) => <span className="font-mono text-foreground">{m.memberNumber}</span> },
    {
      key: "firstName",
      header: "Nombre",
      render: (m) => (
        <Link
          href={`/app/${tenantSlug}/members/${m.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {m.firstName} {m.lastName}
        </Link>
      ),
    },
    { key: "email", header: "Email", render: (m) => <span className="text-muted-foreground">{m.email ?? "—"}</span> },
    {
      key: "reprocannActive",
      header: "Reprocann",
      render: (m) => (
        <Badge variant={m.reprocannActive ? "success" : "secondary"}>
          {m.reprocannActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    { key: "status", header: "Estado", render: (m) => <Badge variant={getStatusVariant(m.status)}>{getStatusLabel(m.status) ?? m.status}</Badge> },
  ];

  function handleDelete(m: Member) {
    if (!canDelete) return;
    setMemberToDelete(m);
  }

  async function doDelete() {
    if (!memberToDelete) return;
    const result = await deleteMember(memberToDelete.id);
    if (result.error) {
      setAlertMessage({ title: "Error", message: result.error });
      setAlertOpen(true);
    } else refresh();
  }

  const exportData = members.map((m) => ({
    id: m.id,
    memberNumber: m.memberNumber,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email ?? "",
    reprocannActive: m.reprocannActive ? "Activo" : "Inactivo",
    status: m.status,
  }));

  return (
    <>
      <ListPageLayout
        title="Socios"
        description="Listado de socios del club."
        actions={
          <>
            <ExportButtons data={exportData} filename="socios" />
            {canCreate && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo socio
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={members}
          keyExtractor={(m) => m.id}
          emptyState={{ icon: Users, title: "Sin socios", description: "Creá uno desde «Nuevo socio»." }}
          rowActions={(m) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Ver ficha">
                  <Link href={`/app/${tenantSlug}/members/${m.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver ficha</span>
                  </Link>
                </Button>
                {(canUpdate || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Más acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/app/${tenantSlug}/members/${m.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver ficha
                      </DropdownMenuItem>
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => { setEditing(m); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(m)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
        />
      </ListPageLayout>
      <MemberFormDialog
        tenantSlug={tenantSlug}
        membershipPlans={membershipPlans}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        edit={editing}
      />
      <ConfirmDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
        title="Eliminar socio"
        description={memberToDelete ? `¿Eliminar al socio ${memberToDelete.firstName} ${memberToDelete.lastName} (${memberToDelete.memberNumber})? Esta acción no se puede deshacer.` : ""}
        confirmLabel="Eliminar"
        destructive
        onConfirm={doDelete}
      />
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen} title={alertMessage.title} message={alertMessage.message} />
    </>
  );
}
