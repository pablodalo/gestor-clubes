"use client";

import * as React from "react";
import type { TenantBrandingData } from "@/lib/branding";
import { brandingToCssVariables } from "@/lib/branding";

type ThemeProviderProps = {
  children: React.ReactNode;
  branding?: TenantBrandingData | null;
  forceDark?: boolean;
};

export function ThemeProvider({ children, branding, forceDark }: ThemeProviderProps) {
  const vars = branding ? brandingToCssVariables(branding) : {};
  const styleObj = Object.keys(vars).length ? (vars as unknown as React.CSSProperties) : undefined;
  const rootClass = forceDark ? "dark" : branding?.darkModeDefault ? "dark" : "";

  return (
    <div className={rootClass} style={styleObj}>
      {children}
    </div>
  );
}
