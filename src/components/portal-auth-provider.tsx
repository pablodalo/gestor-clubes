"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Provee sesión del portal usando la API de auth aislada (/api/portal-auth).
 * Así, signIn/signOut en el portal no pisan la cookie del panel del club;
 * al impersonar un socio la sesión tenant/platform sigue intacta en la otra pestaña.
 */
export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/portal-auth">{children}</SessionProvider>;
}
