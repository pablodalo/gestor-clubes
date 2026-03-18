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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  createMembershipPlan,
  updateMembershipPlan,
  type CreateMembershipPlanInput,
} from "@/actions/membership-plans";
import type { MembershipPlan } from "@prisma/client";

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
  const [tier, setTier] = useState<string>("BASICO");
  const [status, setStatus] = useState<string>("active");
  const [validityType, setValidityType] = useState<string>("recurrent");

  useEffect(() => {
    if (open) {
      const ext = edit as unknown as { tier?: string | null; validityType?: string };
      setTier(ext?.tier ?? "BASICO");
      setStatus(edit?.status ?? "active");
      setValidityType(ext?.validityType ?? "recurrent");
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
      validityType: (validityType || "recurrent") as "recurrent" | "fixed_end",
      validUntil:
        validityType === "fixed_end"
          ? ((formData.get("validUntil") as string)?.trim() || undefined)
          : undefined,
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

  const editExt = edit as unknown as {
    tier?: string | null;
    monthlyLimit?: number | null;
    dailyLimit?: number | null;
    validityType?: string;
    validUntil?: Date | null;
    requiresRenewal?: boolean;
    renewalEveryDays?: number | null;
  };

  const fieldClass = "mt-1.5";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-border bg-card shadow-xl rounded-xl">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-3">
          <DialogTitle className="text-xl">{edit ? "Editar plan" : "Nuevo plan de membresía"}</DialogTitle>
          <DialogDescription>
            {edit ? "Modificá los datos del plan." : "Completá los datos del plan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {error && (
            <p className="mx-6 mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex-shrink-0 border border-destructive/20">
              {error}
            </p>
          )}
          <div className="overflow-y-auto flex-1 px-6 pb-6 min-h-0">
            <div className="space-y-4">
              {/* Bloque 1: Datos del plan */}
              <Card className="border-border bg-muted/20 shadow-none">
                <CardHeader className="py-3 px-4">
                  <h3 className="text-sm font-semibold text-foreground">Datos del plan</h3>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4 space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      defaultValue={edit?.name}
                      placeholder="Ej. Flores + Extractos"
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tier</Label>
                      <Select value={tier || "none"} onValueChange={(v) => setTier(v === "none" ? "" : v)}>
                        <SelectTrigger className={fieldClass + " w-full"}>
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
                    <div>
                      <Label htmlFor="description">Descripción (opcional)</Label>
                      <Input
                        id="description"
                        name="description"
                        defaultValue={edit?.description ?? ""}
                        placeholder="Ej. 30g flores y 10g extractos/mes"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bloque 2: Precio y cobro + Límites en una fila */}
              <Card className="border-border bg-muted/20 shadow-none">
                <CardHeader className="py-3 px-4">
                  <h3 className="text-sm font-semibold text-foreground">Precio, cobro y límites</h3>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="price">Precio</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={edit?.price != null ? String(edit.price) : ""}
                        placeholder="25000"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Moneda</Label>
                      <Input
                        id="currency"
                        name="currency"
                        defaultValue={edit?.currency ?? "ARS"}
                        placeholder="ARS"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <Label htmlFor="recurrenceDay">Día de cobro</Label>
                      <Input
                        id="recurrenceDay"
                        name="recurrenceDay"
                        type="number"
                        min={1}
                        max={28}
                        defaultValue={edit?.recurrenceDay ?? ""}
                        placeholder="Entre 1 y 28"
                        className={fieldClass}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Día del mes que se factura el plan (1 a 28).
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="monthlyLimit">Límite mensual</Label>
                      <Input
                        id="monthlyLimit"
                        name="monthlyLimit"
                        type="number"
                        step="0.01"
                        defaultValue={editExt?.monthlyLimit != null ? String(editExt.monthlyLimit) : ""}
                        placeholder="30"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dailyLimit">Límite diario</Label>
                      <Input
                        id="dailyLimit"
                        name="dailyLimit"
                        type="number"
                        step="0.01"
                        defaultValue={editExt?.dailyLimit != null ? String(editExt.dailyLimit) : ""}
                        placeholder="1"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bloque 3: Vigencia y estado */}
              <Card className="border-border bg-muted/20 shadow-none">
                <CardHeader className="py-3 px-4">
                  <h3 className="text-sm font-semibold text-foreground">Vigencia y estado</h3>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label>Tipo de vigencia</Label>
                      <Select value={validityType} onValueChange={setValidityType}>
                        <SelectTrigger className={fieldClass + " w-full"}>
                          <SelectValue placeholder="Seleccioná una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recurrent">Recurrente (sin fecha de fin)</SelectItem>
                          <SelectItem value="fixed_end">Con fecha de caducidad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {validityType === "fixed_end" && (
                      <div>
                        <Label htmlFor="validUntil">Fecha de caducidad</Label>
                        <Input
                          id="validUntil"
                          name="validUntil"
                          type="date"
                          defaultValue={
                            editExt?.validUntil ? new Date(editExt.validUntil).toISOString().slice(0, 10) : ""
                          }
                          className={fieldClass}
                        />
                      </div>
                    )}
                    <div>
                      <Label>Estado del plan</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className={fieldClass + " w-full"}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground shrink-0">
                      <input
                        id="requiresRenewal"
                        name="requiresRenewal"
                        type="checkbox"
                        className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        defaultChecked={editExt?.requiresRenewal ?? false}
                      />
                      Renovación manual
                    </label>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">Recordar cada</span>
                      <Input
                        id="renewalEveryDays"
                        name="renewalEveryDays"
                        type="number"
                        min={1}
                        className="w-16 h-9"
                        defaultValue={editExt?.renewalEveryDays ?? ""}
                        placeholder="30"
                      />
                      <span className="whitespace-nowrap">días</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-border bg-muted/30 rounded-b-xl">
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
