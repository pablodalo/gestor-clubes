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
import { AlertDialog } from "@/components/alert-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MembershipPlanFormDialog } from "@/features/memberships/membership-plan-form";
import { deleteMembershipPlan } from "@/actions/membership-plans";
import type { MembershipLimitRule, MembershipPlan } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2, CreditCard, Wallet } from "lucide-react";

type Props = {
  tenantSlug: string;
  plans: Array<MembershipPlan & { limitRules: MembershipLimitRule[] }>;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type PlanWithRules = MembershipPlan & { limitRules: MembershipLimitRule[] };

export function MembershipPlansTable({ tenantSlug, plans, canCreate, canUpdate, canDelete }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlanWithRules | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlanWithRules | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "Aviso", message: "" });

  const refresh = () => router.refresh();

  const columns: DataTableColumn<PlanWithRules>[] = [
    { key: "name", header: "Nombre", render: (p) => <span className="font-medium text-foreground">{p.name}</span> },
    {
      key: "tier",
      header: "Tier",
      render: (p) => {
        const t = (p as unknown as { tier?: string | null }).tier;
        if (!t) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant="secondary" className="font-normal">
            {t}
          </Badge>
        );
      },
    },
    { key: "description", header: "Descripción", render: (p) => <span className="text-muted-foreground">{p.description ?? "—"}</span> },
    {
      key: "price",
      header: "Precio",
      render: (p) => (
        <span className="text-muted-foreground">
          {p.price != null ? `${p.currency} ${Number(p.price)}` : "—"}
        </span>
      ),
    },
    {
      key: "recurrenceDay",
      header: "Día cobro",
      render: (p) => <span className="text-muted-foreground">{p.recurrenceDay ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (p) => (
        <span className={p.status === "active" ? "text-green-600" : "text-muted-foreground"}>
          {p.status === "active" ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  async function handleDelete(p: PlanWithRules) {
    if (!canDelete) return;
    setPlanToDelete(p);
  }

  async function doDelete() {
    if (!planToDelete) return;
    const result = await deleteMembershipPlan(planToDelete.id);
    if (result.error) {
      setAlertMessage({ title: "Error", message: result.error });
      setAlertOpen(true);
    } else {
      refresh();
    }
  }

  return (
    <>
      <ListPageLayout
        title="Planes de membresía"
        description="Configurá los planes que podés asignar a los socios."
        actions={
          canCreate ? (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Wallet className="h-4 w-4 mr-2" />
              Nuevo plan
            </Button>
          ) : undefined
        }
      >
        <DataTable
          columns={columns}
          data={plans}
          keyExtractor={(p) => p.id}
          emptyState={{
            icon: CreditCard,
            title: "Sin planes",
            description: "Creá un plan desde «Nuevo plan» para asignarlo a socios.",
          }}
          rowActions={(p) =>
            canUpdate || canDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Más acciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canUpdate && (
                    <DropdownMenuItem onClick={() => { setEditing(p); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(p)}
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
      <MembershipPlanFormDialog
        tenantSlug={tenantSlug}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        edit={editing}
      />
      <ConfirmDialog
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
        title="Eliminar plan"
        description={planToDelete ? `¿Eliminar el plan «${planToDelete.name}»?` : ""}
        confirmLabel="Eliminar"
        destructive
        onConfirm={doDelete}
      />
      <AlertDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title={alertMessage.title}
        message={alertMessage.message}
      />
    </>
  );
}
