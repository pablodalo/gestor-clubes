"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateTenantBranding, uploadLogo } from "@/actions/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TenantBranding } from "@prisma/client";
import { PanelLeft, PanelTop, Upload } from "lucide-react";

type Props = {
  tenantId: string;
  initial?: TenantBranding | null;
  compact?: boolean;
  embed?: boolean;
};

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-foreground border-b pb-1.5">{title}</h3>
      {children}
    </div>
  );
}

export function BrandingForm({ tenantId, initial, compact, embed }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logoUrl ?? null);
  const [fontFamily, setFontFamily] = useState(initial?.fontFamily ?? "system-ui");
  const [radiusScale, setRadiusScale] = useState(initial?.radiusScale ?? "0.5");
  const [navigationLayout, setNavigationLayout] = useState<"horizontal" | "vertical">(
    (initial?.navigationLayout as "horizontal" | "vertical") ?? "horizontal"
  );

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadLogo(tenantId, fd);
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data?.url) setLogoUrl(result.data.url);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await updateTenantBranding(tenantId, {
      appName: (formData.get("appName") as string) || null,
      shortName: (formData.get("shortName") as string) || null,
      logoUrl: logoUrl?.trim() || null,
      primaryColor: (formData.get("primaryColor") as string) || null,
      secondaryColor: (formData.get("secondaryColor") as string) || null,
      accentColor: (formData.get("accentColor") as string) || null,
      backgroundColor: (formData.get("backgroundColor") as string) || null,
      fontFamily: fontFamily || null,
      radiusScale: radiusScale || null,
      darkModeDefault: formData.get("darkModeDefault") === "on",
      loginTitle: (formData.get("loginTitle") as string) || null,
      loginSubtitle: (formData.get("loginSubtitle") as string) || null,
      portalBannerUrl: (formData.get("portalBannerUrl") as string) || null,
      navigationLayout,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const errorBlock = error ? (
    <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
  ) : null;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorBlock}

      <Section title="Logo del club">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Subiendo…" : "Subir imagen"}
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP o SVG. Máx. 2 MB.</p>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <Label htmlFor="logoUrl">O pegar URL</Label>
            <Input
              id="logoUrl"
              type="text"
              placeholder="https://ejemplo.com/logo.png"
              value={logoUrl ?? ""}
              onChange={(e) => setLogoUrl(e.target.value || null)}
            />
          </div>
        </div>
        {(logoUrl || initial?.logoUrl) && (
          <div className="mt-2 flex items-center gap-2">
            <Image
              src={logoUrl || initial?.logoUrl || ""}
              alt="Logo"
              width={64}
              height={64}
              className="h-16 w-auto object-contain rounded border border-input"
              unoptimized
            />
          </div>
        )}
      </Section>

      <Section title="Identidad">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appName">Nombre de la app</Label>
            <Input
              id="appName"
              name="appName"
              defaultValue={initial?.appName ?? undefined}
              placeholder="Mi Club"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortName">Nombre corto</Label>
            <Input
              id="shortName"
              name="shortName"
              defaultValue={initial?.shortName ?? undefined}
              placeholder="MC"
            />
          </div>
        </div>
      </Section>

      <Section title="Colores">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primario</Label>
            <Input
              id="primaryColor"
              name="primaryColor"
              type="color"
              className="h-10 w-full p-1 cursor-pointer"
              defaultValue={initial?.primaryColor ?? "#0f766e"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secundario</Label>
            <Input
              id="secondaryColor"
              name="secondaryColor"
              type="color"
              className="h-10 w-full p-1 cursor-pointer"
              defaultValue={initial?.secondaryColor ?? "#134e4a"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Acento</Label>
            <Input
              id="accentColor"
              name="accentColor"
              type="color"
              className="h-10 w-full p-1 cursor-pointer"
              defaultValue={initial?.accentColor ?? "#2dd4bf"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Fondo</Label>
            <Input
              id="backgroundColor"
              name="backgroundColor"
              type="color"
              className="h-10 w-full p-1 cursor-pointer"
              defaultValue={initial?.backgroundColor ?? undefined}
            />
          </div>
        </div>
      </Section>

      <Section title="Tipografía">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Fuente</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system-ui">System UI</SelectItem>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Radio de bordes</Label>
            <Select value={radiusScale} onValueChange={setRadiusScale}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="0.25">0.25</SelectItem>
                <SelectItem value="0.5">0.5</SelectItem>
                <SelectItem value="0.75">0.75</SelectItem>
                <SelectItem value="1">1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Navegación del panel">
        <p className="text-xs text-muted-foreground mb-2">
          Cómo se muestra el menú principal. En celular siempre se usa menú tipo drawer.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setNavigationLayout("horizontal")}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
              navigationLayout === "horizontal"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/50"
            )}
            aria-pressed={navigationLayout === "horizontal"}
          >
            <PanelTop className="h-8 w-8 shrink-0" />
            <span className="text-sm font-medium">Horizontal</span>
            <span className="text-xs opacity-80">Barra superior</span>
          </button>
          <button
            type="button"
            onClick={() => setNavigationLayout("vertical")}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
              navigationLayout === "vertical"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/50"
            )}
            aria-pressed={navigationLayout === "vertical"}
          >
            <PanelLeft className="h-8 w-8 shrink-0" />
            <span className="text-sm font-medium">Vertical</span>
            <span className="text-xs opacity-80">Sidebar</span>
          </button>
        </div>
      </Section>

      <Section title="Pantalla de login">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="darkModeDefault"
            name="darkModeDefault"
            defaultChecked={initial?.darkModeDefault ?? false}
            className="rounded border-input"
          />
          <Label htmlFor="darkModeDefault">Modo oscuro por defecto</Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="loginTitle">Título</Label>
            <Input
              id="loginTitle"
              name="loginTitle"
              defaultValue={initial?.loginTitle ?? undefined}
              placeholder="Bienvenido"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginSubtitle">Subtítulo</Label>
            <Input
              id="loginSubtitle"
              name="loginSubtitle"
              defaultValue={initial?.loginSubtitle ?? undefined}
            />
          </div>
        </div>
      </Section>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar branding"}
        </Button>
      </div>
    </form>
  );

  if (embed) {
    return <div className="space-y-4">{formContent}</div>;
  }

  return (
    <Card className={cn(compact ? "w-full" : "mt-6 max-w-xl")}>
      <CardHeader>{errorBlock}</CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
