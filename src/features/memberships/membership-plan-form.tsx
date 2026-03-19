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
import type { MembershipLimitRule, MembershipPlan } from "@prisma/client";

type PlanWithRules = MembershipPlan & { limitRules: MembershipLimitRule[] };

type Props = {
  tenantSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit?: PlanWithRules | null;
};

export function MembershipPlanFormDialog({ tenantSlug, open, onOpenChange, onSuccess, edit }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("");
  const [status, setStatus] = useState<string>("active");
  const [validityType, setValidityType] = useState<string>("recurrent");

  const [plantMonthlyLimit, setPlantMonthlyLimit] = useState<string>("");
  const [plantDailyLimit, setPlantDailyLimit] = useState<string>("");
  const [plantUnit, setPlantUnit] = useState<string>("g");
  const [plantActive, setPlantActive] = useState<boolean>(true);

  const [extractMonthlyLimit, setExtractMonthlyLimit] = useState<string>("");
  const [extractDailyLimit, setExtractDailyLimit] = useState<string>("");
  const [extractUnit, setExtractUnit] = useState<string>("g");
  const [extractActive, setExtractActive] = useState<boolean>(true);

  const parseRecurrenceDay = (raw: string): number | undefined => {
    const v = raw.trim();
    if (!v) return undefined;
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined;
    if (n < 1 || n > 28) return undefined;
    return n;
  };

  const normalizeDecimalString = (raw: string): string | undefined => {
    const v = raw.trim();
    if (!v) return undefined;
    // Soporte para coma decimal (ej. "30,5" -> "30.5").
    // No removemos separadores de miles para no alterar la intención del usuario.
    return v.replace(",", ".");
  };

  const parseRenewalEveryDays = (raw: string): string | undefined => {
    const v = raw.trim();
    if (!v) return undefined;
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined;
    if (n < 1) return undefined;
    return String(n);
  };

  useEffect(() => {
    if (open) {
      const ext = edit as unknown as
        | (PlanWithRules & { validityType?: string; monthlyLimit?: number | null; dailyLimit?: number | null })
        | null;

      setSortOrder(ext?.sortOrder != null ? String(ext.sortOrder) : "");
      setStatus(ext?.status ?? "active");
      setValidityType(ext?.validityType ?? "recurrent");

      const rules = ext?.limitRules ?? [];
      const plantRule = rules.find((r) => r.category === "plant_material");
      const extractRule = rules.find((r) => r.category === "extract");

      const plantFallbackMonthly = ext?.monthlyLimit != null ? String(ext.monthlyLimit) : "";
      const plantFallbackDaily = ext?.dailyLimit != null ? String(ext.dailyLimit) : "";

      setPlantActive(plantRule?.active ?? true);
      setPlantMonthlyLimit(plantRule?.monthlyLimit != null ? String(plantRule.monthlyLimit) : plantFallbackMonthly);
      setPlantDailyLimit(plantRule?.dailyLimit != null ? String(plantRule.dailyLimit) : plantFallbackDaily);
      setPlantUnit(plantRule?.unit ?? "g");

      // Para extract, mantenemos fallback desde los campos globales del plan por compatibilidad transitoria.
      const extractFallbackMonthly = ext?.monthlyLimit != null ? String(ext.monthlyLimit) : "";
      const extractFallbackDaily = ext?.dailyLimit != null ? String(ext.dailyLimit) : "";

      setExtractActive(extractRule?.active ?? true);
      setExtractMonthlyLimit(
        extractRule?.monthlyLimit != null ? String(extractRule.monthlyLimit) : extractFallbackMonthly
      );
      setExtractDailyLimit(
        extractRule?.dailyLimit != null ? String(extractRule.dailyLimit) : extractFallbackDaily
      );
      setExtractUnit(extractRule?.unit ?? "g");
    }
  }, [open, edit]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const toNullableInt = (raw: string): number | null => {
      const v = raw.trim();
      if (!v) return null;
      const n = Number(v.replace(",", "."));
      if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
      return n;
    };

    const payload: CreateMembershipPlanInput = {
      name: (formData.get("name") as string).trim(),
      description: (formData.get("description") as string).trim() || undefined,
      price: normalizeDecimalString(String(formData.get("price") ?? "")),
      currency: (formData.get("currency") as string).trim() || "ARS",
      recurrenceDay: parseRecurrenceDay(String(formData.get("recurrenceDay") ?? "")),
      // Compatibilidad transitoria: los límites globales del plan se toman del editor de «Materia vegetal».
      monthlyLimit: normalizeDecimalString(plantMonthlyLimit),
      dailyLimit: normalizeDecimalString(plantDailyLimit),
      sortOrder: toNullableInt(sortOrder),
      limitRules: {
        plant_material: {
          monthlyLimit: normalizeDecimalString(plantMonthlyLimit),
          dailyLimit: normalizeDecimalString(plantDailyLimit),
          unit: plantUnit,
          active: plantActive,
        },
        extract: {
          monthlyLimit: normalizeDecimalString(extractMonthlyLimit),
          dailyLimit: normalizeDecimalString(extractDailyLimit),
          unit: extractUnit,
          active: extractActive,
        },
      },
      validityType: (validityType || "recurrent") as "recurrent" | "fixed_end",
      validUntil:
        validityType === "fixed_end"
          ? ((formData.get("validUntil") as string)?.trim() || undefined)
          : undefined,
      requiresRenewal: !!formData.get("requiresRenewal"),
      renewalEveryDays: parseRenewalEveryDays(String(formData.get("renewalEveryDays") ?? "")),
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
                  <div className="grid grid-cols-1 gap-4">
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

                  <div>
                    <Label htmlFor="sortOrder">Orden (opcional)</Label>
                    <Input
                      id="sortOrder"
                      name="sortOrder"
                      type="number"
                      step={1}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      placeholder="Ej. 1"
                      className={fieldClass}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Si no se define, se ordena por nombre.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Bloque 2: Precio y cobro + Límites en una fila */}
              <Card className="border-border bg-muted/20 shadow-none">
                <CardHeader className="py-3 px-4">
                  <h3 className="text-sm font-semibold text-foreground">Precio, cobro y límites</h3>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                        step={1}
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
                  </div>
                </CardContent>
              </Card>

              {/* Bloque 2b: Límites por categoría */}
              <Card className="border-border bg-muted/20 shadow-none">
                <CardHeader className="py-3 px-4">
                  <h3 className="text-sm font-semibold text-foreground">Límites por categoría</h3>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Materia vegetal</h4>
                        <span className="text-xs text-muted-foreground">plant_material</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="plantMonthlyLimit">Mensual</Label>
                          <Input
                            id="plantMonthlyLimit"
                            type="number"
                            step="0.01"
                            value={plantMonthlyLimit}
                            onChange={(e) => setPlantMonthlyLimit(e.target.value)}
                            placeholder="30"
                            className={fieldClass}
                          />
                        </div>
                        <div>
                          <Label htmlFor="plantDailyLimit">Diario</Label>
                          <Input
                            id="plantDailyLimit"
                            type="number"
                            step="0.01"
                            value={plantDailyLimit}
                            onChange={(e) => setPlantDailyLimit(e.target.value)}
                            placeholder="1"
                            className={fieldClass}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Unidad</Label>
                          <Select value={plantUnit} onValueChange={setPlantUnit}>
                            <SelectTrigger className={fieldClass + " w-full"}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="unit">unidad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Activa</Label>
                        <Select
                          value={plantActive ? "active" : "inactive"}
                          onValueChange={(v) => setPlantActive(v === "active")}
                        >
                          <SelectTrigger className={fieldClass + " w-full"}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Sí</SelectItem>
                            <SelectItem value="inactive">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Extracto</h4>
                        <span className="text-xs text-muted-foreground">extract</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="extractMonthlyLimit">Mensual</Label>
                          <Input
                            id="extractMonthlyLimit"
                            type="number"
                            step="0.01"
                            value={extractMonthlyLimit}
                            onChange={(e) => setExtractMonthlyLimit(e.target.value)}
                            placeholder="30"
                            className={fieldClass}
                          />
                        </div>
                        <div>
                          <Label htmlFor="extractDailyLimit">Diario</Label>
                          <Input
                            id="extractDailyLimit"
                            type="number"
                            step="0.01"
                            value={extractDailyLimit}
                            onChange={(e) => setExtractDailyLimit(e.target.value)}
                            placeholder="1"
                            className={fieldClass}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Unidad</Label>
                          <Select value={extractUnit} onValueChange={setExtractUnit}>
                            <SelectTrigger className={fieldClass + " w-full"}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="unit">unidad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Activa</Label>
                        <Select
                          value={extractActive ? "active" : "inactive"}
                          onValueChange={(v) => setExtractActive(v === "active")}
                        >
                          <SelectTrigger className={fieldClass + " w-full"}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Sí</SelectItem>
                            <SelectItem value="inactive">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Las reglas activas se usan como fuente principal. Mientras tanto, si faltan reglas para una categoría, se usa el fallback viejo del plan.
                  </p>
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
