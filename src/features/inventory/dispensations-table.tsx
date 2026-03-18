"use client";

import { useMemo, useState } from "react";
import type { Dispensation } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
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
import { DispensationForm } from "@/features/inventory/dispensation-form";
import { PackageMinus } from "lucide-react";

type Row = Dispensation & {
  memberName: string;
  memberNumber: string;
  productCategory: string | null;
  productStrainName: string | null;
};

type Props = {
  rows: Row[];
  canCreate: boolean;
  members: { id: string; label: string }[];
  products: { id: string; label: string }[];
};

export function DispensationsTable({ rows, canCreate, members, products }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
      const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) => {
      const hay = [
        d.memberNumber,
        d.memberName,
          d.productCategory ?? "",
          d.productStrainName ?? "",
        d.note ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q]);

  const columns: DataTableColumn<Row>[] = [
    { key: "dispensedAt", header: "Fecha", render: (d) => new Date(d.dispensedAt).toLocaleDateString("es-AR") },
    { key: "memberNumber", header: "Socio", render: (d) => `${d.memberNumber} · ${d.memberName}` },
    { key: "productStrainName", header: "Cepa", render: (d) => d.productStrainName ?? "—" },
    {
      key: "productCategory",
      header: "Tipo",
      render: (d) => {
        const cat = d.productCategory;
        if (!cat) return "—";
        return cat === "plant_material" ? "plant_material" : cat === "extract" ? "extract" : cat;
      },
    },
    { key: "grams", header: "Gramos", render: (d) => d.grams.toString() },
  ];

  const exportData = filtered.map((d) => ({
    id: d.id,
    dispensedAt: d.dispensedAt instanceof Date ? d.dispensedAt.toISOString() : String(d.dispensedAt),
    memberNumber: d.memberNumber,
    memberName: d.memberName,
    strainName: d.productStrainName ?? "",
    category: d.productCategory ?? "",
    grams: d.grams.toString(),
    note: d.note ?? "",
  }));

  return (
    <>
      <ListPageLayout
        title="Dispensaciones"
        description="Registro de entrega a socios."
        actions={
          <>
            <ExportButtons data={exportData} filename="dispensaciones" />
            {canCreate && (
              <Button onClick={() => setOpen(true)}>
                <PackageMinus className="h-4 w-4 mr-2" />
                Nueva dispensación
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(d) => d.id}
          emptyMessage="Sin dispensaciones."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por socio, cepa, tipo o nota…"
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
            <DialogTitle>Nueva dispensación</DialogTitle>
            <DialogDescription>Registrá una salida de stock a un socio.</DialogDescription>
          </DialogHeader>
          <DispensationForm
            members={members}
            products={products}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
