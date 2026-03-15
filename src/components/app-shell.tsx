"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { TenantContext } from "@/lib/tenant";
import { ChevronDown } from "lucide-react";

type NavItem = { href: string; label: string; permission?: string };

/** Navegación agrupada: Admin ve todo; Cultivador solo Operaciones + Monitoreo + Control (sin Gestión del club). */
function buildNavGroups(slug: string): { label: string | null; items: NavItem[] }[] {
  return [
    { label: null, items: [{ href: `/app/${slug}`, label: "Dashboard" }] },
    {
      label: "Operaciones",
      items: [
        { href: `/app/${slug}/locations`, label: "Ubicaciones", permission: "inventory.read" },
        { href: `/app/${slug}/lots`, label: "Lotes", permission: "lots.read" },
        { href: `/app/${slug}/inventory`, label: "Inventario", permission: "inventory.read" },
      ],
    },
    {
      label: "Monitoreo",
      items: [{ href: `/app/${slug}/devices`, label: "Dispositivos", permission: "devices.read" }],
    },
    {
      label: "Gestión del club",
      items: [
        { href: `/app/${slug}/users`, label: "Usuarios", permission: "users.read" },
        { href: `/app/${slug}/members`, label: "Socios", permission: "members.read" },
      ],
    },
    {
      label: "Control",
      items: [
        { href: `/app/${slug}/tickets`, label: "Tickets", permission: "tickets.read" },
        { href: `/app/${slug}/reports`, label: "Reportes", permission: "reports.read" },
      ],
    },
  ];
}

export function AppShell({
  tenant,
  session,
  permissions,
  children,
}: {
  tenant: TenantContext;
  session: unknown;
  /** Permisos del usuario (keys). Si null = platform, mostrar todo. */
  permissions: Set<string> | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const ctx = (session as { context?: string } | null)?.context;
  const isPlatformViewer = ctx === "platform";
  const allowed = (key: string | undefined) => key == null || permissions === null || permissions.has(key);

  const groups = buildNavGroups(tenant.slug)
    .map((g) => ({ ...g, items: g.items.filter((item) => allowed(item.permission)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isPlatformViewer && (
        <div className="bg-primary/15 text-primary border-b border-primary/20 px-4 py-1.5 text-center text-sm">
          Vista superadmin · <Link href="/platform" className="font-medium underline underline-offset-2">Volver a Platform</Link>
        </div>
      )}
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
              {groups.map((group) => {
                if (group.label === null) {
                  const item = group.items[0];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                }
                if (group.items.length === 1) {
                  const item = group.items[0];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                }
                const activeInGroup = group.items.some((item) => pathname === item.href);
                return (
                  <DropdownMenu key={group.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "gap-1 text-sm font-medium",
                          activeInGroup ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {group.label}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[180px]">
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className={cn(pathname === item.href && "bg-accent")}>
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </nav>
          </div>
          <ThemeToggle className="shrink-0" />
          {isPlatformViewer ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/platform">Volver a Platform</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: `/app/${tenant.slug}/login` })}
            >
              Salir
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
