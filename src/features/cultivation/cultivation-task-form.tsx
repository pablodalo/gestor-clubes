"use client";

import { useState } from "react";
import { createCultivationTask } from "@/actions/cultivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  lotId: string;
  onSuccess: () => void;
};

export function CultivationTaskForm({ lotId, onSuccess }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createCultivationTask({
      lotId,
      type: formData.get("type") as "secado" | "curado" | "listo",
      dueAt: String(formData.get("dueAt")),
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
    <form onSubmit={handleSubmit} className="grid gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-2">
        <Label htmlFor="type">Hito</Label>
        <select
          id="type"
          name="type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="secado">Secado</option>
          <option value="curado">Curado</option>
          <option value="listo">Listo para comercializar</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dueAt">Fecha</Label>
        <Input id="dueAt" name="dueAt" type="date" required />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Agregar hito"}
      </Button>
    </form>
  );
}
