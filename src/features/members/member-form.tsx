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
import { createMember, updateMember, type CreateMemberInput, type UpdateMemberInput } from "@/actions/members";
import type { Member } from "@prisma/client";
import { cn } from "@/lib/utils";
import { User, FileCheck, CreditCard } from "lucide-react";

type MembershipPlanOption = { id: string; name: string };

type Props = {
  tenantSlug: string;
  membershipPlans: MembershipPlanOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit?: Member | null;
};

const statusOptions = [
  { value: "pending_validation", label: "Pendiente de validación" },
  { value: "active", label: "Activo" },
  { value: "suspended", label: "Suspendido" },
  { value: "inactive", label: "Inactivo" },
  { value: "rejected", label: "Rechazado" },
];

type TabId = "datos" | "reprocann" | "membresia";

export function MemberFormDialog({ tenantSlug, membershipPlans, open, onOpenChange, onSuccess, edit }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabId>("datos");
  const toDateInput = (value?: Date | string | null) =>
    value ? new Date(value).toISOString().slice(0, 10) : "";

  const normalizeDecimalString = (raw: string): string | undefined => {
    const v = raw.trim();
    if (!v) return undefined;
    return v.replace(",", ".");
  };

  const parseMembershipRecurrenceDay = (raw: string): number | undefined => {
    const v = raw.trim();
    if (!v) return undefined;
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined;
    if (n < 1 || n > 28) return undefined;
    return n;
  };

  const editWithPlanId = edit as (Member & { membershipPlanId?: string | null }) | null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const raw = (name: string) => formData.get(name);
    const has = (name: string) => raw(name) !== null;
    const str = (name: string) => (raw(name) == null ? "" : String(raw(name)));
    const trim = (name: string) => str(name).trim();
    const optTrim = (name: string) => {
      if (!has(name)) return undefined;
      const v = trim(name);
      return v ? v : undefined;
    };

    // En modo edición (solapas), solo enviamos campos presentes para evitar "" que rompe validaciones.
    if (edit) {
      const payload: UpdateMemberInput = {};

      if (has("status")) payload.status = (str("status") as UpdateMemberInput["status"]) || undefined;
      if (has("firstName")) payload.firstName = optTrim("firstName");
      if (has("lastName")) payload.lastName = optTrim("lastName");
      if (has("email")) payload.email = optTrim("email");
      if (has("phone")) payload.phone = optTrim("phone");
      if (has("documentType")) payload.documentType = optTrim("documentType");
      if (has("documentNumber")) payload.documentNumber = optTrim("documentNumber");
      if (has("birthDate")) payload.birthDate = optTrim("birthDate");
      if (has("address")) payload.address = optTrim("address");
      if (has("city")) payload.city = optTrim("city");
      if (has("stateOrProvince")) payload.stateOrProvince = optTrim("stateOrProvince");
      if (has("country")) payload.country = optTrim("country");
      if (has("emergencyContactName")) payload.emergencyContactName = optTrim("emergencyContactName");
      if (has("emergencyContactPhone")) payload.emergencyContactPhone = optTrim("emergencyContactPhone");
      if (has("statusReason")) payload.statusReason = optTrim("statusReason");

      if (has("reprocannNumber")) payload.reprocannNumber = optTrim("reprocannNumber");
      if (has("reprocannAffiliateNumber")) payload.reprocannAffiliateNumber = optTrim("reprocannAffiliateNumber");
      if (has("reprocannStartDate")) payload.reprocannStartDate = optTrim("reprocannStartDate");
      if (has("reprocannEndDate")) payload.reprocannEndDate = optTrim("reprocannEndDate");
      if (has("reprocannActive")) payload.reprocannActive = str("reprocannActive") === "active";

      if (has("membershipPlanId")) payload.membershipPlanId = trim("membershipPlanId") || null;
      if (has("membershipRecurring")) payload.membershipRecurring = str("membershipRecurring") === "true";
      if (has("membershipRecurrenceDay")) {
        payload.membershipRecurrenceDay = parseMembershipRecurrenceDay(trim("membershipRecurrenceDay"));
      }
      if (has("membershipLastPaidAt")) payload.membershipLastPaidAt = optTrim("membershipLastPaidAt");
      if (has("membershipLastAmount")) {
        payload.membershipLastAmount = normalizeDecimalString(optTrim("membershipLastAmount") ?? "");
      }
      if (has("membershipCurrency")) payload.membershipCurrency = optTrim("membershipCurrency");

      const result = await updateMember(edit.id, payload);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onSuccess();
      return;
    }

    // Alta: requeridos sí o sí
    const payload: CreateMemberInput = {
      memberNumber: trim("memberNumber"),
      firstName: trim("firstName"),
      lastName: trim("lastName"),
      email: optTrim("email"),
      phone: optTrim("phone"),
      documentType: optTrim("documentType"),
      documentNumber: optTrim("documentNumber"),
      status: (str("status") as CreateMemberInput["status"]) || "active",
      birthDate: optTrim("birthDate"),
      address: optTrim("address"),
      city: optTrim("city"),
      stateOrProvince: optTrim("stateOrProvince"),
      country: optTrim("country"),
      emergencyContactName: optTrim("emergencyContactName"),
      emergencyContactPhone: optTrim("emergencyContactPhone"),
      statusReason: optTrim("statusReason"),
      reprocannNumber: optTrim("reprocannNumber"),
      reprocannAffiliateNumber: optTrim("reprocannAffiliateNumber"),
      reprocannStartDate: optTrim("reprocannStartDate"),
      reprocannEndDate: optTrim("reprocannEndDate"),
      reprocannActive: str("reprocannActive") === "active",
      membershipPlanId: trim("membershipPlanId") || null,
      membershipRecurring: str("membershipRecurring") === "true",
      membershipRecurrenceDay: parseMembershipRecurrenceDay(trim("membershipRecurrenceDay")),
      membershipLastPaidAt: optTrim("membershipLastPaidAt"),
      membershipLastAmount: normalizeDecimalString(optTrim("membershipLastAmount") ?? ""),
      membershipCurrency: optTrim("membershipCurrency"),
    };

    const result = await createMember(payload);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSuccess();
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "datos", label: "Datos personales", icon: <User className="h-4 w-4" /> },
    { id: "reprocann", label: "Reprocann", icon: <FileCheck className="h-4 w-4" /> },
    { id: "membresia", label: "Membresía", icon: <CreditCard className="h-4 w-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{edit ? "Editar socio" : "Nuevo socio"}</DialogTitle>
          <DialogDescription>
            {edit ? "Modificá los datos del socio." : "Completá los datos para dar de alta un socio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">
              {error}
            </p>
          )}
          <div className="flex gap-1 border-b mb-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-md transition-colors",
                  tab === t.id
                    ? "bg-primary/10 text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto py-2 min-h-0 flex-1 max-h-[50vh]">
            {tab === "datos" && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberNumber">Número de socio</Label>
                    <Input
                      id="memberNumber"
                      name="memberNumber"
                      required
                      defaultValue={edit?.memberNumber}
                      placeholder="SOC-001"
                      disabled={!!edit}
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
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input id="firstName" name="firstName" required defaultValue={edit?.firstName} placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" name="lastName" required defaultValue={edit?.lastName} placeholder="Pérez" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={edit?.email ?? ""} placeholder="socio@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" defaultValue={edit?.phone ?? ""} placeholder="+54 11 1234-5678" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Tipo doc.</Label>
                    <Input id="documentType" name="documentType" defaultValue={edit?.documentType ?? ""} placeholder="DNI" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Número doc.</Label>
                    <Input id="documentNumber" name="documentNumber" defaultValue={edit?.documentNumber ?? ""} placeholder="12345678" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                  <Input id="birthDate" name="birthDate" type="date" defaultValue={toDateInput(edit?.birthDate)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" name="address" defaultValue={edit?.address ?? ""} placeholder="Calle 123" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" name="city" defaultValue={edit?.city ?? ""} placeholder="CABA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateOrProvince">Provincia / Estado</Label>
                    <Input id="stateOrProvince" name="stateOrProvince" defaultValue={edit?.stateOrProvince ?? ""} placeholder="CABA" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input id="country" name="country" defaultValue={edit?.country ?? ""} placeholder="Argentina" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Contacto de emergencia (nombre)</Label>
                    <Input id="emergencyContactName" name="emergencyContactName" defaultValue={edit?.emergencyContactName ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Contacto de emergencia (tel.)</Label>
                    <Input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={edit?.emergencyContactPhone ?? ""} />
                  </div>
                </div>
                {edit && (
                  <div className="space-y-2">
                    <Label htmlFor="statusReason">Motivo del estado (opcional)</Label>
                    <Input id="statusReason" name="statusReason" defaultValue={edit?.statusReason ?? ""} placeholder="Ej. Documentación pendiente" />
                  </div>
                )}
              </div>
            )}

            {tab === "reprocann" && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                <p className="text-sm font-medium text-foreground">Reprocann</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reprocannNumber">Nº Reprocann</Label>
                    <Input id="reprocannNumber" name="reprocannNumber" defaultValue={edit?.reprocannNumber ?? ""} placeholder="RPR-12345" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reprocannAffiliateNumber">Nº de afiliado</Label>
                    <Input id="reprocannAffiliateNumber" name="reprocannAffiliateNumber" defaultValue={edit?.reprocannAffiliateNumber ?? ""} placeholder="AFI-00981" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reprocannStartDate">Inicio</Label>
                    <Input id="reprocannStartDate" name="reprocannStartDate" type="date" defaultValue={toDateInput(edit?.reprocannStartDate)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reprocannEndDate">Vencimiento</Label>
                    <Input id="reprocannEndDate" name="reprocannEndDate" type="date" defaultValue={toDateInput(edit?.reprocannEndDate)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reprocannActive">Estado Reprocann</Label>
                  <select
                    id="reprocannActive"
                    name="reprocannActive"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={edit?.reprocannActive ? "active" : "inactive"}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
            )}

            {tab === "membresia" && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                <p className="text-sm font-medium text-foreground">Membresía</p>
                <div className="space-y-2">
                  <Label htmlFor="membershipPlanId">Plan</Label>
                  <select
                    id="membershipPlanId"
                    name="membershipPlanId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={editWithPlanId?.membershipPlanId ?? ""}
                  >
                    <option value="">Sin plan</option>
                    {membershipPlans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {membershipPlans.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Creá planes en el módulo <strong>Membresías</strong> del menú para asignarlos aquí.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="membershipCurrency">Moneda</Label>
                    <Input id="membershipCurrency" name="membershipCurrency" defaultValue={edit?.membershipCurrency ?? "ARS"} placeholder="ARS" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="membershipRecurring">Recurrente</Label>
                    <select
                      id="membershipRecurring"
                      name="membershipRecurring"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      defaultValue={edit?.membershipRecurring ? "true" : "false"}
                    >
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="membershipRecurrenceDay">Día de cobro</Label>
                    <Input
                      id="membershipRecurrenceDay"
                      name="membershipRecurrenceDay"
                      type="number"
                      min={1}
                      max={28}
                      step={1}
                      defaultValue={edit?.membershipRecurrenceDay ?? ""}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="membershipLastPaidAt">Último pago</Label>
                    <Input id="membershipLastPaidAt" name="membershipLastPaidAt" type="date" defaultValue={toDateInput(edit?.membershipLastPaidAt)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="membershipLastAmount">Monto último pago</Label>
                  <Input
                    id="membershipLastAmount"
                    name="membershipLastAmount"
                    type="number"
                    step="0.01"
                    defaultValue={edit?.membershipLastAmount?.toString?.() ?? ""}
                    placeholder="25000"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : edit ? "Guardar" : "Crear socio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
