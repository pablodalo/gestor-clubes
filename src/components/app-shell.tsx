"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TenantContext } from "@/lib/tenant";

const nav = (slug: string) => [
  { href: `/app/${slug}`, label: "Dashboard" },
  { href: `/app/${slug}/members`, label: "Socios" },
  { href: `/app/${slug}/locations`, label: "Ubicaciones" },
  { href: `/app/${slug}/lots`, label: "Lotes" },
  { href: `/app/${slug}/inventory`, label: "Inventario" },
];

export function AppShell({
  tenant,
  session,
  children,
}: {
  tenant: TenantContext;
  session: unknown;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const links = nav(tenant.slug);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
        <div className="container flex h-14 max-w-6xl mx-auto items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2 font-semibold text-foreground truncate max-w-[180px] sm:max-w-none">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
                {tenant.name.slice(0, 2).toUpperCase()}
            </span>
              {tenant.name}
            </span>
            <nav className="flex items-center gap-1">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: `/app/${tenant.slug}/login` })}
          >
            Salir
          </Button>
        </div>
      </header>
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
