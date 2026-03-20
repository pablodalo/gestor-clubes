"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicketForMember } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  tenantSlug: string;
  defaultSubject?: string;
};

export function PortalCreateTicketForm({ tenantSlug, defaultSubject = "" }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(defaultSubject);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await createTicketForMember(tenantSlug, {
      subject: subject.trim(),
      description: description.trim() || undefined,
      priority: "medium",
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSubject("");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-4">
      <h3 className="text-sm font-semibold text-foreground">Nuevo ticket</h3>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="subject">Asunto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="¿En qué podemos ayudarte?"
          required
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contanos más detalles..."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Enviando…" : "Enviar"}
      </Button>
    </form>
  );
}
