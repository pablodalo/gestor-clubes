"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type Props = { tenantSlug: string; initialQ?: string; initialStatus?: string };

export function MembershipPlanSearchForm({
  tenantSlug,
  initialQ = "",
  initialStatus = "",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.querySelector('[name="q"]') as HTMLInputElement)?.value?.trim() ?? "";
    const status = (form.querySelector('[name="status"]') as HTMLSelectElement)?.value ?? "";
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    startTransition(() => {
      router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="q">Buscar</Label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={initialQ}
          placeholder="Nombre o descripción..."
          className="w-64"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <select
          id="status"
          name="status"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-40"
          defaultValue={initialStatus}
        >
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>
      <Button type="submit" variant="secondary" disabled={isPending}>
        <Search className="h-4 w-4 mr-2" />
        {isPending ? "Buscando..." : "Filtrar"}
      </Button>
    </form>
  );
}
