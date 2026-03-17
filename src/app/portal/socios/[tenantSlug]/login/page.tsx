"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PortalSociosLoginPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = (params?.tenantSlug as string) ?? "";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [impersonateDone, setImpersonateDone] = useState(false);

  const impersonateToken = searchParams.get("impersonate");

  useEffect(() => {
    if (!impersonateToken || !tenantSlug || impersonateDone) return;
    setImpersonateDone(true);
    setLoading(true);
    signIn("member-impersonate", {
      token: impersonateToken,
      tenantSlug,
      redirect: true,
      callbackUrl: `/portal/socios/${tenantSlug}`,
    }).then((res) => {
      setLoading(false);
      if (res?.error) setError("Enlace inválido o expirado.");
    });
  }, [impersonateToken, tenantSlug, impersonateDone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("member", {
        email,
        password,
        tenantSlug,
        redirect: false,
      });
      if (res?.error) {
        setError("Credenciales incorrectas.");
        setLoading(false);
        return;
      }
      router.push(`/portal/socios/${tenantSlug}`);
      router.refresh();
    } catch {
      setError("Error al iniciar sesión.");
    }
    setLoading(false);
  }

  if (impersonateToken && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Entrando como socio...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Portal de socios</CardTitle>
          <CardDescription>Ingresá con tu cuenta de socio.</CardDescription>
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
            <Link href="/portal">Elegir otro club</Link> · <Link href="/">Inicio</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
