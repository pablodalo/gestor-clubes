"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginFormUnified() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubSlug, setClubSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1) Sin club → intentar Superadmin
      if (!clubSlug.trim()) {
        const res = await signIn("platform", { email, password, redirect: false });
        if (res?.ok) {
          router.push("/platform");
          router.refresh();
          return;
        }
        setError("Credenciales incorrectas. Si entrás a un club, indicá el slug del club.");
        setLoading(false);
        return;
      }

      // 2) Con club → intentar Panel del club (tenant)
      let res = await signIn("tenant", {
        email,
        password,
        tenantSlug: clubSlug.trim(),
        redirect: false,
      });
      if (res?.ok) {
        router.push(`/app/${clubSlug.trim()}`);
        router.refresh();
        return;
      }

      // 3) Intentar Portal de socios (member)
      res = await signIn("member", {
        email,
        password,
        tenantSlug: clubSlug.trim(),
        redirect: false,
      });
      if (res?.ok) {
        router.push(`/portal/socios/${clubSlug.trim()}`);
        router.refresh();
        return;
      }

      setError("Credenciales o club incorrectos.");
    } catch {
      setError("Error al iniciar sesión.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Gestor Clubes</CardTitle>
          <CardDescription>
            Un solo acceso. Superadmin sin club; panel o portal con slug del club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club">Club (slug)</Label>
              <Input
                id="club"
                type="text"
                placeholder="demo-club (dejar vacío para Superadmin)"
                value={clubSlug}
                onChange={(e) => setClubSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Vacío = Superadmin. Con slug = panel del club o portal de socios.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
