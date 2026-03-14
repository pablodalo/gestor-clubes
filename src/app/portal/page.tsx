import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PortalEntryPage() {
  const tenants = await prisma.tenant.findMany({
    where: { status: "active" },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Portal de socios</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Seleccioná tu club para ingresar.
      </p>
      <ul className="flex flex-col gap-2">
        {tenants.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/portal/${t.slug}/login`}
              className="text-primary hover:underline font-medium"
            >
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
