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
  DropdownMenuSeparator,
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
import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  ChevronDown,
  Cpu,
  LayoutDashboard,
  Layers,
  MapPin,
  Menu,
  Package,
  Ticket,
  User,
  UserCircle,
  Users,
  X,
} from "lucide-react";

type NavItem = { href: string; label: string; permission?: string; icon: LucideIcon };

function buildNavGroups(slug: string): { label: string | null; items: NavItem[] }[] {
  return [
    { label: null, items: [{ href: `/app/${slug}`, label: "Dashboard", icon: LayoutDashboard }] },
    {
      label: "Operaciones",
      items: [
        { href: `/app/${slug}/locations`, label: "Ubicaciones", permission: "inventory.read", icon: MapPin },
        { href: `/app/${slug}/lots`, label: "Lotes", permission: "lots.read", icon: Layers },
        { href: `/app/${slug}/inventory`, label: "Inventario", permission: "inventory.read", icon: Package },
      ],
    },
    {
      label: "Monitoreo",
      items: [{ href: `/app/${slug}/devices`, label: "Dispositivos", permission: "devices.read", icon: Cpu }],
    },
    {
      label: "Gestión del club",
      items: [
        { href: `/app/${slug}/users`, label: "Usuarios", permission: "users.read", icon: Users },
        { href: `/app/${slug}/members`, label: "Socios", permission: "members.read", icon: UserCircle },
      ],
    },
    {
      label: "Control",
      items: [
        { href: `/app/${slug}/tickets`, label: "Tickets", permission: "tickets.read", icon: Ticket },
        { href: `/app/${slug}/reports`, label: "Reportes", permission: "reports.read", icon: BarChart2 },
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
          "px-2 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
          pathname === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        );

  const IconWrap = ({ item, children }: { item: NavItem; children: React.ReactNode }) => {
    const Icon = item.icon;
    return (
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        {children}
      </span>
    );
  };

  return (
    <>
      {groups.map((group) => {
        if (group.label === null) {
          const item = group.items[0];
          return (
            <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={onLinkClick}>
              <IconWrap item={item}>{item.label}</IconWrap>
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
                  <IconWrap item={item}>{item.label}</IconWrap>
                </Link>
              ))}
            </div>
          );
        }
        if (group.items.length === 1) {
          const item = group.items[0];
          return (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              <IconWrap item={item}>{item.label}</IconWrap>
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
                  "gap-1.5 text-sm font-medium",
                  activeInGroup ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {group.label}
                <ChevronDown className="h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className={cn("flex items-center gap-2", pathname === item.href && "bg-accent")}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </>
  );
}

function UserMenu({
  tenantSlug,
  isPlatformViewer,
  userName,
}: {
  tenantSlug: string;
  isPlatformViewer: boolean;
  userName: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground max-w-[180px]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="truncate hidden sm:inline">{userName || "Usuario"}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!isPlatformViewer && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/app/${tenantSlug}/profile`} className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {isPlatformViewer && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/platform" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Volver a Platform
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: `/app/${tenantSlug}/login` })}>
          Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const userName = (session as { user?: { name?: string | null } } | null)?.user?.name ?? "";
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
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <UserMenu tenantSlug={tenant.slug} isPlatformViewer={isPlatformViewer} userName={userName} />
        </div>
      </header>

      {/* Mobile drawer */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent
          showClose={false}
          className="fixed left-0 top-0 h-full w-72 max-w-[85vw] rounded-none border-r p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
        >
          <DialogTitle className="sr-only">Menú de navegación</DialogTitle>
          <div className="flex flex-col h-full pt-6 pb-4">
            <div className="px-4 flex items-center justify-between shrink-0">
              {logoBlock}
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto min-h-0">
              <NavContent
                slug={tenant.slug}
                pathname={pathname}
                groups={groups}
                onLinkClick={() => setMobileMenuOpen(false)}
                variant="drawer"
              />
            </nav>
            {!isPlatformViewer && (
              <div className="border-t px-4 py-3 mt-auto">
                <p className="text-xs text-muted-foreground">Logueado como</p>
                <p className="font-medium truncate">{userName || "Usuario"}</p>
                <Link
                  href={`/app/${tenant.slug}/profile`}
                  className="text-sm text-primary hover:underline mt-1 inline-block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi perfil
                </Link>
              </div>
            )}
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
            <div className="border-t p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserMenu tenantSlug={tenant.slug} isPlatformViewer={isPlatformViewer} userName={userName} />
              </div>
            </div>
          </aside>
        )}

        {/* Desktop horizontal: header con nav (nav con overflow interno para evitar scroll de página) */}
        {navigationLayout === "horizontal" && (
          <header className="hidden md:block sticky top-0 z-20 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm overflow-hidden">
            <div className="flex h-14 w-full items-center gap-2 px-4 min-w-0">
              <Link href={`/app/${tenant.slug}`} className="shrink-0 flex items-center gap-2 font-semibold text-foreground min-w-0 max-w-[140px] sm:max-w-[200px]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
                  {tenant.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate hidden sm:inline">{tenant.name}</span>
              </Link>
              <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto py-1 overflow-y-hidden" aria-label="Navegación principal">
                <div className="flex items-center gap-0.5 flex-nowrap">
                  <NavContent slug={tenant.slug} pathname={pathname} groups={groups} variant="header" />
                </div>
              </nav>
              <div className="flex items-center gap-1 shrink-0 pl-2">
                <ThemeToggle />
                <UserMenu tenantSlug={tenant.slug} isPlatformViewer={isPlatformViewer} userName={userName} />
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
