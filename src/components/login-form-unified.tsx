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
    <div className="login-page-bg min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-semibold">
              GC
            </span>
            <CardTitle className="text-2xl tracking-tight">Gestor Clubes</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Un solo acceso: sin club para Superadmin; con slug para panel del club o portal de socios.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club">Club (slug)</Label>
              <Input
                id="club"
                type="text"
                autoComplete="off"
                placeholder="ej. demo-club — vacío = Superadmin"
                value={clubSlug}
                onChange={(e) => setClubSlug(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Dejá vacío para Superadmin. Con slug entrás al panel del club o al portal de socios.
              </p>
            </div>
            <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
