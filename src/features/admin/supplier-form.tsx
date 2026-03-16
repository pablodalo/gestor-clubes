"use client";

import { useState } from "react";
import { createSupplier } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupplierForm({ onSuccess }: { onSuccess: () => void }) {
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
      paymentStatus: (formData.get("paymentStatus") as "ok" | "pending") || "ok",
      pendingPayment: formData.get("pendingPayment") === "on",
      pendingDelivery: formData.get("pendingDelivery") === "on",
      nextDeliveryAt: String(formData.get("nextDeliveryAt") || ""),
      notes: String(formData.get("notes") || ""),
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
            <Input id="email" name="email" type="email" />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="paymentStatus">Estado de pago</Label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ok">Al día</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nextDeliveryAt">Próxima entrega</Label>
              <Input id="nextDeliveryAt" name="nextDeliveryAt" type="date" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pendingDelivery" className="h-4 w-4 rounded border-input" />
            Tiene entrega pendiente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pendingPayment" className="h-4 w-4 rounded border-input" />
            Tenemos un pago pendiente con este proveedor
          </label>
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
