"use client";

import { useMemo, useState } from "react";
import type { MembershipPayment } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ListPageLayout } from "@/components/list-page-layout";
import { ExportButtons } from "@/components/export-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentForm } from "@/features/payments/payment-form";
import { CreditCard } from "lucide-react";

type Row = MembershipPayment & {
  memberName: string;
  memberNumber: string;
};

type Props = {
  payments: Row[];
  canCreate: boolean;
  members: { id: string; name: string; memberNumber: string }[];
  currency: string;
};

export function PaymentsTable({ payments, canCreate, members, currency }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return payments;
    return payments.filter((p) => {
      const hay = [
        p.memberNumber,
        p.memberName,
        p.method ?? "",
        p.reference ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [payments, q]);

  const columns: DataTableColumn<Row>[] = [
    { key: "paidAt", header: "Fecha", render: (p) => new Date(p.paidAt).toLocaleDateString("es-AR") },
    { key: "memberNumber", header: "Socio", render: (p) => `${p.memberNumber} · ${p.memberName}` },
    { key: "amount", header: "Monto", render: (p) => `${p.amount.toString()} ${p.currency}` },
    { key: "method", header: "Método", render: (p) => <Badge variant="secondary">{p.method ?? "—"}</Badge> },
    { key: "reference", header: "Referencia", render: (p) => p.reference ?? "—" },
  ];

  const exportData = filtered.map((p) => ({
    id: p.id,
    paidAt: p.paidAt instanceof Date ? p.paidAt.toISOString() : String(p.paidAt),
    memberNumber: p.memberNumber,
    memberName: p.memberName,
    amount: p.amount.toString(),
    currency: p.currency,
    method: p.method ?? "",
    reference: p.reference ?? "",
  }));

  return (
    <>
      <ListPageLayout
        title="Pagos"
        description="Registro y control de pagos de membresías."
        actions={
          <>
            <ExportButtons data={exportData} filename="pagos" />
            {canCreate && (
              <Button onClick={() => setOpen(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Nuevo pago
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(p) => p.id}
          emptyMessage="No hay pagos registrados."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por socio, método o referencia…"
                className="sm:max-w-sm"
              />
              <span className="text-xs text-muted-foreground">
                {filtered.length} resultado(s)
              </span>
            </div>
          }
        />
      </ListPageLayout>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pago</DialogTitle>
            <DialogDescription>Registrá un pago de membresía para un socio.</DialogDescription>
          </DialogHeader>
          <PaymentForm
            members={members}
            currency={currency}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
