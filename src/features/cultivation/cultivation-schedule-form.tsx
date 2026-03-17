"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCultivationSchedule } from "@/actions/cultivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  lotId: string;
  defaultWatering?: Date | null;
  defaultFeeding?: Date | null;
  onSuccess?: () => void;
};

const toDateInput = (value?: Date | null) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export function CultivationScheduleForm({
  lotId,
  defaultWatering,
  defaultFeeding,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateCultivationSchedule({
      lotId,
      nextWateringAt: String(formData.get("nextWateringAt") || ""),
      nextFeedingAt: String(formData.get("nextFeedingAt") || ""),
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-2">
        <Label htmlFor="nextWateringAt">Próximo riego</Label>
        <Input id="nextWateringAt" name="nextWateringAt" type="date" defaultValue={toDateInput(defaultWatering)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nextFeedingAt">Próxima fertilización</Label>
        <Input id="nextFeedingAt" name="nextFeedingAt" type="date" defaultValue={toDateInput(defaultFeeding)} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Actualizar calendario"}
      </Button>
    </form>
  );
}
