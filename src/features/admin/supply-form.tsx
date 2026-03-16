"use client";

import { useState } from "react";
import { createSupplyItem } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SupplierOption = { id: string; name: string };

export function SupplyForm({ suppliers, onSuccess }: { suppliers: SupplierOption[]; onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createSupplyItem({
      name: String(formData.get("name")),
      category: String(formData.get("category") || ""),
      unit: String(formData.get("unit") || ""),
      minQty: String(formData.get("minQty") || ""),
      supplierId: String(formData.get("supplierId") || ""),
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onSuccess();
    (e.target as HTMLFormElement).reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo suministro</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Categoría</Label>
            <Input id="category" name="category" placeholder="fertilizante, sustrato..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad</Label>
              <Input id="unit" name="unit" placeholder="l / kg / u" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minQty">Mínimo</Label>
              <Input id="minQty" name="minQty" type="number" step="0.01" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supplierId">Proveedor</Label>
            <select
              id="supplierId"
              name="supplierId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
