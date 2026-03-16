"use client";

import { useState } from "react";
import { createControl } from "@/actions/cultivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ControlForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createControl({
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
