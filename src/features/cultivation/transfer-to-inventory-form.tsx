"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transferCultivationToInventory } from "@/actions/cultivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StrainOption = { id: string; name: string };

type Props = {
  lotId: string;
  strains: StrainOption[];
  onSuccess?: () => void;
};

export function TransferToInventoryForm({ lotId, strains, onSuccess }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const items = strains
      .map((s) => {
        const grams = String(formData.get(`grams-${s.id}`) || "");
        const category = String(formData.get(`category-${s.id}`) || "flores") as "flores" | "extractos";
        return grams ? { strainId: s.id, grams, category } : null;
      })
      .filter(Boolean) as { strainId: string; grams: string; category: "flores" | "extractos" }[];

    if (items.length === 0) {
      setError("Indicá al menos un gramaje para transferir.");
      setLoading(false);
      return;
    }

    const result = await transferCultivationToInventory({
      lotId,
      items,
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
    <form onSubmit={handleSubmit} className="grid gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {strains.map((s) => (
        <div key={s.id} className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <Label>{s.name}</Label>
            <Input id={`grams-${s.id}`} name={`grams-${s.id}`} type="number" step="0.01" placeholder="Gramos" />
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              id={`category-${s.id}`}
              name={`category-${s.id}`}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="flores">Flores</option>
              <option value="extractos">Extractos</option>
            </select>
          </div>
        </div>
      ))}
      <Button type="submit" disabled={loading}>
        {loading ? "Actualizando..." : "Actualizar inventario"}
      </Button>
    </form>
  );
}
