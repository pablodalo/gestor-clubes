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
import { createMember, updateMember, type CreateMemberInput } from "@/actions/members";
import type { Member } from "@prisma/client";

type Props = {
  tenantSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit?: Member | null;
};

const statusOptions = [
  { value: "active", label: "Activo" },
  { value: "suspended", label: "Suspendido" },
  { value: "inactive", label: "Inactivo" },
];

export function MemberFormDialog({ tenantSlug, open, onOpenChange, onSuccess, edit }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toDateInput = (value?: Date | string | null) =>
    value ? new Date(value).toISOString().slice(0, 10) : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: CreateMemberInput = {
      memberNumber: (formData.get("memberNumber") as string).trim(),
      firstName: (formData.get("firstName") as string).trim(),
      lastName: (formData.get("lastName") as string).trim(),
      email: (formData.get("email") as string).trim() || undefined,
      phone: (formData.get("phone") as string).trim() || undefined,
      reprocannNumber: (formData.get("reprocannNumber") as string).trim() || undefined,
      reprocannAffiliateNumber: (formData.get("reprocannAffiliateNumber") as string).trim() || undefined,
      reprocannStartDate: (formData.get("reprocannStartDate") as string).trim() || undefined,
      reprocannEndDate: (formData.get("reprocannEndDate") as string).trim() || undefined,
      reprocannActive: (formData.get("reprocannActive") as string) === "active",
      membershipPlan: (formData.get("membershipPlan") as string).trim() || undefined,
      membershipRecurring: (formData.get("membershipRecurring") as string) === "true",
      membershipRecurrenceDay: Number(formData.get("membershipRecurrenceDay") as string) || undefined,
      membershipLastPaidAt: (formData.get("membershipLastPaidAt") as string).trim() || undefined,
      membershipLastAmount: (formData.get("membershipLastAmount") as string).trim() || undefined,
      membershipCurrency: (formData.get("membershipCurrency") as string).trim() || undefined,
      documentType: (formData.get("documentType") as string).trim() || undefined,
      documentNumber: (formData.get("documentNumber") as string).trim() || undefined,
      status: (formData.get("status") as CreateMemberInput["status"]) || "active",
    };

    if (edit) {
      const result = await updateMember(edit.id, payload);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const result = await createMember(payload);
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
          <DialogTitle>{edit ? "Editar socio" : "Nuevo socio"}</DialogTitle>
          <DialogDescription>
            {edit ? "Modificá los datos del socio." : "Completá los datos para dar de alta un socio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">
              {error}
            </p>
          )}
          <div className="grid gap-4 py-4">
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
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Reprocann</p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reprocannNumber">Nº Reprocann</Label>
                  <Input
                    id="reprocannNumber"
                    name="reprocannNumber"
                    defaultValue={edit?.reprocannNumber ?? ""}
                    placeholder="RPR-12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reprocannAffiliateNumber">Nº de afiliado</Label>
                  <Input
                    id="reprocannAffiliateNumber"
                    name="reprocannAffiliateNumber"
                    defaultValue={edit?.reprocannAffiliateNumber ?? ""}
                    placeholder="AFI-00981"
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reprocannStartDate">Inicio</Label>
                  <Input
                    id="reprocannStartDate"
                    name="reprocannStartDate"
                    type="date"
                    defaultValue={toDateInput(edit?.reprocannStartDate)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reprocannEndDate">Vencimiento</Label>
                  <Input
                    id="reprocannEndDate"
                    name="reprocannEndDate"
                    type="date"
                    defaultValue={toDateInput(edit?.reprocannEndDate)}
                  />
                </div>
              </div>
              <div className="mt-3 space-y-2">
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
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Membresía</p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="membershipPlan">Plan</Label>
                  <Input
                    id="membershipPlan"
                    name="membershipPlan"
                    defaultValue={edit?.membershipPlan ?? ""}
                    placeholder="Flores + Extractos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="membershipCurrency">Moneda</Label>
                  <Input
                    id="membershipCurrency"
                    name="membershipCurrency"
                    defaultValue={edit?.membershipCurrency ?? "ARS"}
                    placeholder="ARS"
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="membershipRecurrenceDay">Día de cobro</Label>
                  <Input
                    id="membershipRecurrenceDay"
                    name="membershipRecurrenceDay"
                    type="number"
                    min={1}
                    max={28}
                    defaultValue={edit?.membershipRecurrenceDay ?? ""}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="membershipLastPaidAt">Último pago</Label>
                  <Input
                    id="membershipLastPaidAt"
                    name="membershipLastPaidAt"
                    type="date"
                    defaultValue={toDateInput(edit?.membershipLastPaidAt)}
                  />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  defaultValue={edit?.firstName}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  defaultValue={edit?.lastName}
                  placeholder="Pérez"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={edit?.email ?? ""}
                placeholder="socio@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={edit?.phone ?? ""} placeholder="+54 11 1234-5678" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo doc.</Label>
                <Input
                  id="documentType"
                  name="documentType"
                  defaultValue={edit?.documentType ?? ""}
                  placeholder="DNI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Número doc.</Label>
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  defaultValue={edit?.documentNumber ?? ""}
                  placeholder="12345678"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
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
