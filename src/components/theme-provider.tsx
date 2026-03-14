"use client";

import { ThemeProvider as ThemeProviderInner } from "@/components/theme-context";
import type { TenantBrandingData } from "@/lib/branding";

type ThemeProviderProps = {
  children: React.ReactNode;
  branding?: TenantBrandingData | null;
  forceDark?: boolean;
};

/** Usa ThemeContext; defaultDark = forceDark ?? branding?.darkModeDefault */
export function ThemeProvider({ children, branding, forceDark }: ThemeProviderProps) {
  const defaultDark = forceDark ?? (branding?.darkModeDefault ?? false);
  return (
    <ThemeProviderInner branding={branding} defaultDark={defaultDark}>
      {children}
    </ThemeProviderInner>
  );
}

export { useThemeToggle } from "@/components/theme-context";
