"use client";

import { useState } from "react";
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
import { createLocation, updateLocation, type CreateLocationInput } from "@/actions/locations";
import type { Location } from "@prisma/client";

type Props = {
  tenantSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit?: Location | null;
  parentOptions?: { id: string; name: string }[];
};

const typeLabels: Record<string, string> = {
  zone: "Zona",
  building: "Edificio",
  room: "Sala / Habitación",
  shelf: "Estante",
};

export function LocationFormDialog({ tenantSlug, open, onOpenChange, onSuccess, edit, parentOptions = [] }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: CreateLocationInput = {
      name: (formData.get("name") as string).trim(),
      type: (formData.get("type") as CreateLocationInput["type"]),
      description: (formData.get("description") as string).trim() || undefined,
      parentLocationId: (formData.get("parentLocationId") as string) || null,
    };

    if (edit) {
      const result = await updateLocation(edit.id, payload);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const result = await createLocation(payload);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    }
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{edit ? "Editar ubicación" : "Nueva ubicación"}</DialogTitle>
          <DialogDescription>
            {edit ? "Modificá los datos de la ubicación." : "Definí una zona, edificio, sala o estante."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">
              {error}
            </p>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={edit?.name}
                placeholder="Depósito Central"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={edit?.type ?? "zone"}
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                defaultValue={edit?.description ?? ""}
                placeholder="Opcional"
              />
            </div>
            {parentOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parentLocationId">Ubicación padre</Label>
                <select
                  id="parentLocationId"
                  name="parentLocationId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={edit?.parentLocationId ?? ""}
                >
                  <option value="">Ninguna</option>
                  {parentOptions.filter((p) => p.id !== edit?.id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : edit ? "Guardar" : "Crear ubicación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
