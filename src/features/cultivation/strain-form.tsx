"use client";

import { useState } from "react";
import { createStrain } from "@/actions/cultivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StrainForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createStrain({
      name: String(formData.get("name")),
      genetics: String(formData.get("genetics") || ""),
      thcPct: String(formData.get("thcPct") || ""),
      cbdPct: String(formData.get("cbdPct") || ""),
      cycleDays: String(formData.get("cycleDays") || ""),
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
        <CardTitle>Nueva cepa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="genetics">Genética</Label>
            <Input id="genetics" name="genetics" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="thcPct">% THC</Label>
              <Input id="thcPct" name="thcPct" type="number" step="0.01" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cbdPct">% CBD</Label>
              <Input id="cbdPct" name="cbdPct" type="number" step="0.01" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cycleDays">Ciclo (días)</Label>
              <Input id="cycleDays" name="cycleDays" type="number" />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
