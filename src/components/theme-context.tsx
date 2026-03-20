"use client";

import * as React from "react";
import type { TenantBrandingData } from "@/lib/branding";
import { brandingToCssVariables } from "@/lib/branding";

const STORAGE_KEY = "gestor-theme";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/** Nodo DOM donde vive el tema del tenant (para portales de modales = mismo look & feel). */
const TenantThemePortalContext = React.createContext<HTMLElement | null>(null);

export function useThemeToggle() {
  const ctx = React.useContext(ThemeContext);
  return ctx;
}

export function useTenantThemePortal() {
  return React.useContext(TenantThemePortalContext);
}

type ThemeProviderProps = {
  children: React.ReactNode;
  branding?: TenantBrandingData | null;
  /** Default when no stored preference: from branding or light */
  defaultDark?: boolean;
};

export function ThemeProvider({ children, branding, defaultDark = false }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme | null>(null);
  const storageKey = branding?.shortName
    ? `${STORAGE_KEY}-${branding.shortName.toLowerCase()}`
    : STORAGE_KEY;

  React.useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(storageKey)) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    } else {
      setThemeState(defaultDark ? "dark" : "light");
    }
  }, [defaultDark, storageKey]);

  const setTheme = React.useCallback((value: Theme) => {
    setThemeState(value);
    if (typeof window !== "undefined") localStorage.setItem(storageKey, value);
  }, [storageKey]);

  const resolved = theme ?? (defaultDark ? "dark" : "light");
  const rootClass = resolved === "dark" ? "dark" : "";
  const vars = branding ? brandingToCssVariables(branding) : {};
  const styleObj = Object.keys(vars).length ? (vars as unknown as React.CSSProperties) : undefined;

  const tenantKey = branding?.shortName?.toLowerCase();

  const [themeRootEl, setThemeRootEl] = React.useState<HTMLDivElement | null>(null);

  return (
    <ThemeContext.Provider value={{ theme: resolved, setTheme }}>
      <TenantThemePortalContext.Provider value={themeRootEl}>
        <div ref={setThemeRootEl} className={rootClass} style={styleObj} data-tenant={tenantKey}>
          {children}
        </div>
      </TenantThemePortalContext.Provider>
    </ThemeContext.Provider>
  );
}
