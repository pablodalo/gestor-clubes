import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AppEntryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;

  if (ctx === "platform") {
    const tenants = await prisma.tenant.findMany({
      where: { status: "active" },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-bold">Seleccionar club</h1>
        <ul className="flex flex-col gap-2">
          {tenants.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/app/${t.slug}`}
                className="text-primary hover:underline font-medium"
              >
                {t.name} ({t.slug})
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/platform" className="text-sm text-muted-foreground hover:underline">
          Volver al superadmin
        </Link>
      </div>
    );
  }

  if (ctx === "tenant" && tenantSlug) {
    redirect(`/app/${tenantSlug}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted-foreground">Iniciá sesión en el panel del club.</p>
      <Link href="/" className="text-primary hover:underline">
        Ir a login
      </Link>
    </div>
  );
}
