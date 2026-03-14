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
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between px-4">
          <nav className="flex items-center gap-6">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tenant.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: `/app/${tenant.slug}/login` })}
            >
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
