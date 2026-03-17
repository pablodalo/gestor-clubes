"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TenantContext } from "@/lib/tenant";

type NavItem = { href: string; label: string; badge?: number };

const nav = (slug: string, unreadNotificationsCount: number): NavItem[] => [
  { href: `/portal/socios/${slug}`, label: "Inicio" },
  { href: `/portal/socios/${slug}/profile`, label: "Mi perfil" },
  { href: `/portal/socios/${slug}/membership`, label: "Mi membresía" },
  { href: `/portal/socios/${slug}/balance`, label: "Mi saldo" },
  { href: `/portal/socios/${slug}/history`, label: "Mi historial" },
  { href: `/portal/socios/${slug}/notifications`, label: "Notificaciones", badge: unreadNotificationsCount },
  { href: `/portal/socios/${slug}/movements`, label: "Movimientos" },
  { href: `/portal/socios/${slug}/tickets`, label: "Tickets" },
];

export function PortalShell({
  tenant,
  unreadNotificationsCount = 0,
  children,
}: {
  tenant: TenantContext;
  unreadNotificationsCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const slug = (params?.tenantSlug as string) ?? tenant.slug;
  const links = nav(slug, unreadNotificationsCount);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
        <div className="container flex h-auto max-w-6xl mx-auto flex-col gap-2 px-3 py-2 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-center gap-3 sm:gap-8">
            <span className="flex items-center gap-2 font-semibold text-foreground truncate max-w-[180px] sm:max-w-none">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
                {tenant.name?.slice(0, 2).toUpperCase() ?? "P"}
              </span>
              Portal · {tenant.name}
            </span>
            <div className="flex-1 overflow-x-auto">
              <nav className="flex items-center gap-1 min-w-max pr-2">
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    {item.label}
                    {item.badge != null && item.badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                signOut({
                  callbackUrl: `/portal/socios/${slug}/login`,
                  redirect: true,
                })
              }
            >
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
