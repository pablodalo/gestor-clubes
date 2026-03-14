import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Gestor Clubes</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Plataforma SaaS multi-tenant para gestión de clubes. Elige el área de acceso.
      </p>
      <div className="flex gap-4">
        <Link
          href="/platform/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Superadmin
        </Link>
        <Link
          href="/app"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Panel del club
        </Link>
        <Link
          href="/portal"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Portal de socios
        </Link>
      </div>
    </div>
  );
}
