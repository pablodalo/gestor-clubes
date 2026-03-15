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
import { createDevice, updateDevice, type CreateDeviceInput } from "@/actions/devices";
import type { Device } from "@prisma/client";

type Props = {
  tenantSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit: Device | null;
  locationOptions: { id: string; name: string }[];
};

const statusOptions = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "maintenance", label: "Mantenimiento" },
];

export function DeviceFormDialog({ tenantSlug, open, onOpenChange, onSuccess, edit, locationOptions }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(edit?.status ?? "active");
  const [locationId, setLocationId] = useState(edit?.locationId ?? "");

  useEffect(() => {
    if (open) {
      setStatus(edit?.status ?? "active");
      setLocationId(edit?.locationId ?? "");
    }
  }, [open, edit?.status, edit?.locationId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload: CreateDeviceInput = {
      name: String(formData.get("name") ?? "").trim(),
      type: String(formData.get("type") ?? "").trim() || null,
      brand: String(formData.get("brand") ?? "").trim() || null,
      model: String(formData.get("model") ?? "").trim() || null,
      serialNumber: String(formData.get("serialNumber") ?? "").trim() || null,
      connectorType: String(formData.get("connectorType") ?? "").trim() || null,
      locationId: locationId || null,
      status: status as "active" | "inactive" | "maintenance",
    };
    if (edit) {
      const result = await updateDevice(edit.id, payload);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const result = await createDevice(payload);
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
          <DialogTitle>{edit ? "Editar dispositivo" : "Nuevo dispositivo"}</DialogTitle>
          <DialogDescription>
            Dispositivos del club (balanzas, sensores, etc.). Opcional: tipo, marca, modelo, ubicación.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md mb-4">{error}</p>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={edit?.name}
                placeholder="Ej. Balanza depósito"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Input
                id="type"
                name="type"
                defaultValue={edit?.type ?? undefined}
                placeholder="Ej. scale, sensor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" name="brand" defaultValue={edit?.brand ?? undefined} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" name="model" defaultValue={edit?.model ?? undefined} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Número de serie</Label>
              <Input id="serialNumber" name="serialNumber" defaultValue={edit?.serialNumber ?? undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Ubicación</Label>
              <Select
                value={locationId || "none"}
                onValueChange={(v) => setLocationId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin ubicación</SelectItem>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : edit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
