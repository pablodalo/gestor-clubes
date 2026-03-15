"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TenantEditForm } from "@/features/tenants/tenant-edit-form";
import { BrandingForm } from "@/features/branding/branding-form";
import { cn } from "@/lib/utils";
import type { TenantBranding } from "@prisma/client";
import { Layout, Palette, Settings } from "lucide-react";

type Tenant = { id: string; name: string; slug: string; status: string; timezone?: string; locale?: string; currency?: string };

type Props = {
  tenant: Tenant;
  branding: TenantBranding | null | undefined;
};

type TabId = "general" | "apariencia" | "menu-login";

export function TenantDetailTabs({ tenant, branding }: Props) {
  const [tab, setTab] = useState<TabId>("general");

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Settings className="h-4 w-4" /> },
    { id: "apariencia", label: "Apariencia", icon: <Palette className="h-4 w-4" /> },
    { id: "menu-login", label: "Menú y login", icon: <Layout className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Datos del club</CardTitle>
            <CardDescription>Nombre, estado, zona horaria, idioma y moneda.</CardDescription>
          </CardHeader>
          <CardContent>
            <TenantEditForm tenant={tenant} />
          </CardContent>
        </Card>
      )}

      {tab === "apariencia" && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Logo, identidad y colores</CardTitle>
            <CardDescription>Logo, nombre de la app, colores y tipografía.</CardDescription>
          </CardHeader>
          <CardContent>
            <BrandingForm
              tenantId={tenant.id}
              initial={branding ?? undefined}
              embed
              onlySections={["logo", "identity", "colors", "typography"]}
            />
          </CardContent>
        </Card>
      )}

      {tab === "menu-login" && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Menú y pantalla de login</CardTitle>
            <CardDescription>Layout del menú del panel y textos del login.</CardDescription>
          </CardHeader>
          <CardContent>
            <BrandingForm
              tenantId={tenant.id}
              initial={branding ?? undefined}
              embed
              onlySections={["nav", "login"]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
