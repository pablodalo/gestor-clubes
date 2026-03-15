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
import { createPlatformUser, updatePlatformUser } from "@/actions/platform-users";
import { PLATFORM_PERMISSION_KEYS, type PlatformPermissionKey } from "@/config/platform-permissions";

type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: unknown;
  createdAt: Date;
};

const roleLabels: Record<string, string> = {
  platform_owner: "Superadmin",
  platform_admin: "Administrador",
  support_agent: "Soporte",
  billing_admin: "Facturación",
};

const permissionLabels: Record<string, string> = {
  [PLATFORM_PERMISSION_KEYS.audit_read]: "Auditoría",
  [PLATFORM_PERMISSION_KEYS.errors_read]: "Errores",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  edit: PlatformUserRow | null;
};

export function PlatformUserFormDialog({ open, onOpenChange, onSuccess, edit }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(edit?.role ?? "support_agent");
  const [audit, setAudit] = useState(
    !!(edit && Array.isArray(edit.permissions) && (edit.permissions as string[]).includes(PLATFORM_PERMISSION_KEYS.audit_read))
  );
  const [errorsPerm, setErrorsPerm] = useState(
    !!(edit && Array.isArray(edit.permissions) && (edit.permissions as string[]).includes(PLATFORM_PERMISSION_KEYS.errors_read))
  );

  useEffect(() => {
    if (!open) return;
    setRole(edit?.role ?? "support_agent");
    setAudit(!!(edit && Array.isArray(edit.permissions) && (edit.permissions as string[]).includes(PLATFORM_PERMISSION_KEYS.audit_read)));
    setErrorsPerm(!!(edit && Array.isArray(edit.permissions) && (edit.permissions as string[]).includes(PLATFORM_PERMISSION_KEYS.errors_read)));
  }, [open, edit]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const permissions: PlatformPermissionKey[] = [];
    if (audit) permissions.push(PLATFORM_PERMISSION_KEYS.audit_read);
    if (errorsPerm) permissions.push(PLATFORM_PERMISSION_KEYS.errors_read);

    if (edit) {
      // Email no se envía al editar (campo disabled no va en el submit); el backend mantiene el actual.
      // Superadmin: no enviamos role para no forzar validación; el backend mantiene platform_owner.
      const payload: { name: string; password?: string; role?: "platform_admin" | "support_agent" | "billing_admin"; permissions: PlatformPermissionKey[] } = {
        name,
        password: password === "" ? undefined : password,
        permissions,
      };
      if (edit.role !== "platform_owner") payload.role = role as "platform_admin" | "support_agent" | "billing_admin";
      const result = await updatePlatformUser(edit.id, payload);
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
      const result = await createPlatformUser({
        name,
        email,
        password,
        role: role as "platform_admin" | "support_agent" | "billing_admin",
        permissions,
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
          <DialogTitle>{edit ? "Editar usuario" : "Nuevo usuario de plataforma"}</DialogTitle>
          <DialogDescription>
            Solo el superadmin gestiona usuarios. Los permisos definen si puede ver Auditoría y/o Errores; todos ven Tenants.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">{error}</p>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required defaultValue={edit?.name} placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={edit?.email}
                placeholder="usuario@ejemplo.com"
                disabled={!!edit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{edit ? "Nueva contraseña (opcional)" : "Contraseña"}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={edit ? 0 : 8}
                placeholder={edit ? "Dejar en blanco para no cambiar" : "Mínimo 8 caracteres"}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              {edit?.role === "platform_owner" ? (
                <p className="text-sm text-muted-foreground py-2">{roleLabels.platform_owner} (no editable)</p>
              ) : (
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform_admin">{roleLabels.platform_admin}</SelectItem>
                    <SelectItem value="support_agent">{roleLabels.support_agent}</SelectItem>
                    <SelectItem value="billing_admin">{roleLabels.billing_admin}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Permisos adicionales</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audit}
                    onChange={(e) => setAudit(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{permissionLabels[PLATFORM_PERMISSION_KEYS.audit_read]}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={errorsPerm}
                    onChange={(e) => setErrorsPerm(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{permissionLabels[PLATFORM_PERMISSION_KEYS.errors_read]}</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : edit ? "Guardar" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
