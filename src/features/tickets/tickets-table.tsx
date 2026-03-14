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
import { createTicket } from "@/actions/tickets";
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

  const columns: DataTableColumn<Ticket>[] = [
    { key: "subject", header: "Asunto", render: (t) => <span className="font-medium text-foreground">{t.subject}</span> },
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
    </>
  );
}
