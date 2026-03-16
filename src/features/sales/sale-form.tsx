"use client";

import { useState } from "react";
import { createSale } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MemberOption = { id: string; name: string; memberNumber: string };
type ProductOption = { id: string; name: string; price: string; currency: string };

type Props = {
  members: MemberOption[];
  products: ProductOption[];
  onSuccess: () => void;
};

export function SaleForm({ members, products, onSuccess }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createSale({
      memberId: String(formData.get("memberId")),
      productId: String(formData.get("productId")),
      quantity: String(formData.get("quantity") || "1"),
      paidAt: String(formData.get("paidAt") || ""),
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
        <CardTitle>Nueva venta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="memberId">Socio</Label>
            <select
              id="memberId"
              name="memberId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNumber} · {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="productId">Producto</Label>
            <select
              id="productId"
              name="productId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.price} {p.currency}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" defaultValue="1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paidAt">Fecha</Label>
              <Input id="paidAt" name="paidAt" type="date" />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Registrar venta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
