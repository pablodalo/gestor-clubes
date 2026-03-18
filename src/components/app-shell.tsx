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
import { ProfileForm } from "@/features/profile/profile-form";
import { getTranslations } from "@/lib/i18n";
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
  CreditCard,
  ShoppingBag,
  Wallet,
  ShieldCheck,
  Building2,
  Boxes,
  ClipboardList,
  Leaf,
  Sprout,
  Ticket,
  User,
  UserCircle,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

type NavItem = { href: string; label: string; permission?: string; icon: LucideIcon };

function buildNavGroups(
  slug: string,
  locale: string | undefined,
  opts?: { isPlatformViewer?: boolean }
): { label: string | null; items: NavItem[] }[] {
  const t = getTranslations(locale);
  const isPlatformViewer = !!opts?.isPlatformViewer;
  return [
    { label: null, items: [{ href: `/app/${slug}`, label: t.dashboard, icon: LayoutDashboard }] },
    {
      label: "Cultivo",
      items: [
        { href: `/app/${slug}/supplies`, label: "Suministros", permission: "supplies.read", icon: Boxes },
        { href: `/app/${slug}/devices`, label: "Dispositivos", permission: "devices.read", icon: Cpu },
        { href: `/app/${slug}/locations`, label: "Ubicación", permission: "inventory.read", icon: MapPin },
        { href: `/app/${slug}/lots`, label: "Lote", permission: "lots.read", icon: Layers },
        { href: `/app/${slug}/inventory`, label: "Producto", permission: "inventory.read", icon: Package },
      ],
    },
    {
      label: "Gestion",
      items: [
        {
          href: `/app/${slug}/compliance`,
          label: "Médica (próximamente)",
          permission: "compliance.read",
          icon: ShieldCheck,
        },
        { href: `/app/${slug}/suppliers`, label: t.suppliers, permission: "suppliers.read", icon: Building2 },
        { href: `/app/${slug}/members`, label: t.members, permission: "members.read", icon: UserCircle },
        { href: `/app/${slug}/memberships`, label: "Membresías", permission: "members.read", icon: CreditCard },
        { href: `/app/${slug}/dispensations`, label: t.dispensations, permission: "dispensations.read", icon: Package },
        { href: `/app/${slug}/revenue`, label: t.revenue, permission: "revenue.read", icon: Wallet },
        { href: `/app/${slug}/reports`, label: t.reports, permission: "reports.read", icon: BarChart2 },
      ],
    },
    ...(isPlatformViewer
      ? [
          {
            label: "Administración Plataforma",
            items: [
              { href: "/platform/users", label: t.users, icon: Users },
              { href: "/platform/audit", label: "Reportes", icon: BarChart2 },
              { href: `/app/${slug}/tickets`, label: t.tickets, permission: "tickets.read", icon: Ticket },
            ],
          },
        ]
      : []),
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
  onOpenProfile,
  locale,
}: {
  tenantSlug: string;
  isPlatformViewer: boolean;
  userName: string;
  onOpenProfile?: () => void;
  locale?: string;
}) {
  const t = getTranslations(locale);
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
            {onOpenProfile ? (
              <DropdownMenuItem onClick={onOpenProfile} className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4 shrink-0" />
                {t.myProfile}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link href={`/app/${tenantSlug}/profile`} className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0" />
                  {t.myProfile}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        {isPlatformViewer && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/platform" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                {t.backToPlatform}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: `/app/${tenantSlug}/login` })}>
          {t.signOut}
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
  logoUrl,
  appName,
  health,
  children,
}: {
  tenant: TenantContext;
  session: unknown;
  permissions: Set<string> | null;
  /** "vertical" = sidebar; "horizontal" = header. Desde branding del tenant. */
  navigationLayout?: "horizontal" | "vertical";
  /** Logo del tenant (branding). Si no hay, se muestran iniciales + nombre. */
  logoUrl?: string | null;
  /** Nombre de la app (branding). Fallback a tenant.name */
  appName?: string | null;
  health?:
    | {
        ok: boolean;
        env: Record<string, string>;
        database: { ok: boolean; message?: string; tenantsCount?: number };
        hint?: string | undefined;
      }
    | undefined;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const ctx = (session as { context?: string } | null)?.context;
  const isPlatformViewer = ctx === "platform";
  const userName = (session as { user?: { name?: string | null } } | null)?.user?.name ?? "";
  const userEmail = (session as { user?: { email?: string | null } } | null)?.user?.email ?? "";
  const allowed = (key: string | undefined) => key == null || permissions === null || permissions.has(key);
  const openProfile = () => setProfileDialogOpen(true);
  const t = getTranslations(tenant.locale);

  const groups = buildNavGroups(tenant.slug, tenant.locale, { isPlatformViewer })
    .map((g) => ({ ...g, items: g.items.filter((item) => allowed(item.permission)) }))
    .filter((g) => g.items.length > 0);

  const displayName = appName?.trim() || tenant.name;
  const logoBlock = (
    <span className="flex items-center gap-2.5 font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={displayName}
          className="h-10 w-10 shrink-0 object-contain rounded-lg border border-border bg-card shadow-sm ring-1 ring-black/5"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          {tenant.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="hidden sm:inline truncate">{displayName}</span>
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isPlatformViewer && (
        <div className="bg-primary/15 text-primary border-b border-primary/20 px-4 py-1.5 text-center text-sm">
          Vista superadmin · <Link href="/platform" className="font-medium underline underline-offset-2">Volver a Platform</Link>
        </div>
      )}

      {isPlatformViewer && health && (
        <div
          className={[
            "px-4 py-2 text-sm border-b",
            health.ok ? "bg-green-500/10 border-green-500/20 text-green-700" : "bg-destructive/10 border-destructive/20 text-destructive",
          ].join(" ")}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-2">
              {health.ok ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="font-medium">
                  {health.ok ? "Health OK" : "Health con problemas"}
                </span>
                <span className="text-muted-foreground ml-2">
                  {health.database?.message ?? ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!health.ok && health.hint && <span className="text-xs text-muted-foreground">{health.hint}</span>}
              {!health.ok && (
                <Link href="/platform/errors" className="text-xs font-medium underline underline-offset-2 hover:no-underline">
                  Ver errores
                </Link>
              )}
            </div>
          </div>
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
          <UserMenu tenantSlug={tenant.slug} isPlatformViewer={isPlatformViewer} userName={userName} onOpenProfile={openProfile} locale={tenant.locale} />
        </div>
      </header>

      {/* Diálogo Mi perfil (form para editar perfil) */}
      {!isPlatformViewer && (
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="max-w-md" showClose={true}>
            <DialogTitle className="sr-only">Mi perfil</DialogTitle>
            <ProfileForm
              initialName={userName}
              initialEmail={userEmail}
              onSuccess={() => setProfileDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

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
                <button
                  type="button"
                  className="text-sm text-primary hover:underline mt-1 inline-block text-left"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setProfileDialogOpen(true);
                  }}
                >
                  Mi perfil
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className={cn("flex flex-1 min-w-0", navigationLayout === "horizontal" && "flex-col")}>
        {/* Desktop vertical: sidebar */}
        {navigationLayout === "vertical" && (
          <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:border-r md:bg-card/50 z-20 tdc-sidebar">
            <div className="shrink-0 px-3 py-3 border-b border-border/80">
              <Link href={`/app/${tenant.slug}`} className="flex items-center gap-2.5 font-semibold text-foreground min-w-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={displayName}
                    className="h-10 w-10 shrink-0 object-contain rounded-lg border border-border bg-card shadow-sm ring-1 ring-black/5"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                    {tenant.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="truncate">{displayName}</span>
              </Link>
            </div>
            <div className="flex flex-col gap-2 px-3 py-4 overflow-y-auto flex-1 min-h-0">
              <NavContent slug={tenant.slug} pathname={pathname} groups={groups} variant="sidebar" />
            </div>
            <div className="border-t p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserMenu tenantSlug={tenant.slug} isPlatformViewer={isPlatformViewer} userName={userName} onOpenProfile={openProfile} locale={tenant.locale} />
              </div>
            </div>
          </aside>
        )}

        {/* Desktop horizontal: header con submenús (Dashboard + Operaciones, Monitoreo, etc. con dropdowns) */}
        {navigationLayout === "horizontal" && (
          <header className="hidden md:flex sticky top-0 z-20 w-full shrink-0 min-h-12 flex-wrap items-center gap-2 py-2 px-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
            <Link href={`/app/${tenant.slug}`} className="shrink-0 flex items-center gap-2.5 font-semibold text-foreground min-w-0 max-w-[180px] sm:max-w-[220px]">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="h-10 w-10 shrink-0 object-contain rounded-lg border border-border bg-card shadow-sm ring-1 ring-black/5"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  {tenant.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="truncate hidden sm:inline">{displayName}</span>
            </Link>
            <nav className="flex items-center gap-0.5 flex-1 min-w-0 flex-wrap" aria-label="Navegación principal">
              <NavContent slug={tenant.slug} pathname={pathname} groups={groups} variant="header" />
            </nav>
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <UserMenu tenantSlug={tenant.slug} isPlatformViewer={isPlatformViewer} userName={userName} onOpenProfile={openProfile} locale={tenant.locale} />
            </div>
          </header>
        )}

        <main
          className={cn(
            "flex-1 min-w-0 min-h-0 overflow-y-auto container max-w-6xl mx-auto px-4 py-6",
            navigationLayout === "vertical" && "md:pl-56"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
