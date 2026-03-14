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
    if (ctx === "member" && tenantSlug) redirect(`/portal/socios/${tenantSlug}`);
  }
  return <LoginFormUnified />;
}
