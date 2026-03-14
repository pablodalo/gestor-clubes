import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await getServerSession(authOptions);
  } catch {
    // Si falla la sesión (ej. NEXTAUTH_SECRET faltante o cookie inválida), el layout igual renderiza;
    // la página interna hará redirect a login si no hay sesión válida.
  }
  return (
    <ThemeProvider branding={null}>
      {children}
    </ThemeProvider>
  );
}
