"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveLogin } from "@/actions/resolve-login";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginFormUnified() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resolved = await resolveLogin(email, password);
      if ("error" in resolved) {
        setError(resolved.error);
        setLoading(false);
        return;
      }

      if (resolved.context === "platform") {
        const res = await signIn("platform", { email, password, redirect: false });
        if (res?.ok) {
          router.push("/platform");
          router.refresh();
          return;
        }
      } else if (resolved.context === "tenant") {
        const res = await signIn("tenant", {
          email,
          password,
          tenantSlug: resolved.slug,
          redirect: false,
        });
        if (res?.ok) {
          router.push(`/app/${resolved.slug}`);
          router.refresh();
          return;
        }
      } else {
        const res = await signIn("member", {
          email,
          password,
          tenantSlug: resolved.slug,
          redirect: false,
        });
        if (res?.ok) {
          router.push(`/portal/socios/${resolved.slug}`);
          router.refresh();
          return;
        }
      }

      setError("Error al iniciar sesión.");
    } catch {
      setError("Error al iniciar sesión.");
    }
    setLoading(false);
  }

  return (
    <div className="login-page-bg min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-2 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-semibold">
              GC
            </span>
            <CardTitle className="text-2xl tracking-tight">Gestor Clubes</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Ingresá con tu email y contraseña. El sistema detecta si entrás como administrador, panel del club o socio.
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
            <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
