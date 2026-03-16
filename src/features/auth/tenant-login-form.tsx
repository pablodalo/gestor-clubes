"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Props = {
  tenantSlug: string;
  logoUrl?: string | null;
  appName?: string | null;
  loginTitle?: string | null;
  loginSubtitle?: string | null;
};

export function TenantLoginForm({ tenantSlug, logoUrl, appName, loginTitle, loginSubtitle }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const title = loginTitle?.trim() || "Panel del club";
  const subtitle = loginSubtitle?.trim() || "Ingresá con tu cuenta de operador.";
  const displayName = appName?.trim() || "Club";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("tenant", {
        email,
        password,
        tenantSlug,
        redirect: false,
      });
      if (res?.error) {
        setError("Credenciales incorrectas o tenant inválido.");
        setLoading(false);
        return;
      }
      router.push(`/app/${tenantSlug}`);
      router.refresh();
    } catch {
      setError("Error al iniciar sesión.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader className="text-center pb-2">
          {logoUrl ? (
            <div className="flex justify-center mb-3">
              <img
                src={logoUrl}
                alt={displayName}
                className="h-14 w-auto max-w-[200px] object-contain"
              />
            </div>
          ) : null}
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
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
                autoComplete="email"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/">Volver al inicio</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
