"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTenant } from "@/actions/tenants";

type Tenant = { id: string; name: string; slug: string; status: string; timezone?: string; locale?: string; currency?: string };

type Props = {
  tenant: Tenant;
};

export function TenantEditForm({ tenant }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await updateTenant(tenant.id, {
      name: (formData.get("name") as string).trim(),
      status: (formData.get("status") as "active" | "suspended" | "trial") || undefined,
      timezone: (formData.get("timezone") as string) || undefined,
      locale: (formData.get("locale") as string) || undefined,
      currency: (formData.get("currency") as string) || undefined,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required defaultValue={tenant.name} placeholder="Nombre del club" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            name="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={tenant.status}
          >
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
            <option value="trial">Prueba</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Zona horaria</Label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={tenant.timezone ?? "America/Argentina/Buenos_Aires"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locale">Idioma del panel</Label>
          <select
            id="locale"
            name="locale"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={tenant.locale ?? "es-AR"}
          >
            <option value="es-AR">Español (Argentina)</option>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" name="currency" defaultValue={tenant.currency ?? "ARS"} />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
