"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlant } from "@/actions/cultivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StrainOption = { id: string; name: string };
type LotOption = { id: string; code: string };

export function PlantForm({
  strains,
  lots = [],
  defaultLotId,
  onSuccess,
}: {
  strains: StrainOption[];
  lots?: LotOption[];
  defaultLotId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createPlant({
      code: String(formData.get("code")),
      lotId: String(formData.get("lotId") || ""),
      strainId: String(formData.get("strainId")),
      stage: String(formData.get("stage") || ""),
      status: String(formData.get("status") || ""),
      plantedAt: String(formData.get("plantedAt") || ""),
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
        <CardTitle>Nueva planta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" name="code" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="strainId">Cepa</Label>
            <select
              id="strainId"
              name="strainId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar</option>
              {strains.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stage">Etapa</Label>
              <Input id="stage" name="stage" placeholder="vegetativo" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Input id="status" name="status" placeholder="active" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plantedAt">Fecha de plantado</Label>
            <Input id="plantedAt" name="plantedAt" type="date" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
