"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

const TIER_OPTIONS = [
  { value: "", label: "Sin tier" },
  { value: "BASICO", label: "BASICO" },
  { value: "STANDARD", label: "STANDARD" },
  { value: "PREMIUM", label: "PREMIUM" },
] as const;

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
  const [tier, setTier] = useState<string>("");
  const [status, setStatus] = useState<string>("active");

  useEffect(() => {
    if (open) {
      setTier((edit as unknown as { tier?: string | null })?.tier ?? "");
      setStatus(edit?.status ?? "active");
    }
  }, [open, edit]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: CreateMembershipPlanInput = {
      name: (formData.get("name") as string).trim(),
      tier: tier.trim() || undefined,
      description: (formData.get("description") as string).trim() || undefined,
      price: (formData.get("price") as string).trim() || undefined,
      currency: (formData.get("currency") as string).trim() || "ARS",
      recurrenceDay: (formData.get("recurrenceDay") as string).trim()
        ? Number(formData.get("recurrenceDay"))
        : undefined,
      monthlyLimit: (formData.get("monthlyLimit") as string).trim() || undefined,
      dailyLimit: (formData.get("dailyLimit") as string).trim() || undefined,
      validityType: ((formData.get("validityType") as string) || "recurrent") as "recurrent" | "fixed_end",
      validUntil: (formData.get("validUntil") as string)?.trim() || undefined,
      requiresRenewal: !!formData.get("requiresRenewal"),
      renewalEveryDays: (formData.get("renewalEveryDays") as string).trim() || undefined,
      status: (status as "active" | "inactive") || "active",
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{edit ? "Editar plan" : "Nuevo plan de membresía"}</DialogTitle>
          <DialogDescription>
            {edit ? "Modificá los datos del plan." : "Definí nombre, precio y día de cobro para el plan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* 1. Identidad */}
            <section className={cn("space-y-3 rounded-lg border border-border/50 bg-muted/5 p-4")}>
              <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">Identidad</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="name">Nombre del plan</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={edit?.name}
                    placeholder="Ej. Flores + Extractos"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select value={tier || "none"} onValueChange={(v) => setTier(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || "none"} value={opt.value || "none"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={edit?.description ?? ""}
                    placeholder="Incluye 30g flores y 10g extractos/mes"
                  />
                </div>
              </div>
            </section>

            {/* 2. Precio y cobro */}
            <section className={cn("space-y-3 rounded-lg border border-border/50 bg-muted/5 p-4")}>
              <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">Precio y cobro</h3>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
            </section>

            {/* 3. Límites de consumo */}
            <section className={cn("space-y-3 rounded-lg border border-border/50 bg-muted/5 p-4")}>
              <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">Límites de consumo</h3>
              <p className="text-xs text-muted-foreground">
                El límite mensual del plan se usa como tope en la config. operativa del socio.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthlyLimit">Límite mensual (opcional)</Label>
                  <Input
                    id="monthlyLimit"
                    name="monthlyLimit"
                    type="number"
                    step="0.01"
                    defaultValue={
                      (edit as unknown as { monthlyLimit?: unknown })?.monthlyLimit != null
                        ? String((edit as any).monthlyLimit)
                        : ""
                    }
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
                    defaultValue={
                      (edit as unknown as { dailyLimit?: unknown })?.dailyLimit != null
                        ? String((edit as any).dailyLimit)
                        : ""
                    }
                    placeholder="1"
                  />
                </div>
              </div>
            </section>

            {/* 4. Vigencia */}
            <section className={cn("space-y-3 rounded-lg border border-border/50 bg-muted/5 p-4")}>
              <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">Vigencia</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="validityType">Tipo de vigencia</Label>
                  <select
                    id="validityType"
                    name="validityType"
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                      "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    )}
                    defaultValue={
                      (edit as unknown as { validityType?: string })?.validityType ?? "recurrent"
                    }
                  >
                    <option value="recurrent">Recurrente (sin fecha de fin)</option>
                    <option value="fixed_end">Con fecha de caducidad</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Fecha de caducidad (opcional)</Label>
                  <Input
                    id="validUntil"
                    name="validUntil"
                    type="date"
                    defaultValue={
                      (edit as unknown as { validUntil?: Date | null })?.validUntil
                        ? new Date((edit as any).validUntil).toISOString().slice(0, 10)
                        : ""
                    }
                  />
                </div>
              </div>
            </section>

            {/* 5. Renovación */}
            <section className={cn("space-y-3 rounded-lg border border-border/50 bg-muted/5 p-4")}>
              <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">Renovación</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="requiresRenewal"
                    name="requiresRenewal"
                    type="checkbox"
                    className="h-4 w-4"
                    defaultChecked={
                      (edit as unknown as { requiresRenewal?: boolean })?.requiresRenewal ?? false
                    }
                  />
                  <Label htmlFor="requiresRenewal" className="text-sm font-normal">
                    Requiere renovación
                  </Label>
                </div>
                <div className="space-y-1 min-w-[120px]">
                  <Label htmlFor="renewalEveryDays" className="text-xs">Cada cuántos días (opcional)</Label>
                  <Input
                    id="renewalEveryDays"
                    name="renewalEveryDays"
                    type="number"
                    min={1}
                    defaultValue={
                      (edit as unknown as { renewalEveryDays?: number | null })?.renewalEveryDays ??
                      ""
                    }
                    placeholder="30"
                  />
                </div>
              </div>
            </section>

            {/* 6. Estado del plan */}
            <section className={cn("space-y-3 rounded-lg border border-border/50 bg-muted/5 p-4")}>
              <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">Estado</h3>
              <div className="max-w-[200px]">
                <Label>Plan activo / inactivo</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
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
