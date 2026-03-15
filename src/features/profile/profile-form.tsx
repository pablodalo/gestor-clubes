"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateMyProfile } from "@/actions/users";

type Props = {
  initialName: string;
  initialEmail: string;
};

export function ProfileForm({ initialName, initialEmail }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const result = await updateMyProfile({
      name,
      email,
      password: password || undefined,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
          <CardDescription>Actualizá tu nombre, email o contraseña. La contraseña solo se cambia si completás el campo.</CardDescription>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialName}
              required
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialEmail}
              required
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña (opcional)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Dejar en blanco para no cambiar"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
