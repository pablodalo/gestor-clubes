"use client";

import { useState } from "react";
import { createControl } from "@/actions/cultivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LotOption = { id: string; code: string };

export function ControlForm({
  lots = [],
  defaultLotId,
  onSuccess,
}: {
  lots?: LotOption[];
  defaultLotId?: string;
  onSuccess: () => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createControl({
      lotId: String(formData.get("lotId") || ""),
      controlDate: String(formData.get("controlDate") || ""),
      temperature: String(formData.get("temperature") || ""),
      humidity: String(formData.get("humidity") || ""),
      ph: String(formData.get("ph") || ""),
      ec: String(formData.get("ec") || ""),
      pests: String(formData.get("pests") || ""),
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
        <CardTitle>Nuevo control</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {lots.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="lotId">Lote</Label>
              <select
                id="lotId"
                name="lotId"
                defaultValue={defaultLotId ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {!defaultLotId && <option value="">Sin asociar</option>}
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>{lot.code}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="controlDate">Fecha</Label>
            <Input id="controlDate" name="controlDate" type="date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="temperature">Temperatura</Label>
              <Input id="temperature" name="temperature" type="number" step="0.1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="humidity">Humedad</Label>
              <Input id="humidity" name="humidity" type="number" step="0.1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ph">pH</Label>
              <Input id="ph" name="ph" type="number" step="0.1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ec">EC</Label>
              <Input id="ec" name="ec" type="number" step="0.1" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pests">Plagas</Label>
            <Input id="pests" name="pests" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Notas</Label>
            <Input id="note" name="note" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
