"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTenant } from "@/actions/tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function TenantForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const result = await createTenant({ name, slug });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/platform/tenants");
    router.refresh();
  }

  return (
    <Card className="mt-6">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Mi Club" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="mi-club"
              pattern="[a-z0-9-]+"
              required
            />
            <p className="text-xs text-muted-foreground">
              Solo minúsculas, números y guiones. Ej: mi-club, club-123.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear tenant"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
