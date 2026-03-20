"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { TenantContext } from "@/lib/tenant";
import {
  Home,
  Receipt,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const navItems = (slug: string): NavItem[] => [
  { href: `/portal/socios/${slug}`, label: "Inicio", icon: Home },
  { href: `/portal/socios/${slug}/movements`, label: "Movimientos", icon: Receipt },
  { href: `/portal/socios/${slug}/tickets`, label: "Tickets", icon: MessageSquare },
  { href: `/portal/socios/${slug}/profile`, label: "Perfil", icon: User },
];

type Props = {
  tenant: TenantContext;
  logoUrl?: string | null;
  appName?: string | null;
  memberFirstName: string;
  children: React.ReactNode;
};

export function PortalAppShell({
  tenant,
  logoUrl,
  appName,
  memberFirstName,
  children,
}: Props) {
  const pathname = usePathname();
  const params = useParams();
  const slug = (params?.tenantSlug as string) ?? tenant.slug;
  const displayName = appName?.trim() || tenant.name;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 sm:pb-24">
      {/* Header minimalista */}
      <header className="sticky top-0 z-20 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-foreground truncate">
              {memberFirstName} 👋
            </p>
            <p className="text-sm text-muted-foreground truncate">{displayName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={displayName}
                className="h-9 w-9 object-contain rounded-lg border border-border"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm font-semibold">
                {tenant.name?.slice(0, 2).toUpperCase() ?? "CL"}
              </span>
            )}
            <button
              type="button"
              onClick={() =>
                signOut({
                  callbackUrl: `/portal/socios/${slug}/login`,
                  redirect: true,
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-4 py-5 max-w-xl mx-auto w-full">{children}</main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación principal"
      >
        <div className="flex items-center justify-around h-16 max-w-xl mx-auto">
          {navItems(slug).map((item) => {
            const isActive =
              item.href === pathname ||
              (item.href !== `/portal/socios/${slug}` &&
                pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-2 px-3 rounded-lg transition-colors",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
