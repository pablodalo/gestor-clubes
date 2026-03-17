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
import {
  createMembershipPlan,
  updateMembershipPlan,
  type CreateMembershipPlanInput,
} from "@/actions/membership-plans";
import type { MembershipPlan } from "@prisma/client";

type Props = {
  tenantSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit?: MembershipPlan | null;
};

export function MembershipPlanFormDialog({ tenantSlug, open, onOpenChange, onSuccess, edit }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: CreateMembershipPlanInput = {
      name: (formData.get("name") as string).trim(),
      tier: (formData.get("tier") as string).trim() || undefined,
      description: (formData.get("description") as string).trim() || undefined,
      price: (formData.get("price") as string).trim() || undefined,
      currency: (formData.get("currency") as string).trim() || "ARS",
      recurrenceDay: (formData.get("recurrenceDay") as string).trim()
        ? Number(formData.get("recurrenceDay"))
        : undefined,
      monthlyLimit: (formData.get("monthlyLimit") as string).trim() || undefined,
      dailyLimit: (formData.get("dailyLimit") as string).trim() || undefined,
      status: (formData.get("status") as "active" | "inactive") || "active",
    };

    if (edit) {
      const result = await updateMembershipPlan(edit.id, payload);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const result = await createMembershipPlan(payload);
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
          <DialogTitle>{edit ? "Editar plan" : "Nuevo plan de membresía"}</DialogTitle>
          <DialogDescription>
            {edit ? "Modificá los datos del plan." : "Definí nombre, precio y día de cobro para el plan."}
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
                placeholder="Ej. Flores + Extractos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Tier (opcional)</Label>
              <Input
                id="tier"
                name="tier"
                defaultValue={(edit as unknown as { tier?: string | null })?.tier ?? ""}
                placeholder="Ej. básico / premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                name="description"
                defaultValue={edit?.description ?? ""}
                placeholder="Incluye 30g flores y 10g extractos/mes"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio (opcional)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={edit?.price != null ? String(edit.price) : ""}
                  placeholder="25000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input
                  id="currency"
                  name="currency"
                  defaultValue={edit?.currency ?? "ARS"}
                  placeholder="ARS"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurrenceDay">Día de cobro (1-28, opcional)</Label>
                <Input
                  id="recurrenceDay"
                  name="recurrenceDay"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={edit?.recurrenceDay ?? ""}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={edit?.status ?? "active"}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyLimit">Límite mensual (opcional)</Label>
                <Input
                  id="monthlyLimit"
                  name="monthlyLimit"
                  type="number"
                  step="0.01"
                  defaultValue={(edit as unknown as { monthlyLimit?: unknown })?.monthlyLimit != null ? String((edit as any).monthlyLimit) : ""}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Límite diario (opcional)</Label>
                <Input
                  id="dailyLimit"
                  name="dailyLimit"
                  type="number"
                  step="0.01"
                  defaultValue={(edit as unknown as { dailyLimit?: unknown })?.dailyLimit != null ? String((edit as any).dailyLimit) : ""}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : edit ? "Guardar" : "Crear plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
