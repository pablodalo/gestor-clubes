"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPayment } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type MemberOption = {
  id: string;
  name: string;
  memberNumber: string;
};

type Props = {
  members: MemberOption[];
  currency: string;
  onSuccess?: () => void;
};

export function PaymentForm({ members, currency, onSuccess }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createPayment({
      memberId: String(formData.get("memberId")),
      amount: String(formData.get("amount")),
      currency: String(formData.get("currency")) || currency,
      paidAt: String(formData.get("paidAt") || ""),
      method: String(formData.get("method") || ""),
      reference: String(formData.get("reference") || ""),
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
        <CardTitle>Registrar pago</CardTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input id="currency" name="currency" defaultValue={currency} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="paidAt">Fecha de pago</Label>
              <Input id="paidAt" name="paidAt" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="method">Método</Label>
              <Input id="method" name="method" placeholder="Transferencia, efectivo..." />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reference">Referencia</Label>
            <Input id="reference" name="reference" placeholder="Comprobante, nro operación" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" placeholder="Observaciones" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
