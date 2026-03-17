"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCultivationEvent } from "@/actions/cultivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  lotId: string;
  onSuccess?: () => void;
};

const EVENT_TYPES = [
  { value: "riego", label: "Riego" },
  { value: "fertilizacion", label: "Fertilización" },
  { value: "poda", label: "Poda" },
  { value: "plaga", label: "Plaga" },
  { value: "cosecha", label: "Cosecha" },
  { value: "observacion", label: "Observación" },
];

export function CultivationEventForm({ lotId, onSuccess }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createCultivationEvent({
      lotId,
      type: String(formData.get("type")),
      happenedAt: String(formData.get("happenedAt") || ""),
      note: String(formData.get("note") || ""),
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
      <div className="grid gap-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="happenedAt">Fecha</Label>
        <Input id="happenedAt" name="happenedAt" type="date" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="note">Nota</Label>
        <Input id="note" name="note" placeholder="Detalles del evento" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Registrar evento"}
      </Button>
    </form>
  );
}
