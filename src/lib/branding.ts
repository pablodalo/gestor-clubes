import { prisma } from "@/lib/prisma";

export type TenantBrandingData = {
  appName: string | null;
  shortName: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  fontFamily: string | null;
  radiusScale: string | null;
  darkModeDefault: boolean;
  loginTitle: string | null;
  loginSubtitle: string | null;
  portalBannerUrl: string | null;
};

const DEFAULT_BRANDING: TenantBrandingData = {
  appName: "Gestor Clubes",
  shortName: "GC",
  logoUrl: null,
  iconUrl: null,
  faviconUrl: null,
  primaryColor: "#0f766e",
  secondaryColor: "#134e4a",
  accentColor: "#2dd4bf",
  backgroundColor: null,
  fontFamily: "system-ui",
  radiusScale: "0.5",
  darkModeDefault: false,
  loginTitle: null,
  loginSubtitle: null,
  portalBannerUrl: null,
};

/**
 * Carga el branding de un tenant por slug o id. Para CSS variables en Theme Provider.
 */
export async function getTenantBranding(
  tenantIdentifier: string,
  by: "slug" | "id" = "slug"
): Promise<TenantBrandingData> {
  const tenant = await prisma.tenant.findFirst({
    where: by === "slug" ? { slug: tenantIdentifier } : { id: tenantIdentifier },
    include: { branding: true },
  });
  if (!tenant?.branding) return { ...DEFAULT_BRANDING, appName: tenant?.name ?? DEFAULT_BRANDING.appName };
  const b = tenant.branding;
  return {
    appName: b.appName ?? DEFAULT_BRANDING.appName,
    shortName: b.shortName ?? DEFAULT_BRANDING.shortName,
    logoUrl: b.logoUrl,
    iconUrl: b.iconUrl,
    faviconUrl: b.faviconUrl,
    primaryColor: b.primaryColor ?? DEFAULT_BRANDING.primaryColor,
    secondaryColor: b.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
    accentColor: b.accentColor ?? DEFAULT_BRANDING.accentColor,
    backgroundColor: b.backgroundColor,
    fontFamily: b.fontFamily ?? DEFAULT_BRANDING.fontFamily,
    radiusScale: b.radiusScale ?? DEFAULT_BRANDING.radiusScale,
    darkModeDefault: b.darkModeDefault,
    loginTitle: b.loginTitle,
    loginSubtitle: b.loginSubtitle,
    portalBannerUrl: b.portalBannerUrl,
  };
}

/**
 * Convierte branding a CSS variables (--primary, --radius, etc.) para inyectar en :root o data-tenant.
 */
export function brandingToCssVariables(b: TenantBrandingData): Record<string, string> {
  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "0 0% 0%";
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        default: h = ((r - g) / d + 4) / 6;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };
  const radiusMap: Record<string, string> = {
    "0": "0px",
    "0.25": "0.25rem",
    "0.5": "0.5rem",
    "0.75": "0.75rem",
    "1": "1rem",
  };
  const vars: Record<string, string> = {};
  if (b.primaryColor) vars["--primary"] = hexToHsl(b.primaryColor);
  if (b.secondaryColor) vars["--secondary"] = hexToHsl(b.secondaryColor);
  if (b.accentColor) vars["--accent"] = hexToHsl(b.accentColor);
  if (b.backgroundColor) vars["--background"] = hexToHsl(b.backgroundColor);
  if (b.radiusScale) vars["--radius"] = radiusMap[b.radiusScale] ?? "0.5rem";
  if (b.fontFamily) vars["--font-sans"] = b.fontFamily;
  return vars;
}
