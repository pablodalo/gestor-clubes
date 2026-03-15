import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ProfileForm } from "@/features/profile/profile-form";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function ProfilePage({ params }: Props) {
  const { tenantSlug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const ctx = (session as unknown as { context?: string }).context;
  const tenantSlugSession = (session as unknown as { tenantSlug?: string }).tenantSlug;
  const userId = (session as unknown as { userId?: string }).userId;

  const canAccess = ctx === "platform" || (ctx === "tenant" && tenantSlugSession === tenantSlug);
  if (!canAccess) redirect("/");

  if (ctx === "platform") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground">La edición de perfil de platform no está en esta ruta. Usá el panel de Platform.</p>
      </div>
    );
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: tenant.id },
  });
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground">No se encontró tu usuario en este club.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground mt-1">Datos de tu cuenta en este club.</p>
      </div>
      <ProfileForm initialName={user.name} initialEmail={user.email} />
    </div>
  );
}
