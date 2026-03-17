"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDispensation } from "@/actions/dispensations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { id: string; label: string };

type Props = {
  strains: Option[];
  members: Option[];
  onSuccess?: () => void;
};

export function DispensationForm({ strains, members, onSuccess }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createDispensation({
      strainId: String(formData.get("strainId")),
      category: formData.get("category") as "flores" | "extractos",
      grams: String(formData.get("grams")),
      memberId: String(formData.get("memberId") || ""),
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
        <CardTitle>Registrar salida</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              name="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="flores">Flores</option>
              <option value="extractos">Extractos</option>
            </select>
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
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="grams">Gramos</Label>
              <Input id="grams" name="grams" type="number" step="0.01" required />
            </div>
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
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
