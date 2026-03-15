"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInventoryItem, updateInventoryItem, type CreateInventoryItemInput } from "@/actions/inventory";
import type { InventoryItem } from "@prisma/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit: (InventoryItem & { lot?: { code: string } }) | null;
  lots: { id: string; code: string }[];
  locations: { id: string; name: string }[];
  canCreate: boolean;
  canAdjust: boolean;
};

export function InventoryItemFormDialog({ open, onOpenChange, onSuccess, edit, lots, locations, canCreate, canAdjust }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lotId, setLotId] = useState(edit?.lotId ?? "");
  const [locationId, setLocationId] = useState(edit?.locationId ?? "");
  const [status, setStatus] = useState<"active" | "inactive">((edit?.status as "active" | "inactive") ?? "active");

  useEffect(() => {
    if (open) {
      setLotId(edit?.lotId ?? "");
      setLocationId(edit?.locationId ?? "");
      setStatus((edit?.status as "active" | "inactive") ?? "active");
    }
  }, [open, edit?.lotId, edit?.locationId, edit?.status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const code = String(formData.get("code") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim() || null;
    const unit = String(formData.get("unit") ?? "").trim() || null;
    const quantityCurrent = Number(formData.get("quantityCurrent")) || 0;

    if (edit) {
      if (!canAdjust) {
        setLoading(false);
        setError("No tenés permiso para editar ítems");
        return;
      }
      const result = await updateInventoryItem(edit.id, {
        code: code || undefined,
        type,
        unit,
        quantityCurrent,
        status,
        locationId: locationId || null,
      });
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      if (!canCreate) {
        setLoading(false);
        setError("No tenés permiso para crear ítems");
        return;
      }
      if (!lotId) {
        setLoading(false);
        setError("Seleccioná un lote");
        return;
      }
      const result = await createInventoryItem({
        lotId,
        code,
        type,
        unit,
        quantityCurrent,
        locationId: locationId || null,
      });
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    }
    onOpenChange(false);
    onSuccess();
  }

  const isEdit = !!edit;
  if (isEdit && !canAdjust) return null;
  if (!isEdit && !canCreate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ítem" : "Nuevo ítem de inventario"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modificá código, cantidad o estado." : "Asociá el ítem a un lote. El código puede repetirse en distintos lotes."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md mb-4">{error}</p>}
          <div className="grid gap-4 py-4">
            {!isEdit && (
              <div className="space-y-2">
                <Label>Lote *</Label>
                <Select value={lotId} onValueChange={setLotId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" required defaultValue={edit?.code} placeholder="Ej. ITEM-001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Input id="type" name="type" defaultValue={edit?.type ?? undefined} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" name="unit" defaultValue={edit?.unit ?? undefined} placeholder="kg, u" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityCurrent">Cantidad actual</Label>
              <Input
                id="quantityCurrent"
                name="quantityCurrent"
                type="number"
                min={0}
                step="any"
                defaultValue={edit ? String(edit.quantityCurrent) : "0"}
              />
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Select value={locationId || "none"} onValueChange={(v) => setLocationId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin ubicación</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
