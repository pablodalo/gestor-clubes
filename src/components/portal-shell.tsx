"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TenantContext } from "@/lib/tenant";

const nav = (slug: string) => [
  { href: `/portal/${slug}`, label: "Inicio" },
  { href: `/portal/${slug}/profile`, label: "Mi perfil" },
  { href: `/portal/${slug}/movements`, label: "Mis movimientos" },
  { href: `/portal/${slug}/tickets`, label: "Tickets" },
];

export function PortalShell({
  tenant,
  children,
}: {
  tenant: TenantContext;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const slug = (params?.tenantSlug as string) ?? tenant.slug;
  const links = nav(slug);

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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: `/portal/${slug}/login` })}
          >
            Salir
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
