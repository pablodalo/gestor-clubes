"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { getStatusVariant, getStatusLabel } from "@/lib/status-badges";
import { createTicket, updateTicketStatus } from "@/actions/tickets";
import type { Ticket } from "@prisma/client";
import { MessageSquarePlus, TicketIcon } from "lucide-react";

type Props = {
  tenantSlug: string;
  tickets: Ticket[];
  canCreate: boolean;
  canUpdateStatus: boolean;
};

export function TicketsTable({ tenantSlug, tickets, canCreate, canUpdateStatus }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = () => router.refresh();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createTicket({
      subject: (formData.get("subject") as string).trim(),
      description: (formData.get("description") as string).trim() || undefined,
      priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    refresh();
  }

  async function handleStatusChange(nextStatus: Ticket["status"]) {
    if (!selected) return;
    setLoading(true);
    const result = await updateTicketStatus(selected.id, nextStatus);
    setLoading(false);
    if ((result as { error?: string }).error) {
      setError((result as { error?: string }).error ?? "Error al actualizar el ticket");
      return;
    }
    setDetailOpen(false);
    setSelected(null);
    refresh();
  }

  const columns: DataTableColumn<Ticket>[] = [
    {
      key: "subject",
      header: "Asunto",
      render: (t) => (
        <button
          type="button"
          onClick={() => { setSelected(t); setDetailOpen(true); setError(""); }}
          className="font-medium text-foreground hover:underline text-left w-full"
        >
          {t.subject}
        </button>
      ),
    },
    { key: "priority", header: "Prioridad", render: (t) => <Badge variant={getStatusVariant(t.priority)}>{getStatusLabel(t.priority) ?? t.priority}</Badge> },
    { key: "status", header: "Estado", render: (t) => <Badge variant={getStatusVariant(t.status)}>{getStatusLabel(t.status) ?? t.status}</Badge> },
    { key: "createdAt", header: "Fecha", render: (t) => <span className="text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("es-AR")}</span> },
  ];

  const exportData = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  }));

  return (
    <>
      <ListPageLayout
        title="Tickets"
        description="Consultas y soporte."
        actions={
          <>
            <ExportButtons data={exportData} filename="tickets" />
            {canCreate && (
              <Button onClick={() => { setError(""); setDialogOpen(true); }}>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Nuevo ticket
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={tickets}
          keyExtractor={(t) => t.id}
          emptyState={{ icon: TicketIcon, title: "Sin tickets", description: "Creá uno desde «Nuevo ticket»." }}
        />
      </ListPageLayout>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo ticket</DialogTitle>
            <DialogDescription>Asunto y descripción del ticket.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">{error}</p>
            )}
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input id="subject" name="subject" required placeholder="Resumen del ticket" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <select
                  id="priority"
                  name="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue="medium"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selected && (
        <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setSelected(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle del ticket</DialogTitle>
              <DialogDescription>Revisá el contenido y actualizá el estado.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}
              <div className="space-y-1">
                <Label>Asunto</Label>
                <p className="text-sm font-medium text-foreground">{selected.subject}</p>
              </div>
              <div className="space-y-1">
                <Label>Descripción</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selected.description || "—"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>Prioridad</Label>
                  <Badge variant={getStatusVariant(selected.priority)}>
                    {getStatusLabel(selected.priority) ?? selected.priority}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label>Estado</Label>
                  <Badge variant={getStatusVariant(selected.status)}>
                    {getStatusLabel(selected.status) ?? selected.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label>Creado</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selected.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            </div>
            {canUpdateStatus && (
              <DialogFooter>
                <Button
                  type="button"
                  variant={selected.status === "open" ? "default" : "outline"}
                  disabled={loading || selected.status === "open"}
                  onClick={() => handleStatusChange("open")}
                >
                  Abrir
                </Button>
                <Button
                  type="button"
                  variant={selected.status === "in_progress" ? "default" : "outline"}
                  disabled={loading || selected.status === "in_progress"}
                  onClick={() => handleStatusChange("in_progress")}
                >
                  En progreso
                </Button>
                <Button
                  type="button"
                  variant={selected.status === "resolved" ? "default" : "outline"}
                  disabled={loading || selected.status === "resolved"}
                  onClick={() => handleStatusChange("resolved")}
                >
                  Resuelto
                </Button>
                <Button
                  type="button"
                  variant={selected.status === "closed" ? "default" : "outline"}
                  disabled={loading || selected.status === "closed"}
                  onClick={() => handleStatusChange("closed")}
                >
                  Cerrado
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
