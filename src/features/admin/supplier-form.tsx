"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupplier } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupplierForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createSupplier({
      name: String(formData.get("name")),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      address: String(formData.get("address") || ""),
      suppliesProvided: String(formData.get("suppliesProvided") || ""),
      notes: String(formData.get("notes") || ""),
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
    router.refresh();
    (e.target as HTMLFormElement).reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo proveedor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" name="address" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="suppliesProvided">Qué suministra</Label>
            <Input id="suppliesProvided" name="suppliesProvided" placeholder="Fertilizantes, sustratos, frascos..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" placeholder="Observaciones internas" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
