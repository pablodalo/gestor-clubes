"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getImpersonateMemberUrl } from "@/actions/impersonate-member";
import { LogIn } from "lucide-react";

type Props = {
  isPlatform: boolean;
  tenantSlug: string;
  memberId: string;
};

export function ImpersonateMemberButton({ isPlatform, tenantSlug, memberId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isPlatform) {
    return (
      <Button asChild variant="default" size="sm" className="gap-2">
        <Link href={`/portal/socios/${tenantSlug}/login`} target="_blank" rel="noopener noreferrer">
          Abrir portal del socio
        </Link>
      </Button>
    );
  }

  async function handleEntrarComoSocio() {
    setError("");
    setLoading(true);
    const res = await getImpersonateMemberUrl(memberId, tenantSlug);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="default"
        size="sm"
        className="gap-2"
        onClick={handleEntrarComoSocio}
        disabled={loading}
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Generando enlace..." : "Entrar como socio"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
