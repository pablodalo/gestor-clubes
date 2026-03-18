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

  const inputClass = cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
    "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{edit ? "Editar plan" : "Nuevo plan de membresía"}</DialogTitle>
          <DialogDescription>
            {edit ? "Modificá los datos del plan." : "Completá los datos del plan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {error && (
            <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive flex-shrink-0">
              {error}
            </p>
          )}
          <div className="overflow-y-auto flex-1 pr-1 space-y-5">
            {/* Fila 1: Identidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nombre del plan</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={edit?.name}
                  placeholder="Ej. Flores + Extractos"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tier</Label>
                <Select value={tier || "none"} onValueChange={(v) => setTier(v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1 w-full">
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
              <div className="sm:col-span-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={edit?.description ?? ""}
                  placeholder="Ej. Incluye 30g flores y 10g extractos/mes"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Fila 2: Precio y cobro */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio y cobro</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={edit?.price != null ? String(edit.price) : ""}
                  placeholder="25000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Input
                  id="currency"
                  name="currency"
                  defaultValue={edit?.currency ?? "ARS"}
                  placeholder="ARS"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="recurrenceDay">Día de cobro (1-28)</Label>
                <Input
                  id="recurrenceDay"
                  name="recurrenceDay"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={edit?.recurrenceDay ?? ""}
                  placeholder="10"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Fila 3: Límites */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Límites de consumo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyLimit">Límite mensual</Label>
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
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dailyLimit">Límite diario</Label>
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
                  className="mt-1"
                />
              </div>
            </div>

            {/* Fila 4: Vigencia y renovación */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vigencia y renovación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validityType">Tipo de vigencia</Label>
                <select
                  id="validityType"
                  name="validityType"
                  className={cn(inputClass, "mt-1")}
                  defaultValue={
                    (edit as unknown as { validityType?: string })?.validityType ?? "recurrent"
                  }
                >
                  <option value="recurrent">Recurrente (sin fecha de fin)</option>
                  <option value="fixed_end">Con fecha de caducidad</option>
                </select>
              </div>
              <div>
                <Label htmlFor="validUntil">Fecha de caducidad</Label>
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="date"
                  defaultValue={
                    (edit as unknown as { validUntil?: Date | null })?.validUntil
                      ? new Date((edit as any).validUntil).toISOString().slice(0, 10)
                      : ""
                  }
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="requiresRenewal"
                    name="requiresRenewal"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    defaultChecked={
                      (edit as unknown as { requiresRenewal?: boolean })?.requiresRenewal ?? false
                    }
                  />
                  <span className="text-sm">Requiere renovación</span>
                </label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="renewalEveryDays" className="text-sm font-normal">Cada</Label>
                  <Input
                    id="renewalEveryDays"
                    name="renewalEveryDays"
                    type="number"
                    min={1}
                    className="w-20 h-9"
                    defaultValue={
                      (edit as unknown as { renewalEveryDays?: number | null })?.renewalEveryDays ?? ""
                    }
                    placeholder="30"
                  />
                  <span className="text-sm text-muted-foreground">días</span>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50">
              <Label className="text-sm font-medium">Estado del plan</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
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
