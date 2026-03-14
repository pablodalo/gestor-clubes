"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateTenantBranding } from "@/actions/branding";
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
import type { TenantBranding } from "@prisma/client";

type Props = {
  tenantId: string;
  initial?: TenantBranding | null;
};

export function BrandingForm({ tenantId, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fontFamily, setFontFamily] = useState(initial?.fontFamily ?? "system-ui");
  const [radiusScale, setRadiusScale] = useState(initial?.radiusScale ?? "0.5");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await updateTenantBranding(tenantId, {
      appName: (formData.get("appName") as string) || null,
      shortName: (formData.get("shortName") as string) || null,
      logoUrl: (formData.get("logoUrl") as string)?.trim() || null,
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
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card className="mt-6 max-w-xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo del club (URL)</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              defaultValue={initial?.logoUrl ?? undefined}
              placeholder="https://ejemplo.com/logo.png"
            />
            {initial?.logoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <Image src={initial.logoUrl} alt="Logo" width={48} height={48} className="h-12 w-auto object-contain rounded border border-input" unoptimized />
              </div>
            )}
          </div>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Color primario</Label>
              <Input
                id="primaryColor"
                name="primaryColor"
                type="color"
                className="h-10 w-20 p-1 cursor-pointer"
                defaultValue={initial?.primaryColor ?? "#0f766e"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Color secundario</Label>
              <Input
                id="secondaryColor"
                name="secondaryColor"
                type="color"
                className="h-10 w-14 p-1 cursor-pointer"
                defaultValue={initial?.secondaryColor ?? "#134e4a"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Color acento</Label>
              <Input
                id="accentColor"
                name="accentColor"
                type="color"
                className="h-10 w-14 p-1 cursor-pointer"
                defaultValue={initial?.accentColor ?? "#2dd4bf"}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo de fuente</Label>
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="darkModeDefault"
              name="darkModeDefault"
              defaultChecked={initial?.darkModeDefault ?? false}
              className="rounded border-input"
            />
            <Label htmlFor="darkModeDefault">Modo oscuro por defecto</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginTitle">Título del login</Label>
            <Input
              id="loginTitle"
              name="loginTitle"
              defaultValue={initial?.loginTitle ?? undefined}
              placeholder="Bienvenido"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginSubtitle">Subtítulo del login</Label>
            <Input
              id="loginSubtitle"
              name="loginSubtitle"
              defaultValue={initial?.loginSubtitle ?? undefined}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar branding"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
