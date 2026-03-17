import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginFormUnified } from "@/components/login-form-unified";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const ctx = (session as unknown as { context?: string }).context;
    const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
    if (ctx === "platform") redirect("/platform");
    if (ctx === "tenant" && tenantSlug) redirect(`/app/${tenantSlug}`);
    // Las sesiones de socio ahora se manejan con auth aislado del portal.
    // Aunque exista una cookie vieja con ctx === "member", no redirigimos desde el home;
    // dejamos que el usuario elija cómo entrar (platform / tenant / portal).
  }
  return <LoginFormUnified />;
}
