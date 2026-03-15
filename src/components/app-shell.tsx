"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { TenantContext } from "@/lib/tenant";
import { ChevronDown, Menu, X } from "lucide-react";

type NavItem = { href: string; label: string; permission?: string };

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

function NavContent({
  slug,
  pathname,
  groups,
  onLinkClick,
  variant,
}: {
  slug: string;
  pathname: string;
  groups: { label: string | null; items: NavItem[] }[];
  onLinkClick?: () => void;
  variant: "header" | "sidebar" | "drawer";
}) {
  const linkClass = variant === "sidebar" || variant === "drawer"
    ? (href: string) =>
        cn(
          "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
          pathname === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
    : (href: string) =>
        cn(
          "px-3 py-2 text-sm font-medium rounded-md transition-colors",
          pathname === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        );

  return (
    <>
      {groups.map((group) => {
        if (group.label === null) {
          const item = group.items[0];
          return (
            <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={onLinkClick}>
              {item.label}
            </Link>
          );
        }
        if (variant === "sidebar" || variant === "drawer") {
          return (
            <div key={group.label} className="space-y-1">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={onLinkClick}>
                  {item.label}
                </Link>
              ))}
            </div>
          );
        }
        if (group.items.length === 1) {
          const item = group.items[0];
          return (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
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
    </>
  );
}

export function AppShell({
  tenant,
  session,
  permissions,
  navigationLayout = "horizontal",
  children,
}: {
  tenant: TenantContext;
  session: unknown;
  permissions: Set<string> | null;
  /** "vertical" = sidebar; "horizontal" = header. Desde branding del tenant. */
  navigationLayout?: "horizontal" | "vertical";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const ctx = (session as { context?: string } | null)?.context;
  const isPlatformViewer = ctx === "platform";
  const allowed = (key: string | undefined) => key == null || permissions === null || permissions.has(key);

  const groups = buildNavGroups(tenant.slug)
    .map((g) => ({ ...g, items: g.items.filter((item) => allowed(item.permission)) }))
    .filter((g) => g.items.length > 0);

  const logoBlock = (
    <span className="flex items-center gap-2 font-semibold text-foreground truncate max-w-[180px] sm:max-w-none">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
        {tenant.name.slice(0, 2).toUpperCase()}
      </span>
      <span className="hidden sm:inline">{tenant.name}</span>
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isPlatformViewer && (
        <div className="bg-primary/15 text-primary border-b border-primary/20 px-4 py-1.5 text-center text-sm">
          Vista superadmin · <Link href="/platform" className="font-medium underline underline-offset-2">Volver a Platform</Link>
        </div>
      )}

      {/* Mobile: header con menú hamburguesa */}
      <header className="sticky top-0 z-30 flex md:hidden h-14 items-center justify-between border-b bg-card/95 backdrop-blur px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
        {logoBlock}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {isPlatformViewer ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/platform">Platform</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: `/app/${tenant.slug}/login` })}>
              Salir
            </Button>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent
          showClose={false}
          className="fixed left-0 top-0 h-full w-72 max-w-[85vw] rounded-none border-r p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
        >
          <DialogTitle className="sr-only">Menú de navegación</DialogTitle>
          <div className="flex flex-col gap-4 pt-6 pb-4">
            <div className="px-4 flex items-center justify-between">
              {logoBlock}
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1 px-3">
              <NavContent
                slug={tenant.slug}
                pathname={pathname}
                groups={groups}
                onLinkClick={() => setMobileMenuOpen(false)}
                variant="drawer"
              />
            </nav>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1">
        {/* Desktop vertical: sidebar */}
        {navigationLayout === "vertical" && (
          <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:border-r md:bg-card/50 z-20">
            <div className="flex flex-col gap-2 px-3 py-4 overflow-y-auto flex-1">
              <NavContent slug={tenant.slug} pathname={pathname} groups={groups} variant="sidebar" />
            </div>
            <div className="border-t p-3 flex items-center justify-between gap-2">
              <ThemeToggle />
              {isPlatformViewer ? (
                <Button variant="ghost" size="sm" asChild className="flex-1 justify-center">
                  <Link href="/platform">Platform</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={() => signOut({ callbackUrl: `/app/${tenant.slug}/login` })}>
                  Salir
                </Button>
              )}
            </div>
          </aside>
        )}

        {/* Desktop horizontal: header con nav */}
        {navigationLayout === "horizontal" && (
          <header className="hidden md:block sticky top-0 z-20 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
            <div className="container flex h-14 max-w-6xl mx-auto items-center justify-between px-4">
              <div className="flex items-center gap-6">
                {logoBlock}
                <nav className="flex items-center gap-1">
                  <NavContent slug={tenant.slug} pathname={pathname} groups={groups} variant="header" />
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {isPlatformViewer ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/platform">Volver a Platform</Link>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: `/app/${tenant.slug}/login` })}>
                    Salir
                  </Button>
                )}
              </div>
            </div>
          </header>
        )}

        <main
          className={cn(
            "flex-1 min-w-0 container max-w-6xl mx-auto px-4 py-6",
            navigationLayout === "vertical" && "md:pl-56"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
