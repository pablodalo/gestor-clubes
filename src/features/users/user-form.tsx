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
import { createTenantUser, updateTenantUser } from "@/actions/users";
import type { User, Role } from "@prisma/client";

type UserWithRole = User & { role: Role };

const roleDisplayName: Record<string, string> = {
  tenant_admin: "Administrador",
  operador: "Operador",
  cultivador: "Cultivador",
  auditor: "Auditor",
  socio: "Socio",
};

const statusOptions = [
  { value: "active", label: "Activo" },
  { value: "suspended", label: "Suspendido" },
  { value: "inactive", label: "Inactivo" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit: UserWithRole | null;
  roles: Role[];
};

export function UserFormDialog({ open, onOpenChange, onSuccess, edit, roles }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleId, setRoleId] = useState(edit?.roleId ?? "");

  useEffect(() => {
    if (open) setRoleId(edit?.roleId ?? "");
  }, [open, edit?.roleId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const status = (formData.get("status") as "active" | "suspended" | "inactive") || "active";

    if (edit) {
      const updatePayload: {
        name?: string;
        password?: string;
        roleId?: string;
        status?: "active" | "suspended" | "inactive";
      } = {};
      if (name) updatePayload.name = name;
      if (password) updatePayload.password = password;
      if (roleId) updatePayload.roleId = roleId;
      updatePayload.status = status;

      const result = await updateTenantUser(edit.id, updatePayload);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      if (!password || password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres");
        setLoading(false);
        return;
      }
      if (!roleId) {
        setError("Seleccioná un rol");
        setLoading(false);
        return;
      }
      const result = await createTenantUser({
        name,
        email,
        password,
        roleId,
        status,
      });
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
          <DialogTitle>{edit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {edit
              ? "Modificá los datos y el rol del usuario."
              : "Usuarios del panel del club. Elegí el rol (Admin u Operador) para definir permisos."}
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
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={edit?.email}
                placeholder="usuario@club.com"
                disabled={!!edit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {edit ? "Nueva contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={edit ? 0 : 8}
                placeholder={edit ? "••••••••" : "Mínimo 8 caracteres"}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={roleId}
                onValueChange={setRoleId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {roleDisplayName[r.name] ?? r.name}
                      {r.description ? ` — ${r.description}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Admin: todo. Operador: socios, inventario, lotes, tickets. Cultivador: lotes, inventario, QR, pesaje, dispositivos.
              </p>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : edit ? "Guardar" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
