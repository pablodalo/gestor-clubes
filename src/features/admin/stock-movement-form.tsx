"use client";

import { useState } from "react";
import { createSupplyMovement } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SupplyOption = { id: string; name: string; unit?: string | null };

export function StockMovementForm({ supplies, onSuccess }: { supplies: SupplyOption[]; onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createSupplyMovement({
      supplyId: String(formData.get("supplyId")),
      type: formData.get("type") as "in" | "out" | "adjust",
      quantity: String(formData.get("quantity")),
      note: String(formData.get("note") || ""),
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
        <CardTitle>Movimiento de stock</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="supplyId">Suministro</Label>
            <select
              id="supplyId"
              name="supplyId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar</option>
              {supplies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="in">Ingreso</option>
                <option value="out">Salida</option>
                <option value="adjust">Ajuste</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Nota</Label>
            <Input id="note" name="note" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
